import { companyCopy } from "@/lib/company-copy";
import type { RegistryCompany } from "@/lib/company-registry";
import { isValidSpanishCif, normalizeCif } from "@/lib/spanish-cif";
import type { CurrentUser } from "@/server/getCurrentUser";
import { lookupCompanyRegistry } from "@/server/lookupCompanyRegistry";
import { prisma } from "@/server/db";

export type VerifyNifResult = { ok: true } | { ok: false; message: string };

function prefillData(record: RegistryCompany) {
  return {
    cif: record.cif,
    legalName: record.legalName,
    address: record.address,
    region: record.region,
    codename: record.codename,
    foundedYear: record.foundedYear,
    description: record.description,
    principalCnae: record.principalCnae,
    secondaryCnaes: record.secondaryCnaes,
    revenueCents: record.revenueCents,
    ebitdaCents: record.ebitdaCents,
    adjustedEbitdaCents: record.adjustedEbitdaCents,
    headcountRange: record.headcount,
    statementYear: record.statementYear,
  };
}

export async function verifyCompanyNif(user: CurrentUser, rawNif: string): Promise<VerifyNifResult> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: companyCopy.nifNotSeller };
  }

  const cif = normalizeCif(rawNif);

  if (cif.length === 0) {
    return { ok: false, message: companyCopy.nifRequired };
  }

  if (!isValidSpanishCif(cif)) {
    return { ok: false, message: companyCopy.nifInvalid };
  }

  const record = await lookupCompanyRegistry(cif);

  if (record) {
    const data = prefillData(record);
    await prisma.companyRegistryPrefill.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
  } else {
    await prisma.companyRegistryPrefill.deleteMany({ where: { userId: user.id } });
  }

  const draft = await prisma.project.findFirst({
    where: { ownerId: user.id, status: "draft" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (draft) {
    await prisma.project.update({ where: { id: draft.id }, data: { cif } });
    await prisma.user.update({ where: { id: user.id }, data: { pendingCif: null } });
    return { ok: true };
  }

  await prisma.user.update({ where: { id: user.id }, data: { pendingCif: cif } });
  return { ok: true };
}

export async function companyNifIsVerified(user: CurrentUser): Promise<boolean> {
  if (user.role !== "seller") {
    return false;
  }

  const [draft, account] = await Promise.all([
    prisma.project.findFirst({
      where: { ownerId: user.id, status: "draft" },
      orderBy: { createdAt: "desc" },
      select: { cif: true },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { pendingCif: true } }),
  ]);
  const stored = draft?.cif.trim() ?? "";
  const pending = account?.pendingCif?.trim() ?? "";

  return stored.length > 0 || pending.length > 0;
}

export async function getSellerCif(user: CurrentUser): Promise<string> {
  const [draft, account] = await Promise.all([
    prisma.project.findFirst({
      where: { ownerId: user.id, status: "draft" },
      orderBy: { createdAt: "desc" },
      select: { cif: true },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { pendingCif: true } }),
  ]);
  const stored = draft?.cif.trim() ?? "";

  if (stored.length > 0) {
    return stored;
  }

  return account?.pendingCif?.trim() ?? "";
}

export async function sellerHasRegistryPrefill(user: CurrentUser): Promise<boolean> {
  const row = await prisma.companyRegistryPrefill.findUnique({
    where: { userId: user.id },
    select: { userId: true },
  });

  return row !== null;
}
