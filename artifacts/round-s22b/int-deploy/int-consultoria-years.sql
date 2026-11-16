-- INT only. Do not apply on production.
-- Closed years for Consultoría Servicios (slug int-consultoria-servicios) so the
-- post-NDA buyer ficha has charts, detalle de cuentas and ratios — not just headline cards.
-- Amounts are euro cents. 2024 matches the seeded 2,00 M ventas / 400 k EBITDA.

UPDATE "project"
SET
  revenue_cents = 200000000,
  ebitda_cents = 40000000,
  adjusted_ebitda_cents = 40000000,
  net_income_cents = 30000000,
  average_headcount = 15
WHERE slug = 'int-consultoria-servicios';

INSERT INTO "project_year" (
  id,
  project_id,
  year,
  kind,
  data_source,
  months,
  sales_cents,
  operating_revenue_cents,
  supplies_cents,
  staff_costs_cents,
  ebitda_cents,
  ebit_cents,
  net_result_cents,
  profit_before_tax_cents,
  financial_result_cents,
  current_assets_cents,
  cash_cents,
  non_current_assets_cents,
  total_assets_cents,
  current_liabilities_cents,
  short_term_debt_cents,
  long_term_debt_cents,
  non_current_liabilities_cents,
  equity_cents,
  inventory_cents,
  receivables_cents,
  suppliers_cents,
  employees,
  ratios
)
SELECT
  COALESCE((SELECT py.id FROM "project_year" py WHERE py.project_id = p.id AND py.year = y.year), gen_random_uuid()::text),
  p.id,
  y.year,
  'closed',
  'vendedor',
  12,
  y.sales,
  y.sales,
  y.supplies,
  y.staff,
  y.ebitda,
  y.ebit,
  y.net,
  y.pbt,
  y.fin,
  y.ca,
  y.cash,
  y.anc,
  y.assets,
  y.cl,
  y.st,
  y.lt,
  y.ncl,
  y.equity,
  y.inventory,
  y.receivables,
  y.suppliers,
  y.employees,
  y.ratios::jsonb
FROM "project" p
CROSS JOIN (
  VALUES
    (2022, 170000000::bigint, -28000000::bigint, -70000000::bigint, 32000000::bigint, 26000000::bigint, 24000000::bigint, 25000000::bigint, -1000000::bigint, 70000000::bigint, 18000000::bigint, 55000000::bigint, 125000000::bigint, 32000000::bigint, 7000000::bigint, 18000000::bigint, 16000000::bigint, 59000000::bigint, 8000000::bigint, 22000000::bigint, 14000000::bigint, 12, '{"economicReturn":10.2,"collectionDays":48,"creditDays":40}'),
    (2023, 185000000::bigint, -32000000::bigint, -75000000::bigint, 36000000::bigint, 30000000::bigint, 27000000::bigint, 28000000::bigint, -1000000::bigint, 78000000::bigint, 21000000::bigint, 62000000::bigint, 140000000::bigint, 36000000::bigint, 8000000::bigint, 19000000::bigint, 18000000::bigint, 67000000::bigint, 9000000::bigint, 24000000::bigint, 15000000::bigint, 14, '{"economicReturn":11.1,"collectionDays":45,"creditDays":38}'),
    (2024, 200000000::bigint, -35000000::bigint, -80000000::bigint, 40000000::bigint, 34000000::bigint, 30000000::bigint, 32000000::bigint, -2000000::bigint, 90000000::bigint, 25000000::bigint, 70000000::bigint, 160000000::bigint, 40000000::bigint, 8000000::bigint, 20000000::bigint, 15000000::bigint, 77000000::bigint, 10000000::bigint, 28000000::bigint, 16000000::bigint, 15, '{"economicReturn":12.5,"collectionDays":42,"creditDays":36}')
) AS y(
  year, sales, supplies, staff, ebitda, ebit, net, pbt, fin, ca, cash, anc, assets, cl, st, lt, ncl, equity, inventory, receivables, suppliers, employees, ratios
)
WHERE p.slug = 'int-consultoria-servicios'
ON CONFLICT (project_id, year) DO UPDATE SET
  kind = EXCLUDED.kind,
  data_source = EXCLUDED.data_source,
  months = EXCLUDED.months,
  sales_cents = EXCLUDED.sales_cents,
  operating_revenue_cents = EXCLUDED.operating_revenue_cents,
  supplies_cents = EXCLUDED.supplies_cents,
  staff_costs_cents = EXCLUDED.staff_costs_cents,
  ebitda_cents = EXCLUDED.ebitda_cents,
  ebit_cents = EXCLUDED.ebit_cents,
  net_result_cents = EXCLUDED.net_result_cents,
  profit_before_tax_cents = EXCLUDED.profit_before_tax_cents,
  financial_result_cents = EXCLUDED.financial_result_cents,
  current_assets_cents = EXCLUDED.current_assets_cents,
  cash_cents = EXCLUDED.cash_cents,
  non_current_assets_cents = EXCLUDED.non_current_assets_cents,
  total_assets_cents = EXCLUDED.total_assets_cents,
  current_liabilities_cents = EXCLUDED.current_liabilities_cents,
  short_term_debt_cents = EXCLUDED.short_term_debt_cents,
  long_term_debt_cents = EXCLUDED.long_term_debt_cents,
  non_current_liabilities_cents = EXCLUDED.non_current_liabilities_cents,
  equity_cents = EXCLUDED.equity_cents,
  inventory_cents = EXCLUDED.inventory_cents,
  receivables_cents = EXCLUDED.receivables_cents,
  suppliers_cents = EXCLUDED.suppliers_cents,
  employees = EXCLUDED.employees,
  ratios = EXCLUDED.ratios;
