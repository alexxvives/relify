# Decisions

Change a row only by adding a new dated entry. Do not silently swap libraries.

## 2026-11-15 — Round S24 registro, profile, marketplace price filter, INT CIF

GooeyNav Información/Ficha pública uses a solid white framed pill. `/registro` drops the intro and role helpers, fits Empresa/Comprador/Asesor in a 3-col grid, compact terms, password chips. Buyer plans drop the commission intro. `/cuenta` drops the masked DNI hint and stacks before 1024–1280 cramp. Default avatars cycle vendored Gaze blobs (`/waitlist/*.svg`). Marketplace **Facturación** filter is **Precio de venta** on `askingPriceCents`. INT CIF lookup never hits billable APIs; **B12345674** mocks Obrador Ficticio; misses stay honest (no “hemos rellenado”). Seller home links to Detalles when empty. Seller financing is Sí/No (Sí = Recomendado); year/% columns stay nullable unused. No Prisma schema migration.

## 2026-11-15 — Round S23b folder graphic clicks

A click on the 3D Folder graphic or peeking papers on `/mi-empresa/documentos` opens the folder view. Hover peek stays (`openOn="hover"` + `pointer-events-auto`). Folder `onActivate` forwards those clicks (papers had `stopPropagation`). The tile keeps Enter/Space. No Prisma schema migration.

## 2026-11-15 — Round S23 landing polish, folder view, INT uploads

Landing pipeline callout puts **Paso N** inline left of the title (same chip as NDA/Solicitud), icon centred, card `max-width: 42rem`. CIF line chart is a Catmull-Rom curve with gradient fill, draw animation, axes and a pulsing marker. How-it-works uses one spine; only the selected step lights. Publish/buyers step cards were restyled. **Vista previa del mercado** is gone. **rentables** is a more golden diagonal shine (`#c48914`, exception to DESIGN “do not invent hex”). ReportNav bar is `w-fit` / `inline-flex`. INT uploads are on: isolated `data/data-room/int` locally and R2 binding `INT_UPLOADS` → bucket `releva-int-uploads` (create before INT deploy; never prod storage). GlareHover `playOnce` (no leave sweep, no replay). Landing sections share `py-10 sm:py-16`. Pipeline fill/pulse matches Mis procesos. Hero **Prueba gratis** sits at the bottom of the overlay. Documents folders peek on hover and open a folder view on click; files are A4 portrait sheets. Detalle description unmounts when collapsed so expand shows the full text. Información / Ficha pública uses lazy GooeyNav. No Prisma schema migration.

## 2026-11-14 — Round S22b INT QA: skeleton height, wrapping GooeyNav, dropzone line

`ProjectSkeleton` banner is a locked `h-[415px] sm:h-[438px]` with an 8-step pipeline placeholder so `/proyectos/[slug]` does not jump (CLS 0 under 3G). Ficha GooeyNav wraps and centres instead of clipping **Detalle de cuentas**; sm padding is tighter (`--gn-x: 10px`), icons hide below `sm`. Disabled dropzone copy is **Subida desactivada en pruebas**, with extra padding, and the tile spans two columns below `md`. No Prisma schema migration.

## 2026-11-14 — Round S22 INT feedback: dropzone, GooeyNav, signup terms

Path-switch FadeContent blur is 1.6s and clipped to the steps (`isolate overflow-hidden`). Mis documentos uses Bencho’s MIT **Upload dropzone** (`src/components/seller/upload-dropzone.tsx`) with Bencho comments kept, tokens mapped on `.upl` (`--card/--fill-on/--fill-slab/--font-ui/--ink/--ok/--pane-edge/--signal` → Relify navy/sand/ok), `motion/react` + `lucide-react` already in the tree (no `framer-motion`). Real desktop drop/click uploads, 20 MB, inhale/suck/gulp, progress roll + tick, Spanish too-big shake; INT disabled looks muted. React Bits **Folder** is every folder (grey `#9aa3b2`, Relify accent `#465ab4` last, `openOn="click"`, bounce 0.78). **Así se ve una operación** is title-left / reel-right again (`lg:grid-cols-[1.1fr_0.9fr]`). React Bits **TextMorph** needs the Pro registry (`@reactbits-starter` + licence) — SwapVerb stays; hero type is larger. **GooeyNav** (TS+CSS, WebGL + CSS fallback) is the ficha section bar, lazy, navy pill, skipped under reduced motion. `/registro` requires Términos + Privacidad and writes existing `User.termsAcceptedAt` (no Prisma migration); plan cards drop `Al pagar aceptas…`. How-it-works flow intro is gone. Buyer ficha drops the company-tab ProcessRoom, Chat is **Chat / Documentos**, banner download is icon + **Teaser**. Landing nav hover fills `h-11`. Landing intros no longer use pretty/balance/max-w wraps. No Prisma schema migration. Data-room R2 and hero compression stay pending Alex.

## 2026-11-14 — Round S21 INT feedback: navy primary, readable gold, CIF popup

App primary buttons use the waitlist hover colour `#1c2740` (`--relify-btn`) with hover `#334761` (`--relify-btn-hover`, AA on white). Public clay `#0f6e73` stays for eyebrows and progress, not primary CTAs. Landing **rentables** is solid `#7a4a00` (hero overlay `#ffd54a` plus a dark stroke) so the word stays readable at every shine frame — exception to DESIGN “do not invent hex”. Paid plan cards show net plus “IVA incluido” underneath; “IVA 21% no incluido.” is gone. The checkout legal line stays because `/registro` does not require terms/privacy (the blocking `PlatformTermsDialog` runs after sign-in). PixelCard, ElectricLogo, and `ogl` are removed. Relify’s data-room folder is last; in-folder files are PDF/image thumbs. Profile identity declaration is NDA-only. Empresa how-it-works step 1 is a CIF specimen popup, then loader, check, colourful charts (not a live registry lookup). Pipeline CSS `::after` sits at `top: 0.425rem` through the 0.85rem dots; the active step is a card. No Prisma schema migration. Data-room R2 and hero compression stay pending Alex.

## 2026-11-14 — Round S20 React Bits landing, waitlist Gaze, toast stack

Default `/` landing titles are centered. Path switch uses FadeContent blur (lazy, after the first click). **ElectricLogo** is a `/?v=2` desktop trial (`/logo.svg`, color `#10b949`, glow `#00f2ac`, scale 0.7, strands 4, bend 0.6, crackle 1.5, arcs 1, speed 2.5, interactive, paused when the tab is hidden). It is overkill for the header (desktop ~27 fps vs ~33 fps without it) and stays off default `/`. **GlareHover** and **StarBorder** are desktop-only and lazy so mobile Lighthouse stays even with S19. **Folder** is only the Relify folder on Mis documentos. **PixelCard** is the featured investor plan. Waitlist faces are vendored Gaze SVGs (`public/waitlist/`) because CSP `img-src 'self' data: blob:` blocked `api.dicebear.com`; `2a5c6f7` (S5) had swapped those URLs for smiley data-URIs. Waitlist clock uses React Bits Counter. App toasts follow the bencho toast-stack pattern with Costa tokens. **rentables** gold is `#f5b700` / `#ffc400` (exception to DESIGN “do not invent hex”). Process specimen has no Verificado / Financiación tags. Pipeline dots keep `transform-origin: center` so scale does not leave the line. `ogl` is only for ElectricLogo. No Prisma schema migration. Data-room R2 and hero compression stay pending Alex.

