-- Round P: deuda neta and fondo de maniobra are computed from the same year's
-- balance (DFN = deuda LP + deuda CP − caja; FM = activo corriente − pasivo corriente).
-- The snapshot columns on project were leftover from an older card and drifted from the years.
ALTER TABLE "project" DROP COLUMN IF EXISTS "net_debt_cents";
ALTER TABLE "project" DROP COLUMN IF EXISTS "working_capital_cents";
