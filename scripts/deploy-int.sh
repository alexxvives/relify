#!/bin/bash
set -euo pipefail

echo "🚀 INT Deployment Script"
echo "======================="
echo ""

# Mandatory environment check
if [ "${INT_ENVIRONMENT:-}" != "true" ]; then
  echo "❌ ERROR: INT_ENVIRONMENT must be set to 'true'"
  echo "Usage: INT_ENVIRONMENT=true ./scripts/deploy-int.sh"
  exit 1
fi

# Check required INT variables (redacted output)
echo "🔍 Validating INT environment variables..."

if [ -z "${INT_DATABASE_URL:-}" ]; then
  echo "❌ ERROR: INT_DATABASE_URL not set"
  echo "Set via: export INT_DATABASE_URL=postgresql://..."
  exit 1
fi

if [ -z "${INT_BETTER_AUTH_SECRET:-}" ]; then
  echo "❌ ERROR: INT_BETTER_AUTH_SECRET not set"
  echo "Generate: openssl rand -base64 32"
  exit 1
fi

if [ -z "${INT_BETTER_AUTH_URL:-}" ]; then
  echo "❌ ERROR: INT_BETTER_AUTH_URL not set"
  echo "Set after first deploy: https://releva-int.<account>.workers.dev"
  exit 1
fi

# Validate DB URL doesn't contain production indicators
if echo "$INT_DATABASE_URL" | grep -qiE "releva\..*\.neon|itsreleva|itsrelify|releva\.com"; then
  echo "❌ ERROR: INT_DATABASE_URL appears to point to production"
  echo "INT must use isolated database (separate Neon branch or local)"
  exit 1
fi

# Validate auth URL contains 'int' and NOT production domains
if ! echo "$INT_BETTER_AUTH_URL" | grep -qi "int"; then
  echo "❌ ERROR: INT_BETTER_AUTH_URL must contain 'int'"
  exit 1
fi

if echo "$INT_BETTER_AUTH_URL" | grep -qiE "itsreleva\.com|itsrelify\.com|releva\.com"; then
  echo "❌ ERROR: INT_BETTER_AUTH_URL must NOT use production domains"
  exit 1
fi

# Redacted output (show only prefix/host)
echo "✅ INT_DATABASE_URL: ${INT_DATABASE_URL%%@*}@***"
echo "✅ INT_BETTER_AUTH_URL: $INT_BETTER_AUTH_URL"
echo "✅ INT_BETTER_AUTH_SECRET: *** (set)"
echo ""

# Check Prisma migrations status (DO NOT run db push)
echo "📊 Checking database schema..."
echo "⚠️  Migrations must be run manually with human approval"
echo "   npx prisma migrate deploy --schema prisma/schema.prisma"
echo ""

# Check wrangler authentication
if ! command -v wrangler &> /dev/null; then
  echo "❌ ERROR: wrangler CLI not found"
  echo "Install: npm install -g wrangler"
  exit 1
fi

echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
  echo "❌ ERROR: wrangler not authenticated"
  echo "Login: wrangler login"
  exit 1
fi

echo "✅ Wrangler authenticated"
echo ""

# Build check
echo "🔨 Running build check..."
if ! npm run build &> /dev/null; then
  echo "❌ ERROR: Build failed"
  echo "Run: npm run build"
  exit 1
fi
echo "✅ Build passed"
echo ""

# Confirmation prompt
echo "🎯 Ready to deploy INT worker: releva-int"
echo ""
echo "Target configuration:"
echo "  - Worker: releva-int"
echo "  - Config: cloudflare.int.config.ts"
echo "  - Environment: int"
echo "  - Database: ${INT_DATABASE_URL%%@*}@***"
echo "  - Auth URL: $INT_BETTER_AUTH_URL"
echo ""
read -p "Deploy to INT? (yes/NO) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# Deploy
echo "🚀 Deploying to INT..."
npx vinext-cloudflare deploy --config cloudflare.int.config.ts --env int

echo ""
echo "✅ INT deployment complete"
echo "🌐 Review URL: Check wrangler output for workers.dev URL"
echo "🔍 Verify INT badge visible, noindex meta tag present"
echo "📧 Email disabled by default in INT"
echo "💳 Stripe in test mode only"
echo ""
