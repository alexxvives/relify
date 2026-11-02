import { slicePercentIssue } from "./company-profile";

export type CompletionSection = "basic" | "structure" | "deal";

export type RequiredField = {
  /** DOM id the progress list scrolls to. */
  id: string;
  label: string;
  section: CompletionSection;
  done: boolean;
};

export type CompletionInput = {
  saleReason: string;
  description: string;
  principalCnae: string;
  customerBase: string;
  productPercents: string[];
  clientPercents: string[];
  askingPrice: string;
};

function splitDone(values: string[]): boolean {
  return values.some((value) => value.trim() !== "") && slicePercentIssue(values) === "ok";
}

/**
 * t78: the seller's required fields. A section is complete only when all of its required fields are; the progress
 * ring counts fields and the checklist names the fields, not the sections.
 */
export function sellerRequiredFields(input: CompletionInput): RequiredField[] {
  const businessClients = input.customerBase === "business" || input.customerBase === "mixed";
  return [
    { id: "panel-sale-reason", label: "Motivo de venta", section: "basic", done: input.saleReason !== "" },
    { id: "panel-description", label: "Descripción", section: "basic", done: input.description.trim() !== "" },
    { id: "panel-cnae", label: "Sector", section: "basic", done: input.principalCnae.trim() !== "" },
    { id: "panel-customer", label: "Tipo de clientes", section: "structure", done: input.customerBase !== "" },
    { id: "panel-product-split", label: "Ventas por producto", section: "structure", done: splitDone(input.productPercents) },
    ...(businessClients
      ? [{ id: "panel-client-split", label: "Ventas por cliente", section: "structure" as const, done: splitDone(input.clientPercents) }]
      : []),
    { id: "panel-asking-price", label: "Precio de venta", section: "deal", done: input.askingPrice.trim() !== "" },
  ];
}

export function sectionComplete(fields: RequiredField[], section: CompletionSection): boolean {
  return fields.filter((field) => field.section === section).every((field) => field.done);
}

export function completionProgress(fields: RequiredField[]) {
  return {
    done: fields.filter((field) => field.done).length,
    total: fields.length,
    missing: fields.filter((field) => !field.done).map((field) => ({ id: field.id, label: field.label })),
    /** t79: every required field with its state, for the grouped checklist. */
    fields,
  };
}
