import type { Prisma } from "@/generated/prisma/client";
import { advisorCopy } from "@/lib/advisor-copy";
import {
  eurosToCents,
  type CorporateInput,
  type DealsInput,
  type ServiceOfferInput,
} from "@/lib/advisor-profile";
import { normalizeCif } from "@/lib/spanish-cif";
import { prisma } from "@/server/db";

export type AdvisorSaveResult = { ok: true } | { ok: false; message: string };

async function advisorCanSave(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, onboardedAt: true },
  });

  return user?.role === "advisor" && user.onboardedAt !== null;
}

export async function saveAdvisorCorporate(
  userId: string,
  input: CorporateInput,
): Promise<AdvisorSaveResult> {
  if (!(await advisorCanSave(userId))) {
    return { ok: false, message: advisorCopy.forbidden };
  }

  const data = {
    businessName: input.businessName,
    nif: normalizeCif(input.nif),
    postalCode: input.postalCode,
    description: input.description,
    sectors: input.sectors,
  };

  await prisma.advisorProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return { ok: true };
}

export async function saveAdvisorServices(
  userId: string,
  offers: ServiceOfferInput[],
): Promise<AdvisorSaveResult> {
  if (!(await advisorCanSave(userId))) {
    return { ok: false, message: advisorCopy.forbidden };
  }

  const services: Prisma.InputJsonValue = offers.map((offer) => ({
    serviceType: offer.serviceType,
    priceFromCents: eurosToCents(offer.priceFrom),
    priceToCents: eurosToCents(offer.priceTo),
  }));

  await prisma.advisorProfile.upsert({
    where: { userId },
    create: { userId, services },
    update: { services },
  });

  return { ok: true };
}

export async function saveAdvisorDeals(
  userId: string,
  input: DealsInput,
): Promise<AdvisorSaveResult> {
  if (!(await advisorCanSave(userId))) {
    return { ok: false, message: advisorCopy.forbidden };
  }

  const operations = input.hasClosedOperations ? input.operations : [];
  const closedOperations: Prisma.InputJsonValue = operations.map(
    (operation) => ({
      name: operation.name,
      closingDate: operation.closingDate,
      sectorId: operation.sectorId,
      revenueCents: eurosToCents(operation.revenue),
      ebitdaCents: eurosToCents(operation.ebitda),
      enterpriseValueCents: eurosToCents(operation.enterpriseValue),
    }),
  );

  await prisma.advisorProfile.upsert({
    where: { userId },
    create: { userId, closedOperations, dealsAnswered: true },
    update: { closedOperations, dealsAnswered: true },
  });

  return { ok: true };
}
