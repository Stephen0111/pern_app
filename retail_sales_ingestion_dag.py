from __future__ import annotations

from airflow import DAG
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
# Corrected import for the Sensor: it lives in the 'sensors' module, not 'operators'
from airflow.providers.google.cloud.sensors.pubsub import PubSubPullSensor
from airflow.operators.python import PythonOperator # Added for the extract logic
from airflow.utils.dates import days_ago
import json
import base64 # Added for correct base64 decoding of Pub/Sub message data

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
    schedule_interval=None,    # Triggered ONLY by Pub/Sub
    catchup=False,
) as dag:

    # Step 1: Wait for Pub/Sub message published when file uploaded
    wait_for_pubsub = PubSubPullSensor(
        task_id="wait_for_pubsub",
        project_id=PROJECT_ID,
        subscription=PUBSUB_SUBSCRIPTION,
        max_messages=1,
        # Messages are acknowledged here to prevent re-processing
        ack_messages=True,
    )

    # Step 2: Extract filename from Pub/Sub message
    def extract_filename_from_xcom(ti):
        """
        Pulls the Pub/Sub message from XCom, decodes the GCS event payload, 
        and returns the GCS object name (filename).
        """
        # PubSubPullSensor pushes a list of messages. We expect one.
        messages = ti.xcom_pull(task_ids="wait_for_pubsub")
        
        if not messages:
            raise ValueError("No Pub/Sub message received from Sensor.")
            
        # The PubSubPullSensor returns a list of dicts. We access the first message's data.
        pubsub_message = messages[0]['message']
        encoded_data = pubsub_message.get('data')

        if not encoded_data:
            # Handle empty data (might occur if message only has attributes)
            raise ValueError("Pub/Sub message 'data' field is empty.")
            
        # Decode base64 data to a string, then parse the GCS event JSON payload
        decoded_data = base64.b64decode(encoded_data).decode('utf-8')
        gcs_event_payload = json.loads(decoded_data)
        
        # The GCS event payload contains the uploaded file's name
        filename = gcs_event_payload.get("name")
        
        if not filename:
             raise ValueError("GCS object name not found in Pub/Sub message payload.")
             
        # Return the filename. This return value is automatically pushed to XCom.
        return filename

    extract_filename_task = PythonOperator(
        task_id="extract_filename",
        python_callable=extract_filename_from_xcom,
    )

    # Step 3: Load CSV into BigQuery
    # The sourceUris is dynamically templated to pull the filename from XCom
    load_to_bq = BigQueryInsertJobOperator(
        task_id="load_to_bq",
        configuration={
            "load": {
                # Dynamically set the file URI using XCom pull result from the previous task
                "sourceUris": [
                    f"gs://{BUCKET_NAME}/{{{{ ti.xcom_pull(task_ids='extract_filename') }}}}"
                ],
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

    # Define task dependencies
    wait_for_pubsub >> extract_filename_task >> load_to_bq
