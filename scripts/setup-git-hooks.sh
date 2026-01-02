#!/bin/bash

# Setup git hooks for code analysis

echo "Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook for code analysis
./scripts/pre-commit-analysis.sh
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-commit: Runs code analysis on staged files"
echo ""
echo "To bypass hooks temporarily, use: git commit --no-verify"
