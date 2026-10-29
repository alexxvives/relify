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
    .replaceAll("El comprador", "Un comprador")
    .replaceAll("el comprador", "un comprador")
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

function mentions(text: string, name: string): boolean {
  let from = text.indexOf(name);
  while (from !== -1) {
    const next = text.charAt(from + name.length);
    if (!/[\p{L}\p{N}]/u.test(next)) {
      return true;
    }
    from = text.indexOf(name, from + 1);
  }
  return false;
}

/**
 * Which of the seller's companies a notice is about, by its codename in the title or body
 * ("Proyecto Cala: …"). Longest codename wins so "Proyecto Cala" never claims "Proyecto Cala Norte".
 */
export function noticeCompanyId(
  item: { title: string; body: string },
  companies: readonly { id: string; codename: string }[],
): string | null {
  const ranked = companies
    .map((company) => ({ id: company.id, name: company.codename.trim() }))
    .filter((company) => company.name.length > 0)
    .sort((a, b) => b.name.length - a.name.length);
  return ranked.find((company) => mentions(item.title, company.name) || mentions(item.body, company.name))?.id ?? null;
}

/** Notices for the active company (plus ones about no company); other companies only count unread. */
export function scopeNoticesToCompany<T extends { title: string; body: string; unread?: boolean }>(
  items: readonly T[],
  companies: readonly { id: string; codename: string }[],
  activeId: string | null,
): { scoped: T[]; unreadElsewhere: Record<string, number> } {
  if (companies.length < 2 || activeId === null) {
    return { scoped: items as T[], unreadElsewhere: {} };
  }
  const scoped: T[] = [];
  const unreadElsewhere: Record<string, number> = {};
  for (const item of items) {
    const owner = noticeCompanyId(item, companies);
    if (owner === null || owner === activeId) {
      scoped.push(item);
    } else if (item.unread === true) {
      unreadElsewhere[owner] = (unreadElsewhere[owner] ?? 0) + 1;
    }
  }
  return { scoped, unreadElsewhere };
}

export function noticesForCompany(
  codename: string,
  items: readonly { title: string; body: string; unread?: boolean }[],
): number {
  const name = codename.trim();

  if (name.length === 0) {
    return 0;
  }

  return items.filter((item) => item.unread === true && (mentions(item.body, name) || mentions(item.title, name))).length;
}

/** Connected buyers are named; before the seller accepts they stay anonymous. */
function buyerSubject(buyer: string | null | undefined): string {
  const name = buyer?.trim() ?? "";
  return name.length > 0 ? name : "Un comprador";
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
    body: `Un comprador ha solicitado acceso a ${codename}.`,
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

/** On the seller's own home the selected company is implied: "a Proyecto Cala" reads "a tu empresa". */
export function withoutOwnCompany<T extends { title: string; body: string }>(items: readonly T[], codename: string | null | undefined): T[] {
  const name = codename?.trim() ?? "";
  if (name.length === 0) {
    return [...items];
  }
  const swap = (text: string) => text.split(name).join("tu empresa");
  return items.map((item) => ({ ...item, title: swap(item.title), body: swap(item.body) }));
}

/** Notices that announce a seller "your turn" action; while pending, the action itself is counted instead. */
export const actionNoticeTitles: readonly string[] = ["Nuevo interés", "Oferta indicativa"];

/** Bell badge: pending actions plus unread notices, without counting an action and its own notice twice. */
export function bellCount(items: readonly { title: string; unread?: boolean }[], pendingActions = 0): number {
  const unread = items.filter((item) => item.unread && (pendingActions === 0 || !actionNoticeTitles.includes(item.title))).length;
  return unread + pendingActions;
}
