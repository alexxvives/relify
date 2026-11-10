import { SABI_NOTIFY_TO } from "./sabi-request-email";

const MIN_KEY_LENGTH = 10;

export function parseIntEmailAllowlist(raw: string | undefined | null): string[] {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function emailMatchesAllowlist(email: string, allowlist: string[]): boolean {
  const address = email.trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at <= 0 || at === address.length - 1) {
    return false;
  }

  const domain = address.slice(at + 1);
  return allowlist.some((entry) => {
    if (entry.startsWith("@")) {
      return domain === entry.slice(1);
    }
    return address === entry;
  });
}

export function firstAllowlistedAddress(allowlist: string[]): string | null {
  return allowlist.find((entry) => entry.includes("@") && !entry.startsWith("@")) ?? null;
}

export function isTeamInbox(email: string): boolean {
  return email.trim().toLowerCase() === SABI_NOTIFY_TO;
}

/** INT Maileroo key only. Never reads MAILEROO_API_KEY. */
export function intMailerooKey(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.INT_MAILEROO_API_KEY;
  return typeof value === "string" && value.length > MIN_KEY_LENGTH ? value : null;
}

export function intMailConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return intMailerooKey(env) !== null && parseIntEmailAllowlist(env.INT_EMAIL_ALLOWLIST).length > 0;
}

export function prefixIntSubject(subject: string): string {
  const trimmed = subject.trim();
  if (trimmed.startsWith("[INT]")) {
    return trimmed;
  }
  return `[INT] ${trimmed}`;
}

export type IntMailDecision =
  | { send: true; to: string }
  | { send: false; to: string; reason: string };

/**
 * On INT, send only when the INT Maileroo key is present and every recipient
 * matches INT_EMAIL_ALLOWLIST. Team inbox (info@) is redirected to the first
 * exact allowlisted address and is never a destination.
 */
export function decideIntMail(to: string, env: NodeJS.ProcessEnv = process.env): IntMailDecision {
  const allowlist = parseIntEmailAllowlist(env.INT_EMAIL_ALLOWLIST);
  const key = intMailerooKey(env);
  let dest = to.trim();

  if (isTeamInbox(dest)) {
    const redirect = firstAllowlistedAddress(allowlist);
    if (!redirect) {
      return { send: false, to: dest, reason: "no allowlisted address for team inbox" };
    }
    dest = redirect;
  }

  if (!key) {
    return { send: false, to: dest, reason: "missing INT_MAILEROO_API_KEY" };
  }
  if (allowlist.length === 0) {
    return { send: false, to: dest, reason: "empty INT_EMAIL_ALLOWLIST" };
  }
  if (isTeamInbox(dest)) {
    return { send: false, to: dest, reason: "never info@" };
  }
  if (!emailMatchesAllowlist(dest, allowlist)) {
    return { send: false, to: dest, reason: "recipient not allowlisted" };
  }
  return { send: true, to: dest };
}
