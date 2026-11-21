-- INT only. Do not apply on production (releva / itsrelify Neon). Apply only on the RELEVA-INT Neon database.
-- S39 seed, additive and idempotent (safe to run twice). No Prisma schema migration. Apply after int-s32-seller-advisor-processes.sql.
--
-- 1) Finding (item 15): the S32 seed gave its 7 processes to int-vendedor-manual@test.local (Consultoría Servicios).
--    int-vendedor-sabi@test.local opens /mi-empresa on its oldest company (int-empresa-tecnologia), which had no buyer at all.
--    This gives that company 7 processes, one per stage, reusing the S32 synthetic investors int-s32-inversor-1..7@test.local.
-- 2) Finding (item 16): int-s32-eng-6 (paid, seller-hired) had no advisor NDA signed, so the advisor sees the public view
--    and no buyer cards. The INT seed signs that NDA so the encargo shows its two live buyers.
-- Each statement stands alone (no temp table) so it can be applied one statement at a time.

INSERT INTO project_access (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at, loi_signed_at, loi_accepted_at, nda_text)
SELECT 'int-s39-access-' || v.n, p.id, u.id,
  NOW() - make_interval(days => v.age),
  CASE WHEN v.stage >= 2 THEN NOW() - make_interval(days => v.age - 1) END,
  CASE WHEN v.stage >= 3 THEN NOW() - make_interval(days => v.age - 2) END,
  CASE WHEN v.stage >= 5 THEN NOW() - make_interval(days => 3) END,
  CASE WHEN v.stage >= 6 THEN NOW() - make_interval(days => 2) END,
  CASE WHEN v.stage >= 3 THEN 'Acuerdo de confidencialidad de prueba (INT).' END
FROM project p
JOIN "user" s ON s.id = p.owner_id AND s.email = 'int-vendedor-sabi@test.local'
CROSS JOIN (VALUES (1, 1, 2), (2, 2, 5), (3, 3, 8), (4, 4, 11), (5, 5, 14), (6, 6, 17), (7, 7, 20)) AS v(n, stage, age)
JOIN "user" u ON u.email = 'int-s32-inversor-' || v.n || '@test.local'
WHERE p.slug = 'int-empresa-tecnologia'
ON CONFLICT (project_id, investor_id) DO NOTHING;

INSERT INTO project_message (id, project_id, investor_id, author, kind, body, created_at)
SELECT 'int-s39-msg-' || v.n || '-' || v.kind, p.id, u.id, 'investor'::message_author, v.kind::message_kind, v.body, NOW() - make_interval(days => v.age)
FROM project p
CROSS JOIN (
  VALUES
    (4, 'question', '¿Qué peso tienen los tres primeros clientes en la facturación?', 6),
    (5, 'question', '¿El equipo técnico seguiría tras la venta?', 9),
    (5, 'offer', 'Carta de intenciones firmada: 1.200.000 € con un 15 % aplazado a dos años.', 3),
    (6, 'question', '¿Las licencias de software tienen cláusula de cambio de control?', 12),
    (6, 'offer', 'Carta de intenciones firmada: 1.250.000 €, pago al contado.', 4),
    (7, 'question', '¿Qué parte de la facturación es recurrente?', 15),
    (7, 'offer', 'Carta de intenciones firmada: 1.300.000 €, 10 % aplazado.', 6)
) AS v(n, kind, body, age)
JOIN "user" u ON u.email = 'int-s32-inversor-' || v.n || '@test.local'
WHERE p.slug = 'int-empresa-tecnologia'
ON CONFLICT (id) DO NOTHING;

INSERT INTO data_room_grant (id, project_id, investor_id, granted_at)
SELECT 'int-s39-grant-7', p.id, u.id, NOW() - make_interval(days => 1)
FROM project p
JOIN "user" u ON u.email = 'int-s32-inversor-7@test.local'
WHERE p.slug = 'int-empresa-tecnologia'
ON CONFLICT (project_id, investor_id) DO NOTHING;

UPDATE advisory_engagement
SET advisor_nda_accepted_at = NOW() - make_interval(days => 13),
    advisor_nda_signature = 'Asesor INT',
    advisor_nda_text = 'Acuerdo de confidencialidad del asesor de prueba (INT).'
WHERE id = 'int-s32-eng-6' AND advisor_nda_accepted_at IS NULL;
