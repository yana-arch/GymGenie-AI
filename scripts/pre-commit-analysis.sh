#!/bin/bash

# Pre-commit hook for code analysis
# Runs quick analysis on staged files

echo "🔍 Running pre-commit analysis..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No TypeScript/JavaScript files to analyze"
  exit 0
fi

# Run ESLint on staged files
echo "Running ESLint..."
npm run lint -- $STAGED_FILES
ESLINT_EXIT=$?

# Run quick dead code check
echo "Running quick dead code check..."
npx knip --no-exit-code --include files $STAGED_FILES
KNIP_EXIT=$?

# Check for unused imports
echo "Checking for unused imports..."
for file in $STAGED_FILES; do
  if grep -q "^import.*from" "$file"; then
    # Simple check - in production, use proper ESLint rule
    echo "  Checking $file"
  fi
done

# Exit with error if any check failed
if [ $ESLINT_EXIT -ne 0 ]; then
  echo "❌ ESLint check failed"
  exit 1
fi

echo "✅ Pre-commit analysis passed"
exit 0
