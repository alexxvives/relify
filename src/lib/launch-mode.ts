/**
 * S43 (Alex t183u/t184u): free launch. While `LAUNCH_FREE_MODE=true` is set on the Worker, nobody pays:
 * every buyer has the unlimited entitlement, advisors are listed and work without the subscription, the advisor
 * deposit is waived and no Stripe call happens. Server-only (never a NEXT_PUBLIC_ variable); default off, so prod
 * keeps charging until Alex turns it on.
 */
export function launchFreeMode(): boolean {
  // Bracket access so the Worker runtime var is not inlined as `undefined` at build time (same as INT_ENVIRONMENT).
  return process.env["LAUNCH_FREE_MODE"]?.trim() === "true";
}

export const launchFreeCopy = {
  badge: "Gratis durante el lanzamiento",
  checkoutOff: "Gratis durante el lanzamiento: no hace falta pagar nada.",
  planNote: "Durante el lanzamiento tienes el plan Empresa sin coste: conexiones ilimitadas.",
  listingNote: "Tu ficha está completa. Durante el lanzamiento publicar otra empresa es gratis.",
  publish: "Publicar gratis",
  addCompanyBody: "Durante el lanzamiento añadir empresas es gratis.",
  depositTitle: "Aceptar encargo",
  depositBody: "Durante el lanzamiento no hay depósito. Al aceptar se abre el encargo y puedes firmar el NDA.",
  depositAccept: "Aceptar encargo",
  depositAccepting: "Aceptando…",
  depositTurn: "Acepta el encargo para empezar.",
  depositPendingChip: "Por aceptar",
  depositProgress: "Acepta el encargo para ver el progreso.",
  depositAccepted: "Encargo aceptado. Durante el lanzamiento no hay depósito.",
} as const;
