-- INT only. Do not apply on production (releva / itsrelify Neon). Apply only on the RELEVA-INT Neon database.
-- S27 seed, additive and idempotent (safe to run twice). No Prisma schema migration.
--
-- 1) Three asesores with full advisor profiles:
--      int-asesor-valoracion@test.local, int-asesor-legal@test.local, int-asesor-fiscal@test.local
-- 2) One seller with six published synthetic companies: int-vendedor-cartera@test.local
-- 3) int-comprador@test.local gets one active process per pipeline step on those companies:
--      Conexión (waiting for the seller), NDA, Preguntas, LOI (offer waiting for the seller),
--      Revisión (LOI accepted) and Contrato (LOI accepted + data room shared).
--
-- Passwords: no password is written here. Each new account copies the scrypt hash of an existing INT test
-- account (asesores <- int-asesor@test.local, seller <- int-vendedor-manual@test.local), so they sign in with
-- the same test password as that account. If the source account is missing, the login row is skipped.

BEGIN;

-- ---------------------------------------------------------------- users
INSERT INTO "user" (id, name, last_name, email, email_verified, role, phone, onboarded_at, terms_accepted_at, created_at, updated_at)
VALUES
  ('int-s27-user-asesor-valoracion', 'Irene', 'Valls Moreno', 'int-asesor-valoracion@test.local', true, 'advisor', '611000101', NOW(), NOW(), NOW(), NOW()),
  ('int-s27-user-asesor-legal', 'Tomás', 'Herrero Quintana', 'int-asesor-legal@test.local', true, 'advisor', '611000102', NOW(), NOW(), NOW(), NOW()),
  ('int-s27-user-asesor-fiscal', 'Paula', 'Ramos Ibáñez', 'int-asesor-fiscal@test.local', true, 'advisor', '611000103', NOW(), NOW(), NOW(), NOW()),
  ('int-s27-user-vendedor-cartera', 'Marcos', 'Gil Serrano', 'int-vendedor-cartera@test.local', true, 'seller', '611000104', NOW(), NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Credential rows. Better Auth matches account_id to user.id. The hash is copied, never written in clear.
INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT 'int-s27-account-' || u.email, u.id, 'credential', u.id, src.password, NOW(), NOW()
FROM "user" u
JOIN LATERAL (
  SELECT a.password
  FROM "account" a
  JOIN "user" s ON s.id = a.user_id
  WHERE a.provider_id = 'credential'
    AND a.password IS NOT NULL
    AND s.email = CASE WHEN u.role = 'advisor' THEN 'int-asesor@test.local' ELSE 'int-vendedor-manual@test.local' END
  LIMIT 1
) src ON true
WHERE u.email IN (
  'int-asesor-valoracion@test.local',
  'int-asesor-legal@test.local',
  'int-asesor-fiscal@test.local',
  'int-vendedor-cartera@test.local'
)
AND NOT EXISTS (SELECT 1 FROM "account" x WHERE x.user_id = u.id AND x.provider_id = 'credential');

-- ---------------------------------------------------------------- advisor profiles
INSERT INTO advisor_profile (user_id, business_name, nif, postal_code, description, verified_at, sectors, services, closed_operations, deals_answered, updated_at)
SELECT u.id, v.business_name, v.nif, v.postal_code, v.description, NOW(), v.sectors, v.services::jsonb, v.closed::jsonb, true, NOW()
FROM "user" u
JOIN (
  VALUES
    ('int-asesor-valoracion@test.local', 'Valls Valoraciones S.L.', 'B90000019', '46004',
     'Valoro pymes industriales y de servicios por múltiplos y flujos descontados. Preparo el informe para negociar el precio con el comprador.',
     ARRAY['C', 'G']::text[],
     '[{"serviceType":"COMPANY_VALUATION","priceFromCents":250000,"priceToCents":600000},{"serviceType":"BUSINESS_PLAN","priceFromCents":150000,"priceToCents":400000}]',
     '[{"name":"Fabricante de muebles","closingDate":"2025-04-10","sectorId":"C","revenueCents":320000000,"ebitdaCents":41000000,"enterpriseValueCents":250000000}]'),
    ('int-asesor-legal@test.local', 'Herrero Quintana Abogados S.L.', 'B90000027', '28010',
     'Abogado mercantilista. Redacto la carta de intenciones y el contrato de compraventa y reviso contingencias laborales y fiscales.',
     ARRAY['I', 'N']::text[],
     '[{"serviceType":"LEGAL_CONSULTING","priceFromCents":300000,"priceToCents":700000},{"serviceType":"DUE_DILIGENCE","priceFromCents":500000,"priceToCents":1200000}]',
     '[{"name":"Cadena de cafeterías","closingDate":"2025-10-02","sectorId":"I","revenueCents":150000000,"ebitdaCents":19000000,"enterpriseValueCents":120000000}]'),
    ('int-asesor-fiscal@test.local', 'Ramos Ibáñez Asesores S.L.', 'B90000035', '08013',
     'Asesora fiscal. Comparo venta de participaciones y de activos y preparo la due diligence fiscal antes de firmar.',
     ARRAY['G', 'M']::text[],
     '[{"serviceType":"TAX_CONSULTING","priceFromCents":180000,"priceToCents":450000},{"serviceType":"DUE_DILIGENCE","priceFromCents":400000,"priceToCents":900000}]',
     '[]')
) AS v(email, business_name, nif, postal_code, description, sectors, services, closed) ON v.email = u.email
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------- companies (published, synthetic)
INSERT INTO project (id, slug, owner_id, codename, region, revenue_cents, ebitda_cents, adjusted_ebitda_cents, asking_price_cents,
  net_income_cents, legal_name, cif, address, founded_year, description, sale_reason, headcount_range, customer_base,
  seller_financing, seller_stay, status, verified_at, created_at)
SELECT v.id, v.slug, u.id, v.codename, v.region, v.revenue, v.ebitda, v.ebitda, v.price, v.net, v.legal_name, v.cif, v.address,
  v.founded, v.description, v.reason, v.headcount::headcount_range, v.customers::customer_base, 'no', '6m', 'published', NOW(), NOW()
FROM "user" u
CROSS JOIN (
  VALUES
    ('int-s27-p-taller', 'int-s27-taller-levante', 'Taller Levante', 'Comunidad Valenciana', 180000000::bigint, 30000000::bigint, 120000000::bigint, 21000000::bigint,
     'Talleres Ficticios Levante S.L.', 'B90000101', 'Calle Ficticia 1, 46001 Valencia', 2004,
     'Taller mecánico multimarca con clientela fija de flotas y particulares.', 'Jubilación del fundador', 'band_6_10', 'mixed'),
    ('int-s27-p-clinica', 'int-s27-clinica-norte', 'Clínica Norte', 'País Vasco', 240000000, 52000000, 210000000, 38000000,
     'Clínica Ficticia Norte S.L.', 'B90000119', 'Calle Ficticia 2, 48001 Bilbao', 2011,
     'Clínica dental con tres gabinetes y agenda llena a dos semanas vista.', 'Cambio de actividad', 'band_11_20', 'consumer'),
    ('int-s27-p-distribuidora', 'int-s27-distribuidora-ebro', 'Distribuidora Ebro', 'Aragón', 520000000, 61000000, 330000000, 44000000,
     'Distribuciones Ficticias Ebro S.L.', 'B90000127', 'Calle Ficticia 3, 50001 Zaragoza', 1998,
     'Distribución de alimentación a hostelería con flota propia y rutas diarias.', 'Sin relevo familiar', 'band_21_50', 'business'),
    ('int-s27-p-obrador', 'int-s27-obrador-sur', 'Obrador Sur', 'Andalucía', 95000000, 16000000, 64000000, 11000000,
     'Obrador Ficticio Sur S.L.', 'B90000135', 'Calle Ficticia 4, 41001 Sevilla', 2009,
     'Obrador de pan y bollería con dos tiendas propias y venta a cafeterías.', 'Jubilación del fundador', 'band_6_10', 'mixed'),
    ('int-s27-p-agencia', 'int-s27-agencia-tajo', 'Agencia Tajo', 'Comunidad de Madrid', 140000000, 28000000, 110000000, 20000000,
     'Agencia Ficticia Tajo S.L.', 'B90000143', 'Calle Ficticia 5, 28001 Madrid', 2015,
     'Agencia de marketing digital con contratos anuales recurrentes.', 'Nuevo proyecto de los socios', 'band_11_20', 'business'),
    ('int-s27-p-logistica', 'int-s27-logistica-cantabrico', 'Logística Cantábrico', 'Cantabria', 410000000, 57000000, 300000000, 41000000,
     'Logística Ficticia Cantábrico S.L.', 'B90000151', 'Calle Ficticia 6, 39001 Santander', 2001,
     'Almacén y transporte regional con contratos estables con la industria local.', 'Jubilación del fundador', 'band_21_50', 'business')
) AS v(id, slug, codename, region, revenue, ebitda, price, net, legal_name, cif, address, founded, description, reason, headcount, customers)
WHERE u.email = 'int-vendedor-cartera@test.local'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO project_cnae (id, project_id, code, role, position)
SELECT 'int-s27-cnae-' || p.slug, p.id, v.code, 'principal', 0
FROM project p
JOIN (
  VALUES
    ('int-s27-taller-levante', '45.20'),
    ('int-s27-clinica-norte', '86.23'),
    ('int-s27-distribuidora-ebro', '46.39'),
    ('int-s27-obrador-sur', '10.71'),
    ('int-s27-agencia-tajo', '73.11'),
    ('int-s27-logistica-cantabrico', '49.41')
) AS v(slug, code) ON v.slug = p.slug
ON CONFLICT (project_id, code) DO NOTHING;

-- ---------------------------------------------------------------- int-comprador processes, one per step
INSERT INTO project_access (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at, loi_accepted_at, loi_signed_at, nda_text)
SELECT 'int-s27-access-' || v.slug, p.id, u.id,
  NOW() - make_interval(days => v.age),
  CASE WHEN v.step >= 2 THEN NOW() - make_interval(days => v.age - 1) END,
  CASE WHEN v.step >= 3 THEN NOW() - make_interval(days => v.age - 2) END,
  CASE WHEN v.step >= 5 THEN NOW() - make_interval(days => 2) END,
  CASE WHEN v.step >= 4 THEN NOW() - make_interval(days => 3) END,
  CASE WHEN v.step >= 3 THEN 'Acuerdo de confidencialidad de prueba (INT).' END
FROM "user" u
CROSS JOIN (
  VALUES
    -- step: 1 Conexión, 2 NDA, 3 Preguntas, 4 LOI pendiente, 5 Revisión, 6 Contrato
    ('int-s27-taller-levante', 1, 4),
    ('int-s27-clinica-norte', 2, 8),
    ('int-s27-distribuidora-ebro', 3, 12),
    ('int-s27-obrador-sur', 4, 16),
    ('int-s27-agencia-tajo', 5, 20),
    ('int-s27-logistica-cantabrico', 6, 24)
) AS v(slug, step, age)
JOIN project p ON p.slug = v.slug
WHERE u.email = 'int-comprador@test.local'
ON CONFLICT (project_id, investor_id) DO NOTHING;

-- Questions from Preguntas onwards, the offer (LOI) from step 4 on.
INSERT INTO project_message (id, project_id, investor_id, author, kind, body, created_at)
SELECT v.id, p.id, u.id, v.author::message_author, v.kind::message_kind, v.body, NOW() - make_interval(days => v.age)
FROM "user" u
CROSS JOIN (
  VALUES
    ('int-s27-msg-ebro-q', 'int-s27-distribuidora-ebro', 'investor', 'question', '¿Cuántas rutas diarias hacéis y cuántos clientes concentran la mitad de las ventas?', 5),
    ('int-s27-msg-sur-q', 'int-s27-obrador-sur', 'investor', 'question', '¿Las tiendas son en alquiler? ¿Cuántos años quedan de contrato?', 9),
    ('int-s27-msg-sur-o', 'int-s27-obrador-sur', 'investor', 'offer', 'Carta de intenciones firmada: 600.000 € con un 20 % aplazado a dos años.', 3),
    ('int-s27-msg-tajo-q', 'int-s27-agencia-tajo', 'investor', 'question', '¿Qué parte de la facturación viene de contratos anuales?', 12),
    ('int-s27-msg-tajo-o', 'int-s27-agencia-tajo', 'investor', 'offer', 'Carta de intenciones firmada: 1.050.000 €, pago al contado.', 4),
    ('int-s27-msg-cant-q', 'int-s27-logistica-cantabrico', 'investor', 'question', '¿Las naves son propias o en alquiler?', 15),
    ('int-s27-msg-cant-o', 'int-s27-logistica-cantabrico', 'investor', 'offer', 'Carta de intenciones firmada: 2.900.000 €, 10 % aplazado.', 6)
) AS v(id, slug, author, kind, body, age)
JOIN project p ON p.slug = v.slug
WHERE u.email = 'int-comprador@test.local'
ON CONFLICT (id) DO NOTHING;

-- Contrato step: the seller shared the data room after the LOI.
INSERT INTO data_room_grant (id, project_id, investor_id, granted_at)
SELECT 'int-s27-grant-cantabrico', p.id, u.id, NOW() - make_interval(days => 1)
FROM project p
JOIN "user" u ON u.email = 'int-comprador@test.local'
WHERE p.slug = 'int-s27-logistica-cantabrico'
ON CONFLICT (project_id, investor_id) DO NOTHING;

COMMIT;
