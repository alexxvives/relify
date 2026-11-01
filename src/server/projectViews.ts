import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";

/** Records that an investor opened a company's ficha. Never throws: a failed write must not break the page. */
export async function recordProjectView(
  investorId: string,
  slug: string,
): Promise<void> {
  try {
    const project = await prisma.project.findFirst({
      where: { slug, status: "published" },
      select: { id: true, ownerId: true },
    });
    if (!project || project.ownerId === investorId) return;
    const now = new Date();
    await prisma.projectView.upsert({
      where: { projectId_investorId: { projectId: project.id, investorId } },
      create: {
        id: randomUUID(),
        projectId: project.id,
        investorId,
        viewedAt: now,
        lastViewedAt: now,
      },
      update: { lastViewedAt: now },
    });
  } catch {
    // Analytics only.
  }
}
