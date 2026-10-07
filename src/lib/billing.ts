export const LIMITED_NET_CENTS = 2_000;
export const UNLIMITED_NET_CENTS = 9_900;
export const ADVISOR_LISTING_NET_CENTS = 14_900;
export const LIMITED_MATCHES = 3;

export type BuyerPlanName = "none" | "limited" | "unlimited";

export type PendingMatch = {
  accessId: string;
  codename: string;
  label: string;
};

export function vatCents(netCents: number): number {
  return Math.round((netCents * 21) / 100);
}

export function grossCents(netCents: number): number {
  return netCents + vatCents(netCents);
}

export function planNetCents(plan: "limited" | "unlimited"): number {
  return plan === "limited" ? LIMITED_NET_CENTS : UNLIMITED_NET_CENTS;
}

export type SuccessFeeAmounts = {
  buyerNetCents: number;
  buyerVatCents: number;
  sellerNetCents: number;
  sellerVatCents: number;
};

export function successFeeFromClose(closedPriceCents: number): SuccessFeeAmounts {
  const buyerNetCents = Math.round(closedPriceCents / 100);
  const sellerNetCents = Math.round((closedPriceCents * 25) / 1000);

  return {
    buyerNetCents,
    buyerVatCents: vatCents(buyerNetCents),
    sellerNetCents,
    sellerVatCents: vatCents(sellerNetCents),
  };
}

export function isInPeriod(at: Date, start: Date | null, end: Date | null): boolean {
  if (start === null || end === null) {
    return false;
  }

  const time = at.getTime();
  return time >= start.getTime() && time < end.getTime();
}

export function matchesLeft(acceptedInPeriod: number, pendingInPeriod: number): number {
  return Math.max(0, LIMITED_MATCHES - acceptedInPeriod - pendingInPeriod);
}

export function matchSlot(input: {
  plan: BuyerPlanName;
  periodKnown: boolean;
  acceptedInPeriod: number;
  pendingInPeriod: number;
}): { ok: true } | { ok: false; code: "plan" | "limit" } {
  if (input.plan === "none") {
    return { ok: false, code: "plan" };
  }

  if (input.plan === "unlimited") {
    return { ok: true };
  }

  if (!input.periodKnown || input.acceptedInPeriod + input.pendingInPeriod >= LIMITED_MATCHES) {
    return { ok: false, code: "limit" };
  }

  return { ok: true };
}

export function canAcceptMatch(input: {
  plan: BuyerPlanName;
  periodKnown: boolean;
  acceptedInPeriod: number;
}): { ok: true } | { ok: false; code: "plan" | "limit" } {
  if (input.plan === "none") {
    return { ok: false, code: "plan" };
  }

  if (input.plan === "unlimited") {
    return { ok: true };
  }

  if (!input.periodKnown || input.acceptedInPeriod >= LIMITED_MATCHES) {
    return { ok: false, code: "limit" };
  }

  return { ok: true };
}

export function advisorPublishOutcome(input: {
  isAdvisor: boolean;
  ownsDraft: boolean;
  alreadyPublished: boolean;
  liveCompanyCount: number;
  paid: boolean;
}): { ok: true; mode: "already" | "free" | "paid" } | { ok: false; code: "forbidden" | "missing" | "payment" } {
  if (!input.isAdvisor) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.ownsDraft) {
    return { ok: false, code: "missing" };
  }

  if (input.alreadyPublished) {
    return { ok: true, mode: "already" };
  }

  if (input.liveCompanyCount === 0) {
    return { ok: true, mode: "free" };
  }

  if (input.paid) {
    return { ok: true, mode: "paid" };
  }

  return { ok: false, code: "payment" };
}

export function sellerPublishOutcome(input: {
  isSeller: boolean;
  ownsDraft: boolean;
  alreadyPublished: boolean;
}): { ok: true; publish: boolean } | { ok: false; code: "forbidden" | "missing" } {
  if (!input.isSeller) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.ownsDraft) {
    return { ok: false, code: "missing" };
  }

  return { ok: true, publish: !input.alreadyPublished };
}

export function buyerAcceptOutcome(input: {
  isOwner: boolean;
  requested: boolean;
  alreadyAccepted: boolean;
  buyerCanMatch: boolean;
}): { ok: true; stamp: boolean } | { ok: false; code: "forbidden" | "missing" | "limit" } {
  if (!input.isOwner) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.requested) {
    return { ok: false, code: "missing" };
  }

  if (input.alreadyAccepted) {
    return { ok: true, stamp: false };
  }

  if (!input.buyerCanMatch) {
    return { ok: false, code: "limit" };
  }

  return { ok: true, stamp: true };
}

export function recordSaleOutcome(input: {
  isOwner: boolean;
  published: boolean;
  alreadyRecorded: boolean;
  closedPriceCents: number;
}): { ok: true; insert: boolean; fee: SuccessFeeAmounts } | { ok: false; code: "forbidden" | "missing" | "price" } {
  if (!input.isOwner) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.published) {
    return { ok: false, code: "missing" };
  }

  if (!Number.isInteger(input.closedPriceCents) || input.closedPriceCents <= 0) {
    return { ok: false, code: "price" };
  }

  return {
    ok: true,
    insert: !input.alreadyRecorded,
    fee: successFeeFromClose(input.closedPriceCents),
  };
}