## 2026-11-14 — Round S19 landing ficha, Relify folder, sticky nav

Default `/` landing (and shared `/?v=2` sections): larger mobile hero title; **rentables** gold is darker (`#6b4200` / `#7a4e00`) with a diagonal light streak every 4s (reduced-motion static `#7a4e00`; overlay keeps a brighter streak). Exception to DESIGN “do not invent hex”. Paths and how-it-works are one section under **Tres formas de entrar**; clicking a path runs a traveling rail through that track’s steps. CIF / publish / NDA pipeline cards are example animations. Buyer `/proyectos/[slug]` and seller ficha preview share `CompanyFichaView`. Section nav is CSS `position: sticky` and always `max-w-4xl` centered. Mis documentos lists a highlighted Relify folder (teaser + NDA/LOI/terms drafts). Header ink stays dark over the hero. Data-room R2 and hero image compression stay pending Alex — write path and `unoptimized` images are the change points. No Prisma schema migration.

## 2026-11-14 — Round S18 banner, hero overlay, gold, React Bits landing v2

Buyer `/proyectos/[slug]` puts **Descargar cuaderno de venta** at the top-left of the hero banner (`absolute top-5 left-5`). Landing **Prueba gratis** stays inside `.releva-hero-copy` (absolute overlay); mobile `.releva-city-static` is in-flow so the card height follows the image, not the CTA. **rentables** gold is `#a47208` / `#b8860b` with a `#e8c547` shine (WCAG AA for large text on white; overlay reduced-motion uses `#e8c547`). Exception to DESIGN “do not invent hex”.

Landing v2 is `/?v=2` (noindex), default `/` unchanged. `components.json` registers `@react-bits` → `https://reactbits.dev/r/{name}.json`. Installed with `npx shadcn@latest add @react-bits/FadeContent-TS-TW @react-bits/CountUp-TS-TW @react-bits/Aurora-TS-TW` (moved to `src/components/landing/`). **gsap** `^3.15.1` is only for FadeContent. Skipped ShinyText/GradientText so **rentables** stays the custom gold. v2 CountUp uses Proyecto Alba 240/48/190 as labelled example cifras, never `landingCopy.stats`. Aurora is desktop-only and paused off when `prefers-reduced-motion`. No Prisma schema migration.

## 2026-11-14 — Round S17b help copy, LOI DNI reuse, INT buyer fixtures

Seller `/mi-empresa` help stays titled **¿Necesitas ayuda?**, body exactly **Llámanos o escríbenos.**, and the phone number only (`+34 689 99 43 85`). No “Llamar”, no email row, no “Te acompañamos a rellenar la ficha.” Contact-page email is unchanged. NDA signing writes `user.national_id` via `ensureNationalId`; LOI `collectIdentity` is false so a stored id skips the DNI field (`identityOnSign` → `skip`). Additive INT-only SQL `prisma/int-consultoria-buyer-fixtures.sql` sets `int-comprador@test.local`’s DNI (signed NDA before this write existed) and seeds Consultoría Servicios data-room folders/files (two shared, pacto-socios not). No Prisma schema migration.

## 2026-11-14 — Round S17 buyer ficha, DNI reuse, teaser and price bar

Asking-price bar commits on pointerup / debounce, not on every move, so autosave cannot flash the page. The orientative-range sentence is an InfoHint formula, not body copy. Ficha KPI tiles drop Resultado neto. Teaser is a centered card under the document grid with copy-link only. Buyer report nav uses the same `inlineUntilSticky` as the seller ficha. After NDA (`access === "accepted"` / `ndaAcceptedAt`) the buyer sees unveiled figures, charts, detalle and the process document list; company legal identity stays off public/investor reads; data-room files stay share-gated. DNI/NIE stays on existing `user.national_id` (Neon at-rest encryption only — no app-level ciphertext column). UI never receives the full id (`nationalIdMasked`). LOI does not ask again when the profile already has one. Declaration checkbox is required when collecting or confirming identity. Logged-out landing uses one primary **Prueba gratis** (`/registro`) in the hero and header, with a ghost **Iniciar sesión** (`/entrar`) beside it. Hero title is “El mercado inteligente para comprar y vender empresas rentables”: SwapVerb still rotates comprar/vender; **rentables** uses a gold `background-clip: text` sweep (static `#a87f2c` / overlay `#f3e2b3` under `prefers-reduced-motion`). Mobile hero copy is centered. No Prisma schema migration.

## 2026-11-12 — Round S15 overlay hero, draggable price, teaser on documentos

Mobile hero is one image card: title and the two CTAs overlay a dark gradient (no slicing white band). The asking-price bar is a slider (pointer, touch, arrows) synced both ways with the input, with a blue recommended tick and **Usar precio recomendado**. Seller draft autosave revalidates `/mi-empresa` only — vinext treats `revalidatePath` of the open `/mi-empresa/detalles` URL as a hard navigation and blocks the loop as Error al guardar. Perfil ciego leaves `/cuenta` and sits on Mis documentos with an always-on PDF thumb. Duplicate unused brand/hero files at the repo root are deleted; `neon.ts` stays because it is Neon CLI config.

## 2026-11-12 — Repo layout: src/app, feature components, lib/server + lib/db, tests/unit

Routes stay in `src/app` (Next.js forbids a root `app/` next to `src/`). Domain services moved from `src/server` to kebab-case files in `src/lib/server`; Prisma lives in `src/lib/db`. Feature UI sits in `src/components/<feature>`. Unit tests sit in `tests/unit` (e2e in `tests/e2e`). Pure moves/renames and dead-file removal; no behavior change.

## 2026-11-12 — Round S14 asking-price card and Perfil ciego on /cuenta

Precio de venta on Ficha is the amount, the pencil, and a three-state range tag (`Por debajo del rango` / `Dentro del rango` / `Por encima del rango`). The sheet holds the input, the t93 red→green bar with a live black dot, a compact equity vs debt-free control, and the recommended price as a chip plus Usar. Perfil ciego leaves Ficha and sits on `/cuenta` until a later home for it is chosen. Admin company pages keep the teaser card.

## 2026-11-12 — Round S13 seller location is CP + city

