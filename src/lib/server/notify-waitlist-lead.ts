import { emailSiteUrl } from "@/lib/env";
import { waitlistConfirmationEmail } from "@/lib/waitlist-confirmation-email";
import { waitlistLeadEmail } from "@/lib/waitlist-lead-email";
import type { WaitlistInput } from "@/lib/waitlist";
import { sendMail } from "@/lib/server/mailer";

/** Tells info@ about a new waitlist row. Never throws: mail must not undo the signup. */
export async function notifyWaitlistLead(input: WaitlistInput): Promise<void> {
  try {
    const adminUrl = new URL("/admin/lista-de-espera", emailSiteUrl()).toString();
    const { to, ...mail } = waitlistLeadEmail({ ...input, adminUrl });
    const result = await sendMail({ to, tag: "waitlist-lead", ...mail });
    if (result.status !== "sent") {
      console.warn(`[mail] waitlist-lead ${result.status}`);
    }
  } catch {
    console.warn("[mail] waitlist-lead could not be sent");
  }
}

/** Tells the person who signed up that the request is in. Never throws. */
export async function confirmWaitlistSignup(input: WaitlistInput): Promise<void> {
  try {
    const { to, ...mail } = waitlistConfirmationEmail({ ...input, siteUrl: emailSiteUrl().origin });
    const result = await sendMail({ to, tag: "waitlist-confirmation", ...mail });
    if (result.status !== "sent") {
      console.warn(`[mail] waitlist-confirmation ${result.status}`);
    }
  } catch {
    console.warn("[mail] waitlist-confirmation could not be sent");
  }
}
