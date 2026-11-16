import { renderEmail } from "./email/layout";
import { madridTime, SABI_NOTIFY_TO } from "./sabi-request-email";

export type ValuationRequestEmailInput = {
  cif: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  linkedAccount: boolean;
  adminUrl: string;
  at?: Date;
};

/** Internal heads-up when someone requests a valuation on /valorar. Never sent to the requester. */
export function valuationRequestEmail(input: ValuationRequestEmailInput): {
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  const name = input.contactName.trim() || "Sin nombre";
  const subject = `Valoración solicitada: ${name} (${input.cif})`;
  const rendered = renderEmail(subject, {
    preheader: `${name} ha pedido una valoración para el CIF ${input.cif}.`,
    eyebrow: "Valoración",
    title: "Nueva solicitud de valoración",
    paragraphs: [
      "Alguien acaba de pedir una valoración desde /valorar. La solicitud ya está en admin. El siguiente paso es cargar el SABI y redactar el informe.",
    ],
    rows: [
      { label: "CIF", value: input.cif },
      { label: "Nombre", value: name },
      { label: "Correo", value: input.contactEmail },
      { label: "Teléfono", value: input.phone?.trim() ? input.phone.trim() : "—" },
      { label: "Cuenta", value: input.linkedAccount ? "Vinculada" : "Visitante" },
      { label: "Alta", value: madridTime(input.at ?? new Date()) },
    ],
    cta: { label: "Abrir valoraciones", url: input.adminUrl },
    reason: "Aviso interno de Relify para el equipo.",
  });
  return { to: SABI_NOTIFY_TO, ...rendered };
}
