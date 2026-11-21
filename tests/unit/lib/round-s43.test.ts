import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  billingCustomer: { findUnique: vi.fn() },
  advisoryEngagement: { findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  advisorProfile: { findUnique: vi.fn() },
}));
const stripeClient = vi.hoisted(() => vi.fn(() => { throw new Error("Stripe must not be called"); }));
const notifyDepositAccepted = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/server/stripe", () => ({ stripeClient, integrationLabel: () => "test" }));
vi.mock("@/lib/server/request-origin", () => ({ requestOrigin: async () => "https://int.example" }));
vi.mock("@/lib/server/record-notification", () => ({ notifyDepositAccepted }));

import { agreedAdvisorFee } from "@/lib/advisor-fee";
import { advisorCopy } from "@/lib/advisor-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { processTurnActions } from "@/lib/deal-pipeline";
import { launchFreeCopy, launchFreeMode } from "@/lib/launch-mode";
import { advisorPrivateTab, counterpartyTabIds, readProcessTab } from "@/lib/process-tabs";
import { closeEngagement } from "@/lib/server/advisory-engagement";
import { loadBuyerPlan, loadStoredBuyerPlan } from "@/lib/server/buyer-plan";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { startAdvisorDepositCheckout, startAdvisorInboxCheckout, startBuyerCheckout, startListingCheckout } from "@/lib/server/start-checkout";

