# Integration Scripts

This directory contains scripts for integrating the code cleanup system into your development workflow.

## Available Scripts

### 1. Pre-commit Analysis (`pre-commit-analysis.sh`)

Runs quick code analysis on staged files before each commit.

**Features:**

- ESLint checks on staged files
- Quick dead code detection
- Unused import checks

**Setup:**

```bash
npm run setup:hooks
```

**Manual run:**

```bash
./scripts/pre-commit-analysis.sh
```

**Bypass (when needed):**

```bash
git commit --no-verify
```

### 2. CI/CD Integration (`ci-analysis.yml`)

GitHub Actions workflow for automated code analysis.

**Setup:**

1. Copy to `.github/workflows/code-analysis.yml`
2. Commit and push to repository
3. Workflow will run automatically on push/PR

**Features:**

- Runs on push to main/develop branches
- Runs on pull requests
- Scheduled weekly analysis (Monday 9 AM)
- Uploads analysis reports as artifacts
- Comments PR with analysis results

**Triggers:**

- Push to main/develop
- Pull request
- Weekly schedule (configurable)
- Manual workflow dispatch

### 3. Scheduled Cleanup (`scheduled-cleanup.sh`)

Generates comprehensive cleanup reports on a schedule.

**Usage:**

```bash
npm run scheduled:cleanup
```

**Features:**

- Full code analysis
- Comprehensive report generation
- Quality metrics calculation
- Timestamped report archiving

**Setup with cron:**

```bash
# Edit crontab
crontab -e

# Add weekly cleanup (every Monday at 9 AM)
0 9 * * 1 cd /path/to/project && npm run scheduled:cleanup

# Or monthly cleanup (first day of month at 9 AM)
0 9 1 * * cd /path/to/project && npm run scheduled:cleanup
```

### 4. Git Hooks Setup (`setup-git-hooks.sh`)

Installs git hooks for automated code analysis.

**Usage:**

```bash
npm run setup:hooks
```

**Installed hooks:**

- `pre-commit`: Runs analysis on staged files

## Integration Patterns

### Local Development

```bash
# One-time setup
npm run setup:hooks

# Now hooks run automatically on commit
git add .
git commit -m "feat: add new feature"
# Pre-commit analysis runs automatically
```

### CI/CD Pipeline

```yaml
# .github/workflows/code-analysis.yml
name: Code Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run cleanup:analyze
      - run: npm run cleanup:report
```

### Scheduled Reports

```bash
# Weekly cleanup report
0 9 * * 1 npm run scheduled:cleanup

# Monthly comprehensive analysis
0 9 1 * * npm run cleanup:analyze && npm run cleanup:report
```

## Configuration

### Pre-commit Hook

Edit `scripts/pre-commit-analysis.sh` to customize:

- File patterns to analyze
- Analysis tools to run
- Exit conditions

### CI/CD Workflow

Edit `scripts/ci-analysis.yml` to customize:

- Trigger conditions
- Analysis steps
- Report formats
- Notification methods

### Scheduled Cleanup

Edit `scripts/scheduled-cleanup.sh` to customize:

- Report directory
- Analysis depth
- Notification methods (Slack, email, etc.)

## Best Practices

1. **Start with pre-commit hooks**: Catch issues early
2. **Enable CI/CD analysis**: Automated checks on every PR
3. **Schedule regular cleanups**: Weekly or monthly comprehensive analysis
4. **Review reports regularly**: Don't let them accumulate
5. **Act on findings**: Use reports to guide cleanup efforts

## Troubleshooting

### Pre-commit hook not running

```bash
# Check if hook is executable
ls -la .git/hooks/pre-commit

# Re-run setup
npm run setup:hooks
```

### CI/CD workflow not triggering

- Check workflow file location: `.github/workflows/code-analysis.yml`
- Verify branch names match your repository
- Check GitHub Actions permissions

### Scheduled cleanup failing

```bash
# Test manually first
npm run scheduled:cleanup

# Check script permissions
chmod +x scripts/scheduled-cleanup.sh

# Verify cron syntax
crontab -l
```

## Notifications

### Slack Integration

Add to `scheduled-cleanup.sh`:

```bash
# Send Slack notification
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"Weekly cleanup report: $TIMESTAMP\"}" \
  $SLACK_WEBHOOK_URL
```

### Email Notifications

Add to `scheduled-cleanup.sh`:

```bash
# Send email
echo "Cleanup report attached" | \
  mail -s "Weekly Cleanup Report" \
  -a "$REPORT_DIR/cleanup-$TIMESTAMP.html" \
  team@example.com
```

## Maintenance

- Review and update scripts quarterly
- Adjust analysis thresholds as needed
- Update CI/CD workflow with new tools
- Archive old reports periodically

## Support

For issues or questions:

1. Check script logs
2. Review configuration
3. Consult main documentation
4. Open an issue in the repository
