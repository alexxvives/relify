export const notificationCopy = {
  open: "Abrir avisos",
  close: "Cerrar avisos",
  title: "Avisos",
  empty: "No tienes avisos.",
  emptyUnread: "No tienes avisos sin leer.",
  caughtUp: "Al día",
  all: "Todos",
  unread: "Sin leer",
  markSeen: "Leído",
  markAllRead: "Marcar todos como leídos",
} as const;

export type NotificationView = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  when: string;
  unread: boolean;
};

export type NoticeSegment = {
  text: string;
  tone: "plain" | "accept" | "decline";
};

export function noticePhrase(text: string): string {
  return text
    .replaceAll("El inversor", "Un inversor")
    .replaceAll("el inversor", "un inversor")
    .replaceAll("El asesor", "Un asesor")
    .replaceAll("el asesor", "un asesor");
}

export function noticeSegments(text: string): NoticeSegment[] {
  return noticePhrase(text)
    .split(/(\b(?:acept|rechaz)[a-záéíóúüñ]*)/gi)
    .filter((part) => part.length > 0)
    .map((part) => {
      const lower = part.toLocaleLowerCase("es");

      if (lower.startsWith("acept")) {
        return { text: part, tone: "accept" };
      }

      if (lower.startsWith("rechaz")) {
        return { text: part, tone: "decline" };
      }

      return { text: part, tone: "plain" };
    });
}

export function noticesForCompany(
  codename: string,
  items: readonly { title: string; body: string; unread?: boolean }[],
): number {
  const name = codename.trim();

  if (name.length === 0) {
    return 0;
  }

  return items.filter((item) => item.unread === true && (item.body.includes(name) || item.title.includes(name))).length;
}

/** Connected buyers are named; before the seller accepts they stay anonymous. */
function buyerSubject(buyer: string | null | undefined): string {
  const name = buyer?.trim() ?? "";
  return name.length > 0 ? name : "Un inversor";
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

export function incomingNdaNotice(codename: string, buyer?: string | null): { title: string; body: string } {
  return {
    title: "NDA aceptado",
    body: `${buyerSubject(buyer)} ha aceptado el NDA de ${codename}.`,
  };
}

export function incomingQuestionNotice(codename: string, buyer?: string | null): { title: string; body: string } {
  return {
    title: "Nueva pregunta",
    body: `${buyerSubject(buyer)} ha enviado una pregunta sobre ${codename}.`,
  };
}

export function incomingMeetingNotice(codename: string, buyer?: string | null): { title: string; body: string } {
  return {
    title: "Reunión pedida",
    body: `${buyerSubject(buyer)} ha pedido una reunión sobre ${codename}.`,
  };
}

export function incomingOfferNotice(codename: string, buyer?: string | null): { title: string; body: string } {
  return {
    title: "Oferta indicativa",
    body: `${buyerSubject(buyer)} ha enviado una oferta indicativa sobre ${codename}.`,
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

export function processCancelledNotice(codename: string, who: "self" | "investor" | "seller", buyer?: string | null): { title: string; body: string } {
  if (who === "investor") {
    return { title: "Proceso cancelado", body: `${buyerSubject(buyer)} ha cancelado el proceso de ${codename}.` };
  }

  if (who === "seller") {
    return { title: "Proceso cancelado", body: `La empresa ha cancelado el proceso de ${codename}.` };
  }

  return { title: "Proceso cancelado", body: `Has cancelado el proceso de ${codename}.` };
}

export function questionSentNotice(codename: string): { title: string; body: string } {
  return {
    title: "Pregunta enviada",
    body: `Has escrito a ${codename}.`,
  };
}
