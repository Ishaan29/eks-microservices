# CI/CD Setup Guide

This guide explains how to set up and use the GitHub Actions CI/CD pipeline for deploying microservices to AWS EKS.

## Overview

The CI/CD pipeline automatically:
1. Builds Docker images for all configured microservices
2. Pushes images to Amazon ECR with version tags (using GitHub SHA)
3. Updates Kubernetes deployment YAML files with new image versions
4. Applies deployments to the EKS cluster
5. Rolls back to previous version if deployment fails

## Prerequisites

1. **AWS Account** with:
   - ECR repository access
   - EKS cluster access
   - IAM user/role with necessary permissions

2. **GitHub Repository** with:
   - Access to configure secrets
   - `dev` branch

3. **Kubernetes Cluster**:
   - EKS cluster running
   - `dev` namespace created
   - kubectl access configured

## Setup Steps

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- **AWS_ACCESS_KEY_ID**: Your AWS access key ID
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret access key
- **KUBECONFIG**: Base64-encoded Kubernetes config file

To get the base64-encoded kubeconfig:
```bash
cat ~/.kube/config | base64
```

### 2. Configure ECR Registry

Update the ECR registry in `.github/workflows/cicd-dev.yml`:
```yaml
env:
  ECR_REGISTRY: 440491339319.dkr.ecr.us-east-1.amazonaws.com
```

### 3. Add Microservices

Edit `.github/workflows/cicd-dev.yml` and update the `MICROSERVICES` array in three places:
- Build step (line ~50)
- Update deployments step (line ~99)
- Apply deployments step (line ~121)
- Rollback step (line ~157)

Example:
```bash
MICROSERVICES=("products-api" "orders-api" "users-api")
```

### 4. Create Deployment Files

For each microservice, create a deployment YAML file:
- Location: `k8s/deployment-<service-name>.yaml`
- Example: `k8s/deployment-products.yaml`

The deployment file should follow this structure:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <service-name>-deployment
  namespace: dev
spec:
  template:
    spec:
      containers:
      - name: <service-name>
        image: <ecr-registry>/eks-microservices-<service-name>:<version>
```

### 5. Ensure Dockerfiles Exist

Each microservice must have a Dockerfile at:
- `backend/<service-name>/Dockerfile`

## How It Works

### Versioning

Images are tagged using the first 8 characters of the Git commit SHA:
- Format: `v<first-8-chars>`
- Example: `v1a2b3c4d`

### Workflow Triggers

The pipeline runs automatically when:
- Code is pushed to the `dev` branch
- Manually triggered via GitHub Actions UI (workflow_dispatch)

### Deployment Process

1. **Build**: Docker images are built for all microservices
2. **Push**: Images are pushed to ECR with version tags
3. **Update**: Kubernetes deployment YAML files are updated with new image versions
4. **Deploy**: Deployments are applied and rollout status is monitored
5. **Rollback**: If deployment fails, automatic rollback to previous version

### Rollback Mechanism

If a deployment fails:
- Kubernetes rollback: `kubectl rollout undo deployment/<name> -n dev`
- YAML restoration: Deployment files are restored from backup

## Adding a New Microservice

1. Add service name to `MICROSERVICES` array in the workflow file (4 locations)
2. Create deployment YAML: `k8s/deployment-<service-name>.yaml`
3. Ensure Dockerfile exists: `backend/<service-name>/Dockerfile`
4. Push to `dev` branch to trigger deployment

## Troubleshooting

### Build Failures
- Check Dockerfile exists at correct path
- Verify Dockerfile syntax
- Check build logs in GitHub Actions

### Push Failures
- Verify AWS credentials are correct
- Check ECR repository exists
- Ensure IAM permissions include ECR push

### Deployment Failures
- Check Kubernetes cluster connectivity
- Verify namespace exists
- Check deployment YAML syntax
- Review kubectl logs in workflow output

### Rollback Issues
- Verify previous deployment exists
- Check kubectl access permissions
- Review rollback logs in workflow output

## Manual Operations

### Manual Deployment
```bash
# Update deployment file
./scripts/update-deployment.sh products-api 440491339319.dkr.ecr.us-east-1.amazonaws.com/eks-microservices-products-api:v2.3.1

# Apply deployment
kubectl apply -f k8s/deployment-products.yaml -n dev

# Check status
kubectl rollout status deployment/products-api-deployment -n dev
```

### Manual Rollback
```bash
kubectl rollout undo deployment/products-api-deployment -n dev
```

## Security Best Practices

1. **Secrets Management**: Never commit secrets to repository
2. **IAM Roles**: Use least privilege principle for AWS access
3. **Image Scanning**: Enable ECR image scanning
4. **Network Policies**: Implement Kubernetes network policies
5. **RBAC**: Use proper Kubernetes RBAC for deployments

## Monitoring

Monitor deployments via:
- GitHub Actions workflow runs
- Kubernetes dashboard
- kubectl commands:
  ```bash
  kubectl get deployments -n dev
  kubectl get pods -n dev
  kubectl describe deployment/<name> -n dev
  ```

