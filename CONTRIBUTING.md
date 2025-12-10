# Contributing to EKS Microservices

Thank you for your interest in contributing to the EKS Microservices project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Code Review Process](#code-review-process)
- [Testing Requirements](#testing-requirements)
- [Pre-commit Hooks and Linting](#pre-commit-hooks-and-linting)
- [Project Board and Tracking](#project-board-and-tracking)
- [Retrospectives](#retrospectives)
- [Code Owners](#code-owners)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## Getting Started

### Prerequisites

- Docker and Docker Compose
- kubectl configured for EKS
- AWS CLI configured
- Python 3.9+ (for backend services)
- Node.js 18+ (for frontend)

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/eks-microservices.git
   cd eks-microservices
   ```

3. Set up pre-commit hooks:
   ```bash
   pip install pre-commit
   pre-commit install
   ```

4. Start local development:
   ```bash
   docker-compose up -d
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `dev` - Development branch (triggers CI/CD)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Urgent production fixes

### Creating a Branch

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b bugfix/issue-number-description

# For hotfixes
git checkout -b hotfix/critical-fix
```

### Branch Naming Convention

- Use lowercase and hyphens
- Prefix with type: `feature/`, `bugfix/`, `hotfix/`
- Reference issue number if applicable: `feature/123-add-user-auth`
- Be descriptive: `bugfix/456-fix-inventory-calculation`

## Commit Guidelines

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `perf`: Performance improvements

### Examples

```bash
# Feature with issue reference
feat(products-api): add product search functionality

Closes #123

# Bug fix
fix(orders-api): resolve inventory deduction race condition

Fixes #456

# Documentation
docs: update CI/CD setup instructions

# CI/CD changes
ci: add pre-commit hooks for Python linting
```

### Commit Best Practices

1. **Reference Issues**: Always reference related issues in commit messages
   ```bash
   git commit -m "feat(api): add user authentication

   Implements JWT-based authentication for all microservices.
   Includes token refresh mechanism and role-based access control.

   Closes #123
   Related to #124"
   ```

2. **Atomic Commits**: Make small, focused commits
3. **Write Clear Messages**: Explain what and why, not how
4. **Test Before Committing**: Ensure all tests pass locally

## Pull Request Process

### Before Submitting a PR

1. **Update Documentation**: Update README, API docs, or other relevant docs
2. **Add Tests**: Include tests for new features or bug fixes
3. **Run Linters**: Ensure all linting checks pass
4. **Update CHANGELOG**: Add entry if applicable
5. **Link Issues**: Reference related issues in PR description

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated and passing
- [ ] No new warnings generated
- [ ] All CI checks passing
- [ ] Issue(s) referenced in PR description
- [ ] Branch is up to date with target branch

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123
Related to #456

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests passing
- [ ] CI checks passing
```

### PR Review Process

1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one approval from CODEOWNERS required
3. **Address Feedback**: Respond to all review comments
4. **Squash and Merge**: PRs are squashed when merged (unless otherwise specified)

### PR Labels

- `bug` - Bug fix
- `feature` - New feature
- `documentation` - Documentation changes
- `enhancement` - Enhancement to existing feature
- `refactor` - Code refactoring
- `ci/cd` - CI/CD changes
- `dependencies` - Dependency updates
- `ready-for-review` - Ready for code review
- `work-in-progress` - Still in development
- `blocked` - Blocked by external dependency

## Issue Reporting

### Bug Reports

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs if applicable

### Feature Requests

Use the feature request template and include:
- Clear description of the feature
- Use case and motivation
- Proposed solution (if any)
- Alternatives considered

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `question` - Further information needed
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority

## Code Review Process

### For Authors

1. **Be Responsive**: Respond to review comments promptly
2. **Be Open**: Accept constructive feedback
3. **Explain Decisions**: Provide context for complex changes
4. **Keep PRs Small**: Easier to review and merge

### For Reviewers

1. **Be Constructive**: Provide actionable feedback
2. **Be Timely**: Review within 24-48 hours
3. **Be Thorough**: Check logic, style, tests, and docs
4. **Approve When Ready**: Don't block on minor issues

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Logic is correct and efficient
- [ ] Tests are adequate
- [ ] Documentation is updated
- [ ] No security concerns
- [ ] Performance considerations addressed

## Testing Requirements

### Unit Tests

- All new features must include unit tests
- Aim for >80% code coverage
- Run tests before committing:
  ```bash
  # Backend services
  cd backend/products-api
  pytest
  
  # Frontend
  cd frontend
  npm test
  ```

### Integration Tests

- Include integration tests for API endpoints
- Test service interactions
- Test database operations

### Manual Testing

- Test in local environment
- Test in dev environment before merging
- Document test scenarios in PR

## Pre-commit Hooks and Linting

### Pre-commit Setup

We use [pre-commit](https://pre-commit.com/) to ensure code quality:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Linting Checks

The following checks run automatically:

- **Python**: `black`, `flake8`, `pylint`, `mypy`
- **JavaScript/TypeScript**: `eslint`, `prettier`
- **YAML**: `yamllint`
- **Docker**: `hadolint`
- **General**: `trailing-whitespace`, `end-of-file-fixer`, `check-yaml`

### Passing Lint Checks

All lint checks must pass before PR can be merged:

```bash
# Run all checks
pre-commit run --all-files

# Run specific check
pre-commit run flake8 --all-files
```

### CI/CD Linting

GitHub Actions will also run linting:
- Failing lint checks will block PR merge
- Check Actions tab for detailed error messages

## Project Board and Tracking

### Project Board

We use GitHub Projects to track work:

- **Backlog**: Ideas and future work
- **To Do**: Ready to start
- **In Progress**: Currently being worked on
- **In Review**: PR submitted, awaiting review
- **Done**: Merged and deployed

### Linking Work

- Link PRs to issues: `Closes #123`
- Link commits to issues: `feat: add feature (#123)`
- Update project board cards when status changes

### Progress Tracking

- Update issue status regularly
- Move cards on project board
- Add comments with progress updates

## Retrospectives

### Retrospective Schedule

- **Sprint Retrospectives**: End of each sprint (2 weeks)
- **Release Retrospectives**: After major releases
- **Ad-hoc Retrospectives**: After incidents or major changes

### Retrospective Format

1. **What Went Well**: Celebrate successes
2. **What Could Improve**: Identify pain points
3. **Action Items**: Create concrete improvement tasks

### Improvement Items

Each retrospective should identify at least 3 improvement items:

1. **Technical Improvements**: Code quality, architecture, tooling
2. **Process Improvements**: Workflow, communication, documentation
3. **Team Improvements**: Collaboration, skills, knowledge sharing

### Example Retrospective Output

```markdown
## Sprint Retrospective - Week of [Date]

### What Went Well
- Successfully implemented CI/CD pipeline
- Improved test coverage to 85%
- Reduced deployment time by 40%

### What Could Improve
- Code review turnaround time
- Documentation for new contributors
- Error handling in API responses

### Action Items
1. [ ] Set up code review SLA (24 hours)
2. [ ] Create contributor onboarding guide
3. [ ] Add comprehensive error handling middleware
4. [ ] Improve logging and monitoring
5. [ ] Automate dependency updates
```

### Tracking Improvements

- Create issues for each improvement item
- Add to project board
- Assign owners and set deadlines
- Review progress in next retrospective

## Code Owners

The `CODEOWNERS` file defines who must review changes to specific parts of the codebase.

### Review Requirements

- Changes to `CODEOWNERS` require approval from repository admins
- Changes to CI/CD require approval from DevOps team
- Changes to infrastructure require approval from platform team
- All other changes require approval from at least one code owner

### Becoming a Code Owner

Code owners are trusted contributors who:
- Have made significant contributions
- Understand the codebase deeply
- Are committed to maintaining code quality
- Are available for code reviews

## Additional Resources

- [Project Documentation](./README.md)
- [CI/CD Setup Guide](./CICD_SETUP.md)
- [API Documentation](./docs/api.md)
- [Architecture Overview](./docs/architecture.md)

## Getting Help

- Open an issue for questions
- Tag `@codeowners` for urgent matters
- Check existing issues/PRs for similar questions
- Review documentation first

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in team meetings

Thank you for contributing to EKS Microservices! 🚀

