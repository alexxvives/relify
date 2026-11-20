import type { Metadata } from "next";
import { advisorCopy } from "@/lib/advisor-copy";
import { AdvisorEngagementPage, type AdvisorEngagementSearch } from "@/components/advisor/advisor-engagement-page";

export const metadata: Metadata = {
  title: advisorCopy.mandatesTitle,
  robots: { index: false, follow: false },
};

export default async function AdvisorProcessEngagementRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<AdvisorEngagementSearch>;
}) {
  const { id } = await params;
  return <AdvisorEngagementPage id={id} query={await searchParams} section="venta" />;
}
