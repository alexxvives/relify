# INT Safety Fixes (2024-11-07)

Comprehensive safety hardening for INT environment based on e88e484 security review.

## Issues Fixed

### 1. Credential Redaction (CRITICAL)
**Problem**: `${INT_DATABASE_URL%%@*}@***` leaked username/password prefix  
**Fix**: Removed all connection string logging, output only `[configured]` status  
**Files**: `scripts/deploy-int.sh`, `src/lib/int-env.ts`

### 2. Database Validation (CRITICAL)
**Problem**: Substring matching (`includes("releva")`) cannot distinguish real endpoints  
**Fix**: Mandatory exact approved resource validation with explicit allow-list  
**Implementation**:
- Localhost always approved
- Neon endpoints require `INT_APPROVED_DB_HOST` exact match
- Fail-closed: rejects by default without production fallback

**Files**: `src/lib/int-env.ts`, `int-resources.json`

### 3. Upload Blocking (CRITICAL)
**Problem**: Uploads not disabled  
**Fix**: Server-side fail-closed guards across all upload actions  
**Files**: `src/lib/server/int-guards.ts`, `src/lib/server/store-adjustment-document.ts`, `src/lib/server/signed-documents.ts`

### 4. Email/Payment/API Blocking (CRITICAL)
**Problem**: Not truly fail-closed, could be accidentally enabled  
**Fix**: Explicit runtime guards requiring `INT_*_ENABLED=true` to override  
**Blocked by default**:
- Outbound email (Maileroo/Cloudflare)
- Payment creation (Stripe charges)
- Webhook delivery
- External billable APIs (EInforma, ApiEmpresas, Context7)

**Files**: `src/lib/server/int-guards.ts`, `src/lib/server/mailer.ts`, `src/lib/server/fulfill-checkout.ts`

### 5. Runtime Environment Detection
**Problem**: Need to verify built adapter environment, not just process.env  
**Fix**: Comprehensive verification script with negative tests  
**Files**: `scripts/verify-int-runtime.ts`, `package.json` (`verify:int` command)

### 6. Synthetic Seed
**Problem**: `seed:int` referenced but did not exist  
**Fix**: Actual implementation with test user creation  
**Files**: `scripts/seed-int.ts`, `package.json` (`seed:int` command)

### 7. Migration Decoupling
**Problem**: Migrations inside deploy script (auto-migration risk)  
**Fix**: Deploy script prompts for manual migration confirmation, never runs `prisma db push`  
**Files**: `scripts/deploy-int.sh`

### 8. Dry-Run Build
**Problem**: No credential-free verification  
**Fix**: Dry-run script with dummy secrets, worker metadata inspection  
**Files**: `scripts/build-int-dry-run.sh`

## Safety Architecture

### Fail-Closed Design
Every external operation defaults to **blocked** in INT:
```typescript
// Upload example
export function assertUploadsEnabled(): void {
  if (isIntEnvironment()) {
    throw new Error("File uploads disabled in INT environment");
  }
}

// Email example  
export function shouldBlockEmail(): boolean {
  if (!isIntEnvironment()) return false;
  return process.env.INT_EMAIL_ENABLED !== "true"; // blocked by default
}
```

### Exact Resource Validation
```typescript
function validateIntDatabaseUrl(url: string): void {
  const hostPort = `${parsed.hostname}:${parsed.port || "5432"}`;
  
  // Allow localhost
  if (localHosts.includes(hostPort)) return;
  
  // Check explicit approval
  if (process.env.INT_APPROVED_DB_HOST === hostPort) return;
  
  // Reject by default (no fallback)
  throw new Error(`host "${hostPort}" not approved`);
}
```

### Zero Credential Logging
```bash
# Before (LEAKED):
echo "Database: ${INT_DATABASE_URL%%@*}@***"
# Output: postgresql://user:pass@***

# After (SAFE):
echo "Database: [configured]"
```

## Verification

### Automated Tests
```bash
npm run typecheck   # ✅ 0 errors
npm run lint        # ✅ 0 errors (14 warnings)
npm test            # ✅ 376 passed
npm run verify:int  # ✅ All guards operational
```

### Manual Verification
1. **Credential Logging**: None in deploy script or runtime
2. **DB Validation**: Rejects unapproved hosts
3. **Uploads**: Blocked with error message
4. **Email**: Returns `skipped` status
5. **Payments**: Throws error on attempt
6. **External APIs**: Logged as blocked
7. **Webhooks**: Logged as blocked

## Deployment Prerequisites

Before first INT deploy:

1. ✅ **Code Safety**: All fixes committed
2. ⏳ **Database**: Neon branch provisioned
3. ⏳ **Approval**: `INT_APPROVED_DB_HOST` set to Neon endpoint
4. ⏳ **Secrets**: `INT_DATABASE_URL`, `INT_BETTER_AUTH_SECRET`, `INT_BETTER_AUTH_URL`
5. ⏳ **Migration**: Manual `npx prisma db push` completed
6. ⏳ **Seed**: `npm run seed:int` with password setup
7. ⏳ **Cloudflare**: Auth credentials available

## Files Changed

### New Files
- `docs/INT-SETUP.md` - Complete setup guide
- `docs/INT-SAFETY-FIXES.md` - This document
- `int-resources.json` - Approved resource registry
- `scripts/build-int-dry-run.sh` - Credential-free build verification
- `scripts/seed-int.ts` - Synthetic data seeding
- `scripts/verify-int-runtime.ts` - Runtime guard verification
- `src/lib/server/int-guards.ts` - Centralized fail-closed guards

### Modified Files
- `package.json` - Added `seed:int` and `verify:int` commands
- `scripts/deploy-int.sh` - Safe redaction, migration prompt
- `src/lib/int-env.ts` - Exact resource validation, safe logging
- `src/lib/int-env.test.ts` - Updated test expectations
- `src/lib/server/fulfill-checkout.ts` - Payment guard
- `src/lib/server/mailer.ts` - Email guard
- `src/lib/server/signed-documents.ts` - Upload guard
- `src/lib/server/store-adjustment-document.ts` - Upload guard

## Next Steps

1. **Provision Neon Branch**: Create INT database
2. **Configure Secrets**: Set all `INT_*` environment variables
3. **Run Verification**: `npm run verify:int`
4. **Manual Migration**: `npx prisma db push`
5. **Seed Data**: `npm run seed:int`
6. **Dry-Run Build**: `./scripts/build-int-dry-run.sh`
7. **Deploy**: `./scripts/deploy-int.sh`

## Security Checklist

- [x] No connection strings logged (even partially)
- [x] Database endpoints require explicit approval
- [x] Uploads disabled server-side
- [x] Email fail-closed blocked
- [x] Payments fail-closed blocked
- [x] External APIs fail-closed blocked
- [x] Webhooks fail-closed blocked
- [x] Runtime detection verified
- [x] Synthetic seed implemented
- [x] Migrations decoupled from deploy
- [x] Dry-run verification available
- [x] All tests passing
- [ ] Neon branch provisioned
- [ ] Secrets configured
- [ ] Manual migration completed
- [ ] Initial deployment successful
