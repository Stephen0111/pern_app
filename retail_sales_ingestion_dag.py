from __future__ import annotations

import re
import tempfile

from airflow import DAG
from airflow.decorators import task
from airflow.utils.dates import days_ago

from google.cloud import bigquery, storage

PROJECT_ID = "sales-data-pipeline-480101"
BUCKET_NAME = "sales-data-pipeline-bucket"
LANDING_FOLDER = "landing/"
ARCHIVE_FOLDER = "archive/"
TEMP_FOLDER = "temp_cleaned/"
DATASET = "sales_raw"
TABLE = "raw_sales"


def clean_column_name(col):
    """Replaces invalid characters to make BigQuery-safe column names."""
    col = col.strip()
    col = re.sub(r"[^A-Za-z0-9_]", "_", col)
    if col[0].isdigit():
        col = "_" + col
    return col


with DAG(
    dag_id="retail_sales_scheduled_ingestion",
    start_date=days_ago(1),
    schedule_interval="*/5 * * * *",
    catchup=False,
    max_active_runs=1,
    tags=["gcs", "bigquery", "scheduled"],
) as dag:

    @task
    def list_files():
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)

        blobs = bucket.list_blobs(prefix=LANDING_FOLDER)
        files = [
            blob.name for blob in blobs
            if blob.name.endswith(".csv") and blob.size > 0
        ]
        return files

    @task
    def clean_and_load(filename: str):
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)

        # download CSV
        source_blob = bucket.blob(filename)
        raw_data = source_blob.download_as_text()

        # split lines
        lines = raw_data.splitlines()
        header = lines[0].split(",")

        # clean header column names
        cleaned_header = [clean_column_name(c) for c in header]
        cleaned_csv = ",".join(cleaned_header) + "\n" + "\n".join(lines[1:])

        # write to temp GCS path
        temp_blob_name = filename.replace(LANDING_FOLDER, TEMP_FOLDER)
        temp_blob = bucket.blob(temp_blob_name)
        temp_blob.upload_from_string(cleaned_csv, content_type="text/csv")

        # load cleaned file into BigQuery
        bq_client = bigquery.Client()
        table_id = f"{PROJECT_ID}.{DATASET}.{TABLE}"

        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.CSV,
            skip_leading_rows=1,
            autodetect=True,
            write_disposition="WRITE_APPEND",
        )

        uri = f"gs://{BUCKET_NAME}/{temp_blob_name}"
        load_job = bq_client.load_table_from_uri(uri, table_id, job_config=job_config)
        load_job.result()

        print(f"Loaded cleaned file: {temp_blob_name}")

        # delete temp file
        temp_blob.delete()

        return filename

    @task
    def move_to_archive(filename: str):
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)

        source_blob = bucket.blob(filename)
        dest_name = filename.replace(LANDING_FOLDER, ARCHIVE_FOLDER, 1)

        bucket.copy_blob(source_blob, bucket, dest_name)
        source_blob.delete()

        print(f"Archived {filename} to {dest_name}")

    # DAG structure
    files_to_process = list_files()
    loaded = clean_and_load.expand(filename=files_to_process)
    move_to_archive.expand(filename=loaded)
