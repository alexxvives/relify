import * as z from "zod";
import type { UserRoleName } from "./auth-input";
import { ndaAccessGate } from "./project-access";
import { dataRoomFolderNames, sellerCopy, type DataRoomFolderName } from "./seller-copy";

const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((value) => !/[\\/\u0000]/.test(value) && !value.includes(".."));

export const folderNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .refine((value) => !/[\\/\u0000]/.test(value) && !value.includes(".."));

export const storeDataRoomFileSchema = z.object({
  folder: folderNameSchema,
  fileName: displayNameSchema,
});

export type StoreDataRoomFileInput = z.infer<typeof storeDataRoomFileSchema>;

export const grantDataRoomSchema = z.object({
  accessId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
});

export type GrantDataRoomInput = z.infer<typeof grantDataRoomSchema>;

export type DataRoomDenial = "forbidden" | "missing" | "nda-required" | "not-shared";

type RoomContext = {
  onboarded: boolean;
  role: UserRoleName | null;
  ownsProject: boolean;
  projectStatus: "draft" | "published" | null;
  ndaAcceptedAt: Date | null;
  granted: boolean;
};

export function dataRoomReadGate(
  input: RoomContext,
): { ok: true; audience: "owner" | "investor" } | { ok: false; code: DataRoomDenial } {
  if (input.onboarded && input.role === "seller" && input.ownsProject && input.projectStatus !== null) {
    return { ok: true, audience: "owner" };
  }

  const nda = ndaAccessGate({
    onboarded: input.onboarded,
    role: input.role,
    projectStatus: input.projectStatus,
    ndaAcceptedAt: input.ndaAcceptedAt,
  });

  if (!nda.ok) {
    return nda;
  }

  if (!input.granted) {
    return { ok: false, code: "not-shared" };
  }

  return { ok: true, audience: "investor" };
}

export function grantDataRoomOutcome(input: {
  onboarded: boolean;
  role: UserRoleName | null;
  ownsProject: boolean;
  ndaAccepted: boolean;
  alreadyGranted: boolean;
}): { ok: true; insert: boolean } | { ok: false; code: DataRoomDenial } {
  if (!input.onboarded || input.role !== "seller" || !input.ownsProject) {
    return { ok: false, code: "forbidden" };
  }

  if (!input.ndaAccepted) {
    return { ok: false, code: "nda-required" };
  }

  return { ok: true, insert: !input.alreadyGranted };
}

export function dataRoomMessage(code: DataRoomDenial): string {
  if (code === "not-shared") {
    return sellerCopy.notShared;
  }

  if (code === "nda-required") {
    return sellerCopy.shareNeedsNda;
  }

  if (code === "missing") {
    return sellerCopy.noCompanyYet;
  }

  return sellerCopy.documentForbidden;
}

export type DataRoomFileView = {
  folder: DataRoomFolderName | string;
  fileName: string;
};

export type OwnerFileView = DataRoomFileView & {
  id: string;
  viewers: { accessId: string; label: string }[];
};

export function toDataRoomFileView(file: { folder: string; fileName: string; storageKey?: string }): DataRoomFileView {
  return { folder: file.folder, fileName: file.fileName };
}

export function toDataRoomShareView(access: {
  id: string;
  granted: boolean;
  label: string;
  email?: string;
}): DataRoomShareView {
  return { accessId: access.id, label: access.label, granted: access.granted };
}

export type DataRoomShareView = {
  accessId: string;
  label: string;
  granted: boolean;
};

export function visibleFolderNames(input: {
  records: readonly { name: string; hidden: boolean }[];
  usedByFiles: readonly string[];
}): string[] {
  const hidden = new Set(input.records.filter((row) => row.hidden).map((row) => row.name));
  const names: string[] = dataRoomFolderNames.filter((name) => !hidden.has(name));

  for (const name of [...input.records.filter((row) => !row.hidden).map((row) => row.name), ...input.usedByFiles]) {
    if (!hidden.has(name) && !names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}

export function sharedFileIds(input: {
  files: readonly { id: string }[];
  investorId: string;
  granted: boolean;
  shares: readonly { fileId: string; investorId: string }[];
}): Set<string> {
  if (!input.granted) {
    return new Set();
  }

  return new Set(
    input.shares.filter((share) => share.investorId === input.investorId).map((share) => share.fileId),
  );
}

export function fileViewerLabels(input: {
  fileId: string;
  files: readonly { id: string }[];
  investors: readonly { investorId: string; accessId: string; label: string; granted: boolean }[];
  shares: readonly { fileId: string; investorId: string }[];
}): { accessId: string; label: string }[] {
  return input.investors.flatMap((investor) => {
    const ids = sharedFileIds({
      files: input.files,
      investorId: investor.investorId,
      granted: investor.granted,
      shares: input.shares,
    });

    return ids.has(input.fileId) ? [{ accessId: investor.accessId, label: investor.label }] : [];
  });
}
