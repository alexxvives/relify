import { renderEmail } from "./email/layout";
import { madridTime, SABI_NOTIFY_TO } from "./sabi-request-email";

export type PublishRequestEmailInput = {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  adminUrl: string;
  /** The listing fee was paid (2nd and later companies). */
  paid: boolean;
  at?: Date;
};

/** t75: internal heads-up to info@ when a company moves to review on its own. Never to a comprador. */
export function publishRequestEmail(input: PublishRequestEmailInput): { to: string; subject: string; text: string; html: string } {
  const name = input.companyName.trim() || "Empresa sin razón social";
  const subject = `Empresa para revisar: ${name}`;
  const rendered = renderEmail(subject, {
    preheader: `${name} está lista para revisar y publicar.`,
    eyebrow: "Revisión",
    title: "Una empresa espera tu aprobación",
    paragraphs: [
      "El vendedor ha completado su ficha y la empresa ha pasado a Pendiente. Revisa las comprobaciones en admin y apruébala para que salga en el catálogo.",
    ],
    rows: [
      { label: "Empresa", value: name },
      { label: "Vendedor", value: input.ownerName.trim() || "—" },
      { label: "Email", value: input.ownerEmail },
      { label: "Publicación", value: input.paid ? "Pagada" : "Gratuita" },
      { label: "Enviada", value: madridTime(input.at ?? new Date()) },
    ],
    cta: { label: "Abrir ficha en admin", url: input.adminUrl },
    reason: "Aviso interno de Relify para el equipo.",
  });
  return { to: SABI_NOTIFY_TO, ...rendered };
}
