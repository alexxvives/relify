# INT Seed SQL - Corrected Version

**Status**: Fixed all blockers identified by read-only reviewer  
**Date**: 2026-11-08

## Critical Fixes Applied

### 1. Password Hashing
**Was**: bcrypt (`$2b$10$...`)  
**Now**: Better Auth scrypt (161 char `salt:hash`)  
**Method**: `better-auth/crypto` hashPassword

### 2. Schema Constraints
**Was**: `ON CONFLICT (provider_id, account_id)` (doesn't exist)  
**Now**: `ON CONFLICT (id)` (actual PK)

### 3. Transaction Structure
**Was**: Multiple small transactions  
**Now**: Single atomic `BEGIN...COMMIT`

### 4. Idempotence
**Was**: Random UUIDs (FK issues on re-run)  
**Now**: Deterministic UUIDs (consistent IDs)

### 5. SABI Financials
**Was**: Only year/kind in project_year  
**Now**: Full financials (sales, ebitda, assets, equity)

### 6. Schema Clean
**Was**: Prisma banner included  
**Now**: Clean SQL only

## Artifacts

### Corrected Files
- `/opt/cursor/artifacts/int-bootstrap/schema.sql` (1067 lines, 43 tables, 13 enums)
- `/opt/cursor/artifacts/int-bootstrap/seed.sql` (190 lines, corrected)
- `/opt/cursor/artifacts/int-bootstrap/manifest.json` (updated counts)
- `/opt/cursor/artifacts/int-bootstrap/checksums.txt` (new SHA256 hashes)
- `/opt/cursor/artifacts/int-bootstrap/VALIDATION-REPORT.md` (detailed fixes)

### Test Credentials
- `/opt/cursor/artifacts/relify-int-test-access.txt` (chmod 600)

## Validation Status

- [x] Corrected password hashing (scrypt)
- [x] Fixed schema constraints
- [x] Single atomic transaction
- [x] Deterministic UUIDs
- [x] Meaningful SABI financials
- [x] Cleaned schema banner
- [ ] Local execution test (requires INT secrets)
- [ ] Real login test (requires deployed app)
- [ ] NDA flow verification (requires app)

## Execution Sequence

1. **Schema already applied** ✅ (43 tables, 13 enums, 0 users)
2. **Apply corrected seed**:
   ```bash
   psql <INT_CONNECTION> < seed.sql
   ```
3. **Verify counts**
4. **Test login** (all 5 roles)
5. **Verify NDA states**
6. **Verify SABI display**

## Authorization

User explicitly authorized INT initialization only (no production changes).

Target: silent-rain-47735324 / br-jolly-rain-b9g5pzn4 / releva_int

**Ready for parent Neon connector execution.**
