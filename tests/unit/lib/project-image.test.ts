import { describe, expect, it } from "vitest";
import { projectImageSrc, seededProjectImages } from "@/lib/project-image";

describe("projectImageSrc", () => {
  it("gives the seeded projects distinct illustrations", () => {
    const images = seededProjectImages();

    expect(images).toHaveLength(3);
    expect(new Set(images).size).toBe(3);
    expect(projectImageSrc("proyecto-olivo")).toBe("/projects/proyecto-olivo.jpg");
    expect(projectImageSrc("proyecto-roble")).toBe("/projects/proyecto-roble.jpg");
    expect(projectImageSrc("proyecto-duna")).toBe("/projects/proyecto-duna.jpg");
    expect(projectImageSrc("proyecto-borrador")).toBeNull();
  });
});
