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
    seller: "El comprador debe firmar el NDA para seguir. Tú no firmas este paso.",
  },
  qa: {
    label: "Q&A",
    investor: "Esta es la etapa para preguntar lo que necesites o reunirte con el vendedor.",
    seller:
      "El inversor preguntará y podrá reunirse contigo hasta estar convencido. En ese momento firmará la carta de intenciones (LOI).",
  },
  loi: {
    label: "LOI",
    investor: "Firmas la carta de intenciones. No obliga a cerrar la compra.",
    seller: "El comprador firma la carta de intenciones y te llega como oferta indicativa.",
  },
  diligence: {
    label: "Due diligence",
    investor: "Puedes pedir un asesor de Releva o seguir a la documentación. El contrato lo sube el vendedor.",
    seller: "El comprador revisa con un asesor o sigue adelante. El contrato de compraventa lo subes tú.",
  },
  documents: {
    label: "Documentación",
    investor: "El vendedor sube el contrato de compraventa. Releva no lo redacta.",
    seller: "Subes el contrato de compraventa. Releva no lo redacta.",
  },
  close: {
    label: "Compraventa",
    investor: "El pago queda hecho y la compra se cierra.",
    seller: "El pago queda hecho y la venta se cierra.",
  },
};

export type DealViewer = "investor" | "seller" | "advisor";

const advisorWatch: Record<DealStepId, string> = {
  solicitud: "El comprador envía la conexión.",
  conexion: "El vendedor todavía no ha aceptado.",
  nda: "El comprador todavía no ha firmado el NDA.",
  qa: "Preguntas y reuniones, hasta la carta de intenciones.",
  loi: "Falta la carta de intenciones.",
  diligence: "Due diligence en curso.",
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
      : { yours: false, action: "El inversor todavía no ha enviado la solicitud" };
  }

  if (id === "conexion") {
    return role === "seller"
      ? { yours: true, action: "Acepta la solicitud de conexión" }
      : { yours: false, action: "El vendedor todavía no ha aceptado la solicitud" };
  }

  if (id === "nda") {
    return role === "investor"
      ? { yours: true, action: "Firma el acuerdo de confidencialidad" }
      : { yours: false, action: "El inversor debe firmar el NDA para proceder." };
  }

  if (id === "qa") {
    return { yours: false, action: stepCopy.qa[role] };
  }

  if (id === "loi") {
    return role === "investor"
      ? { yours: true, action: "Firma la carta de intenciones" }
      : { yours: false, action: "El inversor todavía no ha firmado la carta de intenciones" };
  }

  if (id === "diligence") {
    return { yours: false, action: "Revisa con un asesor de Releva, o sigue a la documentación." };
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

    actions.push({ id: item.id, title: cue.action, detail: item.who, href: item.href });
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
