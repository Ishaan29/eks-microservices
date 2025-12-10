# Project Board Guide

This document explains how to use GitHub Projects to track work and progress.

## Project Board Setup

### Creating a Project Board

1. Go to your repository
2. Click on "Projects" tab
3. Click "New project"
4. Choose "Board" template
5. Name it (e.g., "EKS Microservices Development")

### Board Columns

Recommended column structure:

1. **Backlog** - Ideas and future work
2. **To Do** - Ready to start, prioritized
3. **In Progress** - Currently being worked on
4. **In Review** - PR submitted, awaiting review
5. **Testing** - In testing/QA phase
6. **Done** - Merged and deployed

## Using the Project Board

### Adding Issues to Board

1. Create an issue using templates
2. Add appropriate labels
3. Issue automatically appears in "To Do" column
4. Drag to appropriate column as work progresses

### Linking PRs to Issues

In your PR description, use keywords:
- `Closes #123` - Automatically closes issue when PR merges
- `Fixes #456` - Links PR to issue
- `Related to #789` - Links without closing

### Moving Cards

- **To Do → In Progress**: When you start working
- **In Progress → In Review**: When PR is submitted
- **In Review → Testing**: When PR is approved and ready for testing
- **Testing → Done**: When merged and deployed

### Card Information

Each card should include:
- Issue/PR number
- Title
- Labels
- Assignee
- Milestone (if applicable)
- Due date (if applicable)

## Tracking Progress

### Weekly Updates

- Review board at start of week
- Move cards as work progresses
- Update card descriptions with progress notes
- Add comments to cards with updates

### Sprint Planning

- Move items from Backlog to To Do
- Assign owners
- Set priorities
- Estimate effort (if using story points)

### Sprint Review

- Review completed items
- Move completed items to Done
- Identify blockers
- Update status of in-progress items

## Labels for Organization

### Type Labels
- `bug` - Bug fix
- `feature` - New feature
- `documentation` - Docs update
- `enhancement` - Enhancement
- `refactor` - Code refactoring

### Priority Labels
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority

### Status Labels
- `ready-for-review` - Ready for review
- `work-in-progress` - In progress
- `blocked` - Blocked
- `needs-triage` - Needs review

### Component Labels
- `products-api` - Products service
- `orders-api` - Orders service
- `inventory-api` - Inventory service
- `frontend` - Frontend
- `infrastructure` - Infrastructure
- `ci/cd` - CI/CD

## Exporting Project Board

### Screenshot Method

1. Navigate to your project board
2. Take a screenshot of the full board
3. Save with descriptive filename: `project-board-YYYY-MM-DD.png`

### Export via API

```bash
# Get project board data via GitHub API
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/projects
```

### Manual Export

1. Go to project board
2. Copy card information
3. Document in markdown format
4. Include in retrospective or status report

## Project Board Best Practices

1. **Keep it Updated**: Move cards as work progresses
2. **Use Labels**: Organize with consistent labels
3. **Link Work**: Always link PRs to issues
4. **Regular Reviews**: Review board in team meetings
5. **Clear Titles**: Use descriptive card titles
6. **Assign Owners**: Always assign cards to team members
7. **Set Priorities**: Use priority labels
8. **Track Blockers**: Mark blocked items clearly

## Example Board State

```
Backlog (5 items)
├── Feature: User authentication (#45)
├── Enhancement: Improve search (#67)
└── ...

To Do (3 items)
├── Bug: Fix inventory calculation (#89) [priority: high]
├── Feature: Add product reviews (#34) [priority: medium]
└── Docs: Update API docs (#12) [priority: low]

In Progress (2 items)
├── Feature: Payment integration (#56) [@developer1]
└── Bug: Fix order status (#78) [@developer2]

In Review (1 item)
└── Feature: Shopping cart (#23) [@developer3]

Done (10 items)
└── ...
```

## Integration with CI/CD

The project board can be integrated with CI/CD:
- Auto-move cards when PRs are created
- Auto-move to Done when PRs are merged
- Use GitHub Actions for automation

## Reporting

### Weekly Status Report

Include:
- Items completed this week
- Items in progress
- Blockers
- Next week's priorities
- Board screenshot

### Sprint Report

Include:
- Sprint goal
- Items completed
- Items carried over
- Velocity metrics
- Board export

