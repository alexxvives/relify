import { sellerFinancingWrite } from "@/lib/seller-financing";
import { randomUUID } from "node:crypto";
import { codenameIsFree, uniqueCodename } from "@/server/uniqueCodename";
import { isCuratedNickname } from "@/lib/nickname";
import { companyCopy } from "@/lib/company-copy";
import {
  projectSlug,
  type CompanyDraftInput,
} from "@/lib/company-draft";
import {
  descriptionContainsSecret,
  parsePercentToBasisPoints,
  type SliceKind,
} from "@/lib/company-profile";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { lockedIdentity, sellerAdjustmentWrite, sellerMoneyFields } from "@/lib/seller-draft-guard";
import { Prisma } from "@/generated/prisma/client";

export type SaveCompanyDraftResult =
  { ok: true } | { ok: false; message: string };

async function unusedSlug(codename: string): Promise<string> {
  const base = projectSlug(codename);
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

function basisPointsFor(values: string[]): number[] | null {
  const parsed = values.map((value) => parsePercentToBasisPoints(value));

  if (parsed.some((value) => value === null)) {
    return null;
  }

  return parsed.filter((value): value is number => value !== null);
}

function sliceData(projectId: string, kind: SliceKind, basisPoints: number[]) {
  return basisPoints.map((points, index) => ({
    id: randomUUID(),
    projectId,
    kind,
    position: index + 1,
    basisPoints: points,
  }));
}

export async function saveCompanyDraft(
  user: CurrentUser,
  input: CompanyDraftInput,
  cif: string,
): Promise<SaveCompanyDraftResult> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: companyCopy.notSeller };
  }

  const capital = basisPointsFor(input.capitalPercents);
  const products = basisPointsFor(input.productPercents);
  const clientValues =
    input.customerBase === "consumer"
      ? input.clientPercents
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      : input.clientPercents;
  const clients = basisPointsFor(clientValues);

  if (!capital || !products || !clients) {
    return { ok: false, message: companyCopy.percentInvalid };
  }

  const activeId = await activeSellerProjectId(user.id);
  const [existing, account, ownedCount] = await Promise.all([
    activeId
      ? prisma.project.findFirst({
          where: { id: activeId, ownerId: user.id },
          select: {
            id: true,
            legalName: true,
            codename: true,
            cif: true,
            address: true,
            ebitdaCents: true,
            ebitdaAdjustments: true,
            shareholders: { select: { name: true } },
            dataRoomFiles: { select: { fileName: true } },
          },
        })
      : null,
    prisma.user.findUnique({
      where: { id: user.id },
      select: { pendingCif: true },
    }),
    prisma.project.count({ where: { ownerId: user.id } }),
  ]);
  const pendingCif = account?.pendingCif?.trim() ?? "";
  const keptCif =
    existing && existing.cif.trim().length > 0
      ? existing.cif
      : ownedCount <= 1
        ? pendingCif
        : "";
  // t78: once the NIF is verified the legal name and CIF are locked (change requests go through info@).
  const identity = lockedIdentity(existing, { legalName: input.legalName, cif: cif.length > 0 ? cif : keptCif });
  const writtenCif = identity.cif;

  // t82: adjusted EBITDA = stored accounts EBITDA + listed adjustments, computed here only.
  const adjustments = sellerAdjustmentWrite(
    input.ebitdaAdjustments,
    existing ? { ebitdaCents: Number(existing.ebitdaCents), hasList: Array.isArray(existing.ebitdaAdjustments) } : null,
  );
  if (!adjustments.ok) {
    return { ok: false, message: adjustments.code === "adjustment-count" ? companyCopy.adjustmentsCount : companyCopy.adjustmentsInvalid };
  }
  const adjustmentFields =
    adjustments.write.kind === "set"
      ? { ebitdaAdjustments: adjustments.write.rows, adjustedEbitdaCents: adjustments.write.adjustedEbitdaCents }
      : adjustments.write.kind === "clear"
        ? { ebitdaAdjustments: Prisma.DbNull, adjustedEbitdaCents: 0 }
        : {};

  const secrets = [
    input.legalName,
    input.address,
    writtenCif,
    existing?.legalName ?? "",
    existing?.cif ?? "",
    existing?.address ?? "",
    ...(existing?.shareholders.map((shareholder) => shareholder.name) ?? []),
    ...(existing?.dataRoomFiles.map((file) => file.fileName) ?? []),
  ];

  if (
    input.description !== "" &&
    descriptionContainsSecret(input.description, secrets)
  ) {
    return { ok: false, message: companyCopy.descriptionPrivate };
  }

  // The nickname is generated, not typed: a change is kept only when it is
  // another free curated name (the "Generar otro" button); anything else keeps the stored one.
  const requested = input.codename.trim();
  const acceptable =
    isCuratedNickname(requested) &&
    (await codenameIsFree(requested, existing?.id));
  const codename = existing
    ? requested === existing.codename || acceptable
      ? requested
      : existing.codename
    : acceptable
      ? requested
      : await uniqueCodename();

  const profile = {
    legalName: identity.legalName,
    address: input.address,
    codename,
    region: input.region,
    // t78: revenue, EBITDA, OPEX and yearly accounts are never taken from a seller submission.
    ...sellerMoneyFields(input, existing === null),
    ...adjustmentFields,
    foundedYear: input.foundedYear === "" ? null : Number(input.foundedYear),
    description: input.description === "" ? null : input.description,
    saleReason: input.saleReason === "" ? null : input.saleReason,
    // t90: deal terms the seller may always edit (not financials). The schema already rejected invalid terms.
    ...(() => {
      const financing = sellerFinancingWrite(input);
      return financing.ok ? financing.data : {};
    })(),
    sellerStay: input.sellerStay === "" ? null : input.sellerStay,
    headcountRange: input.headcount === "" ? null : input.headcount,
    customerBase: input.customerBase === "" ? null : input.customerBase,
  };

  const cnaes = [
    ...(input.principalCnae === ""
      ? []
      : [
          {
            code: input.principalCnae,
            role: "principal" as const,
            position: 1,
          },
        ]),
    ...input.secondaryCnaes.map((code, index) => ({
      code,
      role: "secondary" as const,
      position: index + 1,
    })),
  ];

  await prisma.$transaction(async (tx) => {
    const projectId = existing?.id ?? randomUUID();

    const stored =
      writtenCif.length > 0 ? { ...profile, cif: writtenCif } : profile;

    if (existing) {
      const firstCif =
        existing.cif.trim().length === 0 && writtenCif.length > 0;
      await tx.project.update({
        where: { id: existing.id },
        data: firstCif ? { ...stored, sabiRequestedAt: new Date() } : stored,
      });
      await tx.projectCnae.deleteMany({ where: { projectId } });
      await tx.activitySlice.deleteMany({ where: { projectId } });
    } else {
      await tx.project.create({
        data: {
          id: projectId,
          slug: await unusedSlug(codename),
          ...profile,
          revenueCents: 0,
          ebitdaCents: 0,
          askingPriceCents: profile.askingPriceCents ?? 0,
          adjustedEbitdaCents: profile.adjustedEbitdaCents ?? 0,
          ...(profile.ebitdaAdjustments === Prisma.DbNull ? { ebitdaAdjustments: Prisma.DbNull } : {}),
          netDebtCents: 0,
          workingCapitalCents: 0,
          netIncomeCents: 0,
          cif: writtenCif,
          sabiRequestedAt: writtenCif.length > 0 ? new Date() : null,
          status: "draft",
          ownerId: user.id,
        },
      });
    }

    if (pendingCif.length > 0 && writtenCif.length > 0) {
      await tx.user.update({
        where: { id: user.id },
        data: { pendingCif: null },
      });
    }

    if (cnaes.length > 0) {
      await tx.projectCnae.createMany({
        data: cnaes.map((cnae) => ({ id: randomUUID(), projectId, ...cnae })),
      });
    }

    const slices = [
      ...sliceData(projectId, "capital", capital),
      ...sliceData(projectId, "product", products),
      ...sliceData(projectId, "client", clients),
    ];

    if (slices.length > 0) {
      await tx.activitySlice.createMany({ data: slices });
    }

  });

  return { ok: true };
}
