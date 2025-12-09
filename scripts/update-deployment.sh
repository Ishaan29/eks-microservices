#!/bin/bash

# Script to update Kubernetes deployment YAML files with new image versions
# Usage: ./update-deployment.sh <service-name> <new-image-tag>

set -e

SERVICE_NAME=$1
NEW_IMAGE=$2

if [ -z "$SERVICE_NAME" ] || [ -z "$NEW_IMAGE" ]; then
  echo "Usage: $0 <service-name> <new-image-tag>"
  echo "Example: $0 products-api 440491339319.dkr.ecr.us-east-1.amazonaws.com/eks-microservices-products-api:v2.3.1"
  exit 1
fi

DEPLOYMENT_FILE="k8s/deployment-${SERVICE_NAME}.yaml"

if [ ! -f "$DEPLOYMENT_FILE" ]; then
  echo "Error: Deployment file ${DEPLOYMENT_FILE} not found"
  exit 1
fi

# Backup current deployment
cp "$DEPLOYMENT_FILE" "${DEPLOYMENT_FILE}.backup"

# Extract image name pattern (everything before the tag)
IMAGE_PATTERN=$(grep -E "^\s*image:" "$DEPLOYMENT_FILE" | head -1 | sed 's/.*image:[[:space:]]*//' | sed 's/:.*//')

# Update image in deployment file
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|image:.*${IMAGE_PATTERN}.*|image: ${NEW_IMAGE}|g" "$DEPLOYMENT_FILE"
else
  sed -i "s|image:.*${IMAGE_PATTERN}.*|image: ${NEW_IMAGE}|g" "$DEPLOYMENT_FILE"
fi

echo "Updated ${DEPLOYMENT_FILE} with image: ${NEW_IMAGE}"

