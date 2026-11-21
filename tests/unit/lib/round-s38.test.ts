import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  advisoryEngagement: { findUnique: vi.fn() },
  depositRefund: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
const stripe = vi.hoisted(() => ({
  checkout: { sessions: { retrieve: vi.fn() } },
  refunds: { create: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/server/stripe", () => ({ stripeClient: () => stripe }));

import { advisorCopy } from "@/lib/advisor-copy";
import { adminCopy } from "@/lib/admin-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { advisorChatScope } from "@/lib/server/advisor-process-chat";
import { adjustmentDecisionNotice, canDecide } from "@/lib/server/decide-ebitda-adjustment";
import { depositRefundKey, refundAdvisorDeposit, shouldAttemptRefund } from "@/lib/server/deposit-refund";

const read = (path: string) => readFileSync(path, "utf8");

describe("S38 copy", () => {
  it("says what is public and what is not", () => {
    expect(advisorCopy.profileIdentity).toBe("Información básica");
    expect(advisorCopy.descriptionPlaceholder).toBe("Describe tu asesoría");
    expect(advisorCopy.confidential).toMatch(/nombre de la asesoría sale en tu ficha pública/);
    expect(advisorCopy.confidential).toMatch(/NIF y el código postal no se publican/);
    expect(engagementCopy.directoryIntro).toMatch(/correo y los documentos no salen/);
    expect(advisorCopy.documentsInsurance).toMatch(/responsabilidad civil profesional/);
    expect(engagementCopy.depositPoints.join(" ")).toMatch(/operación se cierra o el proceso se cancela/);
  });
});

describe("S38 deposit refund", () => {
  const paid = {
    id: "eng-1",
    advisorId: "adv-1",
    projectId: "p-1",
    depositPaidAt: new Date(),
    depositCents: 5500,
    depositSessionId: "cs_test_1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    db.advisoryEngagement.findUnique.mockResolvedValue(paid);
    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_intent: "pi_1" });
    stripe.refunds.create.mockResolvedValue({ id: "re_1", status: "succeeded" });
  });

  it("only retries when nothing was sent or the last try failed", () => {
    expect(shouldAttemptRefund(null)).toBe(true);
    expect(shouldAttemptRefund("failed")).toBe(true);
    expect(shouldAttemptRefund("pending")).toBe(false);
    expect(shouldAttemptRefund("succeeded")).toBe(false);
  });

  it("refunds once, with a stable idempotency key, and records the state", async () => {
    db.depositRefund.findUnique.mockResolvedValue(null);
    await expect(refundAdvisorDeposit("eng-1", "closed")).resolves.toEqual({ ok: true, status: "succeeded" });
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_1" }),
      { idempotencyKey: depositRefundKey("eng-1") },
    );
    expect(db.depositRefund.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "pending", amountCents: 5500, reason: "closed" }) });
    expect(db.depositRefund.update).toHaveBeenLastCalledWith({ where: { id: expect.any(String) }, data: expect.objectContaining({ status: "succeeded", stripeRefundId: "re_1" }) });
  });

  it("does not call Stripe again for a refund already sent", async () => {
    db.depositRefund.findUnique.mockResolvedValue({ id: "r1", status: "succeeded" });
    await expect(refundAdvisorDeposit("eng-1", "cancelled")).resolves.toEqual({ ok: true, status: "succeeded" });
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });

  it("records a failure so admin can retry, and skips unpaid encargos", async () => {
    db.depositRefund.findUnique.mockResolvedValue(null);
    stripe.refunds.create.mockRejectedValue(Object.assign(new Error("x"), { code: "card_declined" }));
    await expect(refundAdvisorDeposit("eng-1", "admin", "admin-1")).resolves.toEqual({ ok: true, status: "failed" });
    expect(db.depositRefund.update).toHaveBeenLastCalledWith({ where: { id: expect.any(String) }, data: { status: "failed", error: "card_declined" } });
    db.advisoryEngagement.findUnique.mockResolvedValue({ ...paid, depositPaidAt: null });
    await expect(refundAdvisorDeposit("eng-1", "closed")).resolves.toEqual({ ok: false, code: "unpaid" });
  });

  it("wires the refund to close, sale, cancel and delete, plus the admin action", () => {
    expect(read("src/lib/server/advisory-engagement.ts")).toMatch(/refundAdvisorDeposit\(row\.id, "closed"\)/);
    expect(read("src/lib/server/advisory-engagement.ts")).toMatch(/refundAdvisorDeposit\(row\.id, "cancelled"\)/);
    expect(read("src/lib/server/record-success-fee.ts")).toMatch(/refundDepositsWhere\(\{ projectId: project\.id \}, "closed"\)/);
    expect(read("src/lib/server/cancel-project-access.ts")).toMatch(/refundDepositsWhere/);
    expect(read("src/app/(app)/admin/actions.ts")).toMatch(/refundAdvisorDeposit\(readText\(formData, "engagementId"\), "admin", user\.id\)/);
    expect(adminCopy.refundAction).toBe("Devolver depósito");
  });
});

