import { redirect } from "next/navigation";

/**
 * S40 (Alex): the advisor's Inicio moved to /inicio (a neutral home, like /mi-empresa and /inversor for the other
 * roles). Old links and Stripe return URLs keep working: the query (e.g. session_id) rides along.
 */
export default async function LegacyAdvisorHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/inicio?${qs}` : "/inicio");
}
