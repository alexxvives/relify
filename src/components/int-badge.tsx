/**
 * INT environment badge - visible indicator for staging environment.
 * Shows in all pages when INT_ENVIRONMENT=true.
 */
export function IntBadge() {
  // Server-side check
  if (process.env.INT_ENVIRONMENT !== "true") {
    return null;
  }
  
  return (
    <div className="fixed top-2 right-2 z-[100] rounded-md bg-orange-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
      INT
    </div>
  );
}
