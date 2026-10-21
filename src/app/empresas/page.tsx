import type { Metadata } from "next";
import { RolePage } from "@/components/landing/role-page";

export const metadata: Metadata = {
  title: "Empresas",
  description: "Prepara la ficha, publica con un nombre de proyecto y gestiona el interés sin mostrar la sociedad.",
};

export default function EmpresasPage() {
  return (
    <RolePage
      kicker="Empresas"
      title="Vende tu empresa con la ficha bajo control"
      lead="Completas el perfil, publicas con un nombre de proyecto y sigues intereses, preguntas y reuniones desde el mismo sitio. La razón social no sale en la ficha."
      image="/product/empresa.jpg"
      imageAlt="Inicio del vendedor en Releva, con facturación, gasto y el estado de la ficha"
      featuresTitle="Preparación, visibilidad y el proceso en un solo panel"
      features={[
        {
          title: "El NIF rellena el borrador",
          body: "Un CIF válido busca los datos públicos del boletín. Revisas la ficha antes de publicar. El inversor no ve el nombre ni el NIF.",
        },
        {
          title: "Cifras y actividad a la vista",
          body: "Facturación, EBITDA, gasto, clientes y productos se leen en el inicio. El precio publicado es el de la operación, no una tarifa de Releva.",
        },
        {
          title: "Interés sin nombres",
          body: "Cada solicitud llega como inversor. Aceptas, y el acuerdo abre preguntas, reuniones y la carta.",
        },
      ]}
      stepsTitle="Cómo funciona para quien vende"
      steps={[
        { title: "Creas la cuenta", body: "Eliges el rol de empresa y dejas el nombre, el NIF y el teléfono." },
        { title: "Verificas la sociedad", body: "El CIF abre el borrador. La ficha pública usa un nickname." },
        { title: "Publicas cuando está lista", body: "Precio, región y cifras. La primera empresa publicada no pide el alta de anuncio en esta página." },
        { title: "Gestionas el interés", body: "Aceptas o dejas en espera. El detalle confidencial sigue al acuerdo." },
      ]}
      showcase
    />
  );
}
