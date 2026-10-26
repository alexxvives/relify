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
    />
  );
}
