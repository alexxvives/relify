import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { processTurnActions, type DealStep } from "@/lib/deal-pipeline";
import { companyCopy } from "@/lib/company-copy";

const read = (path: string) => readFileSync(path, "utf8");

const step = (id: DealStep["id"], state: DealStep["state"], pendingLoi = false): DealStep => ({ id, label: id, detail: "", state, pendingLoi });

describe("Round S41 (Alex t182u)", () => {
  it("1: buyers carry their real name in the advisor chats, the seller ficha and the advisor boards", () => {
    expect(read("src/lib/server/advisor-process-chat.ts")).toMatch(/personName\(access\.investor\.name, access\.investor\.lastName\)/);
    expect(read("src/lib/server/seller-buyer-ficha.ts")).toMatch(/personName\(row\.investor\.name/);
    expect(read("src/lib/server/advisory-engagement.ts")).not.toMatch(/connectedName: access\.sellerAcceptedAt/);
    expect(read("src/lib/server/engagement-thread.ts")).not.toMatch(/!access\?\.sellerAcceptedAt/);
  });

  it("2: Aceptar carta is the green step button, right after the Tu turno text", () => {
    const pipeline = read("src/components/investor/deal-pipeline.tsx");
    expect(pipeline).toMatch(/onClick=\{onAccept\}\s+className=\{stepCtaClass\}/);
    expect(pipeline).not.toMatch(/bg-\[#465ab4\] px-3 text-sm font-semibold text-white"\s*>\s*Aceptar carta/);
    expect(read("src/components/seller/seller-processes.tsx")).toMatch(/action=\{\s*<>\s*\{loiPending && offer \? <AcceptLoiButton/);
  });

  it("3/4: the seller filter swaps in place, only off the company tab, and the overlay folds on tab change", () => {
    const desk = read("src/components/seller/seller-process-desk.tsx");
    expect(desk).not.toMatch(/router\.push/);
    expect(desk).toMatch(/history\.replaceState/);
    expect(desk).toMatch(/tab !== "company" && options\.length > 1/);
    expect(desk).toMatch(/<BuyerCardOverlay autoFold=\{tab !== "company"\}>/);
    expect(read("src/components/advisor/advisor-process-desk.tsx")).toMatch(/<BuyerCardOverlay autoFold=\{tab !== "company"\}>/);
    expect(read("src/components/advisor/advisor-rail-dock.tsx")).not.toMatch(/startFolded/);
  });

  it("5/9b: dialog buttons are centred and Rechazar solicitud has a red outline", () => {
    expect(read("src/components/investor/cancel-process-button.tsx")).toMatch(/mt-5 flex flex-wrap items-center justify-center gap-2/);
    const deposit = read("src/components/advisor/advisor-engagement-forms.tsx");
    expect(deposit).toMatch(/justify-center gap-3/);
    expect(deposit).toMatch(/border border-\[#f3c7c4\][^"]*text-\[#b42318\]/);
  });

  it("6: the Empresa filter lists the company name only", () => {
    expect(read("src/components/advisor/advisory-picker.tsx")).toMatch(/label: item\.codename \}/);
  });

  it("8a/9a: a small centred Precio recomendado button and short range copy", () => {
    expect(companyCopy.useRecommended).toBe("Precio recomendado");
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/mx-auto mt-2 flex h-8 w-fit/);
    expect(form).toMatch(/note: "EBITDA de referencia × múltiplo ajustado"/);
    expect(form).not.toMatch(/redondeado a miles|EBITDA aj\. ×/);
  });

  it("8b: per-process Tu turno actions join Acciones pendientes", () => {
    const threads = [
      { accessId: "a", label: "Ana", stage: "open", steps: [step("qa", "current", true)] },
      { accessId: "b", label: "Luis", stage: "open", steps: [step("qa", "current")] },
      { accessId: "c", label: "Eva", stage: "open", steps: [step("documents", "current")], contract: { next: { who: "you" as const, text: "Sube el contrato" } } },
      { accessId: "d", label: "Pau", stage: "pending", steps: [step("conexion", "current")] },
    ];
    expect(processTurnActions(threads, "seller")).toEqual([
      { accessId: "a", label: "Ana", action: "Acepta la carta de intenciones" },
      { accessId: "c", label: "Eva", action: "Sube el contrato" },
    ]);
    expect(read("src/components/seller/seller-processes.tsx")).toMatch(/pendingActionsTitle\(pendingMatches\.length \+ turns\.length\)/);
  });

  it("10: the slider count sits in the overlay header", () => {
    expect(read("src/components/advisor/buyer-card-slider.tsx")).toMatch(/createPortal\(/);
    expect(read("src/components/advisor/advisor-rail-dock.tsx")).toMatch(/BuyerOverlayHeaderSlot\.Provider/);
  });

  it("11: the buyer's LOI-accepted notice is one line", () => {
    const source = read("src/lib/server/accept-loi.ts");
    expect(source).toMatch(/body: "El vendedor aceptó tu carta de intenciones\."/);
    expect(source).not.toMatch(/siguiente paso/);
  });

  it("12-14: shared card header; buyer card has no Chat/Reuniones toggles; button order", () => {
    const buyer = read("src/components/investor/investor-processes.tsx");
    expect(buyer).not.toMatch(/id: "chat"|id: "meetings"|ProcessConversation/);
    for (const file of ["src/components/investor/investor-processes.tsx", "src/components/seller/seller-processes.tsx", "src/components/admin/admin-connections.tsx"]) {
      expect(read(file)).toMatch(/<ProcessCardHeader/);
    }
    const header = read("src/components/investor/process-card-header.tsx");
    expect(header.indexOf("data-advisor-link")).toBeLessThan(header.indexOf("<CancelProcessButton"));
    expect(header.indexOf("<CancelProcessButton")).toBeLessThan(header.indexOf("<ProcessFichaLink"));
  });
});
