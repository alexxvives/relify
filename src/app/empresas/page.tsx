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
      publishMorph
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
        { q: "\u00bfQui\u00e9n ve el nombre de mi empresa?", a: "Nadie en el cat\u00e1logo. La ficha sale con un nombre de proyecto. La raz\u00f3n social y las cuentas solo se abren a quien aceptas y firma el NDA." },
        { q: "\u00bfCu\u00e1nto cuesta publicar?", a: "Crear la cuenta y publicar tu primera empresa no tiene coste. Cada empresa adicional cuesta 149 \u20ac + IVA (180,29 \u20ac), en un solo pago." },
        { q: "\u00bfQui\u00e9n revisa la ficha antes de publicarla?", a: "Relify. Comprobamos el NIF en el registro mercantil y revisamos la ficha antes de que salga en el cat\u00e1logo." },
        { q: "\u00bfElijo yo con qui\u00e9n hablo?", a: "S\u00ed. Cada comprador te pide conexi\u00f3n con su perfil p\u00fablico. T\u00fa decides a qui\u00e9n aceptas; sin tu aceptaci\u00f3n no ve nada m\u00e1s." },
        { q: "\u00bfQu\u00e9 firma el comprador antes de ver los detalles?", a: "Un acuerdo de confidencialidad (NDA) dentro de Relify. Despu\u00e9s se abren preguntas, reuniones y la carta de intenciones." },
        { q: "\u00bfPuedo contar con un asesor?", a: "S\u00ed. Puedes contratar a un asesor verificado desde Relify para que te acompa\u00f1e en la venta." },
        { q: "\u00bfPuedo pausar la venta?", a: "S\u00ed. Puedes ocultar la ficha en cualquier momento y volver a publicarla cuando quieras." },
      ]}
      closingTitle="Prepara la ficha hoy. Publica cuando esté lista."
    />
  );
}
