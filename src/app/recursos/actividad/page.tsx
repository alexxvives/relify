import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/shell/marketing-placeholder";

export const metadata: Metadata = {
  title: "Actividad",
  robots: { index: false, follow: false },
};

export default function ActividadPage() {
  return (
    <MarketingPlaceholder
      title="Actividad"
      description="Esta página está en preparación. Aquí se podrá leer el ritmo de la plataforma sin identificar a las partes."
    />
  );
}
