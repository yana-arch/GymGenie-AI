#!/bin/bash

# Scheduled cleanup script
# Run this weekly/monthly for automated cleanup reports

set -e

REPORT_DIR="reports/scheduled"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🧹 Starting scheduled cleanup analysis..."
echo "Timestamp: $TIMESTAMP"

# Create report directory
mkdir -p "$REPORT_DIR"

# Run full analysis
echo "Running full analysis..."
npm run cleanup:analyze

# Generate comprehensive report
echo "Generating report..."
npm run cleanup:report

# Calculate metrics
echo "Calculating metrics..."
npm run cleanup:metrics

# Copy reports to scheduled directory
cp reports/analysis-report.md "$REPORT_DIR/analysis-$TIMESTAMP.md"
cp reports/cleanup-report.html "$REPORT_DIR/cleanup-$TIMESTAMP.html"
cp reports/cleanup-report.json "$REPORT_DIR/cleanup-$TIMESTAMP.json"

echo "✅ Scheduled cleanup complete!"
echo "Reports saved to: $REPORT_DIR"

# Optional: Send notification (email, Slack, etc.)
# Uncomment and configure as needed
# curl -X POST -H 'Content-type: application/json' \
#   --data "{\"text\":\"Weekly cleanup report generated: $TIMESTAMP\"}" \
#   $SLACK_WEBHOOK_URL

# Optional: Commit reports to git
# git add "$REPORT_DIR"
# git commit -m "chore: add scheduled cleanup report $TIMESTAMP"
# git push

echo "📊 Summary:"
echo "  - Analysis report: $REPORT_DIR/analysis-$TIMESTAMP.md"
echo "  - Cleanup report: $REPORT_DIR/cleanup-$TIMESTAMP.html"
echo "  - JSON data: $REPORT_DIR/cleanup-$TIMESTAMP.json"
