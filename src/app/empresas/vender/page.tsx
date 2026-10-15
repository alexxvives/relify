import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Vender una empresa";
const description = "Publicas la pyme con un nombre de proyecto. Quien compra ve las cifras, no la sociedad.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function VenderEmpresaPage() {
  return (
    <AudiencePage
      eyebrow="Empresas"
      title={title}
      lead={description}
      cta={{ href: "/lista-de-espera", label: "Apuntar mi empresa" }}
      note="La primera empresa publicada no tiene cuota de anuncio. Cada empresa siguiente son 149 € más IVA, una sola vez, y queda pendiente hasta que se revise."
      steps={[
        { title: "Cuatro datos para empezar", body: "Región, facturación, EBITDA y precio. El nombre de la sociedad y el CIF se quedan en el borrador." },
        { title: "Sale un nombre de proyecto", body: "En el catálogo aparece Proyecto Alba, no la razón social. La ficha muestra las cifras y la región." },
        { title: "El interés entra en la operación", body: "Cuando aceptas a un comprador, el acuerdo se firma antes de abrir el detalle." },
      ]}
    />
  );
}
