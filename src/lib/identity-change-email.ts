import { renderEmail } from "./email/layout";
import { madridTime, SABI_NOTIFY_TO } from "./sabi-request-email";

export const identityChangeMaxLength = 500;

export type IdentityChangeRequest = {
  field: "legalName" | "cif";
  current: string;
  correct: string;
  reason: string;
};

const fieldLabels: Record<IdentityChangeRequest["field"], string> = { legalName: "Nombre legal", cif: "NIF" };

/** t79: validates the "Solicitar cambio" modal (nombre legal / NIF are locked once verified). */
export function readIdentityChange(input: { field: string; current: string; correct: string; reason: string }):
  | { ok: true; request: IdentityChangeRequest }
  | { ok: false; message: string } {
  if (input.field !== "legalName" && input.field !== "cif") {
    return { ok: false, message: "Elige qué dato quieres cambiar." };
  }
  const correct = input.correct.trim();
  const reason = input.reason.trim();
  if (correct.length === 0) {
    return { ok: false, message: "Indica el dato correcto." };
  }
  if (reason.length < 5) {
    return { ok: false, message: "Cuéntanos brevemente el motivo." };
  }
  if ([input.current, correct, reason].some((value) => value.length > identityChangeMaxLength)) {
    return { ok: false, message: `Máximo ${identityChangeMaxLength} caracteres por campo.` };
  }
  return { ok: true, request: { field: input.field, current: input.current.trim(), correct, reason } };
}

export function identityChangeEmail(input: {
  request: IdentityChangeRequest;
  codename: string;
  ownerName: string;
  ownerEmail: string;
  adminUrl: string;
  at?: Date;
}): { to: string; subject: string; text: string; html: string } {
  const label = fieldLabels[input.request.field];
  const subject = `Solicitud de cambio de ${label.toLowerCase()}: ${input.codename}`;
  const rendered = renderEmail(subject, {
    preheader: `${input.codename} pide cambiar su ${label.toLowerCase()}.`,
    eyebrow: "Cambio de datos",
    title: `Un vendedor pide cambiar su ${label.toLowerCase()}`,
    paragraphs: [input.request.reason],
    rows: [
      { label: "Proyecto", value: input.codename },
      { label: "Dato", value: label },
      { label: "Dato actual", value: input.request.current || "—" },
      { label: "Dato correcto", value: input.request.correct },
      { label: "Vendedor", value: input.ownerName.trim() || "—" },
      { label: "Email", value: input.ownerEmail },
      { label: "Enviada", value: madridTime(input.at ?? new Date()) },
    ],
    cta: { label: "Abrir ficha en admin", url: input.adminUrl },
    reason: "Aviso interno de Relify para el equipo.",
  });
  return { to: SABI_NOTIFY_TO, ...rendered };
}
