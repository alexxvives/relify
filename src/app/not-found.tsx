import Link from "next/link";
import { PublicSite } from "@/components/landing/public-site";

const copy = {
  kicker: "404",
  title: "Esta página no está en Relify",
  home: "Ir al inicio",
};

export default function NotFound() {
  return (
    <PublicSite>
      <main className="releva-404">
        <p className="releva-404-num" aria-hidden>
          {copy.kicker}
        </p>
        <h1 className="mt-6 max-w-lg text-lg font-medium text-public-ink sm:text-xl">{copy.title}</h1>
        <div className="mt-8 flex w-full max-w-md flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
          <Link href="/" className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-public-clay px-5 text-sm text-white hover:bg-public-clay-deep">
            {copy.home}
          </Link>
        </div>
      </main>
    </PublicSite>
  );
}
