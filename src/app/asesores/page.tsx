import type { Metadata } from "next";
import { RolePage } from "@/components/landing/role-page";

export const metadata: Metadata = {
  title: "Asesores",
  description: "Acompañas una venta o un encargo con las mismas reglas de anonimato que la ficha.",
};

export default function AsesoresPage() {
  return (
    <RolePage
      title="Acompañas la operación sin publicar al cliente"
      image="/roles/asesor.jpg"
      imageAlt="Dos personas cruzando un patio de una nave pequeña"
      role="Asesores"
      lead="Eres quien trae un mandato o presta un servicio dentro de un proceso ya abierto. La ficha del cliente sigue anónima. El encargo se abre cuando la empresa o el inversor te elige."
      steps={[
        { title: "Publicas tus servicios", body: "Due diligence, valoración, legal, fiscal, plan de negocio o laboral. El marketplace enseña el perfil, no el NIF." },
        { title: "Te contratan dentro de un proceso", body: "Ves el nickname hasta que el depósito del encargo está hecho. Entonces se abre el recorrido de esa empresa." },
        { title: "Cobras por el trabajo", body: "El depósito es reembolsable y se descuenta del encargo. El importe se ve dentro de la cuenta, no en esta página." },
      ]}
      closeTitle="Así se lee tu página"
      closeBody="El patio es el encuentro. El recorrido es el perfil, el encargo y el trabajo ya abierto."
      points={["Mandato sin la sociedad en la ficha", "Servicios visibles en el marketplace", "Depósito dentro de la cuenta"]}
      cta="Apuntarme"
      href="/lista-de-espera"
    />
  );
}
