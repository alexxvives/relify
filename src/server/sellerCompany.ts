import { randomUUID } from "node:crypto";
import { uniqueCodename } from "@/server/uniqueCodename";
import { cookies } from "next/headers";
import { cache } from "react";
import { projectSlug } from "@/lib/company-draft";
import { companyCopy } from "@/lib/company-copy";
import type { RegistryCompany } from "@/lib/company-registry";
import { sellerCopy } from "@/lib/seller-copy";
import { activeSellerChoice, sellerCompanyCookie } from "@/lib/seller-company";
import { isValidSpanishCif, normalizeCif } from "@/lib/spanish-cif";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import {
  dealPipeline,
  homePendingActions,
  processFlags,
} from "@/lib/deal-pipeline";
import { deleteDataRoomBytes } from "@/server/dataRoomDisk";
import { lookupCompanyRegistry } from "@/server/lookupCompanyRegistry";

export type SellerCompanyChoice = {
  id: string;
  legalName: string;
  codename: string;
  /** Seller actions waiting on this company (accept a request, accept a LOI). */
  pending?: number;
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function listSellerAdvisoryCompanies(
  ownerId: string,
): Promise<{ slug: string; codename: string; region: string }[]> {
  return prisma.project.findMany({
    where: { ownerId, NOT: { cif: "" } },
    orderBy: { createdAt: "asc" },
    select: { slug: true, codename: true, region: true },
  });
}

/**
 * "Your turn" actions per company, from the same pipeline that draws Mis procesos (dealPipeline + homePendingActions),
 * so the company switcher, the bell and the Mis procesos list can never disagree.
 */
export async function sellerPendingByProject(
  ownerId: string,
): Promise<Map<string, number>> {
  const [accesses, messages, grants, fees] = await Promise.all([
    prisma.projectAccess.findMany({
      where: { project: { ownerId, NOT: { cif: "" } }, cancelledAt: null },
      select: {
        id: true,
        projectId: true,
        investorId: true,
        sellerAcceptedAt: true,
        ndaAcceptedAt: true,
        loiAcceptedAt: true,
        diligencePassedAt: true,
      },
    }),
    prisma.projectMessage.findMany({
      where: {
        project: { ownerId },
        kind: { in: ["question", "meeting", "offer"] },
      },
      select: { projectId: true, investorId: true, kind: true },
    }),
    prisma.dataRoomGrant.findMany({
      where: { project: { ownerId } },
      select: { projectId: true, investorId: true },
    }),
    prisma.successFee.findMany({
      where: { project: { ownerId } },
      select: { projectId: true },
    }),
  ]);
  const kinds = new Map<string, Set<string>>();
  for (const message of messages) {
    const key = `${message.projectId}:${message.investorId}`;
    kinds.set(key, (kinds.get(key) ?? new Set()).add(message.kind));
  }
  const granted = new Set(
    grants.map((grant) => `${grant.projectId}:${grant.investorId}`),
  );
  const closed = new Set(fees.map((fee) => fee.projectId));
  const actions = homePendingActions(
    "seller",
    accesses.map((access) => {
      const key = `${access.projectId}:${access.investorId}`;
      const thread = kinds.get(key) ?? new Set<string>();
      return {
        id: access.projectId,
        who: access.investorId,
        href: "/mi-empresa/procesos",
        steps: dealPipeline(
          "seller",
          processFlags({
            accepted: access.sellerAcceptedAt !== null,
            nda: access.ndaAcceptedAt !== null,
            questions: thread.has("question"),
            meeting: thread.has("meeting"),
            offer: thread.has("offer"),
            loiAccepted: access.loiAcceptedAt !== null,
            roomShared: granted.has(key),
            passedDiligence: access.diligencePassedAt !== null,
            closed: closed.has(access.projectId),
          }),
        ),
      };
    }),
  );
  const pendingBy = new Map<string, number>();
  for (const action of actions) {
    pendingBy.set(action.id, (pendingBy.get(action.id) ?? 0) + 1);
  }
  return pendingBy;
}

export async function listSellerCompanies(
  ownerId: string,
): Promise<SellerCompanyChoice[]> {
  const [rows, prefill, pendingBy] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId, NOT: { cif: "" } },
      orderBy: { createdAt: "asc" },
      select: { id: true, legalName: true, codename: true, cif: true },
    }),
    prisma.companyRegistryPrefill.findUnique({
      where: { userId: ownerId },
      select: { cif: true, legalName: true },
    }),
    sellerPendingByProject(ownerId),
  ]);
  return rows.map((row) => {
    const legal = row.legalName.trim();
    const fromBulletin =
      prefill && prefill.cif === row.cif ? prefill.legalName.trim() : "";

    return {
      id: row.id,
      codename: row.codename,
      pending: pendingBy.get(row.id) ?? 0,
      legalName:
        legal.length > 0
          ? row.legalName
          : fromBulletin.length > 0
            ? fromBulletin
            : row.codename,
    };
  });
}

