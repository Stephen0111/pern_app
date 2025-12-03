from airflow import DAG
from airflow.decorators import task
from airflow.utils.dates import days_ago
import json
import base64
from google.cloud import bigquery

# ----------------------------
# CONFIGURATION
# ----------------------------
PROJECT_ID = "sales-data-pipeline-480101"
BUCKET_NAME = "sales-data-pipeline-bucket"
DATASET = "sales_raw"
TABLE = "raw_sales"

# ----------------------------
# DAG DEFINITION
# ----------------------------
with DAG(
    dag_id="retail_sales_event_driven",
    start_date=days_ago(1),
    schedule_interval=None,  # Event-driven
    catchup=False,
    max_active_runs=1,
    tags=["gcs", "bigquery", "event-driven"],
) as dag:

    # ----------------------------
    # Task 1: Extract filename from Pub/Sub message
    # ----------------------------
    @task
    def extract_filename(pubsub_message: dict):
        """
        Decodes the Pub/Sub message and extracts the GCS filename
        """
        encoded_data = pubsub_message.get("message", {}).get("data")
        if not encoded_data:
            raise ValueError("No data found in Pub/Sub message")

        decoded_data = base64.b64decode(encoded_data).decode("utf-8")
        payload = json.loads(decoded_data)
        filename = payload.get("name")
        if not filename:
            raise ValueError("No filename found in Pub/Sub message payload")
        return filename

    # ----------------------------
    # Task 2: Load CSV into BigQuery
    # ----------------------------
    @task
    def load_to_bigquery(filename: str):
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
        load_job.result()  # Wait for job to complete
        print(f"Loaded {filename} into BigQuery table {table_id}")

    # ----------------------------
    # TASK DEPENDENCY
    # ----------------------------
    filename = extract_filename.expand(pubsub_message="{{ dag_run.conf }}")
    load_to_bigquery(filename)
