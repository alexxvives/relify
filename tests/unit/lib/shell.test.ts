import { describe, expect, it } from "vitest";
import { destinationIsCurrent, destinationsForRole, noticeOpenOnPath, processMenuTarget, tabDestinations, tabLabelForHref } from "@/lib/shell";

describe("destinationsForRole", () => {
  it("lists only that role's home", () => {
    expect(destinationsForRole("investor")).toEqual([
      { href: "/inversor", label: "Inicio" },
      { href: "/mercado", label: "Empresas en venta", section: "Explorar" },
      { href: "/tendencias", label: "Tendencias", section: "Explorar" },
      { href: "/procesos", label: "Mis procesos", section: "Gestión de procesos" },
      { href: "/asesoramiento", label: "Mi asesor", section: "Gestión de procesos" },
    ]);
    expect(destinationsForRole("seller")).toEqual([
      { href: "/mi-empresa", label: "Inicio" },
      { href: "/mi-empresa/detalles", label: "Detalles de empresa", section: "Mi empresa" },
      { href: "/mi-empresa/documentos", label: "Mis documentos", section: "Mi empresa" },
      { href: "/mi-empresa/procesos", label: "Mis procesos", section: "Gestión de procesos" },
      { href: "/mi-empresa/servicios", label: "Mi asesor", section: "Gestión de procesos" },
    ]);
    expect(destinationsForRole("advisor")).toEqual([
      { href: "/mandatos", label: "Inicio" },
      { href: "/mis-servicios", label: "Mis servicios", section: "Perfil" },
      { href: "/mandatos/encargos", label: "Encargos", section: "Trabajo" },
      { href: "/mandatos/venta", label: "Mis procesos", section: "Trabajo" },
    ]);
    expect(destinationsForRole("admin")).toEqual([
      { href: "/admin", label: "Inicio" },
      { href: "/admin/empresas", label: "Empresas", section: "Gestión" },
      { href: "/admin/cuentas", label: "Cuentas", section: "Gestión" },
      { href: "/admin/conexiones", label: "Conexiones", section: "Gestión" },
      { href: "/admin/asesores", label: "Asesores", section: "Gestión" },
      { href: "/admin/facturacion", label: "Facturación", section: "Gestión" },
      { href: "/admin/mensajes", label: "Mensajes", section: "Gestión" },
      { href: "/admin/lista-de-espera", label: "Lista de espera", section: "Gestión" },
      { href: "/admin/valoraciones", label: "Valoraciones", section: "Gestión" },
    ]);
    expect(destinationsForRole(null)).toEqual([]);
  });
});

describe("tabDestinations", () => {
  it("keeps three short-label destinations per role for the compact tab bar", () => {
    for (const role of ["investor", "seller", "advisor", "admin"] as const) {
      const tabs = tabDestinations(destinationsForRole(role));
      expect(tabs).toHaveLength(3);
      expect(tabs.every((item) => item.href in tabLabelForHref)).toBe(true);
    }
  });
});

describe("destinationIsCurrent", () => {
  it("ignores query strings and anchors", () => {
    expect(destinationIsCurrent("/mi-empresa/detalles?seccion=price#fotos", "/mi-empresa/detalles")).toBe(true);
    expect(destinationIsCurrent("/mi-empresa", "/mi-empresa/detalles")).toBe(false);
  });
  it("marks Empresas on the market and on a project detail", () => {
    expect(destinationIsCurrent("/mercado", "/mercado")).toBe(true);
    expect(destinationIsCurrent("/mercado", "/proyectos/proyecto-duna")).toBe(true);
    expect(destinationIsCurrent("/mercado", "/proyectos")).toBe(false);
    expect(destinationIsCurrent("/mi-empresa", "/proyectos/proyecto-duna")).toBe(false);
    expect(destinationIsCurrent("/mi-empresa", "/mi-empresa/detalles")).toBe(false);
    expect(destinationIsCurrent("/mi-empresa/detalles", "/mi-empresa/detalles")).toBe(true);
    expect(destinationIsCurrent("/admin", "/admin")).toBe(true);
    expect(destinationIsCurrent("/admin", "/admin/empresas")).toBe(false);
    expect(destinationIsCurrent("/admin/conexiones", "/admin/chat/acceso")).toBe(true);
    expect(destinationIsCurrent("/admin/conexiones", "/admin/conexiones/acceso")).toBe(true);
    expect(destinationIsCurrent("/admin/empresas", "/admin/empresas/proyecto-cala")).toBe(true);
    expect(destinationIsCurrent("/admin/empresas", "/admin/chat/acceso")).toBe(false);
    expect(destinationIsCurrent("/mandatos/encargos", "/mandatos/encargos/abc")).toBe(true);
    expect(destinationIsCurrent("/mandatos", "/mandatos/encargos")).toBe(false);
    expect(destinationIsCurrent("/mandatos", "/mandatos/venta")).toBe(false);
    expect(destinationIsCurrent("/mandatos/venta", "/mandatos/venta")).toBe(true);
  });
});

describe("processMenuTarget", () => {
  it("points a deal notice at that role's process item", () => {
    expect(processMenuTarget("/procesos")).toBe("/procesos");
    expect(processMenuTarget("/proyectos/proyecto-cala?tab=preguntas")).toBe("/procesos");
    expect(processMenuTarget("/mi-empresa/procesos")).toBe("/mi-empresa/procesos");
    expect(processMenuTarget("/mandatos/venta")).toBe("/mandatos/venta");
    expect(processMenuTarget("/mandatos/encargos/abc")).toBe("/mandatos/encargos");
    expect(processMenuTarget("/mi-empresa")).toBeNull();
    expect(processMenuTarget(null)).toBeNull();
    expect(noticeOpenOnPath("/proyectos/proyecto-cala", "/procesos")).toBe(true);
    expect(noticeOpenOnPath("/proyectos/proyecto-cala", "/proyectos/proyecto-cala")).toBe(true);
    expect(noticeOpenOnPath("/mi-empresa/procesos", "/inversor")).toBe(false);
  });
});
