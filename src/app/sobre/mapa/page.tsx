import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/marketing-placeholder";

export const metadata: Metadata = {
  title: "El mapa",
  robots: { index: false, follow: false },
};

export default function MapaPage() {
  return (
    <MarketingPlaceholder
      title="El mapa"
      description="Esta página está en preparación. El mapa interactivo sigue en la portada."
    />
  );
}
