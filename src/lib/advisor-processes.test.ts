import { describe, expect, it } from "vitest";
import {
  advisorLaneCue,
  advisorProjectBoards,
  engagementReachedQa,
  splitAdvisorEngagements,
  type AdvisorAccessSnapshot,
  type AdvisorEngagementSnapshot,
} from "./advisor-processes";

function access(investorId: string, requestedAt: string, accepted = true, nda = false): AdvisorAccessSnapshot {
  return {
    investorId,
    requestedAt: new Date(requestedAt),
    accepted,
    nda,
    questions: false,
    meeting: false,
    offer: false,
    loiAccepted: false,
    roomShared: false,
    passedDiligence: false,
  };
}

function engagement(patch: Partial<AdvisorEngagementSnapshot> & Pick<AdvisorEngagementSnapshot, "id" | "client">): AdvisorEngagementSnapshot {
  return {
    requesterId: "buyer-1",
    services: "Due Diligence",
    depositPaid: true,
    advisorNda: false,
    processOpened: false,
    closed: false,
    projectId: "project-1",
    slug: "proyecto-cala",
    codename: "Proyecto Cala",
    region: "Andalucía",
    saleClosed: false,
    accesses: [access("buyer-1", "2026-10-01"), access("buyer-2", "2026-10-02")],
    ...patch,
  };
}

describe("engagementReachedQa", () => {
  it("requires the hiring buyer to have signed the NDA", () => {
    expect(
      engagementReachedQa(
        engagement({
          id: "buyer-job",
          client: "investor",
          requesterId: "buyer-2",
          accesses: [access("buyer-1", "2026-10-01", true, true), access("buyer-2", "2026-10-02", true, false)],
        }),
      ),
    ).toBe(false);
    expect(
      engagementReachedQa(
        engagement({
          id: "buyer-job",
          client: "investor",
          requesterId: "buyer-2",
          accesses: [access("buyer-1", "2026-10-01", true, false), access("buyer-2", "2026-10-02", true, true)],
        }),
      ),
    ).toBe(true);
  });

  it("requires any buyer in Q&A for a seller hire", () => {
    expect(engagementReachedQa(engagement({ id: "seller-job", client: "seller" }))).toBe(false);
    expect(
      engagementReachedQa(
        engagement({
          id: "seller-job",
          client: "seller",
          accesses: [access("buyer-1", "2026-10-01", true, true)],
        }),
      ),
    ).toBe(true);
  });
});

