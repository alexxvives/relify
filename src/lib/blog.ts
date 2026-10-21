export const blogCopy = {
  title: "Diario",
  description:
    "Guías para comprar y vender una pyme en España: qué se ve antes del NDA, cómo leer el EBITDA y cómo avanza la compraventa sin publicar el nombre.",
  kicker: "Releva",
  all: "Todo",
  back: "Volver al diario",
  minutes: "min de lectura",
  related: "Sigue en Releva",
  newsletterTitle: "Una nota al mes",
  newsletterBody: "Cuando el boletín esté conectado, avisaremos de una nota nueva. Hoy no guardamos el correo.",
  newsletterPlaceholder: "tu@empresa.com",
  newsletterButton: "Apuntarme",
  newsletterInvalid: "Escribe un correo como nombre@empresa.com",
  newsletterOffline: "El boletín todavía no está conectado. No hemos guardado el correo.",
  newsletterPrivacy: "Sin envíos por ahora. El correo no se almacena.",
} as const;

export type BlogLane = "guide" | "deal";

export type BlogImage = {
  src: string;
  alt: string;
  caption: string;
};

export type BlogSection = {
  heading: string;
  paragraphs: readonly string[];
  points?: readonly string[];
  image?: BlogImage;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  lane: BlogLane;
  date: string;
  readTime: number;
  cover: BlogImage;
  sections: readonly BlogSection[];
  related: readonly { href: string; label: string }[];
};

export const blogCategories = ["Confidencialidad", "Cuentas", "Proceso", "Operaciones"] as const;

const market = [
  { href: "/proyectos", label: "Empresas en venta" },
  { href: "/empresas", label: "Cómo vender una empresa" },
  { href: "/inversores", label: "Cómo comprar" },
] as const;

