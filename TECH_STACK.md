# Tech stack

Installed at the repo root. The resolved versions below are the versions from `package.json`. Do not guess version numbers when this table is updated again.

## Runtime

| Tool | Choice |
| --- | --- |
| Language | TypeScript, `strict` |
| Runtime | Node.js 20 or newer. This machine has Node 24.19.0. |
| Package manager | npm. This machine has npm 11.17.0. Do not switch to pnpm or yarn. |
| App | Next.js App Router, single package at the repo root |
| UI | React Server Components, Tailwind CSS, shadcn/ui copied into the repo. Type and field tokens: `docs/DESIGN-TOKENS.md`. |
| Validation | Zod at every trust boundary |
| Database | PostgreSQL 16 locally in Docker. Production is Neon in Frankfurt, branch `production`, Postgres only. No SQLite. |
| ORM | Prisma |
| Auth | Better Auth, Prisma adapter |
| Lint / types | ESLint and `tsc --noEmit` |
| Tests | Vitest for units. Playwright (`npm run e2e`) for role flows. Click-through checks use the Cursor IDE browser. |

## Commands the app must expose

Add these scripts during scaffolding and keep them green:

| Script | Must run |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with zero errors |
| `npm run test` | Vitest |
| `npm run e2e` | Playwright (desktop 1280 and mobile 390). Needs a running app and `E2E_*` for signed-in flows. |

## Explicitly out of scope until a decision says otherwise

- Monorepo tooling
- A second UI kit, CSS-in-JS, or a global state library
- `next-intl` or any i18n framework
- Redis, a search engine, D1, SQLite, or MongoDB
- OpenNext, Vercel, or a Cloudflare Worker created before the app boots locally

## Deployment

Local: `npm run dev` on Node.

Production: Cloudflare Workers, added with vinext after `npx vinext check` passes. PostgreSQL is Neon in Frankfurt, reached through Hyperdrive. Data-room files go to R2 in a later phase. See `docs/DECISIONS.md`.

## Resolved versions

| Package | Version |
| --- | --- |
| next | 16.3.8 |
| react | 19.2.8 |
| typescript | 5.9.3 |
| tailwindcss | 4.3.3 |
| zod | 4.6.5 |
| stripe | 22.4.0 |
| prisma | 7.10.0 |
| @prisma/client | 7.10.0 |
| better-auth | 1.7.6 |
| eslint | 9.39.5 |
| vitest | 5.0.3 |
| @playwright/test | 1.65.0 |
| @neon/config | 1.8.4 |
| @neon/env | 1.5.1 |

## Environment

Copy `.env.example` to `.env`. Required names:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CONTEXT7_API_KEY` (read by the Context7 MCP, not by the app)
- `STRIPE_SECRET_KEY` (test key; used unless `STRIPE_MODE` is `live`)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MODE` (optional; `live` selects the live pair below, anything else stays on test)
- `STRIPE_LIVE_SECRET_KEY` (only read when `STRIPE_MODE` is `live`)
- `STRIPE_LIVE_WEBHOOK_SECRET` (only read when `STRIPE_MODE` is `live`)
