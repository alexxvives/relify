import Link from "next/link";
import { PublicSite } from "@/components/public-site";

const copy = {
  kicker: "404",
  title: "Esta página no está en Relify",
  body: "El enlace no lleva a una ficha, a una cuenta ni a una nota del diario. Puedes volver al inicio, mirar empresas o entrar.",
  home: "Ir al inicio",
  catalog: "Empresas en venta",
  enter: "Entrar",
};

export default function NotFound() {
  return (
    <PublicSite>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1440px] flex-col justify-center px-5 py-12 sm:px-8 sm:py-16">
        <p className="releva-page-title text-[4.5rem] leading-none text-public-ink sm:text-[9rem]">{copy.kicker}</p>
        <h1 className="releva-page-title mt-2 max-w-xl">{copy.title}</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-public-muted">{copy.body}</p>
        <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full bg-public-clay px-4 text-sm text-white hover:bg-public-clay-deep">
            {copy.home}
          </Link>
          <Link href="/proyectos" className="inline-flex h-12 items-center justify-center rounded-full border border-public-line bg-white px-4 text-sm hover:border-public-ink">
            {copy.catalog}
          </Link>
          <Link href="/entrar" className="inline-flex h-12 items-center justify-center rounded-full border border-public-line bg-white px-4 text-sm hover:border-public-ink">
            {copy.enter}
          </Link>
        </div>
      </main>
    </PublicSite>
  );
}
