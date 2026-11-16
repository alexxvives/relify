import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { waitlistCopy, type WaitlistInput } from "@/lib/waitlist";
import { prisma } from "@/lib/db";
import { confirmWaitlistSignup, notifyWaitlistLead } from "@/lib/server/notify-waitlist-lead";

export type WaitlistResult = { ok: true } | { ok: false; message: string };

export async function joinWaitlist(
  input: WaitlistInput,
): Promise<WaitlistResult> {
  try {
    await prisma.waitlistEntry.create({
      data: {
        id: randomUUID(),
        role: input.role,
        name: input.name,
        email: input.email.toLowerCase(),
        city: input.city,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, message: waitlistCopy.taken };
    }

    return { ok: false, message: waitlistCopy.failed };
  }

  await notifyWaitlistLead(input);
  await confirmWaitlistSignup(input);
  return { ok: true };
}
