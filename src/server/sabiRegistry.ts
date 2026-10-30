import { readSabiRegistry, type SabiRegistry } from "@/lib/sabi/registry";
import { prisma } from "@/server/db";

export { readSabiRegistry, sabiRegistryIsEmpty, type SabiRegistry } from "@/lib/sabi/registry";

export const sabiRegistrySelect = { directors: true, shareholdings: true, subsidiaries: true, audits: true, banks: true, activityCodes: true } as const;

export async function getSabiRegistry(projectId: string): Promise<SabiRegistry | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: sabiRegistrySelect });
  return project ? readSabiRegistry(project) : null;
}
