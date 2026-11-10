# Round P — email inventory

Every outbound message Relify can send today goes through `sendMail` in `src/server/mailer.ts`. Shared HTML/text layout: `src/lib/email/layout.ts`.

**Senders**

- People: `Relify <notificaciones@itsrelify.com>` (`MAIL_FROM`)
- Team inbox writing to itself: `Relify <info@itsrelify.com>` (`senderFor` when `to` is `info@itsrelify.com`)

**Live in prod config:** yes. Production `cloudflare.config.ts` has `MAILEROO_API_KEY` (primary) and the Cloudflare `EMAIL` send_email binding (fallback), plus optional `NOTIFY_EMAIL_WEBHOOK`. Maileroo is the transport that actually goes out when the secret is set.

**INT blocks it:** yes, all of them. `shouldBlockEmail()` is `isIntEnvironment()`. INT `sendMail` logs `[mail] INT BLOCKED - would send: <tag>` and returns `skipped`. INT Worker config (`cloudflare.int.config.ts`) also has no Maileroo key and no EMAIL binding.

There is no `admin@` address. Internal alerts all go to `info@itsrelify.com` (`SABI_NOTIFY_TO` / `TEAM_INBOX`).

---

## To the user (signed-in person)

| Trigger | Recipient | Sender | Subject | Template | Tag | Prod | INT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Password reset requested | The account email | notificaciones@ | Restablece tu contraseña de Relify | `src/lib/email/messages.ts` `passwordResetEmail` | `password-reset` | Live | Blocked |
| Sign-up verification | The new account email | notificaciones@ | Confirma tu correo en Relify | `src/lib/email/messages.ts` `verifyEmail` | `verify-email` | Live | Blocked |
| Onboarding completed (seller) | The new seller | notificaciones@ | Te damos la bienvenida a Relify | `src/lib/email/messages.ts` `welcomeEmail("seller")` | `welcome-seller` | Live | Blocked |
| Onboarding completed (investor) | The new buyer | notificaciones@ | Te damos la bienvenida a Relify | `welcomeEmail("investor")` | `welcome-investor` | Live | Blocked |
| Onboarding completed (advisor) | The new advisor | notificaciones@ | Te damos la bienvenida a Relify | `welcomeEmail("advisor")` | `welcome-advisor` | Live | Blocked |
| Admin clicks “Notificar al vendedor” after SABI | Company owner | notificaciones@ | Tu informe financiero de {legalName} está listo | `reportReadyEmail` | `report-ready` | Live | Blocked |
| Buyer requests a connection | Company owner (seller or advisor on mandate) | notificaciones@ | Nueva solicitud de conexión en {codename} | `connectionRequestEmail` | `connection-request` | Live | Blocked |
| New messages in a buyer thread (throttled 6 h / conversation) | Company owner | notificaciones@ | Tienes mensajes nuevos sobre {codename} | `newMessagesEmail` | `new-messages` | Live | Blocked |
| Seller accepts the connection | The buyer | notificaciones@ | Han aceptado tu solicitud en {codename} | `requestAcceptedEmail` | `request-accepted` | Live | Blocked |
| Admin publishes the company | Company owner | notificaciones@ | {codename} ya está publicada en Relify | `projectPublishedEmail` | `project-published` | Live | Blocked |
| Public waitlist signup | The address entered on `/lista-de-espera` | notificaciones@ | Hemos recibido tu solicitud en Relify | `src/lib/waitlist-confirmation-email.ts` | `waitlist-confirmation` | Live | Blocked |

Welcome mail is not sent to the admin role. Connection / message / published mail never includes the company’s legal name, CIF or figures when the recipient is a buyer; owner mail may use the legal name only on `report-ready`.

Callers: `src/server/auth.ts`, `src/server/completeOnboarding.ts`, `src/server/notifyReportReady.ts`, `src/server/emailNotices.ts`, `src/server/notifyWaitlistLead.ts` (`confirmWaitlistSignup`).

---

## To info@itsrelify.com (team)

| Trigger | Recipient | Sender | Subject | Template | Tag | Prod | INT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seller enters a CIF (new company) | info@ | info@ | SABI pendiente: {legalName} ({cif}) | `src/lib/sabi-request-email.ts` | `sabi-request` | Live | Blocked |
| Seller submits the company for review | info@ | info@ | Empresa para revisar: {legalName} | `src/lib/publish-request-email.ts` | `publish-request` | Live | Blocked |
| Seller submits EBITDA adjustments | info@ | info@ | Ajuste de EBITDA: {legalName} | `src/lib/ebitda-adjustment-email.ts` | `ebitda-adjustment` | Live | Blocked |
| Seller proposes a figure correction | info@ | info@ | Corrección de cifras: {legalName} | `src/lib/figure-correction-email.ts` | `figure-correction` | Live | Blocked |
| Seller asks to change locked legal name or NIF | info@ | info@ | Solicitud de cambio de {nombre legal\|nif}: {codename} | `src/lib/identity-change-email.ts` | `identity-change` | Live | Blocked |
| Someone joins the public waitlist | info@ | info@ | Lista de espera: {name} ({role}) | `src/lib/waitlist-lead-email.ts` | `waitlist-lead` | Live | Blocked |

Callers: `notifySabiRequest`, `submitForReview`, `notifyEbitdaAdjustment`, `requestFigureCorrection`, `requestIdentityChange`, `notifyWaitlistLead`.

The EBITDA adjustment mail deliberately omits the owner’s email. SABI / publish / correction / identity / waitlist-lead include the person’s name and email because the team has to act on them.

---

## Not sent by the app

- Stripe Checkout / invoices / receipts (Stripe’s own mail, not `sendMail`).
- `/valorar` does not send anything.
- No digest, no marketing list, no List-Unsubscribe.

Counts: **11** user-facing templates (welcome is one builder × 3 roles), **6** team alerts. **17** `sendMail` tags.