describe("S38 EBITDA adjustment decisions", () => {
  it("are reversible both ways and never repeat", () => {
    expect(canDecide("pending", "approved")).toBe(true);
    expect(canDecide("pending", "rejected")).toBe(true);
    expect(canDecide("approved", "rejected")).toBe(true);
    expect(canDecide("rejected", "approved")).toBe(true);
    expect(canDecide("approved", "approved")).toBe(false);
  });

  it("tell the seller each way", () => {
    expect(adjustmentDecisionNotice("approved", null).title).toMatch(/aprobado/);
    expect(adjustmentDecisionNotice("rejected", "Falta factura").body).toMatch(/Motivo: Falta factura/);
  });
});

describe("S38 asesor process chats", () => {
  const base = { advisorId: "a", depositPaidAt: new Date(), declinedAt: null, requesterId: "buyer", projectId: "p" };
  const advisor = { id: "a", role: "advisor", onboarded: true };

  it("seller-hired sees every buyer chat, buyer-hired only the client's", () => {
    expect(advisorChatScope(advisor, { ...base, client: "seller" })).toEqual({ side: "seller", projectId: "p", investorId: null });
    expect(advisorChatScope(advisor, { ...base, client: "investor" })).toEqual({ side: "investor", projectId: "p", investorId: "buyer" });
  });

  it("needs this asesor, a paid deposit and an open encargo", () => {
    expect(advisorChatScope({ ...advisor, id: "b" }, { ...base, client: "seller" })).toBeNull();
    expect(advisorChatScope({ ...advisor, role: "seller" }, { ...base, client: "seller" })).toBeNull();
    expect(advisorChatScope(advisor, { ...base, client: "seller", depositPaidAt: null })).toBeNull();
    expect(advisorChatScope(advisor, { ...base, client: "seller", declinedAt: new Date() })).toBeNull();
  });
});

describe("S38 migrations and favicon", () => {
  it("ships S37 and S38 schema as Prisma migrations, matching the INT pack", () => {
    expect(read("prisma/migrations/20261121000000_advisor_document/migration.sql")).toMatch(/CREATE TABLE "advisor_document"/);
    const s38 = read("prisma/migrations/20261121010000_s38_refunds_adjustment_decisions/migration.sql");
    expect(s38).toMatch(/CREATE TABLE "deposit_refund"/);
    expect(s38).toMatch(/CREATE TABLE "ebitda_adjustment_decision"/);
    expect(s38).toMatch(/ADD COLUMN\s+"advisor_id"/);
    const body = (sql: string) => sql.split("\n").slice(1).join("\n");
    expect(body(read("prisma/int-s38-refunds-adjustment-decisions.sql"))).toBe(body(s38));
    expect(createHash("sha256").update(s38).digest("hex")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses the storefront glyph, with a 16/32/48 favicon", () => {
    const ico = readFileSync("public/favicon.ico");
    expect(ico.readUInt16LE(4)).toBe(3);
    expect([ico[6], ico[22], ico[38]].sort((a, b) => a - b)).toEqual([16, 32, 48]);
  });
});
