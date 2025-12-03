from airflow import DAG
from airflow.decorators import task
from airflow.utils.dates import days_ago
from google.cloud import bigquery, storage
import os

PROJECT_ID = "sales-data-pipeline-480101"
BUCKET_NAME = "sales-data-pipeline-bucket"
LANDING_FOLDER = "landing/"
ARCHIVE_FOLDER = "archive/"
DATASET = "sales_raw"
TABLE = "raw_sales"

with DAG(
    dag_id="retail_sales_scheduled_ingestion",
    start_date=days_ago(1),
    schedule_interval="*/5 * * * *",  # run every 5 minutes
    catchup=False,
    max_active_runs=1,
    tags=["gcs", "bigquery", "scheduled"],
) as dag:

    @task
    def list_files():
        """List all CSV files in the landing folder"""
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(BUCKET_NAME)
        blobs = bucket.list_blobs(prefix=LANDING_FOLDER)
        files = [blob.name for blob in blobs if blob.name.endswith(".csv")]
        return files

    @task
    def load_file_to_bq(filename: str):
        """Load a single CSV file into BigQuery"""
        client = bigquery.Client(project=PROJECT_ID)
        table_id = f"{PROJECT_ID}.{DATASET}.{TABLE}"

        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.CSV,
            skip_leading_rows=1,
            autodetect=True,
            write_disposition="WRITE_APPEND",
        )

        uri = f"gs://{BUCKET_NAME}/{filename}"
        load_job = client.load_table_from_uri(uri, table_id, job_config=job_config)
        load_job.result()
        print(f"Loaded {filename} into BigQuery table {table_id}")

    @task
    def move_to_archive(filename: str):
        """Move processed file to archive folder"""
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(BUCKET_NAME)
        source_blob = bucket.blob(filename)
        destination_blob_name = filename.replace(LANDING_FOLDER, ARCHIVE_FOLDER, 1)
        bucket.rename_blob(source_blob, destination_blob_name)
        print(f"Moved {filename} to {destination_blob_name}")

    # DAG Flow
    files = list_files()
    for f in files:
        bq = load_file_to_bq(f)
        move_to_archive(f)
        bq >> move_to_archive(f)
