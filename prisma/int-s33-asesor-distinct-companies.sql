-- INT only. Do not apply on production (releva / itsrelify Neon). Apply only on the RELEVA-INT Neon database.
-- S33 seed, additive and idempotent (safe to run twice). No Prisma schema migration.
-- Apply after int-s27-pipeline-advisors.sql and int-s32-seller-advisor-processes.sql.
--
-- int-asesor@test.local had 7 encargos on only four companies (two on Distribuidora Ebro, two on Obrador Sur and one
-- on Consultoría Servicios, which carries the 7 buyer processes of int-vendedor-manual). This file adds 7 distinct
-- synthetic companies (owner int-vendedor-cartera@test.local), gives each one or two buyer processes, and moves
-- int-s32-eng-1..7 onto them (upsert by id): 2 waiting for the deposit, 1 waiting for the advisor NDA, 3 in progress,
-- 1 closed. Every company has a signed buyer NDA, so the "before Q&A" purge keeps the encargo.

BEGIN;

INSERT INTO project (id, slug, owner_id, codename, region, revenue_cents, ebitda_cents, adjusted_ebitda_cents, asking_price_cents,
  net_income_cents, legal_name, cif, address, founded_year, description, sale_reason, headcount_range, customer_base,
  seller_financing, seller_stay, status, verified_at, created_at)
SELECT v.id, v.slug, u.id, v.codename, v.region, v.revenue, v.ebitda, v.ebitda, v.price, v.net, v.legal_name, v.cif, v.address,
  v.founded, v.description, v.reason, v.headcount::headcount_range, v.customers::customer_base, 'no', '6m', 'published', NOW(), NOW()
FROM "user" u
CROSS JOIN (
  VALUES
    ('int-s33-p-ferreteria', 'int-s33-ferreteria-delta', 'Ferretería Delta', 'Cataluña', 210000000::bigint, 26000000::bigint, 95000000::bigint, 18000000::bigint,
     'Ferretería Ficticia Delta S.L.', 'B90000209', 'Calle Ficticia 7, 43001 Tarragona', 1992,
     'Ferretería y suministro industrial con dos tiendas y reparto a talleres de la comarca.', 'Jubilación del fundador', 'band_6_10', 'mixed'),
    ('int-s33-p-gestoria', 'int-s33-gestoria-arlanza', 'Gestoría Arlanza', 'Castilla y León', 88000000, 24000000, 90000000, 17000000,
     'Gestoría Ficticia Arlanza S.L.', 'B90000217', 'Calle Ficticia 8, 09001 Burgos', 2003,
     'Gestoría laboral y fiscal con cartera estable de autónomos y pymes con iguala mensual.', 'Sin relevo familiar', 'band_6_10', 'business'),
    ('int-s33-p-veterinaria', 'int-s33-veterinaria-miramar', 'Veterinaria Miramar', 'Comunidad Valenciana', 72000000, 15000000, 60000000, 11000000,
     'Clínica Veterinaria Ficticia Miramar S.L.', 'B90000225', 'Calle Ficticia 9, 03001 Alicante', 2010,
     'Clínica veterinaria con quirófano, urgencias de fin de semana y plan de salud para mascotas.', 'Cambio de actividad', 'band_6_10', 'consumer'),
    ('int-s33-p-imprenta', 'int-s33-imprenta-duero', 'Imprenta Duero', 'Castilla y León', 330000000, 39000000, 160000000, 27000000,
     'Imprenta Ficticia Duero S.L.', 'B90000233', 'Calle Ficticia 10, 47001 Valladolid', 1985,
     'Impresión offset y digital de etiquetas y packaging para la industria alimentaria.', 'Jubilación del fundador', 'band_21_50', 'business'),
    ('int-s33-p-software', 'int-s33-software-albufera', 'Software Albufera', 'Comunidad Valenciana', 150000000, 36000000, 200000000, 26000000,
     'Desarrollos Ficticios Albufera S.L.', 'B90000241', 'Calle Ficticia 11, 46002 Valencia', 2014,
     'Software de gestión para clínicas dentales con suscripción mensual y soporte propio.', 'Nuevo proyecto de los socios', 'band_11_20', 'business'),
    ('int-s33-p-autoescuela', 'int-s33-autoescuela-guadiana', 'Autoescuela Guadiana', 'Extremadura', 64000000, 13000000, 50000000, 9000000,
     'Autoescuela Ficticia Guadiana S.L.', 'B90000259', 'Calle Ficticia 12, 06001 Badajoz', 1999,
     'Autoescuela con tres secciones, flota de ocho vehículos y cursos de camión y CAP.', 'Jubilación del fundador', 'band_6_10', 'consumer'),
    ('int-s33-p-hotel', 'int-s33-hotel-sierra-gata', 'Hotel Sierra de Gata', 'Extremadura', 98000000, 21000000, 85000000, 15000000,
     'Hotel Rural Ficticio Sierra de Gata S.L.', 'B90000267', 'Calle Ficticia 13, 10001 Cáceres', 2007,
     'Hotel rural de dieciocho habitaciones con restaurante y ocupación alta en fines de semana.', 'Cambio de actividad', 'band_11_20', 'consumer')
) AS v(id, slug, codename, region, revenue, ebitda, price, net, legal_name, cif, address, founded, description, reason, headcount, customers)
WHERE u.email = 'int-vendedor-cartera@test.local'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO project_cnae (id, project_id, code, role, position)
SELECT 'int-s33-cnae-' || p.slug, p.id, v.code, 'principal', 0
FROM project p
JOIN (
  VALUES
    ('int-s33-ferreteria-delta', '47.52'),
    ('int-s33-gestoria-arlanza', '69.20'),
    ('int-s33-veterinaria-miramar', '75.00'),
    ('int-s33-imprenta-duero', '18.12'),
    ('int-s33-software-albufera', '62.01'),
    ('int-s33-autoescuela-guadiana', '85.53'),
    ('int-s33-hotel-sierra-gata', '55.20')
) AS v(slug, code) ON v.slug = p.slug
ON CONFLICT (project_id, code) DO NOTHING;

