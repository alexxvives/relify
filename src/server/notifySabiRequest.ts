import { readSiteUrl } from "@/lib/env";
import { SABI_NOTIFY_FROM, sabiRequestEmail } from "@/lib/sabi-request-email";

type SendEmailBinding = {
  send(message: {
    to: string;
    from: { email: string; name?: string };
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ messageId: string }>;
};

/** The Worker's send_email binding (cloudflare.config.ts), absent in tests and plain Node. */
async function emailBinding(): Promise<SendEmailBinding | null> {
  try {
    const workers = await import("cloudflare:workers");
    const binding = (workers.env as Record<string, unknown>).EMAIL as
      SendEmailBinding | undefined;
    return binding && typeof binding.send === "function" ? binding : null;
  } catch {
    return null;
  }
}

export function notifyEmailConfigured(): boolean {
  const hook = process.env.NOTIFY_EMAIL_WEBHOOK;
  return typeof hook === "string" && hook.startsWith("https://");
}

/**
 * Tells the team a seller entered a CIF. Cloudflare Email Sending first, then the optional
 * NOTIFY_EMAIL_WEBHOOK, else skip and log. Never throws: mail must not block onboarding.
 */
export async function notifySabiRequest(input: {
  companyName: string;
  cif: string;
  ownerName: string;
  ownerEmail: string;
  slug: string | null;
}): Promise<"sent" | "skipped" | "failed"> {
  const base = readSiteUrl();
  const adminUrl = new URL(
    input.slug
      ? `/admin/empresas/${input.slug}`
      : "/admin/empresas?sabi=pendiente",
    base,
  ).toString();
  const mail = sabiRequestEmail({ ...input, adminUrl });

  const binding = await emailBinding();
  if (binding) {
    try {
      await binding.send({
        to: mail.to,
        from: SABI_NOTIFY_FROM,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      return "sent";
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "unknown";
      console.warn(
        `[sabi-notify] email binding failed (${code}); trying webhook`,
      );
    }
  }

  const hook = process.env.NOTIFY_EMAIL_WEBHOOK;

  if (typeof hook !== "string" || !hook.startsWith("https://")) {
    console.warn(`[sabi-notify] no email transport; skipped "${mail.subject}"`);
    return binding ? "failed" : "skipped";
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
