import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Cómo cobras";
const description = "El perfil de asesor es gratis. La bandeja de encargos tiene un plan. Lo que cobras por un trabajo se anota, y todavía no se carga.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function CobrosAsesorPage() {
  return (
    <AudiencePage
      eyebrow="Asesores"
      title={title}
      lead={description}
      cta={{ href: "/lista-de-espera", label: "Apuntarme como asesor" }}
      note="Al cerrar un encargo se guarda el 15 % de lo que cobras por ese trabajo, más el IVA de ese 15 %. Esa fila no se cobra en el pago."
      steps={[
        { title: "Perfil sin cuota", body: "Editas la ficha y ves el directorio en el plan gratuito." },
        { title: "Bandeja de encargos", body: "39 € al mes, 47,19 € con IVA, abre la bandeja. El pago es a Releva." },
        { title: "Un presupuesto no es un cobro", body: "Quien pide un servicio deja una solicitud. Nadie paga en ese paso." },
      ]}
    />
  );
}
