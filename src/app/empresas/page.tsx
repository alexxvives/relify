import type { Metadata } from "next";
import { RolePage } from "@/components/landing/role-page";

export const metadata: Metadata = {
  title: "Empresas",
  description: "Publica la pyme con un nombre de proyecto. La ficha muestra cifras, no la sociedad.",
};

export default function EmpresasPage() {
  return (
    <RolePage
      title="Publicas la empresa sin decir quién es"
      image="/roles/empresa.jpg"
      imageAlt="Taller con luz de mañana y un libro de cuentas sobre el mostrador"
      role="Empresas"
      lead="Eres quien vende o explora la venta. Releva presenta la pyme con un nombre de proyecto, la región y las cifras. La razón social, el CIF y los socios se quedan en el borrador."
      steps={[
        { title: "Completas la ficha", body: "Nickname, región, facturación, EBITDA y precio. La sociedad no entra en lo que se publica." },
        { title: "Llegan perfiles anónimos", body: "Quien pide acceso aparece como inversor, con ciudad y tipo de perfil, sin su nombre en tu bandeja pública." },
        { title: "Abres el detalle cuando encaja", body: "Aceptas la conexión y, después, el acuerdo de confidencialidad abre el resto del recorrido." },
      ]}
      closeTitle="Así se lee tu página"
      closeBody="Tres pasos, en este orden. La foto es el taller; el recorrido es la ficha, el interés y el acceso."
      points={["Nombre de proyecto en la ficha", "Cifras a la vista", "Sociedad y documentos fuera"]}
      cta="Apuntarme"
      href="/lista-de-espera"
    />
  );
}
