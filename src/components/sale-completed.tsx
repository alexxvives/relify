"use client";

import Link from "next/link";
import { Archive, CalendarClock, CircleCheck, FolderOpen, MessageSquareQuote, PartyPopper, Receipt, Trophy, UserRound, Users } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ListAnotherCompany } from "@/components/company-switcher";
import { ProcessRoom } from "@/components/deal-pipeline";
import { shortNickname } from "@/lib/nickname";
import type { ProcessFile } from "@/lib/deal-pipeline";

export type SaleFigures = { price: string; fee: string; feeNote: string; date: string };

type Docs = { ndaHref: string | null; loiHref: string | null; contractHref: string | null; files?: ProcessFile[] };

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-[#e7eaee] bg-white px-4 py-3">
      <dt className="text-xs text-[#667085]">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-[#1c2740]">{value}</dd>
      {note ? <dd className="text-xs text-[#667085]">{note}</dd> : null}
    </div>
  );
}

function Step({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl border border-[#e7eaee] bg-white p-4">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#465ab4]">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#1c2740]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{body}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </li>
  );
}

function ArchivedDocs({ docs, extra }: { docs: Docs; extra?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5" aria-labelledby="sale-docs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sale-docs" className="flex items-center gap-2 text-lg font-semibold text-[#1c2740]">
          <Archive className="size-5 text-[#667085]" aria-hidden />
          Proceso archivado
        </h2>
        <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-xs font-medium text-[#475467]">Solo lectura</span>
      </div>
      <p className="mt-1 text-sm text-[#5c6b78]">Los acuerdos firmados y la documentación siguen disponibles cuando los necesites.</p>
      <div className="mt-4">
        <ProcessRoom
          files={docs.files ?? []}
          bodies={[]}
          nda={docs.ndaHref !== null}
          ndaHref={docs.ndaHref}
          loiHref={docs.loiHref}
          contractHref={docs.contractHref}
          contractSigned
          empty="Sin documentos compartidos."
        />
      </div>
      {extra}
    </section>
  );
}

export type SellerSaleStats = { buyer: string; daysToClose: number; listedOn: string; interested: number };

function useSaleConfetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#465ab4", "#17663a", "#f5b942", "#e8eefb"];
      confetti({ particleCount: 90, spread: 70, origin: { x: 0.3, y: 0.35 }, colors, disableForReducedMotion: true });
      confetti({ particleCount: 90, spread: 70, origin: { x: 0.7, y: 0.35 }, colors, disableForReducedMotion: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);
}

function Stat({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e7eaee] bg-white p-4">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465ab4]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-[#667085]">{label}</dt>
        <dd className="mt-0.5 text-lg font-semibold text-[#1c2740]">{value}</dd>
        {note ? <dd className="text-xs text-[#667085]">{note}</dd> : null}
      </div>
    </div>
  );
}

export function SellerSaleCompleted({
  codename,
  figures,
  docs,
  stats,
}: {
  codename: string;
  figures: SaleFigures;
  docs: Docs;
  stats: SellerSaleStats;
}) {
  useSaleConfetti();
  const days = stats.daysToClose === 1 ? "1 día" : `${stats.daysToClose} días`;
  const interested = stats.interested === 1 ? "1 inversor interesado" : `${stats.interested} inversores interesados`;
  return (
    <div className="flex flex-col gap-4">
      <section
        className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1c2740_0%,#2f418f_55%,#465ab4_100%)] px-6 py-8 text-white sm:px-10 sm:py-10"
        aria-labelledby="sale-done"
      >
        <PartyPopper className="pointer-events-none absolute -right-6 -bottom-8 size-48 text-white/10" aria-hidden />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Trophy className="size-3.5" aria-hidden /> Venta cerrada · {figures.date}
        </span>
        <h2 id="sale-done" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">¡Enhorabuena! Has vendido {codename}.</h2>
        <p className="mt-2 max-w-2xl text-base leading-7 text-white/80">
          El contrato de compraventa está firmado por las dos partes. La empresa ya no aparece en el marketplace.
        </p>
        <p className="mt-6 text-sm text-white/70">Precio de cierre</p>
        <p className="text-5xl font-semibold tracking-tight sm:text-6xl">{figures.price}</p>
      </section>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<UserRound className="size-5" aria-hidden />} label="Comprador" value={stats.buyer} />
        <Stat icon={<CalendarClock className="size-5" aria-hidden />} label="De publicación a cierre" value={days} note={`Publicada el ${stats.listedOn}`} />
        <Stat icon={<Users className="size-5" aria-hidden />} label="Interés recibido" value={interested} />
        <Stat icon={<Receipt className="size-5" aria-hidden />} label="Success fee Relify" value={figures.fee} note={figures.feeNote} />
      </dl>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section aria-labelledby="sale-next">
          <h2 id="sale-next" className="mb-3 text-lg font-semibold text-[#1c2740]">Próximos pasos</h2>
          <ol className="flex flex-col gap-3">
            <Step
              icon={<Receipt className="size-4" aria-hidden />}
              title="Pago de la success fee"
              body={`Te enviaremos la factura de ${figures.fee} por email. Puedes pagarla por transferencia en los próximos 30 días.`}
              action={<a href="mailto:ayuda@itsreleva.com?subject=Factura%20success%20fee" className="text-sm font-medium text-[#465ab4]">¿Dudas con la factura?</a>}
            />
            <Step
              icon={<MessageSquareQuote className="size-4" aria-hidden />}
              title="Cuéntanos tu experiencia"
              body="Un testimonio de dos líneas ayuda a otros empresarios a dar el paso."
              action={<a href="mailto:ayuda@itsreleva.com?subject=Mi%20testimonio%20en%20Relify" className="text-sm font-medium text-[#465ab4]">Enviar testimonio</a>}
            />
            <Step
              icon={<FolderOpen className="size-4" aria-hidden />}
              title="¿Tienes otra empresa?"
              body="Publícala con la misma cuenta; tus datos de vendedor ya están verificados."
              action={<ListAnotherCompany />}
            />
          </ol>
        </section>
        <ArchivedDocs
          docs={docs}
          extra={
            <Link href="/mi-empresa/documentos" className="mt-4 inline-flex text-sm font-medium text-[#465ab4]">
              Ver Mis documentos
            </Link>
          }
        />
      </div>
    </div>
  );
}

export function BuyerProcessClosed({
  codename,
  slug,
  won,
  figures,
  docs,
}: {
  codename: string;
  slug: string;
  won: boolean;
  figures: SaleFigures;
  docs: Docs;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-[#2b3b4a]">{shortNickname(codename)}</h2>
          <span
            className={
              won
                ? "inline-flex items-center gap-1.5 rounded-full bg-[#dff3e7] px-2.5 py-1 text-xs font-semibold text-[#17663a]"
                : "rounded-full bg-[#f2f4f7] px-2.5 py-1 text-xs font-semibold text-[#475467]"
            }
          >
            {won ? <CircleCheck className="size-3.5" aria-hidden /> : null}
            {won ? "Compra completada" : "Vendida a otro comprador"}
          </span>
        </div>
        <Link href={`/proyectos/${slug}`} className="text-sm font-medium text-[#465ab4]">Ver ficha</Link>
      </div>
      {won ? (
        <>
          <p className="text-sm leading-6 text-[#5c6b78]">¡Enhorabuena! El contrato está firmado por las dos partes desde el {figures.date}. Te enviaremos la factura de la success fee por email.</p>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Figure label="Precio de cierre" value={figures.price} />
            <Figure label="Success fee Relify" value={figures.fee} note={figures.feeNote} />
            <Figure label="Fecha de cierre" value={figures.date} />
          </dl>
          <ArchivedDocs docs={docs} />
        </>
      ) : (
        <p className="text-sm leading-6 text-[#5c6b78]">El vendedor cerró la venta con otro comprador el {figures.date}. El proceso queda archivado; tus acuerdos firmados siguen disponibles en la ficha.</p>
      )}
    </section>
  );
}
