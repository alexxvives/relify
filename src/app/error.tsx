"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logRouteError } from "@/lib/route-error";

export default function AppError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    logRouteError(window.location.pathname, error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-semibold tracking-[0.14em] text-public-clay uppercase">Error</p>
      <h1 className="releva-page-title mt-3 text-balance">No se ha podido abrir esta página</h1>
      <p className="mt-3 text-public-muted">Prueba de nuevo o vuelve al inicio.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-public-clay px-5 text-sm font-medium text-white hover:bg-public-clay-deep"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
