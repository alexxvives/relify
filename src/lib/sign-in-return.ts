const maxLength = 200;
const pathPattern = /^\/[a-zA-Z0-9/_-]*$/;

/** Same-origin path only. Rejects protocol-relative, traversal, and query strings. */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }

  let value = raw.trim();

  if (value.length === 0 || value.length > maxLength) {
    return null;
  }

  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return null;
  }

  if (value.includes("..")) {
    return null;
  }

  if (!pathPattern.test(value)) {
    return null;
  }

  return value;
}

export function signInHref(returnPath: string): string {
  const next = safeReturnPath(returnPath);

  if (!next) {
    return "/entrar";
  }

  return `/entrar?siguiente=${encodeURIComponent(next)}`;
}
