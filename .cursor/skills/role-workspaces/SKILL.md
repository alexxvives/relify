---
name: role-workspaces
description: >-
  Route Releva sellers, investors, and advisors to the correct workspace.
  Use when adding a signed-in page, changing sign-in or onboarding redirects,
  sidebar links, or the workspace chrome versus the public catalog header.
---

# Role workspaces

Roles are `seller`, `investor`, `advisor`, and `admin`. Homes live in `homeForRole` in `src/lib/auth-input.ts`.

| Role | Home | Sidebar root |
| --- | --- | --- |
| seller | `/mi-empresa` | Inicio, Detalles, Documentos, Procesos, Mi asesor |
| investor | `/inversor` | Inicio, Empresas en venta (`/mercado`, con el filtro Solo favoritas), Procesos, Mi asesor |
| advisor | `/mandatos` | Inicio, Encargos (`/mandatos/encargos`), Mis procesos (`/mandatos/venta`), Mis servicios. No Ser premium. Encargos lists named hires. It does not show the shared inbox |
| admin | `/admin` | Inicio, Empresas, Cuentas, Conexiones, Asesores, Facturación. Legal name, CIF, address, shareholders, and file names stay on `/admin/empresas`. Suspend, role, and plan grants stay on `/admin/cuentas`. Chat from Conexiones stays read-only |

`destinationForUser` sends an unfinished account to `/onboarding`. `requireRole` in `src/server/requireRole.ts` sends a signed-out user to `/entrar`, an unfinished user to `/onboarding`, and the wrong role to `homeForRole`.

## Rules that already failed once

After `signInEmail`, read the stored role from the database, then redirect. `getSession` in that same action does not see the cookie Better Auth just set.

A seller opening `/mercado` returns to `/mi-empresa`. An investor opening `/mandatos` returns to `/inversor`. A public visitor, and a signed-in seller or advisor, still get the catalog header on `/proyectos/[slug]`, not the workspace sidebar.

## When adding a page

1. Guard it with `requireRole` for the one role that owns it.
2. Reuse the signed-in shell in `src/components/app-frame.tsx` (Costa tokens, DM Sans, the Instrument Serif word Releva). Public marketing, `/`, and auth stay on the catalog header.
3. Investor profile panels on `/inversor/perfil` stay in the browser session. Do not write them to Postgres unless the task says to.
4. Click through as that role, then as a different role, and confirm the wrong role lands on its own home.
