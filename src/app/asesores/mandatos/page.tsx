import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/marketing-placeholder";

export const metadata: Metadata = {
  title: "Publicar un mandato",
  robots: { index: false, follow: false },
};

export default function MandatosPage() {
  return (
    <MarketingPlaceholder
      title="Publicar un mandato"
      description="Esta página está en preparación. Aquí irá cómo un asesor presenta la operación de un cliente."
    />
  );
}