The seller form no longer asks for a street. Location is Código postal + Ciudad, shown as `08022, Barcelona`. SABI already stores `postal_code` and `city`; when both are set the fields are locked as registry data. API Empresas and BORME only give a composed street/municipality/province, so those still parse into the same two fields and stay editable. The `address` column stays (nullable writes only compose CP+city). No migration. Tus cifras on Información empresa is a read-only duplicate of Ficha pública (the unique extra was Proponer corrección) and is removed.

## 2026-11-12 — Round S12c hide sticky CTA while the inline twin is on screen

A compact `.shell-sticky-cta` is a duplicate of an in-page action. While `[data-sticky-twin]` intersects the viewport, the bar is `invisible` / `pointer-events-none` / `inert` and `--shell-sticky` is 0. Teaser Copiar / Regenerar / Descargar stay tappable; Descargar returns as a sticky when the card leaves the screen. The same twin is on `/cuenta` Guardar, `/premium` plan cards, and the marketplace ficha Connect row. Shell padding still clears the tab bar at max scroll.

## 2026-11-12 — Round S12b shell padding, Dirección, home [INT], compact cookies

Compact signed-in padding is `--layout-pad + --shell-tabbar + --shell-sticky`. `--shell-tabbar` already includes `env(safe-area-inset-bottom)`. A mounted `.shell-sticky-cta` sets `--shell-sticky` (measured, 4.75rem fallback). Dirección is a 2-line textarea. The home `/` title uses `intAbsoluteTitle` so `[INT]` cannot be dropped by an absolute child title. The mobile cookie sheet is ≤35vh with Rechazar/Aceptar side by side; `body` padding and public sticky CTAs use `--relify-consent-h`.

## 2026-11-11 — Round S12 mobile QA at 390

INT 390 findings on the S11 shell: Información empresa / Ficha pública tabs stay in document flow under the title (sticky below the app bar) instead of a `fixed top-14` overlay that covered “Detalles de empresa”. Tu progreso on compact is a header ring that opens a sheet, not a floating 5/9 chip over the form. Info hints use a bottom sheet on compact viewports as well as coarse pointers, so a desktop tooltip cannot jump to `top: 8px` and cover the tabs. Tu empresa is one column below `sm`; Dirección spans the row. Sugerido wraps the full amount. `/cuenta` on mobile is a summary card with Ver PDF / Descargar, not an unreadably small PDF embed. Teaser Descargar sits at the top of the card and in a sticky bar above the tab bar. INT document titles use `title.template` `[INT] %s`. Shell content padding-bottom stays `--layout-pad + --shell-tabbar + --shell-sticky` (tab bar height already includes the safe area).

## 2026-11-11 — Round S11 mobile-native pattern swaps

Compact viewports swap desktop chrome instead of shrinking it: a bottom tab bar (three short-label destinations + Más), bottom sheets for the landing menu, marketplace filters, and coarse-pointer info hints, sticky CTA bars for primary conversion, horizontal chip rows, and admin waitlist/cuentas as stacked cards below `md`. `lg:` keeps the current rail, dropdowns, and tables. Hit areas are 44px, inputs stay ≥16px, shell height is `100svh`, and `touch-action: manipulation` is on controls. No new type or color system.

## 2026-11-11 — Round S10 cookie bar

The consent UI is a full-width bar fixed at the bottom (`aria-modal="false"`), not a corner card. Desktop: short copy and a `/cookies` link on the left; Rechazar and Aceptar as equal 44px pills on the right; Configurar as a quieter text control. Mobile: bottom-sheet panel with both pills full width. The wrapper uses `pointer-events: none` so the page stays clickable; `body` padding matches the bar height so last controls can scroll clear. Privacy and terms stay in the footer and checkout notes, not in the bar.

## 2026-11-11 — Round S10 GTM Consent Mode v2 Advanced

Prod GTM (`GTM_CONTAINER_ID` / `NEXT_PUBLIC_GTM_CONTAINER_ID`, `GTM-KMZ4Z9PZ`) uses Consent Mode v2 **Advanced**: `gtm.js` is in the initial `<head>` on every page when the id is set (not INT). Preceded by `gtag('consent','default',{ad_storage,ad_user_data,ad_personalization,analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500})`, `ads_data_redaction: true`, `url_passthrough: false`. A stored choice (cookie / localStorage) is restored with `consent update` in that same inline script before GTM fires. Aceptar updates `analytics_storage` to granted and persists; Rechazar keeps denied. The GTM `<noscript>` iframe sits right after `<body>`. G- fallback still loads only after Aceptar. INT leaves both ids unset.

## 2026-11-11 — Round S10 privacy, terms, www→apex

Public `/privacidad` (RGPD/LOPDGDD: roles, processors Cloudflare/Neon/Maileroo/Stripe/GA via consent, rights via info@itsrelify.com, AEPD) and `/terminos` (marketplace roles, NDA, Relify is not a party to the sale, funds via notary/escrow, success fee in the LOI, Stripe + IVA, portal cancel, Spanish courts) reuse the `/cookies` Costa layout. Razón social, NIF and domicilio stay `TODO: … (Alex)` until filled — never invented. Linked from the footer, cookie banner and checkout notes; sitemap yearly 0.3. Prod `src/middleware.ts` 301s `www.itsrelify.com` → `https://itsrelify.com` preserving path and query; skipped when `INT_ENVIRONMENT=true`.

## 2026-11-11 — Round S9 GTM, seller teaser card, Stripe Tax/Portal

Analytics prefers Google Tag Manager container `GTM_CONTAINER_ID` / `NEXT_PUBLIC_GTM_CONTAINER_ID` (`GTM-…`, prod `GTM-KMZ4Z9PZ`). Consent Mode v2 default denied is inlined in `<head>` when GTM or a G- fallback is set; `gtm.js` (or `gtag.js` if only G- is set) loads after Aceptar. No GTM `<noscript>` iframe (cannot gate it on consent). INT leaves both ids unset. Conversion events on dataLayer: `waitlist_submit`, `valuation_request`, `sign_up` (no PII).

The seller already had a thin PDF card on `/mi-empresa`; S9 turns it into **Perfil ciego (teaser)** with page-1 preview (`?preview=1` does not increment `pdf_download`), Descargar PDF, Copiar enlace `/t/[token]`, Regenerar enlace, and a teaser download count. Admin sees the same card on the company ficha. The seller is told what the buyer gets after NDA and cannot download the buyer-watermarked dossier.

