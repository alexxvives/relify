import { emailSiteUrl } from "@/lib/env";
import { sabiRequestEmail } from "@/lib/sabi-request-email";
import { sendMail } from "@/server/mailer";

/**
 * Tells the team a seller entered a CIF. t73b: through the shared mailer (Maileroo first,
 * then the EMAIL binding, then NOTIFY_EMAIL_WEBHOOK). Never throws: mail must not block onboarding.
 */
export async function notifySabiRequest(input: {
  companyName: string;
  cif: string;
  ownerName: string;
  ownerEmail: string;
  slug: string | null;
}): Promise<"sent" | "skipped" | "failed"> {
  const adminUrl = new URL(
    input.slug
      ? `/admin/empresas/${input.slug}`
      : "/admin/empresas?sabi=pendiente",
    emailSiteUrl(),
  ).toString();
  const { to, ...mail } = sabiRequestEmail({ ...input, adminUrl });
  const result = await sendMail({ to, tag: "sabi-request", ...mail });
  return result.status;
}
