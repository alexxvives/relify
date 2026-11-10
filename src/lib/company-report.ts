import type { SabiRegistry } from "./sabi/registry";
import {
  cashRunway,
  capexProxyCents,
  ebitdaToCashConversion,
  headlineLeverage,
  interestCoverageIsNs,
  interestCoverageNsHint,
  nofCents,
  nofDeltaCents,
  nofToSalesPercent,
  type HeadlineLeverageInput,
} from "./financial-metrics";
import { marginPercent, netDebtCents, type SabiYear } from "./sabi/insights";

/** t69: who is reading the company report. Advisors and the seller's "as a buyer" preview read it as "buyer". */
export type ReportRole = "admin" | "seller" | "buyer";

export type SignalLevel = "good" | "warn" | "bad";

/**
 * Registry data names people and companies (directors, shareholders, subsidiaries, auditors, banks), so it never
 * reaches a buyer: only the admin and the company's own seller get it. Activity codes carry no identity but
 * travel with the rest, so buyers simply get nothing from the registry.
 */
export function registryForRole(registry: SabiRegistry | null | undefined, role: ReportRole): SabiRegistry | null {
  if (!registry || role === "buyer") {
    return null;
  }

  return registry;
}

const es1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
const es0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

import { compactEur, isComparableBase, negligibleRevenue } from "./report-format";
import { publishedEbitdaFromAdjustments, storedEbitdaAdjustments, type EbitdaAdjustment } from "./ebitda-adjustments";

export { compactEur };

/** Closed years the Resumen, ratios and header cards all read. Empty rows stay out so a stub year cannot zero a KPI. */
export function reportSourceYears(years: readonly SabiYear[] | null | undefined): SabiYear[] {
  return (years ?? []).filter((year) => year.revenueCents !== null || year.ebitdaCents !== null || year.totalAssetsCents !== null);
}

export type ReportHeadline = {
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  hasApprovedAdjustments: boolean;
  hasPendingAdjustments: boolean;
};

/**
 * One source for seller and buyer Resumen cards: last closed year + approved adjustments.
 * Pending or oversized rows never change the headline. Falls back to project columns only when there are no years.
 */
export function reportHeadline(project: {
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  ebitdaAdjustments: EbitdaAdjustment[] | null | unknown;
  reportYears?: SabiYear[] | null;
}): ReportHeadline {
  const years = reportSourceYears(project.reportYears);
  const last = years.at(-1);
  const revenueCents = last?.revenueCents ?? project.revenueCents;
  const ebitdaCents = last?.ebitdaCents ?? project.ebitdaCents;
  const published = publishedEbitdaFromAdjustments(
    ebitdaCents,
    storedEbitdaAdjustments(project.ebitdaAdjustments),
    project.adjustedEbitdaCents,
    revenueCents,
  );
  return {
    revenueCents,
    ebitdaCents,
    adjustedEbitdaCents: published.adjustedEbitdaCents,
    hasApprovedAdjustments: published.hasApproved,
    hasPendingAdjustments: published.hasPending,
  };
}

export type Zone = { upTo: number; level: SignalLevel };

/** A plain-language health check: value, where it falls on a good/amber/bad scale and what that means. */
export type HealthSignal = {
  key: string;
  label: string;
  year: number;
  value: number;
  display: string;
  level: SignalLevel;
  reading: string;
  /** Domain of the gauge and its coloured zones, left to right (last zone runs to max). */
  min: number;
  max: number;
  zones: Zone[];
  scale: string;
  hint: string;
  ns?: boolean;
};

function levelFor(value: number, zones: Zone[]): SignalLevel {
  for (const zone of zones) {
    if (value < zone.upTo) {
      return zone.level;
    }
  }

  return zones[zones.length - 1]!.level;
}

function lastWith<T>(years: SabiYear[], pick: (year: SabiYear) => T | null): { year: SabiYear; value: T } | null {
  for (let index = years.length - 1; index >= 0; index -= 1) {
    const value = pick(years[index]!);
    if (value !== null && value !== undefined) {
      return { year: years[index]!, value };
    }
  }

  return null;
}