-- Buyer processes. stage: 1 Solicitud, 2 Conexión, 3 NDA, 4 Preguntas, 5 LOI recibida, 6 LOI aceptada, 7 Contrato
INSERT INTO project_access (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at, loi_signed_at, loi_accepted_at, nda_text)
SELECT 'int-s33-access-' || v.slug || '-' || v.investor, p.id, u.id,
  NOW() - make_interval(days => v.age),
  CASE WHEN v.stage >= 2 THEN NOW() - make_interval(days => v.age - 1) END,
  CASE WHEN v.stage >= 3 THEN NOW() - make_interval(days => v.age - 2) END,
  CASE WHEN v.stage >= 5 THEN NOW() - make_interval(days => 3) END,
  CASE WHEN v.stage >= 6 THEN NOW() - make_interval(days => 2) END,
  CASE WHEN v.stage >= 3 THEN 'Acuerdo de confidencialidad de prueba (INT).' END
FROM (
  VALUES
    ('int-s33-ferreteria-delta', 'int-s32-inversor-1@test.local', 3, 10),
    ('int-s33-ferreteria-delta', 'int-s32-inversor-2@test.local', 1, 3),
    ('int-s33-gestoria-arlanza', 'int-comprador@test.local', 3, 9),
    ('int-s33-gestoria-arlanza', 'int-s32-inversor-3@test.local', 2, 5),
    ('int-s33-veterinaria-miramar', 'int-comprador@test.local', 4, 12),
    ('int-s33-imprenta-duero', 'int-s32-inversor-4@test.local', 5, 16),
    ('int-s33-imprenta-duero', 'int-s32-inversor-5@test.local', 3, 8),
    ('int-s33-software-albufera', 'int-comprador@test.local', 4, 14),
    ('int-s33-software-albufera', 'int-s32-inversor-6@test.local', 2, 4),
    ('int-s33-autoescuela-guadiana', 'int-s32-inversor-7@test.local', 7, 22),
    ('int-s33-autoescuela-guadiana', 'int-s32-inversor-1@test.local', 3, 7),
    ('int-s33-hotel-sierra-gata', 'int-s32-inversor-2@test.local', 7, 40)
) AS v(slug, investor, stage, age)
JOIN project p ON p.slug = v.slug
JOIN "user" u ON u.email = v.investor
ON CONFLICT (project_id, investor_id) DO NOTHING;

INSERT INTO project_message (id, project_id, investor_id, author, kind, body, created_at)
SELECT 'int-s33-msg-' || v.slug || '-' || v.investor || '-' || v.kind, p.id, u.id, 'investor'::message_author, v.kind::message_kind, v.body,
  NOW() - make_interval(days => v.age)
