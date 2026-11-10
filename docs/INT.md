# INT email (releva-int)

INT outbound mail is fail-closed. `sendMail` on `releva-int` does **not** use the production Maileroo key (`MAILEROO_API_KEY`), the Cloudflare `EMAIL` binding, or the original recipient as To/CC/BCC.

To test real emails on INT, Alex must set both of these on the `releva-int` Worker (never on `releva`):

## 1. Secret: `INT_MAILEROO_API_KEY`

A Maileroo API key that is **not** the production `MAILEROO_API_KEY`. Create a separate sending key (or a dedicated INT Maileroo account). Never paste the prod key into INT.

```bash
npx wrangler secret put INT_MAILEROO_API_KEY --name releva-int
```

The pack lists this secret as required. An empty catch-all still blocks every send.

## 2. Var: `INT_EMAIL_CATCHALL`

One address. Every INT email is rewritten to this mailbox. Lists, blanks, and malformed values are treated as missing.

```
INT_EMAIL_CATCHALL=alex@itsrelify.com
```

Set it on the Worker vars for `releva-int` (wrangler dashboard or `[vars]` in the INT pack). The packaged default is empty, so mail stays blocked until you set it.

## What INT mail does

When both vars are set, **every** `sendMail` call (user-facing confirmations and team alerts) is sent **only** to `INT_EMAIL_CATCHALL`:

- To is the catch-all. CC and BCC are never set. The original recipient never appears in To/CC/BCC.
- Subject is prefixed with `[INT → <original recipient>] `.
- A visible banner is inserted at the top of the HTML and text body: `Email de INT. Destinatario original: <email> (<role>, <tag>)`. Role is `equipo` for `info@itsrelify.com` alerts and `usuario` otherwise. Tag is the `OutgoingMail.tag` (for example `valuation-request-confirmation`).
- Reply-To is the catch-all, so a reply stays on INT.
- From still follows `senderFor` on the rewritten To (notificaciones@ for the catch-all).
- The original address may appear in the subject prefix and the body banner. That is the point of the redirect, not a leak into the envelope.

If `INT_MAILEROO_API_KEY` or `INT_EMAIL_CATCHALL` is missing, `sendMail` logs `[mail] INT BLOCKED - would send: <tag>` and returns `skipped`. The user-facing save still succeeds.

## What not to set

- `MAILEROO_API_KEY` on releva-int (ignored; INT never reads it).
- `INT_EMAIL_ALLOWLIST` (removed; catch-all replaced it).
- `INT_EMAIL_ENABLED` (legacy; it does not enable mail).
- Production `EMAIL` send_email binding.

See `src/lib/int-mail.ts` and `src/server/mailer.ts`.
