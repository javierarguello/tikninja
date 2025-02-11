#!/bin/bash

# Exit on error
set -e

# Get current project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "No project ID configured. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
    exit 1
fi

echo "Setting up service account for project: $PROJECT_ID"

SERVICE_ACCOUNT_NAME="tikninja-app-dev-sa"
SERVICE_ACCOUNT_DESC="Service account for TikNinja Dev Cloud Run service"
DISPLAY_NAME="Cloud Run Service Account"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# 1. Create the Cloud Run service account.
gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
  --project=${PROJECT_ID} \
  --display-name "${DISPLAY_NAME}"

# 2. Grant Firestore/Datastore access.
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/datastore.user"

# 3. Grant Pub/Sub access.
# Grant publishing rights.
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/pubsub.publisher"

# If your service also needs to subscribe to Pub/Sub messages, uncomment the following:
# gcloud projects add-iam-policy-binding ${PROJECT_ID} \
#   --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
#   --role "roles/pubsub.subscriber"

# 4. Grant Cloud Functions invocation permission.
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/cloudfunctions.invoker"

# 5. Grant read/write access to Cloud Storage buckets.
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/storage.objectAdmin"

echo "Service account ${SERVICE_ACCOUNT_EMAIL} created and configured with the required roles."
