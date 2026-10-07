import { describe, expect, it } from "vitest";
import { layoutTreemap } from "./treemap";

describe("layoutTreemap", () => {
  it("fills the frame with one tile per positive value", () => {
    const tiles = layoutTreemap(
      [
        { id: "a", label: "Industria", value: 2 },
        { id: "b", label: "Comercio", value: 1 },
        { id: "c", label: "Hostelería", value: 1 },
        { id: "d", label: "Vacío", value: 0 },
      ],
      200,
      100,
    );
    const area = tiles.reduce((sum, tile) => sum + tile.width * tile.height, 0);

    expect(tiles.map((tile) => tile.id)).toEqual(["a", "b", "c"]);
    expect(area).toBeCloseTo(200 * 100, 4);
    expect(tiles.every((tile) => tile.x >= 0 && tile.y >= 0 && tile.x + tile.width <= 200.01 && tile.y + tile.height <= 100.01)).toBe(
      true,
    );
  });
});
