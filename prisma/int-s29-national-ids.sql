-- Round S29 (INT Neon only, never production). Idempotent.
-- Synthetic INT accounts created by SQL seeds (e.g. int-s27-pipeline-advisors.sql) have no national_id, so the
-- Acuerdo con Relify / NDA / LOI signature pads asked for a DNI/NIE that real users already gave in onboarding.
-- Give every @test.local account without one a synthetic DNI with a valid control letter (9000xxxx range).
BEGIN;

WITH missing AS (
  SELECT id, 90000000 + row_number() OVER (ORDER BY email) AS n
  FROM "user"
  WHERE email LIKE '%@test.local'
    AND (national_id IS NULL OR btrim(national_id) = '')
)
UPDATE "user" u
SET national_id = lpad(m.n::text, 8, '0') || substr('TRWAGMYFPDXBNJZSQVHLCKE', (m.n % 23)::int + 1, 1),
    updated_at = NOW()
FROM missing m
WHERE u.id = m.id;

COMMIT;
