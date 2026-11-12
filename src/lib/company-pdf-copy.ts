export const companyPdfCopy = {
  teaserTitle: "Perfil ciego",
  dossierTitle: "Cuaderno de venta",
  teaserFile: "relify-perfil-ciego",
  dossierFile: "relify-cuaderno-de-venta",
  brand: "Relify",
  site: "itsrelify.com",
  confidential: "Confidencial",
  teaserNote:
    "Este documento muestra solo lo que ya es público en Relify: nombre de proyecto y cifras de cabecera. La sociedad no figura.",
  dossierNote:
    "Cuaderno de venta para una conexión con NDA aceptado. La razón social sigue fuera. Cada página lleva una marca de agua del comprador.",
  sellerTitle: "Perfil ciego (teaser)",
  sellerBody: "Misma portada que verá un comprador antes del NDA: nombre de proyecto y cifras, sin la sociedad.",
  teaserDownload: "Descargar teaser",
  copyShare: "Copiar enlace",
  copiedShare: "Enlace copiado",
  copyFailed: "No se ha podido copiar. Cópialo a mano.",
  regenerateShare: "Regenerar enlace",
  regeneratingShare: "Regenerando…",
  regeneratedShare: "Enlace nuevo. El anterior ya no abre.",
  shareLabel: "Enlace público",
  shareHint: "Comparte el perfil ciego con un enlace. Solo abre el PDF si la ficha está publicada.",
  shareHintUnpublished: "Publica la ficha para que el enlace abra el PDF. Puedes copiarlo ya y enviarlo después.",
  downloadsLabel: "Descargas del PDF",
  previewLabel: "Vista previa · página 1",
  dossierInfoTitle: "Después del NDA (dossier)",
  dossierInfoBody:
    "El comprador que firma el NDA recibe un cuaderno de venta con marca de agua suya. Tú no descargas esa copia: es el documento del comprador, no el tuyo.",
  dossierDownload: "Descargar cuaderno de venta",
  generated: "Generado el",
  thesisTitle: "Tesis de inversión",
  highlightsTitle: "Puntos clave",
  dealTitle: "Estructura de la operación",
  motivoTitle: "Motivo de venta",
  priceTitle: "Rango orientativo de precio",
  priceCaption: "Múltiplo sectorial × EBITDA ajustado, con ajuste por crecimiento y plantilla.",
  teaserCtaTitle: "Próximos pasos · Firma el NDA en Relify",
  teaserCtaBody: "Solicita acceso y firma el NDA en Relify para abrir el cuaderno de venta, con ratios SABI y el puente de EBITDA.",
  dossierCtaTitle: "Siguiente paso en Relify",
  dossierCtaBody: "Revisa el data room, plantea preguntas y avanza la oferta indicativa en Relify.",
} as const;

export type SellerTeaserDesk = {
  published: boolean;
  shareUrl: string;
  downloads: number;
};
