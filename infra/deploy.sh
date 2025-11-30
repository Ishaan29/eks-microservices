#!/bin/bash

# EKS Infrastructure Deployment Script
# This script deploys all CloudFormation stacks in the correct order

set -e

# Configuration
ENVIRONMENT=${1:-dev}
CLUSTER_NAME=${2:-eks-microservices-cluster}
KUBERNETES_VERSION=${3:-1.28}
AWS_REGION=${4:-us-east-1}
VPC_CIDR=${5:-10.0.0.0/16}

# Get availability zones for the region
AZS=$(aws ec2 describe-availability-zones --region $AWS_REGION --query 'AvailabilityZones[0:2].ZoneName' --output text | tr '\t' ',')
AZ1=$(echo $AZS | cut -d',' -f1)
AZ2=$(echo $AZS | cut -d',' -f2)

echo "=========================================="
echo "EKS Infrastructure Deployment"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Cluster Name: $CLUSTER_NAME"
echo "Kubernetes Version: $KUBERNETES_VERSION"
echo "Region: $AWS_REGION"
echo "Availability Zones: $AZ1, $AZ2"
echo "=========================================="
echo ""

# Stack names
VPC_STACK="eks-vpc-$ENVIRONMENT"
CLUSTER_STACK="eks-cluster-$ENVIRONMENT"
NODEGROUPS_STACK="eks-nodegroups-$ENVIRONMENT"
AUTOSCALER_IRSA_STACK="eks-cluster-autoscaler-irsa-$ENVIRONMENT"

# Function to wait for stack
wait_for_stack() {
    local stack_name=$1
    echo "Waiting for stack $stack_name to complete..."
    aws cloudformation wait stack-create-complete --stack-name $stack_name --region $AWS_REGION
    echo "Stack $stack_name completed successfully!"
}

# Step 1: Deploy VPC
echo "Step 1: Deploying VPC stack..."
aws cloudformation create-stack \
    --stack-name $VPC_STACK \
    --template-body file://vpc.yaml \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        ParameterKey=VpcCidr,ParameterValue=$VPC_CIDR \
        ParameterKey=AvailabilityZones,ParameterValue="$AZ1,$AZ2" \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

wait_for_stack $VPC_STACK

