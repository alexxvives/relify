import type { Metadata } from "next";
import { RolePage } from "@/components/landing/role-page";

export const metadata: Metadata = {
  title: "Compradores",
  description: "Filtra empresas en venta por región, facturación y EBITDA, y pide acceso cuando una encaja.",
};

export default function InversoresPage() {
  return (
    <RolePage
      kicker="Compradores"
      title="Encuentra empresas rentables antes de saber el nombre"
      lead="El catálogo enseña nickname, región, facturación, EBITDA y precio. Pides conexión cuando una operación encaja. La sociedad llega después del acuerdo."
      image="/product/inversor.jpg"
      imageAlt="Empresas en venta en Relify, con filtros y fichas de proyecto"
      photo="/roles/comprador.webp"
      photoAlt="Comprador revisando las cifras de una empresa"
      cta={{ href: "/lista-de-espera", label: "Apuntarme" }}
      highlights={[
        "Fichas con facturación, EBITDA, región y precio",
        "Pides conexión con tu perfil, sin enseñar tu correo",
        "Preguntas, reuniones y carta de intenciones en un mismo hilo",
      ]}
      stat={{ value: "Verificadas", label: "empresas con NIF comprobado y ficha revisada por Relify" }}
      featuresTitle="Busca, compara y sigue la operación en el mismo sitio"
      features={[
        {
          title: "Filtros sobre cifras reales",
          body: "Región, facturación, EBITDA y orden por retorno. Cada ficha cabe en una tarjeta, sin la razón social.",
        },
        {
          title: "Tu actividad en el inicio",
          body: "Favoritas, intereses, preguntas y reuniones se cuentan en el panel. Las acciones pendientes van primero.",
        },
        {
          title: "El detalle, tras el acuerdo",
          body: "La empresa acepta. Firmas el acuerdo y entonces se abren preguntas, reuniones y la carta de intenciones.",
        },
      ]}
      stepsTitle="Cómo funciona para quien compra"
      steps={[
        { title: "Miras el catálogo", body: "Comparas fichas anónimas. Guardas las que encajan." },
        { title: "Pides conexión", body: "La empresa ve tu perfil público: ciudad, tipo y qué buscas. No tu correo." },
        { title: "Firmas el acuerdo", body: "Con la aceptación, el acuerdo abre el resto de la ficha." },
        { title: "Sigues el proceso", body: "Preguntas, reuniones y carta viven en la misma operación." },
      ]}
      productTitle="Compara empresas con cifras, no con titulares"
      productBody="Filtra por región, facturación y EBITDA, guarda favoritas y sigue cada conversación desde tu inicio. Completa tu perfil de comprador y la empresa sabrá qué buscas."
      faq={[
        { q: "¿Qué tengo que hacer para conectar con una empresa?", a: "Elegir un plan y completar tu perfil de comprador: tipo, ticket, sectores y qué buscas. Es lo que la empresa ve antes de aceptarte." },
        { q: "¿Cuándo veo el nombre de la empresa?", a: "Cuando la empresa acepta tu solicitud y firmas el NDA. Antes ves el nombre de proyecto y las cifras abiertas." },
        { q: "¿La empresa ve mi correo?", a: "No. Ve tu perfil público: nombre, ciudad, tipo de comprador y qué buscas." },
      ]}
      closingTitle="Entra en el catálogo antes de que se llene."
    />
  );
}
