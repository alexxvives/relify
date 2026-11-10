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
  title: "Valora tu empresa",
  description:
    "Solicita una primera valoración de tu pyme. Te enviaremos el informe con explicación y gráficas. No hay cargo.",
  kicker: "Valoración",
  heading: "Valora tu empresa",
  body: "Deja el CIF y un contacto. Preparamos la valoración a partir de las cuentas y te la enviamos con explicación y gráficas.",
  bodyShort: "Deja el CIF y un contacto. Te enviamos la valoración con explicación y gráficas.",
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
