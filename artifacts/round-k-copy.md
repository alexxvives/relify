# Round K copy audit

Every changed string on the public landing (home, role pages, waitlist, auth stage, onboarding role cards). Spanish. Relify stays in visible text.

Scope: claims must be true for a near-MVP (waitlist, first listing 0 €, catalog free, NDA before identity, NIF check). No unverifiable numbers, timelines, buyer counts, testimonials or live-market stats.

## Home metadata

| Where | Before | After |
| --- | --- | --- |
| `landingCopy.description` | Relify es la plataforma para comprar y vender pymes con fichas claras, un proceso confidencial y acceso a perfiles que encajan. La ficha pública no muestra la razón social. | Relify es la plataforma para comprar y vender pymes con fichas claras y un proceso confidencial. La ficha pública no muestra la razón social. |
| `landingCopy.home.description` | Unas pymes están en venta y se leen por facturación, EBITDA y precio. Otras pueden publicarse igual, sin la razón social en la ficha. | En Relify las fichas se leen por facturación, EBITDA y precio, sin la razón social. Publicas la tuya o pides conexión a las que encajan. |

## Home · Vender (Process)

| Where | Before | After |
| --- | --- | --- |
| heading + accent | Vende tu negocio / en 120 días | Vende tu negocio / sin mostrar la sociedad |
| intro | Así llega el interés: empresarios de toda España, conectados con tu empresa, que ya buscan un negocio al que darle continuidad. | Publicas región, cifras y precio con un nombre de proyecto. Tú aceptas a cada comprador. El NDA abre el resto. |
| body 1 | Publicas la ficha y el mapa se llena de compradores que ya buscan por ciudad y sector. Tú marcas qué encaja y tú eliges con quién hablar, sin que la operación se convierta en un anuncio público. | Publicas la ficha con región, sector y cifras. Los compradores piden conexión. Tú eliges con quién hablar, sin que la operación se convierta en un anuncio público. |
| body 3 | Relify te avisa cuando llega interés, cuando hay reunión o cuando toca tu turno. Así avanzas el proceso sin perder el control ni la confidencialidad del negocio. | Relify te avisa cuando llega una solicitud, una reunión o tu turno. El control de la ficha y de quién ve el detalle es tuyo. |
| CTA href | /empresas | /registro?rol=empresa (label unchanged: Publicar mi empresa) |
| timeline labels | Día / de 120 | Paso (no fake calendar) |
| step 1 | Día 1 · Publicas la ficha | Paso 1 · Publicas la ficha |
| step 2 | Día 30 · Llega el interés · Compradores que ya buscan por ciudad y sector piden conexión. | Paso 2 · Llega el interés · Los compradores piden conexión con su perfil público. |
| step 3 | Día 60 · Tú eliges con quién hablar | Paso 3 · Tú eliges con quién hablar |
| step 4 | Día 90 · NDA y conversación | Paso 4 · NDA y conversación |
| step 5 | Día 120 · Cierre · Relify te avisa en cada paso. Avanzas sin perder el control. | Removed (unverified close timeline) |

## Home · Caminos

| Where | Before | After |
| --- | --- | --- |
| Vender line | (none) | Publica con cifras, sin el nombre |
| Comprar line | (none) | Lee fichas anónimas y pide conexión |
| Asesorar line | (none) | Ofrece servicios y acepta encargos |

## Home · Cómo funciona

| Where | Before | After |
| --- | --- | --- |
| intro | Baja por los pasos y verás qué datos dejas, qué prepara Relify y en qué momento entra un comprador, con el nombre de la sociedad todavía fuera. | Qué datos dejas, qué prepara Relify y cuándo entra la otra parte, con el nombre de la sociedad todavía fuera. |
| CTA (new) | (none) | Vender → Crear cuenta de empresa `/registro?rol=empresa`. Comprar → Crear cuenta de comprador `/registro?rol=inversor`. Asesorar → Crear cuenta de asesor `/registro?rol=asesor`. |
| chip vender 01 | Unos minutos | CIF |
| chip comprar 01 | Unos minutos | Perfil |
| chip asesorar 01 | Unos minutos | Ficha |

## Home · Confidencialidad

| Where | Before | After |
| --- | --- | --- |
| CTA (new) | (none) | Ver cómo se publica → `/empresas` |
| mock toast time | Hoy · 10:41 | Ejemplo |

## Home · Actividad

| Where | Before | After |
| --- | --- | --- |
| kicker | El mercado en marcha | Dentro de Relify |
| heading | Mira cómo se conectan compradores y empresas: interés, reuniones y operaciones que avanzan cada día | Así se ve una operación |
| intro (new) | (none) | Avisos de ejemplo: interés, reunión y NDA, con el nombre de proyecto. |
| CTA (new) | (none) | Crear cuenta → `/registro` |
| item times | Hoy · 21:41 / 21:12 / 20:48 / 20:05 / 19:22 / 18:40 | Ejemplo |

