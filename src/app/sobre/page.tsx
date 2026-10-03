import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/marketing-placeholder";

export const metadata: Metadata = {
  title: "Sobre Releva",
  robots: { index: false, follow: false },
};

export default function SobrePage() {
  return (
    <MarketingPlaceholder
      title="Sobre Releva"
      description="Esta página está en preparación. Aquí irá la misión de la plataforma."
    />
  );
}
