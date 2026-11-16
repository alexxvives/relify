import { randomUUID } from "node:crypto";
import { valuationCopy, type ValuationRequestInput } from "@/lib/valuation-request";
import { prisma } from "@/lib/db";
import { confirmValuationRequest, notifyValuationRequest } from "@/lib/server/notify-valuation-request";

export type ValuationRequestResult = { ok: true } | { ok: false; message: string };

export async function createValuationRequest(
  input: ValuationRequestInput,
  userId: string | null,
): Promise<ValuationRequestResult> {
  try {
    await prisma.valuationRequest.create({
      data: {
        id: randomUUID(),
        cif: input.cif,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        phone: input.phone,
        userId,
        status: "received",
      },
    });
  } catch {
    return { ok: false, message: valuationCopy.failed };
  }

  const linkedAccount = userId !== null;
  await notifyValuationRequest({ ...input, linkedAccount });
  await confirmValuationRequest(input);
  return { ok: true };
}
