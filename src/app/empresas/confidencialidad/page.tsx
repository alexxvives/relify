import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Confidencialidad";
const description = "La ficha pública no incluye la razón social, el CIF ni la dirección. El detalle queda para quien entra en la operación.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function ConfidencialidadPage() {
  return (
    <AudiencePage
      eyebrow="Empresas"
      title={title}
      lead={description}
      cta={{ href: "/lista-de-espera", label: "Reservar un sitio" }}
      note="El acuerdo usa el nombre de proyecto, la región y el nombre de quien compra. No incluye la razón social, el CIF, el domicilio ni los socios."
      steps={[
        { title: "Nombre de proyecto", body: "Empresa, inversor y asesor aparecen con un identificador. La identidad legal no sale en el catálogo." },
        { title: "Primero la conexión", body: "El acuerdo se ofrece cuando la empresa acepta al comprador. Antes, el detalle sigue cerrado." },
        { title: "Sin firma, sin detalle", body: "Sin esa firma no hay acceso a estructura, pérdidas y ganancias ni balance." },
      ]}
    />
  );
}
