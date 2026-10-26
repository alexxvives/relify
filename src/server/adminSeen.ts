import { prisma } from "@/server/db";

export const adminSeenPages = ["home", "empresas", "cuentas", "asesores", "conexiones"] as const;
export type AdminSeenPage = (typeof adminSeenPages)[number];

/** First visit ever: only the last week counts as new, so a fresh admin is not flooded. */
function defaultSince(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

async function seenMap(adminId: string): Promise<Map<string, Date>> {
  const rows = await prisma.adminSeen.findMany({ where: { adminId }, select: { page: true, seenAt: true } });
  return new Map(rows.map((row) => [row.page, row.seenAt]));
}

/** Returns when the admin had last seen the page (before now) and records now as seen. */
export async function markAdminSeen(adminId: string, page: AdminSeenPage): Promise<Date> {
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

/** Sidebar bubbles: items created since the admin last opened each page. */
export async function adminNewCounts(adminId: string): Promise<Record<string, number>> {
  const seen = await seenMap(adminId);
  const since = (page: AdminSeenPage) => seen.get(page) ?? defaultSince();
  const [empresas, cuentas, asesores, conexiones] = await Promise.all([
    prisma.project.count({ where: { createdAt: { gt: since("empresas") } } }),
    prisma.user.count({ where: { createdAt: { gt: since("cuentas") } } }),
    prisma.user.count({ where: { role: "advisor", createdAt: { gt: since("asesores") } } }),
    prisma.projectAccess.count({ where: { requestedAt: { gt: since("conexiones") } } }),
  ]);
  return {
    "/admin/empresas": empresas,
    "/admin/cuentas": cuentas,
    "/admin/asesores": asesores,
    "/admin/conexiones": conexiones,
  };
}
