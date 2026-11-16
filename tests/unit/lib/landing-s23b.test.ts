import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("Round S23b folder tile clicks", () => {
  it("opens the folder view from a click on the 3D graphic or peeking papers", () => {
    const folder = read("src/components/Folder.tsx");
    const graphic = read("src/components/seller/documents-folder.tsx");
    const docs = read("src/components/seller/seller-documents.tsx");

    expect(folder).toMatch(/onActivate\?: \(\) => void/);
    expect(folder).toMatch(/onActivate\?\.\(\)/);
    expect(folder).toMatch(/if \(onActivate\) \{[\s\S]*event\.stopPropagation\(\);[\s\S]*onActivate\(\);/);
    expect(graphic).toMatch(/openOn="hover"/);
    expect(graphic).toMatch(/onActivate=\{onActivate\}/);
    expect(graphic).toMatch(/pointer-events-auto/);
    expect(docs).toMatch(/data-folder-tile/);
    expect(docs).toMatch(/onActivate=\{onOpen\}/);
    expect(docs).toMatch(/event\.key === "Enter" \|\| event\.key === " "/);
  });
});
