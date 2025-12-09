# eks-microservices
E-Commerce Microservices on AWS EKS

## CI/CD Pipeline

This project includes a GitHub Actions CI/CD pipeline for automated deployments to the `dev` branch.

### Quick Start

1. Configure GitHub Secrets (see [CICD_SETUP.md](./CICD_SETUP.md))
2. Push to `dev` branch to trigger automatic deployment
3. Monitor deployments in GitHub Actions

For detailed setup instructions, see [CICD_SETUP.md](./CICD_SETUP.md).

### Features

- ✅ Automatic Docker image building and ECR push
- ✅ Kubernetes deployment automation
- ✅ Version tagging using GitHub SHA
- ✅ Automatic rollback on deployment failure
- ✅ Multi-microservice support
