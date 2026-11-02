import type { SabiRegistry } from "@/lib/sabi/registry";

/**
 * t77: what a buyer may see from the mercantile registry.
 * - Before the NDA: nothing that identifies the company. Only a one-line audit summary (no auditor) and the
 *   CNAE activity codes, which describe a sector, not a company.
 * - After the NDA: audit by year with the auditor, and the directors (name and role).
 * Shareholders, subsidiaries and banks never reach buyers (banks are admin-only; the seller sees their own).
 */
export type BuyerAudit = { year: number; closingOn: string | null; status: string; auditor: string | null };
export type BuyerActivity = { code: string; title: string; main: boolean };
export type BuyerRegistry = {
  auditLine: string | null;
  activities: BuyerActivity[];
  audits: BuyerAudit[] | null;
  directors: { name: string; role: string }[] | null;
};

const opinionLabels: Array<[RegExp, string]> = [
  [/pendiente de tratamiento/i, "En trámite en el registro"],
  [/sin datos/i, "No auditada / sin dato"],
  [/desfavorable/i, "Opinión desfavorable"],
  [/denegad/i, "Opinión denegada"],
  [/salvedad/i, "Opinión con salvedades"],
  [/aprobad|favorable|limpia/i, "Opinión favorable"],
];

/** Registry audit statuses in plain Spanish ("Pendiente de tratamiento" → "En trámite en el registro"). */
export function auditStatusLabel(opinion: string | null | undefined): string {
  const text = opinion?.trim();
  if (!text) {
    return "No auditada / sin dato";
  }

  return opinionLabels.find(([pattern]) => pattern.test(text))?.[1] ?? text;
}

function audited(audit: { opinion: string | null; auditorName: string | null }): boolean {
  return Boolean(audit.auditorName?.trim()) || auditStatusLabel(audit.opinion).startsWith("Opinión");
}

/** "Cuentas auditadas en 2023 · opinión favorable": latest audited year, never the auditor. Null when nothing was audited. */
export function auditSummaryLine(audits: SabiRegistry["audits"]): string | null {
  const latest = [...audits].sort((a, b) => b.year - a.year).find(audited);
  if (!latest) {
    return null;
  }

  const status = auditStatusLabel(latest.opinion);
  return status.startsWith("Opinión") ? `Cuentas auditadas en ${latest.year} · ${status.toLowerCase()}` : `Cuentas auditadas en ${latest.year}`;
}

export function buyerRegistryView(registry: SabiRegistry | null | undefined, ndaAccepted: boolean): BuyerRegistry | null {
  if (!registry) {
    return null;
  }

  const cnae = registry.activityCodes.cnae2009 ?? registry.activityCodes.cnae2025;
  const activities: BuyerActivity[] = cnae
    ? [...cnae.primary.map((code) => ({ code: code.code, title: code.description, main: true })), ...cnae.secondary.map((code) => ({ code: code.code, title: code.description, main: false }))]
    : [];
  const view: BuyerRegistry = { auditLine: auditSummaryLine(registry.audits), activities, audits: null, directors: null };

  if (ndaAccepted) {
    view.audits = [...registry.audits]
      .sort((a, b) => b.year - a.year)
      .map((audit) => ({ year: audit.year, closingOn: audit.closingOn, status: auditStatusLabel(audit.opinion), auditor: audit.auditorName?.trim() || null }));
    const seen = new Set<string>();
    view.directors = registry.directors.flatMap((person) => {
      const key = `${person.name}|${person.role}`;
      if (seen.has(key)) {
        return [];
      }
      seen.add(key);
      return [{ name: person.name, role: person.role }];
    });
  }

  return view.auditLine || view.activities.length > 0 || view.audits?.length || view.directors?.length ? view : null;
}
