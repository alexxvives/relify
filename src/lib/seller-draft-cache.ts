/**
 * Paths to revalidate after a seller draft autosave.
 *
 * Do not include `/mi-empresa/detalles`. On vinext, revalidatePath of the page
 * that is already open is treated as a hard navigation to the same URL; the
 * runtime then blocks the repeat (`Prevented repeated hard navigation`) and the
 * save action surfaces as "Error al guardar".
 */
export const sellerDraftAutosaveRevalidatePaths = ["/mi-empresa"] as const;
