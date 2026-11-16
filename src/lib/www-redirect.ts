export const APEX_HOST = "itsrelify.com";
export const WWW_HOST = "www.itsrelify.com";

/** Map www.itsrelify.com → https://itsrelify.com keeping path and query. */
export function wwwToApexUrl(hostHeader: string | null, pathname: string, search = ""): string | null {
  const host = (hostHeader ?? "").split(":")[0]?.toLowerCase() ?? "";
  if (host !== WWW_HOST) {
    return null;
  }

  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://${APEX_HOST}${path}${search}`;
}

/** Prod-only: skip INT (and any other host that is not www). */
export function wwwRedirectTarget(
  int: boolean,
  hostHeader: string | null,
  pathname: string,
  search = "",
): string | null {
  if (int) {
    return null;
  }
  return wwwToApexUrl(hostHeader, pathname, search);
}
