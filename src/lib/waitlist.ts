import * as z from "zod";

export const waitlistOpensAt = "2026-11-21T10:00:00+01:00";

export const waitlistRoles = ["company", "investor", "advisor"] as const;

export const waitlistSchema = z.object({
  role: z.enum(waitlistRoles),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  city: z.string().trim().max(80),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const waitlistCopy = {
  title: "Apúntate para entrar en el marketplace",
  description:
    "Apúntate a la lista de espera de Relify. Te avisamos cuando abramos el marketplace a empresas, compradores y asesores.",
  kicker: "Lista de espera",
  heading: "Apúntate para entrar en el marketplace",
  body: "Deja tu correo y te avisamos en cuanto abramos. La primera ficha de empresa es gratuita. El catálogo se mira sin pagar. La ficha de asesor en el directorio también es gratis.",
  bodyShort: "Deja tu correo y te avisamos en cuanto abramos.",
  roles: [
    {
      id: "company" as const,
      label: "Empresa",
      line: "Quiero vender o explorar la venta",
      note: "Ficha anónima. La sociedad no se publica.",
    },
    {
      id: "investor" as const,
      label: "Comprador",
      line: "Busco una pyme para continuar",
      note: "Cifras a la vista antes del detalle.",
    },
    {
      id: "advisor" as const,
      label: "Asesor",
      line: "Traigo mandatos de clientes",
      note: "El mismo anonimato para la operación.",
    },
  ],
  seatsTitle: "Tres perfiles, un marketplace",
  seatsBody: "Empresa, comprador y asesor. Elige el tuyo y te avisamos al abrir.",
  formTitle: "Deja tus datos",
  name: "Nombre",
  email: "Correo",
  city: "Ciudad",
  cityHint: "Opcional",
  submit: "Apuntarme",
  pending: "Guardando…",
  doneTitle: "Estás dentro",
  doneBody: "Cuando abramos, te llega un correo a esta dirección. No hay cargo ni compromiso.",
  again: "Apuntar a otra persona",
  invalid: "Revisa el nombre, el correo y el perfil.",
  taken: "Ese correo ya está en la lista con ese perfil.",
  failed: "No hemos podido guardar la inscripción. Inténtalo de nuevo.",
};
