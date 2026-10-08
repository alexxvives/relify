import { describe, expect, it } from "vitest";
import {
  dataRoomReadGate,
  fileViewerLabels,
  grantDataRoomOutcome,
  sharedFileIds,
  renameDataRoomFileSchema,
  storeDataRoomFileSchema,
  toDataRoomFileView,
  toDataRoomShareView,
  visibleFolderNames,
} from "./data-room";

const investor = {
  onboarded: true,
  role: "investor" as const,
  ownsProject: false,
  projectStatus: "published" as const,
  ndaAcceptedAt: new Date("2026-10-04T10:00:00.000Z"),
  granted: false,
};

describe("dataRoomReadGate", () => {
  it("lets the owner read and keeps an NDA from opening the room", () => {
    expect(
      dataRoomReadGate({
        onboarded: true,
        role: "seller",
        ownsProject: true,
        projectStatus: "draft",
        ndaAcceptedAt: null,
        granted: false,
      }),
    ).toEqual({ ok: true, audience: "owner" });
    expect(dataRoomReadGate(investor)).toEqual({ ok: false, code: "not-shared" });
    expect(dataRoomReadGate({ ...investor, granted: true })).toEqual({ ok: true, audience: "investor" });
    expect(dataRoomReadGate({ ...investor, ndaAcceptedAt: null, granted: true })).toEqual({
      ok: false,
      code: "nda-required",
    });
    expect(dataRoomReadGate({ ...investor, role: "advisor", granted: true })).toEqual({
      ok: false,
      code: "forbidden",
    });
  });
});

describe("grantDataRoomOutcome", () => {
  it("inserts a share only for the owner after the NDA", () => {
    expect(
      grantDataRoomOutcome({
        onboarded: true,
        role: "seller",
        ownsProject: true,
        ndaAccepted: true,
        alreadyGranted: false,
      }),
    ).toEqual({ ok: true, insert: true });
    expect(
      grantDataRoomOutcome({
        onboarded: true,
        role: "investor",
        ownsProject: false,
        ndaAccepted: true,
        alreadyGranted: false,
      }),
    ).toEqual({ ok: false, code: "forbidden" });
    expect(
      grantDataRoomOutcome({
        onboarded: true,
        role: "seller",
        ownsProject: true,
        ndaAccepted: false,
        alreadyGranted: false,
      }),
    ).toEqual({ ok: false, code: "nda-required" });
  });
});

describe("storeDataRoomFileSchema", () => {
  it("accepts a display name and rejects a path", () => {
    expect(storeDataRoomFileSchema.safeParse({ folder: "Fiscal", fileName: "cuentas-cauce.pdf" }).success).toBe(true);
    expect(storeDataRoomFileSchema.safeParse({ folder: "Fiscal", fileName: "../impuestos-duna.pdf" }).success).toBe(
      false,
    );
    expect(storeDataRoomFileSchema.safeParse({ folder: "Fiscal", fileName: "a/b.pdf" }).success).toBe(false);
  });
});

describe("renameDataRoomFileSchema", () => {
  it("accepts a stored file id and a display name", () => {
    expect(
      renameDataRoomFileSchema.safeParse({ fileId: "demo-cala-file-1", fileName: "cuentas-2024-revisado.pdf" }).success,
    ).toBe(true);
    expect(renameDataRoomFileSchema.safeParse({ fileId: "../secret", fileName: "cuentas.pdf" }).success).toBe(false);
  });
});

describe("data room views", () => {
  it("returns the display name and drops a storage key or an email", () => {
    expect(toDataRoomFileView({ folder: "Fiscal", fileName: "cuentas-cauce.pdf", storageKey: "secret-key" })).toEqual({
      folder: "Fiscal",
      fileName: "cuentas-cauce.pdf",
    });
    expect(
      toDataRoomShareView({
        id: "11111111-1111-1111-1111-111111111111",
        granted: true,
        label: "Inversor 1",
        email: "inversor@example.com",
      }),
    ).toEqual({ accessId: "11111111-1111-1111-1111-111111111111", label: "Inversor 1", granted: true });
  });
});

describe("visibleFolderNames", () => {
  it("hides a removed default and keeps a custom folder", () => {
    expect(
      visibleFolderNames({
        records: [
          { name: "Fiscal", hidden: true },
          { name: "Due diligence", hidden: false },
        ],
        usedByFiles: ["Fiscal", "Comercial"],
      }),
    ).toEqual([
      "Corporativo",
      "Financiero",
      "Comercial",
      "Legal",
      "RRHH/Laboral",
      "Releva",
      "Due diligence",
    ]);
  });
});

describe("sharedFileIds", () => {
  const files = [{ id: "a" }, { id: "b" }];

  it("shows only the files shared with that investor", () => {
    expect([...sharedFileIds({ files, investorId: "inv", granted: true, shares: [] })]).toEqual([]);
    expect(
      [...sharedFileIds({ files, investorId: "inv", granted: true, shares: [{ fileId: "a", investorId: "inv" }] })],
    ).toEqual(["a"]);
    expect(
      [...sharedFileIds({ files, investorId: "inv", granted: false, shares: [{ fileId: "a", investorId: "inv" }] })],
    ).toEqual([]);
    expect(
      fileViewerLabels({
        fileId: "a",
        files,
        investors: [{ investorId: "inv", accessId: "access", label: "Inversor 1", granted: true }],
        shares: [{ fileId: "a", investorId: "inv" }],
      }),
    ).toEqual([{ accessId: "access", label: "Inversor 1" }]);
  });
});
