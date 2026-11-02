import { slicePercentIssue } from "./company-profile";

/**
 * t78: the only client-side reason to stop a seller save. Missing required fields (motivo de venta, descripción…)
 * never block: drafts save partially and the progress list names what is missing. Percent splits that don't add
 * up would be rejected by the server, so they are caught here with a clear message.
 */
export function saveBlockReason(sliceGroups: string[][]): string | null {
  const issue = sliceGroups.map((values) => slicePercentIssue(values)).find((value) => value !== "ok");
  if (issue === "over") {
    return "Los porcentajes de un reparto suman más del 100 %. Corrígelos en «Cómo es tu negocio» para poder guardar.";
  }
  if (issue === "short") {
    return "Los porcentajes de un reparto deben sumar 100 %. Corrígelos en «Cómo es tu negocio» para poder guardar.";
  }
  return null;
}
