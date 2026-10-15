import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Trae un mandato";
const description = "Presentas la operación de tu cliente con las mismas reglas. La sociedad no sale en la ficha.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function MandatosPage() {
  return (
    <AudiencePage
      eyebrow="Asesores"
      title={title}
      lead={description}
      cta={{ href: "/lista-de-espera", label: "Apuntarme como asesor" }}
      note="Un asesor no publica la empresa del cliente ni paga la cuota de anuncio de 149 €."
      steps={[
        { title: "El mandato sigue anónimo", body: "En el tablero se ve el nombre de proyecto. La razón social, el CIF y el domicilio se quedan fuera." },
        { title: "Entras cuando te contratan", body: "Hasta el depósito, ves el nombre de proyecto. El detalle de cifras espera a tu propio acuerdo." },
        { title: "El recorrido es el mismo", body: "Conexión, acuerdo, preguntas y documentación, con la sociedad fuera de la ficha pública." },
      ]}
    />
  );
}
