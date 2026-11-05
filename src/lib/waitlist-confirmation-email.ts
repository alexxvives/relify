import { renderEmail } from "./email/layout";
import { waitlistCopy, waitlistOpensAt, type WaitlistInput } from "./waitlist";

const roleNote: Record<WaitlistInput["role"], string> = {
  company: "Cuando abramos podrás publicar tu empresa gratis, y la sociedad se queda en privado.",
  investor: "Cuando abramos podrás explorar las empresas en venta sin coste.",
  advisor: "Cuando abramos podrás acompañar nuevas operaciones de compraventa.",
};

const roleLabel = Object.fromEntries(waitlistCopy.roles.map((role) => [role.id, role.label])) as Record<
  WaitlistInput["role"],
  string
>;

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name.trim();
}

function openingDay(): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(waitlistOpensAt));
}

/** Confirmation to the person who just joined. The team notice is a separate email. */
export function waitlistConfirmationEmail(input: WaitlistInput & { siteUrl: string }): {
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  const name = firstName(input.name);
  const role = roleLabel[input.role];
  const home = new URL("/", input.siteUrl).toString();
  const subject = "Hemos recibido tu solicitud en Relify";
  const rendered = renderEmail(subject, {
    preheader: "Te avisaremos en cuanto abramos el marketplace.",
    eyebrow: "Lista de espera",
    title: name ? `Hola, ${name}` : "Hemos recibido tu solicitud",
    paragraphs: [
      `Tu solicitud como ${role.toLowerCase()} ya está en la lista de espera de Relify.`,
      `Te escribiremos a este correo cuando abramos, el ${openingDay()}. No hay cargo ni compromiso.`,
      roleNote[input.role],
    ],
    cta: { label: "Ir a Relify", url: home },
    note: "Si no has sido tú, ignora este correo.",
    reason: "Recibes este correo porque te has apuntado a la lista de espera de Relify.",
  });
  return { to: input.email.trim().toLowerCase(), ...rendered };
}
