import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Qué cuesta mirar y conectar";
const description = "Mirar es gratis. Conectar con empresas usa un plan de pago, con el IVA encima.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function PlanesInversorPage() {
  return (
    <AudiencePage
      eyebrow="Inversores"
      title={title}
      lead={description}
      cta={{ href: "/lista-de-espera", label: "Apuntarme como inversor" }}
      note="Al cerrar una venta se anota un 1 % para quien compra y un 2,5 % para quien vende, más IVA. Esa nota no cobra por sí sola."
      steps={[
        { title: "Mirar, sin plan", body: "El catálogo y las fichas públicas se leen sin suscripción. Conectar pide un plan." },
        { title: "3 encuentros al mes", body: "20 € al mes, 24,20 € con IVA. Cada encuentro es una empresa que acepta tu solicitud." },
        { title: "Sin límite de encuentros", body: "99 € al mes, 119,79 € con IVA. Conectar no pide confirmación de cupo." },
      ]}
    />
  );
}
