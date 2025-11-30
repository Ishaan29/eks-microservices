# Kubernetes Manifests

This directory contains Kubernetes manifests for:
- Namespaces (dev, staging, prod)
- RBAC (Role-Based Access Control) with least-privilege principles
- Cluster Autoscaler deployment

## Structure

```
k8s/
├── namespaces.yaml                    # Namespace definitions
├── rbac/
│   ├── dev-rbac.yaml                 # RBAC for dev namespace
│   ├── staging-rbac.yaml             # RBAC for staging namespace
│   ├── prod-rbac.yaml                # RBAC for prod namespace
│   └── cluster-autoscaler-rbac.yaml  # RBAC for cluster autoscaler
└── cluster-autoscaler.yaml           # Cluster autoscaler deployment
```

## RBAC Overview

### Namespace-Level RBAC

Each namespace (dev, staging, prod) has:
- **ServiceAccount**: For workloads running in that namespace
- **Role**: Namespace-scoped permissions (least-privilege)
- **RoleBinding**: Binds ServiceAccount and Users to the Role
- **ClusterRole**: Cluster-wide read permissions (for monitoring)
- **ClusterRoleBinding**: Binds ServiceAccount and Users to the ClusterRole

### Permission Differences by Environment

#### Dev Environment
- Full CRUD on pods, services, configmaps
- Can create and update deployments
- Can read ingress resources
- More permissive for development needs

#### Staging Environment
- Similar to dev but with ingress write permissions
- Allows testing of ingress configurations
- Balanced permissions for staging workflows

#### Prod Environment
- Read-only access to ingress (security hardening)
- Full CRUD on pods, services, configmaps, deployments
- More restrictive to prevent accidental changes
- Focus on stability and security

### Cluster Autoscaler RBAC

The cluster autoscaler requires extensive permissions to:
- Monitor node and pod states
- Evict pods when scaling down
- Read cluster resources
- Manage configmaps for status tracking

## IRSA (IAM Roles for Service Accounts)

Service accounts can be annotated with IAM role ARNs for AWS service access:

```yaml
annotations:
  eks.amazonaws.com/role-arn: "arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME"
```

### Setting Up IRSA

1. **Create IAM Role** with trust policy for the OIDC provider
2. **Annotate ServiceAccount** with the role ARN
3. **Pods using the ServiceAccount** automatically assume the IAM role

Example for cluster autoscaler:
```bash
# Get the role ARN from CloudFormation output
AUTOSCALER_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name eks-cluster-autoscaler-irsa-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ClusterAutoscalerRoleArn`].OutputValue' \
  --output text)

# Update the service account annotation
kubectl annotate serviceaccount cluster-autoscaler \
  -n kube-system \
  eks.amazonaws.com/role-arn=$AUTOSCALER_ROLE_ARN \
  --overwrite
```

## Deployment

### Prerequisites

1. EKS cluster is deployed and accessible
2. kubectl is configured to access the cluster
3. IRSA role ARNs are available (if using AWS service access)

### Apply Manifests

```bash
# 1. Create namespaces
kubectl apply -f namespaces.yaml

# 2. Apply RBAC for each namespace
kubectl apply -f rbac/dev-rbac.yaml
kubectl apply -f rbac/staging-rbac.yaml
kubectl apply -f rbac/prod-rbac.yaml

# 3. Update cluster autoscaler service account with IRSA role
# (Get role ARN from CloudFormation output first)
AUTOSCALER_ROLE_ARN="<your-role-arn>"
sed -i.bak "s|eks.amazonaws.com/role-arn: \"\"|eks.amazonaws.com/role-arn: \"$AUTOSCALER_ROLE_ARN\"|" rbac/cluster-autoscaler-rbac.yaml

# 4. Apply cluster autoscaler RBAC
kubectl apply -f rbac/cluster-autoscaler-rbac.yaml

# 5. Update cluster autoscaler deployment
# Update cluster name and region in cluster-autoscaler.yaml
CLUSTER_NAME="<your-cluster-name>"
AWS_REGION="<your-region>"
sed -i.bak "s|eks-microservices-cluster-dev|$CLUSTER_NAME|g" cluster-autoscaler.yaml
sed -i.bak "s|value: us-east-1|value: $AWS_REGION|" cluster-autoscaler.yaml

# 6. Deploy cluster autoscaler
kubectl apply -f cluster-autoscaler.yaml
```

### Verify Deployment

```bash
# Check namespaces
kubectl get namespaces

# Check service accounts
kubectl get serviceaccounts -n dev
kubectl get serviceaccounts -n staging
kubectl get serviceaccounts -n prod
kubectl get serviceaccounts -n kube-system | grep cluster-autoscaler

# Check cluster autoscaler
kubectl get deployment cluster-autoscaler -n kube-system
kubectl logs -n kube-system deployment/cluster-autoscaler

# Test RBAC (as a user)
kubectl auth can-i create pods --namespace dev --as dev-user
kubectl auth can-i delete pods --namespace prod --as prod-user
```

## Customizing RBAC

### Adding Permissions

To add permissions to a namespace role, edit the corresponding RBAC file:

```yaml
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch", "create", "update"]
```

### Adding Users

To add users to a namespace, update the RoleBinding:

```yaml
subjects:
  - kind: User
    name: new-user
    apiGroup: rbac.authorization.k8s.io
```

### Creating Additional Service Accounts

For workloads that need AWS service access:

1. Create a new ServiceAccount in the appropriate namespace
2. Annotate with IRSA role ARN
3. Update RoleBinding to include the new ServiceAccount

## Security Best Practices

1. **Least Privilege**: Only grant necessary permissions
2. **Separate Environments**: Isolate dev, staging, and prod
3. **Regular Audits**: Review RBAC permissions periodically
4. **Use IRSA**: Prefer IRSA over IAM instance profiles
5. **Network Policies**: Consider adding NetworkPolicies for additional isolation
6. **Pod Security Standards**: Enforce pod security standards per namespace

## Troubleshooting

### Service Account Cannot Assume IAM Role

1. Verify OIDC provider is created
2. Check IAM role trust policy includes the service account
3. Verify service account annotation is correct
4. Check pod logs for STS errors

### RBAC Permission Denied

1. Verify RoleBinding includes your user/service account
2. Check Role has the required permissions
3. Verify you're in the correct namespace
4. Use `kubectl auth can-i` to test permissions

### Cluster Autoscaler Not Scaling

1. Check cluster autoscaler logs
2. Verify node groups have autoscaler tags
3. Check IAM permissions for autoscaler role
4. Verify node group min/max sizes allow scaling
