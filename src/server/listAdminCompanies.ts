import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type AdminCompanyRow = {
  id: string;
  codename: string;
  region: string;
  status: "draft" | "pending" | "published";
  askingPriceCents: number;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  ownerEmail: string | null;
  legalName: string;
  cif: string;
  address: string;
  shareholders: string[];
  fileNames: string[];
};

export async function listAdminCompanies(user: CurrentUser): Promise<AdminCompanyRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      codename: true,
      region: true,
      status: true,
      askingPriceCents: true,
      revenueCents: true,
      ebitdaCents: true,
      adjustedEbitdaCents: true,
      legalName: true,
      cif: true,
      address: true,
      owner: { select: { email: true } },
      shareholders: { select: { name: true }, orderBy: { name: "asc" } },
      dataRoomFiles: { select: { fileName: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return projects.map((project) => ({
    id: project.id,
    codename: project.codename,
    region: project.region,
    status: project.status,
    askingPriceCents: project.askingPriceCents,
    revenueCents: project.revenueCents,
    ebitdaCents: project.ebitdaCents,
    adjustedEbitdaCents: project.adjustedEbitdaCents,
    ownerEmail: project.owner?.email ?? null,
    legalName: project.legalName,
    cif: project.cif,
    address: project.address,
    shareholders: project.shareholders.map((holder) => holder.name),
    fileNames: project.dataRoomFiles.map((file) => file.fileName),
  }));
}
