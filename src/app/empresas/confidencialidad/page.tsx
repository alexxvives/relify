import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/marketing-placeholder";

export const metadata: Metadata = {
  title: "Confidencialidad",
  robots: { index: false, follow: false },
};

export default function ConfidencialidadPage() {
  return (
    <MarketingPlaceholder
      title="Confidencialidad"
      description="Esta página está en preparación. Aquí irá el detalle de nombres de proyecto, ficha pública y NDA."
    />
  );
}
