import { readSiteUrl } from "@/lib/env";
import { sabiRequestEmail } from "@/lib/sabi-request-email";

export function notifyEmailConfigured(): boolean {
  const hook = process.env.NOTIFY_EMAIL_WEBHOOK;
  return typeof hook === "string" && hook.startsWith("https://");
}

/**
 * Tells the team a seller entered a CIF. Never throws: a missing or failing
 * webhook must not block the seller's onboarding.
 */
export async function notifySabiRequest(input: {
  companyName: string;
  cif: string;
  ownerName: string;
  ownerEmail: string;
  slug: string | null;
}): Promise<"sent" | "skipped" | "failed"> {
  const base = readSiteUrl();
  const adminUrl = new URL(input.slug ? `/admin/empresas/${input.slug}` : "/admin/empresas?sabi=pendiente", base).toString();
  const mail = sabiRequestEmail({ ...input, adminUrl });
  const hook = process.env.NOTIFY_EMAIL_WEBHOOK;

  if (typeof hook !== "string" || !hook.startsWith("https://")) {
    console.warn(`[sabi-notify] NOTIFY_EMAIL_WEBHOOK not set; skipped "${mail.subject}"`);
    return "skipped";
  }

  try {
    const response = await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mail),
    });
    if (!response.ok) {
      console.warn(`[sabi-notify] webhook answered ${response.status}`);
      return "failed";
    }
    return "sent";
  } catch {
    console.warn("[sabi-notify] webhook unreachable");
    return "failed";
  }
}
