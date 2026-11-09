import { describe, expect, it } from "vitest";
import { destinationForUser } from "./auth-input";
import { projectDetailMetadata } from "./project-page-access";
import { safeReturnPath, signInHref } from "./sign-in-return";

describe("safeReturnPath", () => {
  it("keeps an internal project ficha path", () => {
    expect(safeReturnPath("/proyectos/int-empresa-tecnologia")).toBe("/proyectos/int-empresa-tecnologia");
    expect(safeReturnPath("/proyectos")).toBe("/proyectos");
  });

  it("rejects open redirects and traversal", () => {
    expect(safeReturnPath("https://evil.example")).toBeNull();
    expect(safeReturnPath("//evil.example")).toBeNull();
    expect(safeReturnPath("/\\evil")).toBeNull();
    expect(safeReturnPath("/proyectos/../entrar")).toBeNull();
    expect(safeReturnPath("/entrar?next=https://evil.example")).toBeNull();
    expect(safeReturnPath("")).toBeNull();
  });
});

describe("signInHref", () => {
  it("adds the return path as siguiente", () => {
    expect(signInHref("/proyectos/int-empresa-tecnologia")).toBe(
      "/entrar?siguiente=%2Fproyectos%2Fint-empresa-tecnologia",
    );
  });
});

describe("destinationForUser return path", () => {
  it("honors a safe return path after onboarding and ignores it before", () => {
    expect(destinationForUser({ role: "investor", onboarded: true }, "/proyectos/int-empresa-tecnologia")).toBe(
      "/proyectos/int-empresa-tecnologia",
    );
    expect(destinationForUser({ role: "investor", onboarded: true }, "//evil.example")).toBe("/inversor");
    expect(destinationForUser({ role: "investor", onboarded: false }, "/proyectos/int-empresa-tecnologia")).toBe(
      "/onboarding",
    );
  });
});

describe("projectDetailMetadata", () => {
  it("does not include company fields for a logged-out visitor", () => {
    const meta = projectDetailMetadata({
      signedIn: false,
      project: { slug: "int-empresa-tecnologia", codename: "Empresa Tecnología", region: "Madrid" },
    });
    const blob = JSON.stringify(meta);
    expect(blob).not.toContain("Empresa Tecnología");
    expect(blob).not.toContain("Madrid");
    expect(blob).not.toContain("int-empresa-tecnologia");
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("names the company only after sign-in", () => {
    const meta = projectDetailMetadata({
      signedIn: true,
      project: { slug: "int-empresa-tecnologia", codename: "Empresa Tecnología", region: "Madrid" },
    });
    expect(meta.title).toBe("Empresa Tecnología");
    expect(meta.description).toContain("Madrid");
  });
});
