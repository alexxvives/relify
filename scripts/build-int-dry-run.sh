#!/usr/bin/env bash
# INT build dry-run: credential-free worker metadata inspection
set -euo pipefail

echo ""
echo "====================================="
echo "INT Build Dry-Run (Credential-Free)"
echo "====================================="
echo ""

# Set minimal INT environment for build (no real secrets)
export INT_ENVIRONMENT="true"
export INT_DATABASE_URL="postgresql://user:pass@localhost:5432/int"
export INT_BETTER_AUTH_SECRET="dry-run-secret-32-chars-min-1"
export INT_BETTER_AUTH_URL="https://releva-int.example.workers.dev"
export DATABASE_URL="$INT_DATABASE_URL"
export BETTER_AUTH_SECRET="$INT_BETTER_AUTH_SECRET"
export BETTER_AUTH_URL="$INT_BETTER_AUTH_URL"

echo "Build environment:"
echo "  INT_ENVIRONMENT: true"
echo "  DATABASE_URL: [dry-run]"
echo "  BETTER_AUTH_URL: [dry-run]"
echo ""

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate --quiet
echo ""

# Build with vinext
echo "Building INT worker..."
npm run build:vinext 2>&1 | grep -E "(Building|Built|Error|Warning)" || true
echo ""

# Inspect generated worker metadata
if [ -f "dist/worker/index.js" ]; then
  echo "✅ Worker bundle built: dist/worker/index.js"
  BUNDLE_SIZE=$(du -h dist/worker/index.js | cut -f1)
  echo "   Size: $BUNDLE_SIZE"
else
  echo "❌ Worker bundle not found: dist/worker/index.js"
fi
echo ""

# Check for wrangler.toml or generated config
if [ -f "wrangler.toml" ]; then
  echo "Worker configuration (wrangler.toml):"
  grep -E "^name|^route|^\\[env" wrangler.toml || echo "  (no routes configured)"
else
  echo "ℹ️  No wrangler.toml found (expected for vinext)"
fi
echo ""

# Look for cloudflare config
if [ -f "cloudflare.int.config.ts" ]; then
  echo "INT config file: cloudflare.int.config.ts"
  grep -E "worker:|name:|route:|binding:" cloudflare.int.config.ts | head -10 || true
fi
echo ""

echo "====================================="
echo "Dry-Run Complete"
echo "====================================="
echo ""
echo "Next steps:"
echo "  1. Review worker name/routes in cloudflare.int.config.ts"
echo "  2. Run database migration MANUALLY: npx prisma db push"
echo "  3. Deploy with real secrets: ./scripts/deploy-int.sh"
echo ""
