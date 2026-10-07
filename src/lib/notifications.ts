export const notificationCopy = {
  open: "Abrir avisos",
  close: "Cerrar avisos",
  title: "Avisos",
  empty: "No tienes avisos.",
  emptyUnread: "No tienes avisos sin leer.",
  caughtUp: "Al día",
  all: "Todos",
  unread: "Sin leer",
} as const;

export type NotificationView = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  unread: boolean;
};

export function noticesForCompany(
  codename: string,
  items: readonly { title: string; body: string }[],
): number {
  const name = codename.trim();

  if (name.length === 0) {
    return 0;
  }

  return items.filter((item) => item.body.includes(name) || item.title.includes(name)).length;
}

export function accessRequestedNotice(codename: string): { title: string; body: string } {
  return {
    title: "Solicitud enviada",
    body: `Has pedido acceso a ${codename}.`,
  };
}

export function incomingAccessNotice(codename: string): { title: string; body: string } {
  return {
    title: "Nuevo interés",
    body: `Un inversor ha solicitado acceso a ${codename}.`,
  };
}

export function ndaAcceptedNotice(codename: string): { title: string; body: string } {
  return {
    title: "NDA aceptado",
    body: `Has aceptado el NDA de ${codename}.`,
  };
}

export function incomingNdaNotice(codename: string): { title: string; body: string } {
  return {
    title: "NDA aceptado",
    body: `Un inversor ha aceptado el NDA de ${codename}.`,
  };
}

export function incomingQuestionNotice(codename: string): { title: string; body: string } {
  return {
    title: "Nueva pregunta",
    body: `Un inversor ha enviado una pregunta sobre ${codename}.`,
  };
}

export function incomingMeetingNotice(codename: string): { title: string; body: string } {
  return {
    title: "Reunión pedida",
    body: `Un inversor ha pedido una reunión sobre ${codename}.`,
  };
}

export function incomingOfferNotice(codename: string): { title: string; body: string } {
  return {
    title: "Oferta indicativa",
    body: `Un inversor ha enviado una oferta indicativa sobre ${codename}.`,
  };
}

export function sellerReplyNotice(codename: string): { title: string; body: string } {
  return {
    title: "Respuesta de la empresa",
    body: `Hay una respuesta en ${codename}.`,
  };
}

export function dataRoomSharedNotice(codename: string): { title: string; body: string } {
  return {
    title: "Dataroom compartido",
    body: `${codename} ha compartido documentación contigo.`,
  };
}

export function questionSentNotice(codename: string): { title: string; body: string } {
  return {
    title: "Pregunta enviada",
    body: `Has escrito a ${codename}.`,
  };
}
