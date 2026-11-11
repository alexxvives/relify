import { logRouteError } from "@/lib/route-error";

export function register(): void {
  // Next loads this file so onRequestError is registered.
}

export function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string },
  context: { routePath?: string },
): void {
  const route = context.routePath ?? request.path;
  logRouteError(`${request.method} ${route}`, error);
}
