import { describe, expect, it } from "vitest";
import {
  ADVISOR_LISTING_NET_CENTS,
  LIMITED_NET_CENTS,
  UNLIMITED_NET_CENTS,
  advisorPublishOutcome,
  buyerAcceptOutcome,
  canAcceptMatch,
  grossCents,
  matchesLeft,
  matchSlot,
  recordSaleOutcome,
  sellerPublishOutcome,
  successFeeFromClose,
  vatCents,
} from "./billing";

describe("prices", () => {
  it("adds 21 percent IVA on top of the stated amounts", () => {
    expect(vatCents(LIMITED_NET_CENTS)).toBe(420);
    expect(grossCents(LIMITED_NET_CENTS)).toBe(2_420);
    expect(grossCents(UNLIMITED_NET_CENTS)).toBe(11_979);
    expect(grossCents(ADVISOR_LISTING_NET_CENTS)).toBe(18_029);
  });

  it("records 1 percent and 2.5 percent of the closed price, plus IVA", () => {
    expect(successFeeFromClose(1_000_000_00)).toEqual({
      buyerNetCents: 10_000_00,
      buyerVatCents: 2_100_00,
      sellerNetCents: 25_000_00,
      sellerVatCents: 5_250_00,
    });
  });
});

describe("matchSlot", () => {
  it("lets a limited plan open a match while three slots remain", () => {
    expect(
      matchSlot({ plan: "limited", periodKnown: true, acceptedInPeriod: 1, pendingInPeriod: 1 }),
    ).toEqual({ ok: true });
    expect(
      matchSlot({ plan: "limited", periodKnown: true, acceptedInPeriod: 2, pendingInPeriod: 1 }),
    ).toEqual({ ok: false, code: "limit" });
    expect(matchSlot({ plan: "none", periodKnown: false, acceptedInPeriod: 0, pendingInPeriod: 0 })).toEqual({
      ok: false,
      code: "plan",
    });
    expect(
      matchSlot({ plan: "unlimited", periodKnown: true, acceptedInPeriod: 9, pendingInPeriod: 9 }),
    ).toEqual({ ok: true });
  });
});

describe("matchesLeft", () => {
  it("counts the limited plan down from three", () => {
    expect(matchesLeft(1, 1)).toBe(1);
    expect(matchesLeft(2, 1)).toBe(0);
    expect(matchesLeft(0, 0)).toBe(3);
  });
});

describe("canAcceptMatch", () => {
  it("consumes a slot when the seller accepts", () => {
    expect(canAcceptMatch({ plan: "limited", periodKnown: true, acceptedInPeriod: 2 })).toEqual({ ok: true });
    expect(canAcceptMatch({ plan: "limited", periodKnown: true, acceptedInPeriod: 3 })).toEqual({
      ok: false,
      code: "limit",
    });
  });
});

describe("advisorPublishOutcome", () => {
  it("publishes the first company free and asks for payment after that", () => {
    expect(
      advisorPublishOutcome({
        isAdvisor: true,
        ownsDraft: true,
        alreadyPublished: false,
        liveCompanyCount: 0,
        paid: false,
      }),
    ).toEqual({ ok: true, mode: "free" });
    expect(
      advisorPublishOutcome({
        isAdvisor: true,
        ownsDraft: true,
        alreadyPublished: false,
        liveCompanyCount: 1,
        paid: false,
      }),
    ).toEqual({ ok: false, code: "payment" });
    expect(
      advisorPublishOutcome({
        isAdvisor: true,
        ownsDraft: true,
        alreadyPublished: false,
        liveCompanyCount: 1,
        paid: true,
      }),
    ).toEqual({ ok: true, mode: "paid" });
    expect(
      advisorPublishOutcome({
        isAdvisor: false,
        ownsDraft: true,
        alreadyPublished: false,
        liveCompanyCount: 0,
        paid: false,
      }),
    ).toEqual({ ok: false, code: "forbidden" });
  });
});

describe("sellerPublishOutcome", () => {
  it("publishes a seller draft without a charge", () => {
    expect(sellerPublishOutcome({ isSeller: true, ownsDraft: true, alreadyPublished: false })).toEqual({
      ok: true,
      publish: true,
    });
    expect(sellerPublishOutcome({ isSeller: false, ownsDraft: true, alreadyPublished: false })).toEqual({
      ok: false,
      code: "forbidden",
    });
  });
});

describe("buyerAcceptOutcome", () => {
  it("stamps the match once for the owner", () => {
    expect(
      buyerAcceptOutcome({ isOwner: true, requested: true, alreadyAccepted: false, buyerCanMatch: true }),
    ).toEqual({ ok: true, stamp: true });
    expect(
      buyerAcceptOutcome({ isOwner: true, requested: true, alreadyAccepted: false, buyerCanMatch: false }),
    ).toEqual({ ok: false, code: "limit" });
    expect(
      buyerAcceptOutcome({ isOwner: false, requested: true, alreadyAccepted: false, buyerCanMatch: true }),
    ).toEqual({ ok: false, code: "forbidden" });
  });
});

describe("recordSaleOutcome", () => {
  it("inserts the fee once for the owner of a published company", () => {
    const recorded = recordSaleOutcome({
      isOwner: true,
      published: true,
      alreadyRecorded: false,
      closedPriceCents: 100_00,
    });
    expect(recorded.ok).toBe(true);
    if (recorded.ok) {
      expect(recorded.insert).toBe(true);
      expect(recorded.fee.buyerNetCents).toBe(100);
      expect(recorded.fee.sellerNetCents).toBe(250);
    }
    expect(
      recordSaleOutcome({ isOwner: true, published: false, alreadyRecorded: false, closedPriceCents: 100_00 }),
    ).toEqual({ ok: false, code: "missing" });
  });
});
