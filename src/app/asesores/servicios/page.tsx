import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

const title = "Servicios";
const description = "Ofreces due diligence, valoración, legal, fiscal, plan de negocio y laboral dentro de una operación ya abierta.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function ServiciosAsesorPage() {
  return (
    <AudiencePage
      eyebrow="Asesores"
      title={title}
      lead={description}
      cta={{ href: "/asesores/mandatos", label: "Trae un mandato" }}
      note="Pedir un presupuesto guarda la solicitud y avisa. No abre un pago ni cobra a quien lo pide."
      steps={[
        { title: "Seis servicios", body: "Due diligence, valoración de empresa, consultoría legal, fiscal, plan de negocio y consultoría laboral." },
        { title: "Un encargo con nombre de proyecto", body: "La tarjeta dice el servicio y el proyecto. No muestra el nombre de la sociedad." },
        { title: "Chat y reuniones al entrar", body: "Cuando el encargo está aceptado, el hilo y las reuniones se abren en esa operación." },
      ]}
    />
  );
}
