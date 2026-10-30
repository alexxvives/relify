import type { SabiAudit, SabiCodeScheme, SabiCodeSet, SabiHolding, SabiPerson } from "@/lib/sabi/parse";

/** t67: the SABI lists stored as JSON columns (directors, holdings, audits, banks, codes), read back for the ficha. */
export type SabiRegistry = {
  directors: SabiPerson[];
  shareholdings: SabiHolding[];
  subsidiaries: SabiHolding[];
  audits: SabiAudit[];
  banks: string[];
  activityCodes: Partial<Record<SabiCodeScheme, SabiCodeSet>>;
};

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function readSabiRegistry(row: { directors: unknown; shareholdings: unknown; subsidiaries: unknown; audits: unknown; banks: unknown; activityCodes: unknown }): SabiRegistry {
  return {
    directors: list<SabiPerson>(row.directors).filter((person) => typeof person?.name === "string"),
    shareholdings: list<SabiHolding>(row.shareholdings).filter((holder) => typeof holder?.name === "string"),
    subsidiaries: list<SabiHolding>(row.subsidiaries).filter((holder) => typeof holder?.name === "string"),
    audits: list<SabiAudit>(row.audits).filter((audit) => typeof audit?.year === "number"),
    banks: list<unknown>(row.banks).filter((bank): bank is string => typeof bank === "string"),
    activityCodes: row.activityCodes && typeof row.activityCodes === "object" && !Array.isArray(row.activityCodes) ? (row.activityCodes as SabiRegistry["activityCodes"]) : {},
  };
}

export function sabiRegistryIsEmpty(registry: SabiRegistry): boolean {
  return (
    registry.directors.length + registry.shareholdings.length + registry.subsidiaries.length + registry.audits.length + registry.banks.length === 0 &&
    Object.keys(registry.activityCodes).length === 0
  );
}

