import { randomUUID } from "node:crypto";
import { billingCopy } from "@/lib/billing-copy";
import { eurosToCents } from "@/lib/company-draft";
import {
  clientCompanySlug,
  type ClientCompanyInput,
} from "@/lib/client-company";
import { normalizeCif } from "@/lib/spanish-cif";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

export type ClientCompanyResult = { ok: true } | { ok: false; message: string };

async function unusedSlug(codename: string): Promise<string> {
  const base = clientCompanySlug(codename);
  let slug = base;
  let suffix = 2;

  while (
    await prisma.project.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createClientCompany(
  user: CurrentUser,
  input: ClientCompanyInput,
): Promise<ClientCompanyResult> {
  if (!user.onboarded || user.role !== "advisor") {
    return { ok: false, message: billingCopy.publishForbidden };
  }

  const slug = await unusedSlug(input.codename);
  const projectId = randomUUID();

  await prisma.project.create({
    data: {
      id: projectId,
      slug,
      codename: input.codename,
      region: input.region,
      revenueCents: eurosToCents(input.revenue),
      ebitdaCents: eurosToCents(input.ebitda),
      adjustedEbitdaCents: eurosToCents(input.adjustedEbitda),
      askingPriceCents: eurosToCents(input.askingPrice),
      netIncomeCents: 0,
      legalName: input.legalName,
      cif: normalizeCif(input.cif),
      address: input.address,
      status: "draft",
      ownerId: user.id,
      saleMandates: {
        create: {
          id: randomUUID(),
          advisorId: user.id,
        },
      },
    },
  });

  return { ok: true };
}
