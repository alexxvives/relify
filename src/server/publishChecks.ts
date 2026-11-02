import { centsToEuroInput } from "@/lib/company-draft";
import { sellerPanelFlags } from "@/lib/company-profile";
import { adminPublishChecks, publishChecklist, type AdminPublishChecks, type PublishChecklist } from "@/lib/publish-checklist";
import { prisma } from "@/server/db";

/** t75: one loader for the seller checklist and the admin checks, so every gate agrees. */
export async function loadPublishChecks(projectId: string): Promise<{ seller: PublishChecklist; admin: AdminPublishChecks } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      legalName: true,
      cif: true,
      description: true,
      saleReason: true,
      ebitdaCents: true,
      askingPriceCents: true,
      headcountRange: true,
      cnaes: { select: { role: true, code: true } },
      activitySlices: { where: { kind: "capital" }, select: { id: true } },
      years: { where: { kind: "closed" }, select: { salesCents: true, currentAssetsCents: true, equityCents: true } },
    },
  });

  if (!project) {
    return null;
  }

  const panels = sellerPanelFlags({
    legalName: project.legalName,
    cif: project.cif,
    description: project.description ?? "",
    principalCnae: project.cnaes.find((cnae) => cnae.role === "principal")?.code ?? "",
    closedYears: project.years.map((year) => ({
      sales: year.salesCents === null ? "" : "1",
      currentAssets: year.currentAssetsCents === null ? "" : "1",
      equity: year.equityCents === null ? "" : "1",
    })),
    headcount: project.headcountRange ?? "",
    capitalPercents: project.activitySlices.map(() => "1"),
    askingPrice: centsToEuroInput(project.askingPriceCents),
  });

  return {
    seller: publishChecklist({ panels, saleReason: (project.saleReason ?? "").trim().length > 0 }),
    admin: adminPublishChecks({ panels, ebitdaPositive: project.ebitdaCents > 0 }),
  };
}