Checkout uses Stripe Price `lookup_keys` when present (`relify_buyer_limited_monthly`, `relify_buyer_unlimited_monthly`, `relify_seller_listing_once`, `relify_advisor_inbox_monthly`), exclusive net amounts, `automatic_tax` + `tax_id_collection` + required billing address for B2B ES/EU VAT (needs an ES Tax registration in the Dashboard or Tax collects 0). Listing Checkout also sets `invoice_creation`. Advisor deposits stay ad-hoc `price_data` with no Tax (not a fee). Customer Portal session from `/premium/suscripcion`. Webhooks verify the signature, persist `stripe_event` (`evt_…`) for idempotency, and handle `checkout.session.completed` / `async_payment_succeeded` plus subscription updated/deleted; `invoice.paid` / `invoice.payment_failed` are accepted no-ops. INT publishable is a Worker **var** `INT_STRIPE_PUBLISHABLE_KEY`. Connect payouts/escrow stay out of Stripe (M&A escrow is off-Stripe). TEST bootstrap: `scripts/stripe-bootstrap-test.mjs` (refuses live keys). Additive migration `20261111120000_stripe_event`.

## 2026-11-11 — Round S8 SEO, GA4, CIM polish, LOI template, INT Stripe TEST

Favicon, apple-touch, canonical, Open Graph (1200×630 `/og.jpg`) and Twitter `summary_large_image` sit in the initial `<head>` (explicit links, not vinext-streamed into `<body>`). Analytics is Google Analytics 4 with Consent Mode v2: default denied for `analytics_storage` / `ad_storage` / `ad_user_data` / `ad_personalization`; gtag.js loads only after Aceptar and only if `GA_MEASUREMENT_ID` or `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a `G-…` id (unset on INT). Conversion events `waitlist_submit`, `valorar_submit`, `signup` carry no PII. `/api/health` is `SELECT 1` with a 1.5s timeout. Workers Observability is on (`enabled` in `cloudflare.config.ts`; INT pack `wrangler.toml` `head_sampling_rate` 1). INT Stripe uses `INT_STRIPE_*` TEST keys only; live prefixes log and disable; checkout shows Modo prueba. Post-NDA LOI template PDF includes the Relify 5% success fee. Teaser/dossier PDFs use lucide stroke icons and the ficha red→amber→green price bar. No new migration.

## 2026-11-11 — Round S7 CIM PDFs, /valorar explainer, INT From info@

Teaser/dossier PDFs use a Relify CIM palette (clay, navy, teal, gold/amber, rose): gradient bars, KPI tiles with icons, donut mix of the cifra, coloured section bands. Donut slices are center-relative `drawSvgPath` fans (`pdf-lib` flips SVG Y). Landing “Publica cifras” reuses `MarketCard` for the white body; the name-redact animation is a photo overlay. `/valorar` FAQ is a single-column thin accordion (FAQPage JSON-LD kept). “Qué te enviaremos” explains EV = EBITDA aj. × sector multiple and equity = EV − DFN, with Ejemplo-labelled scenarios. INT `senderFor` always uses `info@itsrelify.com`; catch-all To is unchanged. Prod still uses `info@` for team alerts and `notificaciones@` for people. No new migration.

## 2026-11-11 — Round S6 INT: register the fontkit default object

Workers minify of `import * as fontkit` turned `registerFontkit({ create: fontkit.create })` into `{ create: void 0 }` (`TypeError: e200.create is not a function` on `/t/<token>`). Register `pdfFontkit()` which reads the ESM default. A vitest smoke minifies the PDF worker with Vite and runs teaser + dossier in Miniflare/`workerd`. No new migration.

## 2026-11-11 — Round S6 boutique PDFs, site fonts, real logo

Teaser (2 pages, anonymous) and dossier (post-NDA, watermarked) PDFs use the Relify JPEG from `public/brand/full-logo.svg` (`brandLogoJpegBase64`) and embed DM Sans + Geist via `@pdf-lib/fontkit` + subset TTF bytes. Custom fonts need fontkit; Helvetica is not the site family. Price bar uses `priceBarPosition` so the asking price is a marked point on a labelled scale (sector multiple × EBITDA aj., growth and headcount). Teaser may show motivo / financiación / permanencia (deal terms, not identity). `/valorar` “Relify” mark uses `--font-heading`, not Instrument. No new migration.

## 2026-11-11 — Round S5 tokens, /valorar, visual PDFs

Type families and field radius are global tokens (`docs/DESIGN-TOKENS.md`): DM Sans body, Geist headings, Instrument accents, `--field-radius: 0.9rem` for every form. `/valorar` keeps FAQPage JSON-LD with a compact accordion. Teaser/dossier PDFs are multi-page Relify M&A docs (cover, year bars, KPI tiles); teaser stays on `reportHeadline` with no identity; dossier is post-NDA and watermarked. Samples use INT Proyecto Quercus / `int-tecnologia-years.sql`. No new migration.

## 2026-11-11 — Round S4 company PDFs, /valorar SEO, landing

Company teaser and post-NDA dossier PDFs are drawn with the existing `pdf-lib` dependency (Workers-safe, no paid API). The teaser is the pre-NDA card (`reportHeadline` only, no legal name/CIF). The dossier is the investor ficha after `ndaAccessGate`, watermarked with buyer name/email/date, still without identity. Downloads are logged in additive `pdf_download`. `/valorar` is a distinct Costa editorial page with Service + FAQPage JSON-LD. Landing specimens mix sectors; process and step-1 animations respect `prefers-reduced-motion`.

## 2026-11-10 — Round S3 INT catch-all as secret; valuation save notice stays

`INT_EMAIL_CATCHALL` is a Worker secret (`wrangler secret put … --name releva-int`), not a packaged `[vars]` value. An empty pack var overwrote the dashboard even with `--keep-vars`. Same put command for `INT_MAILEROO_API_KEY`. `/admin/valoraciones` row forms keep a stable `key={id}` so `Solicitud actualizada.` stays visible about 3 seconds after revalidate.

## 2026-11-10 — Round S2 INT email catch-all

INT mail no longer uses `INT_EMAIL_ALLOWLIST`. On INT, `sendMail` sends only when `INT_MAILEROO_API_KEY` (never `MAILEROO_API_KEY`) and `INT_EMAIL_CATCHALL` (one address) are set. Every message, including team alerts, is rewritten to that catch-all: original recipient never in To/CC/BCC, subject `[INT → <original>] `, body banner `Email de INT. Destinatario original: <email> (<role>, <tag>)`, Reply-To the catch-all. Missing either var logs `INT BLOCKED`. Prod path unchanged. Documented in `docs/INT.md`.

## 2026-11-10 — Round S `/valorar` request + INT email allowlist

`/valorar` step 1 (VALORAR.md): persist `ValuationRequest` (CIF + contact, optional phone, optional linked `userId`) via additive migration `20261110220000_valuation_request`. Team alert tag `valuation-request`, confirmation tag `valuation-request-confirmation`. Admin list at `/admin/valoraciones`. Valuations stay off Checkout.

INT mail: `sendMail` no longer hard-blocks. On INT it sends only with `INT_MAILEROO_API_KEY` (never `MAILEROO_API_KEY`) and every recipient on `INT_EMAIL_ALLOWLIST`. Subjects get `[INT] `. info@ alerts redirect to the first exact allowlisted address. Documented in `docs/INT.md`.

## 2026-11-10 — Round R3 preview, one EBITDA figure, 50 % warning

Seller “Cómo se verá mi empresa” uses `marketCardFigures` / `reportHeadline` — the same path as `/mercado`. Pending rows never change that card. Pre-NDA Resumen shows one figure: `EBITDA` when nothing is approved, `EBITDA ajustado` when approved, with the accounts figure only in the tooltip. An adjustment larger than sales is still rejected; larger than half of EBITDA is a soft warning only (1 M € on 5 M sales is allowed).

## 2026-11-10 — Round R2 pre-NDA cards stay published

Visible pre-NDA Resumen cards (facturación, EBITDA / EBITDA aj. when approved, precio, ROI) read `reportHeadline` from the published columns, identical to the seller preview and `/mercado` card. Veil placeholders stay only in content rendered behind the blur (`aria-hidden` / `inert`). DFN/EBITDA and conversión a caja are not public: they sit in that locked block until the NDA. `figuresVeiled` tells `reportHeadline` not to take revenue/EBITDA from the invented years.

## 2026-11-10 — Round R Resumen source, pending EBITDA, sign-in

Resumen cards, narrative and ratios all read `reportHeadline`: last closed `reportYears` row plus approved EBITDA adjustments. Pending or oversized (amount > that year's sales) rows never change the published figure; the stored `adjustedEbitdaCents` column is ignored whenever a list exists. The seller form JSON keeps each row's `status` so a pending owner_salary cannot be previewed as approved. Sign-in still uses the server action; the submit button only shows “Entrando…” after client hydration.

## 2026-11-10 — Round Q Playwright E2E and pre-launch hardening

Vitest stays the unit runner. End-to-end specs use Playwright (`@playwright/test`, `npm run e2e`) against local or INT, never production. Credentials come from `E2E_*` environment variables, not the repo. INT still blocks email, Stripe and uploads. New projects default to `draft` (was `published` on raw inserts). Security headers live in `src/lib/security-headers.ts` and `next.config.ts`.

## 2026-11-10 — Round P metrics, 404, drop stale project snapshots

Headline leverage is DFN / EBITDA aj. when adjustments are approved; the accounts multiple stays in the tooltip. Facturación is always ventas (importe neto de la cifra de negocios); `toSabiYear` prefers `salesCents`. Deuda neta and fondo de maniobra are computed from the same year's balance, never from `project.net_debt_cents` / `project.working_capital_cents` (those columns are dropped). Rentabilidad financiera and margen de beneficio are the net-based formulas only. `/archivo` is a normal 404 (the Round O 301 is removed). `/valorar` stays a CIF form that does not save or compute.

## 2026-11-10 — Round O landing, EBITDA primary, waitlist date

Approved EBITDA adjustments are the primary figure on the marketplace card, ficha Resumen, ROI chip and recommended sort. Pending-only rows keep the accounts EBITDA and show “Ajuste en revisión”. Reported stays in the tooltip. `/archivo` is gone; old URLs 301 to `/`. Waitlist countdown target is 10 January 2027 10:00 Europe/Madrid (was 21 November 2026 10:00). Landing process is a centered desktop two-column (anonymised ficha reveal + steps); horizontal how-it-works cards stay below `lg`. No “Foto de referencia” overlay.

## 2026-11-10 — Round N formulas, financing, commissions

Seller financing no longer has Negociable: the stored values are `yes` / `no` (leftover `negotiable` is read and written as `yes`). The column is a string, so INT only runs `UPDATE … SET seller_financing = 'yes' WHERE seller_financing = 'negotiable'`. Production can keep leftover rows until Alex applies that UPDATE; the reader stays tolerant.

Ficha / Tus cifras / marketplace share one compact euro formatter (`formatCardEur`: 2 decimals below 10 of the unit, 1 from 10–100, 0 above, space before K/M). Cash runway is tesorería change / 12, not caja / |EBITDA|. ROE and margen de beneficio use resultado neto so they match Margen neto. ROA stays SABI pre-tax and is labelled “antes de impuestos”. When an adjusted EBITDA exists, the headline margin is adjusted / ventas.

Platform agreement point 03 is the new commission text (5% seller, 2,5% buyer, 2% Empresa-at-match, 15% advisor). The agreement is not versioned (`user.terms_accepted_at` + frozen PDF of current copy). Buyer/advisor monthly fees stay on Checkout, not in this agreement. `project.buyer_plan_at_match` already records the buyer plan when the seller accepts, so the 2% rule is enforceable.

## 2026-11-10 — Drop unused seasonality / top-5 columns (Round M)

Alex asked to remove `seasonality`, `seasonality_note`, and `top5_clients_pct` from Prisma, code, and a DROP migration. The ficha no longer shows that business-profile block. Cómo es tu negocio keeps owner dependence, premises, rent, lease years, and recurring revenue. Prisma no longer maps the dropped fields, so leftover production columns are ignored until Alex applies `20261110180000_drop_unused_project_profile_columns`. Listed in `DROPS.md`.

## 2026-11-10 — Top-5 client weight and seasonality note stay in Postgres

Cómo es tu negocio no longer has “Peso de los 5 principales clientes” or “Nota de estacionalidad”. `seasonality_note` and `top5_clients_pct` stay in the table (no destructive migration). The seller form does not read or write them. If the ficha shows a concentration figure, it sums the largest five Principales clientes slices.

## 2026-11-09 — Only Alex deploys production, after INT

Worker `releva` is production. `npm run deploy` and `npm run deploy:vinext` must refuse unless `RELIFY_DEPLOY_PROD=yes`, the git branch is `main`, stdin is a TTY, and the operator types `releva`. Agents never deploy, never run wrangler/vinext-cloudflare against `releva`, and never patch `node_modules/cf` to force a publish. INT stays on `scripts/deploy-int.sh` / Worker `releva-int`.

## 2026-11-09 — Company fichas require a session

`/proyectos/<slug>` is not a public page. A logged-out request redirects to `/entrar?siguiente=…` without loading the project, so the HTML, RSC payload, and metadata do not include codename, region, or figures. `/proyectos` is the same. Signed-in `(app)` routes already go through AppShell.

## 2026-11-08 — Logout must revoke the session row, not only the browser cookie

Better Auth `session.cookieCache` (default 5 minutes, signed `session_data`) answers `/get-session` without reading the session table. Logout deletes the row and clears cookies, but a replayed cookie still authenticates until that cache expires. Relify stores sessions in Postgres, so cookieCache stays off and `getCurrentUser` / onboarding pass `disableCookieCache`. One extra unique lookup on `session.token` per request. Do not turn the cache back on for INT only.

## 2026-10-11 — Encargos are the request, and Mis procesos start after the deposit

An encargo is a hire the advisor has not accepted yet. It stays on `/mandatos/encargos` until the deposit is paid. Mis procesos, at `/mandatos/venta`, lists a company only after that deposit, or when the job is already closed. Opening the encargo shows the same company banner the investor sees. The investor card stays on the side. The deposit floats there, and the advisor can reject the request from that card. A rejection stores `declinedAt`, tells the person who asked, and takes the row off both lists. It does not refund anything, because nothing has been paid.

## 2026-10-11 — The advisor deposit is 50 € plus 0.5% and the inbox leaves the desk

The hold is 50 € plus 0.5% of the asking price, in euro cents, with no IVA, because it is a deposit and not a fee. It replaces the earlier hold of half the asking price. Stripe Checkout still takes it in test mode. Paying it still opens the NDA and the figures. The money is returned later; this pass does not call a refund.

Encargos no longer shows the shared inbox or the 39 € plan. A request names an advisor. Mis procesos, at `/mandatos/venta`, groups those jobs by company and shows the sale steps. Hired by a buyer, the advisor sees that buyer's process. Hired by the seller, and once the seller opens the process, each buyer is a lane on the same company. The lanes say Inversor 1 and Inversor 2. They do not show a name or an email.

## 2026-10-10 — An advisor pays a refundable deposit to open a request

A named request stays a record until the advisor pays. Before that payment the advisor sees the codename, the region, the sector, the headcount band, the year, and the public description, plus the investor type, city, ticket, stake, and sectors. The name, email, NIF, phone, and the euro figures stay off that page. The chat, the NDA, and the company file stay closed.

The deposit is 50 € plus half the asking price, stored in euro cents, with no IVA on top, because it is a hold and not a fee. Stripe Checkout takes it in test mode and Relify is the merchant. Paying it notifies the person who asked that the advisor accepted, and then the NDA and the figures open. The money is returned later; this pass does not call a refund. A general request with no company still does not charge.

## 2026-10-10 — Advisor marketplace order

The directory opens on Marketplace. Recomendados sorts advisors by a quality score times a reliability score. Quality adds closed cases, a short focused sector list, a real description, and the services on offer. Reliability starts at 100 and drops when that advisor's own chat messages contain an email, a phone number, or a cue to continue off Relify (WhatsApp, “llámame”, “por privado”). A new advisor with no messages stays at 100. The score is not printed on the card. Precio más bajo and Precio más alto reorder the same list and do not filter anyone out. The company is chosen in the marketplace filter, including when Mis procesos opens that company, and the advisor dialog does not ask for it again.

## 2026-10-08 — The advisor's name stays off the marketplace

A buyer or a seller can choose an advisor from sectors, services, price, and closed cases. The card says Asesor. It does not show the person's name or the commercial name, so the introduction stays on Relify. The commercial name stays on the advisor's own profile form. Participación adds Completa, for buying the whole company.

## 2026-10-08 — Advisor thread, and the investor stake

Contacting a named advisor opens a thread on Mi asesor: chat, the documents already shared on that engagement, and meetings. A general request without an advisor stays with Relify and does not open that thread. The marketplace card shows the commercial name, not the person's name, and a count of closed cases. The case names stay off that card. The investor profile adds participación (mayoría, minoría, or flexible) so the seller card still has four facts after qué aporta moves next to qué busca.

## 2026-10-07 — The seller sees a public investor profile, and the seller uploads the sale contract

The investor profile that a seller opens is stored. It can include a photo, a city and province, the investor type, a ticket band, sectors, what they are looking for, and what they bring. It does not include the legal name, NIF, email, phone, or postal code. The five phases on the investor home are those public fields. The private professional panel stays on the investor's own page.

Relify does not draft the sale contract. Once the seller accepts the LOI either party can ask an advisor to review the documentation, and the seller can upload the contract straight away (S29b: no separate review step).

## 2026-10-07 — The advisor is a profile and a hired service

The advisor keeps a public profile and takes engagements for Due Diligence, Valoración, Consultoría Legal, Consultoría Fiscal, Business Plan, and Consultoría Laboral. In this pass the advisor does not publish the client's company. Existing drafts, including Proyecto Nube, stay. The 149 € plus IVA listing fee belongs to the seller: the first company is free, and each later one is paid once on Añadir empresa through Stripe Checkout. An unpaid leftover draft still asks for that fee before publish. An admin still approves before it is live. An advisor hire only exists once the deal is in Q&A (NDA firmado); earlier hires are deleted.

A finished profile appears to investors and sellers with the commercial name, sectors, services, and price range. A half profile stays off that list. The NIF, the email, and documents stay off it. A request can name one advisor, or sit in a common inbox until the first advisor on the 39 €/mes plan claims it. The free plan edits the profile and sees the directory. It does not open the inbox or claim.

Hired by an investor, the advisor sees the public ficha and signs their own NDA. The investor's signature does not open the company. After the advisor's NDA, that one company shows the same view that investor can already see, including documents that investor can see. Hired by the seller, there is no NDA with the client. The advisor sees only the folders and the process the seller opens, and not the other investors.

A quote request still does not charge. Closing an engagement stores 15% of what the advisor charges for that work, plus 21% IVA on that 15%. That row is not a Stripe charge and it is not 15% of the company price. The 39 € plan opens Checkout in test mode when the keys are present.

## 2026-10-07 — Decoy figures, Relify drafts, and the waiting step

A locked section renders a full statement and charts filled with 999.999,00 €. The real rows stay off the page, so removing the blur in the browser does not reveal the company. The same sentence and the connect or sign action sit on every locked section. The figures open after the company accepts the connection and the buyer signs the NDA.

Mis documentos keeps Corporativo, Financiero, Comercial, Fiscal, Legal, and RRHH/Laboral, plus Relify. Relify holds the NDA and letter-of-intent drafts as PDFs. Those drafts use “El comprador” and “el proyecto”. They do not include a legal name, CIF, or address.

The current sale step says who has to act. “(TÚ)” appears only for the person viewing the step. A past meeting stays fixed and is marked Hecha. A future proposal is Propuesta, and an accepted future meeting is Próxima.

## 2026-10-07 — NDA before the figures, and the sector treemap

Detailed figures stay blurred until the buyer signs the NDA, and that signature is only offered after the company accepts the connection. The NDA and the letter of intent are generated from the project nickname, the region, and the public price. They do not include the legal name, the CIF, or the address. Signing on the platform records the acceptance. It is not a qualified electronic signature.

A limited plan asks for confirmation and shows how many matches remain this month. An unlimited plan connects immediately.

The investor home sizes sectors with the Arc treemap by published revenue. The Arc tokens stay on that chart so they do not restyle the rest of the app.

The sale steps are Solicitud, Conexión, NDA, Preguntas, LOI, Contrato, and Venta (seven since S29b, when the old Revisión/due diligence step merged into LOI). An accepted LOI opens the contract upload; an advisor can review the documentation during LOI or Contrato. `project_access.diligence_passed_at` stays in the schema, unused, with no migration. The contract step stays current until the payment is recorded.

## 2026-10-07 — Figures before a connection, and the trash icon

An investor sees Estructura y actividad empresarial, Pérdidas y ganancias, and Balance as a blur until the company accepts the connection. Those sections do not render the real figures before that. The public headline metrics stay visible. The seller preview stays clear.

Company delete and document delete use the same trash icon as folder delete.

## 2026-10-07 — Meeting times and sidebar icons

Changing the day or the hour of a meeting or a proposal sets it back to proposed. The other party accepts again. The person who last changed the time cannot accept their own change.

The signed-in sidebar and the folder delete control use the same `@animateicons/react` Lucide icons. File delete stays on the existing delete icon.

## 2026-10-07 — Chat names and AnimateIcons

The thread shows the other person's name and surname. The process list stays Inversor 1, and a seller notice stays "Un inversor". Company legal name, CIF, and address stay off those reads.

Signed-in hover icons come from `@animateicons/react` Lucide, one file per icon. This replaces the copied lucide-animated components. The landing keeps `lucide-react`.

## 2026-10-07 — Local data-room bytes, R2 later

A seller upload writes the file bytes under `data/data-room`, keyed by the file id. Postgres keeps the folder and the display name. R2 is still not created. The owner, and an investor who was granted that file, can open those bytes. A name saved before this change has nothing to open until it is uploaded again.

## 2026-10-07 — lucide-animated on signed-in controls

Hover icons for the company menu, documents, meetings, favorites, and plans come from [lucide-animated](https://lucide-animated.com/) and depend on `motion`. This does not install Arc charts. The landing and the rest of the shell keep `lucide-react`.

## 2026-10-07 — A file share is per document

A connected investor sees a data-room file only when that file is shared with them. The room grant still records that the investor may open the room. Folders can be added or hidden per company. Bytes stay out of Postgres.

## 2026-09-30 — Single Next.js app

One package at the repo root. A monorepo adds workspace-path and tooling failures before there is a product.

## 2026-09-30 — npm, TypeScript, Tailwind, shadcn/ui, Zod

These are the defaults agents and current docs already agree on. Tailwind plus copied shadcn components can match Deale without a design-system package.

## 2026-09-30 — Prisma and PostgreSQL

Listings, financials, roles, and NDAs are relational. Prisma is the ORM agents mis-call least often. SQLite is rejected so local and production schemas do not diverge.

## 2026-09-30 — Better Auth

Auth.js v4 examples still dominate model memory and conflict with v5. Better Auth has a Prisma adapter and a user role field. Any auth code must be checked against Context7 first.

## 2026-09-30 — Spanish UI, euro amounts

The visual reference is Deale. Phase 1 copy is Spanish, in one module, with no i18n framework.

## 2026-09-30 — Deploy later

Run on local Node until the public catalog works. Do not add Vercel or Cloudflare config in the scaffold. Cloudflare plugins are available when a later decision picks a host.

## 2026-09-30 — Validation MCPs

Project MCP servers are Context7 (current library docs) and Playwright (browser flows outside the IDE webview). The IDE browser, Stripe, Cloudflare, and OpenSEO are already installed at user or plugin level and are not duplicated here.

## 2026-09-30 — Context7 key stays in `.env`

The Context7 MCP reads `CONTEXT7_API_KEY` from the gitignored `.env` via `envFile`. The key is never committed and never pasted into chat.

## 2026-09-30 — Cloudflare Workers is the production host

This replaces "Deploy later". Local development stays `npm run dev`. Production is Cloudflare Workers. After the Next.js app exists, run `npx vinext check` and add vinext only when that check is clean. `next dev` keeps working beside it. PostgreSQL stays the database, reached through Hyperdrive. Do not create D1. R2 is the later store for data-room files. Do not create a Worker, Hyperdrive config, or R2 bucket until the app boots locally.

## 2026-09-30 — Landing page is an SEO page

The public homepage is server-rendered and indexable. Copy, titles, and internal links are chosen to rank. Keyword research goes through the OpenSEO MCP before the landing copy is treated as final. There is no login wall on `/`.

## 2026-10-03 — Mercantile registry stays behind a server fixture

Deale's seller NIF step calls Deale's own API Gateway (`POST /prod/company-service/company/preview`, then `GET /prod/company-service/company/:id`). The browser does not call Informa, eInforma, Axesor, Camerdata, LibreBOR, or VIES, so the upstream registry and any key stay unwired. Relify prefills from a server-side fixture adapter in `src/lib/server/lookup-company-registry.ts`. A live client can replace that adapter later without a browser secret. Identity from a hit is stored on the draft and is not selected for public project pages.

## 2026-10-03 — Advisor workspace follows Deale, without a website field

Onboarding is role, then name and NIF/CIF, then Spanish mobile, then how they heard about Relify. The ID check is the existing Spanish CIF checksum. It does not call a registry and does not claim the person exists. The advisor home, trends, and services panels match the Deale screens that were clicked. Mandates, messages, billing, and a data room stay empty. Ser premium stays off the advisor header.

## 2026-10-03 — Public face is a paper ledger

The signed-in workspace keeps the existing app chrome. Public pages — home, marketing, auth, and the catalog — share one palette and one typeface declared in `src/app/globals.css`. The previous homepage stays at `/archivo`, is not indexed, and is left out of the sitemap. Spanish claims stay in the copy modules.

## 2026-10-03 — Public face is Costa

This replaces the paper ledger on the public surface. Home, marketing, auth, and the catalog share Costa tokens in `src/app/globals.css`: fog `#e5eef0`, ink `#12343a`, secondary text `#3d646c`, accent `#0f6e73`, white cards, a large radius, and a soft shadow. The public typeface is DM Sans. The signed-in workspace keeps its own chrome. The previous homepage stays at `/archivo`, is not indexed, and is left out of the sitemap. `/` links to it with one Archivo button. Luz, Noche, Señal, and `/disenos` are removed.

