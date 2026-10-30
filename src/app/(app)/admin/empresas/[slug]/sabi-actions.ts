"use server";

import { requireRole } from "@/server/requireRole";
import { getCurrentUser } from "@/server/getCurrentUser";
import { listSabiJobs, startSabiImportJob, type SabiJobStart, type SabiJobView } from "@/server/sabiJobs";

export type SabiConfirmState = SabiJobStart;

/** t67: starts the import as a background job and returns at once; the admin layout polls its progress. */
export async function confirmSabiAction(formData: FormData): Promise<SabiConfirmState> {
  const user = await requireRole("admin");
  const projectId = formData.get("projectId");
  const file = formData.get("file");
  return startSabiImportJob(user, typeof projectId === "string" ? projectId : "", file instanceof File ? file : null);
}

export async function sabiJobsAction(): Promise<SabiJobView[]> {
  const user = await getCurrentUser();
  return user ? listSabiJobs(user) : [];
}
