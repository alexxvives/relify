/**
 * t84/t85: one colour-blind-safe style per profitability series, shared by the ficha chart, its cards and seller Inicio.
 * t85: lives outside the "use client" chart module: a plain object exported from a client module reaches server
 * components as a client reference, so every colour/marker read as undefined and the curves rendered invisible.
 */
export type ProfitabilityMarker = "circle" | "square" | "diamond" | "triangle";
export type ProfitabilityStyle = { color: string; marker: ProfitabilityMarker; dash?: string };

export const profitabilityStyles: Record<string, ProfitabilityStyle> = {
  ebitdaMargin: { color: "#0f766e", marker: "circle" },
  profitMargin: { color: "#d55e00", dash: "6 4", marker: "square" },
  economicReturn: { color: "#1c2740", dash: "2 3", marker: "diamond" },
  financialReturn: { color: "#56b4e9", dash: "10 3 2 3", marker: "triangle" },
};
