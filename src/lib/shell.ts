import type { UserRoleName } from "@/lib/auth-input";

export const shellCopy = {
  menuOpen: "Abrir menú",
  menuClose: "Cerrar menú",
  navLabel: "Secciones",
  accountLabel: "Cuenta",
  viewProfile: "Ver perfil",
  helpTitle: "¿Necesitas ayuda?",
  helpCall: "",
  helpPhone: "+34 689 99 43 85",
  helpPhoneHref: "tel:+34689994385",
  helpWrite: "Escribir",
  helpEmail: "info@itsrelify.com",
  helpEmailHref: "mailto:info@itsrelify.com",
} as const;

export type ShellDestination = {
  href: string;
  label: string;
  section?: string;
};

/** Short labels for the compact tab bar (3 destinations + Más). */
export const tabLabelForHref: Record<string, string> = {
  "/mi-empresa": "Inicio",
  "/mi-empresa/detalles": "Empresa",
  "/mi-empresa/procesos": "Procesos",
  "/inversor": "Inicio",
  "/mercado": "Empresas",
  "/procesos": "Procesos",
  "/mandatos": "Inicio",
  "/mandatos/encargos": "Encargos",
  "/mandatos/venta": "Procesos",
  "/admin": "Inicio",
  "/admin/empresas": "Empresas",
  "/admin/cuentas": "Cuentas",
};

export function tabDestinations(destinations: readonly ShellDestination[]): ShellDestination[] {
  return destinations.filter((item) => item.href in tabLabelForHref).slice(0, 3);
}

/** Seller-only entry shown while the selected company has a closed sale. */
export const saleClosedDestination: ShellDestination = { href: "/mi-empresa/venta", label: "Venta cerrada", section: "Gestión de procesos" };
export const purchaseDoneDestination: ShellDestination = { href: "/inversor/compra", label: "Empresa comprada", section: "Gestión de procesos" };
/** Destinations shown as the gold pill above the help menu instead of in the nav list. */
export const goldPillHrefs: readonly string[] = [saleClosedDestination.href, purchaseDoneDestination.href];

const destinations = {
  investor: [
    { href: "/inversor", label: "Inicio" },
    { href: "/mercado", label: "Empresas en venta", section: "Explorar" },
    { href: "/tendencias", label: "Tendencias", section: "Explorar" },
    { href: "/procesos", label: "Mis procesos", section: "Gestión de procesos" },
    { href: "/asesoramiento", label: "Mi asesor", section: "Gestión de procesos" },
  ],
  seller: [
    { href: "/mi-empresa", label: "Inicio" },
    { href: "/mi-empresa/detalles", label: "Detalles de empresa", section: "Mi empresa" },
    { href: "/mi-empresa/documentos", label: "Mis documentos", section: "Mi empresa" },
    { href: "/mi-empresa/procesos", label: "Mis procesos", section: "Gestión de procesos" },
    { href: "/mi-empresa/servicios", label: "Mi asesor", section: "Gestión de procesos" },
  ],
  advisor: [
    { href: "/mandatos", label: "Inicio" },
    // S35 (Alex): Mis servicios sits above the Trabajo group, like Detalles de empresa for the seller.
    { href: "/mis-servicios", label: "Mis servicios", section: "Perfil" },
    { href: "/mandatos/encargos", label: "Encargos", section: "Trabajo" },
    { href: "/mandatos/venta", label: "Mis procesos", section: "Trabajo" },
  ],
  admin: [
    { href: "/admin", label: "Inicio" },
    { href: "/admin/empresas", label: "Empresas", section: "Gestión" },
    { href: "/admin/cuentas", label: "Cuentas", section: "Gestión" },
    { href: "/admin/conexiones", label: "Conexiones", section: "Gestión" },
    { href: "/admin/asesores", label: "Asesores", section: "Gestión" },
    { href: "/admin/facturacion", label: "Facturación", section: "Gestión" },
    { href: "/admin/mensajes", label: "Mensajes", section: "Gestión" },
    { href: "/admin/lista-de-espera", label: "Lista de espera", section: "Gestión" },
    { href: "/admin/valoraciones", label: "Valoraciones", section: "Gestión" },
  ],
} as const satisfies Record<UserRoleName, readonly ShellDestination[]>;

export function destinationsForRole(role: UserRoleName | null): ShellDestination[] {
  if (role === null) {
    return [];
  }

  return [...destinations[role]];
}

export function processMenuTarget(href: string | null): string | null {
  if (!href) {
    return null;
  }

  const path = href.split("?")[0] ?? "";

  if (path === "/procesos" || path.startsWith("/proyectos/")) {
    return "/procesos";
  }

  if (path === "/mi-empresa/procesos") {
    return "/mi-empresa/procesos";
  }

  if (path === "/mandatos/venta" || path.startsWith("/mandatos/venta/")) {
    return "/mandatos/venta";
  }

  if (path === "/mandatos/encargos" || path.startsWith("/mandatos/encargos/")) {
    return "/mandatos/encargos";
  }

  return null;
}

export function noticeOpenOnPath(href: string | null, pathname: string): boolean {
  const target = processMenuTarget(href);

  if (target && (pathname === target || pathname.startsWith(`${target}/`))) {
    return true;
  }

  if (!href) {
    return false;
  }

  const path = href.split("?")[0] ?? "";
  return path.length > 0 && (pathname === path || pathname.startsWith(`${path}/`));
}

export function destinationIsCurrent(rawHref: string, rawPathname: string): boolean {
  // Match on the path only: query strings and anchors (?seccion=..., #fotos) never change the page.
  const href = rawHref.split(/[?#]/)[0] ?? "";
  const pathname = rawPathname.split(/[?#]/)[0] ?? "";
  if (pathname === href) {
    return true;
  }

  if (href === "/mercado" && pathname.startsWith("/proyectos/")) {
    return true;
  }

  if (href === "/mandatos/encargos" && pathname.startsWith("/mandatos/encargos/")) {
    return true;
  }

  if (href === "/mandatos/venta" && pathname.startsWith("/mandatos/venta/")) {
    return true;
  }

  if (href === "/admin/empresas" && pathname.startsWith("/admin/empresas/")) {
    return true;
  }

  return (
    href === "/admin/conexiones" &&
    (pathname.startsWith("/admin/chat/") || pathname.startsWith("/admin/conexiones/"))
  );
}
