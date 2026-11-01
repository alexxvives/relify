import { renderEmail } from "./email/layout";

export const SABI_NOTIFY_TO = "info@itsrelify.com";

export type SabiRequestEmailInput = {
  companyName: string;
  cif: string;
  ownerName: string;
  ownerEmail: string;
  adminUrl: string;
  /** When the CIF was entered; defaults to now. */
  at?: Date;
};

export function madridTime(at: Date): string {
  return `${at.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} (hora de Madrid)`;
}

/**
 * Internal heads-up to the team inbox (never to a comprador): a seller entered a CIF,
 * so SABI has to be loaded within 24 h. t73b: on the shared Relify layout.
 */
export function sabiRequestEmail(input: SabiRequestEmailInput): {
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  const name = input.companyName.trim() || "Empresa sin razón social";
  const subject = `SABI pendiente: ${name} (${input.cif})`;
  const rendered = renderEmail(subject, {
    preheader: `Carga el SABI de ${name} en las próximas 24 h.`,
    eyebrow: "SABI · 24 h",
    title: "Nueva empresa con CIF: carga su SABI",
    paragraphs: [
      "Un vendedor acaba de dar de alta su empresa con el CIF. Su ficha muestra «datos financieros en 24 h» hasta que cargues el informe.",
    ],
    rows: [
      { label: "Empresa", value: name },
      { label: "CIF", value: input.cif },
      { label: "Vendedor", value: input.ownerName.trim() || "—" },
      { label: "Email", value: input.ownerEmail },
      { label: "Alta", value: madridTime(input.at ?? new Date()) },
    ],
    cta: { label: "Abrir ficha en admin", url: input.adminUrl },
    reason: "Aviso interno de Relify para el equipo.",
  });
  return { to: SABI_NOTIFY_TO, ...rendered };
}