## 2026-10-04 — A sale mandate links an advisor to a published project

An advisor adds a mandate by choosing a published project. The board shows the codename and the four public euro figures. The mandate does not reveal the legal name, CIF, address, shareholders, or file names, and it does not open the data room or a message thread. Advisory quotes stay records. No Stripe customer, Checkout Session, or charge is created until a later billing decision.

## 2026-10-05 — Relify charges buyers and advisors, and records a success fee

This replaces the “no charge” line above. Listing and browsing stay free. A buyer match is the company accepting the investor. The free plan can browse and cannot connect. 20 €/month plus 21% IVA allows 3 matches in the billing period. 99 €/month plus 21% IVA allows unlimited matches. The first company an advisor publishes is free. Each later company is 149 € plus 21% IVA, paid once by the advisor before it goes live. A seller publishes a saved draft for free. The buyer’s 1% and the seller’s 2.5% are calculated on the closed price, plus 21% IVA, and stored when the owner records the sale. Those fees are not sent to Stripe. Quotes on Solicitar presupuesto stay records. Relify is the merchant: Stripe Checkout takes the subscription and the listing fee. There is no payout to an advisor. Amounts in Postgres stay integer euro cents. The Checkout line is the gross amount because Stripe Tax stays off until Relify has an IVA registration. Test keys live in `.env`. A live key is ignored. A company with no owner, such as a seeded project, counts the match when the buyer connects, because there is no seller to accept.

