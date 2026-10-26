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
      imageAlt="Inicio del vendedor en Relify, con facturación, gasto y el estado de la ficha"
      photo="/roles/empresa.webp"
      photoAlt="Propietaria de una pyme en su taller"
      cta={{ href: "/registro?rol=empresa", label: "Crear cuenta de empresa" }}
      highlights={[
        "Publicas con un nombre de proyecto, nunca con la razón social",
        "Tú decides quién ve las cuentas y el dataroom",
        "Compradores con plan y perfil completo",
      ]}
      stat={{ value: "0 €", label: "por publicar tu primera empresa" }}
      featuresTitle="Preparación, visibilidad y el proceso en un solo panel"
      features={[
        {
          title: "El NIF rellena el borrador",
          body: "Un CIF válido busca los datos públicos del boletín. Revisas la ficha antes de publicar. El comprador no ve el nombre ni el NIF.",
        },
        {
          title: "Cifras y actividad a la vista",
          body: "Facturación, EBITDA, gasto, clientes y productos se leen en el inicio. El precio publicado es el de la operación, no una tarifa de Relify.",
        },
        {
          title: "Interés sin nombres",
          body: "Cada solicitud llega como comprador. Aceptas, y el acuerdo abre preguntas, reuniones y la carta.",
        },
      ]}
      stepsTitle="Cómo funciona para quien vende"
      steps={[
        { title: "Creas la cuenta", body: "Eliges el rol de empresa y dejas el nombre, el NIF y el teléfono." },
        { title: "Verificas la sociedad", body: "El CIF abre el borrador. La ficha pública usa un nickname." },
        { title: "Publicas cuando está lista", body: "Precio, región y cifras. La primera empresa publicada no pide el alta de anuncio en esta página." },
        { title: "Gestionas el interés", body: "Aceptas o dejas en espera. El detalle confidencial sigue al acuerdo." },
      ]}
      productTitle="Tu inicio te dice qué falta y quién está interesado"
      productBody="Facturación, EBITDA, el estado de la ficha y las acciones pendientes en una sola pantalla. Aceptas o rechazas cada solicitud con el perfil del comprador delante."
      faq={[
        { q: "¿Quién ve el nombre de mi empresa?", a: "Nadie en el catálogo. La ficha sale con un nombre de proyecto. La razón social y las cuentas solo se abren a quien aceptas y firma el NDA." },
        { q: "¿Cuánto cuesta publicar?", a: "Crear la cuenta y publicar la primera empresa no tiene coste. El precio que ves en la ficha es el de la operación." },
        { q: "¿Puedo pausar la venta?", a: "Sí. Puedes ocultar la ficha en cualquier momento y volver a publicarla cuando quieras." },
      ]}
      closingTitle="Prepara la ficha hoy. Publica cuando esté lista."
    />
  );
}
