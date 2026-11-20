import type { Metadata } from "next";
import { AdvisorEngagementPage, type AdvisorEngagementSearch } from "@/components/advisor/advisor-engagement-page";

export const metadata: Metadata = {
  title: "Encargos",
  robots: { index: false, follow: false },
};

export default async function AdvisorEngagementRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<AdvisorEngagementSearch>;
}) {
  const { id } = await params;
  return <AdvisorEngagementPage id={id} query={await searchParams} section="encargos" />;
}
