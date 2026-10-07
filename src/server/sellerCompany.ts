import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { projectSlug } from "@/lib/company-draft";
import { pickSellerProjectId, sellerCompanyCookie } from "@/lib/seller-company";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type SellerCompanyChoice = {
  id: string;
  legalName: string;
  codename: string;
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function listSellerCompanies(ownerId: string): Promise<SellerCompanyChoice[]> {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, legalName: true, codename: true },
  });
}

export async function activeSellerProjectId(ownerId: string): Promise<string | null> {
  const companies = await listSellerCompanies(ownerId);
  const jar = await cookies();

  return pickSellerProjectId(
    companies.map((company) => company.id),
    jar.get(sellerCompanyCookie)?.value,
  );
}

async function rememberCompany(projectId: string): Promise<void> {
  const jar = await cookies();
  jar.set(sellerCompanyCookie, projectId, cookieOptions);
}

export async function selectSellerCompany(ownerId: string, projectId: string): Promise<boolean> {
  const owned = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });

  if (!owned) {
    return false;
  }

  await rememberCompany(owned.id);
  return true;
}

async function unusedSlug(codename: string): Promise<string> {
  const base = projectSlug(codename);
  let slug = base;
  let suffix = 2;

  while (await prisma.project.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createSellerCompany(user: CurrentUser): Promise<boolean> {
  if (!user.onboarded || user.role !== "seller") {
    return false;
  }

  const id = randomUUID();
  await prisma.project.create({
    data: {
      id,
      slug: await unusedSlug("proyecto-nuevo"),
      codename: "Proyecto nuevo",
      region: "",
      revenueCents: 0,
      ebitdaCents: 0,
      adjustedEbitdaCents: 0,
      askingPriceCents: 0,
      netDebtCents: 0,
      workingCapitalCents: 0,
      netIncomeCents: 0,
      legalName: "",
      cif: "",
      address: "",
      status: "draft",
      ownerId: user.id,
    },
  });
  await rememberCompany(id);
  return true;
}
