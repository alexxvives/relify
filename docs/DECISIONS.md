# Decisions

Change a row only by adding a new dated entry. Do not silently swap libraries.

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

## 2026-09-30 — Click-through validation uses the Cursor IDE browser

This replaces the Playwright MCP. The IDE browser is already connected and can open the app, click, type, and read the page structure. Playwright is not a project MCP. A Playwright test package can wait until a flow is stable.
