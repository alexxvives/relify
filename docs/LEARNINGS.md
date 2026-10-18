# Learnings

Append-only. One line per project-specific pitfall:

`- YYYY-MM-DD: symptom — cause — what to do next time`

## Entries

- 2026-09-30: Shell commands failed with no exit status — the workspace directory did not exist yet, so the shell had no working directory — create the repo folder before any terminal call.
- 2026-09-30: `docker compose up` could not reach the engine — Docker Desktop was installed but not running — start Docker Desktop before Compose.
- 2026-09-30: `next dev` appended a Next.js block to `AGENTS.md` — `agentRules` defaults to true and writes that file — set `agentRules: false` in `next.config.ts` and keep the project instructions.
- 2026-09-30: `prisma.project` was undefined after a new model — `next dev` kept the global Prisma client created before `prisma generate` — restart `npm run dev` after generating the client.
- 2026-10-01: sign-in sent every role to `/cuenta` — `getSession` in that same server action does not see the cookie Better Auth just set — read the stored role from the database after `signInEmail`, then redirect.
- 2026-10-01: Vitest reported `Cannot find package '@/lib/...'` — the test runner does not apply `tsconfig` paths — import sibling modules with relative paths in any file a unit test loads.
- 2026-10-01: PrismaClientValidationError Unknown field after `prisma generate` — `next dev` kept the global client and a stale `.next` cache — stop the dev server, delete `.next`, then start it again.
- 2026-10-04: the path pointer stayed on the first card outside Cursor — a reduced-motion setting turns CSS animation off, and the Cursor browser does not use that setting — move that pointer in JavaScript, and fade the step card with a transition that the reduced-motion rule does not cancel.
- 2026-10-04: a new hero reel stayed still in the Cursor browser — that browser does match `prefers-reduced-motion`, and the reduce block sets `animation: none` — leave landing motion out of that block when it has to stay visible.
- 2026-10-04: euro figures inside a client component hydrated with a mismatch — `Intl` currency spacing differs between the server render and the browser — format euros in the server component and pass the finished strings.
- 2026-10-05: `npm install` failed with ERESOLVE on `react-server-dom-webpack` — the existing vinext and React peers already conflict — install a new package with `--legacy-peer-deps`.
- 2026-10-06: `react-hooks/set-state-in-effect` fails when an effect copies sessionStorage into state — keep a visit-only preview in component state — do not call setState inside that effect.
- 2026-10-06: `next/image` rejects a seller photo data URL — the ficha preview uses a plain `img` with one eslint exception — do not pass those bytes to `Image`.
- 2026-10-07: Cloudflare `npm clean-install` failed with ERESOLVE on `react-server-dom-webpack` — Workers Builds does not pass `--legacy-peer-deps` — keep `legacy-peer-deps=true` in `.npmrc`.
- 2026-10-07: the Worker build could not load `@/generated/prisma/client` — that client is gitignored and Cloudflare skips Prisma's install script — generate it at the start of `vite build`.
- 2026-10-07: `tsc` rejects `createAuth(): Auth` when `Auth` is `ReturnType<typeof betterAuth>` — the specific options return is not the generic Better Auth type — infer `Auth` from `ReturnType<typeof createAuth>`.
- 2026-10-07: importing Arc `foundation.css` restyles Costa — that file sets `:root` tokens the app already uses — scope them to `.arc-scope` and do not keep its global focus rules.
- 2026-10-08: renaming a demo data-room file returned "sin barras ni rutas" — seed file ids are `demo-cala-file-N`, not UUIDs — accept that id shape in `renameDataRoomFileSchema`.
- 2026-10-09: Ctrl+Z did nothing in the ficha euro fields — `groupedEuro` rewrote the input on every keystroke, and Chrome drops the undo stack when the controlled value is not the typed text — show the raw value while that field is focused.
- 2026-10-09: Better Auth logged `Invalid findFirst` while entering the platform — Postgres was stopped and the log cuts off the cause — start Docker and confirm a query answers before changing the auth adapter.
- 2026-10-12: semibold labels used another family than the body — a failed Google Fonts download left only the Arial fallback, and that face matches weight 400 — request 400, 500, 600, and 700 on DM Sans so those weights stay in the family.
- 2026-10-12: the deposit toast hydrated the company grid — `AppToast` returned null on the server because `document` was missing and a portal on the client — portal only after hydration, with `useSyncExternalStore`. A button inside a heading does the same: the browser lifts it out, so a hint inside an `h2` stays a focusable span.
- 2026-10-15: the Worker threw `Wasm code generation disallowed by embedder` on every Prisma query — the Node client compiles the query compiler at runtime — generate a second client with `runtime = "cloudflare"` and alias it only in the vinext build.
- 2026-10-15: deployed sign-in returned `e is not a function` — the workerd export of `@better-auth/utils/password` calls `node:crypto` scrypt, and `toNextJsHandler` calls the auth proxy when `"handler" in auth` is false — alias the noble password build in vite, and add a `has` trap on the auth proxy.
- 2026-10-18: sign-in showed Invalid user.findUnique and the overlay cut the cause — Postgres was stopped (ECONNREFUSED) — start Docker before changing the query, and keep that lookup inside the sign-in try so a down database returns the Spanish failure.
- 2026-10-15: the seller home was canceled as a hung Worker after sign-in — one `Promise.all` opened more Postgres sockets than Workers will finish — load that page one query after another.