# Get VPC outputs
VPC_ID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text)
PRIVATE_SUBNET_IDS=$(aws cloudformation describe-stacks --stack-name $VPC_STACK --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' --output text)
PRIVATE_SUBNET_1=$(aws cloudformation describe-stacks --stack-name $VPC_STACK --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnet1Id`].OutputValue' --output text)
PRIVATE_SUBNET_2=$(aws cloudformation describe-stacks --stack-name $VPC_STACK --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnet2Id`].OutputValue' --output text)

echo "VPC ID: $VPC_ID"
echo "Private Subnet IDs: $PRIVATE_SUBNET_IDS"
echo ""

# Step 2: Deploy EKS Cluster
echo "Step 2: Deploying EKS Cluster stack..."
aws cloudformation create-stack \
    --stack-name $CLUSTER_STACK \
    --template-body file://eks-cluster.yaml \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        ParameterKey=ClusterName,ParameterValue=$CLUSTER_NAME \
        ParameterKey=KubernetesVersion,ParameterValue=$KUBERNETES_VERSION \
        ParameterKey=VpcId,ParameterValue=$VPC_ID \
        ParameterKey=PrivateSubnetIds,ParameterValue=$PRIVATE_SUBNET_IDS \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

wait_for_stack $CLUSTER_STACK

# Get cluster outputs
CLUSTER_NAME_OUTPUT=$(aws cloudformation describe-stacks --stack-name $CLUSTER_STACK --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' --output text)
CLUSTER_SG_ID=$(aws cloudformation describe-stacks --stack-name $CLUSTER_STACK --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ClusterSecurityGroupId`].OutputValue' --output text)

echo "Cluster Name: $CLUSTER_NAME_OUTPUT"
echo ""

# Step 3: Create OIDC Identity Provider
echo "Step 3: Creating OIDC Identity Provider..."
OIDC_ISSUER=$(aws eks describe-cluster --name $CLUSTER_NAME_OUTPUT --region $AWS_REGION \
    --query "cluster.identity.oidc.issuer" --output text | sed 's|https://||')

# Check if OIDC provider already exists
EXISTING_PROVIDER=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn, '$OIDC_ISSUER')].Arn" --output text)

if [ -z "$EXISTING_PROVIDER" ]; then
    echo "Creating new OIDC provider..."
    aws iam create-open-id-connect-provider \
        --url "https://$OIDC_ISSUER" \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 9e99a48a9960b14926bb7f3b02e22da2b0ab7280
    echo "OIDC provider created successfully!"
else
    echo "OIDC provider already exists: $EXISTING_PROVIDER"
fi

OIDC_PROVIDER_ARN=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn, '$OIDC_ISSUER')].Arn" --output text)
echo "OIDC Provider ARN: $OIDC_PROVIDER_ARN"
echo ""

# Step 4: Deploy Cluster Autoscaler IRSA
echo "Step 4: Deploying Cluster Autoscaler IRSA stack..."
aws cloudformation create-stack \
    --stack-name $AUTOSCALER_IRSA_STACK \
    --template-body file://cluster-autoscaler-irsa.yaml \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        ParameterKey=ClusterName,ParameterValue=$CLUSTER_NAME \
        ParameterKey=ClusterOidcProviderArn,ParameterValue=$OIDC_PROVIDER_ARN \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

wait_for_stack $AUTOSCALER_IRSA_STACK

AUTOSCALER_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AUTOSCALER_IRSA_STACK --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ClusterAutoscalerRoleArn`].OutputValue' --output text)
echo "Cluster Autoscaler Role ARN: $AUTOSCALER_ROLE_ARN"
echo ""

# Step 5: Deploy Node Groups
echo "Step 5: Deploying Node Groups stack..."
aws cloudformation create-stack \
    --stack-name $NODEGROUPS_STACK \
    --template-body file://eks-nodegroups.yaml \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        ParameterKey=ClusterName,ParameterValue=$CLUSTER_NAME \
        ParameterKey=ClusterControlPlaneSecurityGroupId,ParameterValue=$CLUSTER_SG_ID \
        ParameterKey=VpcId,ParameterValue=$VPC_ID \
        ParameterKey=PrivateSubnet1Id,ParameterValue=$PRIVATE_SUBNET_1 \
        ParameterKey=PrivateSubnet2Id,ParameterValue=$PRIVATE_SUBNET_2 \
        ParameterKey=NodeInstanceType,ParameterValue=t3.medium \
        ParameterKey=NodeGroupKeyName,ParameterValue="" \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

wait_for_stack $NODEGROUPS_STACK

echo ""
echo "=========================================="
echo "Infrastructure Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update kubeconfig:"
echo "   aws eks update-kubeconfig --name $CLUSTER_NAME_OUTPUT --region $AWS_REGION"
echo ""
echo "2. Deploy Kubernetes manifests:"
echo "   cd ../k8s"
echo "   kubectl apply -f namespaces.yaml"
echo "   kubectl apply -f rbac/dev-rbac.yaml"
echo "   kubectl apply -f rbac/staging-rbac.yaml"
echo "   kubectl apply -f rbac/prod-rbac.yaml"
echo ""
echo "3. Update cluster autoscaler service account:"
echo "   kubectl annotate serviceaccount cluster-autoscaler -n kube-system \\"
echo "     eks.amazonaws.com/role-arn=$AUTOSCALER_ROLE_ARN --overwrite"
echo ""
echo "4. Deploy cluster autoscaler:"
echo "   # Update cluster name and region in cluster-autoscaler.yaml first"
echo "   kubectl apply -f rbac/cluster-autoscaler-rbac.yaml"
echo "   kubectl apply -f cluster-autoscaler.yaml"
echo ""
echo "Cluster Autoscaler Role ARN: $AUTOSCALER_ROLE_ARN"
echo ""

