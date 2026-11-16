# Round Q — Playwright results (local, INT-safe)

Command: `npx playwright test` (desktop-1280 + mobile-390, 1 worker).  
App: `http://localhost:3000`. No `E2E_ALLOW_MUTATION`. No Stripe. No real email.

**20 passed / 0 failed** (final run).

| Flow | Spec | 1280 | 390 | Notes |
| --- | --- | --- | --- | --- |
| Landing → registro | `public.spec.ts` | pass | pass | |
| Waitlist form | `public.spec.ts` | pass | pass | Does not submit unless `E2E_ALLOW_MUTATION=1` |
| Valorar CIF | `public.spec.ts` | pass | pass | Invalid CIF errors; valid CIF is “not saved” |
| `/archivo` 404 | `public.spec.ts` | pass | pass | 404 + CTAs |
| Password reset page | `password-reset.spec.ts` | pass | pass | Load only |
| Seller home/detalles | `seller.spec.ts` | pass | pass | Autosave surface; INT upload not clicked |
| Buyer mercado → ficha | `buyer.spec.ts` | pass | pass | Card overlay click; no Duna/CIF leak |
| Advisor mandatos | `advisor.spec.ts` | pass | pass | |
| Admin empresas + valorar | `admin.spec.ts` | pass | pass | No valorar-request queue (none exists) |

## Bugs found while writing E2E

| Bug | Fix |
| --- | --- |
| Sign-in throttle 20/15m/IP failed mobile after desktop (and earlier retries). Proved the limiter works. | Limit 60/15m/IP; Playwright `workers: 1`. |
| `getByRole('alert')` also matches Next’s route announcer. | Spec uses `getByText`. Not a product bug. |
| Marketplace card `<a>` is a full-bleed overlay (`hidden` to Playwright visibility). | `click({ force: true })`. Product layout, not a defect. |

SABI import, publish, NDA signature, Stripe checkout, admin approve-adjustment are **not** mutated here (INT blocks uploads/payments/email). They are covered as page loads. How to run against INT: `docs/E2E.md`.
