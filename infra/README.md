# EKS Infrastructure as Code (CloudFormation)

This directory contains CloudFormation templates for deploying an EKS cluster with:
- VPC and networking across 2+ Availability Zones
- EKS control plane
- Two node groups across different Availability Zones
- Cluster autoscaler with IRSA (IAM Roles for Service Accounts)

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. kubectl installed
3. aws-iam-authenticator or AWS CLI v2 (for kubectl authentication)
4. An existing EC2 Key Pair (optional, for SSH access to nodes)

## Deployment Order

Deploy the CloudFormation stacks in the following order:

### 1. Deploy VPC Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-vpc-dev \
  --template-body file://vpc.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=VpcCidr,ParameterValue=10.0.0.0/16 \
    ParameterKey=AvailabilityZones,ParameterValue="us-east-1a,us-east-1b" \
  --capabilities CAPABILITY_IAM
```

**Note:** Replace `us-east-1a,us-east-1b` with your desired Availability Zones.

Wait for the stack to complete:
```bash
aws cloudformation wait stack-create-complete --stack-name eks-vpc-dev
```

### 2. Deploy EKS Cluster Stack

First, get the VPC outputs:
```bash
VPC_ID=$(aws cloudformation describe-stacks --stack-name eks-vpc-dev --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text)
PRIVATE_SUBNET_IDS=$(aws cloudformation describe-stacks --stack-name eks-vpc-dev --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' --output text)
```

Then deploy the cluster:
```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-dev \
  --template-body file://eks-cluster.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=ClusterName,ParameterValue=eks-microservices-cluster \
    ParameterKey=KubernetesVersion,ParameterValue=1.28 \
    ParameterKey=VpcId,ParameterValue=$VPC_ID \
    ParameterKey=PrivateSubnetIds,ParameterValue=$PRIVATE_SUBNET_IDS \
  --capabilities CAPABILITY_IAM
```

Wait for the stack to complete (this takes 10-15 minutes):
```bash
aws cloudformation wait stack-create-complete --stack-name eks-cluster-dev
```

### 3. Create OIDC Identity Provider

After the cluster is created, you need to create the OIDC identity provider for IRSA:

```bash
CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name eks-cluster-dev --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' --output text)
OIDC_ISSUER=$(aws eks describe-cluster --name $CLUSTER_NAME --query "cluster.identity.oidc.issuer" --output text | sed 's|https://||')

# Check if OIDC provider already exists
aws iam list-open-id-connect-providers | grep -q $OIDC_ISSUER || \
aws eks describe-cluster --name $CLUSTER_NAME --query "cluster.identity.oidc.issuer" --output text | \
  xargs -I {} aws iam create-open-id-connect-provider \
    --url {} \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 9e99a48a9960b14926bb7f3b02e22da2b0ab7280
```

### 4. Deploy Cluster Autoscaler IRSA Stack

Get the OIDC provider ARN:
```bash
OIDC_PROVIDER_ARN=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn, '$OIDC_ISSUER')].Arn" --output text)
```

Deploy the IRSA stack:
```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-autoscaler-irsa-dev \
  --template-body file://cluster-autoscaler-irsa.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=ClusterName,ParameterValue=eks-microservices-cluster \
    ParameterKey=ClusterOidcProviderArn,ParameterValue=$OIDC_PROVIDER_ARN \
  --capabilities CAPABILITY_IAM
```

Wait for completion:
```bash
aws cloudformation wait stack-create-complete --stack-name eks-cluster-autoscaler-irsa-dev
```

### 5. Deploy Node Groups Stack

Get required outputs:
```bash
CLUSTER_SG_ID=$(aws cloudformation describe-stacks --stack-name eks-cluster-dev --query 'Stacks[0].Outputs[?OutputKey==`ClusterSecurityGroupId`].OutputValue' --output text)
PRIVATE_SUBNET_1=$(aws cloudformation describe-stacks --stack-name eks-vpc-dev --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnet1Id`].OutputValue' --output text)
PRIVATE_SUBNET_2=$(aws cloudformation describe-stacks --stack-name eks-vpc-dev --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnet2Id`].OutputValue' --output text)
```

Deploy node groups:
```bash
aws cloudformation create-stack \
  --stack-name eks-nodegroups-dev \
  --template-body file://eks-nodegroups.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=ClusterName,ParameterValue=eks-microservices-cluster \
    ParameterKey=ClusterControlPlaneSecurityGroupId,ParameterValue=$CLUSTER_SG_ID \
    ParameterKey=VpcId,ParameterValue=$VPC_ID \
    ParameterKey=PrivateSubnet1Id,ParameterValue=$PRIVATE_SUBNET_1 \
    ParameterKey=PrivateSubnet2Id,ParameterValue=$PRIVATE_SUBNET_2 \
    ParameterKey=NodeInstanceType,ParameterValue=t3.medium \
    ParameterKey=NodeGroupKeyName,ParameterValue="" \
  --capabilities CAPABILITY_IAM
