"use client";

import { useEffect } from "react";
import { logRouteError } from "@/lib/route-error";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    logRouteError(typeof window === "undefined" ? "/" : window.location.pathname, error);
  }, [error]);

  return (
    <html lang="es">
      <body className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
        <p className="text-sm font-semibold tracking-[0.14em] uppercase">Error</p>
        <h1 className="mt-3 text-2xl font-semibold">No se ha podido abrir Relify</h1>
        <p className="mt-3 text-sm">Recarga la página o vuelve más tarde.</p>
        {/* global-error replaces the root layout, so Link is not available. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#0f6e73] px-5 text-sm font-medium text-white">
          Ir al inicio
        </a>
      </body>
    </html>
  );
}