export const blogPosts: BlogPost[] = [
  {
    slug: "como-preparar-una-pyme-para-venderla",
    title: "Cómo preparar una pyme para venderla",
    excerpt:
      "Cuatro datos bastan para abrir la conversación. La ficha sale con región, facturación, EBITDA y precio. La razón social se queda en el borrador.",
    category: "Proceso",
    lane: "guide",
    date: "2026-10-18",
    readTime: 8,
    cover: {
      src: "/pymes/pyme-cafe.jpg",
      alt: "Mostrador de un pequeño comercio, el tipo de pyme que se prepara para una venta confidencial",
      caption: "La venta se prepara con cifras y un nombre de proyecto, no con el rótulo del local.",
    },
    related: market,
    sections: [
      {
        heading: "Qué hace falta antes de publicar",
        paragraphs: [
          "Vender una pyme no empieza por un anuncio con el nombre del negocio. Empieza por saber qué se vende, de qué tamaño es y en qué zona trabaja. En Releva esos datos son el punto de partida: si se vende la empresa o una parte, cuántas personas la sostienen, dónde está y en qué banda se mueve la facturación.",
          "Con eso ya se puede leer la operación al lado de otras. Quien compra compara región, facturación, EBITDA y precio. No necesita la razón social para decidir si pide el siguiente paso. Quien vende comprueba, en su propio borrador, que la ficha pública dice exactamente eso y nada más.",
        ],
      },
      {
        heading: "Qué cifras conviene tener a mano",
        paragraphs: [
          "La facturación de la ficha sigue la venta del último ejercicio cerrado. El EBITDA resume lo que queda de la explotación. Si las cuentas traen resultado de explotación y amortización, ese EBITDA se puede calcular. El EBITDA ajustado lo escribe quien vende, porque recoge partidas que las cuentas oficiales no separan.",
          "Un precio sin esas tres cifras obliga al comprador a imaginar el negocio. Un precio junto a facturación, EBITDA y EBITDA ajustado le deja ver el orden de magnitud antes de pedir una reunión. La previsión, si se añade, se marca como tal y no se mezcla con un año ya cerrado.",
        ],
        points: [
          "Facturación del último ejercicio cerrado",
          "EBITDA y, si hace falta, EBITDA ajustado",
          "Precio de venta",
          "Región, sin domicilio ni CIF",
        ],
        image: {
          src: "/cities/city-valencia.jpg",
          alt: "Calle comercial en una ciudad española, el nivel de detalle geográfico de una ficha pública",
          caption: "La ficha sitúa la empresa en una comunidad, no en una calle.",
        },
      },
      {
        heading: "Qué se queda fuera de la ficha",
        paragraphs: [
          "La razón social, el CIF, el domicilio y los nombres de los socios no van a la página pública. Tampoco los nombres de los ficheros del dataroom. Esos datos viven en el borrador y solo se abren dentro del proceso, después de que la empresa acepte al comprador y se firme el acuerdo de confidencialidad.",
          "Preparar la venta es también decidir qué foto puede acompañar a la ficha sin identificar el local. La primera imagen es la portada del catálogo. Si no hay foto, la ficha sigue pudiendo publicarse, pero el vendedor ve que la imagen está pendiente.",
        ],
      },
      {
        heading: "Cómo saber que ya se puede enseñar",
        paragraphs: [
          "La ficha está lista cuando un desconocido puede leerla y entender el tamaño del negocio sin adivinar de qué sociedad se trata. Nombre de proyecto, comunidad, facturación, EBITDA, EBITDA ajustado y precio. Si falta uno de esos datos, la conversación se vuelve una adivinanza.",
          "A partir de ahí el recorrido es el de siempre: interés, aceptación, NDA, preguntas, reunión, oferta, documentación y cierre. Publicar no adelanta ninguno de esos pasos. Solo pone la empresa donde ya hay quien busca una pyme para continuar.",
        ],
      },
    ],
  },
  {
    slug: "como-buscar-una-empresa-en-venta",
    title: "Cómo buscar una empresa en venta en España",
    excerpt:
      "El catálogo se lee por región, facturación, EBITDA y precio. El nombre de la sociedad no está en la ficha, y el detalle llega después del NDA.",
    category: "Proceso",
    lane: "guide",
    date: "2026-10-14",
    readTime: 8,
    cover: {
      src: "/cities/city-madrid.jpg",
      alt: "Ciudad española vista desde arriba, el mapa en el que se buscan empresas en venta por región",
      caption: "La búsqueda empieza por la región y las cifras, no por el nombre de la sociedad.",
    },
    related: market,
    sections: [
      {
        heading: "Qué se puede filtrar sin cuenta",
        paragraphs: [
          "Una empresa en venta en España se puede leer antes de registrarse. La ficha pública lleva un nombre de proyecto, la comunidad autónoma y las cifras que el vendedor ha marcado como públicas: facturación, EBITDA, EBITDA ajustado y precio. Con eso se descarta lo que no encaja y se guarda lo que sí.",
          "El orden útil no es el alfabético. Quien busca una pyme suele mirar primero el precio frente al EBITDA, luego la facturación y luego la región. Un taller de proximidad y un comercio con la misma facturación no son la misma operación, y la ficha tiene que dejar ver esa diferencia sin decir el rótulo.",
        ],
        image: {
          src: "/pymes/pyme-taller.jpg",
          alt: "Interior de un taller, ejemplo del tipo de pyme que aparece en un catálogo anónimo",
          caption: "El oficio se entiende por la ficha. El nombre del taller no hace falta para el primer filtro.",
        },
      },
      {
        heading: "Cuándo pedir acceso",
        paragraphs: [
          "Pedir acceso tiene sentido cuando la región, el tamaño y el precio encajan con lo que se busca. Antes de eso, la ficha ya ha hecho el trabajo de criba. Después, la empresa decide si acepta la conversación. Hasta esa aceptación no hay acuerdo de confidencialidad ni preguntas sobre el detalle.",
          "El NDA abre la conversación: preguntas, una reunión y una oferta indicativa. No publica la razón social en el catálogo. El comprador sigue viendo el nombre de proyecto en la lista, y el vendedor sigue viendo «Un inversor» en sus avisos, sin el nombre ni el correo de quien ha escrito.",
        ],
        points: [
          "Lee región, facturación, EBITDA y precio",
          "Pide acceso solo si la operación encaja",
          "Espera la aceptación de la empresa",
          "Firma el NDA antes del detalle",
        ],
      },
      {
        heading: "Qué no vas a encontrar en el listado",
        paragraphs: [
          "No hay un directorio de razones sociales, ni un CIF, ni una calle. Tampoco hay un muro de ficheros con nombres que delaten al cliente o al proveedor. Esa información, cuando existe, está en el dataroom y solo se ve con un permiso concreto, después del NDA.",
          "Si lo que se busca es el nombre de una sociedad concreta, este no es el sitio. Si lo que se busca es una pyme de un tamaño y una zona, la ficha está hecha para esa lectura. El catálogo de empresas en venta junta esas fichas para que se puedan comparar entre sí.",
        ],
      },
    ],
  },
  {
    slug: "que-ve-un-comprador",
    title: "Qué ve un comprador antes del NDA",
    excerpt:
      "La ficha pública lleva un nombre de proyecto, la comunidad y cuatro cifras. La razón social, el CIF y el domicilio se quedan en el borrador.",
    category: "Confidencialidad",
    lane: "guide",
    date: "2026-09-12",
    readTime: 7,
    cover: {
      src: "/pymes/pyme-tienda.jpg",
      alt: "Tienda con mostrador, el tipo de negocio que un comprador ve solo como ficha anónima",
      caption: "Antes del NDA, el comprador ve la ficha. No ve la sociedad.",
    },
    related: market,
    sections: [
      {
        heading: "La ficha que se lee sin cuenta",
        paragraphs: [
          "Quien entra sin cuenta ve un nombre de proyecto, la comunidad autónoma y las cifras públicas. Facturación, EBITDA, EBITDA ajustado y precio se leen juntos, en euros. No hay razón social, no hay CIF y no hay dirección. Esa es la ficha que también puede mirar el vendedor desde su borrador, para comprobar qué va a leer el otro lado.",
          "El nombre de proyecto es un apodo. Puede no parecerse al rótulo del local. Sirve para hablar de la empresa en una lista sin decir quién es. Dos fichas de la misma comunidad se distinguen por ese apodo y por las cifras, no por el nombre legal.",
        ],
      },
      {
        heading: "Qué sigue cerrado",
        paragraphs: [
          "Deuda neta, capital circulante y resultado neto se marcan como bloqueados en la lectura pública. La estructura de la actividad, la cuenta de pérdidas y ganancias y el balance tampoco se abren. Detrás de ese cierre no viajan las cifras reales: hasta el NDA, esa parte de la página no enseña la contabilidad de la empresa.",
          "El dataroom no se lista. Un nombre de fichero puede delatar un cliente, un banco o un local, así que no aparece en la ficha ni en un aviso. Compartir un documento es un permiso aparte, y llega después de que la empresa haya aceptado al comprador y de que el NDA conste.",
        ],
        points: [
          "Nombre de proyecto y comunidad",
          "Facturación, EBITDA, EBITDA ajustado y precio",
          "Sin razón social, CIF ni domicilio",
          "Sin nombres de ficheros",
        ],
        image: {
          src: "/roles/inversor.jpg",
          alt: "Mesa de trabajo de quien revisa fichas de empresas antes de pedir acceso",
          caption: "La primera lectura cabe en una ficha. El detalle espera al acuerdo.",
        },
      },
      {
        heading: "Qué abre el NDA y qué no",
        paragraphs: [
          "El acuerdo se ofrece cuando la empresa ha aceptado la conexión. Usa el apodo del proyecto, la región y el nombre de quien compra. No incluye la razón social, el CIF, el domicilio ni los socios. Firmarlo abre preguntas, una reunión y la oferta indicativa. No convierte la ficha pública en un anuncio con el nombre.",
          "El vendedor sigue viendo «Un inversor». El aviso no lleva el nombre ni el correo de quien ha escrito. La conversación tiene un hilo, y el aviso no es el hilo: el aviso solo señala que hay algo que leer dentro del proceso.",
        ],
      },
    ],
  },
  {
    slug: "leer-el-ebitda",
    title: "Cómo leer el EBITDA de una pyme",
    excerpt:
      "El EBITDA sale del resultado de explotación menos la amortización cuando las cuentas traen ambas cifras. El ajustado lo escribe quien vende.",
    category: "Cuentas",
    lane: "guide",
    date: "2026-09-02",
    readTime: 8,
    cover: {
      src: "/pymes/pyme-mesa.jpg",
      alt: "Mesa de un negocio de comercio, donde la facturación y el EBITDA se leen juntos",
      caption: "Facturación y EBITDA se leen en la misma ficha, en euros.",
    },
    related: market,
    sections: [
      {
        heading: "Facturación y EBITDA no son lo mismo",
        paragraphs: [
          "La facturación es la venta del ejercicio. Dice el tamaño. El EBITDA resume lo que queda de la explotación antes de intereses, impuestos y amortización. Una facturación alta con un EBITDA estrecho es una operación distinta de una facturación menor que deja más margen. Por eso la ficha los pone juntos y no deja que el precio viaje solo.",
          "En una pyme, el EBITDA se entiende mejor en tres años que en uno. Un año bueno puede venir de un encargo que no se repite. Tres ejercicios cerrados dejan ver si el margen aguanta. La ficha pública usa el último cierre para la cifra principal y el borrador puede guardar el resto para quien ya está dentro del proceso.",
        ],
      },
      {
        heading: "De dónde sale la cifra",
        paragraphs: [
          "Si quien vende sube un depósito de cuentas en XBRL o XML, o un XML del modelo 200, se rellenan las ventas y se calcula el EBITDA cuando el fichero trae resultado de explotación y amortización. El EBITDA es ese resultado de explotación menos la amortización. El fichero se lee en memoria y no se guarda.",
          "Un PDF de las cuentas no rellena la ficha. Hace falta el fichero estructurado. Si el índice mercantil no tiene la sociedad, o si el boletín no responde, el borrador sigue siendo manual: quien vende escribe las cifras y las revisa antes de pedir la publicación.",
        ],
        points: [
          "Facturación: ventas del ejercicio",
          "EBITDA: explotación menos amortización, si ambas vienen en el fichero",
          "EBITDA ajustado: lo escribe quien vende",
          "El fichero de cuentas no se almacena",
        ],
        image: {
          src: "/product/empresa.jpg",
          alt: "Pantalla de trabajo sobre las cifras de una empresa en venta",
          caption: "Las cuentas rellenan la ficha. No se publican como documento.",
        },
      },
      {
        heading: "Por qué el ajustado es otra línea",
        paragraphs: [
          "El EBITDA ajustado no se inventa a partir del fichero. Lo escribe quien vende porque recoge partidas que las cuentas oficiales no separan: un alquiler que no seguirá, un sueldo de quien se marcha, un gasto que no es del negocio que se traspasa. Si esa línea no está explicada, el comprador no tiene por qué creerla.",
          "Leer el ajustado es preguntar qué se ha sumado o restado, no sustituir al EBITDA de las cuentas. Las dos cifras conviven en la ficha. Quien compara empresas en venta debería mirar las dos y no quedarse solo con la más alta.",
        ],
      },
      {
        heading: "Cómo usar el EBITDA frente al precio",
        paragraphs: [
          "El precio dividido por el EBITDA da una primera idea de cuántos años de ese resultado harían falta para cubrir lo que se pide. No es una valoración y no cierra la operación. Sirve para ordenar fichas: dos pymes de la misma región se leen más rápido cuando ese múltiplo está a la vista junto al margen.",
          "Un EBITDA de un solo año, o un ajustado sin detalle, no sostiene un precio. La conversación seria llega cuando hay ejercicios cerrados, la cifra está ligada a las cuentas y el precio se puede explicar sin abrir todavía el nombre de la sociedad.",
        ],
      },
    ],
  },
  {
    slug: "recorrido-de-una-venta",
    title: "El recorrido de una compraventa de pymes",
    excerpt:
      "Interés, aceptación, NDA, preguntas, reunión, oferta, documentación y cierre. Un paso no se da por hecho si el anterior sigue abierto.",
    category: "Proceso",
    lane: "guide",
    date: "2026-08-20",
    readTime: 7,
    cover: {
      src: "/hero/city.png",
      alt: "Ciudad en miniatura con varios edificios, imagen del recorrido de una compraventa",
      caption: "Cada paso espera al anterior. Compartir un documento no adelanta la oferta.",
    },
    related: market,
    sections: [
      {
        heading: "Los pasos, en orden",
        paragraphs: [
          "Cada conversación sigue la misma línea: interés, aceptación, NDA, preguntas, reunión, oferta indicativa, documentación y cierre. El comprador ve Compra al final. El vendedor ve Venta. Un paso posterior permanece pendiente mientras uno anterior no está cerrado.",
          "Eso evita el atajo habitual. No se manda el balance porque alguien ha dejado un correo. No se firma una oferta porque ya hubo una llamada. El orden es el mismo para una empresa que vende y para un asesor que trae el mandato de un cliente.",
        ],
        points: [
          "Interés y aceptación de la empresa",
          "NDA antes de las preguntas y de la reunión",
          "Oferta indicativa por escrito",
          "Documentación y cierre al final",
        ],
      },
      {
        heading: "Quién ve qué en cada momento",
        paragraphs: [
          "Hasta la aceptación, el comprador tiene la ficha pública y una solicitud en espera. La empresa ve que hay interés, sin el nombre en el aviso. Después del NDA se pueden hacer preguntas, proponer una reunión y leer la carta de intenciones. Los documentos del dataroom siguen cerrados hasta que se comparten uno a uno o la sala entera.",
          "Una reunión pasada se queda fija y se marca como hecha. Una propuesta futura es una propuesta. Una reunión aceptada es la próxima. No hay un formulario para anotar a posteriori un encuentro que ya ocurrió fuera de la plataforma: el calendario registra lo que las dos partes han acordado ahí.",
        ],
        image: {
          src: "/cities/city-barcelona.jpg",
          alt: "Calle de una ciudad, el tipo de encuentro que en el proceso queda como reunión aceptada",
          caption: "La reunión entra en el recorrido cuando las dos partes la han aceptado.",
        },
      },
      {
        heading: "Qué no adelanta el cierre",
        paragraphs: [
          "Compartir documentos no adelanta la oferta. Una oferta indicativa no abre sola el dataroom. Un mensaje en el chat no sustituye el NDA. El vendedor sigue viendo «Un inversor» y un número de orden, Inversor 1, Inversor 2, según el momento en que pidieron acceso.",
          "El nombre y el correo del comprador no entran en el aviso ni se publican en la ficha. En el hilo, cuando la conversación ya está abierta, cada parte ve el nombre y el apellido de la otra. El aviso y el hilo no son la misma cosa.",
        ],
      },
    ],
  },
  {
    slug: "nombre-que-no-sale",
    title: "Por qué el nombre de la empresa no sale en la ficha",
    excerpt:
      "El nombre público es un apodo del proyecto. Sirve para hablar de la empresa sin decir quién es, mientras clientes y empleados siguen el día a día.",
    category: "Confidencialidad",
    lane: "guide",
    date: "2026-08-06",
    readTime: 6,
    cover: {
      src: "/pymes/pyme-flor.jpg",
      alt: "Escaparate de una floristería, un negocio que puede estar en venta sin publicar el rótulo",
      caption: "El rótulo se queda en la calle. En el catálogo hay un nombre de proyecto.",
    },
    related: market,
    sections: [
      {
        heading: "Un apodo, no una razón social",
        paragraphs: [
          "El nombre de proyecto es la etiqueta de la ficha. Puede ser un apodo. No es la razón social y no tiene que coincidir con el rótulo del local. Proyecto Sur, Proyecto Alba o cualquier otro nombre de ese estilo identifican la operación dentro de Releva. No identifican la sociedad en el registro.",
          "Eso permite enseñar la empresa a varios compradores y seguir operando con clientes y empleados sin anunciar la venta. Una ficha con el nombre legal convierte la exploración en un rumor. Una ficha con apodo deja la exploración en cifras.",
        ],
      },
      {
        heading: "Qué más se omite a propósito",
        paragraphs: [
          "Junto al nombre se quedan fuera el CIF, el domicilio y los socios. Una calle o un número de identificación bastan para encontrar la sociedad en un boletín. Por eso la ficha pública se queda en la comunidad autónoma. Quien necesita el domicilio lo verá, si la operación sigue, dentro del proceso y no en un buscador.",
          "Las fotos de una visita previa se quedan en el navegador de quien vende. El catálogo no las publica. La portada, si se sube, tiene que poder verse sin decir de qué local se trata. Si una imagen identifica el negocio, no debería ser la imagen de la ficha.",
        ],
        image: {
          src: "/cities/city-sevilla.jpg",
          alt: "Ciudad del sur de España, el nivel geográfico que sí aparece en una ficha",
          caption: "Se publica la comunidad. No se publica la calle.",
        },
        points: [
          "Apodo de proyecto en lugar de razón social",
          "Comunidad autónoma en lugar de domicilio",
          "Sin CIF y sin nombres de socios",
          "Sin nombres de ficheros del dataroom",
        ],
      },
      {
        heading: "Cómo se habla de la empresa entonces",
        paragraphs: [
          "Se habla de la región, del tamaño y del precio. «Un comercio en Sevilla, con esta facturación y este EBITDA» es una frase que se puede decir en voz alta. El nombre de la sociedad no hace falta para esa frase, y la ficha está escrita para que esa frase sea suficiente en la primera lectura.",
          "Cuando la conversación ya es seria, el NDA pone el marco. Hasta entonces, el apodo es el nombre. Después, el apodo sigue siendo el nombre público. La identidad legal no vuelve al catálogo porque alguien haya firmado.",
        ],
      },
    ],
  },
  {
    slug: "tres-obradores-del-norte",
    title: "Tres obradores del norte cambian de manos",
    excerpt:
      "Un grupo familiar compra tres obradores en la misma comunidad. La marca que ven los clientes se queda. El precio y los nombres no se publican.",
    category: "Operaciones",
    lane: "deal",
    date: "2026-10-01",
    readTime: 6,
    cover: {
      src: "/pymes/pyme-obrador.jpg",
      alt: "Obrador con masas y bandejas, el tipo de negocio de una operación de sucesión",
      caption: "La nota cuenta el tipo de operación. No nombra los locales.",
    },
    related: market,
    sections: [
      {
        heading: "Qué se compró, sin decir quién",
        paragraphs: [
          "La operación junta tres obradores de una misma comunidad. El comprador es un grupo familiar que ya trabajaba en alimentación. Buscaba volumen, un equipo que siguiera y una marca de mostrador que los clientes ya reconocen. El precio no se publica. Tampoco el nombre de los locales ni el de la sociedad que los explotaba.",
          "En el diario el caso sirve para ver la forma de la operación, no para localizarla. Si esa venta hubiera pasado por una ficha, el nombre público habría sido un apodo de proyecto. La razón social no habría estado en el catálogo ni antes ni después del cierre.",
        ],
        image: {
          src: "/cities/city-bilbao.jpg",
          alt: "Ciudad del norte de España, el tipo de territorio de la operación de los obradores",
          caption: "La comunidad basta para situar el caso. La calle no aporta nada al lector.",
        },
      },
      {
        heading: "Qué se revisó",
        paragraphs: [
          "Se enseñaron tres ejercicios cerrados, la facturación de cada obrador y el EBITDA de la explotación. El equipo seguía. La marca del mostrador no cambiaba con la firma. Eso importa en alimentación: el cliente compra el producto que ya conoce, y el cambio de dueño no tiene por qué ser el titular de la noticia.",
          "No hizo falta un anuncio en un portal con el nombre del horno. El comprador ya estaba en el sector y pedía cifras comparables, no un escaparate. El vendedor quería seguir abriendo cada mañana hasta el día de la firma.",
        ],
        points: [
          "Tres locales, una comunidad",
          "Tres ejercicios cerrados",
          "El equipo y la marca se quedan",
          "Sin precio publicado y sin razón social",
        ],
      },
      {
        heading: "Qué se puede copiar de este caso",
        paragraphs: [
          "Juntar varios locales en una sola conversación tiene sentido cuando comparten oficio, zona y cuentas. Separarlos en tres anuncios con tres nombres habría multiplicado el rumor y no la claridad. Una ficha, o una nota como esta, habla del conjunto.",
          "Este texto no es un listado del BORME ni una noticia de un medio. No identifica a las partes. Cuenta qué se miró y qué se quedó igual, que es lo que le sirve a quien está preparando una venta parecida o buscando un obrador de ese tamaño.",
        ],
      },
    ],
  },
  {
    slug: "taller-de-proximidad",
    title: "Un taller de proximidad pasa a otro del oficio",
    excerpt:
      "El comprador pedía tres años de cuentas y un equipo que se quedara. La venta se cierra dentro del sector, sin anunciar el rótulo.",
    category: "Operaciones",
    lane: "deal",
    date: "2026-09-22",
    readTime: 6,
    cover: {
      src: "/pymes/pyme-taller.jpg",
      alt: "Taller de proximidad con herramientas, el tipo de traspaso entre profesionales del oficio",
      caption: "El comprador ya tenía otro local. Buscaba uno más, por debajo del millón de facturación.",
    },
    related: market,
    sections: [
      {
        heading: "Una venta dentro del mismo oficio",
        paragraphs: [
          "Un taller pequeño cambia de dueño dentro del mismo oficio. El comprador ya tenía otro local y buscaba uno más, con facturación por debajo del millón. No quería aprender el trabajo. Quería un equipo que se quedara y tres años de cuentas que se pudieran leer sin sorpresas.",
          "El rótulo no se anunció. Los clientes siguieron llevando el coche al mismo sitio. El cambio se explicó cuando ya estaba firmado, no mientras se comparaban cifras. Esa es la diferencia entre un traspaso contado en el barrio y una ficha leída por quien ya busca un taller.",
        ],
      },
      {
        heading: "Qué se miró en las cuentas",
        paragraphs: [
          "Lo que se revisó fue el EBITDA de tres años y la plantilla. La facturación decía el tamaño. El EBITDA decía si el local se sostenía después de pagar el trabajo. Un año flojo en medio de dos años estables se explicó; no se escondió detrás de un ajustado sin detalle.",
          "No hizo falta abrir el nombre del taller para esa lectura. Región, banda de facturación y margen bastaban para saber si encajaba con el otro local del comprador. El domicilio llegó más tarde, cuando las dos partes ya habían decidido seguir.",
        ],
        image: {
          src: "/pymes/pyme-ceramica.jpg",
          alt: "Mesa de trabajo de un oficio manual, parecido al taller que cambia de dueño sin anuncio",
          caption: "El oficio se reconoce. El nombre del negocio no se publica.",
        },
        points: [
          "Facturación por debajo del millón",
          "Tres años de EBITDA",
          "Plantilla que sigue",
          "Sin anuncio del rótulo",
        ],
      },
      {
        heading: "Qué no es esta nota",
        paragraphs: [
          "Este caso es una nota del diario. No es un listado del BORME ni una noticia de un medio. No da el nombre del taller, ni la calle, ni el precio. Si sirviera para encontrar la empresa en un mapa, estaría mal contado.",
          "Sirve para otra cosa: ver qué pide alguien que ya está en el oficio cuando busca un segundo local. Pide cuentas, equipo y silencio. La ficha de una empresa en venta está hecha para ese pedido.",
        ],
      },
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
