import { renderEmail } from "./email/layout";
import { madridTime, SABI_NOTIFY_TO } from "./sabi-request-email";
import { waitlistCopy, type WaitlistInput } from "./waitlist";

const roleLabel = Object.fromEntries(waitlistCopy.roles.map((role) => [role.id, role.label])) as Record<
  WaitlistInput["role"],
  string
>;

export type WaitlistLeadEmailInput = WaitlistInput & {
  adminUrl: string;
  at?: Date;
};

/** Internal heads-up when someone joins the public waitlist. Never sent to the person who signed up. */
export function waitlistLeadEmail(input: WaitlistLeadEmailInput): {
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  const name = input.name.trim();
  const role = roleLabel[input.role];
  const city = input.city.trim();
  const subject = `Lista de espera: ${name} (${role})`;
  const rendered = renderEmail(subject, {
    preheader: `${name} se ha apuntado como ${role.toLowerCase()}.`,
    eyebrow: "Lista de espera",
    title: "Nueva inscripción en la lista de espera",
    paragraphs: ["Alguien acaba de dejar sus datos en la lista de espera. El alta ya está guardada en admin."],
    rows: [
      { label: "Nombre", value: name },
      { label: "Correo", value: input.email },
      { label: "Perfil", value: role },
      { label: "Ciudad", value: city.length > 0 ? city : "—" },
      { label: "Alta", value: madridTime(input.at ?? new Date()) },
    ],
    cta: { label: "Abrir la lista de espera", url: input.adminUrl },
    reason: "Aviso interno de Relify para el equipo.",
  });
  return { to: SABI_NOTIFY_TO, ...rendered };
}
