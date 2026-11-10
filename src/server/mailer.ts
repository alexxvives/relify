import type { RenderedEmail } from "@/lib/email/layout";
import { isIntEnvironment } from "../lib/int-env";
import {
  applyIntCatchallBody,
  decideIntMail,
  intMailBanner,
  intMailerooKey,
  intRecipientRole,
  prefixIntSubject,
} from "../lib/int-mail";
import { sanitizeMailHeader } from "../lib/mail-header";

/** People hear from this address. Team alerts do not: those are the inbox writing to itself. */
export const MAIL_FROM = {
  address: "notificaciones@itsrelify.com",
  name: "Relify",
} as const;
export const TEAM_INBOX = "info@itsrelify.com";

/** Hostinger spam-files mail from notificaciones@ into info@. Alerts use the inbox as sender. */
export function senderFor(to: string): { address: string; name: string } {
  if (to.trim().toLowerCase() === TEAM_INBOX) {
    return { address: TEAM_INBOX, name: "Relify" };
  }
  return MAIL_FROM;
}
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
  /** Defaults to the team inbox. INT catch-all mail sets this to INT_EMAIL_CATCHALL. */
  replyTo?: string;
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
  if (isIntEnvironment()) {
    return intMailerooKey();
  }
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
    const env = workers.env as Record<string, unknown>;
    if (isIntEnvironment()) {
      return readMailerooKey(env.INT_MAILEROO_API_KEY);
    }
    return readMailerooKey(env.MAILEROO_API_KEY);
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
  const from = senderFor(mail.to);
  const replyTo = mail.replyTo?.trim() || TEAM_INBOX;
  const response = await fetch(MAILEROO_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      from: { address: from.address, display_name: from.name },
      to: { address: sanitizeMailHeader(mail.to) },
      reply_to: { address: sanitizeMailHeader(replyTo), display_name: "Relify" },
      subject: sanitizeMailHeader(mail.subject),
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
  let outgoing = mail;
  if (isIntEnvironment()) {
    const decision = decideIntMail(mail.to);
    if (!decision.send) {
      console.log(`[mail] INT BLOCKED - would send: ${mail.tag}`);
      return { status: "skipped", transport: null, referenceId: null };
    }
    const role = intRecipientRole(decision.originalTo);
    const banner = intMailBanner(decision.originalTo, role, mail.tag);
    const body = applyIntCatchallBody(mail.html, mail.text, banner);
    outgoing = {
      ...mail,
      to: decision.to,
      replyTo: decision.to,
      subject: prefixIntSubject(mail.subject, decision.originalTo),
      html: body.html,
      text: body.text,
    };
  }

  if (!isEmail(outgoing.to)) {
    console.warn(`[mail] invalid recipient for ${mail.tag}; skipped`);
    return { status: "skipped", transport: null, referenceId: null };
  }

  const key = await mailerooKeyFromBinding();
  if (key) {
    try {
      const reference = await viaMaileroo(key, outgoing);
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

  if (isIntEnvironment()) {
    console.warn(`[mail] no INT Maileroo transport; skipped ${mail.tag}`);
    return { status: "skipped", transport: null, referenceId: null };
  }

  const binding = await emailBinding();
  if (binding) {
    try {
      const from = senderFor(outgoing.to);
      await binding.send({
        to: sanitizeMailHeader(outgoing.to),
        from: { email: from.address, name: from.name },
        subject: sanitizeMailHeader(outgoing.subject),
        html: outgoing.html,
        text: outgoing.text,
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
          to: sanitizeMailHeader(outgoing.to),
          subject: sanitizeMailHeader(outgoing.subject),
          html: outgoing.html,
          text: outgoing.text,
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
