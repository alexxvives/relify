import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { stepCue } from "@/lib/deal-pipeline";
import { welcomeNotice } from "@/lib/notifications";

const recorded = vi.hoisted(() => [] as Array<{ userId: string; title: string; body: string; href: string | null }>);
vi.mock("@/lib/server/record-notification", () => ({
  recordNotification: async (input: { userId: string; title: string; body: string; href: string | null }) => {
    if (input.userId === "boom") throw new Error("db down");
    recorded.push(input);
  },
}));

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");
const form = read("src/components/seller/company-draft-form.tsx");

describe("S31: Detalles de empresa", () => {
  it("uses the full page width and drops the 40vh spacer", () => {
    expect(form).not.toMatch(/2xl:max-w-\[60rem\]|detailsColumn/);
    expect(form).not.toMatch(/h-\[40vh\]/);
    // The last section still activates: the scroll spy picks the last id at the page bottom.
    expect(read("src/components/shell/use-scroll-spy.ts")).toMatch(/atBottom && window\.scrollY > 0 \? \(list\.at\(-1\)/);
  });

  it("puts Dentro del rango in the top-right corner of the Precio de venta card", () => {
    expect(form).toMatch(/corner=\{estimate && !disabledReason \? <PriceStandingTag/);
    expect(form.match(/<PriceStandingTag /g)?.length).toBe(1);
  });

  it("the price sheet has only the X to close it", () => {
    expect(form).not.toMatch(/companyCopy\.collapsePanel/);
  });

  it("orders the metrics by column: Precio/Facturación, EBITDA/Margen, EBITDA ajustado/Margen ajustado", () => {
    expect(form).toMatch(/xl:grid-flow-col xl:grid-cols-3 xl:grid-rows-2/);
    const body = form.slice(form.indexOf("function FichaMetrics("), form.indexOf("function SellerFinancingField") > 0 ? form.indexOf("function SellerFinancingField") : undefined);
    const order = [
      body.indexOf('id="panel-asking-price"'),
      body.indexOf("companyCopy.revenueLabel"),
      body.indexOf("companyCopy.ebitdaLabel}"),
      body.indexOf("companyCopy.ebitdaMarginLabel"),
      body.indexOf("companyCopy.adjustedEbitdaLabel"),
      body.indexOf("companyCopy.adjustedEbitdaMarginLabel"),
    ];
    expect(order.every((at) => at > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("shows EBITDA and its margin as the adjusted figures when there are no adjustments", () => {
    expect(form).toMatch(/const shownAdjustedCents = hasAdjustments \? adjustedCents : ebitdaCents/);
    expect(form).toMatch(/const shownAdjustedMargin = hasAdjustments \? adjustedMargin : margin;/);
    expect(form).toMatch(/hasAdjustments=\{hasAdjustments\}/);
  });
});

describe("S31: documents, home card and copy", () => {
  it("the upload zone is a document-sized first tile", () => {
    const css = read("src/components/seller/upload-dropzone.css");
    expect(css).toMatch(/max-width: 11\.5rem;[\s\S]*\.upl-zone \{[\s\S]*aspect-ratio: 1 \/ 1\.414;/);
    const docs = read("src/components/seller/seller-documents.tsx");
    expect(docs).toMatch(/<li data-upload-tile>/);
    expect(docs).not.toMatch(/col-span-2 md:col-span-1">\s*<DocumentDrop/);
  });

  it("the financial-data wait card is shorter, without the Pendiente tag, with a centred button", () => {
    const notice = read("src/components/seller/sabi-pending-notice.tsx");
    expect(notice).not.toMatch(/sabiPendingTag/);
    expect(notice).toMatch(/self-center rounded-full/);
    expect(notice).toMatch(/flex items-center gap-4/);
    expect(read("src/components/seller/seller-overview.tsx")).toMatch(/data-financials-pending className="relative mt-3 h-96 overflow-hidden sm:h-\[22rem\]"/);
  });

  it("the seller Q&A cue no longer mentions the letter of intent", () => {
    expect(stepCue("qa", "seller").action).toBe("El comprador preguntará y podrá reunirse contigo hasta estar convencido.");
    expect(read("src/lib/deal-pipeline.ts")).not.toMatch(/En ese momento firmará la carta de intenciones/);
  });
});

describe("S31: welcome notice", () => {
  it("is recorded from the better-auth user.create hook", () => {
    const auth = read("src/lib/server/auth.ts");
    expect(auth).toMatch(/databaseHooks: \{\s*user: \{\s*create: \{[\s\S]*after: async \(user\) => \{\s*await recordWelcomeNotice\(user\.id\);/);
  });

  it("records one welcome notice and never throws", async () => {
    const { recordWelcomeNotice } = await import("@/lib/server/welcome-notice");
    await recordWelcomeNotice("user-1");
    expect(recorded).toEqual([{ userId: "user-1", title: welcomeNotice.title, body: welcomeNotice.body, href: null }]);
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(recordWelcomeNotice("boom")).resolves.toBeUndefined();
    spy.mockRestore();
    expect(welcomeNotice.title).toMatch(/Relify/);
  });
});
