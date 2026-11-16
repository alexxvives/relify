import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { landingCopy } from "@/lib/landing-copy";
import { isIntEnvironment } from "@/lib/int-env";
import { intAbsoluteTitle, pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";

const title = landingCopy.home.title;
const description = landingCopy.home.description;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}): Promise<Metadata> {
  const { v } = await searchParams;
  return {
    title: intAbsoluteTitle(isIntEnvironment(), title),
    description,
    ...pageSocialMetadata({ title, description, path: "/", origin: readSiteUrl() }),
    ...(v === "2" ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  if (v === "2") {
    const { LandingPageV2 } = await import("@/components/landing/landing-page-v2");
    return <LandingPageV2 />;
  }
  return <LandingPage />;
}
