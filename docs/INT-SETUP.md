# INT Environment Setup

INT (integration/staging) is an isolated persistent environment for testing Releva without affecting production.

## Safety Architecture

INT implements **fail-closed** safety guards:

1. **Exact Resource Validation**: Database endpoints must be explicitly approved (localhost or `INT_APPROVED_DB_HOST`)
2. **No Credential Logging**: Connection strings never logged, only status markers (`[configured]`)
3. **Uploads Disabled**: All file uploads blocked until isolated storage wired
4. **Email**: Outbound mail is blocked unless `INT_MAILEROO_API_KEY` and `INT_EMAIL_CATCHALL` are set on releva-int. Never the prod key. Every send goes only to the catch-all. See `docs/INT.md`.
5. **Payments Blocked**: Stripe charges/webhooks disabled (`INT_PAYMENTS_ENABLED` required)
6. **External APIs Blocked**: Billable APIs (EInforma, ApiEmpresas, Context7, Maileroo) blocked by default
7. **Webhooks Blocked**: All webhook delivery blocked in INT

## Prerequisites

### 1. Database

Create an INT database (do NOT use production):

**Option A: Local PostgreSQL**
```bash
createdb releva_int
```

**Option B: Neon Branch (recommended)**
```bash
# Via Neon dashboard: create child branch of main database
# Name: releva-int
# Branch from: parent production branch
# Do NOT run migrations via Neon (see below)
```

### 2. Environment Secrets

Set these in `.env.local` or Cursor Cloud Agent secrets:

```bash
INT_ENVIRONMENT=true

# Database (approved resource)
INT_DATABASE_URL=postgresql://user:pass@localhost:5432/releva_int
# OR for Neon branch:
INT_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/releva?sslmode=require
INT_APPROVED_DB_HOST=ep-xxx.us-east-2.aws.neon.tech:5432

# Better Auth
INT_BETTER_AUTH_SECRET=<generate-32-char-secret>
INT_BETTER_AUTH_URL=https://releva-int.<account>.workers.dev

# INT mail (optional; see docs/INT.md). Never MAILEROO_API_KEY.
# INT_MAILEROO_API_KEY=<INT-only Maileroo key>
# INT_EMAIL_CATCHALL=alex@itsrelify.com
# INT_PAYMENTS_ENABLED=true
# INT_EXTERNAL_APIS_ENABLED=true
# INT_UPLOADS_ENABLED=true
```

### 3. Cloudflare Account

INT worker name: `releva-int`

Requires Cloudflare credentials for deploy.

## Setup Steps

### 1. Verify Environment

```bash
npm run verify:int
```

Expected output:
- ✓ INT mode detected
- ✓ Database URL validated
- ✓ Uploads blocked
- ✓ Email blocked unless INT_MAILEROO_API_KEY + INT_EMAIL_CATCHALL are set (see docs/INT.md)
- ✓ Payments blocked
- ✓ External APIs blocked
- ✓ Webhooks blocked

### 2. Run Database Migration

**CRITICAL**: Migrations are MANUAL and separate from deploy.

```bash
# Review schema changes
npx prisma db push --dry-run

# Apply migration (only after review)
npx prisma db push
```

### 3. Seed Test Data

```bash
npm run seed:int
```

Creates:
- `int-seller@test.local`
- `int-buyer@test.local`
- `int-advisor@test.local`

Set passwords via better-auth signup or SQL:
```sql
UPDATE "user" 
SET password = crypt('password', gen_salt('bf'))
WHERE email LIKE 'int-%@test.local';
```

### 4. Dry-Run Build

Test worker build without credentials:

```bash
./scripts/build-int-dry-run.sh
```

Verifies:
- Worker bundle builds
- No credential leaks
- Configuration valid

### 5. Deploy

```bash
./scripts/deploy-int.sh
```

Prompts:
1. Confirm INT_DATABASE_URL
2. Confirm migration completed
3. Confirm worker name `releva-int`

## Verification

After deploy:

1. **INT Badge**: Yellow "INT" badge visible top-right
2. **Robots Meta**: `<meta name="robots" content="noindex, nofollow">`
3. **Email Test**: Sign-up attempt should not send email (logs `[mail] INT BLOCKED`)
4. **Upload Test**: Document upload should fail with "disabled in INT environment"
5. **Payment Test**: Checkout should fail with "disabled in INT environment"

## Development Workflow

### Local Development
```bash
# Use INT database locally
export INT_ENVIRONMENT=true
export INT_DATABASE_URL=postgresql://localhost:5432/releva_int
export INT_BETTER_AUTH_SECRET=<secret>
export INT_BETTER_AUTH_URL=http://localhost:3000

npm run dev
```

### Deploy Changes
```bash
# 1. Test locally
npm run typecheck
npm run lint
npm test

# 2. Commit to branch
git add .
git commit -m "feat: new feature"
git push

# 3. Deploy to INT
./scripts/deploy-int.sh
```

### Testing

Run INT verification anytime:
```bash
npm run verify:int
```

## Troubleshooting

### "Database not approved"
Set `INT_APPROVED_DB_HOST` to your Neon endpoint:
```bash
INT_APPROVED_DB_HOST=ep-xxx.us-east-2.aws.neon.tech:5432
```

### "Uploads disabled"
Expected behavior. Do NOT set `INT_UPLOADS_ENABLED` until dedicated storage wired.

### "Email disabled"
Expected behavior. Check logs for `[mail] INT BLOCKED` confirmation.

### "Migration required"
Run manual migration:
```bash
npx prisma db push
```

## Safety Checklist

Before every deploy:

- [ ] `INT_ENVIRONMENT=true` set
- [ ] Database is NOT production (`INT_APPROVED_DB_HOST` or localhost)
- [ ] No raw secrets in code or logs
- [ ] `npm run verify:int` passes
- [ ] Migrations reviewed and applied manually
- [ ] `npm test` passes
- [ ] Deploy script confirms worker name `releva-int`

## Blockers for Initial Deployment

Current prerequisites that must be resolved before first deploy:

1. **Neon Connection**: INT database provisioned and `INT_DATABASE_URL` set
2. **Approved Host**: `INT_APPROVED_DB_HOST` set for Neon endpoint
3. **Better Auth Secret**: `INT_BETTER_AUTH_SECRET` (32+ chars) generated
4. **Cloudflare Auth**: Credentials available for `vinext-cloudflare deploy`
5. **Worker URL**: Confirm `INT_BETTER_AUTH_URL` matches actual workers.dev URL

## Contact

Questions or issues: see `docs/LEARNINGS.md` for known pitfalls.
