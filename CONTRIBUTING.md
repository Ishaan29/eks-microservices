# Contributing Guidelines

Thank you for your interest in contributing to this project!

## Branch Strategy
- `main` → Production-ready code only.
- `dev` → Active development branch.
- Feature work uses `feature/<name>` branches.

## Pull Requests
- All PRs must target the `dev` branch.
- PRs must pass CI workflow checks before review.
- At least **one reviewer** is required before merge.
- Include screenshots or logs if your change affects deployment.

## Commit Messages
Use descriptive commit messages:
- fix: corrected API port issue
- feat: added autoscaling configuration
- docs: updated README and CONTRIBUTING

## Issues
When opening an issue, include:
- Expected behavior
- Actual behavior
- Steps to reproduce
- Logs or screenshots if applicable

## Code Style
- Follow YAML/Helm/Kubernetes best practices.
- No plaintext secrets.
- Run linters before submitting a PR.

## Security
- Do not commit AWS keys, tokens, or passwords.
- Do not bypass CI security checks.