## Archivo-shared audiences (same copy file)

| Where | Before | After |
| --- | --- | --- |
| sellers accent | en menos de 120 días | sin mostrar la sociedad |
| sellers body | Recibe interés sobre la compañía con un nombre de proyecto. Llegas a compradores que ya buscan una operación, y la ficha no publica la sociedad ni a los socios. | Publica con un nombre de proyecto. La ficha no enseña la sociedad ni a los socios. Tú eliges a qué comprador aceptar. |
| investors heading/accent | Invierte en / empresas rentables | Lee fichas por / cifras, no por el nombre |
| investors body | Encuentra empresas en venta que encajan con tus criterios y revisa facturación, EBITDA y precio antes de pedir el detalle confidencial. | Revisa facturación, EBITDA y precio en cada ficha. La sociedad llega después del NDA, si el vendedor te acepta. |
| advisors body | Presenta la operación de tus clientes con las mismas reglas de anonimato y habla con empresas e compradores que ya están en el proceso. | Presenta la operación de tus clientes con las mismas reglas de anonimato. El directorio de asesores es gratuito; para aceptar un encargo activas la suscripción. |

## `/inversores`

| Where | Before | After |
| --- | --- | --- |
| title | Encuentra empresas rentables antes de saber el nombre | Lee fichas por cifras, no por el nombre |
| closing | Entra en el catálogo antes de que se llene. | Apúntate para ver las fichas cuando Relify abra. |
| CTA | Apuntarme → `/lista-de-espera` | unchanged |

## `/asesores`

| Where | Before | After |
| --- | --- | --- |
| closing | Llega a las operaciones cuando necesitan un asesor. | Publica tu ficha de asesor en Relify. |

## Waitlist

| Where | Before | After |
| --- | --- | --- |
| description | Apúntate a la lista de espera de Relify. Empresas, compradores y asesores entran juntos para que el primer día ya haya con quién hablar. | Apúntate a la lista de espera de Relify. Te avisamos cuando abramos el marketplace a empresas, compradores y asesores. |
| body | Deja tu correo y te avisamos en cuanto abramos. Si vendes, publica tu negocio gratis y con total discreción. Si compras, explora todos los negocios sin coste. Si eres asesor, consigue nuevas operaciones que acompañar. | Deja tu correo y te avisamos en cuanto abramos. La primera ficha de empresa es gratuita. El catálogo se mira sin pagar. La ficha de asesor en el directorio también es gratis. |
| seatsTitle | Así se llena la sala | Tres perfiles, un marketplace |
| seatsBody | Cada cara es un sitio. Cuantos más entran de los tres lados, más fácil es el primer encuentro. | Empresa, comprador y asesor. Elige el tuyo y te avisamos al abrir. |
| formTitle | Reserva tu sitio | Deja tus datos |

## Auth (`/entrar`, `/registro` stage + onboarding role cards)

| Where | Before | After |
| --- | --- | --- |
| stageBody | Descubre empresas rentables en venta, habla con vendedores verificados y da el siguiente paso. | Fichas con facturación, EBITDA y precio, sin la razón social. Un NDA abre el detalle cuando el vendedor te acepta. |
| point 1 | Fichas verificadas / Empresas reales. Propietarios reales. | Fichas con cifras / Región, facturación, EBITDA y precio. La sociedad no está. |
| point 2 | Operaciones seguras / Pensadas para la confianza y la transparencia. | NDA antes del detalle / Sin el acuerdo no se abre el nombre ni el dataroom. |
| point 3 | El siguiente paso / Encuentra la oportunidad antes. | Tú eliges el rol / Empresa, comprador o asesor. Cada uno tiene su recorrido. |
| seller card | Quiero vender la totalidad de mi empresa o encontrar un socio de forma totalmente segura y confidencial en menos de 100 días. | Quiero publicar mi empresa con un nombre de proyecto y elegir a qué comprador aceptar. |
| buyer card | Busco encontrar la mejor oportunidad de adquisición o inversión entre las más de 4.000 empresas rentables. | Busco leer fichas anónimas por cifras y pedir conexión a las que encajan. |

## Unchanged on purpose

- Hero: Un mercado para comprar/vender empresas. CTAs Comprar una empresa / Vender tu empresa → `/registro`.
- Offer: Empresas en venta, Vista previa del mercado, waitlist lock CTA.
- Relify in logo, confidentiality heading, activity kicker, footer, waitlist, role pages.
- `/empresas` page copy (pricing, NIF, NDA) already matched the product.
- Archivo stats bar (25000 / 3000 / 11000 / 200 / 120) left as-is: it is the archived homepage, not `/`.
