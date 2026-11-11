/** Unhandled route failures share one log line: [error] plus the path. */
export function logRouteError(route: string, error: unknown): void {
  const detail = error instanceof Error ? error.message : "unhandled";
  console.error(`[error] ${route}`, detail);
}
