/*
 * Sale contract (compraventa) stage: pure state + copy, shared by the server
 * loaders, the actions and the UI. Status lives on each uploaded version:
 *   review     -> waiting for the buyer to accept or ask for changes
 *   changes    -> the buyer asked for changes; the seller uploads a new version
 *   accepted   -> both parties have to sign
 *   signed     -> both signed: the deal is closed
 *   superseded -> an older version replaced by a newer upload
 */

export type ContractStatus = "review" | "changes" | "accepted" | "signed" | "superseded";
export type ContractParty = "buyer" | "seller" | "advisor";
export type ContractStage = "upload" | "review" | "changes" | "signing" | "signed";

export const CONTRACT_MAX_BYTES = 7 * 1024 * 1024; // server actions accept 8 MB bodies

export type ContractVersionView = {
  id: string;
  version: number;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: ContractStatus;
  comment: string | null;
  href: string;
};

export type ContractView = {
  accessId: string;
  party: ContractParty;
  stage: ContractStage;
  current: (ContractVersionView & { price: string; buyerSignedAt: string | null; sellerSignedAt: string | null }) | null;
  versions: ContractVersionView[];
  signedHref: string | null;
  next: { who: "you" | "other" | "none"; text: string };
  can: { upload: boolean; review: boolean; sign: boolean };
};

export function asContractStatus(value: string): ContractStatus {
  return value === "changes" || value === "accepted" || value === "signed" || value === "superseded" ? value : "review";
}

export function contractStage(current: { status: ContractStatus } | null): ContractStage {
  if (!current) return "upload";
  if (current.status === "signed") return "signed";
  if (current.status === "accepted") return "signing";
  if (current.status === "changes") return "changes";
  return "review";
}

export const contractStatusLabel: Record<ContractStatus, string> = {
  review: "En revisión por el comprador",
  changes: "Cambios pedidos",
  accepted: "Aceptado · pendiente de firmas",
  signed: "Firmado por ambas partes",
  superseded: "Sustituido por una versión nueva",
};

/** Who has to act next, written for the viewer. */
export function contractNext(input: {
  party: ContractParty;
  stage: ContractStage;
  buyerSigned: boolean;
  sellerSigned: boolean;
}): ContractView["next"] {
  const { party, stage } = input;
  const sellerSide = party !== "buyer";

  if (stage === "signed") {
    return { who: "none", text: "Contrato firmado por las dos partes. La compraventa está cerrada." };
  }

  if (stage === "upload") {
    return sellerSide
      ? { who: "you", text: "Sube el contrato de compraventa en PDF para que el comprador lo revise." }
      : { who: "other", text: "El vendedor está preparando el contrato de compraventa. Te avisaremos cuando lo suba." };
  }

  if (stage === "changes") {
    return sellerSide
      ? { who: "you", text: "El comprador ha pedido cambios. Sube una versión nueva del contrato." }
      : { who: "other", text: "Has pedido cambios. Esperando a que el vendedor suba una versión nueva." };
  }

  if (stage === "review") {
    return sellerSide
      ? { who: "other", text: "El comprador está revisando el contrato." }
      : { who: "you", text: "Revisa el contrato: acéptalo o pide cambios." };
  }

  if (party === "advisor") {
    return { who: "other", text: input.sellerSigned ? "Falta la firma del comprador." : "Falta la firma del vendedor." };
  }

  const mine = party === "buyer" ? input.buyerSigned : input.sellerSigned;
  const theirs = party === "buyer" ? input.sellerSigned : input.buyerSigned;

  if (!mine) {
    return { who: "you", text: "Contrato aceptado. Fírmalo para cerrar la compraventa." };
  }

  return theirs
    ? { who: "none", text: "Contrato firmado por las dos partes." }
    : { who: "other", text: party === "buyer" ? "Ya has firmado. Falta la firma del vendedor." : "Ya has firmado. Falta la firma del comprador." };
}

export function contractCan(input: {
  party: ContractParty;
  stage: ContractStage;
  buyerSigned: boolean;
  sellerSigned: boolean;
}): ContractView["can"] {
  const { party, stage } = input;
  return {
    upload: party !== "buyer" && (stage === "upload" || stage === "changes" || stage === "review"),
    review: party === "buyer" && stage === "review",
    sign: stage === "signing" && ((party === "buyer" && !input.buyerSigned) || (party === "seller" && !input.sellerSigned)),
  };
}

export const contractCommentMax = 2000;

export function contractChangesMessage(version: number, comment: string): string {
  return `He pedido cambios en el contrato de compraventa (versión ${version}): ${comment}`;
}

export function isPdfBytes(bytes: Uint8Array): boolean {
  return bytes.byteLength > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
