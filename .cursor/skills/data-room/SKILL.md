---
name: data-room
description: >-
  Build or change the Releva data room, the private document set for one SME
  sale. Use when working on DataRoomFile, Mis documentos, the investor
  Dataroom, file upload, file names, or R2.
---

# Data room

A data room is the seller's private document folder for one sale: accounts, tax, contracts, and similar files. Buyers see it only after a later access step. On Releva that step is not the NDA.

Today `DataRoomFile` stores `id`, `projectId`, and `fileName` only. Seeded names such as `impuestos-duna.pdf` exist in Postgres. No page may list them. Seller `/mi-empresa/documentos` is a folder grid with Permisos and Añadir acceso disabled. Investor `/dataroom` is an empty state. `ndaAccessGate` does not open files.

## Current boundary

- Do not select `dataRoomFiles` in `publicProjectSelect` or `investorProjectSelect`.
- Do not render a file name, storage key, or download URL on `/proyectos`, `/mercado`, notices, or the investor profile.
- The seller sees their own document UI. Uploads and downloads stay unwired until this surface is the task.
- R2 is the later file store. Do not add a bucket, binding, or upload client until `docs/DECISIONS.md` says to. Bytes do not go in Postgres.

## When this surface is in scope

1. Add one service in `src/lib/server` per action (`listDataRoom`, `storeDataRoomFile`). Actions parse Zod input and call the service.
2. Authorize before any file read: the seller owns the draft or published project, or a future gate that is stricter than `ndaAccessGate` allows the investor. The NDA record alone is not enough.
3. Return a display name to an authorized caller only. Keep the storage key out of the client payload and out of HTML.
4. Test that public and investor serializers still omit `dataRoomFiles`, and that a signed-out fetch of `/proyectos/proyecto-duna` does not contain `impuestos-duna.pdf`.
