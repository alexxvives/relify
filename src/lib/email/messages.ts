import { renderEmail, type RenderedEmail } from "./layout";

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

export function verifyEmail(url: string): RenderedEmail {
  return renderEmail("Confirma tu correo en Relify", {
    preheader: "Un clic para confirmar que este correo es tuyo.",
    eyebrow: "Cuenta",
    title: "Confirma tu correo",
    paragraphs: [
      "Pulsa el botón para confirmar que esta dirección es tuya. Así podremos avisarte de solicitudes, mensajes y cambios en tu cuenta.",
    ],
    cta: { label: "Confirmar correo", url },
    note: "El enlace caduca en 24 horas. Si no has creado una cuenta en Relify, ignora este correo.",
    reason: accountReason,
  });
}

const noticeReason =
  "Recibes este aviso por la actividad de tu cuenta en Relify. Si no quieres más avisos por correo, escríbenos a info@itsrelify.com.";

function greeting(firstName: string): string {
  return firstName ? `Hola, ${firstName}:` : "Hola:";
}

/** To the seller (or the advisor who owns the mandate): their own company, so its name is fine here. */
export function reportReadyEmail(
  firstName: string,
  companyName: string,
  url: string,
): RenderedEmail {
  return renderEmail(`Tu informe financiero de ${companyName} está listo`, {
    preheader:
      "Ya puedes revisar los datos financieros de tu empresa en Relify.",
    eyebrow: "Informe financiero",
    title: "Tu informe financiero está listo",
    paragraphs: [
      greeting(firstName),
      `Hemos preparado el informe financiero de ${companyName} con los datos de sus cuentas anuales. Revísalo y, si algo no cuadra, cuéntanoslo antes de publicar.`,
      "Los compradores no ven estos datos hasta que tú decides compartirlos.",
    ],
    cta: { label: "Revisar mi informe", url },
    reason: noticeReason,
  });
}
