import type { UserRoleName } from "./auth-input";

export type EngagementClientName = "investor" | "seller";

export function claimEngagementOutcome(input: {
  isAdvisor: boolean;
  paid: boolean;
  exists: boolean;
  ownerId: string | null;
}): { ok: true } | { ok: false; code: "forbidden" | "plan" | "missing" | "taken" } {
  if (!input.isAdvisor) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.paid) {
    return { ok: false, code: "plan" };
  }

  if (!input.exists) {
    return { ok: false, code: "missing" };
  }

  if (input.ownerId !== null) {
    return { ok: false, code: "taken" };
  }

  return { ok: true };
}

export function advisorNdaOutcome(input: {
  isAdvisor: boolean;
  hiredByInvestor: boolean;
  ownsEngagement: boolean;
  alreadySigned: boolean;
  depositPaid: boolean;
}): { ok: true; stamp: boolean } | { ok: false; code: "forbidden" | "missing" | "deposit" } {
  if (!input.isAdvisor) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.hiredByInvestor || !input.ownsEngagement) {
    return { ok: false, code: "missing" };
  }

  if (!input.depositPaid) {
    return { ok: false, code: "deposit" };
  }

  return { ok: true, stamp: !input.alreadySigned };
}

export function advisorCompanyView(input: {
  hiredByInvestor: boolean;
  advisorSigned: boolean;
  investorSigned: boolean;
}): "public" | "investor" | "seller" {
  if (!input.hiredByInvestor) {
    return "seller";
  }

  if (!input.advisorSigned) {
    return "public";
  }

  if (!input.investorSigned) {
    return "public";
  }

  return "investor";
}

export function canOpenSellerGrant(input: {
  isSeller: boolean;
  ownsProject: boolean;
  hiredBySeller: boolean;
  advisorAssigned: boolean;
}): boolean {
  return input.isSeller && input.ownsProject && input.hiredBySeller && input.advisorAssigned;
}

export type AdvisorStep = "request" | "deposit" | "nda" | "active" | "closed";

export const advisorDeskAnchor = {
  open: "abiertos",
  inbox: "bandeja",
  deposit: "depositos",
  nda: "nda",
  active: "curso",
  closed: "cerrados",
} as const;

const encargosPath = "/mandatos/encargos";

export function advisorEngagementStep(input: {
  owned: boolean;
  closed: boolean;
  depositPaid: boolean;
  hiredByInvestor: boolean;
  ndaSigned: boolean;
}): AdvisorStep {
  if (!input.owned) {
    return "request";
  }

  if (input.closed) {
    return "closed";
  }

  if (!input.depositPaid) {
    return "deposit";
  }

  if (input.hiredByInvestor && !input.ndaSigned) {
    return "nda";
  }

  return "active";
}

export type AdvisorDeskItem = {
  id: string;
  codename: string;
  step: AdvisorStep;
};

export type AdvisorHomeDesk = {
  pending: { id: string; kind: "deposit" | "nda"; codename: string; href: string }[];
  open: { count: number; href: string };
  inbox: { count: number; href: string };
  deposits: { count: number; href: string };
  ndas: { count: number; href: string };
  steps: { step: AdvisorStep; count: number; href: string }[];
};

function sectionHref(anchor: string): string {
  return `${encargosPath}#${anchor}`;
}

function countedHref(ids: string[], anchor: string, emptyAnchor: string): string {
  const only = ids[0];

  if (ids.length === 1 && only !== undefined) {
    return `${encargosPath}/${only}`;
  }

  if (ids.length === 0) {
    return sectionHref(emptyAnchor);
  }

  return sectionHref(anchor);
}

export function advisorHomeDesk(input: { mine: AdvisorDeskItem[]; inboxCount: number }): AdvisorHomeDesk {
  const deposits = input.mine.filter((row) => row.step === "deposit");
  const ndas = input.mine.filter((row) => row.step === "nda");
  const active = input.mine.filter((row) => row.step === "active");
  const closed = input.mine.filter((row) => row.step === "closed");
  const open = input.mine.filter((row) => row.step === "deposit" || row.step === "nda" || row.step === "active");
  const empty = advisorDeskAnchor.open;

  return {
    pending: [...deposits, ...ndas].map((row) => ({
      id: row.id,
      kind: row.step === "nda" ? "nda" : "deposit",
      codename: row.codename,
      href: `${encargosPath}/${row.id}`,
    })),
    open: { count: open.length, href: countedHref(open.map((row) => row.id), advisorDeskAnchor.open, empty) },
    inbox: { count: input.inboxCount, href: sectionHref(advisorDeskAnchor.inbox) },
    deposits: {
      count: deposits.length,
      href: countedHref(deposits.map((row) => row.id), advisorDeskAnchor.deposit, empty),
    },
    ndas: { count: ndas.length, href: countedHref(ndas.map((row) => row.id), advisorDeskAnchor.nda, empty) },
    steps: [
      { step: "request", count: input.inboxCount, href: sectionHref(advisorDeskAnchor.inbox) },
      { step: "deposit", count: deposits.length, href: countedHref(deposits.map((row) => row.id), advisorDeskAnchor.deposit, empty) },
      { step: "nda", count: ndas.length, href: countedHref(ndas.map((row) => row.id), advisorDeskAnchor.nda, empty) },
      { step: "active", count: active.length, href: countedHref(active.map((row) => row.id), advisorDeskAnchor.active, empty) },
      { step: "closed", count: closed.length, href: countedHref(closed.map((row) => row.id), advisorDeskAnchor.closed, empty) },
    ],
  };
}

export function requestEngagementOutcome(input: {
  onboarded: boolean;
  role: UserRoleName | null;
  projectExists: boolean;
  sellerOwns: boolean;
  published: boolean;
}): { ok: true; client: EngagementClientName } | { ok: false; code: "forbidden" | "missing" } {
  if (!input.onboarded || (input.role !== "investor" && input.role !== "seller")) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.projectExists) {
    return { ok: false, code: "missing" };
  }

  if (input.role === "seller") {
    return input.sellerOwns ? { ok: true, client: "seller" } : { ok: false, code: "missing" };
  }

  return input.published ? { ok: true, client: "investor" } : { ok: false, code: "missing" };
}
