import { describe, expect, it } from "vitest";
import { authCopy } from "./auth-copy";
import { projectDetailMetadata, projectSignInHref } from "./project-page-access";

describe("projectSignInHref", () => {
  it("returns to the ficha after sign-in", () => {
    expect(projectSignInHref("int-empresa-tecnologia")).toBe(
      "/entrar?siguiente=%2Fproyectos%2Fint-empresa-tecnologia",
    );
  });
});

describe("projectDetailMetadata", () => {
  it("does not name the company when the visitor is logged out", () => {
    const meta = projectDetailMetadata({
      signedIn: false,
      project: { slug: "int-empresa-tecnologia", codename: "Proyecto Quercus", region: "Madrid" },
    });

    expect(meta.title).toBe(authCopy.signInTitle);
    expect(meta.description).toBeUndefined();
    expect(meta.alternates).toBeUndefined();
    expect(JSON.stringify(meta)).not.toContain("Quercus");
    expect(JSON.stringify(meta)).not.toContain("Madrid");
    expect(JSON.stringify(meta)).not.toContain("int-empresa-tecnologia");
  });

  it("uses the public codename only after sign-in", () => {
    const meta = projectDetailMetadata({
      signedIn: true,
      project: { slug: "int-empresa-tecnologia", codename: "Proyecto Quercus", region: "Madrid" },
    });

    expect(meta.title).toBe("Proyecto Quercus");
    expect(meta.description).toContain("Madrid");
  });
});
