import type { Metadata } from "next";
import { RolePage } from "@/components/landing/role-page";
import { readSiteUrl } from "@/lib/env";
import { pageSocialMetadata } from "@/lib/seo-head";

const title = "Empresas";
const description = "Prepara la ficha, publica con un nombre de proyecto y gestiona el interés sin mostrar la sociedad.";

export function generateMetadata(): Metadata {
  return {
    title,
    description,
    ...pageSocialMetadata({ title, description, path: "/empresas", origin: readSiteUrl() }),
  };
}

export default function EmpresasPage() {
  return (
    <RolePage
      kicker="Empresas"
      title="Tu negocio en buenas manos cuando te jubiles"
      lead="Vende tu empresa de forma confidencial y elige quién seguirá al frente de tu negocio."
      image="/product/empresa.jpg"
      imageAlt="Inicio del vendedor en Relify, con facturación, gasto y el estado de la ficha"
      photo="/roles/empresa.webp"
      photoAlt="Propietaria de una pyme en su taller"
      cta={{ href: "/registro?rol=empresa", label: "Crear cuenta de empresa" }}
      highlights={[
        "Publicar es gratis y tan solo pagas si vendes",
        "Anuncias la venta de forma anónima y los compradores solo pueden ver datos generales",
        "Conoces el perfil de cada comprador antes de aceptarlo",
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
