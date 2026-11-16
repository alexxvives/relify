import { describe, expect, it } from "vitest";
import type { EbitdaAdjustment } from "@/lib/ebitda-adjustments";
import { ebitdaAdjustmentEmail, shouldNotifyEbitdaAdjustment } from "@/lib/ebitda-adjustment-email";
import { SABI_NOTIFY_TO } from "@/lib/sabi-request-email";

const pendingRow: EbitdaAdjustment = {
  id: "6f1c2a40-7b1e-4c1a-9a1a-0b1c2d3e4f50",
  type: "one_off",
  amountCents: 5_000_000,
  reason: "Gasto no recurrente",
  status: "pending",
  documentId: null,
  documentName: null,
};

describe("ebitdaAdjustmentEmail", () => {
  it("goes to the team inbox with company, project id, amount and concepts, without an owner email", () => {
    const mail = ebitdaAdjustmentEmail({
      companyName: "Tecnología Digital SL",
      projectId: "proj_int_1",
      adjustmentAmountCents: 5_000_000,
      rows: [pendingRow],
      adminUrl: "https://itsrelify.com/admin/empresas/proyecto-quercus",
      at: new Date("2026-11-10T12:00:00Z"),
    });
    expect(mail.to).toBe(SABI_NOTIFY_TO);
    expect(mail.subject).toBe("Ajuste de EBITDA: Tecnología Digital SL");
    expect(mail.text).toContain("proj_int_1");
    expect(mail.text).toContain("50.000,00 €");
    expect(mail.text).toContain("Gastos extraordinarios no recurrentes");
    expect(mail.text).toContain("Gasto no recurrente");
    expect(mail.text).toContain("https://itsrelify.com/admin/empresas/proyecto-quercus");
    expect(mail.text).not.toContain("@test.local");
  });
});

describe("shouldNotifyEbitdaAdjustment", () => {
  it("fires once when pending rows appear or change, not on a repeat save", () => {
    expect(shouldNotifyEbitdaAdjustment(null, [pendingRow])).toBe(true);
    expect(shouldNotifyEbitdaAdjustment([pendingRow], [pendingRow])).toBe(false);
    expect(shouldNotifyEbitdaAdjustment([pendingRow], [{ ...pendingRow, amountCents: 6_000_000 }])).toBe(true);
    expect(shouldNotifyEbitdaAdjustment([pendingRow], [{ ...pendingRow, status: "approved" }])).toBe(false);
  });
});
