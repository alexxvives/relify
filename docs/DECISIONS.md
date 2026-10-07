# Decisions

Change a row only by adding a new dated entry. Do not silently swap libraries.

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

Deale's seller NIF step calls Deale's own API Gateway (`POST /prod/company-service/company/preview`, then `GET /prod/company-service/company/:id`). The browser does not call Informa, eInforma, Axesor, Camerdata, LibreBOR, or VIES, so the upstream registry and any key stay unwired. Releva prefills from a server-side fixture adapter in `src/server/lookupCompanyRegistry.ts`. A live client can replace that adapter later without a browser secret. Identity from a hit is stored on the draft and is not selected for public project pages.

## 2026-10-03 — Advisor workspace follows Deale, without a website field

Onboarding is role, then name and NIF/CIF, then Spanish mobile, then how they heard about Releva. The ID check is the existing Spanish CIF checksum. It does not call a registry and does not claim the person exists. The advisor home, trends, and services panels match the Deale screens that were clicked. Mandates, messages, billing, and a data room stay empty. Ser premium stays off the advisor header.

## 2026-10-03 — Public face is a paper ledger

The signed-in workspace keeps the existing app chrome. Public pages — home, marketing, auth, and the catalog — share one palette and one typeface declared in `src/app/globals.css`. The previous homepage stays at `/archivo`, is not indexed, and is left out of the sitemap. Spanish claims stay in the copy modules.

## 2026-10-03 — Public face is Costa

This replaces the paper ledger on the public surface. Home, marketing, auth, and the catalog share Costa tokens in `src/app/globals.css`: fog `#e5eef0`, ink `#12343a`, secondary text `#3d646c`, accent `#0f6e73`, white cards, a large radius, and a soft shadow. The public typeface is DM Sans. The signed-in workspace keeps its own chrome. The previous homepage stays at `/archivo`, is not indexed, and is left out of the sitemap. `/` links to it with one Archivo button. Luz, Noche, Señal, and `/disenos` are removed.

## 2026-10-04 — A sale mandate links an advisor to a published project

An advisor adds a mandate by choosing a published project. The board shows the codename and the four public euro figures. The mandate does not reveal the legal name, CIF, address, shareholders, or file names, and it does not open the data room or a message thread. Advisory quotes stay records. No Stripe customer, Checkout Session, or charge is created until a later billing decision.

## 2026-10-05 — Releva charges buyers and advisors, and records a success fee

This replaces the “no charge” line above. Listing and browsing stay free. A buyer match is the company accepting the investor. The free plan can browse and cannot connect. 20 €/month plus 21% IVA allows 3 matches in the billing period. 99 €/month plus 21% IVA allows unlimited matches. The first company an advisor publishes is free. Each later company is 149 € plus 21% IVA, paid once by the advisor before it goes live. A seller publishes a saved draft for free. The buyer’s 1% and the seller’s 2.5% are calculated on the closed price, plus 21% IVA, and stored when the owner records the sale. Those fees are not sent to Stripe. Quotes on Solicitar presupuesto stay records. Releva is the merchant: Stripe Checkout takes the subscription and the listing fee. There is no payout to an advisor. Amounts in Postgres stay integer euro cents. The Checkout line is the gross amount because Stripe Tax stays off until Releva has an IVA registration. Test keys live in `.env`. A live key is ignored. A company with no owner, such as a seeded project, counts the match when the buyer connects, because there is no seller to accept.

## 2026-10-05 — Signed-in shell uses Costa

This replaces the sentence in “Public face is Costa” that the signed-in workspace keeps its own chrome. Seller, investor, and advisor share the fog, ink, secondary text, accent, DM Sans, and the Instrument Serif word Releva. The sidebar lists a stored action the user repeats. Tendencias, Mis búsquedas, Empresas ocultas, the investor Dataroom, and Perfil de Inversor leave the menu. Those routes stay. Seller documents, processes, and quote requests stay. Ser premium stays investor-only. Public marketing, auth, and the catalog header are unchanged. The mercantile lookup stays the server fixture until there is an Informa or Orbis contract.

## 2026-10-06 — Seller identity comes from the public BORME index

This replaces the fixture sentence above. Deale preloads financials from eInforma. Releva does not. `lookupCompanyRegistry` calls OpenMercantil, which indexes the official BORME, and stores only the legal name plus domicile, province, CNAE, constitution year, and worker count when that bulletin publishes them. Revenue, EBITDA, and adjusted EBITDA stay empty. A CIF the index does not list stays a manual draft. Administrator names from the bulletin are not stored. Identity still stays off public project pages. Annual accounts wait for a later upload of the standardized cuentas anuales file.

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

## 2026-09-30 — Click-through validation uses the Cursor IDE browser

This replaces the Playwright MCP. The IDE browser is already connected and can open the app, click, type, and read the page structure. Playwright is not a project MCP. A Playwright test package can wait until a flow is stable.
