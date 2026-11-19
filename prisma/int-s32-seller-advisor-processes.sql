-- INT only. Do not apply on production (releva / itsrelify Neon). Apply only on the RELEVA-INT Neon database.
-- S32 seed, additive and idempotent (safe to run twice). No Prisma schema migration. Apply after int-s27-pipeline-advisors.sql.
--
-- 1) int-vendedor-manual@test.local gets 7 buyer processes on its published company (Consultoría Servicios),
--    one per stage: Solicitud, Conexión, NDA, Preguntas, LOI recibida, LOI aceptada, Contrato (data room shared).
--    The buyers are 7 new synthetic investors int-s32-inversor-1..7@test.local.
-- 2) int-asesor@test.local gets 7 encargos across stages on the S27 companies and Consultoría Servicios:
--    2 waiting for the deposit, 1 waiting for the advisor NDA, 3 in progress and 1 closed.
--    Every encargo sits on a company with a signed buyer NDA, so the "before Q&A" purge keeps it.
--
-- Passwords: no password is written here. The new investors copy the scrypt hash of int-comprador@test.local,
-- so they sign in with the same test password. If that account is missing, the user row is created without a login.

BEGIN;

-- ---------------------------------------------------------------- 7 synthetic investors
INSERT INTO "user" (id, name, last_name, email, email_verified, role, phone, onboarded_at, terms_accepted_at, created_at, updated_at)
VALUES
  ('int-s32-user-inversor-1', 'Lucía', 'Navarro Pons', 'int-s32-inversor-1@test.local', true, 'investor', '611000201', NOW(), NOW(), NOW(), NOW()),
  ('int-s32-user-inversor-2', 'Diego', 'Martín Soler', 'int-s32-inversor-2@test.local', true, 'investor', '611000202', NOW(), NOW(), NOW(), NOW()),
  ('int-s32-user-inversor-3', 'Carmen', 'Ortega Vidal', 'int-s32-inversor-3@test.local', true, 'investor', '611000203', NOW(), NOW(), NOW(), NOW()),
  ('int-s32-user-inversor-4', 'Javier', 'Ruiz Campos', 'int-s32-inversor-4@test.local', true, 'investor', '611000204', NOW(), NOW(), NOW(), NOW()),
  ('int-s32-user-inversor-5', 'Elena', 'Prieto Gallardo', 'int-s32-inversor-5@test.local', true, 'investor', '611000205', NOW(), NOW(), NOW(), NOW()),
  ('int-s32-user-inversor-6', 'Sergio', 'Molina Arias', 'int-s32-inversor-6@test.local', true, 'investor', '611000206', NOW(), NOW(), NOW(), NOW()),
  ('int-s32-user-inversor-7', 'Nuria', 'Castro Benítez', 'int-s32-inversor-7@test.local', true, 'investor', '611000207', NOW(), NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT 'int-s32-account-' || u.email, u.id, 'credential', u.id, src.password, NOW(), NOW()
FROM "user" u
JOIN LATERAL (
  SELECT a.password
  FROM "account" a
  JOIN "user" s ON s.id = a.user_id
  WHERE a.provider_id = 'credential' AND a.password IS NOT NULL AND s.email = 'int-comprador@test.local'
  LIMIT 1
) src ON true
WHERE u.email LIKE 'int-s32-inversor-_@test.local'
AND NOT EXISTS (SELECT 1 FROM "account" x WHERE x.user_id = u.id AND x.provider_id = 'credential');

INSERT INTO investor_profile (user_id, city, province, updated_at)
SELECT u.id, v.city, v.province, NOW()
FROM "user" u
JOIN (
  VALUES
    ('int-s32-inversor-1@test.local', 'Valencia', 'Valencia'),
    ('int-s32-inversor-2@test.local', 'Madrid', 'Madrid'),
    ('int-s32-inversor-3@test.local', 'Sevilla', 'Sevilla'),
    ('int-s32-inversor-4@test.local', 'Bilbao', 'Vizcaya'),
    ('int-s32-inversor-5@test.local', 'Zaragoza', 'Zaragoza'),
    ('int-s32-inversor-6@test.local', 'Málaga', 'Málaga'),
    ('int-s32-inversor-7@test.local', 'Barcelona', 'Barcelona')
) AS v(email, city, province) ON v.email = u.email
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------- int-vendedor-manual: 7 processes, one per stage
-- The seller's company: its oldest published project (Consultoría Servicios in the INT seed).
CREATE TEMP TABLE int_s32_seller_project ON COMMIT DROP AS
SELECT p.id
FROM project p
JOIN "user" s ON s.id = p.owner_id
WHERE s.email = 'int-vendedor-manual@test.local' AND p.status = 'published'
ORDER BY p.created_at
LIMIT 1;

-- stage: 1 Solicitud, 2 Conexión, 3 NDA, 4 Preguntas, 5 LOI recibida, 6 LOI aceptada, 7 Contrato
INSERT INTO project_access (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at, loi_signed_at, loi_accepted_at, nda_text)
SELECT 'int-s32-access-' || v.n, sp.id, u.id,
  NOW() - make_interval(days => v.age),
  CASE WHEN v.stage >= 2 THEN NOW() - make_interval(days => v.age - 1) END,
  CASE WHEN v.stage >= 3 THEN NOW() - make_interval(days => v.age - 2) END,
  CASE WHEN v.stage >= 5 THEN NOW() - make_interval(days => 3) END,
  CASE WHEN v.stage >= 6 THEN NOW() - make_interval(days => 2) END,
  CASE WHEN v.stage >= 3 THEN 'Acuerdo de confidencialidad de prueba (INT).' END
FROM int_s32_seller_project sp
CROSS JOIN (
  VALUES (1, 1, 2), (2, 2, 5), (3, 3, 8), (4, 4, 11), (5, 5, 14), (6, 6, 17), (7, 7, 20)
) AS v(n, stage, age)
JOIN "user" u ON u.email = 'int-s32-inversor-' || v.n || '@test.local'
ON CONFLICT (project_id, investor_id) DO NOTHING;

INSERT INTO project_message (id, project_id, investor_id, author, kind, body, created_at)
SELECT 'int-s32-msg-' || v.n || '-' || v.kind, sp.id, u.id, 'investor'::message_author, v.kind::message_kind, v.body, NOW() - make_interval(days => v.age)
FROM int_s32_seller_project sp
CROSS JOIN (
  VALUES
    (4, 'question', '¿Qué peso tienen los tres primeros clientes en la facturación?', 6),
    (5, 'question', '¿El equipo seguiría tras la venta? ¿Hay pactos de permanencia?', 9),
    (5, 'offer', 'Carta de intenciones firmada: 900.000 € con un 15 % aplazado a dos años.', 3),
    (6, 'question', '¿Los contratos con clientes tienen cláusula de cambio de control?', 12),
    (6, 'offer', 'Carta de intenciones firmada: 950.000 €, pago al contado.', 4),
    (7, 'question', '¿Qué parte de la facturación es recurrente?', 15),
    (7, 'offer', 'Carta de intenciones firmada: 1.000.000 €, 10 % aplazado.', 6)
) AS v(n, kind, body, age)
JOIN "user" u ON u.email = 'int-s32-inversor-' || v.n || '@test.local'
ON CONFLICT (id) DO NOTHING;

-- Contrato stage: the data room is shared with buyer 7.
INSERT INTO data_room_grant (id, project_id, investor_id, granted_at)
SELECT 'int-s32-grant-7', sp.id, u.id, NOW() - make_interval(days => 1)
FROM int_s32_seller_project sp
JOIN "user" u ON u.email = 'int-s32-inversor-7@test.local'
ON CONFLICT (project_id, investor_id) DO NOTHING;

-- ---------------------------------------------------------------- int-asesor: 7 encargos across stages
-- deposit: claimed, deposit not paid. nda: hired by a buyer, deposit paid, advisor NDA not signed yet.
-- active: deposit paid (and NDA signed when a buyer hired). closed: paid and closed.
INSERT INTO advisory_engagement (id, project_id, requester_id, client, services, advisor_id, claimed_at, deposit_cents,
  deposit_paid_at, advisor_nda_accepted_at, advisor_nda_text, closed_at, process_opened, created_at)
SELECT 'int-s32-eng-' || v.n, p.id, r.id, v.client::engagement_client, v.services, a.id,
  NOW() - make_interval(days => v.age - 1),
  5000 + ROUND(p.asking_price_cents / 200.0)::int,
  CASE WHEN v.stage IN ('nda', 'active', 'closed') THEN NOW() - make_interval(days => v.age - 2) END,
  CASE WHEN v.client = 'investor' AND v.stage IN ('active', 'closed') THEN NOW() - make_interval(days => v.age - 3) END,
  CASE WHEN v.client = 'investor' AND v.stage IN ('active', 'closed') THEN 'Acuerdo de confidencialidad del asesor de prueba (INT).' END,
  CASE WHEN v.stage = 'closed' THEN NOW() - make_interval(days => 1) END,
  v.stage IN ('active', 'closed'),
  NOW() - make_interval(days => v.age)
FROM (
  VALUES
    (1, 'int-s27-distribuidora-ebro', 'int-vendedor-cartera@test.local', 'seller', ARRAY['valuation']::text[], 'deposit', 3),
    (2, 'int-s27-obrador-sur', 'int-comprador@test.local', 'investor', ARRAY['due-diligence']::text[], 'deposit', 4),
    (3, 'int-s27-agencia-tajo', 'int-comprador@test.local', 'investor', ARRAY['legal']::text[], 'nda', 6),
    (4, 'int-s27-logistica-cantabrico', 'int-vendedor-cartera@test.local', 'seller', ARRAY['valuation', 'tax']::text[], 'active', 9),
    (5, 'int-s27-distribuidora-ebro', 'int-comprador@test.local', 'investor', ARRAY['due-diligence', 'tax']::text[], 'active', 12),
    (6, NULL, 'int-vendedor-manual@test.local', 'seller', ARRAY['legal']::text[], 'active', 15),
    (7, 'int-s27-obrador-sur', 'int-vendedor-cartera@test.local', 'seller', ARRAY['valuation']::text[], 'closed', 30)
) AS v(n, slug, requester, client, services, stage, age)
JOIN "user" r ON r.email = v.requester
JOIN "user" a ON a.email = 'int-asesor@test.local'
JOIN project p ON (v.slug IS NOT NULL AND p.slug = v.slug) OR (v.slug IS NULL AND p.id = (SELECT id FROM int_s32_seller_project))
ON CONFLICT (id) DO NOTHING;

COMMIT;
