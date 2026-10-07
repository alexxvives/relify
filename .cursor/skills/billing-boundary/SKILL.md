---
name: billing-boundary
description: >-
  Keep Releva advisory quotes from charging anyone, and shape later billing.
  Use when working on Solicitar presupuesto, Stripe, Checkout, premium, or
  payouts to advisors.
---

# Billing boundary

`submitAdvisoryQuote` stores a quote and creates a notice. It does not create a Stripe customer, Checkout Session, PaymentIntent, subscription, or transfer. Ser premium is a sidebar link for investors and opens `/premium`. It is absent for sellers and advisors. No price on `/asesoramiento` or `/mis-servicios` is charged.

The billing design is in `docs/DECISIONS.md` (2026-10-05). Buyer plans and the advisor’s extra-company fee go through Stripe Checkout. The 1% and 2.5% success fees are stored rows, not Stripe invoices. Quotes stay records.

## When billing is in scope

1. Read `docs/DECISIONS.md` and the installed Stripe skills (`stripe-best-practices`, `connect-recommend`) before calling Stripe. Look up the API with Context7. Do not invent endpoints from memory.
2. Current charges pay Releva. A later flow where a customer pays an advisor uses Stripe Connect. A quote request stays a separate action from taking payment.
3. Amounts in Postgres stay integer euro cents. Stripe unit amounts use the same cents.
4. Never put a Stripe secret in source, logs, or chat. Keys stay in `.env`.
5. Confirm in the browser that requesting a quote still shows "Hemos registrado tu solicitud de presupuesto." and does not redirect to a payment page unless the task added that step.
