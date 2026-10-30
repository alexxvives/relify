import type { SabiMoneyKey } from "./labels";

/**
 * t62: every SABI datum gets a home. These are the columns added on top of the ficha lines
 * (ProjectYear / Project); anything SABI prints that has no column lands in `project.sabi_extra`.
 */

export type SabiYearDetailGroup = "assets" | "liabilities" | "results";

export type SabiYearDetailField = {
  /** ProjectYear column (euro cents, BIGINT). */
  column: string;
  /** SABI line it comes from. */
  sabi: SabiMoneyKey;
  label: string;
  group: SabiYearDetailGroup;
};

export const sabiYearDetailGroups: Record<SabiYearDetailGroup, string> = {
  assets: "Activo",
  liabilities: "Patrimonio neto y pasivo",
  results: "Cuenta de resultados (formato SABI)",
};

export const sabiYearDetailFields = [
  { column: "intangibleAssetsCents", sabi: "intangibleAssets", label: "Inmovilizado inmaterial", group: "assets" },
  { column: "tangibleAssetsCents", sabi: "tangibleAssets", label: "Inmovilizado material", group: "assets" },
  { column: "otherFixedAssetsCents", sabi: "otherFixedAssets", label: "Otros activos fijos", group: "assets" },
  { column: "otherCurrentAssetsCents", sabi: "otherCurrentAssets", label: "Otros activos líquidos", group: "assets" },
  { column: "totalAssetsCents", sabi: "totalAssets", label: "Total activo", group: "assets" },
  { column: "subscribedCapitalCents", sabi: "subscribedCapital", label: "Capital suscrito", group: "liabilities" },
  { column: "otherEquityCents", sabi: "otherEquity", label: "Otros fondos propios", group: "liabilities" },
  { column: "provisionsCents", sabi: "provisions", label: "Provisiones", group: "liabilities" },
  { column: "otherNonCurrentLiabilitiesCents", sabi: "otherNonCurrentLiabilities", label: "Otros pasivos fijos", group: "liabilities" },
  { column: "otherCurrentLiabilitiesCents", sabi: "otherCurrentLiabilities", label: "Otros pasivos líquidos", group: "liabilities" },
  { column: "totalLiabilitiesAndEquityCents", sabi: "totalLiabilitiesAndEquity", label: "Total pasivo y capital propio", group: "liabilities" },
  { column: "workingCapitalCents", sabi: "workingCapital", label: "Fondo de maniobra", group: "liabilities" },
  { column: "operatingRevenueCents", sabi: "operatingRevenue", label: "Ingresos de explotación", group: "results" },
  { column: "materialsConsumptionCents", sabi: "materialsConsumption", label: "Consumo de mercaderías y materias", group: "results" },
  { column: "materialsCents", sabi: "materials", label: "Materiales", group: "results" },
  { column: "grossResultCents", sabi: "grossResult", label: "Resultado bruto", group: "results" },
  { column: "sabiOtherOperatingExpensesCents", sabi: "otherOperatingExpenses", label: "Otros gastos de explotación (SABI)", group: "results" },
  { column: "otherOperatingItemsCents", sabi: "otherOperatingItems", label: "Otros conceptos de explotación", group: "results" },
  { column: "operatingResultCents", sabi: "operatingResult", label: "Resultado de explotación", group: "results" },
  { column: "ebitCents", sabi: "ebit", label: "EBIT", group: "results" },
  { column: "ebitdaCents", sabi: "ebitda", label: "EBITDA", group: "results" },
  { column: "financialIncomeCents", sabi: "financialIncome", label: "Ingresos financieros", group: "results" },
  { column: "financialExpensesCents", sabi: "financialExpenses", label: "Gastos financieros", group: "results" },
  { column: "interestExpensesCents", sabi: "interestExpenses", label: "Gastos financieros y asimilados", group: "results" },
  { column: "corporateTaxCents", sabi: "corporateTax", label: "Impuesto sobre sociedades", group: "results" },
  { column: "ordinaryResultCents", sabi: "ordinaryResult", label: "Resultado de actividades ordinarias", group: "results" },
  { column: "extraordinaryIncomeCents", sabi: "extraordinaryIncome", label: "Ingresos extraordinarios", group: "results" },
  { column: "extraordinaryExpensesCents", sabi: "extraordinaryExpenses", label: "Gastos extraordinarios", group: "results" },
  { column: "extraordinaryResultCents", sabi: "extraordinaryResult", label: "Resultado extraordinario", group: "results" },
] as const satisfies readonly SabiYearDetailField[];