## 2026-10-05 — Signed-in shell uses Costa

This replaces the sentence in “Public face is Costa” that the signed-in workspace keeps its own chrome. Seller, investor, and advisor share the fog, ink, secondary text, accent, DM Sans, and the Instrument Serif word Relify. The sidebar lists a stored action the user repeats. Tendencias, Mis búsquedas, Empresas ocultas, the investor Dataroom, and Perfil de Inversor leave the menu. Those routes stay. Seller documents, processes, and quote requests stay. Ser premium stays investor-only. Public marketing, auth, and the catalog header are unchanged. The mercantile lookup stays the server fixture until there is an Informa or Orbis contract.

## 2026-10-06 — Seller identity comes from the public BORME index

This replaces the fixture sentence above. Deale preloads financials from eInforma. Relify does not. `lookupCompanyRegistry` calls OpenMercantil, which indexes the official BORME, and stores only the legal name plus domicile, province, CNAE, constitution year, and worker count when that bulletin publishes them. Revenue, EBITDA, and adjusted EBITDA stay empty. A CIF the index does not list stays a manual draft. Administrator names from the bulletin are not stored. Identity still stays off public project pages. Annual accounts wait for a later upload of the standardized cuentas anuales file.

## 2026-10-06 — eInforma stays unwired until its REST path is published

