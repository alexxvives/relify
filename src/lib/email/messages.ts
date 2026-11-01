import { renderEmail, type RenderedEmail } from "@/lib/email/layout";

/**
 * t73b: every transactional email Relify sends, in Spanish. Builders take only what the
 * recipient may see: emails to a comprador carry the public codename, never registry names,
 * CIF or financials.
 */

const accountReason = "Recibes este correo porque tienes una cuenta en Relify.";

export function passwordResetEmail(url: string): RenderedEmail {
  return renderEmail("Restablece tu contraseña de Relify", {
    preheader: "El enlace caduca en 1 hora y solo se puede usar una vez.",
    eyebrow: "Cuenta",
    title: "Restablece tu contraseña",
    paragraphs: [
      "Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en Relify.",
      "Pulsa el botón para elegir una nueva. Al hacerlo se cerrarán las sesiones abiertas en otros dispositivos.",
    ],
    cta: { label: "Elegir nueva contraseña", url },
    note: "El enlace caduca en 1 hora y solo funciona una vez. Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.",
    reason: accountReason,
  });
}

export type WelcomeRole = "seller" | "investor" | "advisor";

const welcomeCopy: Record<
  WelcomeRole,
  { eyebrow: string; lead: string; steps: string[]; cta: string; path: string }
> = {
  seller: {
    eyebrow: "Vendedor",
    lead: "Tu cuenta de vendedor ya está lista. Desde Mi empresa preparas la venta a tu ritmo y decides qué ve cada comprador.",
    steps: [
      "Añade tu empresa con su CIF.",
      "Revisa la ficha y los datos financieros que preparamos.",
      "Cuando la publiquemos, los compradores verán solo un perfil anónimo.",
    ],
    cta: "Ir a Mi empresa",
    path: "/mi-empresa",
  },
  investor: {
    eyebrow: "Comprador",
    lead: "Tu cuenta de comprador ya está lista. Explora empresas en venta publicadas de forma anónima y pide acceso a las que te interesen.",
    steps: [
      "Define tus criterios de búsqueda.",
      "Guarda en favoritos las oportunidades que encajen.",
      "Solicita acceso: el vendedor decide si comparte más información contigo.",
    ],
    cta: "Ver oportunidades",
    path: "/inversor",
  },
  advisor: {
    eyebrow: "Asesor",
    lead: "Tu cuenta de asesor ya está lista. Gestiona los mandatos de venta de tus clientes desde un único panel.",
    steps: [
      "Da de alta el mandato de cada empresa que representas.",
      "Sigue las solicitudes de compradores en cada proceso.",
      "Comparte información solo con los compradores que apruebes.",
    ],
    cta: "Ir a Mandatos",
    path: "/mandatos",
  },
};

export function welcomeEmail(
  role: WelcomeRole,
  firstName: string,
  site: URL,
): RenderedEmail {
  const copy = welcomeCopy[role];
  return renderEmail("Te damos la bienvenida a Relify", {
    preheader: copy.lead,
    eyebrow: copy.eyebrow,
    title: firstName ? `Hola, ${firstName}` : "Te damos la bienvenida",
    paragraphs: [
      copy.lead,
      ...copy.steps.map((step, index) => `${index + 1}. ${step}`),
    ],
    cta: { label: copy.cta, url: new URL(copy.path, site).toString() },
    note: "¿Dudas? Responde a este correo y te ayudamos.",
    reason: accountReason,
  });
}
