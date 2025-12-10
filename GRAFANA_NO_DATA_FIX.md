# Grafana "No Data" Issue - Fix Documentation

## Problem
Grafana dashboard showing "No data" because Prometheus and Alertmanager pods are stuck in `Pending` state due to unbound PersistentVolumeClaims (PVCs).

## Root Cause
The EKS cluster doesn't have a storage provisioner (EBS CSI Driver) configured, so the 50GB and 10GB persistent volumes requested by Prometheus and Alertmanager cannot be provisioned.

## Solution Applied

### 1. Configuration Changes
Modified `Observability/kube-stack/kube-stack-values.yaml` to disable persistent storage for development:
- Commented out Prometheus storageSpec (50GB requirement)
- Disabled Alertmanager volumeClaimTemplate (10GB requirement)
- Both will now use emptyDir volumes (ephemeral storage)

**Note**: Metrics will be lost if pods restart, but this is acceptable for development/testing.

### 2. CI/CD Pipeline Updates
Updated both workflow files to automatically clean up stuck resources:
- `.github/workflows/cicd-dev.yml` - Main CI/CD pipeline
- `Observability/deploy.yaml` - Standalone observability deployment

Added cleanup steps that:
1. Delete stuck StatefulSets (Prometheus and Alertmanager)
2. Delete pending PVCs
3. Wait for cleanup to complete before redeploying

## Manual Fix (Run These Commands Now)

### Step 1: Delete Stuck Resources
```bash
# Delete the stuck StatefulSets
kubectl delete statefulset prometheus-prometheus-stack-prometheus -n monitoring
kubectl delete statefulset alertmanager-prometheus-stack-alertmanager -n monitoring

# Delete the pending PVCs
kubectl delete pvc prometheus-prometheus-stack-prometheus-db-prometheus-prometheus-stack-prometheus-0 -n monitoring
kubectl delete pvc alertmanager-prometheus-stack-alertmanager-db-alertmanager-prometheus-stack-alertmanager-0 -n monitoring
```

### Step 2: Upgrade Helm Deployment
```bash
# Upgrade with the new configuration (no persistent storage)
helm upgrade monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  -f Observability/kube-stack/kube-stack-values.yaml \
  --set grafana.adminPassword='YOUR_GRAFANA_PASSWORD' \
  --force \
  --wait \
  --timeout 10m
```

**Important**: Replace `YOUR_GRAFANA_PASSWORD` with your actual Grafana admin password.

### Step 3: Verify Everything is Running
```bash
# Check all pods are running (may take 2-3 minutes)
kubectl get pods -n monitoring

# Expected output - all pods should show Running:
# prometheus-prometheus-stack-prometheus-0        2/2     Running
# alertmanager-prometheus-stack-alertmanager-0    2/2     Running
# monitoring-grafana-*                            3/3     Running
# monitoring-kube-state-metrics-*                 1/1     Running
# monitoring-prometheus-node-exporter-*           1/1     Running

# Verify no PVCs exist
kubectl get pvc -n monitoring
# Should return: No resources found
```

### Step 4: Test Grafana
1. Refresh your Grafana dashboard: https://umdprojectgroup.com/grafana
2. Wait 1-2 minutes for Prometheus to start scraping metrics
3. You should now see data in all panels!

## Future CI/CD Deployments

The CI/CD pipeline is now configured to handle this automatically. When you push to `cicd-dev` branch:

1. It will clean up any stuck StatefulSets and PVCs
2. Deploy with the storage-disabled configuration
3. All monitoring pods will start successfully
4. Grafana will display metrics

## Production-Ready Solution (Optional)

For production environments where you need persistent metrics storage:

### Install EBS CSI Driver
```bash
# Add EBS CSI driver Helm repo
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo update

# Install the driver
helm upgrade --install aws-ebs-csi-driver \
  aws-ebs-csi-driver/aws-ebs-csi-driver \
  --namespace kube-system \
  --set enableVolumeScheduling=true \
  --set enableVolumeResizing=true \
  --set enableVolumeSnapshot=true
```

### Re-enable Persistent Storage
Uncomment the storage sections in `Observability/kube-stack/kube-stack-values.yaml` and redeploy.

## Troubleshooting

### Pods Still Pending After Fix
```bash
# Check pod events
kubectl describe pod prometheus-prometheus-stack-prometheus-0 -n monitoring

# Check if PVCs still exist
kubectl get pvc -n monitoring

# If PVCs exist, delete them manually
kubectl delete pvc --all -n monitoring
```

### Grafana Still Shows No Data
```bash
# Check Prometheus is running
kubectl get pods -n monitoring | grep prometheus

# Check Prometheus logs
kubectl logs prometheus-prometheus-stack-prometheus-0 -c prometheus -n monitoring

# Restart Grafana
kubectl rollout restart deployment/monitoring-grafana -n monitoring
```

### Check Prometheus Targets
1. Access Prometheus: `kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090`
2. Open browser: http://localhost:9090/targets
3. Verify targets are "UP"

## Files Modified

1. `Observability/kube-stack/kube-stack-values.yaml` - Disabled persistent storage
2. `.github/workflows/cicd-dev.yml` - Added cleanup steps to observability job
3. `Observability/deploy.yaml` - Added cleanup steps (if used standalone)

## Summary

✅ Disabled persistent storage requirements for Prometheus and Alertmanager
✅ Updated CI/CD pipelines to automatically clean up stuck resources
✅ Provided manual fix commands for immediate resolution
✅ Documented production-ready solution for future use

After running the manual commands above, your Grafana dashboard should display metrics within 2-3 minutes!

