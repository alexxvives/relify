-- S30 (INT only, releva_int on RELEVA-INT). Applied by Alex, never by the bot. Idempotent; safe to re-run.
-- Purpose: make INT physically identical to prisma/migrations before the Prisma baseline (docs/DEPLOY-S30.md).
-- INT was built with `prisma db push`, which left two list columns nullable that the migrations create NOT NULL.
-- Prisma's diff can't see this (list columns), but the catalog hash (scripts/schema-catalog-hash.sql) can.
-- Read-only check on 2026-11-16: 0 NULL rows in both columns, so SET NOT NULL cannot fail on existing data.
-- The listing_payment NOT NULL constraint name differs too (listing_payment_user_id_not_null vs
-- listing_payment_advisor_id_not_null); that is cosmetic (Postgres 18 names NOT NULL constraints) and left as is.
begin;
update advisor_profile set sectors = '{}' where sectors is null;
update advisory_quote set services = '{}' where services is null;
alter table advisor_profile alter column sectors set not null;
alter table advisory_quote alter column services set not null;
commit;
