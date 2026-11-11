import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { landingCopy } from "@/lib/landing-copy";
import { pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";

const title = landingCopy.home.title;
const description = landingCopy.home.description;

export function generateMetadata(): Metadata {
  return {
    title,
    description,
    ...pageSocialMetadata({ title, description, path: "/", origin: readSiteUrl() }),
  };
}

export default function Page() {
  return <LandingPage />;
}
