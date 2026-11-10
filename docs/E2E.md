# Running Playwright E2E

`npm run e2e` runs Playwright against **desktop 1280** and **mobile 390**. Vitest (`npm run test`) is unchanged.

## Local

1. Postgres up, app env in `.env` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000`).
2. `npx playwright install chromium` once per machine.
3. Start the app: `npm run dev` (or `E2E_START_SERVER=1 npm run e2e` to let Playwright boot it).
4. Signed-in flows need accounts in **your environment**, not in git:

```
E2E_BASE_URL=http://localhost:3000
E2E_SELLER_EMAIL=
E2E_SELLER_PASSWORD=
E2E_INVESTOR_EMAIL=
E2E_INVESTOR_PASSWORD=
E2E_ADVISOR_EMAIL=
E2E_ADVISOR_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
```

Without those variables, public specs still run; seller/buyer/advisor/admin specs **skip**.

Do **not** set `E2E_ALLOW_MUTATION=1` unless you intend to write a waitlist or valuation row (and possibly send mail if the INT catch-all is set). Default specs only fill or load forms.

## INT

Point at the INT Worker. INT still blocks Stripe and uploads. Email sends only when `INT_MAILEROO_API_KEY` and `INT_EMAIL_CATCHALL` are set (`docs/INT.md`); otherwise `sendMail` logs `INT BLOCKED`. Use INT test accounts from the operator store, never commit them.

```
E2E_BASE_URL=https://<releva-int-host>
E2E_INT=1
```

Do not run this suite against production. Do not put passwords in the repo, in `docs/`, or in Playwright files.

## Specs

| File | Flow |
| --- | --- |
| `public.spec.ts` | Landing → registro; waitlist form; valorar CIF; `/archivo` 404 |
| `password-reset.spec.ts` | `/olvide-contrasena` |
| `seller.spec.ts` | Sign-in → `/mi-empresa` → detalles autosave surface |
| `buyer.spec.ts` | Mercado → filter → ficha; no identity strings |
| `advisor.spec.ts` | Mandatos + cuenta |
| `admin.spec.ts` | `/admin/empresas`; valorar still has no admin queue |

SABI import, publish, NDA sign, Stripe checkout and admin approve are asserted as **surfaces** (page loads, INT upload copy). Full mutations need `E2E_ALLOW_MUTATION` and a disposable INT account; they are not the default.
