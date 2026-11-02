import { renderEmail } from "./email/layout";
import { madridTime, SABI_NOTIFY_TO } from "./sabi-request-email";

export const figureCorrectionMaxLength = 1500;

export type FigureCorrectionEmailInput = {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  message: string;
  adminUrl: string;
  at?: Date;
};

/** t76: internal note to info@ when a seller asks us to correct the figures we loaded. */
export function figureCorrectionEmail(input: FigureCorrectionEmailInput): { to: string; subject: string; text: string; html: string } {
  const name = input.companyName.trim() || "Empresa sin razón social";
  const subject = `Corrección de cifras: ${name}`;
  const rendered = renderEmail(subject, {
    preheader: `${name} propone corregir sus cifras.`,
    eyebrow: "Corrección",
    title: "Un vendedor propone corregir sus cifras",
    paragraphs: [input.message.trim()],
    rows: [
      { label: "Empresa", value: name },
      { label: "Vendedor", value: input.ownerName.trim() || "—" },
      { label: "Email", value: input.ownerEmail },
      { label: "Enviada", value: madridTime(input.at ?? new Date()) },
    ],
    cta: { label: "Abrir ficha en admin", url: input.adminUrl },
    reason: "Aviso interno de Relify para el equipo.",
  });
  return { to: SABI_NOTIFY_TO, ...rendered };
}
