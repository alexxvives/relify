/** Normalises a SABI label: lower case, no accents, single spaces, no trailing colon. */
export function normalizeLabel(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*:\s*$/, "")
    .trim();
}

/** Money lines (EUR) from "Formato Global" and the "Perfil financiero" summary. */
export const sabiMoneyLabels = {
  // Cuenta de pérdidas y ganancias
  operatingRevenue: ["ingresos de explotacion", "operating revenue (turnover)", "operating revenue"],
  sales: ["importe neto cifra de ventas", "sales"],
  materialsConsumption: ["consumo de mercaderias y de materias"],
  grossResult: ["resultado bruto", "gross profit"],
  otherOperatingExpenses: ["otros gastos de explotacion", "other operating expenses"],
  operatingResult: ["resultado explotacion", "operating p/l [=ebit]", "operating p/l"],
  financialIncome: ["ingresos financieros", "financial revenue"],
  financialExpenses: ["gastos financieros", "financial expenses"],
  financialResult: ["resultado financiero", "financial p/l"],
  profitBeforeTax: ["result. ordinarios antes impuestos", "p/l before tax"],
  corporateTax: ["impuestos sobre sociedades", "taxation"],
  ordinaryResult: ["resultado actividades ordinarias", "p/l after tax"],
  extraordinaryIncome: ["ingresos extraordinarios", "extraordinary and other revenue"],
  extraordinaryExpenses: ["gastos extraordinarios", "extraordinary and other expenses"],
  extraordinaryResult: ["resultados actividades extraordinarias", "extraordinary and other p/l"],
  netResult: ["resultado del ejercicio", "p/l for period [=net income]", "p/l for period"],
  materials: ["materiales", "material costs"],
  staffCosts: ["gastos de personal", "costs of employees"],
  depreciation: ["dotaciones para amortiz. de inmovil.", "depreciation & amortization", "depreciation"],
  otherOperatingItems: ["otros conceptos de explotacion", "other operating items"],
  interestExpenses: ["gastos financieros y gastos asimilados", "interest paid"],
  cashFlow: ["cash flow"],
  addedValue: ["valor agregado", "added value"],
  ebit: ["ebit"],
  ebitda: ["ebitda"],
  // Balance de situación
  fixedAssets: ["inmovilizado", "fixed assets"],
  intangibleAssets: ["inmovilizado inmaterial", "intangible fixed assets"],
  tangibleAssets: ["inmovilizado material", "tangible fixed assets"],
  otherFixedAssets: ["otros activos fijos", "other fixed assets"],
  currentAssets: ["activo circulante", "current assets"],
  inventory: ["existencias", "stock"],
  receivables: ["deudores", "debtors"],
  otherCurrentAssets: ["otros activos liquidos", "other current assets"],
  cash: ["tesoreria", "cash & cash equivalent"],
  totalAssets: ["total activo", "total assets"],
  equity: ["fondos propios", "shareholders funds"],
  subscribedCapital: ["capital suscrito", "capital"],
  otherEquity: ["otros fondos propios", "other shareholders funds"],
  nonCurrentLiabilities: ["pasivo fijo", "non-current liabilities"],
  longTermCreditors: ["acreedores a l. p.", "acreedores a l. p", "long term debt"],
  otherNonCurrentLiabilities: ["otros pasivos fijos", "other non-current liabilities"],
  provisions: ["provisiones", "provisions"],
  currentLiabilities: ["pasivo liquido", "current liabilities"],
  financialDebt: ["deudas financieras", "loans"],
  tradeCreditors: ["acreedores comerciales", "creditors"],
  otherCurrentLiabilities: ["otros pasivos liquidos", "other current liabilities"],
  totalLiabilitiesAndEquity: ["total pasivo y capital propio", "total shareh. funds & liab."],
  workingCapital: ["fondo de maniobra", "working capital"],
} as const;

export type SabiMoneyKey = keyof typeof sabiMoneyLabels;

/** Ratios: percentages, days, multiples, or thousands of EUR per employee, exactly as SABI gives them. */
export const sabiRatioLabels = {
  economicReturn: ["rentabilidad economica (%)"],
  financialReturn: ["rentabilidad financiera (%)"],
  generalLiquidity: ["liquidez general"],
  indebtedness: ["endeudamiento (%)"],
  returnOnEquity: ["rentabilidad sobre recursos propios (%)", "roe using p/l before tax (%)"],
  returnOnCapitalEmployed: ["rentabilidad sobre capital empleado (%)", "roce using p/l before tax (%)"],
  returnOnAssets: ["rentabilidad sobre el activo total (%)", "roa using p/l before tax (%)"],
  profitMargin: ["margen de beneficio (%)", "profit margin (%)"],
  netAssetTurnover: ["rotacion de activos netos", "net assets turnover"],
  interestCoverage: ["ratio de cobertura de intereses", "interest cover"],
  stockTurnover: ["rotacion de las existencias", "stock turnover"],
  collectionDays: ["periodo de cobro (dias)", "collection period (days)"],
  creditDays: ["periodo de credito (dias)", "credit period (days)"],
  solvencyRatio: ["ratio de solvencia", "current ratio"],
  liquidityRatio: ["ratio de liquidez", "liquidity ratio"],
  financialAutonomy: ["ratios de autonomia financiera a medio y largo plazo", "shareholders liquidity ratio"],
  solvencyCoefficient: ["coeficiente de solvencia (%)", "solvency ratio (asset based) (%)"],
  gearing: ["apalancamiento (%)", "gearing (%)"],
  profitPerEmployee: ["beneficio por empleado", "profit per employee"],
  revenuePerEmployee: ["ingresos de explotacion por empleado", "operating revenue per employee"],
  staffCostToRevenue: ["costes de los trabajadores / ingresos de explotacion (%)", "costs of employees / operating revenue (%)"],
  averageStaffCost: ["coste medio de los empleados", "average cost of employee"],
  equityPerEmployee: ["recursos propios por empleado", "shareholders funds per employee"],
  workingCapitalPerEmployee: ["capital circulante por empleado", "working capital per employee"],
  assetsPerEmployee: ["total activos por empleado", "total assets per employee"],
} as const;

export type SabiRatioKey = keyof typeof sabiRatioLabels;

export const employeesLabels = ["numero empleados", "numero de empleados", "number of employees"];

/** Section titles and sub-headings that sit inside a financial table but carry no values. */
export const tableHeadings = [
  "balance de situacion",
  "cuentas de perdidas y ganancias",
  "a. rentabilidad",
  "b. operaciones",
  "c. estructura",
  "d. por empleado",
];

function buildIndex<K extends string>(labels: Record<K, readonly string[]>): Map<string, K> {
  const index = new Map<string, K>();

  for (const [key, aliases] of Object.entries(labels) as Array<[K, readonly string[]]>) {
    for (const alias of aliases) {
      index.set(normalizeLabel(alias), key);
    }
  }

  return index;
}

export const moneyIndex = buildIndex(sabiMoneyLabels);
export const ratioIndex = buildIndex(sabiRatioLabels);
