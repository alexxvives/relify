"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/requireRole";
import {
  notifyReportReady,
  type NotifyReportResult,
} from "@/server/notifyReportReady";
import { getCurrentUser } from "@/server/getCurrentUser";
import {
  listSabiJobs,
  startSabiImportJob,
  type SabiJobStart,
  type SabiJobView,
} from "@/server/sabiJobs";

import { setProjectPhotoHidden } from "@/server/projectPhotos";

/** t84: admin moderation of seller gallery photos (hide / show). */
export async function setProjectPhotoHiddenAction(photoId: string, hidden: boolean): Promise<{ ok: boolean }> {
  const user = await requireRole("admin");
  const slug = typeof photoId === "string" ? await setProjectPhotoHidden(user, photoId, hidden === true) : null;
  if (slug) {
    revalidatePath(`/admin/empresas/${slug}`);
    revalidatePath(`/proyectos/${slug}`);
  }
  return { ok: slug !== null };
}

export type SabiConfirmState = SabiJobStart;

/** t67: starts the import as a background job and returns at once; the admin layout polls its progress. */
export async function confirmSabiAction(
  formData: FormData,
): Promise<SabiConfirmState> {
  const user = await requireRole("admin");
  const projectId = formData.get("projectId");
  const file = formData.get("file");
  return startSabiImportJob(
    user,
    typeof projectId === "string" ? projectId : "",
    file instanceof File ? file : null,
  );
}

export async function sabiJobsAction(): Promise<SabiJobView[]> {
  const user = await getCurrentUser();
  return user ? listSabiJobs(user) : [];
}

/** t73b: manual "informe financiero listo" email to the seller, after a SABI import. */
export async function notifyReportReadyAction(
  projectId: string,
): Promise<NotifyReportResult> {
  const user = await requireRole("admin");
  const result = await notifyReportReady(user, projectId);
  if (result.ok) revalidatePath("/admin/empresas", "layout");
  return result;
}
