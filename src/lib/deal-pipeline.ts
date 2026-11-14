import { dataRoomReadGate } from "./data-room";

export const dealStepIds = ["solicitud", "conexion", "nda", "qa", "loi", "diligence", "documents", "close"] as const;

export type DealStepId = (typeof dealStepIds)[number];

export type DealStepState = "done" | "current" | "upcoming";

export type DealStep = {
  id: DealStepId;
  label: string;
  detail: string;
  state: DealStepState;
  pendingLoi?: boolean;
};

export type DealFlags = {
  accepted: boolean;
  nda: boolean;
  qa: boolean;
  loi: boolean;
  diligence: boolean;
  documents: boolean;
  closed: boolean;
  loiPending?: boolean;
};

export function processFlags(input: {
  accepted: boolean;
  nda: boolean;
  questions: boolean;
  meeting: boolean;
  offer: boolean;
  loiAccepted: boolean;
  roomShared: boolean;
  passedDiligence: boolean;
  closed: boolean;
}): DealFlags {
  const loi = input.offer && input.loiAccepted;

  return {
    accepted: input.accepted,
    nda: input.nda,
    qa: loi,
    loi,
    diligence: input.roomShared || input.passedDiligence,
    documents: input.closed,
    closed: input.closed,
    loiPending: input.offer && !input.loiAccepted,
  };
}

/** Contract accepted (signatures pending): "Contrato" is done and "Venta" becomes the current step. */
export function withContractAccepted(steps: DealStep[], accepted: boolean): DealStep[] {
  if (!accepted) return steps;
  const documents = steps.find((step) => step.id === "documents");
  if (!documents || documents.state !== "current") return steps;
  return steps.map((step) =>
    step.id === "documents" ? { ...step, state: "done" } : step.id === "close" && step.state === "upcoming" ? { ...step, state: "current" } : step,
  );
}

export type ProcessFile = {
  folder: string;
  fileName: string;
  visible?: boolean;
  id?: string;
  stored?: boolean;
};

const stepCopy: Record<DealStepId, { label: string; investor: string; seller: string }> = {
  solicitud: {
    label: "Solicitud",
    investor: "Tú envías la conexión. La empresa decide si la acepta.",
    seller: "El comprador envía la conexión. Tú decides si la aceptas.",
  },
  conexion: {
    label: "Conexión",
    investor: "Esperas a que el vendedor acepte. Hasta entonces no firmas el acuerdo.",
    seller: "Aceptas al comprador si encaja. Después le toca firmar el acuerdo de confidencialidad.",
  },
  nda: {
    label: "NDA",
    investor: "Firmas el acuerdo de confidencialidad. Sin esa firma no se abre el detalle ni el chat.",
    seller: "El comprador debe firmar el acuerdo de confidencialidad para seguir. Tú no firmas este paso.",
  },
  qa: {
    label: "Preguntas",
    investor: "Esta es la etapa para preguntar lo que necesites o reunirte con el vendedor.",
    seller:
      "El comprador preguntará y podrá reunirse contigo hasta estar convencido. En ese momento firmará la carta de intenciones.",
  },
  loi: {
    label: "LOI",
    investor: "Firmas la carta de intenciones. No obliga a cerrar la compra.",
    seller: "El comprador firma la carta de intenciones y te llega como oferta indicativa.",
  },
  diligence: {
    label: "Revisión",
    investor: "Puedes pedir un asesor de Relify o seguir a la documentación. El contrato lo sube el vendedor.",
    seller: "El comprador revisa con un asesor o sigue adelante. El contrato de compraventa lo subes tú.",
  },
  documents: {
    label: "Contrato",
    investor: "El vendedor sube el contrato de compraventa. Relify no lo redacta.",
    seller: "Subes el contrato de compraventa. Relify no lo redacta.",
  },
  close: {
    label: "Venta",
    investor: "El pago queda hecho y la compra se cierra.",
    seller: "El pago queda hecho y la venta se cierra.",
  },
};

export type DealViewer = "investor" | "seller" | "advisor";

const advisorWatch: Record<DealStepId, string> = {
  solicitud: "El comprador envía la conexión.",
  conexion: "El vendedor todavía no ha aceptado.",
  nda: "El comprador todavía no ha firmado el acuerdo de confidencialidad.",
  qa: "Preguntas y reuniones, hasta la carta de intenciones.",
  loi: "Falta la carta de intenciones.",
  diligence: "Revisión (due diligence) en curso.",
  documents: "Falta el contrato de compraventa.",
  close: "La compraventa está cerrada.",
};

