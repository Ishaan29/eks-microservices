# Fix CI/CD User Permissions in EKS

## Problem
Your GitHub Actions workflow is failing with:
```
Error from server (Forbidden): ... User "cicd-user" cannot get resource "namespaces"
```

This means the IAM user associated with your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` GitHub secrets is mapped to a Kubernetes user called `cicd-user`, but this user doesn't have the necessary RBAC permissions.

## Solution Steps

### Step 1: Identify Your CI/CD IAM User

First, you need to know which IAM user your GitHub Actions is using. You can find this by checking which user the access keys belong to.

Run this command with your GitHub Actions AWS credentials:
```bash
aws sts get-caller-identity
```

This will show you the IAM user ARN, like:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/github-actions-user"
}
```

### Step 2: Apply RBAC Permissions

I've created RBAC permissions in [k8s/cicd-rbac.yaml](../k8s/cicd-rbac.yaml). Apply them to your cluster:

```bash
# Make sure you're using your admin profile that has cluster access
export AWS_PROFILE=818Rfinal

# Update kubeconfig with your cluster
aws eks update-kubeconfig --region us-east-1 --name YOUR_CLUSTER_NAME

# Apply RBAC permissions
kubectl apply -f k8s/cicd-rbac.yaml
```

This creates:
- `ClusterRole` called `cicd-deployer` with permissions for deployments, services, configmaps, etc.
- `ClusterRoleBinding` that binds the role to user `cicd-user`

### Step 3: Check aws-auth ConfigMap

The `aws-auth` ConfigMap in the `kube-system` namespace maps IAM users/roles to Kubernetes users. You need to ensure your GitHub Actions IAM user is mapped to `cicd-user`.

```bash
# View current aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml
```

Look for a `mapUsers` section. You should see something like:
```yaml
mapUsers: |
  - userarn: arn:aws:iam::123456789012:user/YOUR_IAM_USER
    username: cicd-user
```

### Step 4: Add Your IAM User to aws-auth (if not present)

If your IAM user is NOT in the aws-auth ConfigMap, you need to add it:

```bash
# Edit the ConfigMap
kubectl edit configmap aws-auth -n kube-system
```

Add this to the `data` section (replace with your actual IAM user ARN from Step 1):

```yaml
data:
  mapUsers: |
    - userarn: arn:aws:iam::ACCOUNT_ID:user/YOUR_IAM_USER_NAME
      username: cicd-user
```

**Important:** If there's already a `mapUsers` section, just add your entry to it. Don't replace existing entries!

Save and exit. The changes take effect immediately.

### Step 5: Verify Permissions

Test that the user now has access:

```bash
# Temporarily use the CI/CD credentials
export AWS_ACCESS_KEY_ID="your-github-actions-key"
export AWS_SECRET_ACCESS_KEY="your-github-actions-secret"

# Update kubeconfig with these credentials
aws eks update-kubeconfig --region us-east-1 --name YOUR_CLUSTER_NAME

# Test namespace access
kubectl get namespaces

# Test creating monitoring namespace
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Clean up test credentials
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
export AWS_PROFILE=818Rfinal
```

## Quick Command Reference

### One-liner to apply RBAC (run as admin):
```bash
AWS_PROFILE=818Rfinal kubectl apply -f k8s/cicd-rbac.yaml
```

### Check what user GitHub Actions is using:
Add this step to your workflow temporarily:
```yaml
- name: Debug AWS Identity
  run: aws sts get-caller-identity
```

### Alternative: Use IAM Role Instead of User

If you want better security, consider using an IAM Role with OIDC for GitHub Actions instead of static credentials:

1. Create an IAM Role for GitHub Actions with OIDC trust
2. Map the role ARN in aws-auth ConfigMap
3. Update your workflow to assume the role

This is more secure as it doesn't require storing static credentials.

## Troubleshooting

### Still getting forbidden errors?
1. Double-check the username in aws-auth matches the ClusterRoleBinding subject (should be `cicd-user`)
2. Ensure RBAC is applied: `kubectl get clusterrole cicd-deployer`
3. Check bindings: `kubectl get clusterrolebinding cicd-deployer-binding`
4. Verify the IAM user ARN is correct in aws-auth

### Can't edit aws-auth ConfigMap?
You need cluster admin permissions. Make sure you're using your admin profile:
```bash
export AWS_PROFILE=818Rfinal
aws eks update-kubeconfig --region us-east-1 --name YOUR_CLUSTER_NAME
```

The user who created the cluster has admin access by default.