`EINFORMA_API_USER` and `EINFORMA_API_KEY` stay in `.env` and are never committed. The public eInforma pages describe the company record and do not publish the REST path without a developer login, so the seller lookup does not call eInforma. Identity stays on the OpenMercantil BORME call.

## 2026-10-06 — Optional annual-accounts upload fills the seller draft

This replaces the sentence that the lookup prefers eInforma when the keys are set. Modelo 200 pages 7 and 8 contain the profit and loss, including the net turnover in clave 00255, and they do not contain an EBITDA line. The optional file on `/mi-empresa/detalles` is the Registro Mercantil XBRL or XML deposit, or an XML of modelo 200 that carries those claves. A PDF is refused. The bytes are parsed in memory and are not stored in Postgres or the data room. Revenue is the net turnover of the latest exercise in the file. EBITDA on the draft is the operating result minus amortization when both figures are present. Adjusted EBITDA stays a figure the seller types. Identity lookup stays OpenMercantil. eInforma stays unwired until its published REST path and `EINFORMA_API_USER` and `EINFORMA_API_KEY` are both available.

## 2026-10-06 — Named clients only when the company sells to businesses

Client shares measure concentration. A seller who sells to consumers does not list them. The structure panel asks Empresas, Consumidores, or Ambos. Consumidores stores no client slices, and the investor profile says the sales go to consumers. Shareholders and products stay for every company. Ambos still lists the business customers that weigh on sales.

