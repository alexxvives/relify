import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import { dealPipeline, processFlags, type DealStep } from "@/lib/deal-pipeline";
import { investorProjectSelect, toInvestorProject, type InvestorProjectProfile } from "@/lib/investor-project";
import { personName } from "@/lib/project-message";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const projectSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const accessIdSchema = z.string().trim().min(1).max(128);

const when = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

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

export type AdminCompanyView = {
  profile: InvestorProjectProfile;
  status: "draft" | "pending" | "published";
  accesses: AdminCompanyAccess[];
  selectedId: string | null;
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
          investor: { select: { name: true, lastName: true } },
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
        select: { name: true, lastName: true },
      })
    : null;
  const sellerName = owner ? personName(owner.name, owner.lastName) : "";
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

  return {
    profile: toInvestorProject(project),
    status: project.status,
    accesses,
    selectedId: selected?.id ?? null,
  };
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
