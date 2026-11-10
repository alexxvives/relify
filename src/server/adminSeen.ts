import { prisma } from "@/server/db";

export const adminSeenPages = [
  "home",
  "empresas",
  "cuentas",
  "asesores",
  "conexiones",
  "mensajes",
  "waitlist",
  "valoraciones",
] as const;
export type AdminSeenPage = (typeof adminSeenPages)[number];

/** Rolling week. Cuentas and Lista de espera keep this window even after a visit. */
export function recentSince(now = Date.now()): Date {
  return new Date(now - 7 * 24 * 60 * 60 * 1000);
}

/** First visit ever: only the last week counts as new, so a fresh admin is not flooded. */
function defaultSince(): Date {
  return recentSince();
}

async function seenMap(adminId: string): Promise<Map<string, Date>> {
  const rows = await prisma.adminSeen.findMany({
    where: { adminId },
    select: { page: true, seenAt: true },
  });
  return new Map(rows.map((row) => [row.page, row.seenAt]));
}

/** Returns when the admin had last seen the page (before now) and records now as seen. */
export async function markAdminSeen(
  adminId: string,
  page: AdminSeenPage,
): Promise<Date> {
  const previous = await prisma.adminSeen.findUnique({
    where: { adminId_page: { adminId, page } },
    select: { seenAt: true },
  });
  const now = new Date();
  await prisma.adminSeen.upsert({
    where: { adminId_page: { adminId, page } },
    create: { adminId, page, seenAt: now },
    update: { seenAt: now },
  });
  return previous?.seenAt ?? defaultSince();
}

export type AdminNavCount = {
  total: number;
  alert: number;
  alertLabel: string;
};

/**
 * Sidebar bubbles: a total per page, plus a red bubble. Empresas: CIFs waiting for the SABI import
 * plus companies pending review (stays until imported / approved). Cuentas and Lista de espera:
 * created in the last 7 days (stays for the week). Asesores, Conexiones and Mensajes: created
 * since the admin last opened the page (cleared on visit, stored per admin in AdminSeen).
 */
export async function adminNavCounts(
  adminId: string,
): Promise<Record<string, AdminNavCount>> {
  const seen = await seenMap(adminId);
  const since = (page: AdminSeenPage) => seen.get(page) ?? defaultSince();
  const [
    companies,
    sabiPending,
    accounts,
    newAccounts,
    advisors,
    newAdvisors,
    accesses,
    newAccesses,
    messages,
    newMessages,
    subscribers,
    newSubscribers,
    waitlist,
    newWaitlist,
    valuations,
    receivedValuations,
  ] = await Promise.all([
    prisma.project.count(),
    // t75: plus companies waiting for approval (auto-submitted when the seller list is complete).
    prisma.project.count({ where: { OR: [{ NOT: { cif: "" }, sabiImportedAt: null }, { status: "pending" }] } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gt: recentSince() } } }),
    prisma.user.count({ where: { role: "advisor" } }),
    prisma.user.count({
      where: { role: "advisor", createdAt: { gt: since("asesores") } },
    }),
    prisma.projectAccess.count(),
    prisma.projectAccess.count({
      where: { requestedAt: { gt: since("conexiones") } },
    }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { createdAt: { gt: since("mensajes") } } }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { createdAt: { gt: since("mensajes") } } }),
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { createdAt: { gt: recentSince() } } }),
    prisma.valuationRequest.count(),
    prisma.valuationRequest.count({ where: { status: "received" } }),
  ]);
  return {
    "/admin/empresas": {
      total: companies,
      alert: sabiPending,
      alertLabel: "pendientes de SABI o de revisión",
    },
    "/admin/cuentas": {
      total: accounts,
      alert: newAccounts,
      alertLabel: "nuevas en los últimos 7 días",
    },
    "/admin/asesores": {
      total: advisors,
      alert: newAdvisors,
      alertLabel: "nuevos desde tu última visita",
    },
    "/admin/conexiones": {
      total: accesses,
      alert: newAccesses,
      alertLabel: "nuevas desde tu última visita",
    },
    "/admin/mensajes": {
      total: messages + subscribers,
      alert: newMessages + newSubscribers,
      alertLabel: "nuevos desde tu última visita",
    },
    "/admin/lista-de-espera": {
      total: waitlist,
      alert: newWaitlist,
      alertLabel: "nuevas en los últimos 7 días",
    },
    "/admin/valoraciones": {
      total: valuations,
      alert: receivedValuations,
      alertLabel: "recibidas, pendientes de informe",
    },
  };
}
