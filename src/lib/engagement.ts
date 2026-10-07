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
}): { ok: true; stamp: boolean } | { ok: false; code: "forbidden" | "missing" } {
  if (!input.isAdvisor) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.hiredByInvestor || !input.ownsEngagement) {
    return { ok: false, code: "missing" };
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
