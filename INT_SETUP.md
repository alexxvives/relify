# INT/Staging Environment Setup

## Overview

This document describes the INT (integration/staging) environment for Relify mobile branch review without affecting production.

## Architecture

**Separation from Production:**
- ✅ Separate Cloudflare Worker: `releva-int` (vs `releva`)
- ✅ Separate database: INT_DATABASE_URL (isolated Neon branch or local Postgres)
- ✅ Separate auth namespace: INT_BETTER_AUTH_SECRET / INT_BETTER_AUTH_URL
- ✅ NO production routes/domains
- ✅ Sandbox Stripe (test mode)
- ✅ Outbound mail disabled by default
- ✅ Prominent INT badge and noindex meta tags
- ✅ No production data cloning
- ✅ Deploy guard prevents accidental production targeting

## Current Status: Configuration Ready, Deployment Blocked

### ✅ Completed

1. **INT Cloudflare Configuration**: `cloudflare.int.config.ts`
   - Worker name: `releva-int`
   - Isolated bindings and secrets
   - INT environment markers

2. **Environment Template**: `.env.int.example`
   - All required INT-specific variables
   - Clear separation from production

3. **Deployment Script**: `scripts/deploy-int.sh`
   - Mandatory INT_ENVIRONMENT=true check
   - Validates INT_DATABASE_URL, INT_BETTER_AUTH_SECRET, INT_BETTER_AUTH_URL
   - Prevents production DB/domain usage (fail-closed validation)
   - Redacted output (masks DB credentials)
   - Human confirmation prompt
   - Wrangler authentication check

4. **Runtime Isolation**: `src/lib/int-env.ts`
   - Fail-closed environment detection
   - INT_ prefixed variables required in INT mode
   - Production variables forbidden in INT mode
   - Validates DB URLs don't contain production indicators
   - Validates auth URLs contain 'int' and no production domains
   - Email disabled by default in INT
   - Stripe forced to test mode in INT
   - Site origin isolation (never falls back to production)

5. **INT Badge & Noindex**: `src/app/layout.tsx`
   - Visible orange INT badge (z-[100])
   - Noindex meta tag in INT mode
   - Title prefix: [INT]

6. **Email Isolation**: `src/server/mailer.ts`
   - Checks isEmailDisabled() before sending
   - Logs but skips email in INT mode

7. **Validation Tests**: `src/lib/int-env.test.ts`
   - 18 negative isolation tests
   - Validates INT variables required
   - Validates production DB/domains rejected
   - Validates email/Stripe isolation
   - All tests passing

### ❌ Missing for Deployment

**Required Credentials** (by name only, not values):

1. **CLOUDFLARE_ACCOUNT_ID**
   - Location: Cloudflare Dashboard → Workers & Pages → Account ID
   - Needed for: `vinext-cloudflare deploy --env int`

2. **CLOUDFLARE_API_TOKEN** or **CLOUDFLARE_ACCOUNT_API_TOKEN**
   - Location: Cloudflare Dashboard → Profile → API Tokens
   - Permissions needed: Workers Scripts (Edit), Account Settings (Read)
   - Scopes: Specific account only

3. **INT_DATABASE_URL**
   - Separate Neon Postgres branch (recommended) OR
   - Local Postgres instance with synthetic data
   - Format: `postgresql://user:pass@host:5432/db_int`
   - Must NOT be production database

4. **INT_BETTER_AUTH_SECRET**
   - Random 32+ character string
   - Must differ from production secret
   - Generate: `openssl rand -base64 32`

5. **INT_BETTER_AUTH_URL**
   - Will be: `https://releva-int.<account>.workers.dev`
   - Set after first deploy confirms worker URL

### Cannot Deploy Until

- [ ] Cloudflare account credentials provided (CLOUDFLARE_ACCOUNT_ID + API_TOKEN)
- [ ] INT database initialized (separate Neon branch or local)
- [ ] INT secrets configured via `wrangler secret put --env int`
- [ ] Deployment tested in isolated account/namespace

## Deployment Approach (When Ready)

### 1. Initialize INT Database

**Option A: Neon Branch (Recommended)**
```bash
# Create INT branch from main
neon branch create --name int-staging --parent main

# Get connection string
neon connection-string int-staging
# Save as INT_DATABASE_URL in .env.int
```

