import type { UserRoleName } from "@/lib/auth-input";

export const shellCopy = {
  menuOpen: "Abrir menú",
  menuClose: "Cerrar menú",
  navLabel: "Secciones",
  accountLabel: "Cuenta",
} as const;

export type ShellDestination = {
  href: string;
  label: string;
  section?: string;
};

const destinations = {
  investor: [
    { href: "/inversor", label: "Inicio" },
    { href: "/inversor/perfil", label: "Perfil de Inversor" },
    { href: "/mercado", label: "Empresas en venta", section: "Explorar" },
    { href: "/busquedas", label: "Mis búsquedas", section: "Explorar" },
    { href: "/tendencias", label: "Tendencias", section: "Explorar" },
    { href: "/procesos", label: "Mis procesos", section: "Gestión de procesos" },
    { href: "/dataroom", label: "Dataroom", section: "Gestión de procesos" },
    { href: "/asesoramiento", label: "Solicitar servicios", section: "Gestión de procesos" },
    { href: "/favoritos", label: "Empresas favoritas", section: "Gestión de empresas" },
    { href: "/ocultas", label: "Empresas ocultas", section: "Gestión de empresas" },
  ],
  seller: [
    { href: "/mi-empresa", label: "Inicio" },
    { href: "/mi-empresa/detalles", label: "Detalles de empresa", section: "Mi empresa" },
    { href: "/mi-empresa/documentos", label: "Mis documentos", section: "Mi empresa" },
    { href: "/mi-empresa/procesos", label: "Mis procesos", section: "Gestión de procesos" },
    { href: "/mi-empresa/servicios", label: "Solicitar servicios", section: "Gestión de procesos" },
    { href: "/tendencias", label: "Tendencias", section: "Explorar" },
  ],
  advisor: [
    { href: "/mandatos", label: "Inicio" },
    { href: "/tendencias", label: "Tendencias", section: "Explorar" },
    { href: "/mis-servicios", label: "Mis servicios", section: "Mis servicios" },
  ],
  admin: [{ href: "/cuenta", label: "Tu cuenta" }],
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

  return href === "/mercado" && pathname.startsWith("/proyectos/");
}
