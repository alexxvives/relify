import { renderEmail } from "./email/layout";
import { valuationCopy } from "./valuation-request";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name.trim();
}

/** Confirmation to the person who requested a valuation. The team notice is a separate email. */
export function valuationRequestConfirmationEmail(input: {
  contactName: string;
  contactEmail: string;
  cif: string;
  siteUrl: string;
}): {
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  const name = firstName(input.contactName);
  const home = new URL("/", input.siteUrl).toString();
  const subject = "Hemos recibido tu solicitud de valoración";
  const rendered = renderEmail(subject, {
    preheader: valuationCopy.doneBody,
    eyebrow: "Valoración",
    title: name ? `Hola, ${name}` : "Hemos recibido tu solicitud",
    paragraphs: [
      valuationCopy.doneBody,
      `Hemos registrado el CIF ${input.cif}. Te escribiremos a este correo cuando el informe esté listo.`,
      "Esto no abre una cuenta ni publica la sociedad. No hay cargo ni compromiso.",
    ],
    cta: { label: "Ir a Relify", url: home },
    note: "Si no has sido tú, ignora este correo.",
    reason: "Recibes este correo porque has solicitado una valoración en Relify.",
  });
  return { to: input.contactEmail.trim().toLowerCase(), ...rendered };
}
