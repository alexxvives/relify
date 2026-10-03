import type { Metadata } from "next";
import { LandingPage } from "@/components/archivo/landing-page";

export const metadata: Metadata = {
  title: "Archivo",
  robots: { index: false, follow: false },
};

export default function ArchivoPage() {
  return <LandingPage />;
}
