import type { SabiPreviewTarget } from "@/lib/sabi/preview";
import { sabiExtraOf, sabiFichaYears, type SabiExtra } from "@/lib/sabi/mapping";
import type { SabiAudit } from "@/lib/sabi/parse";
import * as z from "zod";
import { advisoryServices } from "@/lib/advisory";
import { adminCopy } from "@/lib/admin-copy";
import { advisorSectorName } from "@/lib/advisor-sectors";
import { dealPipeline, processFlags, type DealStep } from "@/lib/deal-pipeline";
import type { PublicInvestorCard } from "@/lib/demo-profile";
import { investorProjectSelect, toInvestorProject, type InvestorProjectProfile } from "@/lib/investor-project";
import { personName } from "@/lib/project-message";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { publicCardsByInvestor } from "@/server/investorProfile";
import { readSabiStored } from "@/server/sabiImport";

const projectSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const accessIdSchema = z.string().trim().min(1).max(128);

const when = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

const day = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" });

export type AdminCompanyMessage = {
  id: string;
  kind: "question" | "meeting" | "offer";
  body: string;
  authorLabel: string;
  createdAt: string;
};

export type AdminCompanyAccess = {
  id: string;
  investorLabel: string;
  steps: DealStep[];
  messages: AdminCompanyMessage[];
};

export type AdminSideAdvisor = {
  id: string;
  label: string;
  hiredBy: string;
  role: "investor" | "seller";
  person: string;
  business: string;
  email: string;
  verified: boolean;
  status: string;
  since: string;
  sectors: string[];
  services: string;
};

export type AdminPrivateFact = { key: string; label: string; value: string };

export type AdminSabiPerson = { name: string; role: string; since: string | null; group: string | null };
export type AdminSabiHolding = { name: string; country: string | null; direct: string | null; total: string | null };

export type AdminSabiView = {
  projectId: string;
  hasCif: boolean;
  /** t67: the browser builds the SABI preview itself; these feed its CIF and "replaces" warnings. */
  previewTarget: SabiPreviewTarget;
  importedAt: string | null;
  requestedAt: string | null;
  fileName: string | null;
  legalForm: string | null;
  incorporatedOn: string | null;
  employees: number | null;
  directors: AdminSabiPerson[];
  shareholders: AdminSabiHolding[];
  subsidiaries: AdminSabiHolding[];
  auditor: string | null;
  banks: string[];
  /** t60: everything else SABI knows that has no ficha field. Admin-only (identifies the company). */
  formerName: string | null;
  status: string | null;
  shareCapitalCents: number | null;
  phone: string | null;
  website: string | null;
  lastAccountsOn: string | null;
  accountsType: string | null;
  globalUltimateOwner: string | null;
  independence: string | null;
  otherCodes: { scheme: string; codes: string }[];
  activityDescription: string | null;
  /** t62 */
  companyType: string | null;
  groupCompanyCount: number | null;
  audits: SabiAudit[];
  /** Catch-all: older years, unread lines and the raw sheet. */
  extra: SabiExtra | null;
};

export type AdminCompanyView = {
  sabi: AdminSabiView;
  profile: InvestorProjectProfile;
  privateFacts: AdminPrivateFact[];
  status: "draft" | "pending" | "published";
  accesses: AdminCompanyAccess[];
  selectedId: string | null;
  investor: { label: string; profile: PublicInvestorCard | null } | null;
  advisors: AdminSideAdvisor[];
};

export async function getAdminCompanyByAccess(user: CurrentUser, accessId: string): Promise<AdminCompanyView | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const parsed = accessIdSchema.safeParse(accessId);

  if (!parsed.success) {
    return null;
  }

  const access = await prisma.projectAccess.findUnique({
    where: { id: parsed.data },
    select: { project: { select: { slug: true } } },
  });

  if (!access) {
    return null;
  }

  return getAdminCompany(user, { slug: access.project.slug, accessId: parsed.data });
}