```

Wait for completion (this takes 5-10 minutes):
```bash
aws cloudformation wait stack-create-complete --stack-name eks-nodegroups-dev
```

### 6. Configure kubectl

Update your kubeconfig:
```bash
CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name eks-cluster-dev --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' --output text)
aws eks update-kubeconfig --name $CLUSTER_NAME --region us-east-1
```

Verify access:
```bash
kubectl get nodes
```

### 7. Deploy Kubernetes Manifests

Navigate to the `k8s` directory and apply the manifests:

```bash
cd ../k8s

# Create namespaces
kubectl apply -f namespaces.yaml

# Create RBAC for namespaces
kubectl apply -f rbac/dev-rbac.yaml
kubectl apply -f rbac/staging-rbac.yaml
kubectl apply -f rbac/prod-rbac.yaml

# Update cluster autoscaler service account with IRSA role ARN
AUTOSCALER_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name eks-cluster-autoscaler-irsa-dev --query 'Stacks[0].Outputs[?OutputKey==`ClusterAutoscalerRoleArn`].OutputValue' --output text)
sed -i.bak "s|eks.amazonaws.com/role-arn: \"\"|eks.amazonaws.com/role-arn: \"$AUTOSCALER_ROLE_ARN\"|" rbac/cluster-autoscaler-rbac.yaml

# Apply cluster autoscaler RBAC
kubectl apply -f rbac/cluster-autoscaler-rbac.yaml

# Update cluster autoscaler deployment with correct cluster name
CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name eks-cluster-dev --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' --output text)
sed -i.bak "s|eks-microservices-cluster-dev|$CLUSTER_NAME|g" cluster-autoscaler.yaml

# Update AWS region in cluster autoscaler deployment
sed -i.bak "s|value: us-east-1|value: $(aws configure get region)|" cluster-autoscaler.yaml

# Deploy cluster autoscaler
kubectl apply -f cluster-autoscaler.yaml
```

Verify cluster autoscaler is running:
```bash
kubectl get deployment cluster-autoscaler -n kube-system
kubectl logs -n kube-system deployment/cluster-autoscaler
```

## Stack Updates

To update a stack:
```bash
aws cloudformation update-stack \
  --stack-name <stack-name> \
  --template-body file://<template-file>.yaml \
  --parameters <parameters>
```

## Stack Deletion

Delete stacks in reverse order:
1. Node Groups
2. Cluster Autoscaler IRSA
3. EKS Cluster
4. VPC

```bash
aws cloudformation delete-stack --stack-name eks-nodegroups-dev
aws cloudformation wait stack-delete-complete --stack-name eks-nodegroups-dev

aws cloudformation delete-stack --stack-name eks-cluster-autoscaler-irsa-dev
aws cloudformation wait stack-delete-complete --stack-name eks-cluster-autoscaler-irsa-dev

aws cloudformation delete-stack --stack-name eks-cluster-dev
aws cloudformation wait stack-delete-complete --stack-name eks-cluster-dev

aws cloudformation delete-stack --stack-name eks-vpc-dev
aws cloudformation wait stack-delete-complete --stack-name eks-vpc-dev
```

## Architecture

- **VPC**: 10.0.0.0/16 CIDR block
- **Public Subnets**: 2 subnets across 2 AZs for load balancers
- **Private Subnets**: 2 subnets across 2 AZs for EKS nodes
- **NAT Gateways**: One per AZ for outbound internet access
- **EKS Cluster**: Control plane in private subnets
- **Node Groups**: 2 managed node groups, one per AZ
- **Cluster Autoscaler**: Automatically scales nodes based on demand

## Cost Optimization

- Consider using NAT Gateway endpoints for cost savings in non-production
- Adjust node group instance types based on workload requirements
- Use spot instances for node groups in dev/staging environments
