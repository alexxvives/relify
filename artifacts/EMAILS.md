# Round P — email inventory

Every outbound message Relify can send today goes through `sendMail` in `src/lib/server/mailer.ts`. Shared HTML/text layout: `src/lib/email/layout.ts`.

**Senders**

- People: `Relify <notificaciones@itsrelify.com>` (`MAIL_FROM`)
- Team inbox writing to itself: `Relify <info@itsrelify.com>` (`senderFor` when `to` is `info@itsrelify.com`)

**Live in prod config:** yes. Production `cloudflare.config.ts` has `MAILEROO_API_KEY` (primary) and the Cloudflare `EMAIL` send_email binding (fallback), plus optional `NOTIFY_EMAIL_WEBHOOK`. Maileroo is the transport that actually goes out when the secret is set.

**INT:** fail-closed unless `INT_MAILEROO_API_KEY` (never `MAILEROO_API_KEY`) and `INT_EMAIL_CATCHALL` are set as Worker secrets on releva-int. Then `sendMail` sends every message only to the catch-all, prefixes `[INT → <original>] `, banners the original recipient in the body, and sets Reply-To to the catch-all. Otherwise it logs `[mail] INT BLOCKED - would send: <tag>` and returns `skipped`. See `docs/INT.md`.

There is no `admin@` address. Internal alerts all go to `info@itsrelify.com` (`SABI_NOTIFY_TO` / `TEAM_INBOX`).

---

## To the user (signed-in person)

| Trigger | Recipient | Sender | Subject | Template | Tag | Prod | INT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Password reset requested | The account email | notificaciones@ | Restablece tu contraseña de Relify | `src/lib/email/messages.ts` `passwordResetEmail` | `password-reset` | Live | Catch-all |
| Sign-up verification | The new account email | notificaciones@ | Confirma tu correo en Relify | `src/lib/email/messages.ts` `verifyEmail` | `verify-email` | Live | Catch-all |
| Onboarding completed (seller) | The new seller | notificaciones@ | Te damos la bienvenida a Relify | `src/lib/email/messages.ts` `welcomeEmail("seller")` | `welcome-seller` | Live | Catch-all |
| Onboarding completed (investor) | The new buyer | notificaciones@ | Te damos la bienvenida a Relify | `welcomeEmail("investor")` | `welcome-investor` | Live | Catch-all |
| Onboarding completed (advisor) | The new advisor | notificaciones@ | Te damos la bienvenida a Relify | `welcomeEmail("advisor")` | `welcome-advisor` | Live | Catch-all |
| Admin clicks “Notificar al vendedor” after SABI | Company owner | notificaciones@ | Tu informe financiero de {legalName} está listo | `reportReadyEmail` | `report-ready` | Live | Catch-all |
| Buyer requests a connection | Company owner (seller or advisor on mandate) | notificaciones@ | Nueva solicitud de conexión en {codename} | `connectionRequestEmail` | `connection-request` | Live | Catch-all |
| New messages in a buyer thread (throttled 6 h / conversation) | Company owner | notificaciones@ | Tienes mensajes nuevos sobre {codename} | `newMessagesEmail` | `new-messages` | Live | Catch-all |
| Seller accepts the connection | The buyer | notificaciones@ | Han aceptado tu solicitud en {codename} | `requestAcceptedEmail` | `request-accepted` | Live | Catch-all |
| Admin publishes the company | Company owner | notificaciones@ | {codename} ya está publicada en Relify | `projectPublishedEmail` | `project-published` | Live | Catch-all |
| Public waitlist signup | The address entered on `/lista-de-espera` | notificaciones@ | Hemos recibido tu solicitud en Relify | `src/lib/waitlist-confirmation-email.ts` | `waitlist-confirmation` | Live | Catch-all |
| Public `/valorar` request | The address entered on the form | notificaciones@ | Hemos recibido tu solicitud de valoración | `src/lib/valuation-request-confirmation-email.ts` | `valuation-request-confirmation` | Live | Catch-all |

Welcome mail is not sent to the admin role. Connection / message / published mail never includes the company’s legal name, CIF or figures when the recipient is a buyer; owner mail may use the legal name only on `report-ready`.

Callers: `src/lib/server/auth.ts`, `src/lib/server/complete-onboarding.ts`, `src/lib/server/notify-report-ready.ts`, `src/lib/server/email-notices.ts`, `src/lib/server/notify-waitlist-lead.ts` (`confirmWaitlistSignup`).

---

## To info@itsrelify.com (team)

| Trigger | Recipient | Sender | Subject | Template | Tag | Prod | INT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seller enters a CIF (new company) | info@ | info@ | SABI pendiente: {legalName} ({cif}) | `src/lib/sabi-request-email.ts` | `sabi-request` | Live | Catch-all |
| Seller submits the company for review | info@ | info@ | Empresa para revisar: {legalName} | `src/lib/publish-request-email.ts` | `publish-request` | Live | Catch-all |
| Seller submits EBITDA adjustments | info@ | info@ | Ajuste de EBITDA: {legalName} | `src/lib/ebitda-adjustment-email.ts` | `ebitda-adjustment` | Live | Catch-all |
| Seller proposes a figure correction | info@ | info@ | Corrección de cifras: {legalName} | `src/lib/figure-correction-email.ts` | `figure-correction` | Live | Catch-all |
| Seller asks to change locked legal name or NIF | info@ | info@ | Solicitud de cambio de {nombre legal\|nif}: {codename} | `src/lib/identity-change-email.ts` | `identity-change` | Live | Catch-all |
| Someone joins the public waitlist | info@ | info@ | Lista de espera: {name} ({role}) | `src/lib/waitlist-lead-email.ts` | `waitlist-lead` | Live | Catch-all |
| Public `/valorar` request | info@ | info@ | Valoración solicitada: {name} ({cif}) | `src/lib/valuation-request-email.ts` | `valuation-request` | Live | Catch-all |

Callers: `notifySabiRequest`, `submitForReview`, `notifyEbitdaAdjustment`, `requestFigureCorrection`, `requestIdentityChange`, `notifyWaitlistLead`, `notifyValuationRequest`.

The EBITDA adjustment mail deliberately omits the owner’s email. SABI / publish / correction / identity / waitlist-lead include the person’s name and email because the team has to act on them.

---

## Not sent by the app

- Stripe Checkout / invoices / receipts (Stripe’s own mail, not `sendMail`).
- No digest, no marketing list, no List-Unsubscribe.

Counts: **12** user-facing templates (welcome is one builder × 3 roles), **7** team alerts. **19** `sendMail` tags.
