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
- 2026-10-03: the public header HTML stayed on the old ink bar after the server component changed — `next dev` kept a stale server render and mixed it with the new client nav — restart `npm run dev` before checking the page.
