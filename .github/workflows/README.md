# GitHub Actions Workflows

## CI/CD Pipeline for Dev Branch

The `cicd-dev.yml` workflow automatically builds, pushes, and deploys microservices when code is pushed to the `dev` branch.

### Features

- **Automatic versioning**: Uses GitHub SHA (first 8 characters) for image versioning
- **Multi-service support**: Handles multiple microservices in a single workflow
- **ECR integration**: Builds and pushes Docker images to Amazon ECR
- **Kubernetes deployment**: Automatically updates and applies Kubernetes deployments
- **Rollback on failure**: Automatically rolls back to previous version if deployment fails

### Required Secrets

Configure the following secrets in your GitHub repository settings:

1. `AWS_ACCESS_KEY_ID`: AWS access key with ECR push permissions
2. `AWS_SECRET_ACCESS_KEY`: AWS secret access key
3. `KUBECONFIG`: Base64-encoded Kubernetes config file

### Adding New Microservices

To add a new microservice to the CI/CD pipeline:

1. Add the service name to the `MICROSERVICES` array in the workflow file
2. Create a corresponding deployment YAML file: `k8s/deployment-<service-name>.yaml`
3. Ensure the Dockerfile exists at: `backend/<service-name>/Dockerfile`

### Workflow Steps

1. **Checkout**: Checks out the code
2. **AWS Setup**: Configures AWS credentials and logs into ECR
3. **Build**: Builds Docker images for all microservices
4. **Push**: Pushes images to ECR with version tag
5. **Update Deployments**: Updates Kubernetes deployment YAML files with new image versions
6. **Deploy**: Applies Kubernetes deployments and waits for rollout
7. **Rollback**: Automatically rolls back on failure

### Version Format

Images are tagged using the format: `v<first-8-chars-of-sha>`
Example: `v1a2b3c4d`
