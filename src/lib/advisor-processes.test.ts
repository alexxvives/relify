import { describe, expect, it } from "vitest";
import { advisorProjectBoards, type AdvisorAccessSnapshot, type AdvisorEngagementSnapshot } from "./advisor-processes";

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

describe("advisorProjectBoards", () => {
  it("keeps other buyers hidden until the seller opens the process", () => {
    const [board] = advisorProjectBoards([engagement({ id: "seller-job", client: "seller" })]);

    expect(board?.lanes).toEqual([]);
    expect(board?.note).toContain("no ha abierto el proceso");
    expect(JSON.stringify(board)).not.toContain("buyer-1");
  });

  it("lists each buyer under the seller's company once the process is open", () => {
    const [board] = advisorProjectBoards([
      engagement({ id: "seller-job", client: "seller", processOpened: true }),
    ]);

    expect(board?.hiredBySeller).toBe(true);
    expect(board?.lanes.map((lane) => lane.label)).toEqual(["Inversor 1", "Inversor 2"]);
    expect(board?.lanes[0]?.steps.find((step) => step.id === "conexion")?.state).toBe("done");
    expect(board?.lanes[0]?.steps.find((step) => step.id === "nda")?.state).toBe("current");
    expect(JSON.stringify(board)).not.toContain("@");
  });

  it("shows only the buyer who hired the advisor", () => {
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
    expect(board?.lanes[0]?.label).toBe("El comprador que te contrata");
    expect(board?.lanes[0]?.steps.find((step) => step.id === "nda")?.state).toBe("done");
    expect(board?.advisorNda).toBe(true);
    expect(board?.ndaPending).toBe(false);
    expect(JSON.stringify(board)).not.toContain("buyer-1");
  });

  it("keeps the seller lanes when another hire still owes the deposit", () => {
    const [board] = advisorProjectBoards([
      engagement({ id: "seller-job", client: "seller", processOpened: true, closed: true }),
      engagement({ id: "buyer-job", client: "investor", depositPaid: false, requesterId: "buyer-1" }),
    ]);

    expect(board?.depositPending).toBe(true);
    expect(board?.lanes.map((lane) => lane.label)).toEqual(["Inversor 1", "Inversor 2"]);
    expect(board?.note).toBeNull();
  });

  it("shows the bar when the buyer has not opened a sale yet", () => {
    const [board] = advisorProjectBoards([
      engagement({ id: "buyer-job", client: "investor", depositPaid: false, accesses: [] }),
    ]);

    expect(board?.lanes).toHaveLength(1);
    expect(board?.lanes[0]?.steps.find((step) => step.id === "conexion")?.state).toBe("current");
    expect(board?.note).toBeNull();
    expect(JSON.stringify(board)).not.toContain("buyer-1");
  });

  it("shows the buyer's progress before the deposit is paid", () => {
    const [board] = advisorProjectBoards([
      engagement({ id: "buyer-job", client: "investor", depositPaid: false }),
    ]);

    expect(board?.depositPending).toBe(true);
    expect(board?.lanes).toHaveLength(1);
    expect(board?.lanes[0]?.label).toBe("El comprador que te contrata");
    expect(board?.lanes[0]?.steps.find((step) => step.id === "nda")?.state).toBe("current");
    expect(board?.note).toBeNull();
    expect(board?.href).toBe("/mandatos/encargos/buyer-job");
  });
});
