import * as z from "zod";
import type { DealStep, ProcessFile } from "./deal-pipeline";
import type { UserRoleName } from "./auth-input";
import { companyCopy } from "./company-copy";
import {
  incomingMeetingNotice,
  incomingOfferNotice,
  incomingQuestionNotice,
} from "./notifications";
import { sellerCopy } from "./seller-copy";

export const messageKinds = ["question", "meeting", "offer"] as const;

export type MessageKindName = (typeof messageKinds)[number];

const bodySchema = z.string().trim().min(1).max(2000);

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const accessIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const investorMessageSchema = z.object({
  slug: slugSchema,
  kind: z.enum(messageKinds),
  body: bodySchema,
});

export type InvestorMessageInput = z.infer<typeof investorMessageSchema>;

export const sellerMessageSchema = z.object({
  accessId: accessIdSchema,
  kind: z.enum(messageKinds),
  body: bodySchema,
});

export type SellerMessageInput = z.infer<typeof sellerMessageSchema>;

export const messageTab = {
  question: "questions",
  meeting: "meetings",
  offer: "offer",
} as const;

export function sellerReplyGate(input: {
  onboarded: boolean;
  role: UserRoleName | null;
  ownsProject: boolean;
  ndaAccepted: boolean;
  sellerAccepted: boolean;
}): { ok: true } | { ok: false; code: "forbidden" | "missing" | "nda-required" | "not-accepted" } {
  if (!input.onboarded || input.role !== "seller") {
    return { ok: false, code: "forbidden" };
  }

  if (!input.ownsProject) {
    return { ok: false, code: "missing" };
  }

  if (!input.sellerAccepted) {
    return { ok: false, code: "not-accepted" };
  }

  if (!input.ndaAccepted) {
    return { ok: false, code: "nda-required" };
  }

  return { ok: true };
}

export function messageFailure(
  code: "forbidden" | "missing" | "nda-required" | "not-accepted",
  viewer: "seller" | "investor",
): string {
  if (viewer === "seller") {
    if (code === "not-accepted") {
      return sellerCopy.replyNeedsAcceptance;
    }

    if (code === "nda-required") {
      return sellerCopy.shareNeedsNda;
    }

    if (code === "missing") {
      return sellerCopy.noCompanyYet;
    }

    return sellerCopy.replyForbidden;
  }

  if (code === "nda-required") {
    return companyCopy.threadLocked;
  }

  if (code === "missing") {
    return companyCopy.messageFailed;
  }

  return companyCopy.messageForbidden;
}

export type ThreadMessageView = {
  id: string;
  kind: MessageKindName;
  body: string;
  mine: boolean;
  createdAt: string;
};

export function personName(name: string, lastName: string | null | undefined): string {
  return [name, lastName ?? ""].map((part) => part.trim()).filter((part) => part.length > 0).join(" ");
}

export type SellerThread = {
  accessId: string;
  codename: string;
  label: string;
  partyName: string;
  messages: ThreadMessageView[];
  steps: DealStep[];
  documents: ProcessFile[];
};

export type MessageCounts = {
  accepted: number;
  questionsIn: number;
  questionsOut: number;
  meetings: number;
};

export function toThreadMessage(input: {
  id: string;
  kind: MessageKindName;
  body: string;
  author: "seller" | "investor";
  viewer: "seller" | "investor";
  createdAt: Date;
}): ThreadMessageView {
  const mine =
    (input.viewer === "seller" && input.author === "seller") ||
    (input.viewer === "investor" && input.author === "investor");

  return {
    id: input.id,
    kind: input.kind,
    body: input.body,
    mine,
    createdAt: input.createdAt.toISOString(),
  };
}

export function anonymousInvestorLabel(order: number): string {
  return `Inversor ${order}`;
}

export function labelAccesses<T extends { projectId: string; requestedAt: Date }>(rows: readonly T[]): (T & { label: string })[] {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const list = grouped.get(row.projectId) ?? [];
    list.push(row);
    grouped.set(row.projectId, list);
  }

  const labeled: (T & { label: string })[] = [];

  for (const list of grouped.values()) {
    const ordered = [...list].sort((left, right) => left.requestedAt.getTime() - right.requestedAt.getTime());
    ordered.forEach((row, index) => {
      labeled.push({ ...row, label: anonymousInvestorLabel(index + 1) });
    });
  }

  return labeled;
}

export function threadPartyLabel(viewer: "seller" | "investor"): string {
  return viewer === "seller" ? sellerCopy.investorParty : companyCopy.companyParty;
}

export function messageKindLabel(kind: MessageKindName): string {
  if (kind === "meeting") {
    return "Reunión";
  }

  if (kind === "offer") {
    return "Oferta indicativa";
  }

  return "Pregunta";
}

export function investorNoticeFor(kind: MessageKindName, codename: string): { title: string; body: string } {
  if (kind === "meeting") {
    return incomingMeetingNotice(codename);
  }

  if (kind === "offer") {
    return incomingOfferNotice(codename);
  }

  return incomingQuestionNotice(codename);
}