export type SabiYearDetailColumn = (typeof sabiYearDetailFields)[number]["column"];

export type SabiCompanyDetailGroup = "legal" | "contact" | "group";
export type SabiCompanyDetailKind = "text" | "money" | "integer" | "date";

export type SabiCompanyDetailField = {
  /** Project column. */
  column: string;
  label: string;
  group: SabiCompanyDetailGroup;
  kind: SabiCompanyDetailKind;
  /** Longest accepted text. */
  max?: number;
};

export const sabiCompanyDetailGroups: Record<SabiCompanyDetailGroup, string> = {
  legal: "Datos legales",
  contact: "Contacto",
  group: "Gobierno y grupo",
};

export const sabiCompanyDetailFields = [
  { column: "formerName", label: "Denominación anterior", group: "legal", kind: "text", max: 200 },
  { column: "legalFormDetail", label: "Forma jurídica detallada", group: "legal", kind: "text", max: 120 },
  { column: "companyType", label: "Tipo de empresa", group: "legal", kind: "text", max: 120 },
  { column: "shareCapitalCents", label: "Capital social", group: "legal", kind: "money" },
  { column: "incorporatedOn", label: "Fecha de constitución", group: "legal", kind: "date" },
  { column: "companyStatus", label: "Estado", group: "legal", kind: "text", max: 120 },
  { column: "companyStatusDetail", label: "Estado detallado", group: "legal", kind: "text", max: 200 },
  { column: "accountsType", label: "Cuentas disponibles", group: "legal", kind: "text", max: 120 },
  { column: "lastAccountsOn", label: "Fecha últimas cuentas", group: "legal", kind: "date" },
  { column: "yearsAvailable", label: "Años de cuentas disponibles", group: "legal", kind: "integer" },
  { column: "auditorName", label: "Auditor", group: "legal", kind: "text", max: 200 },
  { column: "street", label: "Calle", group: "contact", kind: "text", max: 200 },
  { column: "postalCode", label: "Código postal", group: "contact", kind: "text", max: 12 },
  { column: "city", label: "Municipio", group: "contact", kind: "text", max: 120 },
  { column: "province", label: "Provincia", group: "contact", kind: "text", max: 120 },
  { column: "country", label: "País", group: "contact", kind: "text", max: 120 },
  { column: "phone", label: "Teléfono", group: "contact", kind: "text", max: 40 },
  { column: "website", label: "Web", group: "contact", kind: "text", max: 200 },
  { column: "president", label: "Presidente", group: "group", kind: "text", max: 200 },
  { column: "executiveDirector", label: "Director ejecutivo", group: "group", kind: "text", max: 200 },
  { column: "globalUltimateOwner", label: "Matriz última (GUO)", group: "group", kind: "text", max: 200 },
  { column: "independenceIndicator", label: "Indicador de independencia BvD", group: "group", kind: "text", max: 12 },
  { column: "groupCompanyCount", label: "Empresas en el grupo", group: "group", kind: "integer" },
  { column: "shareholderCount", label: "Nº de accionistas", group: "group", kind: "integer" },
  { column: "subsidiaryCount", label: "Nº de participadas", group: "group", kind: "integer" },
] as const satisfies readonly SabiCompanyDetailField[];

export type SabiCompanyDetailColumn = (typeof sabiCompanyDetailFields)[number]["column"];

/** Ficha lines a SABI export never fills: the seller (or advisor) has to enter them. */
export const notInSabiIncomeKeys = [
  "inventoryChange",
  "ownUse",
  "grantIncome",
  "provisionSurplus",
  "assetImpairment",
  "subsidiaryControlLoss",
  "negativeDifference",
  "otherResults",
] as const;

export const notInSabiCopy = {
  badge: "No viene en SABI",
  hint: "SABI no publica esta línea: hay que introducirla a mano.",
  dealHint: "SABI no da precio, EBITDA ajustado, motivo de venta, tipo de cliente ni previsiones.",
};
