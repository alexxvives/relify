import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { stripeClient } from "@/lib/server/stripe";

// S38/S39: the advisor's deposit goes back once Relify has verified that the
// operation closed or the encargo was cancelled. Admin-only ("Devolver depósito"
// in /admin/facturacion): nothing refunds automatically. One deposit_refund row per
// encargo (unique) plus a Stripe idempotency key, so a retry never refunds twice.

export type DepositRefundReason = "closed" | "cancelled" | "admin";
export type DepositRefundStatus = "pending" | "succeeded" | "failed";
export type DepositRefundResult =
  | { ok: true; status: DepositRefundStatus }
  | { ok: false; code: "unpaid" | "missing" };

export function depositRefundKey(engagementId: string): string {
  return `deposit-refund-${engagementId}`;
}

/** A refund is only (re)tried when none exists or the previous attempt failed. */
export function shouldAttemptRefund(status: DepositRefundStatus | null): boolean {
  return status === null || status === "failed";
}

export async function refundAdvisorDeposit(
  engagementId: string,
  reason: DepositRefundReason,
  requestedById: string | null = null,
): Promise<DepositRefundResult> {
  const row = await prisma.advisoryEngagement.findUnique({
    where: { id: engagementId },
    select: {
      id: true,
      advisorId: true,
      projectId: true,
      depositPaidAt: true,
      depositCents: true,
      depositSessionId: true,
    },
  });

  if (!row) {
    return { ok: false, code: "missing" };
  }

  if (!row.depositPaidAt || !row.depositSessionId || !row.depositCents) {
    return { ok: false, code: "unpaid" };
  }

  const existing = await prisma.depositRefund.findUnique({
    where: { engagementId: row.id },
    select: { id: true, status: true },
  });

  if (existing && !shouldAttemptRefund(existing.status as DepositRefundStatus)) {
    return { ok: true, status: existing.status as DepositRefundStatus };
  }

  const refundId = existing?.id ?? randomUUID();

  if (existing) {
    await prisma.depositRefund.update({
      where: { id: refundId },
      data: { status: "pending", error: null, reason, requestedById },
    });
  } else {
    try {
      await prisma.depositRefund.create({
        data: {
          id: refundId,
          engagementId: row.id,
          advisorId: row.advisorId,
          projectId: row.projectId,
          sessionId: row.depositSessionId,
          amountCents: row.depositCents,
          reason,
          status: "pending",
          requestedById,
        },
      });
    } catch {
      // Another trigger won the unique row: it owns the refund.
      return { ok: true, status: "pending" };
    }
  }

  const status = await sendRefund(refundId, row.id, row.depositSessionId);
  console.info(
    JSON.stringify({ event: "deposit_refund", engagementId: row.id, reason, status }),
  );
  return { ok: true, status };
}

async function sendRefund(
  refundId: string,
  engagementId: string,
  sessionId: string,
): Promise<DepositRefundStatus> {
  const stripe = stripeClient();

  if (!stripe) {
    return failRefund(refundId, "stripe_unavailable");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!intent) {
      return failRefund(refundId, "no_payment_intent");
    }

    const refund = await stripe.refunds.create(
      { payment_intent: intent, metadata: { engagementId, kind: "advisor_deposit" } },
      { idempotencyKey: depositRefundKey(engagementId) },
    );
    const status: DepositRefundStatus =
      refund.status === "failed" || refund.status === "canceled"
        ? "failed"
        : "succeeded";
    await prisma.depositRefund.update({
      where: { id: refundId },
      data: {
        status,
        stripeRefundId: refund.id,
        error: status === "failed" ? (refund.failure_reason ?? refund.status) : null,
      },
    });
    return status;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code
        : "stripe_error";
    // Already refunded on Stripe's side (e.g. by hand in the dashboard).
    if (code === "charge_already_refunded") {
      await prisma.depositRefund.update({
        where: { id: refundId },
        data: { status: "succeeded", error: code },
      });
      return "succeeded";
    }
    console.error(JSON.stringify({ event: "deposit_refund_error", engagementId, code }));
    return failRefund(refundId, code);
  }
}

async function failRefund(refundId: string, error: string): Promise<"failed"> {
  await prisma.depositRefund.update({
    where: { id: refundId },
    data: { status: "failed", error },
  });
  return "failed";
}
