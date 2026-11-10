"use client";

import { detailCard, detailCardHead } from "@/components/detail-card";

import type { ReactNode } from "react";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MessageSquareText } from "lucide-react";
import { requestFigureCorrectionAction, type FigureCorrectionState } from "@/app/(app)/mi-empresa/actions";
import { FinancialTable } from "@/components/financial-table";
import { Button as KitButton, Card, Textarea } from "@/components/ui/form";
import { figureCorrectionMaxLength } from "@/lib/figure-correction-email";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import { FieldHint } from "@/components/field-hint";
import { companyCopy } from "@/lib/company-copy";
import { headlineEbitdaMargin } from "@/lib/financial-metrics";
import { formatCardEur } from "@/lib/money";
import type { SabiYear } from "@/lib/sabi/insights";
import { projectHasAdjustments } from "@/lib/seller-draft-guard";
import { sellerKeyFigures, sellerOperatingFigures } from "@/lib/seller-key-figures";

type Figures = Pick<
  InvestorProjectProfile,
  "incomeYears" | "incomeRows" | "balanceYears" | "balanceRows" | "revenueCents" | "ebitdaCents" | "adjustedEbitdaCents" | "ebitdaAdjustments"
>;

/**
 * t76/t78: the seller's figures, read-only. Only the key numbers; the charts live in the
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
  const headline = headlineEbitdaMargin({
    revenueCents: figures.revenueCents,
    ebitdaCents: figures.ebitdaCents,
    adjustedEbitdaCents: figures.adjustedEbitdaCents,
    hasAdjustments: projectHasAdjustments(figures),
  });
  const operating = sellerOperatingFigures(reportYears);
  const tiles = sellerKeyFigures(reportYears).map((tile) => {
    if (tile.key !== "ebitdaMargin" || headline.primaryBp === null) {
      return tile;
    }
    return { ...tile, label: headline.primaryLabel, value: Math.round(headline.primaryBp / 10) / 10 };
  });
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
          <p className="mt-1 text-xs text-[#8b95a7]">{companyCopy.figuresAccountsLine}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasFigures ? (
            <KitButton type="button" tone="outline" size="sm" aria-expanded={correcting} onClick={() => setCorrecting((open) => !open)}>
              <MessageSquareText className="size-4" aria-hidden />
              Proponer corrección
            </KitButton>
          ) : null}
        </div>
      </div>

      {tiles.length > 0 ? (
        <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.key} className="rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] px-4 py-3">
              <dt className="text-xs font-medium text-[#5c6b78]">{tile.label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-[#1c2740]">
                {tile.unit === "eur"
                  ? formatCardEur(tile.value)
                  : tile.unit === "percent"
                    ? `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(tile.value)} %`
                    : new Intl.NumberFormat("es-ES").format(tile.value)}
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
        {state ? (
          <p role="status" className={`text-sm font-medium ${state.ok ? "text-[#0f766e]" : "text-[#b42318]"}`}>
            {state.message}
          </p>
        ) : null}
      </div>

      {detail ? (
        // t80: two clearly separated tables, each titled in its own header, same column grid, key rows only.
        <div className="mt-4 flex flex-col gap-6">
          {/* t92: same grey-headed card as the ficha's Detalle de cuentas (shared detailCard styles). */}
          {hasIncome ? (
            <div className={detailCard}>
              <h3 className={detailCardHead}>Cuenta de resultados</h3>
              <div className="p-3 sm:p-4">
                <FinancialTable aligned years={figures.incomeYears} rows={keyRows(figures.incomeRows)} />
              </div>
            </div>
          ) : null}
          {hasBalance ? (
            <div className={detailCard}>
              <h3 className={detailCardHead}>Balance</h3>
              <div className="p-3 sm:p-4">
                <FinancialTable aligned years={figures.balanceYears} rows={keyRows(figures.balanceRows)} />
              </div>
            </div>
          ) : null}
          {operating.length > 0 ? (
            <div className={detailCard}>
              <h3 className={detailCardHead}>Cifras operativas</h3>
              <dl className="grid grid-cols-1 gap-px bg-[#eef1f6] sm:grid-cols-2">
                {operating.map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-3 bg-white px-4 py-3">
                    <dt className="flex min-w-0 items-center gap-1.5 text-sm text-[#5c6b78]">
                      {row.label}
                      <FieldHint text={row.hint} />
                    </dt>
                    <dd className="shrink-0 text-sm font-semibold tabular-nums text-[#1c2740]">{row.display}</dd>
                  </div>
                ))}
              </dl>
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

/** t80: the detail lists only lines with figures (subtotals always), not every all-zero line of the accounts model. */
function keyRows<T extends { emphasis: boolean; values: Array<number | null> }>(rows: T[]): T[] {
  return rows.filter((row) => row.emphasis || row.values.some((value) => value != null && value !== 0));
}
