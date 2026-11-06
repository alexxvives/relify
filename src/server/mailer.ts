import type { RenderedEmail } from "@/lib/email/layout";

/** t73b: every outgoing email leaves from this one sender on the verified itsrelify.com domain. */
export const MAIL_FROM = {
  address: "notificaciones@itsrelify.com",
  name: "Relify",
} as const;
export const TEAM_INBOX = "info@itsrelify.com";
const MAILEROO_URL = "https://smtp.maileroo.com/api/v2/emails";

export type MailResult =
  | {
      status: "sent";
      transport: "maileroo" | "binding" | "webhook";
      referenceId: string | null;
    }
  | { status: "skipped" | "failed"; transport: null; referenceId: null };

export type OutgoingMail = RenderedEmail & {
  to: string;
  /** Short tag for logs and Maileroo tags, e.g. "password-reset". Never personal data. */
  tag: string;
};

type SendEmailBinding = {
  send(message: {
    to: string;
    from: { email: string; name?: string };
    subject: string;
    html?: string;
    text?: string;
  }): Promise<unknown>;
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

function readMailerooKey(value: unknown): string | null {
  return typeof value === "string" && value.length > 10 ? value : null;
}

function mailerooKey(): string | null {
  return readMailerooKey(process.env.MAILEROO_API_KEY);
}

/** Worker secrets are also on the EMAIL-style binding object. process.env is the usual path. */
async function mailerooKeyFromBinding(): Promise<string | null> {
  const fromProcess = mailerooKey();
  if (fromProcess) {
    return fromProcess;
  }

  try {
    const workers = await import("cloudflare:workers");
    return readMailerooKey((workers.env as Record<string, unknown>).MAILEROO_API_KEY);
  } catch {
    return null;
  }
}

export function mailConfigured(): boolean {
  return mailerooKey() !== null;
}

function isEmail(value: string): boolean {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) && value.length <= 254;
}

async function viaMaileroo(
  key: string,
  mail: OutgoingMail,
): Promise<string | null | false> {
  const response = await fetch(MAILEROO_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      from: { address: MAIL_FROM.address, display_name: MAIL_FROM.name },
      to: { address: mail.to },
      reply_to: { address: TEAM_INBOX, display_name: "Relify" },
      subject: mail.subject.slice(0, 255),
      html: mail.html,
      plain: mail.text,
      tracking: false,
      tags: { type: mail.tag },
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: { reference_id?: string };
  } | null;
  if (!response.ok || !body?.success) {
    console.warn(
      `[mail] maileroo rejected ${mail.tag} (${response.status}: ${body?.message ?? "no body"})`,
    );
    return false;
  }
  return body.data?.reference_id ?? null;
}

/**
 * Sends one email. Maileroo first, then the Cloudflare send_email binding, then the optional
 * NOTIFY_EMAIL_WEBHOOK. Never throws: a mail problem is logged and must not break the user flow.
 * Logs carry the tag and status only, never the address or the body.
 */
export async function sendMail(mail: OutgoingMail): Promise<MailResult> {
  if (!isEmail(mail.to)) {
    console.warn(`[mail] invalid recipient for ${mail.tag}; skipped`);
    return { status: "skipped", transport: null, referenceId: null };
  }

  const key = await mailerooKeyFromBinding();
  if (key) {
    try {
      const reference = await viaMaileroo(key, mail);
      if (reference !== false) {
        return {
          status: "sent",
          transport: "maileroo",
          referenceId: reference,
        };
      }
    } catch {
      console.warn(`[mail] maileroo unreachable for ${mail.tag}`);
    }
  }

  const binding = await emailBinding();
  if (binding) {
    try {
      await binding.send({
        to: mail.to,
        from: { email: MAIL_FROM.address, name: MAIL_FROM.name },
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      return { status: "sent", transport: "binding", referenceId: null };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "unknown";
      console.warn(`[mail] email binding failed for ${mail.tag} (${code})`);
    }
  }

  const hook = process.env.NOTIFY_EMAIL_WEBHOOK;
  if (typeof hook === "string" && hook.startsWith("https://")) {
    try {
      const response = await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: mail.to,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
      });
      if (response.ok) {
        return { status: "sent", transport: "webhook", referenceId: null };
      }
      console.warn(
        `[mail] webhook answered ${response.status} for ${mail.tag}`,
      );
    } catch {
      console.warn(`[mail] webhook unreachable for ${mail.tag}`);
    }
  }

  const tried = key !== null || binding !== null;
  if (!tried) {
    console.warn(`[mail] no transport configured; skipped ${mail.tag}`);
  }
  return {
    status: tried ? "failed" : "skipped",
    transport: null,
    referenceId: null,
  };
}