## 2026-10-06 — Seller charts stay in the repo; the card shows payback years

Arc UI donut, bar, and treemap stay out. Those registry items install `motion` and a second token set, and the bar chart compares one series. The seller home keeps the SVG bars and donuts already in the app. A consumer company does not draw a client donut on that home. The marketplace card centers the asking price and, beside it, shows the years to recover that price from EBITDA: up to 4 in green, above 4 through 7 in orange, and above 7 in red. A treemap of industries waits until the published catalog is large enough to size sectors; the investor profile stays a thesis form and does not host it.

## 2026-10-06 — Industry tiles follow the Arc treemap, without the package

Arc UI donut and bar stay out. Those registry items install `motion` and a second token set, and that bar chart compares one series. The seller home already draws sales and EBITDA together, including a forecast year. The industry chart on `/inversor` and `/admin` keeps the squarified layout in the repo and draws it as soft tiles with a hover ring and a count tooltip, the treatment of the free Arc treemap. It does not install `motion` or the Arc foundation. An onboarded admin signs in to `/admin` and sees account, listing, and activity counts. That panel does not select a legal name, CIF, address, shareholder, or file name.

## 2026-10-07 — Production Postgres is Neon in Frankfurt

The production database is the Neon project `RELEVA` (`delicate-cloud-90142183`), branch `production`, region `aws-eu-central-1`. Postgres only. Neon Auth, object storage, functions, and the AI gateway stay off. Login stays Better Auth. Data-room files stay headed for R2. Local development keeps the Docker `DATABASE_URL`. The Neon URL is not the app's local URL. Workers still reach production through Hyperdrive, which is not created yet. `neon.ts` is the branch policy. `.neon` stays gitignored.

## 2026-10-15 — The Worker queries Neon over fetch

Hyperdrive is still not created. `pg` connection pools on the Worker hang: a request that opens several sockets, or the next request on that isolate, is canceled and the sign-in page shows the error screen. On the Worker, Prisma uses `@prisma/adapter-neon` with `poolQueryViaFetch`, so each query is an HTTP fetch. Local development stays on `@prisma/adapter-pg` and Docker. Transactions on the Worker still use a WebSocket when Prisma asks for one.

## 2026-10-10 — Subscription management stays on Relify

Gestionar suscripción opens `/premium/suscripcion`. That page shows the plan, the renewal date, cancel at period end, the billing email, and the invoices. Stripe Customer Portal stays unused, because its address is always `billing.stripe.com`. Changing the card opens Stripe Checkout in setup mode and returns to the same Relify page. Card numbers are not typed into Relify. Quotes stay records.

## 2026-10-07 — Stripe stays on test until the server says live

This replaces the sentence that a live key is ignored. The default mode is test: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Real charges start only when `STRIPE_MODE` is `live` and `STRIPE_LIVE_SECRET_KEY` plus `STRIPE_LIVE_WEBHOOK_SECRET` are set. A live key in the test variable is still ignored. Test and live are two Stripe modes. There is no button in the product that flips them, because one click would charge every later buyer. Quotes stay records. The 1% and 2.5% stay stored rows.

## 2026-09-30 — Click-through validation uses the Cursor IDE browser

This replaces the Playwright MCP. The IDE browser is already connected and can open the app, click, type, and read the page structure. Playwright is not a project MCP. A Playwright test package can wait until a flow is stable.