function ratioOf(year: SabiYear, key: string): number | null {
  const value = year.ratios[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function liquidity(year: SabiYear): number | null {
  if (year.currentAssetsCents !== null && year.currentLiabilitiesCents !== null && year.currentLiabilitiesCents > 0) {
    return year.currentAssetsCents / year.currentLiabilitiesCents;
  }

  return ratioOf(year, "generalLiquidity");
}

function equityShare(year: SabiYear): number | null {
  if (year.equityCents !== null && year.totalAssetsCents !== null && year.totalAssetsCents > 0) {
    return (year.equityCents / year.totalAssetsCents) * 100;
  }

  return ratioOf(year, "solvencyCoefficient");
}

function lastClosedYear(years: SabiYear[]): number | null {
  return years.length > 0 ? years[years.length - 1]!.year : null;
}

/** Debt, liquidity and solvency read as traffic lights. Thresholds are the usual rules of thumb, stated in each hint. */
export function healthSignals(years: SabiYear[], headline?: HeadlineLeverageInput): HealthSignal[] {
  const signals: HealthSignal[] = [];

  const debt = lastWith(years, netDebtCents);
  if (debt) {
    const net = debt.value;
    const useAdjusted = Boolean(
      headline?.hasApprovedAdjustments && headline.adjustedEbitdaCents !== null && debt.year.year === lastClosedYear(years),
    );
    const shown = headlineLeverage({
      netDebtCents: net,
      ebitdaCents: debt.year.ebitdaCents,
      adjustedEbitdaCents: useAdjusted ? headline?.adjustedEbitdaCents ?? null : null,
      hasApprovedAdjustments: useAdjusted,
    });
    const ebitdaLabel = shown.primaryLabel === "Deuda neta / EBITDA aj." ? "EBITDA aj." : "EBITDA";
    const zones: Zone[] = [
      { upTo: 2, level: "good" },
      { upTo: 4, level: "warn" },
      { upTo: Infinity, level: "bad" },
    ];
    let value: number;
    let display: string;
    let reading: string;
    let level: SignalLevel;
    if (net <= 0) {
      value = 0;
      display = "Caja neta";
      level = "good";
      reading = `Tiene más caja que deuda financiera (${compactEur(-net)} de caja neta): podría saldar toda su deuda hoy mismo.`;
    } else if (shown.ns || shown.primaryTimes === null) {
      value = 6;
      display = `${ebitdaLabel} ≤ 0`;
      level = "bad";
      reading = `Debe ${compactEur(net)} netos y su ${ebitdaLabel} no es positivo, así que hoy no genera caja para devolverlos.`;
    } else {
      value = shown.primaryTimes;
      display = `${es1.format(value)} años`;
      level = levelFor(value, zones);
      reading = `Podría pagar su deuda neta (${compactEur(net)}) con ${es1.format(value)} años de ${ebitdaLabel}.`;
    }
    const accountsNote =
      shown.secondaryTimes !== null ? ` Con el EBITDA de las cuentas: ${es1.format(shown.secondaryTimes)} años.` : "";

    signals.push({
      key: "netDebtToEbitda",
      label: "Capacidad de devolver la deuda",
      year: debt.year.year,
      value,
      display,
      level,
      reading,
      min: 0,
      max: 6,
      zones,
      scale: "Verde: menos de 2 años · Ámbar: de 2 a 4 · Rojo: más de 4",
      hint: `${shown.primaryLabel}: cuántos años de ${ebitdaLabel} haría falta para devolver la deuda financiera menos la caja. Deuda financiera = deudas a largo plazo + deudas financieras a corto.${accountsNote} Criterio orientativo habitual en compraventas de pymes.`,
    });
  }

  const current = lastWith(years, liquidity);
  if (current) {
    const zones: Zone[] = [
      { upTo: 1, level: "bad" },
      { upTo: 1.5, level: "warn" },
      { upTo: Infinity, level: "good" },
    ];
    signals.push({
      key: "liquidity",
      label: "Liquidez a corto plazo",
      year: current.year.year,
      value: current.value,
      display: `${es1.format(current.value)}x`,
      level: levelFor(current.value, zones),
      reading: `Por cada euro que debe a menos de un año tiene ${es1.format(current.value)} € en caja, clientes y existencias.`,
      min: 0,
      max: 3,
      zones,
      scale: "Rojo: menos de 1 · Ámbar: de 1 a 1,5 · Verde: 1,5 o más",
      hint: "Liquidez general = activo corriente ÷ pasivo corriente. Por debajo de 1, las deudas a corto superan lo que la empresa puede convertir en dinero en el año.",
    });
  }

  const acid = lastWith(years, (year) => ratioOf(year, "liquidityRatio"));
  if (acid) {
    const zones: Zone[] = [
      { upTo: 0.7, level: "bad" },
      { upTo: 1, level: "warn" },
      { upTo: Infinity, level: "good" },
    ];
    signals.push({
      key: "acid",
      label: "Liquidez sin existencias",
      year: acid.year.year,
      value: acid.value,
      display: `${es1.format(acid.value)}x`,
      level: levelFor(acid.value, zones),
      reading: `Sin contar el stock, cubre ${es1.format(acid.value)} € por cada euro de deuda a corto plazo.`,
      min: 0,
      max: 2.5,
      zones,
      scale: "Rojo: menos de 0,7 · Ámbar: de 0,7 a 1 · Verde: 1 o más",
      hint: "Prueba ácida = (activo corriente − existencias) ÷ pasivo corriente. Es la liquidez más exigente: no cuenta el stock, que tarda en venderse.",
    });
  }

  const solvency = lastWith(years, equityShare);
  if (solvency) {
    const zones: Zone[] = [
      { upTo: 20, level: "bad" },
      { upTo: 40, level: "warn" },
      { upTo: Infinity, level: "good" },
    ];
    const value = solvency.value;
    signals.push({
      key: "solvency",
      label: "Solvencia (autonomía financiera)",
      year: solvency.year.year,
      value,
      display: `${es1.format(value)} %`,
      level: levelFor(value, zones),
      reading:
        value < 0
          ? "Los fondos propios son negativos: las deudas superan todo lo que tiene la empresa."
          : `El ${es1.format(value)} % de lo que tiene la empresa es de los socios; el resto se financia con deudas.`,
      min: 0,
      max: 100,
      zones,
      scale: "Rojo: menos del 20 % · Ámbar: del 20 al 40 % · Verde: 40 % o más",
      hint: "Fondos propios ÷ total activo × 100. Cuanto más alto, menos depende la empresa de bancos y proveedores.",
    });
  }

  const coverage = lastWith(years, (year) => {
    if (interestCoverageIsNs(year)) {
      return { ns: true as const, value: 0 };
    }
    const value = ratioOf(year, "interestCoverage");
    return value === null ? null : { ns: false as const, value };
  });
  if (coverage) {
    const zones: Zone[] = [
      { upTo: 2, level: "bad" },
      { upTo: 5, level: "warn" },
      { upTo: Infinity, level: "good" },
    ];
    signals.push({
      key: "interestCoverage",
      label: "Cobertura de intereses",
      year: coverage.year.year,
      value: coverage.value.value,
      display: coverage.value.ns ? "n/s" : `${es1.format(coverage.value.value)}x`,
      level: coverage.value.ns ? "warn" : levelFor(coverage.value.value, zones),
      reading: coverage.value.ns
        ? interestCoverageNsHint
        : `El resultado de explotación paga ${es1.format(coverage.value.value)} veces los intereses de la deuda.`,
      min: 0,
      max: 10,
      zones,
      scale: "Rojo: menos de 2 · Ámbar: de 2 a 5 · Verde: 5 o más",
      hint: coverage.value.ns
        ? interestCoverageNsHint
        : "Cobertura de intereses = resultado de explotación (EBIT) ÷ gastos financieros.",
      ns: coverage.value.ns,
    });
  }

  const collection = lastWith(years, (year) => ratioOf(year, "collectionDays"));
  if (collection) {
    const zones: Zone[] = [
      { upTo: 60, level: "good" },
      { upTo: 90, level: "warn" },
      { upTo: Infinity, level: "bad" },
    ];
    signals.push({
      key: "collectionDays",
      label: "Plazo de cobro a clientes",
      year: collection.year.year,
      value: collection.value,
      display: `${es0.format(collection.value)} días`,
      level: levelFor(collection.value, zones),
      reading: `Los clientes tardan de media ${es0.format(collection.value)} días en pagar.`,
      min: 0,
      max: 180,
      zones,
      scale: "Verde: hasta 60 días (plazo legal general) · Ámbar: de 60 a 90 · Rojo: más de 90",
      hint: "Periodo de cobro = deudores comerciales ÷ ingresos de explotación × 360.",
    });
  }

  return signals;
}

function pct(from: number, to: number): number {
  return ((to - from) / Math.abs(from)) * 100;
}

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${es1.format(value)} %`;
}

export type ReportFlag = { level: "good" | "warn"; text: string };

export type SummarySegment = { text: string; strong: boolean };

/** t87: key figures in the summary are wrapped in ** markers; only our own templates add them (numbers, never user text). */
function b(text: string): string {
  return `**${text}**`;
}

/** Splits a marked summary line into plain and bold segments, so the UI renders <strong> without injecting HTML. */
export function summarySegments(line: string): SummarySegment[] {
  return line
    .split("**")
    .map((text, index) => ({ text, strong: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

/** A few plain-Spanish sentences built only from the numbers on file (nothing is said about missing data). */
export function reportSummary(years: SabiYear[], headline?: HeadlineLeverageInput): string[] {
  return reportSummaryMarked(years, headline).map((line) => line.replaceAll("**", ""));
}

/** Same sentences as reportSummary, with the key figures marked for bold (see summarySegments). */
export function reportSummaryMarked(years: SabiYear[], headline?: HeadlineLeverageInput): string[] {
  const lines: string[] = [];
  const revenue = years.filter((year) => year.revenueCents !== null && year.revenueCents > 0);
  if (revenue.length >= 2) {
    // t71: growth is measured from the first meaningful year (full year, ≥ 5 % of the latest revenue); an almost
    // empty start-up year would otherwise give +147.989 %.
    const last = revenue[revenue.length - 1]!;
    const first = revenue.slice(0, -1).find((year) => isComparableBase(year.revenueCents, last.revenueCents, year.months));
    const skipped = first ? revenue.slice(0, revenue.indexOf(first)) : revenue.slice(0, -1);
    const skippedNote =
      skipped.length > 0
        ? ` No se compara con ${skipped.map((year) => year.year).join(", ")} porque ${skipped.length > 1 ? "fueron ejercicios" : "fue un ejercicio"} incompleto${skipped.length > 1 ? "s" : ""} o con facturación casi nula (${skipped.map((year) => compactEur(year.revenueCents!)).join(", ")}).`
        : "";
    if (first) {
      const span = last.year - first.year;
      const total = pct(first.revenueCents!, last.revenueCents!);
      const cagr = span > 0 ? (Math.pow(last.revenueCents! / first.revenueCents!, 1 / span) - 1) * 100 : null;
      lines.push(
        `La facturación ha pasado de ${b(compactEur(first.revenueCents!))} en ${first.year} a ${b(compactEur(last.revenueCents!))} en ${last.year} (${b(signed(total))}${cagr !== null && span > 1 ? `, ${b(signed(cagr))} de media al año` : ""}).${skippedNote}`,
      );
    } else {
      lines.push(`Facturación de ${b(compactEur(last.revenueCents!))} en ${last.year}.${skippedNote}`);
    }
    const previous = revenue[revenue.length - 2]!;
    if (first && first !== previous && isComparableBase(previous.revenueCents, last.revenueCents, previous.months)) {
      const change = pct(previous.revenueCents!, last.revenueCents!);
      lines.push(`En el último ejercicio (${last.year}) ${change >= 0 ? "crecieron" : "cayeron"} un ${b(`${es1.format(Math.abs(change))} %`)} frente a ${previous.year}.`);
    }
  } else if (revenue.length === 1) {
    lines.push(`Facturación de ${b(compactEur(revenue[0]!.revenueCents!))} en ${revenue[0]!.year}.`);
  }

  const ebitda = [...years].reverse().find((year) => year.ebitdaCents !== null);
  if (ebitda) {
    const margin = negligibleRevenue(years)[years.indexOf(ebitda)] ? null : marginPercent(ebitda.ebitdaCents, ebitda.revenueCents);
    lines.push(
      ebitda.ebitdaCents! >= 0
        ? `El EBITDA de ${ebitda.year} fue de ${b(compactEur(ebitda.ebitdaCents!))}${margin !== null ? `, un margen del ${b(`${es1.format(margin)} %`)} sobre ventas` : ""}.`
        : `El EBITDA de ${ebitda.year} fue ${b("negativo")} (${b(compactEur(ebitda.ebitdaCents!))}): la actividad no cubrió sus gastos de explotación.`,
    );
  }

  const results = years.filter((year) => year.netResultCents !== null);
  if (results.length > 0) {
    const last = results[results.length - 1]!;
    const positive = results.filter((year) => year.netResultCents! > 0).length;
    lines.push(
      `${last.netResultCents! >= 0 ? `Cerró ${last.year} con un beneficio de ${b(compactEur(last.netResultCents!))}` : `Cerró ${last.year} con ${b(`pérdidas de ${compactEur(-last.netResultCents!)}`)}`}${results.length > 1 ? ` y ha tenido beneficios en ${b(`${positive} de los ${results.length}`)} ejercicios disponibles` : ""}.`,
    );
  }

  const debt = healthSignals(years, headline).find((signal) => signal.key === "netDebtToEbitda");
  if (debt) {
    lines.push(debt.reading);
  }

  return lines;
}

export function reportFlags(years: SabiYear[], headline?: HeadlineLeverageInput): ReportFlag[] {
  const flags: ReportFlag[] = [];
  const revenue = years.filter((year) => year.revenueCents !== null && year.revenueCents > 0);
  if (revenue.length >= 2) {
    const [previous, last] = revenue.slice(-2) as [SabiYear, SabiYear];
    const change = pct(previous.revenueCents!, last.revenueCents!);
    // t71: no % over a tiny or partial base year.
    const detail = isComparableBase(previous.revenueCents, last.revenueCents, previous.months) ? signed(change) : `${previous.year} no comparable`;
    flags.push(change >= 0 ? { level: "good", text: `Facturación al alza en ${last.year} (${detail})` } : { level: "warn", text: `Facturación a la baja en ${last.year} (${detail})` });
  }

  const result = [...years].reverse().find((year) => year.netResultCents !== null);
  if (result) {
    flags.push(result.netResultCents! > 0 ? { level: "good", text: `Beneficio en ${result.year}` } : { level: "warn", text: `Pérdidas en ${result.year}` });
  }

  const ebitda = [...years].reverse().find((year) => year.ebitdaCents !== null);
  if (ebitda && ebitda.ebitdaCents! <= 0) {
    flags.push({ level: "warn", text: `EBITDA negativo en ${ebitda.year}` });
  }

  for (const signal of healthSignals(years, headline)) {
    flags.push({ level: signal.level === "good" ? "good" : "warn", text: `${signal.label}: ${signal.display}` });
  }

  return flags;
}

/* ---------- t70: due-diligence quick read ---------- */

export type DiligenceLevel = "good" | "warn" | "bad" | "info";
export type DiligenceCheck = { key: string; label: string; value: string; level: DiligenceLevel; text: string };

const months1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

/** Operating working capital (NOF). Same formula as `nofCents`. */
export function operatingWorkingCapital(year: SabiYear): number | null {
  return nofCents(year);
}

/**
 * Checks a buyer or accountant runs first, computed only from the filed accounts (and the audit opinion when the
 * registry has one). Approximations say so in their text. Nothing is shown for a check without data.
 */
export function diligenceChecks(years: SabiYear[], audits: SabiRegistry["audits"] = [], sellerSaysAudited = false): DiligenceCheck[] {
  const checks: DiligenceCheck[] = [];
  const closed = years.filter((year) => year.revenueCents !== null || year.totalAssetsCents !== null);
  const last = closed[closed.length - 1];
  if (!last) {
    return checks;
  }
  const previous = closed.length > 1 ? closed[closed.length - 2]! : null;

  // Information quality: how many years, short years, audit.
  const short = closed.filter((year) => year.months !== null && year.months !== 12);
  const audit = [...audits].sort((left, right) => right.year - left.year)[0];
  checks.push({
    key: "information",
    label: "Calidad de la información",
    value: `${closed.length} ejercicio${closed.length === 1 ? "" : "s"}${audit?.opinion ? ` · auditoría ${audit.year}: ${audit.opinion}` : sellerSaysAudited ? " · auditada según el vendedor" : " · sin auditoría registrada"}`,
    level: short.length > 0 || !audit ? "warn" : "good",
    text: [
      short.length > 0 ? `Ejercicio${short.length > 1 ? "s" : ""} de duración distinta a 12 meses (${short.map((year) => `${year.year}: ${year.months} meses`).join(", ")}): no son comparables sin anualizar.` : null,
      audit
        ? null
        : sellerSaysAudited
          ? "El vendedor indica que las cuentas están auditadas: pedir la opinión del auditor."
          : "No consta informe de auditoría: las cifras no están verificadas por un tercero.",
    ]
      .filter(Boolean)
      .join(" ") || "Cuentas depositadas y auditadas.",
  });

  // Recurring losses.
  const results = closed.filter((year) => year.netResultCents !== null);
  if (results.length > 0) {
    const losses = results.filter((year) => year.netResultCents! < 0).length;
    checks.push({
      key: "losses",
      label: "Resultados",
      value: `Pérdidas en ${losses} de ${results.length}`,
      level: losses === 0 ? "good" : losses === results.length || losses >= 2 ? "bad" : "warn",
      text: losses === 0 ? "Beneficio en todos los ejercicios disponibles." : "Pérdidas repetidas: revisar si son estructurales o por gastos no recurrentes antes de valorar.",
    });
  }

  // Equity.
  if (last.equityCents !== null && last.totalAssetsCents !== null && last.totalAssetsCents > 0) {
    const ratio = (last.equityCents / last.totalAssetsCents) * 100;
    checks.push({
      key: "equity",
      label: "Patrimonio neto",
      value: `${compactEur(last.equityCents)} (${es1.format(ratio)} % del activo)`,
      level: last.equityCents <= 0 ? "bad" : ratio < 20 ? "warn" : "good",
      text:
        last.equityCents <= 0
          ? "Patrimonio negativo: posible causa de disolución si queda por debajo de la mitad del capital social. Revisar con el asesor legal."
          : ratio < 20
            ? "Poco patrimonio frente al activo: la empresa se financia sobre todo con deuda y proveedores."
            : "La empresa se financia en buena parte con fondos propios.",
    });
  }

  const runway = cashRunway(last, previous);
  if (runway?.kind === "generates") {
    checks.push({
      key: "runway",
      label: "Caja (runway)",
      value: "No aplica (genera caja)",
      level: "good",
      text: `La tesorería subió de ${compactEur(runway.startCents)} a ${compactEur(runway.endCents)} en ${last.year}: el negocio genera caja.`,
    });
  } else if (runway?.kind === "months") {
    checks.push({
      key: "runway",
      label: "Caja (runway)",
      value: `≈ ${months1.format(runway.months)} meses`,
      level: runway.months < 12 ? "bad" : "warn",
      text: `Caja actual ${compactEur(runway.cashCents)} ÷ consumo mensual ${compactEur(runway.monthlyBurnCents)} (tesorería de ${compactEur(runway.startCents)} a ${compactEur(runway.endCents)} en ${last.year}).`,
    });
  }

  // Operating working capital and cash conversion.
  const nof = nofCents(last);
  if (nof !== null) {
    const base = nofToSalesPercent(last);
    const change = nofDeltaCents(last, previous);
    checks.push({
      key: "workingCapital",
      label: "Necesidades operativas de fondos (NOF)",
      value: `${compactEur(nof)}${base !== null ? ` (${es1.format(base)} % de ventas)` : ""}`,
      level: nof < 0 ? "good" : base !== null && base > 25 ? "warn" : "info",
      text: `${nof < 0 ? "Clientes y existencias se financian con proveedores y otros acreedores a corto plazo." : "Dinero inmovilizado en clientes y existencias, neto de proveedores."}${change !== null && previous ? ` ${change > 0 ? "Aumentó" : "Bajó"} ${compactEur(Math.abs(change))} frente a ${previous.year}.` : ""} Cálculo: activo corriente − caja − (pasivo corriente − deuda financiera a corto).`,
    });
    const conversion = ebitdaToCashConversion(last, previous);
    if (conversion) {
      const ratioText = conversion.ns || conversion.ratio === null ? "n/s" : `${es1.format(conversion.ratio * 100)} %`;
      checks.push({
        key: "cashConversion",
        label: "Conversión EBITDA a caja (aproximada)",
        value: ratioText,
        level: conversion.ns ? "info" : conversion.ratio !== null && conversion.ratio < 0 ? "bad" : conversion.ratio !== null && conversion.ratio < 0.6 ? "warn" : "good",
        text: conversion.ns
          ? `No significativo: el EBITDA de ${last.year} no es positivo.`
          : `Aproximada: (EBITDA − variación de NOF − capex aproximado) ÷ EBITDA en ${last.year}.`,
      });
    }
  }

  const capex = capexProxyCents(last, previous);
  if (capex !== null && previous) {
    const share = last.revenueCents !== null && last.revenueCents > 0 ? (capex / last.revenueCents) * 100 : null;
    const depreciation = last.ebitdaCents !== null && last.ebitCents !== null ? last.ebitdaCents - last.ebitCents : null;
    checks.push({
      key: "capex",
      label: "Inversión aproximada (capex)",
      value: `${compactEur(capex)}${share !== null ? ` (${es1.format(share)} % de ventas)` : ""}`,
      level: "info",
      text: `Variación del activo no corriente${depreciation !== null ? ` más amortizaciones (${compactEur(depreciation)})` : ""} en ${last.year}. Aproximado: incluye inversiones financieras y revalorizaciones; pedir el detalle al vendedor.`,
    });
  }

  // Debt maturity split.
  const longDebt = last.longTermDebtCents ?? 0;
  const shortDebt = last.shortTermDebtCents ?? 0;
  if (longDebt + shortDebt > 0) {
    const shortShare = (shortDebt / (longDebt + shortDebt)) * 100;
    checks.push({
      key: "debtMaturity",
      label: "Vencimiento de la deuda bancaria",
      value: `${es1.format(shortShare)} % a menos de un año`,
      level: shortShare > 60 ? "warn" : "good",
      text: `${compactEur(shortDebt)} a corto y ${compactEur(longDebt)} a largo plazo. ${shortShare > 60 ? "La mayor parte vence en 12 meses: comprobar renovaciones y pólizas." : "La deuda se reparte en el tiempo."}`,
    });
  }

  // Staff weight.
  if (last.staffCostsCents !== null && last.revenueCents !== null && last.revenueCents > 0) {
    const share = (Math.abs(last.staffCostsCents) / last.revenueCents) * 100;
    checks.push({
      key: "staffWeight",
      label: "Peso del personal",
      value: `${es1.format(share)} % de los ingresos`,
      level: share > 60 ? "warn" : "info",
      text: share > 60 ? "Negocio muy intensivo en personal: el margen depende de la productividad y de retener al equipo clave." : "Gastos de personal sobre ingresos del último ejercicio.",
    });
  }

  return checks;
}
