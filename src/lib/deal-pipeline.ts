import { dataRoomReadGate } from "./data-room";

export const dealStepIds = ["solicitud", "conexion", "nda", "qa", "loi", "diligence", "documents", "close"] as const;

export type DealStepId = (typeof dealStepIds)[number];

export type DealStepState = "done" | "current" | "upcoming";

export type DealStep = {
  id: DealStepId;
  label: string;
  detail: string;
  state: DealStepState;
};

export type DealFlags = {
  accepted: boolean;
  nda: boolean;
  qa: boolean;
  loi: boolean;
  diligence: boolean;
  documents: boolean;
  closed: boolean;
};

export function processFlags(input: {
  accepted: boolean;
  nda: boolean;
  questions: boolean;
  meeting: boolean;
  offer: boolean;
  roomShared: boolean;
  closed: boolean;
}): DealFlags {
  return {
    accepted: input.accepted,
    nda: input.nda,
    qa: input.questions || input.meeting || input.offer,
    loi: input.offer,
    diligence: input.roomShared,
    documents: input.closed,
    closed: input.closed,
  };
}

export type ProcessFile = {
  folder: string;
  fileName: string;
  visible?: boolean;
  id?: string;
  stored?: boolean;
};

const stepCopy: Record<DealStepId, { label: string; detail: string }> = {
  solicitud: {
    label: "Solicitud",
    detail: "El comprador envía la conexión.",
  },
  conexion: {
    label: "Conexión",
    detail: "El vendedor acepta la conexión.",
  },
  nda: {
    label: "NDA",
    detail: "El comprador firma el acuerdo de confidencialidad.",
  },
  qa: {
    label: "Q&A",
    detail: "Preguntas y reuniones entre las dos partes.",
  },
  loi: {
    label: "LOI",
    detail: "Carta de intenciones de compra.",
  },
  diligence: {
    label: "Due diligence",
    detail: "Un asesor revisa la empresa con la documentación compartida.",
  },
  documents: {
    label: "Documentación",
    detail: "Firma del contrato.",
  },
  close: {
    label: "Compraventa",
    detail: "El pago queda hecho.",
  },
};

export function dealPipeline(role: "investor" | "seller", flags: DealFlags): DealStep[] {
  const doneById: Record<DealStepId, boolean> = {
    solicitud: true,
    conexion: flags.accepted,
    nda: flags.nda,
    qa: flags.qa,
    loi: flags.loi,
    diligence: flags.diligence,
    documents: flags.documents,
    close: flags.closed,
  };
  let currentAssigned = false;

  return dealStepIds.map((id) => {
    const copy = stepCopy[id];
    const detail = id === "close" && role === "seller" ? "El pago queda hecho y la venta se cierra." : copy.detail;

    if (!currentAssigned && doneById[id]) {
      return { id, label: copy.label, detail, state: "done" };
    }

    if (!currentAssigned) {
      currentAssigned = true;
      return { id, label: copy.label, detail, state: "current" };
    }

    return { id, label: copy.label, detail, state: "upcoming" };
  });
}

export function pipelineStatus(steps: readonly DealStep[]): string {
  return steps.find((step) => step.state === "current")?.label ?? steps[steps.length - 1]?.label ?? "";
}

export function investorProcessFiles(input: {
  ndaAcceptedAt: Date | null;
  granted: boolean;
  files: readonly ProcessFile[];
}): ProcessFile[] {
  const gate = dataRoomReadGate({
    onboarded: true,
    role: "investor",
    ownsProject: false,
    projectStatus: "published",
    ndaAcceptedAt: input.ndaAcceptedAt,
    granted: input.granted,
  });

  if (!gate.ok || gate.audience !== "investor") {
    return [];
  }

  return input.files.map((file) => {
    const view: ProcessFile = { folder: file.folder, fileName: file.fileName };

    if (file.id) {
      view.id = file.id;
    }

    if (file.stored) {
      view.stored = true;
    }

    return view;
  });
}
