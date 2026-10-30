/** Spanish messages for every way a SABI import can fail (shared by the browser parse and the server). */
export type SabiImportFailure = "forbidden" | "not_found" | "empty" | "too_large" | "not_xlsx" | "no_financials";

export const sabiFailureMessages: Record<SabiImportFailure, string> = {
  forbidden: "Solo un administrador puede importar SABI.",
  not_found: "No encontramos esta empresa.",
  empty: "Elige el Excel exportado de SABI.",
  too_large: "El archivo supera 10 MB.",
  not_xlsx: "El archivo no es un Excel (.xlsx) válido.",
  no_financials: "No encontramos la tabla de cuentas de SABI en este Excel.",
};

export const sabiMaxBytes = 10 * 1024 * 1024;
