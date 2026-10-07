import { describe, expect, it } from "vitest";
import { acceptNdaOutcome, ndaAccessGate, requestAccessOutcome } from "./project-access";

const investor = {
  onboarded: true,
  role: "investor" as const,
  projectStatus: "published" as const,
};

describe("requestAccessOutcome", () => {
  it("inserts once for an onboarded investor and a published project", () => {
    expect(requestAccessOutcome({ ...investor, alreadyRequested: false })).toEqual({ ok: true, insert: true });
    expect(requestAccessOutcome({ ...investor, alreadyRequested: true })).toEqual({ ok: true, insert: false });
  });

  it("refuses other roles and unpublished projects", () => {
    expect(requestAccessOutcome({ ...investor, role: "seller", alreadyRequested: false })).toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(requestAccessOutcome({ ...investor, onboarded: false, alreadyRequested: false })).toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(requestAccessOutcome({ ...investor, projectStatus: "draft", alreadyRequested: false })).toEqual({
      ok: false,
      code: "missing",
    });
    expect(requestAccessOutcome({ ...investor, projectStatus: null, alreadyRequested: false })).toEqual({
      ok: false,
      code: "missing",
    });
  });
});

describe("acceptNdaOutcome", () => {
  it("stamps the acceptance once after a request", () => {
    expect(
      acceptNdaOutcome({ ...investor, requested: true, sellerMatched: true, alreadyAccepted: false }),
    ).toEqual({
      ok: true,
      stamp: true,
    });
    expect(
      acceptNdaOutcome({ ...investor, requested: true, sellerMatched: true, alreadyAccepted: true }),
    ).toEqual({
      ok: true,
      stamp: false,
    });
  });

  it("requires a request, a seller match, and an investor", () => {
    expect(acceptNdaOutcome({ ...investor, requested: false, sellerMatched: false, alreadyAccepted: false })).toEqual({
      ok: false,
      code: "nda-required",
    });
    expect(acceptNdaOutcome({ ...investor, requested: true, sellerMatched: false, alreadyAccepted: false })).toEqual({
      ok: false,
      code: "waiting",
    });
    expect(
      acceptNdaOutcome({ ...investor, role: "advisor", requested: true, sellerMatched: true, alreadyAccepted: false }),
    ).toEqual({
      ok: false,
      code: "forbidden",
    });
  });
});

describe("ndaAccessGate", () => {
  it("allows confidential access only after a recorded acceptance", () => {
    expect(ndaAccessGate({ ...investor, ndaAcceptedAt: null })).toEqual({ ok: false, code: "nda-required" });
    expect(ndaAccessGate({ ...investor, ndaAcceptedAt: new Date("2026-10-01T12:00:00.000Z") })).toEqual({ ok: true });
    expect(ndaAccessGate({ ...investor, role: "seller", ndaAcceptedAt: new Date("2026-10-01T12:00:00.000Z") })).toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(
      ndaAccessGate({ ...investor, projectStatus: "draft", ndaAcceptedAt: new Date("2026-10-01T12:00:00.000Z") }),
    ).toEqual({ ok: false, code: "missing" });
  });
});
