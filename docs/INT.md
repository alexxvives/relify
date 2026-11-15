# INT email (releva-int)

INT outbound mail is fail-closed. `sendMail` on `releva-int` does **not** use the production Maileroo key (`MAILEROO_API_KEY`), the Cloudflare `EMAIL` binding, or the original recipient as To/CC/BCC.

To test real emails on INT, Alex must set both of these as **Worker secrets** on `releva-int` (never on `releva`, never as `[vars]` in the INT pack):

## 1. Secret: `INT_MAILEROO_API_KEY`

A Maileroo API key that is **not** the production `MAILEROO_API_KEY`. Create a separate sending key (or a dedicated INT Maileroo account). Never paste the prod key into INT.

```bash
npx wrangler secret put INT_MAILEROO_API_KEY --name releva-int
```

## 2. Secret: `INT_EMAIL_CATCHALL`

One address. Every INT email is rewritten to this mailbox. Lists, blanks, and malformed values are treated as missing.

```bash
npx wrangler secret put INT_EMAIL_CATCHALL --name releva-int
```

Do **not** put `INT_EMAIL_CATCHALL` in Worker `[vars]` or in the packaged `wrangler.toml`. An empty packaged var overwrites the dashboard value even with `--keep-vars`. If an earlier pack already wrote it as a var, delete that var on `releva-int` so the secret is what `sendMail` reads.

The pack lists both secrets as required. Until they are set, mail stays blocked.

## What INT mail does

When both secrets are set, **every** `sendMail` call (user-facing confirmations and team alerts) is sent **only** to `INT_EMAIL_CATCHALL`:

- To is the catch-all. CC and BCC are never set. The original recipient never appears in To/CC/BCC.
- Subject is prefixed with `[INT → <original recipient>] `.
- A visible banner is inserted at the top of the HTML and text body: `Email de INT. Destinatario original: <email> (<role>, <tag>)`. Role is `equipo` for `info@itsrelify.com` alerts and `usuario` otherwise. Tag is the `OutgoingMail.tag` (for example `valuation-request-confirmation`).
- Reply-To is the catch-all, so a reply stays on INT.
- From is always `info@itsrelify.com` on INT (`senderFor` ignores the rewritten To). Prod still uses `info@` for team alerts and `notificaciones@itsrelify.com` for people.
- The original address may appear in the subject prefix and the body banner. That is the point of the redirect, not a leak into the envelope.

If `INT_MAILEROO_API_KEY` or `INT_EMAIL_CATCHALL` is missing, `sendMail` logs `[mail] INT BLOCKED - would send: <tag>` and returns `skipped`. The user-facing save still succeeds.

## What not to set

- `MAILEROO_API_KEY` on releva-int (ignored; INT never reads it).
- `INT_EMAIL_CATCHALL` as a Worker **var** (use `wrangler secret put`).
- `INT_EMAIL_ALLOWLIST` (removed; catch-all replaced it).
- `INT_EMAIL_ENABLED` (legacy; it does not enable mail).
- Production `EMAIL` send_email binding.

See `src/lib/int-mail.ts` and `src/lib/server/mailer.ts`.

## Data-room uploads (isolated)

INT uploads are on. They never use production R2.

Create this bucket **before** the first INT deploy that should store files (do not bind a prod bucket):

```bash
npx wrangler r2 bucket create releva-int-uploads
```

The INT pack binds `INT_UPLOADS` → `releva-int-uploads`. Object keys are `int/<file-id>`. Local fallback is `data/data-room/int`. Size cap 20 MB and the existing type allowlist stay. There is no `INT_UPLOADS_ENABLED` flag.

## Stripe TEST (optional)

INT payments stay off unless Alex sets TEST keys on `releva-int` (never production `STRIPE_*`, never live prefixes). Secret vs var:

```bash
npx wrangler secret put INT_STRIPE_SECRET_KEY --name releva-int
npx wrangler secret put INT_STRIPE_WEBHOOK_SECRET --name releva-int
# publishable is a plain Worker var (Dashboard → Variables, or wrangler versions secret is wrong):
npx wrangler versions upload …   # do not bake an empty pk into the pack
```

Set `INT_STRIPE_PUBLISHABLE_KEY` as a **variable** on the `releva-int` Worker (not `wrangler secret put`). The pack does not include it.

`INT_STRIPE_SECRET_KEY` must be `sk_test_` or `rk_test_`. `INT_STRIPE_WEBHOOK_SECRET` must be `whsec_`. Live prefixes (`sk_live_` / `pk_live_` / `rk_live_`) log `[error] stripe INT refused…` and keep payments disabled. INT never reads `STRIPE_SECRET_KEY`.

Webhook endpoint on the INT worker:

`https://releva-int.<account>.workers.dev/api/stripe/webhook`

Subscribe these TEST events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

Bootstrap TEST Products/Prices (refuses live keys):

`STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-bootstrap-test.mjs`

Point a Stripe TEST webhook at that path and paste the signing secret into `INT_STRIPE_WEBHOOK_SECRET`. Checkout shows **Modo prueba**. Unset keys leave payments disabled.

## Analytics

Do **not** set `GTM_CONTAINER_ID`, `NEXT_PUBLIC_GTM_CONTAINER_ID`, `GA_MEASUREMENT_ID` or `NEXT_PUBLIC_GA_MEASUREMENT_ID` on `releva-int`. Without a `GTM-…` or `G-…` id, Tag Manager and Analytics 4 do not load. Layout also skips GTM/GA when `INT_ENVIRONMENT=true`. Prod gets `GTM_CONTAINER_ID=GTM-KMZ4Z9PZ` at prod deploy (Consent Mode v2 Advanced: `gtm.js` in `<head>`, cookieless until Aceptar).