const read = (path: string) => readFileSync(path, "utf8");
const advisor = { id: "adv-1", role: "advisor", onboarded: true } as unknown as CurrentUser;
const buyer = { id: "buy-1", role: "investor", onboarded: true } as unknown as CurrentUser;
const unpaid = {
  id: "eng-1",
  depositPaidAt: null,
  declinedAt: null,
  closedAt: null,
  requesterId: "buy-1",
  client: "investor" as const,
  project: { codename: "Proyecto Faro", askingPriceCents: 100_000_000, slug: "faro" },
};

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("A: LAUNCH_FREE_MODE flag", () => {
  it("is off unless exactly true", () => {
    vi.stubEnv("LAUNCH_FREE_MODE", "");
    expect(launchFreeMode()).toBe(false);
    vi.stubEnv("LAUNCH_FREE_MODE", "1");
    expect(launchFreeMode()).toBe(false);
    vi.stubEnv("LAUNCH_FREE_MODE", "true");
    expect(launchFreeMode()).toBe(true);
    expect(launchFreeCopy.badge).toBe("Gratis durante el lanzamiento");
  });

  it("on: every buyer is unlimited without a DB row; off: the stored plan", async () => {
    vi.stubEnv("LAUNCH_FREE_MODE", "true");
    expect((await loadBuyerPlan("buy-1")).plan).toBe("unlimited");
    expect(db.billingCustomer.findUnique).not.toHaveBeenCalled();

    vi.stubEnv("LAUNCH_FREE_MODE", "false");
    db.billingCustomer.findUnique.mockResolvedValue({ plan: "limited", periodStart: null, periodEnd: null });
    expect((await loadBuyerPlan("buy-1")).plan).toBe("limited");
    db.billingCustomer.findUnique.mockResolvedValue(null);
    expect((await loadBuyerPlan("buy-1")).plan).toBe("none");
  });

  it("the stored plan stays real in launch mode (a real subscriber can still manage it)", async () => {
    vi.stubEnv("LAUNCH_FREE_MODE", "true");
    db.billingCustomer.findUnique.mockResolvedValue(null);
    expect((await loadStoredBuyerPlan("buy-1")).plan).toBe("none");
  });

  it("on: no checkout starts and Stripe is never called", async () => {
    vi.stubEnv("LAUNCH_FREE_MODE", "true");
    const off = { ok: false, message: launchFreeCopy.checkoutOff };
    await expect(startBuyerCheckout(buyer, "unlimited")).resolves.toEqual(off);
    await expect(startListingCheckout(buyer, "p-1")).resolves.toEqual(off);
    await expect(startAdvisorInboxCheckout(advisor)).resolves.toEqual(off);
    expect(stripeClient).not.toHaveBeenCalled();
  });

  it("on: the advisor deposit is waived (paid-equivalent, 0 €, no session) and the client is told", async () => {
    vi.stubEnv("LAUNCH_FREE_MODE", "true");
    db.advisoryEngagement.findFirst.mockResolvedValue(unpaid);
    db.advisoryEngagement.updateMany.mockResolvedValue({ count: 1 });
    await expect(startAdvisorDepositCheckout(advisor, "eng-1")).resolves.toEqual({ ok: true, url: "https://int.example/mandatos/venta/eng-1" });
    expect(db.advisoryEngagement.findFirst.mock.calls[0][0].where).toEqual({ id: "eng-1", advisorId: "adv-1" });
    const update = db.advisoryEngagement.updateMany.mock.calls[0][0];
    expect(update.where).toEqual({ id: "eng-1", depositPaidAt: null, declinedAt: null, closedAt: null });
    expect(update.data).toMatchObject({ depositCents: 0, depositSessionId: null });
    expect(update.data.depositPaidAt).toBeInstanceOf(Date);
    expect(notifyDepositAccepted).toHaveBeenCalledWith({ requesterId: "buy-1", client: "investor", codename: "Proyecto Faro", slug: "faro" });
    expect(stripeClient).not.toHaveBeenCalled();
  });

  it("on: never stamps a declined, other advisor's or already paid encargo, and non-advisors are refused first", async () => {
    vi.stubEnv("LAUNCH_FREE_MODE", "true");
    db.advisoryEngagement.findFirst.mockResolvedValue(null);
    await expect(startAdvisorDepositCheckout(advisor, "eng-x")).resolves.toEqual({ ok: false, message: engagementCopy.missing });
    db.advisoryEngagement.findFirst.mockResolvedValue({ ...unpaid, declinedAt: new Date() });
    await expect(startAdvisorDepositCheckout(advisor, "eng-1")).resolves.toMatchObject({ ok: false });
    db.advisoryEngagement.findFirst.mockResolvedValue({ ...unpaid, depositPaidAt: new Date() });
    await expect(startAdvisorDepositCheckout(advisor, "eng-1")).resolves.toMatchObject({ ok: true });
    expect(db.advisoryEngagement.updateMany).not.toHaveBeenCalled();
    await expect(startAdvisorDepositCheckout(buyer, "eng-1")).resolves.toMatchObject({ ok: false });
    expect(db.advisoryEngagement.findFirst).toHaveBeenCalledTimes(3);
    expect(notifyDepositAccepted).not.toHaveBeenCalled();
  });

  it("off: the deposit goes through Stripe as before (no waive)", async () => {
    vi.stubEnv("LAUNCH_FREE_MODE", "");
    db.advisoryEngagement.findFirst.mockResolvedValue(unpaid);
    await expect(startAdvisorDepositCheckout(advisor, "eng-1")).rejects.toThrow("Stripe must not be called");
    expect(db.advisoryEngagement.updateMany).not.toHaveBeenCalled();
  });

  it("refunds never apply to a waived deposit and admin billing hides 0 € rows", () => {
    expect(read("src/lib/server/get-admin-billing.ts")).toMatch(/depositCents: \{ gt: 0 \}/);
    expect(read("src/lib/server/start-checkout.ts")).toMatch(/depositCents: 0, depositSessionId: null/);
  });

  it("is ON in the INT worker config and documented", () => {
    expect(read("scripts/package-int-worker.mjs")).toMatch(/LAUNCH_FREE_MODE = "true"/);
    expect(read(".env.example")).toMatch(/LAUNCH_FREE_MODE=/);
    expect(read("README.md")).toMatch(/LAUNCH_FREE_MODE/);
  });
});

describe("B: per-counterparty tabs", () => {
  it("lists the tabs per role", () => {
    expect(counterpartyTabIds("investor", { advisor: false })).toEqual(["company", "seller"]);
    expect(counterpartyTabIds("investor", { advisor: true })).toEqual(["company", "seller", "advisor"]);
    expect(counterpartyTabIds("seller", { advisor: true })).toEqual(["company", "buyers", "advisor"]);
    expect(counterpartyTabIds("advisor", { advisor: false })).toEqual(["company", "buyer", "seller"]);
  });

  it("reads old links and unknown tabs safely", () => {
    const ids = counterpartyTabIds("investor", { advisor: false });
    expect(readProcessTab("questions", ids)).toBe("seller");
    expect(readProcessTab("meetings", ids)).toBe("seller");
    expect(readProcessTab("asesor", ids)).toBe("company");
    expect(readProcessTab("asesor", counterpartyTabIds("investor", { advisor: true }))).toBe("advisor");
    expect(readProcessTab("nope", ids)).toBe("company");
    expect(readProcessTab(undefined, ids)).toBe("company");
  });

  it("the advisor's private tab is the client's side", () => {
    expect(advisorPrivateTab("investor")).toBe("buyer");
    expect(advisorPrivateTab("seller")).toBe("seller");
  });

  it("the old private desk placements are gone", () => {
    expect(read("src/components/seller/seller-processes.tsx")).not.toMatch(/AdvisorContactDesk|DeskToggles/);
    expect(read("src/components/investor/investor-processes.tsx")).not.toMatch(/AdvisorDesk/);
  });
});

