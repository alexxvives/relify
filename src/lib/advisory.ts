import * as z from "zod";

export const advisoryServices = [
  {
    id: "due-diligence",
    title: "Due Diligence",
    body: "Análisis detallado de las diferentes áreas de la empresa para entender el estado en el que se encuentra.",
  },
  {
    id: "valuation",
    title: "Valoración Empresa",
    body: "Evaluación del valor actual de una empresa según su situación financiera, operativa y de mercado.",
  },
  {
    id: "legal",
    title: "Consultoría Legal",
    body: "Asesoramiento legal en operaciones de compraventa en sus distintas modalidades y en todas las fases del proceso.",
  },
  {
    id: "tax",
    title: "Consultoría Fiscal",
    body: "Asesoramiento en impuestos y planificación tributaria para maximizar la eficiencia fiscal.",
  },
  {
    id: "business-plan",
    title: "Business Plan",
    body: "Proyección financiera de la cuenta de resultados teniendo en cuenta la visión estratégica de la propiedad.",
  },
  {
    id: "labor",
    title: "Consultoría Laboral",
    body: "Gestión de RRHH, normativas y mejora de ambientes de trabajo para optimizar el rendimiento empresarial.",
  },
] as const;

export const advisoryServiceIds = [
  "due-diligence",
  "valuation",
  "legal",
  "tax",
  "business-plan",
  "labor",
] as const;

export type AdvisoryServiceId = (typeof advisoryServiceIds)[number];

export const advisoryCopy = {
  title: "Asesoramiento",
  heading: "Servicios de asesoramiento",
  intro: "Selecciona los servicios que más te interesen para solicitar presupuesto.",
  clear: "Borrar selección",
  submit: "Solicitar presupuesto",
  pending: "Enviando…",
  saved: "Hemos registrado tu solicitud de presupuesto.",
  empty: "Selecciona al menos un servicio.",
  failed: "No se ha podido registrar la solicitud.",
  forbidden: "Solo un vendedor o un inversor puede solicitar presupuesto.",
  noticeTitle: "Presupuesto solicitado",
  noticeBody: "Has pedido presupuesto de asesoramiento.",
  adminNoticeTitle: "Solicitud de asesoramiento",
  adminNoticeBody: "Hay una solicitud sin asesor elegido.",
} as const;

const serviceIdSchema = z.enum(advisoryServiceIds);

export const advisoryQuoteSchema = z.object({
  services: z.array(serviceIdSchema).min(1),
  projectSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  advisorId: z.string().trim().min(1).max(80).optional(),
});

export type AdvisoryQuoteInput = z.infer<typeof advisoryQuoteSchema>;

export function uniqueAdvisoryServices(values: string[]): AdvisoryServiceId[] {
  const selected: AdvisoryServiceId[] = [];

  for (const value of values) {
    const known = advisoryServices.find((service) => service.id === value);

    if (known && !selected.includes(known.id)) {
      selected.push(known.id);
    }
  }

  return selected;
}
