from airflow import DAG
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.decorators import task
from airflow.utils.dates import days_ago
import json
import base64

PROJECT_ID = "sales-data-pipeline-480101"
BUCKET_NAME = "sales-data-pipeline-bucket"
DATASET = "sales_raw"
TABLE = "raw_sales"
SUBSCRIPTION = "sales-data-pipeline-subscription"

with DAG(
    dag_id="retail_sales_gcs_to_bigquery_event",
    schedule_interval=None,  # Event-driven
    start_date=days_ago(1),
    catchup=False,
) as dag:

    @task
    def process_pubsub_message(message: dict):
        # Decode Pub/Sub message
        encoded_data = message.get("message", {}).get("data")
        if not encoded_data:
            raise ValueError("No data in Pub/Sub message")
        decoded = base64.b64decode(encoded_data).decode("utf-8")
        payload = json.loads(decoded)
        filename = payload.get("name")
        if not filename:
            raise ValueError("No filename in payload")
        return filename

    @task
    def load_to_bigquery(filename: str):
        from google.cloud import bigquery

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
        print(f"Loaded {filename} to BigQuery")

    # Airflow automatically passes the Pub/Sub message to the DAG run
    filename = process_pubsub_message.expand(message="{{ dag_run.conf }}")
    load_to_bigquery(filename)
