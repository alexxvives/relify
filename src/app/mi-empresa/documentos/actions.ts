"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { grantDataRoomSchema, storeDataRoomFileSchema } from "@/lib/data-room";
import { sellerCopy } from "@/lib/seller-copy";
import { createDataRoomFolder, deleteDataRoomFolder } from "@/server/dataRoomFolders";
import { getCurrentUser } from "@/server/getCurrentUser";
import { grantDataRoomAccess } from "@/server/grantDataRoomAccess";
import { setDataRoomFileShare } from "@/server/setDataRoomFileShare";
import { dataRoomByteLimit } from "@/server/dataRoomDisk";
import { deleteDataRoomFile } from "@/server/deleteDataRoomFile";
import { storeDataRoomFile } from "@/server/storeDataRoomFile";

export type DataRoomActionState = { ok: true } | { ok: false; message: string } | null;

async function sellerUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  return user;
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function storeDataRoomFileAction(
  _state: DataRoomActionState,
  formData: FormData,
): Promise<DataRoomActionState> {
  const user = await sellerUser();
  const parsed = storeDataRoomFileSchema.safeParse({
    folder: readText(formData, "folder"),
    fileName: readText(formData, "fileName"),
  });

  if (!parsed.success) {
    return { ok: false, message: sellerCopy.documentInvalid };
  }

  const upload = formData.get("file");

  if (!(upload instanceof File) || upload.size === 0) {
    return { ok: false, message: sellerCopy.documentInvalid };
  }

  if (upload.size > dataRoomByteLimit) {
    return { ok: false, message: sellerCopy.documentTooLarge };
  }

  const result = await storeDataRoomFile(user, parsed.data, new Uint8Array(await upload.arrayBuffer()));

  if (result.ok) {
    revalidatePath("/mi-empresa/documentos");
  }

  return result;
}

export async function grantDataRoomAccessAction(
  _state: DataRoomActionState,
  formData: FormData,
): Promise<DataRoomActionState> {
  const user = await sellerUser();
  const parsed = grantDataRoomSchema.safeParse({ accessId: readText(formData, "accessId") });

  if (!parsed.success) {
    return { ok: false, message: sellerCopy.shareFailed };
  }

  const result = await grantDataRoomAccess(user, parsed.data);

  if (result.ok) {
    revalidatePath("/mi-empresa/documentos");
    revalidatePath("/dataroom");
  }

  return result;
}

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createDataRoomFolderAction(
  _state: DataRoomActionState,
  formData: FormData,
): Promise<DataRoomActionState> {
  const user = await sellerUser();
  const result = await createDataRoomFolder(user, readText(formData, "name"));

  if (result.ok) {
    revalidatePath("/mi-empresa/documentos");
  }

  return result;
}

export async function deleteDataRoomFolderAction(
  _state: DataRoomActionState,
  formData: FormData,
): Promise<DataRoomActionState> {
  const user = await sellerUser();
  const result = await deleteDataRoomFolder(user, readText(formData, "name"));

  if (result.ok) {
    revalidatePath("/mi-empresa/documentos");
  }

  return result;
}

export async function shareDataRoomFileAction(
  _state: DataRoomActionState,
  formData: FormData,
): Promise<DataRoomActionState> {
  const user = await sellerUser();
  const fileId = readText(formData, "fileId");
  const accessId = readText(formData, "accessId");

  if (!idPattern.test(fileId) || !idPattern.test(accessId)) {
    return { ok: false, message: sellerCopy.shareFailed };
  }

  const result = await setDataRoomFileShare(user, {
    fileId,
    accessId,
    shared: readText(formData, "shared") === "1",
  });

  if (result.ok) {
    revalidatePath("/mi-empresa/documentos");
    revalidatePath("/dataroom");
    revalidatePath("/mi-empresa/procesos");
  }

  return result;
}

export async function shareDataRoomFileFormAction(formData: FormData): Promise<void> {
  await shareDataRoomFileAction(null, formData);
}

export async function deleteDataRoomFileAction(
  _state: DataRoomActionState,
  formData: FormData,
): Promise<DataRoomActionState> {
  const user = await sellerUser();
  const result = await deleteDataRoomFile(user, readText(formData, "fileId"));

  if (result.ok) {
    revalidatePath("/mi-empresa/documentos");
    revalidatePath("/mi-empresa/procesos");
  }

  return result;
}
