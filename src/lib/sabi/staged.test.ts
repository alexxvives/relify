import { describe, expect, it } from "vitest";
import { syntheticWorkbook } from "./__fixtures__/synthetic";
import { parseSabiWorkbook, parseSabiWorkbookStaged, sabiStages, type SabiStageEvent } from "./parse";

describe("parseSabiWorkbookStaged", () => {
  it("reports every section in order and returns the same report as the plain parse", async () => {
    const events: SabiStageEvent[] = [];
    const staged = await parseSabiWorkbookStaged(syntheticWorkbook(), (event) => {
      events.push(event);
    });
    expect(events.map((event) => event.stage)).toEqual([...sabiStages]);
    expect(events.find((event) => event.stage === "balance")!.count).toBeGreaterThan(0);
    expect(staged).toEqual(await parseSabiWorkbook(syntheticWorkbook()));
  });

  it("stops early on a non-xlsx file", async () => {
    const events: SabiStageEvent[] = [];
    expect(await parseSabiWorkbookStaged(new TextEncoder().encode("hola"), (event) => void events.push(event))).toEqual({ ok: false, code: "not_xlsx" });
    expect(events).toEqual([]);
  });
});
