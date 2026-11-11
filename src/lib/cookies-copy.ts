export const cookiesCopy = {
  title: "Cookies",
  description: "Qué cookies usa Relify, cuáles son esenciales y cómo eliges la analítica de Google Tag Manager.",
  kicker: "Privacidad",
  lead: "Las cookies esenciales sirven para entrar en tu cuenta. Google Tag Manager (y Analytics 4) solo se carga si la aceptas.",
  essentialsTitle: "Esenciales",
  essentialsBody:
    "Siempre activas. Guardan la sesión de Better Auth y, al registrarte, el rol con el que quieres empezar. Sin ellas no puedes entrar ni mantener la sesión.",
  analyticsTitle: "Analítica (Google Tag Manager)",
  analyticsBody:
    "Si aceptas, cargamos Google Tag Manager (contenedor GTM) con Consent Mode v2. Hasta entonces no se pide gtm.js ni se ponen cookies de analítica. El contenedor dispara Google Analytics 4. Mide visitas y, sin datos personales, envíos de lista de espera, /valorar y alta. No mandamos nombre, correo ni CIF. Si no hay contenedor GTM, el respaldo es un identificador G-… de Analytics 4.",
  gaCookiesTitle: "Cookies de Google Analytics",
  gaCookies: [
    { name: "_ga", body: "Distingue visitantes. Caduca a los dos años." },
    { name: "_ga_*", body: "Mantiene el estado de la sesión del identificador G-…. Caduca a los dos años." },
  ],
  choiceTitle: "Tu elección",
  choiceBody:
    "Puedes aceptar, rechazar o configurar. El recuadro reaparece desde Preferencias de cookies en el pie. Guardamos la decisión 180 días en este navegador.",
  reopen: "Preferencias de cookies",
  policyLink: "Política de cookies",
  bannerTitle: "Cookies en Relify",
  bannerBody: "Usamos cookies esenciales para la sesión. Google Tag Manager solo se carga si la aceptas.",
  accept: "Aceptar",
  reject: "Rechazar",
  configure: "Configurar",
  save: "Guardar",
  essentialsLock: "Siempre activas",
  analyticsToggle: "Permitir analítica",
} as const;
