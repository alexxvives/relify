import { emailSiteUrl } from "@/lib/env";
import { waitlistConfirmationEmail } from "@/lib/waitlist-confirmation-email";
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

/** Tells the person who signed up that the request is in. Never throws. */
export async function confirmWaitlistSignup(input: WaitlistInput): Promise<void> {
  try {
    const { to, ...mail } = waitlistConfirmationEmail({ ...input, siteUrl: emailSiteUrl().origin });
    await sendMail({ to, tag: "waitlist-confirmation", notice: true, ...mail });
  } catch {
    console.warn("[mail] waitlist-confirmation could not be sent");
  }
}
