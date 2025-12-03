from airflow import DAG
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.providers.google.cloud.operators.pubsub import PubSubPullSensor
from airflow.providers.google.cloud.sensors.gcs import GCSObjectExistenceSensor
from airflow.utils.dates import days_ago
import json

PROJECT_ID = "sales-data-pipeline-480101"
BUCKET_NAME = "sales-data-pipeline-bucket"
DATASET = "sales_raw"
TABLE = "raw_sales"
PUBSUB_TOPIC = "gcs-file-events"
PUBSUB_SUBSCRIPTION = "sales-data-pipeline-subscription"

default_args = {
    "start_date": days_ago(1),
}

with DAG(
    dag_id="retail_sales_gcs_to_bigquery",
    default_args=default_args,
    schedule_interval=None,   # Triggered ONLY by Pub/Sub
    catchup=False,
) as dag:

    # Step 1: Wait for Pub/Sub message published when file uploaded
    wait_for_pubsub = PubSubPullSensor(
        task_id="wait_for_pubsub",
        project_id=PROJECT_ID,
        subscription=PUBSUB_SUBSCRIPTION,
        max_messages=1,
        ack_messages=True
    )

    # Step 2: Extract filename from Pub/Sub message
    def extract_filename(**context):
        message = context["ti"].xcom_pull(task_ids="wait_for_pubsub")[0]
        data = json.loads(message["message"]["data"])
        return data["name"]

    # Step 3: Load CSV into BigQuery
    load_to_bq = BigQueryInsertJobOperator(
        task_id="load_to_bq",
        configuration={
            "load": {
                "sourceUris": [f"gs://{BUCKET_NAME}/*"],
                "destinationTable": {
                    "projectId": PROJECT_ID,
                    "datasetId": DATASET,
                    "tableId": TABLE,
                },
                "sourceFormat": "CSV",
                "skipLeadingRows": 1,
                "writeDisposition": "WRITE_APPEND",
                "autodetect": True,
            }
        },
    )

    wait_for_pubsub >> load_to_bq
