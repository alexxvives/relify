import type { SellerFocusPanel, SellerPanelFlags } from "./company-profile";

/**
 * t75: two lists.
 * - The seller checklist holds only what we expect FROM the seller (plus name/NIF until verified).
 *   When it is complete the company moves to review on its own.
 * - The admin checks (financials loaded, EBITDA > 0) are ours: we fill them within 24 h, admin sees
 *   them on the company page and the server enforces them before approval and before payment.
 */
export type SellerCheckKey = "identity" | "saleReason" | "description" | "price" | "sellerFinancing";
export type AdminCheckKey = "cnae" | "income" | "balance" | "structure" | "ebitda";

export type CheckItem<K extends string> = {
  key: K;
  label: string;
  done: boolean;
  href: string;
  hint?: string;
};

export type CheckList<K extends string> = {
  items: CheckItem<K>[];
  missing: string[];
  ready: boolean;
};

export type PublishChecklist = CheckList<SellerCheckKey>;
export type AdminPublishChecks = CheckList<AdminCheckKey>;

const detailHref = (panel: SellerFocusPanel, anchor: string = `panel-${panel}`) =>
  `/mi-empresa/detalles?seccion=${panel}&ancla=${encodeURIComponent(anchor)}#${anchor}`;

export const publishCheckLabels: Record<SellerCheckKey | AdminCheckKey, string> = {
  identity: "Nombre y NIF",
  saleReason: "Motivo de venta",
  description: "Descripción",
  price: "Precio de venta",
  sellerFinancing: "Financiación del vendedor",
  cnae: "CNAE principal",
  income: "Pérdidas y ganancias",
  balance: "Balance",
  structure: "Estructura (empleados)",
  ebitda: "EBITDA positivo",
};

export const ebitdaCheckHint = "Solo publicamos empresas con un EBITDA mayor que cero: el ajustado si hay ajustes, si no el del último cierre.";

function list<K extends SellerCheckKey | AdminCheckKey>(items: Omit<CheckItem<K>, "label">[]): CheckList<K> {
  const labelled = items.map((item) => ({ ...item, label: publishCheckLabels[item.key] }));
  const missing = labelled.filter((item) => !item.done).map((item) => item.label);
  return { items: labelled, missing, ready: missing.length === 0 };
}

export function publishChecklist(input: { panels: SellerPanelFlags; saleReason: boolean; sellerFinancing: boolean }): PublishChecklist {
  const items: Omit<CheckItem<SellerCheckKey>, "label">[] = [];
  // Name and NIF come from the NIF step; they only show while still missing.
  if (!input.panels.identity) {
    items.push({ key: "identity", done: false, href: detailHref("identity") });
  }
  items.push(
    { key: "saleReason", done: input.saleReason, href: detailHref("identity", "panel-sale-reason") },
    { key: "description", done: input.panels.description, href: detailHref("description") },
    { key: "price", done: input.panels.price, href: detailHref("price") },
    // t92: required; Sí or No completes it. Leftover Negociable is stored as Sí.
    { key: "sellerFinancing", done: input.sellerFinancing, href: detailHref("cnae", "panel-seller-financing") },
  );
  return list(items);
}

export function adminPublishChecks(input: { panels: SellerPanelFlags; ebitdaPositive: boolean }): AdminPublishChecks {
  return list<AdminCheckKey>([
    { key: "cnae", done: input.panels.cnae, href: "" },
    { key: "income", done: input.panels.income, href: "" },
    { key: "balance", done: input.panels.balance, href: "" },
    { key: "structure", done: input.panels.structure, href: "" },
    { key: "ebitda", done: input.ebitdaPositive, href: "", hint: ebitdaCheckHint },
  ]);
}

/** "Falta: A y B." for server messages; counts past three. */
export function missingHint(missing: string[]): string {
  if (missing.length === 0) {
    return "";
  }

  if (missing.length > 3) {
    return `Faltan ${missing.length} requisitos de la lista.`;
  }

  const items = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} y ${missing[missing.length - 1]}`;

  return `Falta: ${items}.`;
}

export const ebitdaBlockedMessage = "Necesitas un EBITDA positivo para publicar.";
export const financialsPendingMessage = "Podrás publicar en cuanto carguemos tus cuentas (en 24 h).";

/** Server message when the admin-side checks fail for a seller action (payment). */
export function adminChecksMessage(checks: AdminPublishChecks): string {
  const financialsMissing = checks.items.some((item) => item.key !== "ebitda" && !item.done);
  return financialsMissing ? financialsPendingMessage : ebitdaBlockedMessage;
}

/**
 * t85: steps that make the ficha stronger but never block publishing (the auto-publish rule above
 * stays as is). The client split only applies when the company sells to businesses.
 */
export type RecommendedCheckKey = "customer" | "productSplit" | "clientSplit" | "adjustedEbitda" | "sellerStay";

export const recommendedCheckLabels: Record<RecommendedCheckKey, string> = {
  customer: "¿A quién vendes?",
  productSplit: "Productos y servicios",
  clientSplit: "Reparto por clientes",
  adjustedEbitda: "EBITDA ajustado",
  sellerStay: "Asesoría tras la venta",
};

export function recommendedChecklist(input: {
  customerBase: "business" | "consumer" | "mixed" | null;
  productSlices: number;
  clientSlices: number;
  adjustments: number;
  /** t93: answered ¿Te quedarías como asesor? (any answer, No included). */
  sellerStay?: boolean;
}): CheckItem<RecommendedCheckKey>[] {
  const items: Omit<CheckItem<RecommendedCheckKey>, "label">[] = [
    { key: "customer", done: input.customerBase !== null, href: detailHref("structure", "panel-customer") },
    { key: "productSplit", done: input.productSlices > 0, href: detailHref("structure", "panel-product-split") },
  ];
  if (input.customerBase === "business" || input.customerBase === "mixed") {
    items.push({ key: "clientSplit", done: input.clientSlices > 0, href: detailHref("structure", "panel-client-split") });
  }
  items.push({
    key: "adjustedEbitda",
    done: input.adjustments > 0,
    href: detailHref("price", "ebitda-ajustado"),
    hint: "Si hay gastos o ingresos que un comprador no tendría, añádelos como ajustes para mostrar lo que el negocio gana de verdad.",
  });
  if (input.sellerStay !== undefined) {
    items.push({ key: "sellerStay", done: input.sellerStay, href: detailHref("cnae", "panel-seller-stay") });
  }
  return items.map((item) => ({ ...item, label: recommendedCheckLabels[item.key] }));
}
