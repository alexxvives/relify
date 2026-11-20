import { describe, expect, it } from "vitest";
import {
  advisorCompanyView,
  advisorEngagementStep,
  advisorHomeDesk,
  advisorNdaOutcome,
  declineEngagementOutcome,
  claimEngagementOutcome,
  requestEngagementOutcome,
} from "@/lib/engagement";

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
    // S35: a seller's advisor also signs its own NDA before seeing the company.
    expect(advisorCompanyView({ hiredByInvestor: false, advisorSigned: false, investorSigned: false })).toBe("public");
    expect(advisorCompanyView({ hiredByInvestor: false, advisorSigned: true, investorSigned: false })).toBe("seller");
  });
});

describe("advisorNdaOutcome", () => {
  it("stamps any advisor that owns the engagement after the deposit (S35: seller-hired too)", () => {
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
    ).toEqual({ ok: true, stamp: true });
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

describe("advisorEngagementStep", () => {
  it("keeps an unpaid request on the deposit step and an investor NDA after the deposit", () => {
    expect(
      advisorEngagementStep({ owned: false, closed: false, depositPaid: false, hiredByInvestor: true, ndaSigned: false }),
    ).toBe("request");
    expect(
      advisorEngagementStep({ owned: true, closed: false, depositPaid: false, hiredByInvestor: true, ndaSigned: false }),
    ).toBe("deposit");
    expect(
      advisorEngagementStep({ owned: true, closed: false, depositPaid: true, hiredByInvestor: true, ndaSigned: false }),
    ).toBe("nda");
    expect(
      advisorEngagementStep({ owned: true, closed: false, depositPaid: true, hiredByInvestor: false, ndaSigned: false }),
    ).toBe("nda");
    expect(
      advisorEngagementStep({ owned: true, closed: false, depositPaid: true, hiredByInvestor: true, ndaSigned: true }),
    ).toBe("active");
    expect(
      advisorEngagementStep({ owned: true, closed: true, depositPaid: false, hiredByInvestor: true, ndaSigned: false }),
    ).toBe("closed");
  });
});

describe("advisorHomeDesk", () => {
  it("counts open work, the inbox, and only the steps that wait on this advisor", () => {
    const desk = advisorHomeDesk({
      inboxCount: 2,
      mine: [
        { id: "deposit-1", codename: "Proyecto Duna", step: "deposit" },
        { id: "nda-1", codename: "Proyecto Cala", step: "nda" },
        { id: "live-1", codename: "Proyecto Olivo", step: "active" },
        { id: "done-1", codename: "Proyecto Roble", step: "closed" },
      ],
    });

    expect(desk.pending).toEqual([
      { id: "deposit-1", kind: "deposit", codename: "Proyecto Duna", href: "/mandatos/encargos/deposit-1" },
      { id: "nda-1", kind: "nda", codename: "Proyecto Cala", href: "/mandatos/encargos/nda-1" },
    ]);
    expect(desk.open).toEqual({ count: 3, href: "/mandatos/encargos" });
    expect(desk.inbox).toEqual({ count: 2, href: "/mandatos/encargos#bandeja" });
    expect(desk.deposits).toEqual({ count: 1, href: "/mandatos/encargos/deposit-1" });
    expect(desk.ndas).toEqual({ count: 1, href: "/mandatos/encargos/nda-1" });
    expect(desk.steps.map((step) => step.count)).toEqual([2, 1, 1, 1, 1]);
  });

  it("sends an empty count to the list and one open encargo to that row", () => {
    const desk = advisorHomeDesk({
      inboxCount: 0,
      mine: [{ id: "only", codename: "Proyecto Nube", step: "active" }],
    });

    expect(desk.pending).toEqual([]);
    expect(desk.open.href).toBe("/mandatos/encargos/only");
    expect(desk.deposits.href).toBe("/mandatos/encargos");
    expect(desk.steps.find((step) => step.step === "active")?.href).toBe("/mandatos/encargos/only");
    expect(desk.steps.find((step) => step.step === "nda")?.href).toBe("/mandatos/venta");
    expect(desk.inbox.href).toBe("/mandatos/encargos#bandeja");
  });
});

describe("declineEngagementOutcome", () => {
  it("lets the advisor refuse a request only before the deposit is paid", () => {
    expect(declineEngagementOutcome({ isAdvisor: true, owns: true, depositPaid: false })).toEqual({ ok: true });
    expect(declineEngagementOutcome({ isAdvisor: true, owns: true, depositPaid: true })).toEqual({ ok: false, code: "paid" });
    expect(declineEngagementOutcome({ isAdvisor: true, owns: false, depositPaid: false })).toEqual({
      ok: false,
      code: "missing",
    });
    expect(declineEngagementOutcome({ isAdvisor: false, owns: true, depositPaid: false })).toEqual({
      ok: false,
      code: "forbidden",
    });
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
