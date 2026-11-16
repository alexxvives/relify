import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/shell/marketing-placeholder";

export const metadata: Metadata = {
  title: "Casos",
  robots: { index: false, follow: false },
};

export default function CasosPage() {
  return (
    <MarketingPlaceholder
      title="Casos"
      description="Esta página está en preparación. Los ejemplos de la portada no son mandatos abiertos."
    />
  );
}
