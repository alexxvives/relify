/**
 * S33: URL and IP checks for "Rellenar con tu web" (pure, unit-tested). The server only fetches public http(s) sites:
 * no credentials in the URL, no odd ports, no IP literals or hostnames that point at private, loopback, link-local,
 * CGNAT, multicast or cloud metadata ranges.
 */

const allowedPorts = new Set(["", "80", "443"]);
const blockedHostSuffixes = [".local", ".localhost", ".internal", ".intranet", ".lan", ".home", ".corp", ".arpa"];

/** Accepts "miempresa.es" or "https://miempresa.es/quienes-somos"; returns a normalised URL or null. */
export function parsePublicSiteUrl(raw: string): URL | null {
  const value = raw.trim();
  if (value === "" || value.length > 300 || /\s/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  if (!allowedPorts.has(url.port)) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host === "" || host === "localhost" || !host.includes(".")) return null;
  if (blockedHostSuffixes.some((suffix) => host.endsWith(suffix))) return null;
  if (host.startsWith("[") || isIpLiteral(host)) {
    // A public IP literal is no company website; refuse every literal so encodings like 0x7f.1 never slip through.
    return null;
  }
  url.hash = "";
  return url;
}

export function isIpLiteral(host: string): boolean {
  return /^[0-9.]+$/.test(host) || /^0x/i.test(host) || host.includes(":");
}

function ipv4Parts(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const numbers = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN));
  return numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) ? numbers : null;
}

/** True for any address the server must never connect to (or anything it cannot parse). */
export function isBlockedAddress(ip: string): boolean {
  const value = ip.trim().toLowerCase();
  const v4 = ipv4Parts(value);
  if (v4) {
    const [a, b] = v4;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (!value.includes(":")) return true;
  const mapped = value.match(/^(?:0*:)*:?ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedAddress(mapped[1]);
  if (value === "::" || value === "::1") return true;
  const first = parseInt(value.split(":")[0] || "0", 16);
  if (Number.isNaN(first)) return true;
  return (
    (first & 0xfe00) === 0xfc00 || // fc00::/7 unique local
    (first & 0xffc0) === 0xfe80 || // fe80::/10 link-local
    (first & 0xff00) === 0xff00 || // multicast
    first === 0x64 || // 64:ff9b::/96 NAT64 can reach IPv4 internals
    first === 0 ||
    value.startsWith("2001:db8")
  );
}

/** Visible text of an HTML page: title, meta description and body text without scripts, styles or markup. */
export function htmlToText(html: string, maxChars = 6000): string {
  const pick = (pattern: RegExp) => html.match(pattern)?.[1]?.trim() ?? "";
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const meta =
    pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|p|div|li|h[1-6]|section|article|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const decode = (text: string) =>
    text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Math.min(Number(code), 0x10ffff)));
  const text = [title, meta, body]
    .map(decode)
    .join("\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  return text.slice(0, maxChars);
}

/** Keeps the model output inside 1000 characters, cut at the last full sentence; strips quotes and headings. */
export function tidyDescription(raw: string, maxChars = 1000): string {
  let text = raw
    .replace(/^\s*(descripci[oó]n|aqu[ií] (tienes|est[aá]))[^:\n]*:\s*/i, "")
    .replace(/[*#`]/g, "")
    .replace(/^["«“]|["»”]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxChars) {
    const cut = text.slice(0, maxChars);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("."));
    text = end > maxChars * 0.5 ? cut.slice(0, end + 1) : cut.trimEnd();
  }
  return text;
}
