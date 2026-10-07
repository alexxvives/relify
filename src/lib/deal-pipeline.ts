import { dataRoomReadGate } from "./data-room";

export const dealStepIds = ["interest", "accepted", "nda", "questions", "meeting", "offer", "documents", "close"] as const;

export type DealStepId = (typeof dealStepIds)[number];

export type DealStepState = "done" | "current" | "upcoming";

export type DealStep = {
  id: DealStepId;
  label: string;
  state: DealStepState;
};

export type DealFlags = {
  accepted: boolean;
  nda: boolean;
  questions: boolean;
  meeting: boolean;
  offer: boolean;
  documents: boolean;
  closed: boolean;
};

export type ProcessFile = {
  folder: string;
  fileName: string;
  visible?: boolean;
};

const stepLabel: Record<Exclude<DealStepId, "close">, string> = {
  interest: "Interés",
  accepted: "Aceptación",
  nda: "NDA",
  questions: "Preguntas",
  meeting: "Reunión",
  offer: "Oferta",
  documents: "Documentación",
};

export function dealPipeline(role: "investor" | "seller", flags: DealFlags): DealStep[] {
  const doneById: Record<DealStepId, boolean> = {
    interest: true,
    accepted: flags.accepted,
    nda: flags.nda,
    questions: flags.questions,
    meeting: flags.meeting,
    offer: flags.offer,
    documents: flags.documents,
    close: flags.closed,
  };
  let currentAssigned = false;

  return dealStepIds.map((id) => {
    const label = id === "close" ? (role === "seller" ? "Venta" : "Compra") : stepLabel[id];

    if (!currentAssigned && doneById[id]) {
      return { id, label, state: "done" };
    }

    if (!currentAssigned) {
      currentAssigned = true;
      return { id, label, state: "current" };
    }

    return { id, label, state: "upcoming" };
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

  return input.files.map((file) => ({ folder: file.folder, fileName: file.fileName }));
}
