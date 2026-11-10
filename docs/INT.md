# INT email (releva-int)

INT outbound mail is fail-closed. `sendMail` on `releva-int` does **not** use the production Maileroo key (`MAILEROO_API_KEY`), the Cloudflare `EMAIL` binding, or `info@itsrelify.com`.

To test real emails on INT, Alex must set both of these on the `releva-int` Worker (never on `releva`):

## 1. Secret: `INT_MAILEROO_API_KEY`

A Maileroo API key that is **not** the production `MAILEROO_API_KEY`. Create a separate sending key (or a dedicated INT Maileroo account).

```bash
npx wrangler secret put INT_MAILEROO_API_KEY --name releva-int
```

Paste the INT key. Do not paste the production key. The pack lists this secret as required; an empty allowlist still blocks every send.

## 2. Var: `INT_EMAIL_ALLOWLIST`

Comma-separated list of exact addresses and/or `@domain` entries. Every recipient must match or `sendMail` logs `[mail] INT BLOCKED` and skips.

Examples:

```
INT_EMAIL_ALLOWLIST=alex@itsrelify.com
INT_EMAIL_ALLOWLIST=alex@itsrelify.com,@itsrelify.com
```

Set it on the Worker vars for `releva-int` (wrangler dashboard or `[vars]` in the INT pack). The packaged default is empty, so mail stays blocked until you set it.

- Exact address: `alex@itsrelify.com` — only that mailbox.
- Domain: `@itsrelify.com` — any mailbox at that host (not a suffix spoof like `notitsrelify.com`).

## What INT mail does

- Subject is prefixed with `[INT] `.
- Team alerts that would go to `info@itsrelify.com` are redirected to the **first exact address** on the allowlist. Domain-only entries are not used as a redirect target. info@ never receives INT mail.
- Confirmation mail (waitlist, valuation, password reset, …) goes out only if that recipient is on the allowlist. A random `/valorar` visitor on INT will not get mail unless their address is listed.
- Missing key, empty allowlist, or a recipient that does not match → log `INT BLOCKED` and skip. The user-facing save still succeeds.

## What not to set

- `MAILEROO_API_KEY` on releva-int (ignored; INT never reads it).
- `INT_EMAIL_ENABLED` (legacy; it does not enable mail).
- Production `EMAIL` send_email binding.

See `src/lib/int-mail.ts` and `src/server/mailer.ts`.
