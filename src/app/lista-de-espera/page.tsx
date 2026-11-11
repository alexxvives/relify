import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";
import { WaitlistBoard } from "@/components/landing/waitlist-form";
import { waitlistCopy } from "@/lib/waitlist";
import { pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";

export function generateMetadata(): Metadata {
  return {
    title: waitlistCopy.title,
    description: waitlistCopy.description,
    ...pageSocialMetadata({
      title: waitlistCopy.title,
      description: waitlistCopy.description,
      path: "/lista-de-espera",
      origin: readSiteUrl(),
    }),
  };
}

export default function WaitlistPage() {
  return (
    <PublicSite footer={false}>
      <main>
        <WaitlistBoard />
      </main>
    </PublicSite>
  );
}
