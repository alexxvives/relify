import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Round S39 (Alex t180u)", () => {
  it("2: only admin refunds a deposit and flags it ready for review", () => {
    for (const file of ["src/lib/server/record-success-fee.ts", "src/lib/server/cancel-project-access.ts", "src/lib/server/advisory-engagement.ts"]) {
      expect(read(file)).not.toMatch(/deposit-refund/);
    }
    expect(read("src/components/admin/admin-billing.tsx")).toMatch(/data-refund-review/);
    expect(read("src/lib/engagement-copy.ts")).toMatch(/Relify te lo devuelve tras verificar el cierre o la cancelación/);
  });

  it("3/4/5/8/9: Tu empresa polish", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).not.toMatch(/data-unsaved-hint/);
    expect(form).toMatch(/data-cnae-compact/);
    expect(form).toMatch(/data-pending-clock/);
    expect(form).not.toMatch(/hint=\{dealNote\}/);
    expect(read("src/lib/company-copy.ts")).toMatch(/Lo rellenamos en 24 h/);
  });

  it("11/12: checklist links land on their own field title with a marker sweep", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/relify-marker/);
    expect(read("src/app/globals.css")).toMatch(/@keyframes relify-marker-sweep[\s\S]*prefers-reduced-motion/);
    expect(read("src/lib/publish-checklist.ts")).toMatch(/detailHref\("price", "panel-asking-price"\)/);
    expect(read("src/lib/publish-checklist.ts")).not.toMatch(/`#\$\{/);
  });

  it("10: the DNI saves inline on blur, without a Cambiar button", () => {
    const account = read("src/components/account/account-settings.tsx");
    expect(account).toMatch(/onBlur=\{commitId\}|onBlur=\{\(\) => commitId\(\)\}/);
    expect(account).toMatch(/data-id-saved/);
    expect(read("src/lib/auth-copy.ts")).not.toMatch(/nationalIdChange/);
  });

  it("13/14: smaller folders and one-line stat captions", () => {
    expect(read("src/components/seller/seller-documents.tsx")).toMatch(/size=\{0\.56\}/);
    const summary = read("src/components/seller/seller-activity-summary.tsx");
    expect(summary).not.toMatch(/Compradores distintos|Piden acceso a tu empresa/);
  });

  it("17: advisor quick links to Chat, Documentos and Reuniones", () => {
    const view = read("src/components/advisor/advisor-engagement-view.tsx");
    expect(view).toMatch(/<AdvisorQuickLinks/);
    expect(view).toMatch(/id=\{advisorSectionIds\.chat\}/);
    expect(view).toMatch(/id=\{advisorSectionIds\.documents\}/);
    expect(view).toMatch(/id=\{advisorSectionIds\.meetings\}/);
    expect(read("src/components/advisor/advisor-processes.tsx")).toMatch(/<AdvisorQuickLinks/);
    expect(read("src/components/advisor/advisor-contact-desk.tsx")).toMatch(/#reuniones/);
  });

  it("15/16: the INT seed pack is additive", () => {
    const sql = read("prisma/int-s39-seller-processes.sql");
    expect(sql).toMatch(/INT only/);
    expect(sql).toMatch(/ON CONFLICT \(project_id, investor_id\) DO NOTHING/);
    expect(sql).toMatch(/advisor_nda_accepted_at IS NULL/);
    expect(sql).not.toMatch(/\bDELETE\b|\bDROP\b/);
  });
});
