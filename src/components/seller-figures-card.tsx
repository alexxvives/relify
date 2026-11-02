"use client";

import type { ReactNode } from "react";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MessageSquareText, ShieldCheck } from "lucide-react";
import { requestFigureCorrectionAction, type FigureCorrectionState } from "@/app/(app)/mi-empresa/actions";
import { FinancialTable } from "@/components/financial-table";
import { Button as KitButton, Card, Textarea } from "@/components/ui/form";
import { figureCorrectionMaxLength } from "@/lib/figure-correction-email";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import { formatCardEur } from "@/lib/money";
import type { SabiYear } from "@/lib/sabi/insights";
import { sellerKeyFigures } from "@/lib/seller-key-figures";

type Figures = Pick<InvestorProjectProfile, "incomeYears" | "incomeRows" | "balanceYears" | "balanceRows">;

/**
 * t76/t78: the seller's figures, read-only. Only the key numbers with their year; the charts live in the
 * Ficha pública. The seller can open the detail tables or propose a correction.
 */
export function SellerFiguresCard({ step, figures, reportYears = null }: { step: number; figures: Figures; reportYears?: SabiYear[] | null }) {
  const [detail, setDetail] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<FigureCorrectionState>(null);
  const [pending, startTransition] = useTransition();
  const hasIncome = figures.incomeRows.some((row) => row.key === "sales" && row.values.some((value) => value !== null));
  const hasBalance = figures.balanceRows.some((row) => row.values.some((value) => value !== null && value !== 0));
  const tiles = sellerKeyFigures(reportYears);
  const hasFigures = hasIncome || hasBalance || tiles.length > 0;

  function send() {
    const data = new FormData();
    data.set("message", message);
    startTransition(async () => {
      const result = await requestFigureCorrectionAction(null, data);
      setState(result);
      if (result?.ok) {
        setMessage("");
        setCorrecting(false);
      }
    });
  }

  return (
    <Card id="panel-figures" className="scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
            <StepNumber value={step} />
            Tus cifras
          </h2>
          <SectionIntro>Las cifras clave de tu último ejercicio y su evolución.</SectionIntro>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e6f6f4] px-2.5 py-1 text-xs font-semibold text-[#0f766e]">
          <ShieldCheck className="size-3.5" aria-hidden />
          Lo rellenamos nosotros
        </span>
      </div>

      {tiles.length > 0 ? (
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.key} className="rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] px-4 py-3">
              <dt className="text-xs font-medium text-[#5c6b78]">{tile.label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-[#1c2740]">
                {tile.unit === "eur" ? formatCardEur(tile.value) : new Intl.NumberFormat("es-ES").format(tile.value)}
              </dd>
              <dd className="mt-0.5 text-xs text-[#667085]">
                {tile.year}
                {tile.months !== null ? ` (${tile.months} m)` : ""}
              </dd>
            </div>
          ))}
        </dl>
      ) : hasFigures ? null : (
        <p className="mt-5 rounded-2xl bg-[#f4f7ff] px-4 py-4 text-sm text-[#1c2740]">
          Estamos preparando tus cifras. En un plazo de 24 h las verás aquí.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {hasFigures ? (
          <KitButton type="button" tone="outline" size="sm" aria-expanded={detail} onClick={() => setDetail((open) => !open)}>
            {detail ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
            {detail ? "Ocultar detalle" : "Ver detalle"}
          </KitButton>
        ) : null}
        {hasFigures ? (
          <KitButton type="button" tone="outline" size="sm" aria-expanded={correcting} onClick={() => setCorrecting((open) => !open)}>
            <MessageSquareText className="size-4" aria-hidden />
            Proponer corrección
          </KitButton>
        ) : null}
        {state ? (
          <p role="status" className={`text-sm font-medium ${state.ok ? "text-[#0f766e]" : "text-[#b42318]"}`}>
            {state.message}
          </p>
        ) : null}
      </div>

      {detail ? (
        <div className="mt-4 flex flex-col gap-4">
          {hasIncome ? (
            <div className="layout-table">
              <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">Cuenta de resultados</h3>
              <FinancialTable years={figures.incomeYears} rows={figures.incomeRows} />
            </div>
          ) : null}
          {hasBalance ? (
            <div className="layout-table">
              <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">Balance</h3>
              <FinancialTable years={figures.balanceYears} rows={figures.balanceRows} />
            </div>
          ) : null}
        </div>
      ) : null}

      {correcting ? (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] p-4">
          <label htmlFor="figure-correction" className="text-sm font-semibold text-[#1c2740]">
            ¿Qué cifra no es correcta?
          </label>
          <p id="figure-correction-help" className="text-xs text-[#5c6b78]">
            Indica el año, la partida y el valor correcto. Por ejemplo: «Ventas 2024: 1.250.000 €». Lo revisamos y lo corregimos nosotros.
          </p>
          <Textarea
            id="figure-correction"
            rows={3}
            maxLength={figureCorrectionMaxLength}
            aria-describedby="figure-correction-help"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto text-xs text-[#667085]">
              {message.length} / {figureCorrectionMaxLength}
            </span>
            <KitButton type="button" tone="outline" size="sm" onClick={() => setCorrecting(false)}>
              Cancelar
            </KitButton>
            <KitButton type="button" size="sm" disabled={pending || message.trim().length < 10} onClick={send}>
              {pending ? "Enviando…" : "Enviar corrección"}
            </KitButton>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/** t79: one-line section intro shared by "Cómo es tu negocio" and "Tus cifras". */
export function SectionIntro({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-[#64748b]">{children}</p>;
}

export function StepNumber({ value }: { value: number }) {
  return (
    <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1c2740] text-sm font-semibold text-white">
      {value}
    </span>
  );
}
