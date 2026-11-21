/**
 * S43 (Alex t184u): one tab per counterparty instead of Chat / Documentos + Reuniones. Each counterparty tab holds the
 * chat and the documents with that party, and the meetings below them. Información de la empresa stays first.
 * - Buyer: Vendedor, plus Asesor when the buyer hired one for this company.
 * - Seller: Compradores (buyer filter in the tab row), plus Asesor when hired.
 * - Advisor: Comprador and Vendedor. The client's tab is the private thread; the other party's is the shared process chat.
 */
export type ProcessTabId = "company" | "questions" | "meetings" | "seller" | "buyers" | "buyer" | "advisor";

export type ProcessRole = "investor" | "seller" | "advisor";

export const legacyProcessTabs: readonly ProcessTabId[] = ["company", "questions", "meetings"];

export function counterpartyTabIds(role: ProcessRole, options: { advisor?: boolean } = {}): ProcessTabId[] {
  if (role === "advisor") {
    return ["company", "buyer", "seller"];
  }

  const counterpart: ProcessTabId = role === "investor" ? "seller" : "buyers";
  return options.advisor ? ["company", counterpart, "advisor"] : ["company", counterpart];
}

/**
 * Reads ?pestana. Old links (questions / meetings, from notices and bookmarks) open the first counterparty tab; an
 * unknown or unavailable tab falls back to the company.
 */
export function readProcessTab(value: string | string[] | undefined, ids: readonly ProcessTabId[]): ProcessTabId {
  const raw = Array.isArray(value) ? value[0] : value;
  const wanted = raw === "asesor" ? "advisor" : raw;
  const known = ids.find((id) => id === wanted);

  if (known) {
    return known;
  }

  if ((wanted === "questions" || wanted === "meetings") && ids[1]) {
    return ids[1];
  }

  return "company";
}

/** Which advisor tab is the private 1:1 thread with the client (the other one is the shared process chat). */
export function advisorPrivateTab(hiredBy: "investor" | "seller"): "buyer" | "seller" {
  return hiredBy === "investor" ? "buyer" : "seller";
}
