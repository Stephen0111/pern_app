from __future__ import annotations

from airflow import DAG
from airflow.decorators import task
from airflow.utils.dates import days_ago

from google.cloud import bigquery, storage

PROJECT_ID = "sales-data-pipeline-480101"
BUCKET_NAME = "sales-data-pipeline-bucket"
LANDING_FOLDER = "landing/"
ARCHIVE_FOLDER = "archive/"
DATASET = "sales_raw"
TABLE = "raw_sales"

with DAG(
    dag_id="retail_sales_scheduled_ingestion",
    start_date=days_ago(1),
    schedule_interval="*/5 * * * *",  # every 5 minutes
    catchup=False,
    max_active_runs=1,
    tags=["gcs", "bigquery", "scheduled"],
) as dag:

    @task
    def list_files():
        """
        List CSV files in landing folder.
        """
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(BUCKET_NAME)

        blobs = bucket.list_blobs(prefix=LANDING_FOLDER)

        files = [
            blob.name for blob in blobs
            if blob.name.endswith(".csv") and blob.size > 0
        ]

        if not files:
            print("No new CSV files found in landing folder.")

        return files

    @task
    def load_file_to_bq(filename: str):
        """
        Loads a single CSV file into BigQuery using Character Map V2
        to automatically fix invalid column names (e.g. fuel.sys → fuel_sys).
        """
        client = bigquery.Client(project=PROJECT_ID)
        table_id = f"{PROJECT_ID}.{DATASET}.{TABLE}"

        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.CSV,
            skip_leading_rows=1,
            autodetect=True,
            write_disposition="WRITE_APPEND",
            field_name_character_map="CHARACTER_MAP_V2",  # <-- FIXED
        )

        uri = f"gs://{BUCKET_NAME}/{filename}"

        load_job = client.load_table_from_uri(
            uri,
            table_id,
            job_config=job_config
        )

        load_job.result()  # Wait for job to finish

        print(f"Loaded {filename} into BigQuery table {table_id}")
        return filename

    @task
    def move_to_archive(filename: str):
        """
        Moves processed file from landing → archive.
        """
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(BUCKET_NAME)

        source_blob = bucket.blob(filename)
        destination_blob = filename.replace(LANDING_FOLDER, ARCHIVE_FOLDER, 1)

        # Copy then delete
        bucket.copy_blob(source_blob, bucket, destination_blob)
        source_blob.delete()

        print(f"Archived {filename} → {destination_blob}")

    # -------------------------
    # DAG Flow (Task Mapping)
    # -------------------------

    files_to_process = list_files()
    loaded_files = load_file_to_bq.expand(filename=files_to_process)
    move_to_archive.expand(filename=loaded_files)
