# Observability Stack for EKS Microservices

This directory contains the complete observability stack configuration for the EKS microservices application, including Prometheus, Grafana, Fluent Bit, dashboards, and alerting.

## Components

### 1. Kube-Prometheus Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboarding
- **Alertmanager**: Alert routing and management
- **Node Exporter**: Node-level metrics
- **Kube State Metrics**: Cluster state metrics

### 2. Fluent Bit
- Log collection and forwarding to AWS CloudWatch
- Deployed in `kube-system` namespace
- Automatically scrapes logs from all pods

### 3. Custom Dashboards
Located in `dashboards/`:
- **cpu-dashboard.json**: CPU usage metrics across nodes and pods
- **errors-dashboard.json**: Error tracking and analysis
- **latency-dashboard.json**: Request latency and performance metrics

### 4. Alerts
Located in `alerts/`:
- **grafana-alert.yaml**: Pod startup latency alerts with AWS SNS integration

## Required GitHub Secrets

Add the following secrets to your GitHub repository:

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: AWS access key with permissions for EKS, ECR, CloudWatch, SNS
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `KUBECONFIG`: Base64-encoded kubeconfig file for EKS cluster access

### EKS Configuration
- `EKS_CLUSTER_NAME`: Name of your EKS cluster

### Grafana Configuration
- `GRAFANA_ADMIN_PASSWORD`: Admin password for Grafana (choose a strong password)

### SNS Configuration (Optional for Alerts)
- `SNS_TOPIC_ARN`: ARN of the SNS topic for alert notifications
- `SNS_ASSUME_ROLE_ARN`: IAM role ARN that Grafana can assume to publish to SNS

## Deployment

### Automatic Deployment via CI/CD
The observability stack is automatically deployed when you push to the `cicd-dev` branch:

```bash
git add .
git commit -m "Update observability configuration"
git push origin cicd-dev
```

The CI/CD pipeline will:
1. Build and deploy microservices
2. Deploy the complete observability stack
3. Configure dashboards and alerts
4. Expose Grafana and Prometheus via LoadBalancer

### Manual Deployment
You can also trigger the deployment manually:

1. Go to GitHub Actions
2. Select "CI/CD Pipeline - Dev Branch"
3. Click "Run workflow"
4. Select `cicd-dev` branch
5. Click "Run workflow"

Alternatively, use the standalone observability deployment workflow:
1. Go to GitHub Actions
2. Select "Deploy Monitoring Stack"
3. Click "Run workflow"

## Accessing Services

After deployment, get the LoadBalancer URLs:

```bash
# Grafana
kubectl get svc monitoring-grafana -n monitoring

# Prometheus
kubectl get svc monitoring-kube-prometheus-prometheus -n monitoring
```

Access Grafana:
- URL: `http://<GRAFANA-EXTERNAL-IP>`
- Username: `admin`
- Password: Value of `GRAFANA_ADMIN_PASSWORD` secret

## Configuration Files

### kube-stack-values.yaml
Main configuration for the Prometheus stack:
- Dashboard provisioning from ConfigMaps
- Unified alerting enabled
- CloudWatch data source integration
- Prometheus retention (30 days)
- Storage configuration (50GB for Prometheus, 10GB for Alertmanager)

### fluent-bit-values.yaml
Fluent Bit configuration:
- CloudWatch log group: `/eks/ecommerce-cluster`
- Region: `us-east-1`
- Auto-create log groups
- JSON log parsing

## Monitoring Features

### Metrics Collection
- Node-level metrics (CPU, memory, disk, network)
- Pod-level metrics (resource usage, restarts, status)
- Application metrics (custom metrics from microservices)
- Kubernetes cluster state metrics

### Logging
- Centralized log collection from all pods
- Forwarded to AWS CloudWatch for long-term storage
- Searchable and filterable via CloudWatch Logs Insights

### Dashboards
All dashboards are automatically provisioned and available in Grafana:
- CPU Usage Dashboard
- Error Tracking Dashboard
- Latency Monitoring Dashboard

### Alerting
Alerts are configured with AWS SNS integration:
- Pod startup latency threshold alerts
- Automatic notification to configured SNS topic
- Extensible for additional alert rules

## AWS IAM Permissions Required

### For CI/CD Pipeline
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters",
        "ecr:*",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    }
  ]
}
```

### For Grafana SNS Integration (Optional)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "<SNS_TOPIC_ARN>"
    }
  ]
}
```

## Troubleshooting

### Dashboards Not Appearing
1. Check ConfigMaps are created:
   ```bash
   kubectl get configmaps -n monitoring | grep dashboard
   ```

2. Verify labels are set:
   ```bash
   kubectl get configmap grafana-dashboard-cpu -n monitoring -o yaml | grep grafana_dashboard
   ```

3. Restart Grafana:
   ```bash
   kubectl rollout restart deployment/monitoring-grafana -n monitoring
   ```

### Fluent Bit Not Collecting Logs
1. Check Fluent Bit pods:
   ```bash
   kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-for-fluent-bit
   ```

2. View Fluent Bit logs:
   ```bash
   kubectl logs -n kube-system -l app.kubernetes.io/name=aws-for-fluent-bit
   ```

3. Verify CloudWatch log group:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /eks/ecommerce-cluster
   ```

### Alerts Not Triggering
1. Verify alert rules in Grafana UI (Alerting → Alert Rules)
2. Check SNS topic permissions
3. Verify Grafana can assume the SNS role
4. Check Alertmanager logs:
   ```bash
   kubectl logs -n monitoring alertmanager-monitoring-kube-prometheus-alertmanager-0
   ```

## Maintenance

### Updating Dashboards
1. Edit JSON files in `dashboards/`
2. Commit and push to trigger deployment
3. Dashboards will auto-reload in Grafana

### Updating Alerts
1. Edit `alerts/grafana-alert.yaml`
2. Commit and push to trigger deployment
3. Alerts will be updated via Grafana API

### Scaling Prometheus
To increase storage or resources, edit `kube-stack-values.yaml`:
```yaml
prometheus:
  prometheusSpec:
    retention: 60d  # Increase retention
    storageSpec:
      volumeClaimTemplate:
        spec:
          resources:
            requests:
              storage: 100Gi  # Increase storage
```

## Support
For issues or questions, please refer to the official documentation:
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [Fluent Bit](https://docs.fluentbit.io/)
- [AWS for Fluent Bit](https://github.com/aws/aws-for-fluent-bit)
