import type { Metadata } from "next";
import { RolePage } from "@/components/landing/role-page";

export const metadata: Metadata = {
  title: "Asesores",
  description: "Publica servicios y acompaña encargos sin mostrar la sociedad del cliente en la ficha.",
};

export default function AsesoresPage() {
  return (
    <RolePage
      kicker="Asesores"
      title="Publica tus mandatos y tus servicios"
      lead="El inicio lista lo que te toca: encargos abiertos, depósitos y acuerdos. El cliente sigue con nombre de proyecto hasta que el encargo está aceptado."
      image="/product/asesor.jpg"
      imageAlt="Inicio del asesor en Relify, con encargos y acciones pendientes"
      photo="/roles/asesor.webp"
      photoAlt="Dos asesores revisando una operación"
      cta={{ href: "/lista-de-espera", label: "Apuntarme" }}
      highlights={[
        "Perfil público con tus servicios y sectores",
        "Encargos de empresas y compradores ya en proceso",
        "Depósito reembolsable antes de empezar el trabajo",
      ]}
      stat={{ value: "6", label: "servicios que puedes ofrecer" }}
      featuresTitle="Servicios, encargos y el proceso del cliente"
      features={[
        {
          title: "Seis servicios en el perfil",
          body: "Due diligence, valoración, legal, fiscal, plan de negocio y laboral. El marketplace enseña el perfil, no el NIF.",
        },
        {
          title: "El encargo llega ciego",
          body: "Ves el nickname. El depósito es reembolsable y se descuenta del trabajo. El importe se ve dentro de la cuenta.",
        },
        {
          title: "El mismo recorrido que la operación",
          body: "Cuando el depósito está hecho, abres la ficha, los documentos compartidos y las reuniones de ese encargo.",
        },
      ]}
      stepsTitle="Cómo funciona para quien asesora"
      steps={[
        { title: "Completas el perfil", body: "Nombre comercial, sectores y el rango de cada servicio." },
        { title: "Te eligen en un proceso", body: "Empresa o comprador pide el servicio. El encargo queda por aceptar." },
        { title: "Aceptas con el depósito", body: "El pago abre el recorrido. Rechazar deja el encargo fuera." },
        { title: "Trabajas dentro de Relify", body: "Chat, documentos y reuniones. La sociedad no se publica en la ficha." },
      ]}
      productTitle="Tus encargos, depósitos y acuerdos en un solo inicio"
      productBody="Ves lo que te toca hacer hoy, aceptas encargos con un clic y trabajas con el cliente dentro de la misma operación: chat, documentos y reuniones."
      faq={[
        { q: "\u00bfQui\u00e9n puede contratarme?", a: "Empresas que venden y compradores que ya est\u00e1n en un proceso dentro de Relify." },
        { q: "\u00bfC\u00f3mo me verifican?", a: "Relify revisa tu perfil y, si todo cuadra, marca tu ficha como verificada. Los clientes ven esa marca en el directorio." },
        { q: "\u00bfC\u00f3mo funciona el dep\u00f3sito?", a: "El cliente paga un dep\u00f3sito al aceptar el encargo. Es reembolsable y se descuenta del trabajo final." },
        { q: "\u00bfCu\u00e1nto cuesta estar en Relify?", a: "La ficha en el directorio es gratis. Para aceptar encargos y hablar con clientes est\u00e1 la suscripci\u00f3n de asesor de 49 \u20ac. Relify cobra un 15% de tus honorarios por encargo." },
        { q: "\u00bfVeo los datos del cliente?", a: "Ves el nombre de proyecto hasta que el encargo est\u00e1 aceptado. Despu\u00e9s se abre la ficha y los documentos que te comparten." },
      ]}
      closingTitle="Publica tu ficha de asesor en Relify."
    />
  );
}
