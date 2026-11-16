# Round Q — security review

Scope: every server action under `src/app/**/actions.ts`, every `route.ts`, NDA identity, session, CSRF, rate limits, uploads, Stripe, email headers, security headers, `npm audit`. No prod DB. No deploys.

**Fix status:** Fixed in this round unless marked residual.

## Severity table

| ID | Sev | Finding | Evidence | Status |
| --- | --- | --- | --- | --- |
| S1 | High | Investor-hired advisor RSC received unveiled years/ratios before advisor+investor NDA (`figuresOpen`). Buyers already went through `buyerProjectView`. | `src/lib/server/advisory-engagement.ts` previously spread `toInvestorProject` + `adjustmentsForBuyer(..., false)` only. | **Fixed.** `advisorProjectView` → `buyerProjectView` when `hiredByInvestor` and not `figuresOpen`. Tests in `report-veil.test.ts`. |
| S2 | Medium | Photo/cover bytes stored as uploaded. EXIF/GPS could identify a premises; `/fotos/[id]` is public for published non-hidden photos. Client `shrink()` was the only strip. | `addProjectPhotos`, `writeProjectCover`. | **Fixed.** Magic-byte sniff + JPEG/PNG/WebP metadata strip in `src/lib/file-bytes.ts`. HTML/SVG rejected. |
| S3 | Medium | Data-room upload trusted the file name and size, not magic bytes. HTML as `.pdf` could be stored. | `storeDataRoomFile`. | **Fixed.** `dataRoomUploadAllowed` extension + magic (PDF `%PDF`, images, ZIP for docx/xlsx, OLE for doc/xls, no NUL/HTML in txt/csv). |
| S4 | Medium | Sign-in had no throttle. Better Auth HTTP `/api/auth/sign-in/email` was still open, so a script could brute-force without the server action. | `src/app/entrar/actions.ts`, `src/lib/server/auth.ts` `disabledPaths`. | **Fixed.** `/sign-in/email` disabled. `signInAction` throttles IP (60/15m) and email hash (10/15m), fail-closed. Signup/reset already throttled; those now fail-closed too. |
| S5 | Medium | Waitlist, contact and newsletter had no rate limit. | `joinWaitlistAction`, `contacto/actions.ts`. `/valorar` has no server write. | **Fixed.** 8/hour/IP, fail-closed. Valorar stays client-only (no endpoint to flood). |
| S6 | Medium | `takeThrottle` failed open on DB errors, so a down `email_throttle` table disabled every limiter. | `src/lib/server/email-throttle.ts`. | **Fixed.** Fourth arg `failOpen`. Mail stays open; auth/public forms pass `false`. |
| S7 | Medium | No app-level CSP / HSTS / frame-ancestors. | `next.config.ts` had no `headers()`. | **Fixed.** `src/lib/security-headers.ts` on `/:path*` (CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy, HSTS, COOP). Next still needs `unsafe-inline`/`unsafe-eval` for hydration. |
| S8 | Low | Seller adjustment download did not require `fileId` in stored JSON (admin path did). Orphan files under the same project were readable. | `readSellerAdjustmentDocument`. | **Fixed.** Same allowlist as admin. |
| S9 | Low | `setProjectPhotoHidden` and `saveSabiDetail` trusted the action layer only. | `project-photos.ts`, `sabi-detail.ts`. | **Fixed.** Admin role inside the service; SABI save requires `ownerId`. |
| S10 | Low | Reconnect after cancel left `buyerPlanAtMatch`, LOI signature/time, `ndaText`. Stale 2% vs 2.5% possible. | `request-project-access.ts`. | **Fixed.** `reconnectAccessReset`. |
| S11 | Low | `ProjectStatus @default(published)` on raw SQL/Prisma creates. | `prisma/schema.prisma`. | **Fixed.** Default `draft`. Migration `20261110210000_project_status_default_draft`. |
| S12 | Low | Email subject/to not stripped of CR/LF (templates are ours, but a future user-controlled subject would inject). | `sendMail`. | **Fixed.** `sanitizeMailHeader`. `isEmail` already rejects `<>`. |
| S13 | Low | Stripe webhook called `syncSubscription` without the INT payment guard (`fulfillCheckout` already had it). | `src/app/api/stripe/webhook/route.ts`. | **Fixed.** `assertPaymentsEnabled` at the route and in `syncSubscription`. INT returns 503. Signature still required when payments are on. |
| S14 | Low | Signed-in `/proyectos/[slug]` metadata lacked `robots: noindex`. | `project-page-access.ts`. | **Fixed.** |
| S15 | Low | Public copy said the NDA opens the company **name**. NDA text and buyer serializers never send razón social/CIF. | `/inversores` FAQ, `auth-copy` stage point. | **Fixed.** Copy matches the product. |
| S16 | Info | `listPublicInbox` had no role check (page used `requireRole("admin")`). | `publicInbox.ts`. | **Fixed.** Service returns empty unless admin. |
| R1 | Residual | CSP still allows `unsafe-inline` / `unsafe-eval` (Next hydration). | `contentSecurityPolicy`. | Residual until nonces. |
| R2 | Residual | `npm audit`: **0 high / 0 critical**. 2 low + 15 moderate in `shadcn`/`vinext`/`eslint-config-next` (deepmerge, fflate, minimatch). `audit fix --force` would break those packages. | `npm audit` 2026-11-10. | Residual. Do not force-upgrade. |
| R3 | Residual | No Redis; rate limits are Postgres `email_throttle`. Fail-closed auth can lock sign-in if the table is down. | Intentional. | Residual. |
| R4 | Residual | Seller gallery `file.type` is still checked as a hint; magic bytes decide storage. INT uploads stay blocked. | `assertUploadsEnabled`. | By design. |
| R5 | Residual | Next server actions CSRF is Origin-based; extra `allowedOrigins` for itsrelify.com. Better Auth cookie CSRF on remaining HTTP routes (`get-session`, `sign-out`). | `next.config.ts`, `auth.ts`. | Acceptable. |
| R6 | Residual | LOI PDF route allows parties before `loiAcceptedAt` if a signed PDF already exists (investor posted an offer). Not cross-tenant. | `acuerdos/loi/[accessId]/route.ts`. | Acceptable. |
| R7 | Residual | Session: cookie cache off; logout deletes the row; `getSession` uses `disableCookieCache`; suspended users are `null`. | `auth-session.ts`, `getCurrentUser.ts`. | OK. |
| R8 | Residual | Secrets: no `NEXT_PUBLIC_` Stripe/Maileroo/Better Auth secrets. Stripe key must be `sk_test_`/`sk_live_`; webhook `whsec_`. | `src/lib/env.ts`, `stripe.ts`. | OK. |
| R9 | Residual | Identity: `publicProjectSelect` / `investorProjectSelect` omit legalName/CIF/address/shareholders. Logged-out `/proyectos` redirects without loading the row. Sitemap has no slugs. `robots.ts` disallows `/proyectos`. NDA does not open the data room. | `confidential-reads` skill + tests. | OK. |

## Authz map (unchanged, verified)

Object IDs (`projectId`, `fileId`, `accessId`, `engagementId`, `contractId`) are bound to `ownerId`, `projectId_investorId`, or engagement parties in the service. Admin mutations double-check `user.role === "admin"`. Stripe `fulfillCheckout` requires `metadata.userId` and listing `ownerId`.

`/valorar` has no API. `/api/auth/*` is Better Auth. `/api/stripe/webhook` is HMAC + INT guard.

## Headers (after)

`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/payment off), `Strict-Transport-Security`, `Cross-Origin-Opener-Policy: same-origin`.
