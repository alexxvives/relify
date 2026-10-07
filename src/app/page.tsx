import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { landingCopy } from "@/lib/landing-copy";

const title = landingCopy.home.title;
const description = landingCopy.home.description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Page() {
  return <LandingPage />;
}
