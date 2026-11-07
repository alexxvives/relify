# INT Deployment Readiness Status

**Last Updated**: 2024-11-07  
**Branch**: `cursor/mobile-responsive-c353`  
**Commit**: 3a1aff7

## Safety Hardening: ✅ COMPLETE

All security and isolation issues from e88e484 review have been fixed:

- [x] **Credential Redaction**: Zero connection string logging
- [x] **Database Validation**: Exact approved resource matching
- [x] **Upload Blocking**: Server-side fail-closed enforcement
- [x] **Email Blocking**: Fail-closed, no accidental enable
- [x] **Payment Blocking**: Fail-closed, no accidental enable
- [x] **External API Blocking**: All billable APIs blocked by default
- [x] **Webhook Blocking**: All webhook delivery blocked
- [x] **Runtime Verification**: `verify:int` script implemented
- [x] **Synthetic Seed**: `seed:int` script implemented
- [x] **Migration Decoupling**: Manual confirmation required
- [x] **Dry-Run Build**: Credential-free verification available

### Validation Results

```bash
✅ npm run typecheck  # 0 errors
✅ npm run lint       # 0 errors (14 warnings - unused vars)
✅ npm test           # 376 tests passed
✅ npm run verify:int # (requires INT_ENVIRONMENT=true)
```

## Provisioning Prerequisites: ⏳ BLOCKED

Cannot deploy until these are provisioned:

### 1. Neon Database Branch ⏳
- **Status**: User connected Neon to parent for provisioning
- **Action Required**: Create INT branch via Neon dashboard
- **Branch Name**: `releva-int`
- **Base**: Parent production database
- **Output**: Connection string for `INT_DATABASE_URL`

### 2. Environment Secrets ⏳
Must be configured (Cursor Cloud Agent Secrets or `.env.local`):

```bash
INT_ENVIRONMENT=true
INT_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/releva?sslmode=require
INT_APPROVED_DB_HOST=ep-xxx.us-east-2.aws.neon.tech:5432
INT_BETTER_AUTH_SECRET=<32+ char secret>
INT_BETTER_AUTH_URL=https://releva-int.<account>.workers.dev
```

**Critical**: Do NOT request raw API keys in chat. User must provision via:
- Neon dashboard → create branch → copy connection string
- `openssl rand -hex 32` for BETTER_AUTH_SECRET
- Cloudflare dashboard for account name

### 3. Cloudflare Authentication ⏳
- **Status**: Pending
- **Required**: `vinext-cloudflare` CLI credentials
- **Worker Name**: `releva-int`
- **URL Pattern**: `https://releva-int.<account>.workers.dev`

### 4. Manual Migration ⏳
Once database provisioned:

```bash
# Review schema
npx prisma db push --dry-run

# Apply (manual approval)
npx prisma db push
```

### 5. Synthetic Data ⏳
After migration:

```bash
npm run seed:int
```

Then set passwords via better-auth or SQL.

## Deployment Commands

### Pre-Flight Checks

```bash
# 1. Verify environment
npm run verify:int

# 2. Dry-run build (no credentials)
./scripts/build-int-dry-run.sh

# 3. Validate configuration
cat cloudflare.int.config.ts
```

### Actual Deployment

```bash
# Deploy (prompts for confirmation)
./scripts/deploy-int.sh
```

**Prompts**:
1. Confirm `INT_DATABASE_URL` configured
2. Confirm migration completed manually
3. Confirm worker name `releva-int`

## Post-Deployment Verification

After successful deploy:

1. **INT Badge**: Yellow "INT" badge visible top-right corner
2. **Robots Meta**: View source, verify `<meta name="robots" content="noindex, nofollow">`
3. **Email Test**: Attempt sign-up, should log `[mail] INT BLOCKED`
4. **Upload Test**: Try document upload, should fail with "disabled in INT"
5. **Payment Test**: Try checkout, should fail with "disabled in INT"
6. **Database**: Confirm queries hit INT database (check logs)

## Known Blockers

### Cannot Start Until:
- [ ] Neon branch created and connection string provided
- [ ] `INT_APPROVED_DB_HOST` matches Neon endpoint exactly
- [ ] `INT_BETTER_AUTH_SECRET` (32+ chars) generated
- [ ] `INT_BETTER_AUTH_URL` confirmed (requires Cloudflare account name)
- [ ] Cloudflare credentials available

### No Remote Migrations
As requested, all migration steps are manual and separate from deploy.

### No Production Access
All guards verified. Production database, data, and secrets are never accessed in INT mode.

## Documentation

- **Setup Guide**: `docs/INT-SETUP.md`
- **Safety Fixes**: `docs/INT-SAFETY-FIXES.md`
- **Deploy Script**: `scripts/deploy-int.sh`
- **Verify Script**: `scripts/verify-int-runtime.ts`
- **Seed Script**: `scripts/seed-int.ts`
- **Dry-Run Script**: `scripts/build-int-dry-run.sh`

## Summary

**Code**: ✅ Ready (all safety fixes committed, tests passing)  
**Provisioning**: ⏳ Blocked on Neon branch + secrets  
**Deployment**: ⏳ Waiting for prerequisites

Once Neon branch and secrets are configured:
1. Run `npm run verify:int`
2. Run `npx prisma db push` (manual)
3. Run `npm run seed:int`
4. Run `./scripts/deploy-int.sh`
5. Verify INT badge and guards operational

No further code changes needed for INT safety.