export async function getAdminCompany(
  user: CurrentUser,
  input: { slug: string; accessId: string | null },
): Promise<AdminCompanyView | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const slug = projectSlugSchema.safeParse(input.slug);

  if (!slug.success) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { slug: slug.data },
    select: {
      id: true,
      status: true,
      ownerId: true,
      legalName: true,
      cif: true,
      address: true,
      createdAt: true,
      sabiImportedAt: true,
      sabiRequestedAt: true,
      sabiFileName: true,
      sabiData: true,
      sabiExtra: true,
      ...investorProjectSelect,
      successFee: { select: { id: true } },
      dataRoomGrants: { select: { investorId: true } },
      accesses: {
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          investorId: true,
          sellerAcceptedAt: true,
          ndaAcceptedAt: true,
          loiAcceptedAt: true,
          diligencePassedAt: true,
          investor: { select: { name: true, lastName: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, investorId: true, author: true, kind: true, body: true, createdAt: true },
      },
    },
  });

  if (!project) {
    return null;
  }

  const owner = project.ownerId
    ? await prisma.user.findUnique({
        where: { id: project.ownerId },
        select: { name: true, lastName: true, email: true, phone: true, nationalId: true },
      })
    : null;
  const sellerName = owner ? personName(owner.name, owner.lastName) : "";
  const missing = adminCopy.privateMissing;
  const privateFacts: AdminPrivateFact[] = [
    { key: "legal", label: "Razón social", value: project.legalName.trim() || missing },
    { key: "cif", label: "CIF", value: project.cif.trim() || missing },
    { key: "address", label: "Domicilio", value: project.address.trim() || missing },
    { key: "owner", label: "Titular", value: sellerName || missing },
    { key: "email", label: "Correo del titular", value: owner?.email ?? missing },
    { key: "phone", label: "Teléfono", value: owner?.phone?.trim() || missing },
    { key: "nid", label: "DNI/NIE del titular", value: owner?.nationalId?.trim() || missing },
    { key: "created", label: "Alta en Relify", value: day.format(project.createdAt) },
  ];
  const closed = project.successFee !== null;
  const accesses = project.accesses.map((access) => {
    const accepted = access.sellerAcceptedAt !== null || access.ndaAcceptedAt !== null;
    const messages = project.messages.filter((message) => message.investorId === access.investorId);
    const investorName = personName(access.investor.name, access.investor.lastName);

    return {
      id: access.id,
      investorLabel: investorName.length > 0 ? investorName : adminCopy.investorParty,
      steps: accepted
        ? dealPipeline(
            "advisor",
            processFlags({
              accepted: true,
              nda: access.ndaAcceptedAt !== null,
              questions: messages.some((message) => message.kind === "question"),
              meeting: messages.some((message) => message.kind === "meeting"),
              offer: messages.some((message) => message.kind === "offer"),
              loiAccepted: access.loiAcceptedAt !== null,
              roomShared: project.dataRoomGrants.some((grant) => grant.investorId === access.investorId),
              passedDiligence: access.diligencePassedAt !== null,
              closed,
            }),
          )
        : [],
      messages: messages.map((message) => ({
        id: message.id,
        kind: message.kind,
        body: message.kind === "meeting" ? message.body : withoutAttachments(message.body),
        authorLabel: message.author === "seller" ? sellerParty(sellerName) : investorParty(investorName),
        createdAt: when.format(message.createdAt),
      })),
    };
  });
  const selected = accesses.find((access) => access.id === input.accessId) ?? accesses[0] ?? null;
  const chosen = input.accessId ? project.accesses.find((access) => access.id === input.accessId) ?? null : null;
  const parties = chosen ? await sideParties(project.id, chosen) : { investor: null, advisors: [] };

  const stored = readSabiStored(project.sabiData)?.report ?? null;
  const sabi: AdminSabiView = {
    projectId: project.id,
    hasCif: project.cif.trim().length > 0,
    previewTarget: {
      cif: project.cif,
      sellerClosedYears: project.years.filter((year) => year.kind === "closed" && year.dataSource !== "sabi").map((year) => year.year),
    },
    importedAt: project.sabiImportedAt ? when.format(project.sabiImportedAt) : null,
    requestedAt: project.sabiRequestedAt ? when.format(project.sabiRequestedAt) : null,
    fileName: project.sabiFileName,
    legalForm: stored?.identity.legalForm ?? null,
    incorporatedOn: stored?.identity.incorporatedOn ?? null,
    employees: stored?.identity.employees ?? null,
    directors: (stored?.directors ?? []).map(({ name, role, since, group }) => ({ name, role, since, group })),
    shareholders: (stored?.shareholders ?? []).map(({ name, country, direct, total }) => ({ name, country, direct, total })),
    subsidiaries: (stored?.subsidiaries ?? []).map(({ name, country, direct, total }) => ({ name, country, direct, total })),
    auditor: stored?.auditor ?? null,
    banks: stored?.banks ?? [],
    formerName: stored?.identity.formerName ?? null,
    status: [stored?.identity.status, stored?.identity.statusDetail].filter(Boolean).join(" · ") || null,
    shareCapitalCents: stored?.identity.shareCapitalCents ?? null,
    phone: stored?.identity.phone ?? null,
    website: stored?.identity.website ?? null,
    lastAccountsOn: stored?.identity.lastAccountsOn ?? null,
    accountsType: stored?.identity.accountsType ?? null,
    globalUltimateOwner: stored?.identity.globalUltimateOwner ?? null,
    independence: stored?.identity.independenceIndicator ?? null,
    otherCodes: Object.entries(stored?.codes ?? {})
      .filter(([scheme]) => scheme !== "cnae2009")
      .map(([scheme, set]) => ({
        scheme,
        codes: [...(set?.primary ?? []), ...(set?.secondary ?? [])].map((code) => `${code.code} ${code.description}`.trim()).join(" · "),
      }))
      .filter((entry) => entry.codes.length > 0),
    activityDescription: stored?.identity.activityDescription ?? null,
    companyType: stored?.identity.companyType ?? null,
    groupCompanyCount: stored?.identity.groupCompanyCount ?? null,
    audits: stored?.audits ?? [],
    extra: (project.sabiExtra as SabiExtra | null) ?? (stored ? sabiExtraOf(stored, stored.years.slice(0, sabiFichaYears).map((year) => year.year)) : null),
  };

  return {
    sabi,
    profile: toInvestorProject(project),
    privateFacts,
    status: project.status,
    accesses,
    selectedId: selected?.id ?? null,
    investor: parties.investor,
    advisors: parties.advisors,
  };
}

