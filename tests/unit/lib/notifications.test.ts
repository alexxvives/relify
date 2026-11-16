import { describe, expect, it } from "vitest";
import { bellCount } from "@/lib/notifications";

describe("bellCount", () => {
  const items = [
    { title: "Nuevo interés", unread: true },
    { title: "Nueva pregunta", unread: true },
    { title: "NDA aceptado", unread: false },
  ];

  it("counts unread notices when nothing is pending", () => {
    expect(bellCount(items, 0)).toBe(2);
  });

  it("adds pending actions without counting their own notice twice", () => {
    expect(bellCount(items, 1)).toBe(2);
    expect(bellCount(items, 3)).toBe(4);
  });
});
