import { escapeHtml } from "./email/layout";

const MIN_KEY_LENGTH = 10;
const TEAM_ALERT_ADDRESS = "info@itsrelify.com";
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export type IntRecipientRole = "equipo" | "usuario";

function isSingleEmail(value: string): boolean {
  if (value.includes(",") || value.includes(";")) {
    return false;
  }
  return emailPattern.test(value) && value.length <= 254;
}

/** INT Maileroo key only. Never reads MAILEROO_API_KEY. */
export function intMailerooKey(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.INT_MAILEROO_API_KEY;
  return typeof value === "string" && value.length > MIN_KEY_LENGTH ? value : null;
}

/** One exact address. Lists, blanks, and malformed values are treated as missing. */
export function intEmailCatchall(env: NodeJS.ProcessEnv = process.env): string | null {
  const raw = env.INT_EMAIL_CATCHALL;
  if (typeof raw !== "string") {
    return null;
  }
  const address = raw.trim().toLowerCase();
  if (!isSingleEmail(address)) {
    return null;
  }
  return address;
}

export function intMailConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return intMailerooKey(env) !== null && intEmailCatchall(env) !== null;
}

export function intRecipientRole(originalTo: string): IntRecipientRole {
  return originalTo.trim().toLowerCase() === TEAM_ALERT_ADDRESS ? "equipo" : "usuario";
}

export function prefixIntSubject(subject: string, originalTo: string): string {
  const dest = originalTo.trim();
  const prefix = `[INT → ${dest}] `;
  const trimmed = subject.trim();
  if (trimmed.startsWith("[INT → ")) {
    return trimmed;
  }
  return `${prefix}${trimmed}`;
}

export function intMailBanner(originalTo: string, role: IntRecipientRole, tag: string): {
  text: string;
  html: string;
} {
  const line = `Email de INT. Destinatario original: ${originalTo.trim()} (${role}, ${tag})`;
  return {
    text: `${line}\n\n`,
    html: `<div role="note" style="margin:0 0 16px;padding:12px 16px;border-radius:10px;background:#fff4d6;color:#8a6112;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${escapeHtml(line)}</div>`,
  };
}

export function applyIntCatchallBody(
  html: string,
  text: string,
  banner: { html: string; text: string },
): { html: string; text: string } {
  const withBanner = /<body[^>]*>/i.test(html)
    ? html.replace(/<body([^>]*)>/i, `<body$1>${banner.html}`)
    : `${banner.html}${html}`;
  return { html: withBanner, text: `${banner.text}${text}` };
}

export type IntMailDecision =
  | { send: true; to: string; originalTo: string }
  | { send: false; to: string; reason: string };

/**
 * On INT, every message is rewritten to INT_EMAIL_CATCHALL when the INT Maileroo
 * key is also present. The original address is never a To/CC/BCC destination.
 */
export function decideIntMail(to: string, env: NodeJS.ProcessEnv = process.env): IntMailDecision {
  const originalTo = to.trim();
  const key = intMailerooKey(env);
  const catchall = intEmailCatchall(env);

  if (!key) {
    return { send: false, to: originalTo, reason: "missing INT_MAILEROO_API_KEY" };
  }
  if (!catchall) {
    return { send: false, to: originalTo, reason: "missing INT_EMAIL_CATCHALL" };
  }
  return { send: true, to: catchall, originalTo };
}
