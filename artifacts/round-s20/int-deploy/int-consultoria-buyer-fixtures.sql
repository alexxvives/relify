-- INT only. Do not apply on production.
-- 1) Store a DNI on int-comprador@test.local (signed NDA before S17, so national_id was empty).
--    LOI then reuses the profile id and does not ask again.
-- 2) Data-room folders/files on Consultoría Servicios: two shared with that buyer, one not.
--    Additive. No Prisma schema migration.

UPDATE "user"
SET national_id = '12345678Z'
WHERE email = 'int-comprador@test.local'
  AND (national_id IS NULL OR btrim(national_id) = '');

INSERT INTO data_room_folder (id, project_id, name, hidden, created_at)
SELECT v.id, p.id, v.name, false, NOW()
FROM project p
CROSS JOIN (
  VALUES
    ('int-cs-folder-fin', 'Financiero'),
    ('int-cs-folder-fis', 'Fiscal'),
    ('int-cs-folder-leg', 'Legal')
) AS v(id, name)
WHERE p.slug = 'int-consultoria-servicios'
ON CONFLICT (project_id, name) DO NOTHING;

INSERT INTO data_room_file (id, project_id, file_name, folder, created_at)
SELECT v.id, p.id, v.file_name, v.folder, NOW()
FROM project p
CROSS JOIN (
  VALUES
    ('c5111111-1111-4111-8111-000000000001', 'cuentas-2024.pdf', 'Financiero'),
    ('c5111111-1111-4111-8111-000000000002', 'modelo-200.pdf', 'Fiscal'),
    ('c5111111-1111-4111-8111-000000000003', 'pacto-socios.pdf', 'Legal')
) AS v(id, file_name, folder)
WHERE p.slug = 'int-consultoria-servicios'
ON CONFLICT (id) DO UPDATE SET
  project_id = EXCLUDED.project_id,
  file_name = EXCLUDED.file_name,
  folder = EXCLUDED.folder;

INSERT INTO data_room_grant (id, project_id, investor_id, granted_at)
SELECT 'int-cs-grant-comprador', p.id, u.id, NOW()
FROM project p
JOIN "user" u ON u.email = 'int-comprador@test.local'
WHERE p.slug = 'int-consultoria-servicios'
ON CONFLICT (project_id, investor_id) DO NOTHING;

INSERT INTO data_room_file_share (id, file_id, investor_id, created_at)
SELECT v.id, v.file_id, u.id, NOW()
FROM "user" u
CROSS JOIN (
  VALUES
    ('int-cs-share-cuentas', 'c5111111-1111-4111-8111-000000000001'),
    ('int-cs-share-modelo', 'c5111111-1111-4111-8111-000000000002')
) AS v(id, file_id)
WHERE u.email = 'int-comprador@test.local'
ON CONFLICT (file_id, investor_id) DO NOTHING;
