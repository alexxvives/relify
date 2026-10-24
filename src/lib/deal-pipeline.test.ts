import { describe, expect, it } from "vitest";
import { dealPipeline, homePendingActions, investorProcessFiles, pipelineStatus, processFlags, stepCue } from "./deal-pipeline";

const openFlags = {
  accepted: false,
  nda: false,
  qa: false,
  loi: false,
  diligence: false,
  documents: false,
  closed: false,
};

describe("dealPipeline", () => {
  it("pulses the first unfinished step and ends on the purchase", () => {
    const steps = dealPipeline("investor", openFlags);

    expect(steps.map((step) => step.label)).toEqual([
      "Solicitud",
      "Conexión",
      "Confidencialidad",
      "Preguntas",
      "Carta de intenciones",
      "Revisión",
      "Contrato",
      "Venta",
    ]);
    expect(steps.find((step) => step.state === "current")?.id).toBe("conexion");
    expect(steps[0]?.detail).toBe("Tú envías la conexión. La empresa decide si la acepta.");
    expect(steps[steps.length - 1]?.id).toBe("close");
  });

  it("keeps the contract current until the payment, then names the close Venta", () => {
    const seller = dealPipeline("seller", { ...openFlags, accepted: true, nda: true });
    const buyer = dealPipeline("investor", {
      accepted: true,
      nda: true,
      qa: true,
      loi: true,
      diligence: true,
      documents: false,
      closed: false,
    });

    expect(seller[seller.length - 1]?.label).toBe("Venta");
    expect(buyer.find((step) => step.state === "current")?.label).toBe("Contrato");
    expect(pipelineStatus(buyer)).toBe("Contrato");
  });

  it("keeps a later step open while an earlier step is still current", () => {
    const steps = dealPipeline("seller", {
      ...openFlags,
      accepted: true,
      nda: true,
      qa: true,
      diligence: true,
    });

    expect(steps.find((step) => step.id === "loi")?.state).toBe("current");
    expect(steps.find((step) => step.id === "diligence")?.state).toBe("upcoming");
    expect(steps.find((step) => step.id === "close")?.state).toBe("upcoming");
  });

  it("marks every step done once the sale is recorded", () => {
    const steps = dealPipeline("seller", {
      accepted: true,
      nda: true,
      qa: true,
      loi: true,
      diligence: true,
      documents: true,
      closed: true,
    });

    expect(steps.every((step) => step.state === "done")).toBe(true);
    expect(pipelineStatus(steps)).toBe("Venta");
  });

  it("marks a turn only for the person who has to act", () => {
    expect(stepCue("conexion", "seller")).toEqual({ yours: true, action: "Acepta la solicitud de conexión" });
    expect(stepCue("conexion", "investor")).toEqual({
      yours: false,
      action: "El vendedor todavía no ha aceptado la solicitud",
    });
    expect(stepCue("nda", "investor")).toEqual({ yours: true, action: "Firma el acuerdo de confidencialidad" });
    expect(stepCue("nda", "seller")).toEqual({
      yours: false,
      action: "El inversor debe firmar el NDA para proceder.",
    });
    expect(stepCue("qa", "investor").action).toBe("Esta es la etapa para preguntar lo que necesites o reunirte con el vendedor.");
    expect(stepCue("qa", "investor", true)).toEqual({
      yours: false,
      action: "El vendedor todavía no ha aceptado la carta de intenciones",
    });
    expect(stepCue("qa", "seller", true).yours).toBe(true);
    expect(stepCue("qa", "seller").action).toContain("firmará la carta de intenciones");
    expect(stepCue("qa", "investor").action).not.toBe(stepCue("qa", "seller").action);
    expect(stepCue("loi", "investor").yours).toBe(true);
    expect(stepCue("loi", "seller").yours).toBe(false);
  });
});

describe("processFlags", () => {
  it("opens due diligence when the room is shared and closes the contract with the payment", () => {
    expect(
      processFlags({
        accepted: true,
        nda: true,
        questions: true,
        meeting: false,
        offer: false,
        loiAccepted: false,
        roomShared: true,
        passedDiligence: false,
        closed: false,
      }),
    ).toEqual({
      accepted: true,
      nda: true,
      qa: false,
      loi: false,
      loiPending: false,
      diligence: true,
      documents: false,
      closed: false,
    });
    expect(
      processFlags({
        accepted: true,
        nda: true,
        questions: false,
        meeting: false,
        offer: true,
        loiAccepted: true,
        roomShared: false,
        passedDiligence: false,
        closed: true,
      }).documents,
    ).toBe(true);
    expect(
      processFlags({
        accepted: true,
        nda: true,
        questions: true,
        meeting: false,
        offer: true,
        loiAccepted: true,
        roomShared: false,
        passedDiligence: true,
        closed: false,
      }).diligence,
    ).toBe(true);
  });

  it("stays on Q&A until the seller accepts the letter", () => {
    const chatting = processFlags({
      accepted: true,
      nda: true,
      questions: true,
      meeting: true,
      offer: false,
      loiAccepted: false,
      roomShared: false,
      passedDiligence: false,
      closed: false,
    });
    const signed = processFlags({
      accepted: true,
      nda: true,
      questions: true,
      meeting: false,
      offer: true,
      loiAccepted: false,
      roomShared: true,
      passedDiligence: false,
      closed: false,
    });

    expect(dealPipeline("investor", chatting).find((step) => step.state === "current")?.id).toBe("qa");
    expect(dealPipeline("investor", signed).find((step) => step.state === "current")?.id).toBe("qa");
    expect(dealPipeline("seller", signed).find((step) => step.id === "qa")?.pendingLoi).toBe(true);
    expect(
      dealPipeline("investor", { ...signed, loi: true, qa: true, loiPending: false, diligence: false }).find(
        (step) => step.state === "current",
      )?.id,
    ).toBe("diligence");
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

describe("homePendingActions", () => {
  it("keeps only the steps that are this person's turn", () => {
    const waiting = dealPipeline("investor", openFlags);
    const signing = dealPipeline("investor", { ...openFlags, accepted: true });
    const seller = dealPipeline("seller", openFlags);

    expect(
      homePendingActions("investor", [
        { id: "wait", who: "Proyecto Duna", href: "/procesos", steps: waiting },
        { id: "sign", who: "Proyecto Cala", href: "/procesos", steps: signing },
      ]).map((item) => item.title),
    ).toEqual(["Firma el acuerdo de confidencialidad"]);
    expect(homePendingActions("seller", [{ id: "accept", who: "Inversor 1", href: "/mi-empresa/procesos", steps: seller }])).toEqual([
      {
        id: "accept",
        title: "Acepta la solicitud de conexión",
        detail: "Inversor 1",
        href: "/mi-empresa/procesos",
      },
    ]);
  });
});
