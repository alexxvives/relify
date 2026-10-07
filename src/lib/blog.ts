export const blogCopy = {
  title: "Diario",
  description: "Notas cortas sobre comprar y vender una pyme sin publicar el nombre de la empresa.",
  kicker: "Releva",
  all: "Todo",
  back: "Volver al diario",
  minutes: "min de lectura",
  newsletterTitle: "Una nota al mes",
  newsletterBody: "Cuando el boletín esté conectado, avisaremos de una nota nueva. Hoy no guardamos el correo.",
  newsletterPlaceholder: "tu@empresa.com",
  newsletterButton: "Apuntarme",
  newsletterInvalid: "Escribe un correo como nombre@empresa.com",
  newsletterOffline: "El boletín todavía no está conectado. No hemos guardado el correo.",
  newsletterPrivacy: "Sin envíos por ahora. El correo no se almacena.",
} as const;

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: number;
  paragraphs: string[];
};

export const blogCategories = ["Confidencialidad", "Cuentas", "Proceso"] as const;

export const blogPosts: BlogPost[] = [
  {
    slug: "que-ve-un-comprador",
    title: "Qué ve un comprador antes del NDA",
    excerpt: "La ficha pública lleva un nombre de proyecto, la comunidad y cuatro cifras. La razón social se queda en el borrador.",
    category: "Confidencialidad",
    date: "2026-09-12",
    readTime: 4,
    paragraphs: [
      "Una pyme en venta no necesita salir con su nombre en un listado. Quien entra sin cuenta ve un nombre de proyecto, la comunidad autónoma y las cifras que el vendedor ha marcado como públicas.",
      "El NDA abre la conversación: preguntas, una reunión y una oferta indicativa. No abre la razón social, el CIF, el domicilio ni los nombres de los ficheros del dataroom.",
      "El vendedor puede mirar esa misma ficha desde su borrador, con el nombre de proyecto, para comprobar qué va a leer el comprador.",
    ],
  },
  {
    slug: "leer-el-ebitda",
    title: "Cómo leer el EBITDA de una pyme",
    excerpt: "El EBITDA sale del resultado de explotación menos la amortización cuando las cuentas traen ambas cifras. El ajustado lo escribe quien vende.",
    category: "Cuentas",
    date: "2026-09-02",
    readTime: 5,
    paragraphs: [
      "En la ficha, facturación y EBITDA se leen juntos. La facturación es la venta del ejercicio. El EBITDA resume lo que queda de la explotación antes de amortizar.",
      "Si el vendedor sube un depósito de cuentas o un XML del modelo 200, Releva rellena las ventas y calcula el EBITDA cuando el fichero trae resultado de explotación y amortización. El fichero no se guarda.",
      "El EBITDA ajustado no se inventa. Lo escribe quien vende, porque recoge partidas que las cuentas oficiales no separan.",
    ],
  },
  {
    slug: "recorrido-de-una-venta",
    title: "El recorrido de una compraventa",
    excerpt: "Interés, aceptación, NDA, preguntas, reunión, oferta, documentación y cierre. Un paso no se da por hecho si el anterior sigue abierto.",
    category: "Proceso",
    date: "2026-08-20",
    readTime: 4,
    paragraphs: [
      "Cada conversación sigue la misma línea: interés, aceptación, NDA, preguntas, reunión, oferta, documentación y cierre. El comprador ve Compra al final. El vendedor ve Venta.",
      "Un paso posterior permanece pendiente mientras uno anterior no está cerrado. Compartir documentos no adelanta la oferta.",
      "El vendedor sigue viendo «Un inversor». El nombre y el correo del comprador no entran en el aviso ni en el hilo.",
    ],
  },
  {
    slug: "nombre-que-no-sale",
    title: "Por qué el nombre de la empresa no sale en la ficha",
    excerpt: "El nombre público es un apodo del proyecto. Sirve para hablar de la empresa sin decir quién es.",
    category: "Confidencialidad",
    date: "2026-08-06",
    readTime: 3,
    paragraphs: [
      "El nombre de proyecto es la etiqueta de la ficha. Puede ser un apodo. No es la razón social y no tiene que coincidir con el rótulo del local.",
      "Eso permite enseñar la empresa a varios compradores y seguir operando con clientes y empleados sin anunciar la venta.",
      "Las fotos de la visita previa se quedan en el navegador del vendedor. El catálogo no las publica.",
    ],
  },
];

export function blogPost(slug: string): BlogPost | null {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}

export function formatBlogDate(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return date;
  }
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const label = months[Number(month) - 1] ?? month;
  return `${Number(day)} ${label} ${year}`;
}
