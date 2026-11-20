/** S37: an advisor's "Documentación adicional" file, as Mis servicios lists it. */
export type AdvisorDocumentView = { id: string; fileName: string; href: string };

export function advisorDocumentHref(id: string): string {
  return `/mis-servicios/documento/${id}`;
}
