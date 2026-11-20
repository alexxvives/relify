/** Public legal pages. Entity identity stays a TODO until Alex fills razón social, NIF and domicilio. */

export const legalEntity = {
  brand: "Relify",
  razonSocial: "TODO: razón social (Alex)",
  nif: "TODO: NIF (Alex)",
  domicilio: "TODO: domicilio social (Alex)",
  email: "info@itsrelify.com",
  site: "https://itsrelify.com",
} as const;

export const privacyCopy = {
  title: "Política de privacidad",
  description:
    "Quién trata tus datos en Relify, para qué, con qué base legal, durante cuánto tiempo y cómo ejerces tus derechos.",
  kicker: "Legal",
  lead: "Esta política explica el tratamiento de datos personales en Relify, el mercado para comprar y vender pymes, de acuerdo con el RGPD y la LOPDGDD.",
  updated: "Última actualización: 11 de noviembre de 2026.",
  sections: [
    {
      title: "Responsable del tratamiento",
      body: [
        `El responsable es ${legalEntity.brand} (${legalEntity.razonSocial}; NIF ${legalEntity.nif}; domicilio ${legalEntity.domicilio}).`,
        `Para ejercer derechos o preguntar por tus datos escribe a ${legalEntity.email}.`,
      ],
    },
    {
      title: "Datos que recabamos, por rol",
      body: [
        "Cuenta (todos los roles): nombre, apellidos, correo, teléfono, DNI/NIE, contraseña (hash), cómo conociste Relify y la firma del acuerdo de uso.",
        "Comprador: perfil inversor (qué buscas), plan de suscripción y datos de facturación que trata Stripe, conexiones con empresas, mensajes, reuniones, NDA y carta de intenciones.",
        "Vendedor: razón social, CIF, domicilio y resto de identidad de la empresa (no salen en la ficha pública), cifras, ficha, documentos de la data room, teaser y dossier, y el estado de publicación.",
        "Asesor: ficha del directorio, mandatos, encargos y mensajes con clientes.",
        "Sin cuenta: lista de espera (nombre, correo, perfil, ciudad) y /valorar (CIF, nombre, correo y teléfono opcional).",
        "Datos técnicos: cookies esenciales de sesión y Google Tag Manager (Consent Mode v2 Advanced: medición cookieless hasta que aceptas; cookies de analítica solo si aceptas).",
      ],
    },
    {
      title: "Finalidades",
      body: [
        "Crear y mantener tu cuenta, el acuerdo de uso y el acceso al mercado.",
        "Publicar y gestionar fichas, conexiones, NDA, chat, reuniones y documentos de cada operación.",
        "Cobrar suscripciones y el pago único de ficha adicional a través de Stripe, y emitir factura con IVA.",
        "Enviar correo transaccional (acceso, avisos de la operación, confirmaciones).",
        "Atender la lista de espera y las solicitudes de /valorar.",
        "Medir el uso del sitio con Google Analytics 4 (cookieless hasta que aceptas las cookies de analítica).",
        "Cumplir obligaciones legales (fiscales, de conservación y de atención a derechos).",
      ],
    },
    {
      title: "Bases jurídicas",
      body: [
        "Ejecución del contrato: cuenta, ficha, conexiones, NDA y los servicios que pides en Relify.",
        "Obligación legal: facturación, IVA y conservación de datos exigida por la ley.",
        "Interés legítimo: seguridad de la cuenta, prevención de abuso y mejora del servicio, siempre que no prevalezcan tus derechos.",
        "Consentimiento: cookies de analítica (Google Tag Manager / Google Analytics 4). Puedes retirarlo en Preferencias de cookies.",
      ],
    },
    {
      title: "Encargados del tratamiento",
      body: [
        "Cloudflare: alojamiento de la web (Workers) y red de distribución.",
        "Neon: base de datos PostgreSQL.",
        "Maileroo: envío del correo transaccional.",
        "Stripe: cobro de suscripciones y del pago único de publicación, con IVA.",
        "Google Analytics 4, cargado mediante Google Tag Manager (Consent Mode v2 Advanced: cookieless antes del consentimiento; cookies _ga solo si aceptas).",
        "Estos encargados tratan los datos por instrucción de Relify. Algunos pueden tratarlos fuera del EEE con las garantías previstas en el RGPD (cláusulas contractuales tipo u otras).",
      ],
    },
    {
      title: "Conservación",
      body: [
        "Cuenta y operación: mientras la cuenta exista y, después, el tiempo que exijan obligaciones fiscales o de defensa de reclamaciones.",
        "Lista de espera y /valorar: hasta la apertura del mercado o hasta que pidas la supresión, y después los plazos legales.",
        "Cookies de analítica: según la política de cookies (hasta dos años para _ga).",
        "Preferencia de cookies: 180 días en este navegador.",
      ],
    },
    {
      title: "Tus derechos",
      body: [
        "Acceso, rectificación, supresión, oposición, limitación, portabilidad y a no ser objeto de decisiones automatizadas.",
        "Si el tratamiento se basa en el consentimiento, puedes retirarlo sin que ello afecte a lo ya hecho.",
        `Para ejercerlos escribe a ${legalEntity.email} desde el correo de tu cuenta e identifica el derecho que pides.`,
        "También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD), www.aepd.es.",
      ],
    },
  ],
} as const;

