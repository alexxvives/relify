import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";
import { WaitlistBoard } from "@/components/landing/waitlist-form";
import { waitlistCopy } from "@/lib/waitlist";

export const metadata: Metadata = {
  title: waitlistCopy.title,
  description: waitlistCopy.description,
  alternates: { canonical: "/lista-de-espera" },
  openGraph: {
    title: waitlistCopy.title,
    description: waitlistCopy.description,
    url: "/lista-de-espera",
    locale: "es_ES",
    type: "website",
  },
};

export default function WaitlistPage() {
  return (
    <PublicSite>
      <main>
        <WaitlistBoard />
      </main>
    </PublicSite>
  );
}
