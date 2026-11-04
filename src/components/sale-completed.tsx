"use client";

import Link from "next/link";
import { Archive, BadgeEuro, CalendarClock, CircleCheck, FileText, FolderOpen, Handshake, KeyRound, MessageSquareQuote, PartyPopper, Receipt, Trophy, UserRound, Users } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ListAnotherCompany } from "@/components/company-switcher";
import { shortNickname } from "@/lib/nickname";
import type { ProcessFile } from "@/lib/deal-pipeline";
import { Card } from "@/components/ui/form";

export type SaleFigures = { price: string; fee: string; feeNote: string; date: string };

type Docs = { ndaHref: string | null; loiHref: string | null; contractHref: string | null; files?: ProcessFile[] };

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

export function SaleHero({ badge, title, body, priceLabel, price }: { badge: string; title: string; body: string; priceLabel: string; price: string }) {
  return (
    <>
      <PartyPopper className="pointer-events-none absolute -right-6 -bottom-8 size-48 text-white/10" aria-hidden />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Trophy className="size-3.5" aria-hidden /> {badge}
          </span>
          <h2 id="sale-done" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-2 text-base leading-7 text-white/80">{body}</p>
        </div>
        <div className="shrink-0 lg:text-right">
          <p className="text-sm text-white/70">{priceLabel}</p>
          <p className="text-4xl font-semibold tracking-tight whitespace-nowrap sm:text-5xl">{price}</p>
        </div>
      </div>
    </>
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

/** Signed NDA, LOI and contract links; shared by the seller's sale page and the buyer's purchase page. */
function SignedDocuments({ contractHref, loiHref, ndaHref }: { contractHref: string | null; loiHref: string | null; ndaHref: string | null }) {
  const docs = [
    { href: contractHref, label: "Contrato de compraventa" },
    { href: loiHref, label: "Carta de intenciones (LOI)" },
    { href: ndaHref, label: "Acuerdo de confidencialidad (NDA)" },
  ].filter((doc): doc is { href: string; label: string } => doc.href !== null);
  if (docs.length === 0) return null;
  return (
    <Card aria-labelledby="signed-docs">
      <h2 id="signed-docs" className="text-lg font-semibold text-[#1c2740]">Documentos firmados</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {docs.map((doc) => (
          <li key={doc.href}>
            <Link href={doc.href} className="flex items-center gap-3 rounded-xl border border-[#e7eaee] p-3 text-sm font-medium text-[#1c2740] hover:bg-[#f7f8fb]">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#465ab4]">
                <FileText className="size-4" aria-hidden />
              </span>
              {doc.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
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
  const interested = stats.interested === 1 ? "1 comprador interesado" : `${stats.interested} compradores interesados`;
  return (
    <div className="flex flex-col gap-4">
      <section
        className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1c2740_0%,#2f418f_55%,#465ab4_100%)] px-6 py-8 text-white sm:px-10 sm:py-10"
        aria-labelledby="sale-done"
      >
        <SaleHero
          badge={`Venta cerrada · ${figures.date}`}
          title={`¡Enhorabuena! Has vendido ${codename}.`}
          body="El contrato de compraventa está firmado por las dos partes. La empresa ya no aparece en el marketplace."
          priceLabel="Precio de cierre"
          price={figures.price}
        />
      </section>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<UserRound className="size-5" aria-hidden />} label="Comprador" value={stats.buyer} />
        <Stat icon={<CalendarClock className="size-5" aria-hidden />} label="De publicación a cierre" value={days} note={`Publicada el ${stats.listedOn}`} />
        <Stat icon={<Users className="size-5" aria-hidden />} label="Interés recibido" value={interested} />
        <Stat icon={<BadgeEuro className="size-5" aria-hidden />} label="Precio de venta" value={figures.price} note={`Cerrada el ${figures.date}`} />
      </dl>

      <SignedDocuments contractHref={docs.contractHref} loiHref={docs.loiHref} ndaHref={docs.ndaHref} />

      <section aria-labelledby="sale-next">
          <h2 id="sale-next" className="mb-3 text-lg font-semibold text-[#1c2740]">Próximos pasos</h2>
          <ol className="grid gap-3 md:grid-cols-2">
            <Step
              icon={<Receipt className="size-4" aria-hidden />}
              title="Pago de la success fee"
              body={`Te enviaremos la factura de ${figures.fee} (${figures.feeNote}) por email. Puedes pagarla por transferencia en los próximos 30 días.`}
              action={<a href="mailto:info@itsrelify.com?subject=Factura%20success%20fee" className="text-sm font-medium text-[#465ab4]">¿Dudas con la factura?</a>}
            />
            <Step
              icon={<MessageSquareQuote className="size-4" aria-hidden />}
              title="Cuéntanos tu experiencia"
              body="Un testimonio de dos líneas ayuda a otros empresarios a dar el paso."
              action={<a href="mailto:info@itsrelify.com?subject=Mi%20testimonio%20en%20Relify" className="text-sm font-medium text-[#465ab4]">Enviar testimonio</a>}
            />
            <Step
              icon={<FolderOpen className="size-4" aria-hidden />}
              title="¿Tienes otra empresa?"
              body="Publícala con la misma cuenta; tus datos de vendedor ya están verificados."
              action={<ListAnotherCompany />}
            />
            <Step
              icon={<Archive className="size-4" aria-hidden />}
              title="Tu documentación sigue disponible"
              body="Tus documentos firmados y el resto de la documentación siguen disponibles en solo lectura."
              action={<Link href="/mi-empresa/documentos" className="text-sm font-medium text-[#465ab4]">Ver Mis documentos</Link>}
            />
          </ol>
        </section>
    </div>
  );
}

export type BuyerPurchase = {
  codename: string;
  slug: string;
  price: string;
  fee: string;
  feeNote: string;
  date: string;
  seller: string;
  daysToClose: number;
  requestedOn: string;
  contractHref: string;
  ndaHref: string;
  loiHref: string;
};

export function BuyerPurchaseCompleted({ purchase }: { purchase: BuyerPurchase }) {
  useSaleConfetti();
  const days = purchase.daysToClose === 1 ? "1 día" : `${purchase.daysToClose} días`;
  return (
    <div className="flex flex-col gap-4">
      <section
        className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1c2740_0%,#2f418f_55%,#465ab4_100%)] px-6 py-8 text-white sm:px-10 sm:py-10"
        aria-labelledby="sale-done"
      >
        <SaleHero
          badge={`Compra cerrada · ${purchase.date}`}
          title={`¡Enhorabuena! Has comprado ${purchase.codename}.`}
          body="El contrato de compraventa está firmado por las dos partes. Ahora empieza el traspaso: aquí tienes todo lo que necesitas."
          priceLabel="Precio de compra"
          price={purchase.price}
        />
      </section>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<UserRound className="size-5" aria-hidden />} label="Vendedor" value={purchase.seller} />
        <Stat icon={<CalendarClock className="size-5" aria-hidden />} label="De la solicitud al cierre" value={days} note={`Solicitud el ${purchase.requestedOn}`} />
        <Stat icon={<BadgeEuro className="size-5" aria-hidden />} label="Precio de compra" value={purchase.price} note={`Cerrada el ${purchase.date}`} />
        <Stat icon={<Receipt className="size-5" aria-hidden />} label="Success fee" value={purchase.fee} note={purchase.feeNote} />
      </dl>

      <SignedDocuments contractHref={purchase.contractHref} loiHref={purchase.loiHref} ndaHref={purchase.ndaHref} />

      <section aria-labelledby="sale-next">
        <h2 id="sale-next" className="mb-3 text-lg font-semibold text-[#1c2740]">Próximos pasos</h2>
        <ol className="grid gap-3 md:grid-cols-2">
          <Step
            icon={<Receipt className="size-4" aria-hidden />}
            title="Pago de la success fee"
            body={`Te enviaremos la factura de ${purchase.fee} (${purchase.feeNote}) por email. Puedes pagarla por transferencia en los próximos 30 días.`}
            action={<a href="mailto:info@itsrelify.com?subject=Factura%20success%20fee" className="text-sm font-medium text-[#465ab4]">¿Dudas con la factura?</a>}
          />
          <Step
            icon={<KeyRound className="size-4" aria-hidden />}
            title="Traspaso y escritura"
            body="Coordina con el vendedor y tu notario la firma de la escritura, el cambio de titularidad y el traspaso de cuentas, contratos y licencias."
          />
          <Step
            icon={<Handshake className="size-4" aria-hidden />}
            title="Transición con el vendedor"
            body={`Acordad con ${purchase.seller} un periodo de acompañamiento para presentar clientes, proveedores y equipo.`}
            action={<Link href={`/proyectos/${purchase.slug}`} className="text-sm font-medium text-[#465ab4]">Ver la ficha de la empresa</Link>}
          />
          <Step
            icon={<FolderOpen className="size-4" aria-hidden />}
            title="¿Buscas otra empresa?"
            body="Tu perfil de comprador ya está verificado. Sigue explorando el marketplace."
            action={<Link href="/mercado" className="text-sm font-medium text-[#465ab4]">Ver empresas en venta</Link>}
          />
        </ol>
      </section>
    </div>
  );
}

/** Compact end-of-list row for a buyer process that ended in a sale (won or lost). */
export function ClosedProcessRow({
  codename,
  slug,
  closed,
  contractHref,
}: {
  codename: string;
  slug: string;
  closed: SaleFigures & { won: boolean };
  contractHref: string | null;
}) {
  return (
    <div className="grid items-center gap-x-4 gap-y-2 rounded-2xl border border-[#e7eaee] bg-[#fafbfc] px-5 py-3 text-sm sm:grid-cols-[minmax(8rem,1.2fr)_12.5rem_8.5rem_minmax(0,auto)]">
      <span className="font-semibold text-[#2b3b4a]">{shortNickname(codename)}</span>
      <span
        className={
          closed.won
            ? "inline-flex w-fit items-center gap-1 rounded-full bg-[#dff3e7] px-2.5 py-0.5 text-xs font-semibold text-[#17663a]"
            : "w-fit rounded-full bg-[#f2f4f7] px-2.5 py-0.5 text-xs font-semibold text-[#475467]"
        }
      >
        {closed.won ? <CircleCheck className="size-3.5" aria-hidden /> : null}
        {closed.won ? "Comprada" : "Vendida a otro comprador"}
      </span>
      <span className="text-[#667085] tabular-nums">{closed.date}</span>
      <span className="ml-auto flex items-center gap-4">
        {closed.won ? (
          <Link href="/inversor/compra" className="font-medium text-[#465ab4]">Ver compra</Link>
        ) : null}
        {closed.won && contractHref ? (
          <Link href={contractHref} className="font-medium text-[#465ab4]">Contrato</Link>
        ) : null}
        <Link href={`/proyectos/${slug}`} className="font-medium text-[#465ab4]">Ver ficha</Link>
      </span>
    </div>
  );
}