export function dealPipeline(role: DealViewer, flags: DealFlags): DealStep[] {
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
    const detail = role === "advisor" ? advisorWatch[id] : copy[role];

    const pendingLoi = id === "qa" && flags.loiPending === true;

    if (!currentAssigned && doneById[id]) {
      return { id, label: copy.label, detail, state: "done", pendingLoi };
    }

    if (!currentAssigned) {
      currentAssigned = true;
      return { id, label: copy.label, detail, state: "current", pendingLoi };
    }

    return { id, label: copy.label, detail, state: "upcoming" };
  });
}

export function pipelineStatus(steps: readonly DealStep[]): string {
  return steps.find((step) => step.state === "current")?.label ?? steps[steps.length - 1]?.label ?? "";
}

/** Public landing specimen: one step is current, earlier steps are done. */
export function landingDealSteps(currentIndex: number): DealStep[] {
  const clamped = Math.min(dealStepIds.length - 1, Math.max(0, currentIndex));
  return dealStepIds.map((id, index) => {
    const copy = stepCopy[id];
    return {
      id,
      label: copy.label,
      detail: copy.investor,
      state: index < clamped ? "done" : index === clamped ? "current" : "upcoming",
    };
  });
}

export type StepCue = {
  yours: boolean;
  action: string;
};

export function stepCue(id: DealStepId, role: DealViewer, pendingLoi = false): StepCue {
  if (role === "advisor") {
    return { yours: false, action: advisorWatch[id] };
  }

  if (id === "qa" && pendingLoi) {
    return role === "seller"
      ? { yours: true, action: "Acepta la carta de intenciones" }
      : { yours: false, action: "El vendedor todavía no ha aceptado la carta de intenciones" };
  }

  if (id === "solicitud") {
    return role === "investor"
      ? { yours: true, action: "Envía la solicitud de conexión" }
      : { yours: false, action: "El comprador todavía no ha enviado la solicitud" };
  }

  if (id === "conexion") {
    return role === "seller"
      ? { yours: true, action: "Acepta la solicitud de conexión" }
      : { yours: false, action: "El vendedor todavía no ha aceptado la solicitud" };
  }

  if (id === "nda") {
    return role === "investor"
      ? { yours: true, action: "Firma el acuerdo de confidencialidad" }
      : { yours: false, action: "El comprador debe firmar el NDA para proceder." };
  }

  if (id === "qa") {
    return { yours: false, action: stepCopy.qa[role] };
  }

  if (id === "loi") {
    return role === "investor"
      ? { yours: true, action: "Firma la carta de intenciones" }
      : { yours: false, action: "El comprador todavía no ha firmado la carta de intenciones" };
  }

  if (id === "diligence") {
    return { yours: false, action: "Revisa con un asesor de Relify, o sigue a la documentación." };
  }

  if (id === "documents") {
    return { yours: false, action: "Falta firmar el contrato" };
  }

  return { yours: false, action: "Falta completar el pago" };
}

export function watchingCue(steps: readonly DealStep[]): string {
  if (steps.length === 0) {
    return stepCue("conexion", "investor").action;
  }

  const current = steps.find((step) => step.state === "current");

  if (!current) {
    return "La compraventa está hecha.";
  }

  return stepCue(current.id, "advisor", current.pendingLoi === true).action;
}

// Short titles for Acciones pendientes cards (the long cue stays in the process timeline).
const shortPendingTitle: Partial<Record<DealStepId, string>> = {
  solicitud: "Solicitud de conexión",
  conexion: "Solicitud de conexión",
  nda: "Acuerdo de confidencialidad",
  loi: "Carta de intenciones",
  qa: "Carta de intenciones",
};

export type HomePendingAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export function homePendingActions(
  role: "investor" | "seller",
  items: readonly { id: string; who: string; href: string; steps: readonly DealStep[] }[],
): HomePendingAction[] {
  const actions: HomePendingAction[] = [];

  for (const item of items) {
    const current = item.steps.find((step) => step.state === "current");

    if (!current || current.id === "diligence") {
      continue;
    }

    const cue = stepCue(current.id, role, current.pendingLoi === true);

    if (!cue.yours) {
      continue;
    }

    actions.push({ id: item.id, title: shortPendingTitle[current.id] ?? cue.action, detail: item.who, href: item.href });
  }

  return actions;
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
