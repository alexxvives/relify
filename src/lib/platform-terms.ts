/** Clauses of the platform agreement. `**text**` marks the key terms shown in bold. */
const clauses = [
  {
    title: "Qué es este acuerdo",
    text: "Relify es un mercado para poner en contacto a quien vende una empresa, quien quiere comprarla y quien asesora esa operación. Este texto es el **acuerdo de uso de la plataforma**. No es el contrato de compraventa ni una escritura.",
  },
  {
    title: "Operaciones cerradas fuera de Relify",
    text: "Durante los **dos años siguientes a cada conexión** que se abra en Relify, si esa empresa se vende entre las personas que se conectaron aquí, **la comisión de Relify se debe igual** aunque el cierre se haga fuera de la plataforma.",
  },
  {
    title: "Comisiones",
    text: "La comisión de cierre de Relify es el **5% del precio total para quien vende** y el **2,5% para quien compra**, o el **2%** si el comprador tenía el plan Empresa cuando se hizo el match. Un asesor paga a Relify el **15% de lo que cobre por cada encargo**, más el IVA de ese 15%. El precio total de la venta incluye la parte que se pague más tarde. La comisión de cierre se paga entera el día de la firma, sin mínimos, más el IVA.",
  },
  {
    title: "Confidencialidad",
    text: "Lo que ves de una empresa antes del acuerdo de confidencialidad es el **nombre de proyecto, la región y las cifras públicas**. La razón social, el CIF, la dirección y los nombres de los socios no se publican.",
  },
  {
    title: "Tus datos",
    text: "Los datos de tu cuenta (nombre, DNI/NIE y contacto) son tuyos y **son correctos**. Relify puede suspender la cuenta si hay una identidad falsa.",
  },
  {
    title: "Uso del chat",
    text: "**No uses el chat para pasar un teléfono, un correo o una vía para cerrar fuera de Relify.** Relify puede suspender la cuenta si lo hace.",
  },
  {
    title: "Validez",
    text: "**Este acuerdo es jurídicamente vinculante desde su aceptación (art. 23 de la Ley 34/2002, LSSI).**",
  },
] as const;

export const platformTermsCopy = {
  title: "Acuerdo con Relify",
  intro: "Antes de entrar, acepta este acuerdo.",
  clauses,
  /** Plain-text clauses for the PDF and previews. */
  body: clauses.map((clause) => clause.text.replaceAll("**", "")),
  signLabel: "Firma con el ratón",
  signHint: "Firma aquí",
  clearSignature: "Borrar firma",
  signRequired: "Firma en el recuadro antes de aceptar.",
  accept: "Acepto el acuerdo",
  signedTitle: "Tu acuerdo con Relify",
  signedOn: "Firmado",
  viewPdf: "Ver PDF",
  downloadPdf: "Descargar",
  signedMissing: "La firma todavía no está en tu cuenta.",
  pending: "Guardando…",
  /** S26b: success state after the signature is saved. */
  signedDone: "Acuerdo firmado",
  welcome: "¡Bienvenido a Relify!",
  welcomeBody: "Tu cuenta ya está lista.",
  required: "Marca la casilla para continuar.",
} as const;
