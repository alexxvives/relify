import { welcomeNotice } from "@/lib/notifications";
import { recordNotification } from "@/lib/server/record-notification";

/**
 * S31 (Alex): every new account (any role; the role is picked later in onboarding) starts with one welcome notice in
 * Avisos. Runs from the better-auth user.create hook. A failure here never blocks the sign-up.
 */
export async function recordWelcomeNotice(userId: string): Promise<void> {
  try {
    await recordNotification({ userId, title: welcomeNotice.title, body: welcomeNotice.body, href: welcomeNotice.href });
  } catch (error) {
    console.error("welcome notice failed", error instanceof Error ? error.message : "unknown error");
  }
}
