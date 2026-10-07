import Link from "next/link";
import { PublicSite } from "@/components/public-site";

const copy = {
  kicker: "404",
  title: "Esta página no está en Releva",
  body: "El enlace no lleva a una ficha, a una cuenta ni a una nota del diario. Puedes volver al inicio, mirar empresas o entrar.",
  home: "Ir al inicio",
  catalog: "Empresas en venta",
  enter: "Entrar",
};

export default function NotFound() {
  return (
    <PublicSite>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1440px] flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-[7rem] leading-none tracking-tight text-public-ink italic [font-family:var(--public-display)] sm:text-[9rem]">{copy.kicker}</p>
        <h1 className="mt-2 max-w-xl text-4xl leading-none tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-public-muted">{copy.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-full bg-public-clay px-4 text-sm text-white hover:bg-public-clay-deep">
            {copy.home}
          </Link>
          <Link href="/proyectos" className="inline-flex h-11 items-center rounded-full border border-public-line bg-white px-4 text-sm hover:border-public-ink">
            {copy.catalog}
          </Link>
          <Link href="/entrar" className="inline-flex h-11 items-center rounded-full border border-public-line bg-white px-4 text-sm hover:border-public-ink">
            {copy.enter}
          </Link>
        </div>
      </main>
    </PublicSite>
  );
}
