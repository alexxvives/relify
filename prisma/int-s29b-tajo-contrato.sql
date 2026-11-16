-- INT only. Do not apply on production (releva / itsrelify Neon). Apply only on the RELEVA-INT Neon database.
-- Round S29b seed, additive and idempotent (safe to run twice). No Prisma schema migration.
--
-- S29b merged the Revisión step into LOI: an accepted LOI now opens the contract upload, and
-- project_access.diligence_passed_at is no longer read. Agencia Tajo (int-s27-agencia-tajo), seeded by
-- int-s27-pipeline-advisors.sql with the LOI accepted and no data room grant, therefore shows at Contrato with no
-- data change. This file only adds the two avisos that match its new step, so the INT walkthrough reads clearly:
--   - int-vendedor-cartera@test.local: upload the Agencia Tajo contract.
--   - int-comprador@test.local: the Agencia Tajo contract is the next step.
-- Rows are skipped if the user or the process is missing (e.g. the S27 seed was not applied).

BEGIN;

INSERT INTO notification (id, user_id, title, body, href, read_at, created_at)
SELECT v.id, u.id, v.title, v.body, v.href, NULL, NOW()
FROM (
  VALUES
    ('int-s29b-notif-tajo-seller', 'int-vendedor-cartera@test.local',
     'Sube el contrato de Agencia Tajo',
     'Aceptaste la carta de intenciones, así que ya puedes subir el contrato de compraventa.',
     '/mi-empresa/procesos'),
    ('int-s29b-notif-tajo-buyer', 'int-comprador@test.local',
     'Agencia Tajo está en Contrato',
     'El vendedor aceptó tu carta de intenciones. El siguiente paso es el contrato de compraventa.',
     '/procesos')
) AS v(id, email, title, body, href)
JOIN "user" u ON u.email = v.email
WHERE EXISTS (
  SELECT 1
  FROM project_access a
  JOIN project p ON p.id = a.project_id
  JOIN "user" b ON b.id = a.investor_id
  WHERE p.slug = 'int-s27-agencia-tajo'
    AND b.email = 'int-comprador@test.local'
    AND a.loi_accepted_at IS NOT NULL
    AND a.cancelled_at IS NULL
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
