import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Qué ves tú y qué ve el comprador";
const description = "Tú ves la sociedad en tu borrador. En la ficha pública solo salen el nombre de proyecto, la región y las cifras.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function QueSeVePage() {
  return (
    <AudiencePage
      eyebrow="Empresas"
      title={title}
      lead={description}
      cta={{ href: "/empresas/vender", label: "Cómo vender" }}
      note="Detrás del acuerdo, las secciones cerradas no enseñan las cifras reales. Hasta esa firma, los importes de ejemplo no son los de tu empresa."
      steps={[
        { title: "En tu borrador", body: "Razón social, CIF y domicilio se guardan para ti. No se seleccionan para las páginas públicas." },
        { title: "En la ficha pública", body: "Nombre de proyecto, región, facturación, EBITDA, EBITDA ajustado y precio de venta." },
        { title: "Después del acuerdo", body: "Estructura, cuenta de resultados y balance se abren para ese comprador. Los documentos solo si tú los compartes." },
      ]}
    />
  );
}
