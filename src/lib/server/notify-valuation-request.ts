import { emailSiteUrl } from "@/lib/env";
import { valuationRequestConfirmationEmail } from "@/lib/valuation-request-confirmation-email";
import { valuationRequestEmail } from "@/lib/valuation-request-email";
import type { ValuationRequestInput } from "@/lib/valuation-request";
import { sendMail } from "@/lib/server/mailer";

/** Tells info@ about a new valuation request. Never throws: mail must not undo the save. */
export async function notifyValuationRequest(input: ValuationRequestInput & { linkedAccount: boolean }): Promise<void> {
  try {
    const adminUrl = new URL("/admin/valoraciones", emailSiteUrl()).toString();
    const { to, ...mail } = valuationRequestEmail({
      cif: input.cif,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      phone: input.phone,
      linkedAccount: input.linkedAccount,
      adminUrl,
    });
    const result = await sendMail({ to, tag: "valuation-request", ...mail });
    if (result.status !== "sent") {
      console.warn(`[mail] valuation-request ${result.status}`);
    }
  } catch {
    console.warn("[mail] valuation-request could not be sent");
  }
}

/** Tells the person who requested the valuation that it is in. Never throws. */
export async function confirmValuationRequest(input: ValuationRequestInput): Promise<void> {
  try {
    const { to, ...mail } = valuationRequestConfirmationEmail({
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      cif: input.cif,
      siteUrl: emailSiteUrl().origin,
    });
    const result = await sendMail({ to, tag: "valuation-request-confirmation", ...mail });
    if (result.status !== "sent") {
      console.warn(`[mail] valuation-request-confirmation ${result.status}`);
    }
  } catch {
    console.warn("[mail] valuation-request-confirmation could not be sent");
  }
}