export const termsCopy = {
  title: "Términos de uso",
  description:
    "Condiciones del mercado Relify: roles, fichas, NDA, que Relify no es parte de la compraventa, comisión de éxito, Stripe e IVA, y ley aplicable.",
  kicker: "Legal",
  lead: "Estos términos regulan el uso de Relify. No sustituyen el contrato de compraventa ni la escritura ante notario.",
  updated: "Última actualización: 20 de noviembre de 2026.",
  sections: [
    {
      title: "Quién presta el servicio",
      body: [
        `Relify (${legalEntity.razonSocial}; NIF ${legalEntity.nif}; domicilio ${legalEntity.domicilio}) opera el mercado en ${legalEntity.site}.`,
        `Contacto: ${legalEntity.email}.`,
      ],
    },
    {
      title: "Roles",
      body: [
        "Comprador: consulta fichas anónimas, pide conexión, firma el NDA si el vendedor acepta y avanza la operación (chat, reuniones, oferta indicativa, carta de intenciones).",
        "Vendedor: publica una ficha de su empresa con nombre de proyecto, cifras y documentos. Decide a qué comprador acepta.",
        "Asesor: publica mandatos y acompaña encargos de comprador o vendedor. Crear la ficha es gratuito; publicarla en el directorio y aceptar encargos requiere la suscripción de asesor.",
      ],
    },
    {
      title: "Reglas de las fichas",
      body: [
        "La ficha pública no muestra la razón social, el CIF, la dirección ni los nombres de los socios. Eso llega después del NDA, si el vendedor acepta la conexión.",
        "Los datos de la ficha deben ser veraces. Relify puede retirar una ficha, pedir corrección o suspender la cuenta si hay abuso, identidad falsa o uso del chat para cerrar fuera de la plataforma.",
        "Publicar la primera empresa del vendedor no tiene pago único. Cada empresa adicional se cobra como un pago único a través de Stripe, con IVA.",
      ],
    },
    {
      title: "Conexión y NDA",
      body: [
        "Ver el catálogo es gratis. Conectar con una empresa exige un plan de comprador.",
        "El vendedor acepta o rechaza cada solicitud. Si acepta, las partes firman el acuerdo de confidencialidad (NDA) en Relify antes de ver la identidad y el data room.",
        "La carta de intenciones (LOI) se firma en Relify cuando la operación llega a ese paso. Recoge la comisión de éxito de Relify.",
      ],
    },
    {
      title: "Relify no es parte de la compraventa",
      body: [
        "Relify pone en contacto a las partes y da herramientas (ficha, NDA, chat, documentos). No es parte del contrato de compraventa ni de la escritura.",
        "El precio, las condiciones y el cierre los acuerdan comprador y vendedor. El dinero de la operación no pasa por Relify: se paga ante notario o a través del escrow o cuenta que las partes pacten.",
        "Relify no custodia fondos de la compraventa ni actúa como entidad de pago de esa operación.",
      ],
    },
    {
      title: "Comisión de éxito",
      body: [
        "Si la operación se cierra entre partes conectadas en Relify, la comisión de Relify es la que figura en el acuerdo de uso y en la LOI: 5% del precio total para quien vende y 2,5% para quien compra (2% si el comprador tenía el plan Empresa en el match). Un asesor paga a Relify el 15% de lo que cobre por cada encargo. Todo ello más IVA.",
        "Esa comisión se debe también si el cierre se hace fuera de Relify durante los dos años siguientes a la conexión.",
        "La comisión de cierre se registra en Relify. El cobro de esa comisión no se hace en Stripe en este paso.",
      ],
    },
    {
      title: "Suscripciones y pagos únicos (Stripe)",
      body: [
        "Los planes de comprador, la suscripción de asesor y el pago único por empresa adicional se facturan a través de Stripe, con IVA.",
        "Puedes cancelar o cambiar una suscripción de Stripe desde el portal de facturación (Gestionar suscripción). La cancelación se aplica al final del periodo ya pagado, salvo que Stripe indique otra cosa en el portal.",
        "Los precios se muestran sin IVA; el IVA se calcula en el checkout según tu dato fiscal.",
      ],
    },
    {
      title: "Responsabilidad",
      body: [
        "Relify no garantiza que una ficha se venda, ni la veracidad absoluta de las cifras que aporta el vendedor, ni el resultado de la operación.",
        "En la medida permitida por la ley, la responsabilidad de Relify por el uso del mercado se limita a los importes que le hayas pagado en los doce meses anteriores al hecho, excluida la comisión de éxito de una operación concreta.",
        "Nada en estos términos limita la responsabilidad por dolo, culpa grave o los derechos que la ley no permite excluir.",
      ],
    },
    {
      title: "Ley y tribunales",
      body: [
        "Estos términos se rigen por la ley española.",
        "Para cualquier controversia, las partes se someten a los juzgados y tribunales del domicilio del responsable, salvo que la ley de consumidores imponga otro fuero.",
      ],
    },
  ],
} as const;
