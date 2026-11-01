import type { SellerFocusPanel, SellerPanelFlags } from "./company-profile";

/**
 * t74: the "Pedir publicación" checklist. Pure so the seller card, the button and the server
 * gate all agree on what is still missing.
 */
export type PublishCheckKey = SellerFocusPanel | "saleReason" | "ebitda";

export type PublishCheckItem = {
  key: PublishCheckKey;
  label: string;
  done: boolean;
  /** Filled by the registry import (SABI) rather than typed by the seller. */
  fromRegistry: boolean;
  href: string;
  hint?: string;
};

export type PublishChecklist = {
  items: PublishCheckItem[];
  missing: string[];
  ready: boolean;
};

const detailHref = (panel: SellerFocusPanel, anchor: string = `panel-${panel}`) =>
  `/mi-empresa/detalles?seccion=${panel}#${anchor}`;

export const publishCheckLabels: Record<PublishCheckKey, string> = {
  identity: "Nombre y NIF",
  saleReason: "Motivo de venta",
  description: "Descripción",
  cnae: "CNAE principal",
  income: "Pérdidas y ganancias",
  ebitda: "EBITDA positivo",
  balance: "Balance",
  structure: "Estructura y actividad",
  price: "Precio de venta",
};

export const ebitdaCheckHint = "Solo publicamos empresas con un EBITDA del último cierre mayor que cero.";

export function publishChecklist(input: {
  panels: SellerPanelFlags;
  saleReason: boolean;
  ebitdaPositive: boolean;
  registryImported: boolean;
}): PublishChecklist {
  const registry = input.registryImported;
  const items: PublishCheckItem[] = [
    { key: "identity", done: input.panels.identity, fromRegistry: registry, href: detailHref("identity") },
    { key: "saleReason", done: input.saleReason, fromRegistry: false, href: detailHref("identity") },
    { key: "description", done: input.panels.description, fromRegistry: false, href: detailHref("description") },
    { key: "cnae", done: input.panels.cnae, fromRegistry: registry, href: detailHref("cnae") },
    { key: "income", done: input.panels.income, fromRegistry: registry, href: detailHref("income") },
    {
      key: "ebitda",
      done: input.ebitdaPositive,
      fromRegistry: registry,
      href: detailHref("income"),
      hint: ebitdaCheckHint,
    },
    { key: "balance", done: input.panels.balance, fromRegistry: registry, href: detailHref("balance") },
    { key: "structure", done: input.panels.structure, fromRegistry: registry, href: detailHref("structure") },
    { key: "price", done: input.panels.price, fromRegistry: false, href: detailHref("price") },
  ].map((item) => ({ ...item, label: publishCheckLabels[item.key as PublishCheckKey], fromRegistry: item.fromRegistry && item.done })) as PublishCheckItem[];
  const missing = items.filter((item) => !item.done).map((item) => item.label);

  return { items, missing, ready: missing.length === 0 };
}

/** One short line under the disabled button: "Falta: Motivo de venta y Precio de venta". */
export function missingHint(missing: string[]): string {
  if (missing.length === 0) {
    return "";
  }

  if (missing.length > 3) {
    return `Faltan ${missing.length} requisitos de la lista.`;
  }

  const list =
    missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} y ${missing[missing.length - 1]}`;

  return `Falta: ${list}.`;
}

export const ebitdaBlockedMessage = "Necesitas un EBITDA positivo para publicar.";
