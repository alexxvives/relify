import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/marketing-placeholder";

export const metadata: Metadata = {
  title: "Sobre Relify",
  robots: { index: false, follow: false },
};

export default function SobrePage() {
  return (
    <MarketingPlaceholder
      title="Sobre Relify"
      description="Esta página está en preparación. Aquí irá la misión de la plataforma."
    />
  );
}
