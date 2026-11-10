"use server";

import { waitlistCopy, waitlistSchema } from "@/lib/waitlist";
import { clientIp, takeThrottle } from "@/server/emailThrottle";
import { joinWaitlist } from "@/server/joinWaitlist";

export type WaitlistState = { status: "idle" } | { status: "ok" } | { status: "error"; message: string };

export async function joinWaitlistAction(_state: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const parsed = waitlistSchema.safeParse({
    role: formData.get("role"),
    name: formData.get("name"),
    email: formData.get("email"),
    city: formData.get("city") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: waitlistCopy.invalid };
  }

  if (!(await takeThrottle(`waitlist:ip:${await clientIp()}`, 8, 60 * 60, false))) {
    return { status: "error", message: waitlistCopy.throttled };
  }

  const result = await joinWaitlist(parsed.data);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return { status: "ok" };
}
