import * as z from "zod";
import { isValidSpanishCif, normalizeCif } from "./spanish-cif";

export const valuationRequestStatuses = [
  "received",
  "sabi_loaded",
  "drafted",
  "sent",
  "discarded",
] as const;

export type ValuationRequestStatus = (typeof valuationRequestStatuses)[number];

export function isValuationRequestStatus(value: string): value is ValuationRequestStatus {
  return (valuationRequestStatuses as readonly string[]).includes(value);
}

const phonePattern = /^[+]?[\d\s()./-]{7,32}$/;

export const valuationRequestSchema = z.object({
  cif: z
    .string()
    .trim()
    .max(12)
    .refine((value) => isValidSpanishCif(value), { message: "cif" })
    .transform((value) => normalizeCif(value)),
  contactName: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((value) => value.length === 0 || phonePattern.test(value), { message: "phone" })
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
});

export type ValuationRequestInput = z.infer<typeof valuationRequestSchema>;

export const valuationCopy = {
  title: "Valoración de empresas y pymes en España | Relify",
  description:
    "Solicita una valoración de tu empresa con el CIF. Relify te envía una horquilla de valor con explicación y gráficas. Sin cargo y sin publicar la sociedad.",
  kicker: "Valoración de pymes",
  heading: "Cuánto vale tu pyme, con las cuentas a la vista",
  body: "Deja el CIF y un contacto. Preparamos la valoración a partir de las cuentas depositadas y te la enviamos con explicación y gráficas. No hay cargo y la sociedad no se publica.",
  bodyShort: "Deja el CIF y un contacto. Te enviamos la valoración con explicación y gráficas, sin publicar la sociedad.",
  ogTitle: "Valoración de empresas para pymes | Relify",
  formTitle: "Solicita tu valoración",
  cif: "CIF de la sociedad",
  cifPlaceholder: "B12345674",
  name: "Nombre",
  email: "Correo",
  phone: "Teléfono",
  phoneHint: "Opcional",
  linkAccount: "Tengo cuenta en Relify: vincula esta solicitud a mi perfil",
  submit: "Solicitar valoración",
  pending: "Enviando…",
  doneTitle: "Solicitud recibida",
  doneBody: "Hemos recibido tu solicitud; te enviaremos la valoración con explicación y gráficas.",
  privacy: "Guardamos el CIF y el contacto para prepararte el informe. No hay cargo ni se publica la sociedad.",
  invalid: "Revisa el CIF, el nombre y el correo.",
  invalidCif: "El número final del CIF no es correcto. Verifica el CIF.",
  failed: "No hemos podido guardar la solicitud. Inténtalo de nuevo.",
  throttled: "Has hecho demasiadas solicitudes. Espera unos minutos y vuelve a intentarlo.",
  asideTitle: "Qué te enviaremos",
  aside: [
    {
      title: "Una primera horquilla de valor",
      body: "Con múltiplos de tu sector y las cifras públicas de la sociedad.",
    },
    {
      title: "Explicación y gráficas",
      body: "El informe llega por correo, con el razonamiento y las figuras, no un número suelto.",
    },
    {
      title: "Sin cargo",
      body: "Pedir la valoración no abre un pago ni publica la empresa.",
    },
  ],
  faqTitle: "Preguntas frecuentes sobre valorar una empresa",
  faq: [
    {
      q: "¿Cuánto vale mi empresa?",
      a: "El valor de una pyme se estima con las cuentas, el sector y comparables. En Relify partimos del CIF, leemos las cifras públicas y te enviamos una horquilla razonada, no un número suelto.",
    },
    {
      q: "¿Qué múltiplo de EBITDA se usa para una pyme en España?",
      a: "El múltiplo depende del sector, el tamaño y la recurrencia. Una valoración seria enseña el rango y por qué cae ahí tu empresa, no un múltiplo genérico copiado de otra operación.",
    },
    {
      q: "¿Necesito el CIF para pedir una valoración?",
      a: "Sí. El CIF identifica las cuentas depositadas. Sin él no podemos preparar el informe. El número queda en la solicitud; no se publica en el mercado.",
    },
    {
      q: "¿La valoración publica el nombre de mi sociedad?",
      a: "No. Pedir la valoración no abre una ficha ni enseña la razón social. Si más adelante publicas en Relify, la ficha usa un nombre de proyecto.",
    },
    {
      q: "¿Cuánto tarda y hay algún cargo?",
      a: "Te confirmamos al momento que hemos recibido la solicitud. El informe llega después, con explicación y gráficas. Solicitarlo no abre un pago.",
    },
    {
      q: "¿Qué diferencia hay entre EBITDA y EBITDA ajustado?",
      a: "El EBITDA sale de las cuentas. El ajustado corrige partidas no recurrentes o el sueldo del propietario fuera de mercado, cuando esas correcciones están aceptadas.",
    },
    {
      q: "¿Puedo vender solo una parte de la sociedad?",
      a: "Sí. La valoración sirve igual si buscas vender el 100 % o una participación. En Relify lo indicas al publicar la ficha.",
    },
    {
      q: "¿Esta valoración sirve para un comprador?",
      a: "Es una primera horquilla para el vendedor. Un comprador, tras el NDA, verá el cuaderno de venta y las cifras de la ficha; no este informe interno.",
    },
  ],
  adminTitle: "Valoraciones",
  adminNoteEmpty: "Todavía no hay solicitudes.",
  adminEmptyTitle: "Ninguna solicitud de valoración",
  adminEmptyText: "Cada CIF que entre por /valorar aparecerá aquí con el contacto, el estado y un espacio para notas.",
  adminSearch: "CIF, nombre o correo",
  adminSave: "Guardar",
  adminSaving: "Guardando…",
  adminSaved: "Solicitud actualizada.",
  adminNotes: "Notas",
  adminPhone: "Teléfono",
  adminAccount: "Cuenta",
  adminCif: "CIF",
  adminContact: "Contacto",
  adminStatus: "Estado",
  adminWhen: "Fecha",
  statusAll: "Todos los estados",
  status: {
    received: "Recibida",
    sabi_loaded: "SABI cargado",
    drafted: "Borrador",
    sent: "Enviada",
    discarded: "Descartada",
  } satisfies Record<ValuationRequestStatus, string>,
} as const;
