#!/bin/bash

# Script to add CI/CD IAM user to EKS aws-auth ConfigMap
# This allows the IAM user to authenticate to the cluster

set -e

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Configuration - Update these values
CLUSTER_NAME="${1}"
REGION="${2:-us-east-1}"
CICD_IAM_USER="${3:-cicd-user}"

if [ -z "$CLUSTER_NAME" ]; then
    echo "Error: Cluster name is required"
    echo "Usage: $0 <cluster-name> [region] [iam-user-name]"
    echo "Example: $0 my-eks-cluster us-east-1 cicd-user"
    exit 1
fi

echo "======================================"
echo "Adding CI/CD User to aws-auth ConfigMap"
echo "======================================"
echo "Account ID: $ACCOUNT_ID"
echo "Cluster: $CLUSTER_NAME"
echo "Region: $REGION"
echo "IAM User: $CICD_IAM_USER"
echo ""

# Update kubeconfig
echo "Updating kubeconfig..."
aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"

# Create a patch file
cat > /tmp/aws-auth-patch.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
data:
  mapUsers: |
    - userarn: arn:aws:iam::${ACCOUNT_ID}:user/${CICD_IAM_USER}
      username: cicd-user
      groups:
        - cicd-deployer
EOF

echo ""
echo "Current aws-auth ConfigMap:"
kubectl get configmap aws-auth -n kube-system -o yaml

echo ""
echo "======================================"
echo "IMPORTANT: Manual Step Required"
echo "======================================"
echo ""
echo "Run the following command to edit the aws-auth ConfigMap:"
echo ""
echo "  kubectl edit configmap aws-auth -n kube-system"
echo ""
echo "Add the following entry to the 'mapUsers' section (or create it if it doesn't exist):"
echo ""
echo "  mapUsers: |"
echo "    - userarn: arn:aws:iam::${ACCOUNT_ID}:user/${CICD_IAM_USER}"
echo "      username: cicd-user"
echo ""
echo "If the IAM user doesn't exist yet, create it with:"
echo ""
echo "  aws iam create-user --user-name ${CICD_IAM_USER}"
echo "  aws iam create-access-key --user-name ${CICD_IAM_USER}"
echo ""
echo "Then attach the necessary policies (EKS, ECR, CloudWatch, etc.)"
echo "======================================"
