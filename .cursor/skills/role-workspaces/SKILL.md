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
| seller | `/mi-empresa` | Inicio, Detalles, Documentos, Procesos, Servicios |
| investor | `/inversor` | Inicio, Empresas en venta (`/mercado`, con el filtro Solo favoritas), Procesos, Servicios |
| advisor | `/mandatos` | Inicio, Mis servicios. No Ser premium. The inbox lives on Inicio and needs the 39 € plan |
| admin | `/admin` | Inicio. On this page only, the admin sees legal name, CIF, address, shareholders, and data-room file names, and can unpublish, approve a publication request, suspend an account, change a role, grant an investor plan, and read a process chat |

`destinationForUser` sends an unfinished account to `/onboarding`. `requireRole` in `src/server/requireRole.ts` sends a signed-out user to `/entrar`, an unfinished user to `/onboarding`, and the wrong role to `homeForRole`.

## Rules that already failed once

After `signInEmail`, read the stored role from the database, then redirect. `getSession` in that same action does not see the cookie Better Auth just set.

A seller opening `/mercado` returns to `/mi-empresa`. An investor opening `/mandatos` returns to `/inversor`. A public visitor, and a signed-in seller or advisor, still get the catalog header on `/proyectos/[slug]`, not the workspace sidebar.

## When adding a page

1. Guard it with `requireRole` for the one role that owns it.
2. Reuse the signed-in shell in `src/components/app-frame.tsx` (Costa tokens, DM Sans, the Instrument Serif word Releva). Public marketing, `/`, and auth stay on the catalog header.
3. Investor profile panels on `/inversor/perfil` stay in the browser session. Do not write them to Postgres unless the task says to.
4. Click through as that role, then as a different role, and confirm the wrong role lands on its own home.