async function sideParties(
  projectId: string,
  chosen: {
    investorId: string;
    investor: { name: string; lastName: string | null; email: string };
  },
): Promise<Pick<AdminCompanyView, "investor" | "advisors">> {
  const advisorSelect = {
    name: true,
    lastName: true,
    email: true,
    advisorProfile: { select: { businessName: true, sectors: true, verifiedAt: true } },
  } as const;
  const [cards, engagements, mandates] = await Promise.all([
    publicCardsByInvestor([{ id: chosen.investorId, email: chosen.investor.email }]),
    prisma.advisoryEngagement.findMany({
      where: {
        projectId,
        declinedAt: null,
        advisorId: { not: null },
        OR: [{ client: "seller" }, { client: "investor", requesterId: chosen.investorId }],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        client: true,
        services: true,
        createdAt: true,
        claimedAt: true,
        depositPaidAt: true,
        closedAt: true,
        advisorId: true,
        advisor: { select: advisorSelect },
      },
    }),
    prisma.saleMandate.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { id: true, advisorId: true, createdAt: true, advisor: { select: advisorSelect } },
    }),
  ]);
  const investorName = personName(chosen.investor.name, chosen.investor.lastName);
  const sideAdvisor = (
    id: string,
    role: "investor" | "seller",
    advisor: { name: string; lastName: string | null; email: string; advisorProfile: { businessName: string; sectors: string[]; verifiedAt: Date | null } | null },
    status: string,
    since: Date,
    services: string,
  ): AdminSideAdvisor => {
    const person = personName(advisor.name, advisor.lastName);
    const business = advisor.advisorProfile?.businessName.trim() ?? "";

    return {
      id,
      label: advisorLabel(business, person),
      hiredBy: role === "investor" ? adminCopy.advisorForInvestor : adminCopy.advisorForSeller,
      role,
      person,
      business,
      email: advisor.email,
      verified: Boolean(advisor.advisorProfile?.verifiedAt),
      status,
      since: since.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" }),
      sectors: (advisor.advisorProfile?.sectors ?? []).map((sector) => advisorSectorName(sector)),
      services,
    };
  };
  const fromEngagements = engagements.flatMap((row) => {
    if (!row.advisor) {
      return [];
    }

    const status = row.closedAt
      ? adminCopy.advisorStatusClosed
      : row.depositPaidAt
        ? adminCopy.advisorStatusPaid
        : row.claimedAt
          ? adminCopy.advisorStatusClaimed
          : adminCopy.advisorStatusAssigned;
    const services = row.services.map((id) => advisoryServices.find((service) => service.id === id)?.title ?? id).join(", ");

    return [sideAdvisor(row.id, row.client === "investor" ? "investor" : "seller", row.advisor, status, row.createdAt, services)];
  });
  const engagedSellerAdvisors = new Set(engagements.filter((row) => row.client === "seller").map((row) => row.advisorId));
  const fromMandates = mandates
    .filter((row) => !engagedSellerAdvisors.has(row.advisorId))
    .map((row) => sideAdvisor(row.id, "seller", row.advisor, adminCopy.advisorStatusMandate, row.createdAt, ""));
  const advisors = [...fromEngagements, ...fromMandates];

  return {
    investor: {
      label: investorName.length > 0 ? investorName : adminCopy.investorParty,
      profile: cards.get(chosen.investorId) ?? null,
    },
    advisors: advisors.sort((left, right) => Number(left.role !== "investor") - Number(right.role !== "investor")),
  };
}

function advisorLabel(business: string, name: string): string {
  if (business.length > 0 && name.length > 0) {
    return `${business} (${name})`;
  }

  if (business.length > 0) {
    return business;
  }

  if (name.length > 0) {
    return name;
  }

  return "Asesor";
}

function sellerParty(name: string): string {
  return name.length > 0 ? `${name} · ${adminCopy.sellerParty}` : adminCopy.sellerParty;
}

function investorParty(name: string): string {
  return name.length > 0 ? `${name} · ${adminCopy.investorParty}` : adminCopy.investorParty;
}

function withoutAttachments(body: string): string {
  return body
    .split("\n")
    .filter((line) => !line.startsWith("Adjunto: "))
    .join("\n")
    .trim();
}
