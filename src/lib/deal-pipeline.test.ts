import { describe, expect, it } from "vitest";
import { dealPipeline, investorProcessFiles, pipelineStatus } from "./deal-pipeline";

const openFlags = {
  accepted: false,
  nda: false,
  questions: false,
  meeting: false,
  offer: false,
  documents: false,
  closed: false,
};

describe("dealPipeline", () => {
  it("pulses the first unfinished step and ends on the purchase", () => {
    const steps = dealPipeline("investor", openFlags);

    expect(steps.map((step) => step.label)).toEqual([
      "Interés",
      "Aceptación",
      "NDA",
      "Preguntas",
      "Reunión",
      "Oferta",
      "Documentación",
      "Compra",
    ]);
    expect(steps.find((step) => step.state === "current")?.id).toBe("accepted");
    expect(steps[steps.length - 1]?.id).toBe("close");
  });

  it("names the last step Venta for the seller and Compra when that step is current", () => {
    const seller = dealPipeline("seller", { ...openFlags, accepted: true, nda: true });
    const buyer = dealPipeline("investor", {
      accepted: true,
      nda: true,
      questions: true,
      meeting: true,
      offer: true,
      documents: true,
      closed: false,
    });

    expect(seller[seller.length - 1]?.label).toBe("Venta");
    expect(buyer.find((step) => step.state === "current")?.label).toBe("Compra");
    expect(pipelineStatus(buyer)).toBe("Compra");
  });

  it("keeps a later step open while an earlier step is still current", () => {
    const steps = dealPipeline("seller", {
      ...openFlags,
      accepted: true,
      nda: true,
      questions: true,
      meeting: true,
      documents: true,
    });

    expect(steps.find((step) => step.id === "offer")?.state).toBe("current");
    expect(steps.find((step) => step.id === "documents")?.state).toBe("upcoming");
    expect(steps.find((step) => step.id === "close")?.state).toBe("upcoming");
  });

  it("marks every step done once the sale is recorded", () => {
    const steps = dealPipeline("seller", {
      accepted: true,
      nda: true,
      questions: true,
      meeting: true,
      offer: true,
      documents: true,
      closed: true,
    });

    expect(steps.every((step) => step.state === "done")).toBe(true);
    expect(pipelineStatus(steps)).toBe("Venta");
  });
});

describe("investorProcessFiles", () => {
  const files = [{ folder: "Fiscal", fileName: "cuentas.pdf" }];

  it("hides file names until the NDA is accepted and the room is shared", () => {
    expect(
      investorProcessFiles({
        ndaAcceptedAt: new Date("2026-01-02T00:00:00.000Z"),
        granted: false,
        files,
      }),
    ).toEqual([]);
    expect(
      investorProcessFiles({
        ndaAcceptedAt: null,
        granted: true,
        files,
      }),
    ).toEqual([]);
  });

  it("returns the file names after both gates pass", () => {
    expect(
      investorProcessFiles({
        ndaAcceptedAt: new Date("2026-01-02T00:00:00.000Z"),
        granted: true,
        files,
      }),
    ).toEqual(files);
  });
});
