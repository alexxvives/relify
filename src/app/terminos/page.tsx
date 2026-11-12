import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { termsCopy } from "@/lib/legal-copy";
import { pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";

export function generateMetadata(): Metadata {
  return {
    title: termsCopy.title,
    description: termsCopy.description,
    ...pageSocialMetadata({
      title: termsCopy.title,
      description: termsCopy.description,
      path: "/terminos",
      origin: readSiteUrl(),
    }),
  };
}

export default function TermsPage() {
  return (
    <LegalDoc
      kicker={termsCopy.kicker}
      title={termsCopy.title}
      lead={termsCopy.lead}
      updated={termsCopy.updated}
      sections={termsCopy.sections}
    />
  );
}
