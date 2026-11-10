# Relify

Confidential marketplace for buying and selling SME businesses. Public pages look like Deale: anonymized project cards, not a classifieds table. BizBuySell is a product reference only.

## Session start

1. Read `docs/STATUS.md`. If a behavior is missing there, check `git log` before assuming it was never built.
2. Read the latest entries in `docs/LEARNINGS.md`.
3. Read `docs/DESIGN.md` before any UI change. Color, type, and which component to reuse live there, and the tokens live in `src/app/globals.css`.
4. Read `TECH_STACK.md` and `ARCHITECTURE.md` before adding a dependency or a new directory.

## Definition of done

A task is finished only when all of these are true:

- `npm run typecheck` and `npm run lint` were run in the terminal and both exited 0.
- UI, routing, or rendered-data changes were clicked through in the Cursor IDE browser.
- `docs/STATUS.md` matches what is actually on disk.
- No extra dependency, page, or abstraction was added beyond the task.
- That task is committed and pushed to `origin` (`https://github.com/alexxvives/releva.git`). One commit when the task is finished. Do not push every edit.

If a check script does not exist yet, the task is not done.

## Hard rules

- One Next.js app. Do not create a monorepo, a second package, or a new framework.
- Dependencies and product decisions change only through `docs/DECISIONS.md`.
- Before calling a library API that this repo does not already use, look it up with the Context7 MCP. Do not invent APIs from memory.
- Never commit secrets. Never print `.env` values into chat, logs, or source.
- Never deploy to production. Only Alex deploys to prod after validating in INT. Do not run `npm run deploy`, `npm run deploy:vinext`, `vinext-cloudflare deploy`, or `wrangler deploy`.
- Shell is Windows PowerShell. Do not use bash heredocs or `export`.

## Where things live

| Concern | File |
| --- | --- |
| Libraries and commands | `TECH_STACK.md` |
| Directories and domain rules | `ARCHITECTURE.md` |
| What is built right now | `docs/STATUS.md` |
| Why a choice was made | `docs/DECISIONS.md` |
| Pitfalls already paid for | `docs/LEARNINGS.md` |
| Color, type, and which component to reuse | `docs/DESIGN.md` |
| Public landing copy | `docs/LANDING.md` |