describe("small items", () => {
  it("2: no lanes line on /mandatos/venta", () => {
    expect("processesLanes" in advisorCopy).toBe(false);
  });

  it("4/6: no count bubble on Ver la ficha, no red dot on Contrato", () => {
    expect(read("src/components/investor/process-ficha-link.tsx")).not.toMatch(/unread[?:]|\{unread/);
    expect(read("src/components/investor/contract-stage.tsx")).not.toMatch(/bg-red-|bg-\[#d92d20\]/);
  });

  it("7: Acciones pendientes uses the short contract text", () => {
    const steps = [{ id: "documents", state: "current" }] as never;
    const actions = processTurnActions(
      [{ accessId: "a", label: "Comprador", stage: "active", steps, contract: { next: { who: "you", text: "Largo.", short: "Sube el contrato de compraventa." } } }],
      "seller",
    );
    expect(actions).toEqual([{ accessId: "a", label: "Comprador", action: "Sube el contrato de compraventa." }]);
  });

  it("12: context-specific deposit locks", () => {
    expect(engagementCopy.depositLock).toEqual({
      chat: "Paga el depósito para acceder al chat.",
      documents: "Paga el depósito para acceder a los documentos.",
      meetings: "Paga el depósito para acceder a las reuniones.",
    });
  });
});

describe("10: Cerrar encargo uses the published price", () => {
  const offers = [
    { serviceType: "DUE_DILIGENCE" as const, priceFromCents: 500_000, priceToCents: 500_000 },
    { serviceType: "TAX_CONSULTING" as const, priceFromCents: 150_000, priceToCents: 300_000 },
  ];

  it("sums the hired services and says when it is a range", () => {
    expect(agreedAdvisorFee(["due-diligence"], offers)).toEqual({ cents: 500_000, fixed: true });
    expect(agreedAdvisorFee(["due-diligence", "tax"], offers)).toEqual({ cents: 650_000, fixed: false });
    expect(agreedAdvisorFee(["legal"], offers)).toBeNull();
    expect(agreedAdvisorFee([], offers)).toBeNull();
  });

  it("the server ignores a typed amount unless the advisor marks a variable part", async () => {
    db.advisoryEngagement.findFirst.mockResolvedValue({ id: "eng-5", closedAt: null, services: ["due-diligence"] });
    db.advisorProfile.findUnique.mockResolvedValue({ services: offers });
    await expect(closeEngagement(advisor, "eng-5", 1, false)).resolves.toMatchObject({ ok: true });
    expect(db.advisoryEngagement.update.mock.calls[0][0].data).toMatchObject({ chargedCents: 500_000, platformNetCents: 75_000 });

    await closeEngagement(advisor, "eng-5", 700_000, true);
    expect(db.advisoryEngagement.update.mock.calls[1][0].data).toMatchObject({ chargedCents: 700_000 });
  });

  it("without published prices the typed amount is required", async () => {
    db.advisoryEngagement.findFirst.mockResolvedValue({ id: "eng-5", closedAt: null, services: ["legal"] });
    db.advisorProfile.findUnique.mockResolvedValue(null);
    await expect(closeEngagement(advisor, "eng-5", null, false)).resolves.toEqual({ ok: false, message: engagementCopy.feeInvalid });
    expect(db.advisoryEngagement.update).not.toHaveBeenCalled();
  });

  it("only the owning advisor can close", async () => {
    db.advisoryEngagement.findFirst.mockResolvedValue(null);
    await expect(closeEngagement(advisor, "eng-x", 100_000, true)).resolves.toEqual({ ok: false, message: engagementCopy.missing });
    await expect(closeEngagement(buyer, "eng-5", 100_000, true)).resolves.toEqual({ ok: false, message: engagementCopy.missing });
    expect(db.advisoryEngagement.findFirst.mock.calls[0][0].where).toEqual({ id: "eng-x", advisorId: "adv-1", declinedAt: null });
    expect(engagementCopy.closeJobHint).toBe("Relify cobra el 15 % + IVA de esa cifra.");
  });
});
