-- INT only. Do not apply on production.
-- Fills four closed project_year rows for Empresa Tecnología (slug int-empresa-tecnologia)
-- so Resumen, solidez, Tus cifras, Cifras operativas and Detalle all render.
-- Amounts are euro cents. 2024 matches the Round P formula examples:
-- ventas 5,00 M, EBITDA 750 k, EBITDA aj. 800 k, DFN 300 k, NOF 700 k, FM 900 k.

UPDATE "project"
SET
  revenue_cents = 500000000,
  ebitda_cents = 75000000,
  adjusted_ebitda_cents = 80000000,
  net_income_cents = 60000000,
  average_headcount = 32
WHERE slug = 'int-empresa-tecnologia';

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
  'sabi',
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
    (2021, 420000000::bigint, -65000000::bigint, -175000000::bigint, 62000000::bigint, 50000000::bigint, 48000000::bigint, 50000000::bigint, -2000000::bigint, 140000000::bigint, 25000000::bigint, 170000000::bigint, 310000000::bigint, 70000000::bigint, 15000000::bigint, 45000000::bigint, 50000000::bigint, 185000000::bigint, 35000000::bigint, 55000000::bigint, 28000000::bigint, 24, '{"collectionDays":52,"creditDays":44}'),
    (2022, 430000000::bigint, -70000000::bigint, -185000000::bigint, 62000000::bigint, 50000000::bigint, 50000000::bigint, 52000000::bigint, -2000000::bigint, 150000000::bigint, 30000000::bigint, 185000000::bigint, 335000000::bigint, 75000000::bigint, 16000000::bigint, 46000000::bigint, 52000000::bigint, 200000000::bigint, 38000000::bigint, 58000000::bigint, 30000000::bigint, 26, '{"collectionDays":50,"creditDays":42}'),
    (2023, 460000000::bigint, -75000000::bigint, -198000000::bigint, 68000000::bigint, 55000000::bigint, 55000000::bigint, 58000000::bigint, -3000000::bigint, 160000000::bigint, 35000000::bigint, 200000000::bigint, 360000000::bigint, 80000000::bigint, 18000000::bigint, 48000000::bigint, 55000000::bigint, 225000000::bigint, 42000000::bigint, 62000000::bigint, 32000000::bigint, 29, '{"collectionDays":48,"creditDays":40}'),
    (2024, 500000000::bigint, -80000000::bigint, -210000000::bigint, 75000000::bigint, 60000000::bigint, 60000000::bigint, 63000000::bigint, -3000000::bigint, 180000000::bigint, 40000000::bigint, 220000000::bigint, 400000000::bigint, 90000000::bigint, 20000000::bigint, 50000000::bigint, 60000000::bigint, 250000000::bigint, 50000000::bigint, 70000000::bigint, 35000000::bigint, 32, '{"collectionDays":45,"creditDays":38}')
) AS y(
  year, sales, supplies, staff, ebitda, ebit, net, pbt, fin, ca, cash, anc, assets, cl, st, lt, ncl, equity, inventory, receivables, suppliers, employees, ratios
)
WHERE p.slug = 'int-empresa-tecnologia'
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

UPDATE "project_year" py
SET data_source = 'sabi'
FROM "project" p
WHERE py.project_id = p.id AND p.slug = 'int-empresa-tecnologia';
