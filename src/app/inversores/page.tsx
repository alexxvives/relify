import type { Metadata } from "next";
import { RolePage } from "@/components/landing/role-page";

export const metadata: Metadata = {
  title: "Inversores",
  description: "Lees empresas en venta por facturación, EBITDA y precio, y pides acceso cuando una encaja.",
};

export default function InversoresPage() {
  return (
    <RolePage
      title="Lees operaciones antes de saber el nombre"
      image="/roles/inversor.jpg"
      imageAlt="Mesa de madera junto a una ventana con una ficha impresa"
      role="Inversores"
      lead="Eres quien busca una pyme para continuar. El catálogo enseña nickname, región y cifras. El nombre de la sociedad llega solo después de que la empresa acepta y firmas el acuerdo."
      steps={[
        { title: "Filtras el catálogo", body: "Región, facturación, EBITDA y precio. Comparas fichas sin abrir la sociedad." },
        { title: "Pides conexión", body: "La empresa ve tu perfil público: ciudad, tipo de inversor y qué buscas. No tu correo." },
        { title: "Firmas y sigues", body: "Si te aceptan, el acuerdo abre preguntas, reuniones y la carta de intenciones." },
      ]}
      closeTitle="Así se lee tu página"
      closeBody="Mirar es el primer paso. Conectar y el detalle confidencial vienen después, cuando la operación encaja."
      points={["Fichas anónimas", "Perfil sin tu nombre para el vendedor", "Detalle tras el acuerdo"]}
      cta="Apuntarme"
      href="/lista-de-espera"
    />
  );
}
