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
    "Apúntate a la lista de espera de Relify. Empresas, inversores y asesores entran juntos para que el primer día ya haya con quién hablar.",
  kicker: "Lista de espera",
  heading: "Apúntate para entrar en el marketplace",
  body: "Deja tu correo. Cuando abramos, te escribimos a todos a la vez para publicar, leer el catálogo o traer un mandato.",
  roles: [
    {
      id: "company" as const,
      label: "Empresa",
      line: "Quiero vender o explorar la venta",
      note: "Ficha anónima. La sociedad no se publica.",
    },
    {
      id: "investor" as const,
      label: "Inversor",
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
  seatsTitle: "Así se llena la sala",
  seatsBody: "Cada cara es un sitio. Cuantos más entran de los tres lados, más fácil es el primer encuentro.",
  formTitle: "Reserva tu sitio",
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
