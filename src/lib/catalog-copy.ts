export const catalogCopy = {
  navProjects: "Proyectos",
  indexTitle: "Proyectos en venta",
  indexDescription:
    "Proyectos anonimizados de compraventa de pymes. Cada ficha pública muestra la región, la facturación, el EBITDA y el precio en euros.",
  indexIntro:
    "La ficha pública no incluye la razón social, el CIF, la dirección ni a los socios.",
  empty: "No hay proyectos publicados.",
  detailKicker: "Empresa en venta",
  detailLockedHeading: "Cifras confidenciales",
  detailLockedNote: "Estas cifras no son públicas.",
  lockedLabel: "Bloqueado",
  connect: "Conectar",
  saveCompany: "Guardar",
  signInToAct: "Entra para conectar o guardar esta empresa.",
  investorBack: "Volver a empresas",
  investorLockedHeading: "Cifras aún cerradas",
  investorLockedNote: "Estas cifras no están disponibles hasta un paso de acceso posterior.",
  investorUnavailable: "No disponible",
  missingTitle: "Proyecto no encontrado",
  metrics: [
    { key: "revenueCents", label: "Facturación" },
    { key: "ebitdaCents", label: "EBITDA" },
    { key: "adjustedEbitdaCents", label: "EBITDA ajustado" },
    { key: "askingPriceCents", label: "Precio" },
  ],
  lockedFinancials: [
    { key: "netDebt", label: "Deuda neta" },
    { key: "workingCapital", label: "Capital circulante" },
    { key: "netIncome", label: "Resultado neto" },
  ],
} as const;
