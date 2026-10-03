import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/marketing-placeholder";

export const metadata: Metadata = {
  title: "Cómo comprar",
  robots: { index: false, follow: false },
};

export default function ComoComprarPage() {
  return (
    <MarketingPlaceholder
      title="Cómo comprar"
      description="Esta página está en preparación. Aquí irá el recorrido del inversor, desde la ficha pública hasta el acceso confidencial."
    />
  );
}