**Option B: Local Postgres**
```bash
# Create INT database
createdb releva_int

# Run migrations
DATABASE_URL="postgresql://releva:releva@localhost:5432/releva_int" \
  npx prisma migrate deploy

# Seed synthetic data
npm run seed:int  # (to be created)
```

### 2. Configure Cloudflare Secrets

```bash
# Set INT-specific secrets (separate from production)
echo "your-int-secret-32-chars" | wrangler secret put INT_BETTER_AUTH_SECRET --env int
echo "postgresql://..." | wrangler secret put INT_DATABASE_URL --env int
echo "https://releva-int.your-account.workers.dev" | wrangler secret put INT_BETTER_AUTH_URL --env int

# Optional: Stripe test key
echo "sk_test_..." | wrangler secret put INT_STRIPE_SECRET_KEY --env int
```

### 3. Deploy INT Worker

```bash
# Run deploy guard
./scripts/deploy-int-guard.sh

# Deploy with INT config
INT_ENVIRONMENT=true \
  npx vinext-cloudflare deploy \
  --config cloudflare.int.config.ts \
  --env int

# Or add to package.json:
# "deploy:int": "INT_ENVIRONMENT=true vinext-cloudflare deploy --config cloudflare.int.config.ts --env int"
```

### 4. Verify INT Deployment

Access: `https://releva-int.<your-account>.workers.dev`

**Expected:**
- INT badge visible in header/footer
- `<meta name="robots" content="noindex,nofollow">`
- Separate auth session (no production login carryover)
- Email disabled (no outbound messages)
- Stripe test mode
- Synthetic data only

### 5. Access Protection (Optional)

If Cloudflare Access or custom auth layer supported:
```bash
# Add Access policy to INT worker
wrangler access policy create \
  --name "INT Access" \
  --application releva-int \
  --decision allow \
  --include email:team@example.com
```

Otherwise: INT is public with synthetic data only.

## INT-Specific Features

### INT Badge

Add to `src/components/app-frame.tsx`:
```tsx
{process.env.INT_ENVIRONMENT === 'true' && (
  <div className="fixed top-2 right-2 z-[100] rounded-md bg-orange-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
    INT
  </div>
)}
```

### Noindex Meta

Add to `src/app/layout.tsx`:
```tsx
export const metadata: Metadata = {
  // ...
  ...(process.env.INT_ENVIRONMENT === 'true' && {
    robots: { index: false, follow: false },
  }),
};
```

### Mail Guard

In `src/server/mailer.ts`:
```ts
if (process.env.EMAIL_DISABLED === 'true') {
  console.log('[INT] Email disabled:', subject, to);
  return { ok: true, message: 'Email disabled in INT' };
}
```

## Database Migrations

**DO NOT run migrations against production DB from INT.**

For INT:
1. Create separate Neon branch: `neon branch create int-staging`
2. Run migrations: `DATABASE_URL=$INT_DATABASE_URL npx prisma migrate deploy`
3. Human approval required for any remote migration

**Local fixtures only**:
- `npm run seed:int` (synthetic accounts, no production data)

## Cost & Service Guards

- Workers: Free tier sufficient for INT (100k requests/day)
- Neon: Free tier branch (separate from production)
- Stripe: Test mode (no charges)
- Email: Disabled (no Maileroo usage)
- External APIs: Optional (can be empty)

**No paid services purchased without approval.**

## Security Notes

1. **Do NOT copy production secrets** to INT
2. **Do NOT clone production data** into INT database
3. **Use synthetic test data only**
4. **INT_DATABASE_URL must be isolated**
5. **Separate auth sessions** (no production login carryover)
6. **No production domains/routes** on INT worker

## Current Readiness: BLOCKED

**Status**: Configuration complete, deployment blocked pending credentials.

**Exact Requirements**:
1. Cloudflare account credentials (ACCOUNT_ID + API_TOKEN)
2. INT database initialized (separate namespace)
3. Wrangler CLI authenticated

**Cannot provide** fake/ready URL until actual deployment verified with authorized credentials.

## Review URL

Once deployed: `https://releva-int.<account>.workers.dev`

Current state: **NOT DEPLOYED** - configuration ready, awaiting credentials and authorization.
