import { describe, expect, it } from "vitest";
import { destinationIsCurrent, destinationsForRole } from "./shell";

describe("destinationsForRole", () => {
  it("lists only that role's home", () => {
    expect(destinationsForRole("investor")).toEqual([
      { href: "/inversor", label: "Inicio" },
      { href: "/mercado", label: "Empresas en venta", section: "Explorar" },
      { href: "/procesos", label: "Mis procesos", section: "Gestión de procesos" },
      { href: "/asesoramiento", label: "Solicitar servicios", section: "Gestión de procesos" },
    ]);
    expect(destinationsForRole("seller")).toEqual([
      { href: "/mi-empresa", label: "Inicio" },
      { href: "/mi-empresa/detalles", label: "Detalles de empresa", section: "Mi empresa" },
      { href: "/mi-empresa/documentos", label: "Mis documentos", section: "Mi empresa" },
      { href: "/mi-empresa/procesos", label: "Mis procesos", section: "Gestión de procesos" },
      { href: "/mi-empresa/servicios", label: "Solicitar servicios", section: "Gestión de procesos" },
    ]);
    expect(destinationsForRole("advisor")).toEqual([
      { href: "/mandatos", label: "Inicio" },
      { href: "/mis-servicios", label: "Mis servicios" },
    ]);
    expect(destinationsForRole("admin")).toEqual([{ href: "/admin", label: "Inicio" }]);
    expect(destinationsForRole(null)).toEqual([]);
  });
});

describe("destinationIsCurrent", () => {
  it("marks Empresas on the market and on a project detail", () => {
    expect(destinationIsCurrent("/mercado", "/mercado")).toBe(true);
    expect(destinationIsCurrent("/mercado", "/proyectos/proyecto-duna")).toBe(true);
    expect(destinationIsCurrent("/mercado", "/proyectos")).toBe(false);
    expect(destinationIsCurrent("/mi-empresa", "/proyectos/proyecto-duna")).toBe(false);
    expect(destinationIsCurrent("/mi-empresa", "/mi-empresa/detalles")).toBe(false);
    expect(destinationIsCurrent("/mi-empresa/detalles", "/mi-empresa/detalles")).toBe(true);
  });
});
