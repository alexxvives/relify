import type { Metadata } from "next";
import { MarketingPlaceholder } from "@/components/marketing-placeholder";

export const metadata: Metadata = {
  title: "Vender una empresa",
  robots: { index: false, follow: false },
};

export default function VenderEmpresaPage() {
  return (
    <MarketingPlaceholder
      title="Vender una empresa"
      description="Esta página está en preparación. Desde aquí se explicará cómo publicar una compañía sin mostrar la razón social."
    />
  );
}
