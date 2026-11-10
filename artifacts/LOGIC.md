# Round Q — logic audit

Canonical numbers live in `src/lib/billing.ts` and platform agreement point 03.

## Fees (consistent in code)

| Party | Rate | When | Stripe? |
| --- | --- | --- | --- |
| Seller | 5% + IVA | Close (`successFeeFromClose`) | No |
| Buyer | 2.5%, or **2% if `buyerPlanAtMatch === "unlimited"`** (Empresa at **accept**) | Close | No |
| Advisor | 15% of the advisor’s fee + IVA on that 15% | `closeEngagement` | No |
| Buyer plans | 20 € / 99 € + IVA | Subscription | Yes |
| Seller 2nd+ listing | 149 € + IVA | Before `pending` | Yes |
| Advisor inbox | 49 € + IVA | Before deposit | Yes |
| Advisor deposit | 50 € + 0.5% asking, no IVA | Encargo accept | Yes |

`acceptBuyer` stamps `project_access.buyer_plan_at_match` from `billingCustomer.plan` (`none` if missing). Only `"unlimited"` gets 2%. Round Q reconnect now clears that stamp so a cancelled match cannot reuse 2%.

**Not Stripe:** success fees and advisor 15% are recorded rows.

## Inconsistencies (not all code bugs)

| Item | What the code does | Notes |
| --- | --- | --- |
| Docs still say buyer **1%** | Code is 2.5%/2% | `docs/STATUS.md` older bullets, `docs/DECISIONS.md` 2026-10, billing-boundary skill. Live UI/`platform-terms.ts` are 2.5%/2%. Historical STATUS lines left as history. |
| Docs still say advisor inbox **39 €** | Code is **49 €** | Same: historical DECISIONS vs `ADVISOR_INBOX_NET_CENTS`. |
| DECISIONS said `project.buyer_plan_at_match` | Column is on **`project_access`** | Round N decision text. Field is correct in Prisma. |
| `canAcceptMatch` unused at accept | Seller accept does not re-check buyer plan | Intentional comment in `acceptBuyer`: slot was consumed at request. |
| `advisorPublishOutcome` / 149 € advisor listing | `publishClientCompany` always `advisorDoesNotPublish` | Product not wired. Advisors do not publish catalog companies this way. |
| Limited plan card omits 2.5% close fee | Free and Empresa cards mention 2.5%/2% | Copy gap only. |
| NDA vs marketing “nombre” | **Fixed this round** | FAQ + auth stage point. |
| No seller **reject** | Pending request holds a match slot | Product: ignore or wait; cancel only after accept. |
| `ProjectStatus @default(published)` | **Fixed this round** → `draft` | |
| Reconnect leftover plan/LOI | **Fixed this round** | |
| Deposit notice title `"Solicitud aceptada"` | Same title as buyer-accept notice, different body | Dedup key is title+body+href, so two notices still insert. |
| Email coverage | Connection, accept, messages, published: email. NDA/LOI/cancel/advisor: in-app only | Asymmetric, not a contradiction with INT `shouldBlockEmail`. |

## Match states

`requestedAt` → `sellerAcceptedAt` → `ndaAcceptedAt` → messages / `loiAcceptedAt` → `diligencePassedAt`. `cancelledAt` ends the row.

Investor UI: no row = none; acceptedAt null = awaiting-seller; NDA null = “requested” (matched, NDA pending); else accepted. Chat needs seller accept + investor NDA.

## NDA

Buyer signs the deal NDA; seller does not. Advisor hired by an investor signs a separate advisor NDA. Buyer NDA does not reveal legal identity and does not open the data room (`dataRoomReadGate` needs grant + per-file share). Round Q: advisor RSC uses the same figure veil as the buyer until `figuresOpen`.

## Publication

`draft` → seller `publishSellerProject` → `pending` → admin `approveProject` → `published`. Admin unpublish → `draft`. SABI pendiente is a UI chip, not an enum. First listing free; later 149 € + IVA.

## Premium gating

Connect requires `plan !== "none"` + monthly slot (limited = 3). Browse/favorites are free. Advisor encargo needs inbox subscription then deposit. INT: `assertPaymentsEnabled` / `shouldBlockEmail`.

## Notifications

`recordNotification` dedupes unread identical title+body+href. Emails: connection (throttled), new messages (6h/access), buyer accepted, published. INT logs `[mail] INT BLOCKED`.
