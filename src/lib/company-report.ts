import type { SabiRegistry } from "./sabi/registry";
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

export function compactEur(cents: number): string {
  const euros = cents / 100;
  const abs = Math.abs(euros);
  if (abs >= 1_000_000) {
    return `${es1.format(euros / 1_000_000)} M€`;
  }

  if (abs >= 1_000) {
    return `${es0.format(euros / 1_000)} k€`;
  }

  return `${es0.format(euros)} €`;
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

/** Debt, liquidity and solvency read as traffic lights. Thresholds are the usual rules of thumb, stated in each hint. */
export function healthSignals(years: SabiYear[]): HealthSignal[] {
  const signals: HealthSignal[] = [];

  const debt = lastWith(years, (year) => {
    const net = netDebtCents(year);
    return net === null ? null : { net, ebitda: year.ebitdaCents };
  });
  if (debt) {
    const { net, ebitda } = debt.value;
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
    } else if (ebitda === null || ebitda <= 0) {
      value = 6;
      display = "EBITDA ≤ 0";
      level = "bad";
      reading = `Debe ${compactEur(net)} netos y su EBITDA no es positivo, así que hoy no genera caja para devolverlos.`;
    } else {
      value = net / ebitda;
      display = `${es1.format(value)} años`;
      level = levelFor(value, zones);
      reading = `Podría pagar su deuda neta (${compactEur(net)}) con ${es1.format(value)} años de EBITDA.`;
    }

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
      hint: "Deuda neta ÷ EBITDA: cuántos años del resultado de explotación (antes de amortizaciones) haría falta para devolver la deuda financiera menos la caja. Deuda financiera = deudas a largo plazo + deudas financieras a corto. Criterio orientativo habitual en compraventas de pymes.",
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
      hint: "Prueba ácida (SABI) = (activo corriente − existencias) ÷ pasivo corriente. Es la liquidez más exigente: no cuenta el stock, que tarda en venderse.",
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

  const coverage = lastWith(years, (year) => ratioOf(year, "interestCoverage"));
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
      value: coverage.value,
      display: `${es1.format(coverage.value)}x`,
      level: levelFor(coverage.value, zones),
      reading:
        coverage.value < 0
          ? "El resultado de explotación es negativo, así que no cubre los intereses de la deuda."
          : `El resultado de explotación paga ${es1.format(coverage.value)} veces los intereses de la deuda.`,
      min: 0,
      max: 10,
      zones,
      scale: "Rojo: menos de 2 · Ámbar: de 2 a 5 · Verde: 5 o más",
      hint: "Cobertura de intereses (SABI) = resultado de explotación (EBIT) ÷ gastos financieros.",
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
      hint: "Periodo de cobro (SABI) = deudores comerciales ÷ ingresos de explotación × 360.",
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

/** A few plain-Spanish sentences built only from the numbers on file (nothing is said about missing data). */
export function reportSummary(years: SabiYear[]): string[] {
  const lines: string[] = [];
  const revenue = years.filter((year) => year.revenueCents !== null && year.revenueCents > 0);
  if (revenue.length >= 2) {
    const first = revenue[0]!;
    const last = revenue[revenue.length - 1]!;
    const span = last.year - first.year;
    const total = pct(first.revenueCents!, last.revenueCents!);
    const cagr = span > 0 ? (Math.pow(last.revenueCents! / first.revenueCents!, 1 / span) - 1) * 100 : null;
    lines.push(
      `Los ingresos han pasado de ${compactEur(first.revenueCents!)} en ${first.year} a ${compactEur(last.revenueCents!)} en ${last.year} (${signed(total)}${cagr !== null && span > 1 ? `, ${signed(cagr)} de media al año` : ""}).`,
    );
    const previous = revenue[revenue.length - 2]!;
    if (revenue.length > 2) {
      const change = pct(previous.revenueCents!, last.revenueCents!);
      lines.push(`En el último ejercicio (${last.year}) ${change >= 0 ? "crecieron" : "cayeron"} un ${es1.format(Math.abs(change))} % frente a ${previous.year}.`);
    }
  } else if (revenue.length === 1) {
    lines.push(`Ingresos de ${compactEur(revenue[0]!.revenueCents!)} en ${revenue[0]!.year}.`);
  }

  const ebitda = [...years].reverse().find((year) => year.ebitdaCents !== null);
  if (ebitda) {
    const margin = marginPercent(ebitda.ebitdaCents, ebitda.revenueCents);
    lines.push(
      ebitda.ebitdaCents! >= 0
        ? `El EBITDA de ${ebitda.year} fue de ${compactEur(ebitda.ebitdaCents!)}${margin !== null ? `, un margen del ${es1.format(margin)} % sobre ingresos` : ""}.`
        : `El EBITDA de ${ebitda.year} fue negativo (${compactEur(ebitda.ebitdaCents!)}): la actividad no cubrió sus gastos de explotación.`,
    );
  }

  const results = years.filter((year) => year.netResultCents !== null);
  if (results.length > 0) {
    const last = results[results.length - 1]!;
    const positive = results.filter((year) => year.netResultCents! > 0).length;
    lines.push(
      `${last.netResultCents! >= 0 ? `Cerró ${last.year} con un beneficio de ${compactEur(last.netResultCents!)}` : `Cerró ${last.year} con pérdidas de ${compactEur(-last.netResultCents!)}`}${results.length > 1 ? ` y ha tenido beneficios en ${positive} de los ${results.length} ejercicios disponibles` : ""}.`,
    );
  }

  const debt = healthSignals(years).find((signal) => signal.key === "netDebtToEbitda");
  if (debt) {
    lines.push(debt.reading);
  }

  return lines;
}

export function reportFlags(years: SabiYear[]): ReportFlag[] {
  const flags: ReportFlag[] = [];
  const revenue = years.filter((year) => year.revenueCents !== null && year.revenueCents > 0);
  if (revenue.length >= 2) {
    const [previous, last] = revenue.slice(-2) as [SabiYear, SabiYear];
    const change = pct(previous.revenueCents!, last.revenueCents!);
    flags.push(change >= 0 ? { level: "good", text: `Ingresos al alza en ${last.year} (${signed(change)})` } : { level: "warn", text: `Ingresos a la baja en ${last.year} (${signed(change)})` });
  }

  const result = [...years].reverse().find((year) => year.netResultCents !== null);
  if (result) {
    flags.push(result.netResultCents! > 0 ? { level: "good", text: `Beneficio en ${result.year}` } : { level: "warn", text: `Pérdidas en ${result.year}` });
  }

  const ebitda = [...years].reverse().find((year) => year.ebitdaCents !== null);
  if (ebitda && ebitda.ebitdaCents! <= 0) {
    flags.push({ level: "warn", text: `EBITDA negativo en ${ebitda.year}` });
  }

  for (const signal of healthSignals(years)) {
    flags.push({ level: signal.level === "good" ? "good" : "warn", text: `${signal.label}: ${signal.display}` });
  }

  return flags;
}