export async function sellerProcessScope(
  ownerId: string,
): Promise<{ codename: string; elsewhere: string | null }> {
  const projectId = await activeSellerProjectId(ownerId);
  const [current, others] = await Promise.all([
    projectId
      ? prisma.project.findFirst({
          where: { id: projectId, ownerId },
          select: { codename: true },
        })
      : Promise.resolve(null),
    prisma.project.findMany({
      where: {
        ownerId,
        accesses: { some: { cancelledAt: null } },
        ...(projectId ? { NOT: { id: projectId } } : {}),
      },
      select: { codename: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const names = others.map((row) => row.codename);

  return {
    codename: current?.codename ?? "",
    elsewhere: names.length > 0 ? names.join(" y ") : null,
  };
}

/**
 * Active company for this request. Memoised per request with React `cache`:
 * the shell, sidebar badges and page all ask for it.
 */
export const activeSellerProjectId = cache(resolveActiveSellerProjectId);

async function resolveActiveSellerProjectId(
  ownerId: string,
): Promise<string | null> {
  const companies = await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, cif: true },
  });
  const jar = await cookies();

  return activeSellerChoice(companies, jar.get(sellerCompanyCookie)?.value);
}

async function rememberCompany(projectId: string): Promise<void> {
  const jar = await cookies();
  jar.set(sellerCompanyCookie, projectId, cookieOptions);
}

export async function selectSellerCompany(
  ownerId: string,
  projectId: string,
): Promise<boolean> {
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

  while (
    await prisma.project.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

/** A blank draft owned by the seller, already carrying the CIF and queued for the SABI import. */
async function createDraftProject(
  ownerId: string,
  cif: string,
): Promise<{ id: string; slug: string }> {
  const codename = await uniqueCodename();
  const id = randomUUID();
  const slug = await unusedSlug(codename);
  await prisma.project.create({
    data: {
      id,
      slug,
      codename,
      region: "",
      revenueCents: 0,
      ebitdaCents: 0,
      adjustedEbitdaCents: 0,
      askingPriceCents: 0,
      netIncomeCents: 0,
      // Empty so the registry prefill still fills the draft form.
      legalName: "",
      cif,
      address: "",
      status: "draft",
      ownerId,
      sabiRequestedAt: new Date(),
    },
  });
  return { id, slug };
}

/**
 * First CIF of a seller with no draft yet: create the company right away so admins see it
 * (before, it lived only in user.pendingCif until the first draft save).
 */
export async function createFirstSellerCompany(
  ownerId: string,
  cif: string,
): Promise<{ id: string; slug: string }> {
  const project = await createDraftProject(ownerId, cif);
  await rememberCompany(project.id);
  await prisma.user.update({
    where: { id: ownerId },
    data: { pendingCif: null },
  });
  return project;
}

/**
 * Self-heal for sellers who verified a CIF before companies were created on verify:
 * a pending CIF with no project becomes a draft. Safe to call from any request (no cookie);
 * the conditional update on pendingCif keeps two concurrent calls from creating twins.
 */
export async function materializePendingCompanies(
  ownerId?: string,
): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      ...(ownerId ? { id: ownerId } : {}),
      role: "seller",
      pendingCif: { not: null },
      NOT: { pendingCif: "" },
      projects: { none: {} },
    },
    select: { id: true, pendingCif: true },
    take: 50,
  });
  let created = 0;
  for (const user of users) {
    const cif = user.pendingCif ?? "";
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, pendingCif: cif },
      data: { pendingCif: null },
    });
    if (claimed.count !== 1) {
      continue;
    }
    await createDraftProject(user.id, cif);
    created += 1;
  }
  return created;
}

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

