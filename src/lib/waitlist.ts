import * as z from "zod";

export const waitlistRoles = ["company", "investor", "advisor"] as const;

export const waitlistSchema = z.object({
  role: z.enum(waitlistRoles),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  city: z.string().trim().max(80),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const waitlistCopy = {
  title: "Entra antes de que abra el mercado",
  description:
    "Apúntate a la lista de espera de Releva. Empresas, inversores y asesores entran juntos para que el primer día ya haya con quién hablar.",
  kicker: "Lista de espera",
  heading: "El mercado arranca cuando ya hay gente dentro",
  body: "Una compraventa vacía no sirve. Deja tu sitio y te avisamos cuando toque entrar: empresas que quieren vender, inversores que buscan, y asesores con mandato.",
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
  doneBody: "Te avisaremos cuando abramos el acceso. No hay cargo ni compromiso.",
  again: "Apuntar a otra persona",
  invalid: "Revisa el nombre, el correo y el perfil.",
  taken: "Ese correo ya está en la lista con ese perfil.",
  failed: "No hemos podido guardar la inscripción. Inténtalo de nuevo.",
};
