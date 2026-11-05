import { emailSiteUrl } from "@/lib/env";
import { waitlistLeadEmail } from "@/lib/waitlist-lead-email";
import type { WaitlistInput } from "@/lib/waitlist";
import { sendMail } from "@/server/mailer";

/** Tells info@ about a new waitlist row. Never throws: mail must not undo the signup. */
export async function notifyWaitlistLead(input: WaitlistInput): Promise<void> {
  try {
    const adminUrl = new URL("/admin/lista-de-espera", emailSiteUrl()).toString();
    const { to, ...mail } = waitlistLeadEmail({ ...input, adminUrl });
    await sendMail({ to, tag: "waitlist-lead", ...mail });
  } catch {
    console.warn("[mail] waitlist-lead could not be sent");
  }
}