export async function addSellerCompany(
  user: CurrentUser,
  rawNif: string,
): Promise<
  | { ok: true; projectId: string; needsPayment: boolean }
  | { ok: false; message: string }
> {
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

  const lookup = await lookupCompanyRegistry(cif);

  if (!lookup.ok) {
    return { ok: false, message: companyCopy.nifRegistryUnavailable };
  }

  const record = lookup.record;

  if (record) {
    const data = prefillData(record);
    await prisma.companyRegistryPrefill.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
  } else {
    await prisma.companyRegistryPrefill.deleteMany({
      where: { userId: user.id },
    });
  }

  const existing = await prisma.project.findFirst({
    where: { ownerId: user.id, cif },
    select: { id: true },
  });

  if (existing) {
    await rememberCompany(existing.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingCif: null },
    });
    return { ok: true, projectId: existing.id, needsPayment: false };
  }

  const priorCount = await prisma.project.count({
    where: { ownerId: user.id, NOT: { cif: "" } },
  });
  const needsPayment = priorCount > 0;

  const blank = await prisma.project.findFirst({
    where: { ownerId: user.id, cif: "" },
    orderBy: { createdAt: "desc" },
    select: { id: true, legalName: true, codename: true },
  });
  // Every company gets its own curated nickname; registry aliases can repeat.
  const codename = await uniqueCodename();
  let projectId: string;

  if (blank) {
    projectId = blank.id;
    await prisma.project.update({
      where: { id: blank.id },
      data: {
        cif,
        ...(blank.legalName.trim().length === 0 &&
        blank.codename === "Proyecto nuevo"
          ? { codename }
          : {}),
      },
    });
    await rememberCompany(blank.id);
  } else {
    projectId = randomUUID();
    await prisma.project.create({
      data: {
        id: projectId,
        slug: await unusedSlug(codename),
        codename,
        region: "",
        revenueCents: 0,
        ebitdaCents: 0,
        adjustedEbitdaCents: 0,
        askingPriceCents: 0,
        netIncomeCents: 0,
        legalName: "",
        cif,
        address: "",
        status: "draft",
        ownerId: user.id,
      },
    });
    await rememberCompany(projectId);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { pendingCif: null },
  });
  return { ok: true, projectId, needsPayment };
}

export async function deleteSellerCompany(
  user: CurrentUser,
  projectId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: sellerCopy.companyDeleteForbidden };
  }

  const owned = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true, cif: true },
  });

  if (!owned) {
    return { ok: false, message: sellerCopy.companyDeleteForbidden };
  }

  const files = await prisma.dataRoomFile.findMany({
    where: { projectId: owned.id },
    select: { id: true },
  });
  await prisma.project.delete({ where: { id: owned.id } });
  await Promise.all(files.map((file) => deleteDataRoomBytes(file.id)));
  const prefill = await prisma.companyRegistryPrefill.findUnique({
    where: { userId: user.id },
    select: { cif: true },
  });

  if (prefill && prefill.cif === owned.cif) {
    await prisma.companyRegistryPrefill.delete({ where: { userId: user.id } });
  }

  const next = await resolveActiveSellerProjectId(user.id);

  if (next) {
    await rememberCompany(next);
  } else {
    const jar = await cookies();
    jar.delete(sellerCompanyCookie);
  }

  return { ok: true };
}
