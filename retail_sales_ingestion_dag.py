from __future__ import annotations

from airflow import DAG
from airflow.decorators import task
from airflow.utils.dates import days_ago
# Note: You must ensure 'google-cloud-bigquery' and 'google-cloud-storage' 
# libraries are installed in your Airflow environment for these imports to work.
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
    # schedule_interval uses cron syntax: run every 5 minutes (e.g., 00:05, 00:10, etc.)
    schedule_interval="*/5 * * * *", 
    catchup=False,
    max_active_runs=1,
    tags=["gcs", "bigquery", "scheduled"],
) as dag:

    @task
    def list_files():
        """
        Lists all CSV files in the landing folder and returns the list of file paths.
        This list will be pushed to XCom for dynamic mapping.
        """
        # Note: This client automatically uses the Airflow connection/service account
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(BUCKET_NAME)
        # Add a trailing slash to prefix to only list files *inside* the folder
        blobs = bucket.list_blobs(prefix=LANDING_FOLDER) 
        
        # Filter for non-zero size CSV files (to exclude the folder itself)
        files = [
            blob.name for blob in blobs 
            if blob.name.endswith(".csv") and blob.size > 0
        ]
        
        # Log if no files are found (optional, but helpful for debugging)
        if not files:
            print("No new CSV files found in the landing folder.")
        
        return files

    @task
    def load_file_to_bq(filename: str):
        """
        Loads a single CSV file specified by the mapped 'filename' into BigQuery.
        """
        client = bigquery.Client(project=PROJECT_ID)
        table_id = f"{PROJECT_ID}.{DATASET}.{TABLE}"

        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.CSV,
            skip_leading_rows=1,
            autodetect=True,
            write_disposition="WRITE_APPEND",
            # FIX: Use Character Map V2 to automatically handle invalid column names 
            # like 'fuel.sys' by replacing '.' with '_'
            field_name_character_map="V2",
        )

        uri = f"gs://{BUCKET_NAME}/{filename}"
        load_job = client.load_table_from_uri(uri, table_id, job_config=job_config)
        load_job.result()
        print(f"Loaded {filename} into BigQuery table {table_id}")
        return filename  # Return the filename for the next task to use

    @task
    def move_to_archive(filename: str):
        """
        Moves the processed file (specified by the mapped 'filename') to the archive folder.
        """
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(BUCKET_NAME)
        source_blob = bucket.blob(filename)
        destination_blob_name = filename.replace(LANDING_FOLDER, ARCHIVE_FOLDER, 1)
        
        # Copy the file and then delete the source
        new_blob = bucket.copy_blob(source_blob, bucket, destination_blob_name)
        source_blob.delete()
        
        print(f"Archived {filename} to {new_blob.name}")

    # -------------------------
    # DAG Flow with Task Mapping
    # -------------------------
    # 1. Get the XComArg representing the list of files
    files_to_process = list_files() 

    # 2. Dynamically map the load_file_to_bq task based on the list of files
    loaded_files = load_file_to_bq.expand(filename=files_to_process)

    # 3. Dynamically map the move_to_archive task based on the output of the load task
    # This automatically creates a dependency chain (load_file_to_bq[i] >> move_to_archive[i])
    move_to_archive.expand(filename=loaded_files)
