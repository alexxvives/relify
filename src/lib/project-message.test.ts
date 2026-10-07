import { describe, expect, it } from "vitest";
import { incomingQuestionNotice } from "./notifications";
import {
  anonymousInvestorLabel,
  investorNoticeFor,
  labelAccesses,
  sellerReplyGate,
  threadPartyLabel,
  personName,
  toThreadMessage,
} from "./project-message";

describe("sellerReplyGate", () => {
  it("allows the owner after the NDA and refuses an advisor", () => {
    expect(
      sellerReplyGate({ onboarded: true, role: "seller", ownsProject: true, sellerAccepted: true, ndaAccepted: true }),
    ).toEqual({ ok: true });
    expect(
      sellerReplyGate({ onboarded: true, role: "advisor", ownsProject: false, sellerAccepted: true, ndaAccepted: true }),
    ).toEqual({ ok: false, code: "forbidden" });
    expect(
      sellerReplyGate({ onboarded: true, role: "seller", ownsProject: true, sellerAccepted: false, ndaAccepted: true }),
    ).toEqual({ ok: false, code: "not-accepted" });
    expect(
      sellerReplyGate({ onboarded: true, role: "seller", ownsProject: true, sellerAccepted: true, ndaAccepted: false }),
    ).toEqual({ ok: false, code: "nda-required" });
  });
});

describe("thread views", () => {
  it("labels the other party without an account field", () => {
    expect(threadPartyLabel("seller")).toBe("Un inversor");
    const view = toThreadMessage({
      id: "msg-1",
      kind: "question",
      body: "¿Cuál es el equipo?",
      author: "investor",
      viewer: "seller",
      createdAt: new Date("2026-10-04T10:00:00.000Z"),
    });
    expect(view.mine).toBe(false);
    expect(Object.keys(view).sort()).toEqual(["body", "createdAt", "id", "kind", "mine"]);
    expect(JSON.stringify(view)).not.toContain("inversor@example.com");
    expect(investorNoticeFor("question", "Proyecto Duna")).toEqual(incomingQuestionNotice("Proyecto Duna"));
    expect(incomingQuestionNotice("Proyecto Duna").body).toBe(
      "Un inversor ha enviado una pregunta sobre Proyecto Duna.",
    );
    expect(anonymousInvestorLabel(2)).toBe("Inversor 2");
    const labeled = labelAccesses([
      { projectId: "cala", requestedAt: new Date("2026-09-20T10:00:00.000Z"), id: "later" },
      { projectId: "cala", requestedAt: new Date("2026-09-18T10:00:00.000Z"), id: "earlier" },
      { projectId: "duna", requestedAt: new Date("2026-09-01T10:00:00.000Z"), id: "other" },
    ]);
    expect(labeled.find((row) => row.id === "earlier")?.label).toBe("Inversor 1");
    expect(labeled.find((row) => row.id === "later")?.label).toBe("Inversor 2");
    expect(labeled.find((row) => row.id === "other")?.label).toBe("Inversor 1");
    expect(JSON.stringify(labeled)).not.toContain("@");
    expect(personName("Laura", "Vidal")).toBe("Laura Vidal");
    expect(personName("Elena", null)).toBe("Elena");
  });
});
