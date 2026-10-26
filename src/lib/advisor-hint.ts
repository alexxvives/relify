import type { DealStep } from "@/lib/deal-pipeline";

/** Tooltip on the disabled "Asesor" tab of a process, before an advisor is on the deal. */
export const advisorHintLater = "Al llegar a Preguntas podrás incorporar un asesor al proceso.";
export const advisorHintHireInvestor = "Ya estás en Preguntas: contrata un asesor desde Asesoramiento para incorporarlo al proceso.";
export const advisorHintHireSeller = "Ya estás en Preguntas: contrata un asesor desde Servicios para incorporarlo al proceso.";

export function reachedQa(steps: readonly DealStep[]): boolean {
  return steps.some((step) => step.id === "qa" && step.state !== "upcoming");
}
