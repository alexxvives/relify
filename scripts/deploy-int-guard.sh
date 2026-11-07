#!/bin/bash
set -e

echo "🔒 INT Deployment Guard"
echo "======================="
echo ""

# Check we're not accidentally targeting production
if [ -z "$INT_ENVIRONMENT" ] || [ "$INT_ENVIRONMENT" != "true" ]; then
  echo "❌ ERROR: INT_ENVIRONMENT not set to 'true'"
  echo "This script must only be used for INT/staging deployments."
  exit 1
fi

# Check DATABASE_URL doesn't point to production
if [ -n "$INT_DATABASE_URL" ]; then
  if echo "$INT_DATABASE_URL" | grep -q "releva@"; then
    echo "⚠️  WARNING: INT_DATABASE_URL contains 'releva@' (possible production DB)"
    echo "INT must use a separate database namespace."
    echo "Current: $INT_DATABASE_URL"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
else
  echo "❌ ERROR: INT_DATABASE_URL not set"
  echo "INT deployment requires a separate database."
  exit 1
fi

# Check BETTER_AUTH_URL points to INT worker
if [ -n "$INT_BETTER_AUTH_URL" ]; then
  if echo "$INT_BETTER_AUTH_URL" | grep -qv "int"; then
    echo "⚠️  WARNING: INT_BETTER_AUTH_URL doesn't contain 'int'"
    echo "Current: $INT_BETTER_AUTH_URL"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
else
  echo "❌ ERROR: INT_BETTER_AUTH_URL not set"
  exit 1
fi

# Check not deploying to production domain
if [ -n "$DEPLOY_DOMAIN" ] && echo "$DEPLOY_DOMAIN" | grep -qE "itsreleva.com|relify.com"; then
  echo "❌ ERROR: DEPLOY_DOMAIN points to production domain"
  echo "Current: $DEPLOY_DOMAIN"
  echo "INT must NOT use production domains."
  exit 1
fi

echo "✅ Pre-deployment checks passed"
echo ""
echo "Target: releva-int worker"
echo "Database: $INT_DATABASE_URL"
echo "Auth URL: $INT_BETTER_AUTH_URL"
echo ""
