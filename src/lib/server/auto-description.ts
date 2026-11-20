import { prisma } from "@/lib/db";
import { autoCompanyDescription } from "@/lib/auto-description";

/**
 * S34: writes the template description (see src/lib/auto-description.ts) once, only while the stored description is
 * empty: after a registry (SABI) import and when Detalles opens. Never overwrites seller text. Failures are ignored.
 */
export async function ensureAutoDescription(projectId: string | null): Promise<void> {
  if (!projectId) return;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        description: true,
        foundedYear: true,
        headcountRange: true,
        region: true,
        customerBase: true,
        cnaes: { select: { code: true, role: true }, orderBy: { position: "asc" } },
      },
    });
    if (!project || (project.description ?? "").trim() !== "") return;
    const text = autoCompanyDescription({
      principalCnae: project.cnaes.find((cnae) => cnae.role === "principal")?.code ?? null,
      secondaryCnaes: project.cnaes.filter((cnae) => cnae.role === "secondary").map((cnae) => cnae.code),
      foundedYear: project.foundedYear,
      headcountRange: project.headcountRange,
      region: project.region,
      customerBase: project.customerBase,
    });
    if (!text) return;
    await prisma.project.updateMany({
      where: { id: projectId, OR: [{ description: null }, { description: "" }] },
      data: { description: text },
    });
  } catch {
    // Best effort: the seller can always write the description by hand.
  }
}
