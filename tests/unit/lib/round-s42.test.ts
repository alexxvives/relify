import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { estimatePriceRange } from "@/lib/valuation-multiples";

const read = (path: string) => readFileSync(path, "utf8");

describe("Round S42 (Alex t183u)", () => {
  it("1/2: the landing pill is frosted and opaque; Prueba gratis goes to the lista de espera", () => {
    expect(read("src/app/globals.css")).toMatch(/\.releva-menu \{[\s\S]{0,400}background: rgb\(255 255 255 \/ 0\.86\)/);
    expect(read("src/components/landing/try-free-button.tsx")).toMatch(/href = landingCopy\.waitlistNav\.href/);
    expect(read("src/components/landing/hero.tsx")).not.toMatch(/registro/);
  });

  it("3: Tu progreso opens on every entry while incomplete", () => {
    const nav = read("src/components/seller/detail-section-nav.tsx");
    expect(nav).not.toMatch(/query\.has\("seccion"\)/);
    expect(nav).toMatch(/if \(!openOnEntry\) return;/);
  });

  it("4/5: Precio recomendado sits between Mín. and Máx.; the note names the adjustments", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/grid grid-cols-\[1fr_auto_1fr\]/);
    expect(form).toMatch(/center=\{\s*recommended \?/);
    expect(form).toMatch(/const rangeNote = "EBITDA de referencia × múltiplo \+ ajustes"/);
    const estimate = estimatePriceRange({ cnae: "7022", ebitdaCents: 400_000_00, headcount: "band_21_50", revenueGrowth: 0.2, ebitdaTrend: 0.12 });
    expect(estimate?.factors).toEqual({ headcount: 0.25, sales: 0.5, ebitdaTrend: 0.5, trendCapped: true });
    expect(estimate?.multipleLow).toBe(3 + 0.25 + 0.75);
  });

  it("6/7/8: one pending-row style with scroll; buttons flow after the cue text; no asesor link, icon cancel on phones", () => {
    const list = read("src/components/seller/seller-processes.tsx");
    expect(list).toMatch(/max-h-80 flex-col gap-2 overflow-y-auto/);
    expect(list).not.toMatch(/bg-\[#fff5f5\]/);
    expect(read("src/components/investor/deal-pipeline.tsx")).toMatch(/function CueLine/);
    const header = read("src/components/investor/process-card-header.tsx");
    expect(header).not.toMatch(/data-advisor-link/);
    expect(header).toMatch(/<CancelProcessButton accessId=\{cancelAccessId\} iconOnPhone \/>/);
    expect(read("src/components/investor/cancel-process-button.tsx")).toMatch(/XCircle className="size-4 sm:hidden"/);
  });

  it("9/10/11/13: documents tiles, smaller folder, escaping goo, same-height panels", () => {
    const docs = read("src/components/seller/seller-documents.tsx");
    expect(docs).toMatch(/size=\{0\.48\}/);
    expect(docs.match(/h-full min-h-44/g)?.length).toBeGreaterThanOrEqual(4);
    expect(read("src/components/seller/report-nav.tsx")).toMatch(/pointer-events-none -my-10 py-10/);
    expect(read("src/components/investor/meeting-desk.tsx")).toMatch(/className=\{processPanelGridClass\}/);
    expect(read("src/components/investor/process-chat-layout.tsx")).toMatch(/className=\{processPanelGridClass\}/);
  });

  it("12: the advisor's Reuniones follows the buyer filter with that process's meetings (server-scoped)", () => {
    const server = read("src/lib/server/advisor-process-chat.ts");
    expect(server).toMatch(/kind: \{ in: \["question", "meeting"\] \}/);
    expect(server).toMatch(/meetings: messages/);
    const desk = read("src/components/advisor/advisor-process-desk.tsx");
    expect(desk).toMatch(/tab !== "company" \? <BuyerFilter/);
    expect(desk).toMatch(/<MeetingDesk key=\{active\.accessId\} messages=\{active\.meetings\}/);
  });

  it("14/15/16: INT advisors pack, no blank region option, real client name on encargos", () => {
    expect(read("prisma/int-s42-advisor-directory.sql")).toMatch(/INT only[\s\S]*advisor_inbox[\s\S]*ON CONFLICT \(user_id\) DO NOTHING/);
    expect(read("src/components/investor/market-browser.tsx")).toMatch(/filter\(\(region\) => region\.length > 0\)/);
    expect(read("src/lib/advisor-processes.ts")).toMatch(/access\.connectedName\?\.trim\(\)/);
  });
});
