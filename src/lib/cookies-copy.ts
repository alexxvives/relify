export const cookiesCopy = {
  title: "Cookies",
  description: "Qué cookies usa Relify, cuáles son esenciales y cómo eliges la analítica de Google Tag Manager.",
  kicker: "Privacidad",
  lead: "Las cookies esenciales sirven para entrar en tu cuenta. Google Tag Manager se carga con Consent Mode v2 Advanced: antes de aceptar, la medición es cookieless (sin cookies de analítica). Si aceptas, se ponen las cookies _ga.",
  essentialsTitle: "Esenciales",
  essentialsBody:
    "Siempre activas. Guardan la sesión de Better Auth y, al registrarte, el rol con el que quieres empezar. Sin ellas no puedes entrar ni mantener la sesión.",
  analyticsTitle: "Analítica (Google Tag Manager)",
  analyticsBody:
    "En producción, si hay un contenedor GTM, gtm.js se pide en cada página (Consent Mode v2 Advanced). El consentimiento por defecto niega analytics_storage y las cookies de publicidad. Hasta que aceptas, Google puede medir de forma cookieless: pings anónimos, sin cookies _ga. Si aceptas, gtag actualiza analytics_storage a granted y se ponen _ga / _ga_*. Si rechazas, el consentimiento sigue en denied. Quien ya eligió restaura esa decisión en la página, antes de que GTM dispare. El contenedor dispara Google Analytics 4. Mide visitas y, sin datos personales, envíos de lista de espera, /valorar y alta. No mandamos nombre, correo ni CIF. Si no hay contenedor GTM, el respaldo es un identificador G-… de Analytics 4, que solo se carga si aceptas.",
  gaCookiesTitle: "Cookies de Google Analytics",
  gaCookies: [
    { name: "_ga", body: "Distingue visitantes. Caduca a los dos años." },
    { name: "_ga_*", body: "Mantiene el estado de la sesión del identificador G-…. Caduca a los dos años." },
  ],
  choiceTitle: "Tu elección",
  choiceBody:
    "Puedes aceptar, rechazar o configurar. La barra reaparece desde Preferencias de cookies en el pie. Guardamos la decisión 180 días en este navegador.",
  reopen: "Preferencias de cookies",
  policyLink: "Política de cookies",
  privacyLink: "Privacidad",
  termsLink: "Términos",
  bannerTitle: "Cookies en Relify",
  bannerBody: "Usamos cookies esenciales. Hasta que aceptas, la analítica es cookieless.",
  accept: "Aceptar",
  reject: "Rechazar",
  configure: "Configurar",
  save: "Guardar",
  essentialsLock: "Siempre activas",
  analyticsToggle: "Permitir analítica",
} as const;
