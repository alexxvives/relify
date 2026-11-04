-- t93: store the exact NDA text at signing (like the LOI body), so the PDF never changes when the copy does.
-- Additive: two nullable columns, then a backfill of rows that were signed before this release, using the
-- wording in force before t92 (legacyNdaAgreement / legacyAdvisorNdaAgreement in src/lib/deal-documents.ts).
ALTER TABLE "project_access" ADD COLUMN IF NOT EXISTS "nda_text" TEXT;
ALTER TABLE "advisory_engagement" ADD COLUMN IF NOT EXISTS "advisor_nda_text" TEXT;

CREATE OR REPLACE FUNCTION pg_temp.relify_es_date(ts TIMESTAMP) RETURNS TEXT AS $$
  SELECT EXTRACT(DAY FROM local)::INT || ' de ' ||
    (ARRAY['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'])[EXTRACT(MONTH FROM local)::INT] ||
    ' de ' || EXTRACT(YEAR FROM local)::INT
  FROM (SELECT (ts AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Madrid' AS local) AS t;
$$ LANGUAGE SQL IMMUTABLE;

UPDATE "project_access" AS pa
SET "nda_text" = concat_ws(E'\n',
  'ACUERDO DE CONFIDENCIALIDAD',
  '',
  'Fecha: ' || pg_temp.relify_es_date(pa."nda_accepted_at"),
  '',
  concat_ws(' ', NULLIF(btrim(u."name"), ''), NULLIF(btrim(coalesce(u."last_name", '')), '')) ||
    ', como comprador en Relify, y el titular del proyecto ' || p."codename" || ' (' || p."region" || ') acuerdan:',
  '',
  '1. El comprador usará la información del proyecto ' || p."codename" || ' solo para valorar una posible compra.',
  '2. No la revelará a terceros, salvo a asesores que acepten esta misma confidencialidad.',
  '3. Este acuerdo no entrega la razón social, el CIF, el domicilio ni los nombres de los archivos.',
  '4. La confidencialidad dura dos años desde esta firma. No reserva la empresa ni impide hablar con otros compradores.',
  '5. Firmar en Relify deja constancia de la aceptación. Este acuerdo es jurídicamente vinculante desde su aceptación (art. 23 de la Ley 34/2002, LSSI).'
)
FROM "user" AS u, "project" AS p
WHERE pa."nda_text" IS NULL AND pa."nda_accepted_at" IS NOT NULL
  AND u."id" = pa."investor_id" AND p."id" = pa."project_id";

UPDATE "advisory_engagement" AS ae
SET "advisor_nda_text" = concat_ws(E'\n',
  'ACUERDO DE CONFIDENCIALIDAD DEL ASESOR',
  '',
  'Fecha: ' || pg_temp.relify_es_date(ae."advisor_nda_accepted_at"),
  '',
  concat_ws(' ', NULLIF(btrim(u."name"), ''), NULLIF(btrim(coalesce(u."last_name", '')), '')) ||
    ', como asesor en Relify, y el titular del proyecto ' || p."codename" || ' (' || p."region" || ') acuerdan:',
  '',
  '1. El asesor usará la información del proyecto ' || p."codename" || ' solo para el encargo.',
  '2. La firma del comprador no abre esta ficha. El asesor firma la suya.',
  '3. Este acuerdo no entrega la razón social, el CIF, el domicilio ni los nombres de los archivos antes de esta firma.',
  '4. La confidencialidad dura dos años desde esta firma. No reserva la empresa.',
  '5. Firmar en Relify deja constancia de la aceptación. Este acuerdo es jurídicamente vinculante desde su aceptación (art. 23 de la Ley 34/2002, LSSI).'
)
FROM "user" AS u, "project" AS p
WHERE ae."advisor_nda_text" IS NULL AND ae."advisor_nda_accepted_at" IS NOT NULL
  AND u."id" = ae."advisor_id" AND p."id" = ae."project_id";