describe("advisorProjectBoards", () => {
  it("drops hires that never reached Q&A instead of showing a waiting card", () => {
    expect(advisorProjectBoards([engagement({ id: "seller-job", client: "seller" })])).toEqual([]);
    expect(
      advisorProjectBoards([
        engagement({
          id: "buyer-job",
          client: "investor",
          depositPaid: true,
          accesses: [access("buyer-1", "2026-10-01", false, false)],
        }),
      ]),
    ).toEqual([]);
  });

  it("keeps other buyers off the board until the seller opens the process", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "seller-job",
        client: "seller",
        accesses: [access("buyer-1", "2026-10-01", true, true), access("buyer-2", "2026-10-02", true, true)],
      }),
    ]);

    expect(board?.lanes).toEqual([]);
    expect(board?.note).toContain("no ha abierto el proceso");
    expect(JSON.stringify(board)).not.toContain("buyer-1");
  });

  it("lists only buyers already in Q&A once the seller opens the process", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "seller-job",
        client: "seller",
        processOpened: true,
        accesses: [access("buyer-1", "2026-10-01", true, true), access("buyer-2", "2026-10-02", true, false)],
      }),
    ]);

    expect(board?.hiredBySeller).toBe(true);
    expect(board?.lanes.map((lane) => lane.label)).toEqual(["Inversor 1"]);
    expect(board?.lanes[0]?.steps.find((step) => step.id === "nda")?.state).toBe("done");
    expect(board?.lanes[0]?.steps.find((step) => step.id === "qa")?.state).toBe("current");
    expect(JSON.stringify(board)).not.toContain("@");
  });

  it("shows only the buyer who hired the advisor once that buyer is in Q&A", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "buyer-job",
        client: "investor",
        requesterId: "buyer-2",
        advisorNda: true,
        accesses: [access("buyer-1", "2026-10-01", true, false), access("buyer-2", "2026-10-02", true, true)],
      }),
    ]);

    expect(board?.lanes).toHaveLength(1);
    expect(board?.lanes[0]?.label).toBe("Inversor");
    expect(board?.lanes[0]?.steps.find((step) => step.id === "nda")?.state).toBe("done");
    expect(board?.advisorNda).toBe(true);
    expect(board?.ndaPending).toBe(false);
    expect(JSON.stringify(board)).not.toContain("buyer-1");
  });

  it("keeps the seller lanes when another hire still owes the deposit", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "seller-job",
        client: "seller",
        processOpened: true,
        closed: true,
        accesses: [access("buyer-1", "2026-10-01", true, true), access("buyer-2", "2026-10-02", true, true)],
      }),
      engagement({
        id: "buyer-job",
        client: "investor",
        depositPaid: false,
        requesterId: "buyer-1",
        accesses: [access("buyer-1", "2026-10-01", true, true), access("buyer-2", "2026-10-02", true, true)],
      }),
    ]);

    expect(board?.depositPending).toBe(true);
    expect(board?.lanes.map((lane) => lane.label)).toEqual(["Inversor 1", "Inversor 2"]);
    expect(board?.note).toBeNull();
  });

  it("asks the advisor to sign the NDA while the seller has not accepted", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "buyer-job",
        client: "investor",
        depositPaid: true,
        advisorNda: false,
        accesses: [access("buyer-1", "2026-10-01", false, true)],
      }),
    ]);
    const lane = board?.lanes[0];

    expect(lane?.label).toBe("Inversor");
    expect(lane?.signNdaId).toBe("buyer-job");
    expect(advisorLaneCue(lane?.steps ?? [], true)).toEqual({ yours: true, action: "Firma el NDA" });
    expect(board?.ndaPending).toBe(true);
  });

  it("shows the buyer's progress before the deposit is paid when already in Q&A", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "buyer-job",
        client: "investor",
        depositPaid: false,
        accesses: [access("buyer-1", "2026-10-01", true, true)],
      }),
    ]);

    expect(board?.depositPending).toBe(true);
    expect(board?.lanes).toHaveLength(1);
    expect(board?.lanes[0]?.label).toBe("Inversor");
    expect(board?.lanes[0]?.steps.find((step) => step.id === "qa")?.state).toBe("current");
    expect(board?.note).toBeNull();
    expect(board?.href).toBe("/mandatos/encargos/buyer-job");
  });

  it("opens the paid job when the same company also has a closed unpaid encargo", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "seller-job",
        client: "seller",
        depositPaid: false,
        closed: true,
        services: "Consultoría Fiscal",
        accesses: [access("buyer-1", "2026-10-01", true, true)],
      }),
      engagement({
        id: "buyer-job",
        client: "investor",
        depositPaid: true,
        services: "Due Diligence",
        accesses: [access("buyer-1", "2026-10-01", true, true)],
      }),
    ]);

    expect(board?.href).toBe("/mandatos/encargos/buyer-job");
    expect(board?.services).toEqual(["Consultoría Fiscal", "Due Diligence"]);
  });

  it("does not mark a closed job as waiting for the deposit", () => {
    const [board] = advisorProjectBoards([
      engagement({
        id: "seller-job",
        client: "seller",
        depositPaid: false,
        closed: true,
        processOpened: false,
        accesses: [access("buyer-1", "2026-10-01", true, true)],
      }),
    ]);

    expect(board?.depositPending).toBe(false);
    expect(board?.note).toContain("ya está cerrado");
  });

  it("keeps an unpaid request on encargos and a paid or closed job on procesos", () => {
    const split = splitAdvisorEngagements([
      engagement({ id: "waiting", client: "investor", depositPaid: false, accesses: [access("buyer-1", "2026-10-01", true, true)] }),
      engagement({
        id: "live",
        client: "seller",
        projectId: "project-2",
        codename: "Proyecto Duna",
        accesses: [access("buyer-1", "2026-10-01", true, true)],
      }),
      engagement({
        id: "done",
        client: "seller",
        projectId: "project-3",
        codename: "Proyecto Olivo",
        depositPaid: false,
        closed: true,
        accesses: [access("buyer-1", "2026-10-01", true, true)],
      }),
    ]);

    expect(split.awaiting.map((row) => row.id)).toEqual(["waiting"]);
    expect(split.active.map((row) => row.id)).toEqual(["live", "done"]);
  });
});
