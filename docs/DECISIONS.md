# Decisions

Change a row only by adding a new dated entry. Do not silently swap libraries.

## 2026-10-11 — The advisor deposit is 50 € plus 0.5% and the inbox leaves the desk

The hold is 50 € plus 0.5% of the asking price, in euro cents, with no IVA, because it is a deposit and not a fee. It replaces the earlier hold of half the asking price. Stripe Checkout still takes it in test mode. Paying it still opens the NDA and the figures. The money is returned later; this pass does not call a refund.

Encargos no longer shows the shared inbox or the 39 € plan. A request names an advisor. Mis procesos, at `/mandatos/venta`, groups those jobs by company and shows the sale steps. Hired by a buyer, the advisor sees that buyer's process. Hired by the seller, and once the seller opens the process, each buyer is a lane on the same company. The lanes say Inversor 1 and Inversor 2. They do not show a name or an email.

## 2026-10-10 — An advisor pays a refundable deposit to open a request

A named request stays a record until the advisor pays. Before that payment the advisor sees the codename, the region, the sector, the headcount band, the year, and the public description, plus the investor type, city, ticket, stake, and sectors. The name, email, NIF, phone, and the euro figures stay off that page. The chat, the NDA, and the company file stay closed.

The deposit is 50 € plus half the asking price, stored in euro cents, with no IVA on top, because it is a hold and not a fee. Stripe Checkout takes it in test mode and Releva is the merchant. Paying it notifies the person who asked that the advisor accepted, and then the NDA and the figures open. The money is returned later; this pass does not call a refund. A general request with no company still does not charge.

## 2026-10-10 — Advisor marketplace order

The directory opens on Marketplace. Recomendados sorts advisors by a quality score times a reliability score. Quality adds closed cases, a short focused sector list, a real description, and the services on offer. Reliability starts at 100 and drops when that advisor's own chat messages contain an email, a phone number, or a cue to continue off Releva (WhatsApp, “llámame”, “por privado”). A new advisor with no messages stays at 100. The score is not printed on the card. Precio más bajo and Precio más alto reorder the same list and do not filter anyone out. The company is chosen in the marketplace filter, including when Mis procesos opens that company, and the advisor dialog does not ask for it again.

## 2026-10-08 — The advisor's name stays off the marketplace

A buyer or a seller can choose an advisor from sectors, services, price, and closed cases. The card says Asesor. It does not show the person's name or the commercial name, so the introduction stays on Releva. The commercial name stays on the advisor's own profile form. Participación adds Completa, for buying the whole company.

## 2026-10-08 — Advisor thread, and the investor stake

Contacting a named advisor opens a thread on Mi asesor: chat, the documents already shared on that engagement, and meetings. A general request without an advisor stays with Releva and does not open that thread. The marketplace card shows the commercial name, not the person's name, and a count of closed cases. The case names stay off that card. The investor profile adds participación (mayoría, minoría, or flexible) so the seller card still has four facts after qué aporta moves next to qué busca.

## 2026-10-07 — The seller sees a public investor profile, and the seller uploads the sale contract

The investor profile that a seller opens is stored. It can include a photo, a city and province, the investor type, a ticket band, sectors, what they are looking for, and what they bring. It does not include the legal name, NIF, email, phone, or postal code. The five phases on the investor home are those public fields. The private professional panel stays on the investor's own page.

Releva does not draft the sale contract. At due diligence either party can ask an advisor or continue. Documentation is where the seller uploads the contract.

## 2026-10-07 — The advisor is a profile and a hired service

The advisor keeps a public profile and takes engagements for Due Diligence, Valoración, Consultoría Legal, Consultoría Fiscal, Business Plan, and Consultoría Laboral. In this pass the advisor does not publish the client's company. Existing drafts, including Proyecto Nube, stay. The 149 € plus IVA listing fee belongs to the seller: the first company is free, and each later one is paid before the publish request. An admin still approves before it is live.

A finished profile appears to investors and sellers with the commercial name, sectors, services, and price range. A half profile stays off that list. The NIF, the email, and documents stay off it. A request can name one advisor, or sit in a common inbox until the first advisor on the 39 €/mes plan claims it. The free plan edits the profile and sees the directory. It does not open the inbox or claim.

Hired by an investor, the advisor sees the public ficha and signs their own NDA. The investor's signature does not open the company. After the advisor's NDA, that one company shows the same view that investor can already see, including documents that investor can see. Hired by the seller, there is no NDA with the client. The advisor sees only the folders and the process the seller opens, and not the other investors.

A quote request still does not charge. Closing an engagement stores 15% of what the advisor charges for that work, plus 21% IVA on that 15%. That row is not a Stripe charge and it is not 15% of the company price. The 39 € plan opens Checkout in test mode when the keys are present.

## 2026-10-07 — Decoy figures, Releva drafts, and the waiting step

A locked section renders a full statement and charts filled with 999.999,00 €. The real rows stay off the page, so removing the blur in the browser does not reveal the company. The same sentence and the connect or sign action sit on every locked section. The figures open after the company accepts the connection and the buyer signs the NDA.

Mis documentos keeps Corporativo, Financiero, Comercial, Fiscal, Legal, and RRHH/Laboral, plus Releva. Releva holds the NDA and letter-of-intent drafts as PDFs. Those drafts use “El comprador” and “el proyecto”. They do not include a legal name, CIF, or address.

The current sale step says who has to act. “(TÚ)” appears only for the person viewing the step. A past meeting stays fixed and is marked Hecha. A future proposal is Propuesta, and an accepted future meeting is Próxima.

## 2026-10-07 — NDA before the figures, and the sector treemap

Detailed figures stay blurred until the buyer signs the NDA, and that signature is only offered after the company accepts the connection. The NDA and the letter of intent are generated from the project nickname, the region, and the public price. They do not include the legal name, the CIF, or the address. Signing on the platform records the acceptance. It is not a qualified electronic signature.

A limited plan asks for confirmation and shows how many matches remain this month. An unlimited plan connects immediately.

The investor home sizes sectors with the Arc treemap by published revenue. The Arc tokens stay on that chart so they do not restyle the rest of the app.

The sale steps are Solicitud, Conexión, NDA, Q&A, LOI, Due diligence, Documentación, and Compraventa. Due diligence is where an advisor reviews the shared room. The contract step stays current until the payment is recorded.

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

## 2026-10-10 — Subscription management stays on Releva

Gestionar suscripción opens `/premium/suscripcion`. That page shows the plan, the renewal date, cancel at period end, the billing email, and the invoices. Stripe Customer Portal stays unused, because its address is always `billing.stripe.com`. Changing the card opens Stripe Checkout in setup mode and returns to the same Releva page. Card numbers are not typed into Releva. Quotes stay records.

## 2026-10-07 — Stripe stays on test until the server says live

This replaces the sentence that a live key is ignored. The default mode is test: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Real charges start only when `STRIPE_MODE` is `live` and `STRIPE_LIVE_SECRET_KEY` plus `STRIPE_LIVE_WEBHOOK_SECRET` are set. A live key in the test variable is still ignored. Test and live are two Stripe modes. There is no button in the product that flips them, because one click would charge every later buyer. Quotes stay records. The 1% and 2.5% stay stored rows.

## 2026-09-30 — Click-through validation uses the Cursor IDE browser

This replaces the Playwright MCP. The IDE browser is already connected and can open the app, click, type, and read the page structure. Playwright is not a project MCP. A Playwright test package can wait until a flow is stable.