FROM (
  VALUES
    ('int-s33-veterinaria-miramar', 'int-comprador@test.local', 'question', '¿El local es en propiedad? ¿Qué parte de los ingresos viene del plan de salud?', 6),
    ('int-s33-imprenta-duero', 'int-s32-inversor-4@test.local', 'question', '¿Qué antigüedad tiene la maquinaria offset y hay leasing vivo?', 10),
    ('int-s33-imprenta-duero', 'int-s32-inversor-4@test.local', 'offer', 'Carta de intenciones firmada: 1.500.000 € con un 20 % aplazado a tres años.', 3),
    ('int-s33-software-albufera', 'int-comprador@test.local', 'question', '¿Cuántas clínicas tenéis suscritas y cuál es la tasa de bajas anual?', 7),
    ('int-s33-autoescuela-guadiana', 'int-s32-inversor-7@test.local', 'question', '¿Los vehículos son en propiedad o en renting?', 15),
    ('int-s33-autoescuela-guadiana', 'int-s32-inversor-7@test.local', 'offer', 'Carta de intenciones firmada: 480.000 €, pago al contado.', 5),
    ('int-s33-hotel-sierra-gata', 'int-s32-inversor-2@test.local', 'question', '¿Qué ocupación media tuvisteis el último año?', 30),
    ('int-s33-hotel-sierra-gata', 'int-s32-inversor-2@test.local', 'offer', 'Carta de intenciones firmada: 820.000 € con un 10 % aplazado.', 20)
) AS v(slug, investor, kind, body, age)
JOIN project p ON p.slug = v.slug
JOIN "user" u ON u.email = v.investor
ON CONFLICT (id) DO NOTHING;

INSERT INTO data_room_grant (id, project_id, investor_id, granted_at)
SELECT 'int-s33-grant-' || v.slug, p.id, u.id, NOW() - make_interval(days => 2)
FROM (
  VALUES
    ('int-s33-autoescuela-guadiana', 'int-s32-inversor-7@test.local'),
    ('int-s33-hotel-sierra-gata', 'int-s32-inversor-2@test.local')
) AS v(slug, investor)
JOIN project p ON p.slug = v.slug
JOIN "user" u ON u.email = v.investor
ON CONFLICT (project_id, investor_id) DO NOTHING;

-- The 7 encargos of int-asesor, one company each. Upsert by id so the S32 rows move here.
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
    (1, 'int-s33-ferreteria-delta', 'int-vendedor-cartera@test.local', 'seller', ARRAY['valuation']::text[], 'deposit', 3),
    (2, 'int-s33-gestoria-arlanza', 'int-comprador@test.local', 'investor', ARRAY['due-diligence']::text[], 'deposit', 4),
    (3, 'int-s33-veterinaria-miramar', 'int-comprador@test.local', 'investor', ARRAY['legal']::text[], 'nda', 6),
    (4, 'int-s33-imprenta-duero', 'int-vendedor-cartera@test.local', 'seller', ARRAY['valuation', 'tax']::text[], 'active', 9),
    (5, 'int-s33-software-albufera', 'int-comprador@test.local', 'investor', ARRAY['due-diligence', 'tax']::text[], 'active', 12),
    (6, 'int-s33-autoescuela-guadiana', 'int-vendedor-cartera@test.local', 'seller', ARRAY['legal']::text[], 'active', 15),
    (7, 'int-s33-hotel-sierra-gata', 'int-vendedor-cartera@test.local', 'seller', ARRAY['valuation']::text[], 'closed', 30)
) AS v(n, slug, requester, client, services, stage, age)
JOIN project p ON p.slug = v.slug
JOIN "user" r ON r.email = v.requester
JOIN "user" a ON a.email = 'int-asesor@test.local'
ON CONFLICT (id) DO UPDATE SET
  project_id = EXCLUDED.project_id,
  requester_id = EXCLUDED.requester_id,
  client = EXCLUDED.client,
  services = EXCLUDED.services,
  deposit_cents = EXCLUDED.deposit_cents,
  deposit_paid_at = EXCLUDED.deposit_paid_at,
  advisor_nda_accepted_at = EXCLUDED.advisor_nda_accepted_at,
  advisor_nda_text = EXCLUDED.advisor_nda_text,
  closed_at = EXCLUDED.closed_at,
  process_opened = EXCLUDED.process_opened;

COMMIT;
