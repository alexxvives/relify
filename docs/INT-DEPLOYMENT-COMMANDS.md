# INT Deployment Commands & Requirements

**Target**: RELEVA-INT (independent Neon project, NOT production branch)  
**Status**: Code ready, awaiting provisioning

## Prerequisites Configuration

### 1. Neon Project Setup

**Required**: Empty independent Neon project named "RELEVA-INT"

```bash
# Via Neon Dashboard:
# 1. Create new project → name: RELEVA-INT
# 2. Do NOT fork/branch from production
# 3. Copy connection string

# Expected format:
# postgresql://user:pass@ep-xxxxx-xxxx.us-east-2.aws.neon.tech/releva?sslmode=require
```

### 2. Environment Secrets

Configure via Cursor Cloud Agent Secrets (repo-scoped):

```bash
INT_ENVIRONMENT=true
INT_DATABASE_URL=postgresql://...@ep-xxxxx.us-east-2.aws.neon.tech/releva?sslmode=require
INT_APPROVED_DB_HOST=ep-xxxxx.us-east-2.aws.neon.tech:5432
INT_BETTER_AUTH_SECRET=<generate-with-openssl-rand-hex-32>
INT_BETTER_AUTH_URL=https://releva-int.<account>.workers.dev
```

**Generate AUTH_SECRET**:
```bash
openssl rand -hex 32
```

**Note**: Do NOT commit secrets or paste into chat. Configure via Cursor Dashboard only.

### 3. Cloudflare Authentication

**Deploy Tool**: `vinext-cloudflare` (installed)

**Auth Required**: Cloudflare account credentials

**Worker Name**: `releva-int`

**Expected URL**: `https://releva-int.<account>.workers.dev`

## Deployment Steps

### Step 1: Verify Environment

```bash
# Check INT guards operational
npm run verify:int
```

Expected output:
- ✓ INT mode detected
- ✓ Database URL validated
- ✓ Uploads blocked
- ✓ Email blocked
- ✓ Payments blocked
- ✓ External APIs blocked
- ✓ Webhooks blocked

### Step 2: Run Manual Migration

**CRITICAL**: Review schema before applying

```bash
# Dry-run to review changes
npx prisma db push --dry-run

# If approved, apply migration
npx prisma db push
```

### Step 3: Seed Test Data

```bash
# Generate synthetic fixtures
npm run seed:int
```

Creates:
- 5 test users (buyer, advisor, 2 sellers, admin)
- 2 projects (1 with SABI fixture, 1 manual)
- Buyer NDA relationships (pre-NDA + accepted)
- Advisor mandate
- Access credentials file (chmod 600)

**Output**: `/opt/cursor/artifacts/relify-int-test-access.txt`

### Step 4: Set User Passwords

Passwords NOT set by seed (security). Two options:

**Option A: Via App (recommended)**
1. Visit INT site
2. Click "¿Olvidaste tu contraseña?"
3. Enter test email
4. Check deploy logs for reset link (email disabled in INT)
5. Set password

**Option B: Via SQL**
```sql
-- Connect to INT database first
UPDATE "user" 
SET password = crypt('your-password-here', gen_salt('bf'))
WHERE email LIKE 'int-%@test.local';
```

### Step 5: Build Verification

```bash
# Credential-free dry-run
./scripts/build-int-dry-run.sh
```

Verifies:
- Worker bundle builds successfully
- No credential leaks in output
- Configuration valid
- Worker name correct (`releva-int`)

### Step 6: Deploy

```bash
# Deploy to Cloudflare Workers
./scripts/deploy-int.sh
```

**Prompts**:
1. Confirm INT_DATABASE_URL configured
2. Confirm manual migration completed
3. Confirm worker name `releva-int`

**Deployment command** (executed by script):
```bash
npx vinext-cloudflare deploy --config cloudflare.int.config.ts --env int
```

## Post-Deployment Verification

### 1. Visual Checks

Visit deployed INT site:

- [ ] Yellow "INT" badge visible (top-right corner)
- [ ] Page source contains `<meta name="robots" content="noindex, nofollow">`
- [ ] No production data visible
- [ ] Synthetic project listings appear

### 2. Authentication Test

- [ ] Login with test credentials from access file
- [ ] Each role (buyer, advisor, seller, admin) can sign in
- [ ] Dashboard loads correctly per role

### 3. Guard Verification

**Email Block**:
```bash
# Attempt password reset
# Check deploy logs for: "[mail] INT BLOCKED"
```

**Upload Block**:
- Try document upload → should fail with "disabled in INT"

**Payment Block**:
- Try checkout → should fail with "disabled in INT"

### 4. Data Integrity

**Buyer Pre-NDA**:
- Login as buyer
- View "Empresa Tecnología" project
- Verify confidential fields NOT visible

**Buyer Accepted NDA**:
- View "Consultoría Servicios" project
- Verify full details visible

**Seller with SABI**:
- Login as seller-sabi
- View own project
- Verify synthetic SABI data appears

**Seller Manual**:
- Login as seller-manual
- View own project
- No SABI section

**Advisor Mandate**:
- Login as advisor
- View mandates
- "Empresa Tecnología" listed

## Runtime Commands

### Check Deployment Status
```bash
# Via Cloudflare dashboard or wrangler
npx wrangler deployments list --name releva-int
```

### View Logs
```bash
npx wrangler tail releva-int
```

### Re-Seed (Idempotent)
```bash
# Safe to re-run
npm run seed:int
```

### Update Code
```bash
# After code changes:
npm run typecheck
npm run lint
npm test
./scripts/deploy-int.sh
```

## Rollback

If deployment fails or issues found:

```bash
# Rollback via Cloudflare dashboard:
# Workers → releva-int → Deployments → Rollback to previous

# OR redeploy previous commit:
git checkout <previous-commit>
./scripts/deploy-int.sh
```

## Authentication Requirements Summary

**For Deployment**:
- Cloudflare account credentials (for vinext-cloudflare)
- INT_DATABASE_URL (Neon connection string)
- INT_BETTER_AUTH_SECRET (32+ char secret)
- INT_APPROVED_DB_HOST (Neon endpoint host:port)

**Not Required**:
- External API keys (EInforma, ApiEmpresas, Context7) - blocked in INT
- Email service credentials (Maileroo) - blocked in INT
- Stripe live keys - blocked in INT (test mode only if enabled)
- Production database access - forbidden

## Current Connector Status

**Cloud Agent Connector**: Reads secrets, cannot deploy directly

**Deploy Method**: Agent executes `./scripts/deploy-int.sh` via Shell tool

**Required Permissions**:
- Read: INT_* secrets from Cursor Cloud Agent Secrets
- Write: Deploy via vinext-cloudflare to Cloudflare Workers

## Safety Constraints

**Enforced**:
- Cannot run against production database
- Cannot access production secrets
- No remote migration inside deploy script
- All external operations blocked by default

**Verified**:
- ✅ Zero credential logging
- ✅ Exact database resource validation
- ✅ Fail-closed upload/email/payment/API guards
- ✅ Synthetic seed with no production data
- ✅ Manual migration approval required

## Next Steps After Deployment

1. **Share INT URL** with user for review
2. **Verify all role flows** (buyer, seller, advisor, admin)
3. **Test edge cases** (NDA workflows, document uploads blocked, etc.)
4. **Monitor logs** for unexpected errors
5. **Iterate** based on feedback

## Support

**Documentation**:
- Setup: `docs/INT-SETUP.md`
- Safety Fixes: `docs/INT-SAFETY-FIXES.md`
- Status: `docs/INT-DEPLOYMENT-STATUS.md`

**Scripts**:
- Verify: `scripts/verify-int-runtime.ts`
- Seed: `scripts/seed-int-simple.ts`
- Dry-run: `scripts/build-int-dry-run.sh`
- Deploy: `scripts/deploy-int.sh`
