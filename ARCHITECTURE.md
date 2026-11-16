# Architecture

The app lives in these directories. Do not invent parallel folders.

Next.js App Router routes stay in `src/app/`. A root `app/` next to `src/` is invalid in Next.js, so this is the top-level routes tree.

```
src/app/                      routes, layouts, route handlers
src/app/api/                  HTTP adapters only
src/components/ui/            shadcn primitives
src/components/<feature>/     feature UI (seller, investor, admin, advisor, auth, shell, landing, public, account, arc)
src/lib/                      shared helpers and Zod schemas
src/lib/client/               browser-only layout helpers
src/lib/server/               auth, domain services (Workers/Node)
src/lib/db/                   Prisma client singleton
tests/unit/                   Vitest (mirrors lib/ and server/)
tests/e2e/                    Playwright + legacy node scripts
scripts/                      INT pack, seeds, deploy guards
docs/                         product docs
prisma/schema.prisma          database schema and migrations
```

Tool configs that must stay at the repo root: `next.config.ts`, `vite.config.ts`, `vitest.config.ts`, `cloudflare.config.ts`, `tsconfig.json`, `eslint.config.mjs`. Playwright lives at `tests/e2e/playwright.config.ts`.

## Request flow

```
Browser
  -> src/app page or route handler
    -> Zod parse of input
    -> src/lib/server service (authz + domain rules)
      -> Prisma (src/lib/db)
```

Route handlers and Server Actions adapt HTTP. They do not contain business rules and they do not call Prisma directly. Services in `src/lib/server` are the only writers of domain invariants.

## State

Server Components fetch data. Client Components hold interaction state only. Do not add Redux, Zustand, or a global store.

## Domain

Relify matches buyers, sellers, and advisors on confidential SME sales.

Public visitors may see:

- Project codename, region, revenue, EBITDA, adjusted EBITDA, asking price
- Marketing pages for sellers, investors, and advisors

Public visitors must not see:

- Legal entity name, CIF, exact address, shareholder names, or data-room files of someone else's company. `/valorar` collects the visitor's own CIF and contact into `valuation_request` (admin-only list). That is not a public catalog field.

Access beyond the public card requires an account, a role check, and a recorded NDA acceptance. Build that gate in the service layer even while the data is still seeded.

Roles: `seller`, `investor`, `advisor`, `admin`.

Money is EUR. Store integers in cents. Format in the UI.

## Product surfaces, in build order

1. App shell and the SEO landing page at `/`
2. Public project index and project detail with locked financials
3. Sign up, sign in, role on the user
4. Seller creates a draft project
5. Investor requests access and accepts an NDA
6. Data room and messages
7. Advisor mandates and billing

Do not start a later surface while an earlier one fails the validation gate in `AGENTS.md`.

Public type and form tokens live in `docs/DESIGN-TOKENS.md` (`--font-sans`, `--font-heading`, `--font-display`, `--field-radius`). Pages must not set their own `font-family`.

## File rules

- One service module per use case, named after the action (`publish-seller-project`, `accept-nda`). Files are kebab-case; TypeScript exports stay camelCase.
- Zod schemas live next to the input they parse, and the inferred type is the only input type.
- Database columns use `snake_case` via Prisma `@map`. TypeScript fields stay `camelCase`.
