import { describe, expect, it } from "vitest";
import { topShareholders } from "@/lib/sabi/holders";

const h = (name: string, direct: string | null) => ({ name, direct, total: null });

describe("topShareholders", () => {
  it("sorts known stakes, keeps a slot for the grouped unknown line and counts the rest", () => {
    const rows = [h("a", "-"), h("b", "8,10"), h("c", ">50,00"), h("d", null), h("e", "1,00"), h("f", "2,00"), h("g", "3,00")];
    const top = topShareholders(rows);
    expect(top.shown.map((row) => row.name)).toEqual(["c", "b", "g", "f"]);
    expect(top.unknown.map((row) => row.name)).toEqual(["a", "d"]);
    expect(top.hidden).toBe(3);
  });

  it("uses all five rows when every % is known", () => {
    const rows = ["1", "2", "3", "4", "5", "6"].map((value) => h(value, value));
    const top = topShareholders(rows);
    expect(top.shown).toHaveLength(5);
    expect(top.hidden).toBe(1);
  });
});
