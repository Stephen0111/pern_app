from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
from airflow.models import Variable

from google.cloud import storage, bigquery

import pandas as pd
from io import StringIO

# -----------------------------
# CONFIG
# -----------------------------
PROJECT_ID = "sales-data-pipeline-480101"
BUCKET_NAME = "sales-data-pipeline-bucket"
DATASET = "sales_raw"
TABLE = "raw_sales"

RAW_FILE_PATH = "raw/autos.csv"
CLEANED_FILE_PATH = "processed/autos_cleaned.csv"


# ----------------------------------
# 1. Clean column names function
# ----------------------------------
def clean_column_names(df):
    """
    Converts column names by:
    - replacing all dots/symbols with underscores
    - lowering all case
    - ensuring compatibility with BigQuery naming rules
    """
    df.columns = (
        df.columns
        .str.replace(r"[^0-9a-zA-Z_]+", "_", regex=True)
        .str.lower()
    )
    return df


# ----------------------------------
# 2. Task: Download CSV, clean it, re-upload
# ----------------------------------
def upload_cleaned_csv(**context):
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(RAW_FILE_PATH)

    # Read CSV into Pandas
    csv_data = blob.download_as_text()
    df = pd.read_csv(StringIO(csv_data))

    # Clean column names
    df = clean_column_names(df)

    # Save cleaned CSV into memory
    cleaned_csv_data = df.to_csv(index=False)

    # Upload cleaned file to GCS
    cleaned_blob = bucket.blob(CLEANED_FILE_PATH)
    cleaned_blob.upload_from_string(cleaned_csv_data, content_type="text/csv")

    return CLEANED_FILE_PATH


# ----------------------------------
# 3. Task: Load cleaned file into BigQuery
# ----------------------------------
def load_file_to_bq(**context):
    client = bigquery.Client()

    cleaned_path = context["ti"].xcom_pull(task_ids="upload_cleaned_csv")
    uri = f"gs://{BUCKET_NAME}/{cleaned_path}"

    table_id = f"{PROJECT_ID}.{DATASET}.{TABLE}"

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.CSV,
        skip_leading_rows=1,
        autodetect=True,
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
    )

    load_job = client.load_table_from_uri(uri, table_id, job_config=job_config)
    load_job.result()  # Waits for job to complete


# ----------------------------------
# DAG DEFINITION
# ----------------------------------
with DAG(
    "retail_sales_scheduled_ingestion",
    start_date=days_ago(1),
    schedule_interval="@daily",
    catchup=False,
) as dag:

    upload_clean = PythonOperator(
        task_id="upload_cleaned_csv",
        python_callable=upload_cleaned_csv,
        provide_context=True,
    )

    load_to_bq = PythonOperator(
        task_id="load_file_to_bq",
        python_callable=load_file_to_bq,
        provide_context=True,
    )

    upload_clean >> load_to_bq
