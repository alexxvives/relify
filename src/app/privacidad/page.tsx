import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { privacyCopy } from "@/lib/legal-copy";
import { pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";

export function generateMetadata(): Metadata {
  return {
    title: privacyCopy.title,
    description: privacyCopy.description,
    ...pageSocialMetadata({
      title: privacyCopy.title,
      description: privacyCopy.description,
      path: "/privacidad",
      origin: readSiteUrl(),
    }),
  };
}

export default function PrivacyPage() {
  return (
    <LegalDoc
      kicker={privacyCopy.kicker}
      title={privacyCopy.title}
      lead={privacyCopy.lead}
      updated={privacyCopy.updated}
      sections={privacyCopy.sections}
    />
  );
}
