#!/bin/bash

# Script to set up RBAC permissions for CI/CD user in EKS cluster
# This script should be run by a cluster admin

set -e

# Configuration
CLUSTER_NAME="${1:-your-cluster-name}"
REGION="${2:-us-east-1}"
CICD_USER="cicd-user"

echo "======================================"
echo "CI/CD RBAC Setup for EKS Cluster"
echo "======================================"
echo "Cluster: $CLUSTER_NAME"
echo "Region: $REGION"
echo "User: $CICD_USER"
echo ""

# Update kubeconfig
echo "Step 1: Updating kubeconfig..."
aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"

# Check if user already has a mapping in aws-auth ConfigMap
echo ""
echo "Step 2: Checking current aws-auth ConfigMap..."
kubectl get configmap aws-auth -n kube-system -o yaml

echo ""
echo "Step 3: Applying RBAC permissions..."
kubectl apply -f k8s/cicd-rbac.yaml

echo ""
echo "======================================"
echo "RBAC Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Ensure your CI/CD user IAM credentials are mapped in the aws-auth ConfigMap"
echo "2. If not already mapped, run the following command to add the user:"
echo ""
echo "   kubectl edit configmap aws-auth -n kube-system"
echo ""
echo "   Add this to the 'mapUsers' section:"
echo ""
echo "   - userarn: arn:aws:iam::ACCOUNT_ID:user/$CICD_USER"
echo "     username: $CICD_USER"
echo "     groups:"
echo "       - system:masters  # Or use custom groups"
echo ""
echo "3. Or use the helper script: ./scripts/add-cicd-user-to-aws-auth.sh"
echo "======================================"
