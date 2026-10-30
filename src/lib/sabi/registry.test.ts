import { describe, expect, it } from "vitest";
import { readSabiRegistry, sabiRegistryIsEmpty } from "./registry";

describe("readSabiRegistry", () => {
  it("drops malformed rows and keeps valid ones", () => {
    const registry = readSabiRegistry({
      directors: [{ name: "Ana", role: "Administrador", since: null, department: null, group: null }, { foo: 1 }],
      shareholdings: "x",
      subsidiaries: null,
      audits: [{ year: 2023, closingOn: null, opinion: null, auditorName: null, auditorCode: null, fields: {} }],
      banks: ["BANCO A", 3],
      activityCodes: [],
    });
    expect(registry.directors).toHaveLength(1);
    expect(registry.shareholdings).toEqual([]);
    expect(registry.banks).toEqual(["BANCO A"]);
    expect(registry.activityCodes).toEqual({});
    expect(sabiRegistryIsEmpty(registry)).toBe(false);
  });

  it("is empty with no data", () => {
    expect(sabiRegistryIsEmpty(readSabiRegistry({ directors: null, shareholdings: null, subsidiaries: null, audits: null, banks: null, activityCodes: null }))).toBe(true);
  });
});
