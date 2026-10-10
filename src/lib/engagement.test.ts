import { describe, expect, it } from "vitest";
import { advisorCompanyView, advisorNdaOutcome, claimEngagementOutcome, requestEngagementOutcome } from "./engagement";

describe("claimEngagementOutcome", () => {
  it("lets the first paying advisor take an unowned request and refuses a taken one", () => {
    expect(claimEngagementOutcome({ isAdvisor: true, paid: true, exists: true, ownerId: null })).toEqual({ ok: true });
    expect(claimEngagementOutcome({ isAdvisor: true, paid: true, exists: true, ownerId: "other" })).toEqual({
      ok: false,
      code: "taken",
    });
    expect(claimEngagementOutcome({ isAdvisor: true, paid: false, exists: true, ownerId: null })).toEqual({
      ok: false,
      code: "plan",
    });
    expect(claimEngagementOutcome({ isAdvisor: false, paid: true, exists: true, ownerId: null })).toEqual({
      ok: false,
      code: "forbidden",
    });
  });
});

describe("advisorCompanyView", () => {
  it("keeps the public card until the advisor signs, even if the investor already signed", () => {
    expect(advisorCompanyView({ hiredByInvestor: true, advisorSigned: false, investorSigned: true })).toBe("public");
    expect(advisorCompanyView({ hiredByInvestor: true, advisorSigned: true, investorSigned: false })).toBe("public");
    expect(advisorCompanyView({ hiredByInvestor: true, advisorSigned: true, investorSigned: true })).toBe("investor");
    expect(advisorCompanyView({ hiredByInvestor: false, advisorSigned: false, investorSigned: false })).toBe("seller");
  });
});

describe("advisorNdaOutcome", () => {
  it("stamps only the advisor hired by an investor", () => {
    expect(
      advisorNdaOutcome({
        isAdvisor: true,
        hiredByInvestor: true,
        ownsEngagement: true,
        alreadySigned: false,
        depositPaid: true,
      }),
    ).toEqual({ ok: true, stamp: true });
    expect(
      advisorNdaOutcome({
        isAdvisor: true,
        hiredByInvestor: false,
        ownsEngagement: true,
        alreadySigned: false,
        depositPaid: true,
      }),
    ).toEqual({ ok: false, code: "missing" });
    expect(
      advisorNdaOutcome({
        isAdvisor: true,
        hiredByInvestor: true,
        ownsEngagement: true,
        alreadySigned: false,
        depositPaid: false,
      }),
    ).toEqual({ ok: false, code: "deposit" });
  });
});

describe("requestEngagementOutcome", () => {
  it("ties a seller request to a company they own and an investor request to a published company", () => {
    expect(
      requestEngagementOutcome({
        onboarded: true,
        role: "seller",
        projectExists: true,
        sellerOwns: true,
        published: false,
      }),
    ).toEqual({ ok: true, client: "seller" });
    expect(
      requestEngagementOutcome({
        onboarded: true,
        role: "investor",
        projectExists: true,
        sellerOwns: false,
        published: true,
      }),
    ).toEqual({ ok: true, client: "investor" });
    expect(
      requestEngagementOutcome({
        onboarded: true,
        role: "advisor",
        projectExists: true,
        sellerOwns: false,
        published: true,
      }),
    ).toEqual({ ok: false, code: "forbidden" });
  });
});
