import type { UserRoleName } from "@/lib/auth-input";

export const shellCopy = {
  menuOpen: "Abrir menú",
  menuClose: "Cerrar menú",
  navLabel: "Secciones",
  accountLabel: "Cuenta",
  viewProfile: "Ver perfil",
  helpTitle: "¿Necesitas ayuda?",
  helpBody: "Llámanos o escríbenos. Te acompañamos a rellenar la ficha.",
  helpCall: "Llamar",
  helpPhone: "910 88 40 12",
  helpPhoneHref: "tel:+34910884012",
  helpWrite: "Escribir",
  helpEmail: "ayuda@itsreleva.com",
  helpEmailHref: "mailto:ayuda@itsreleva.com",
} as const;

export type ShellDestination = {
  href: string;
  label: string;
  section?: string;
};

const destinations = {
  investor: [
    { href: "/inversor", label: "Inicio" },
    { href: "/mercado", label: "Empresas en venta", section: "Explorar" },
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
    { href: "/mandatos/encargos", label: "Encargos" },
    { href: "/mandatos/venta", label: "Mis procesos" },
    { href: "/mis-servicios", label: "Mis servicios" },
  ],
  admin: [
    { href: "/admin", label: "Inicio" },
    { href: "/admin/empresas", label: "Empresas" },
    { href: "/admin/cuentas", label: "Cuentas" },
    { href: "/admin/conexiones", label: "Conexiones" },
    { href: "/admin/asesores", label: "Asesores" },
    { href: "/admin/facturacion", label: "Facturación" },
  ],
} as const satisfies Record<UserRoleName, readonly ShellDestination[]>;

export function destinationsForRole(role: UserRoleName | null): ShellDestination[] {
  if (role === null) {
    return [];
  }

  return [...destinations[role]];
}

export function destinationIsCurrent(href: string, pathname: string): boolean {
  if (pathname === href) {
    return true;
  }

  if (href === "/mercado" && pathname.startsWith("/proyectos/")) {
    return true;
  }

  if (href === "/mandatos/encargos" && pathname.startsWith("/mandatos/encargos/")) {
    return true;
  }

  return href === "/admin/conexiones" && pathname.startsWith("/admin/chat/");
}
