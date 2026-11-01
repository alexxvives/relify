import { renderEmail, type RenderedEmail } from "@/lib/email/layout";

/**
 * t73b: every transactional email Relify sends, in Spanish. Builders take only what the
 * recipient may see: emails to a comprador carry the public codename, never registry names,
 * CIF or financials.
 */

const accountReason = "Recibes este correo porque tienes una cuenta en Relify.";
  "Recibes este aviso por la actividad de tu cuenta en Relify. Si no quieres más avisos por correo, escríbenos a info@itsrelify.com.";

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
