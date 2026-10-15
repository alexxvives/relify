import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Cómo comprar";
const description = "Lees fichas anónimas y pides acceso solo cuando una operación encaja. El detalle llega después del acuerdo.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function ComoComprarPage() {
  return (
    <AudiencePage
      eyebrow="Inversores"
      title={title}
      lead={description}
      cta={{ href: "/proyectos", label: "Ver empresas" }}
      note="Mirar el catálogo es gratis. Conectar con una empresa depende del plan. Un plan de pago abre un pago a Releva antes de activarse."
      steps={[
        { title: "Lees la ficha", body: "Región, facturación, EBITDA, EBITDA ajustado y precio. Sin razón social." },
        { title: "Pides conectar", body: "La empresa decide si acepta. Hasta entonces el acuerdo no se abre." },
        { title: "Firmas y sigues", body: "Después del acuerdo puedes preguntar, proponer una reunión y dejar una carta de intenciones." },
      ]}
    />
  );
}
