import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { sabiFailureMessages, sabiMaxBytes } from "@/lib/sabi/failures";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { confirmSabiImport } from "@/server/sabiImport";

/** t67: a SABI import as the admin UI sees it while it runs in the background. */
export type SabiJobView = {
  id: string;
  projectId: string;
  slug: string | null;
  companyName: string;
  fileName: string;
  status: "running" | "done" | "failed";
  stage: string;
  message: string | null;
  createdAt: string;
  finishedAt: string | null;
};

/** Jobs older than this with no heartbeat are shown as failed (the worker was cut off). */
const staleMs = 3 * 60 * 1000;
const recentMs = 10 * 60 * 1000;
const projectIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

export type SabiJobStart =
  { ok: true; jobId: string } | { ok: false; message: string };

export async function startSabiImportJob(
  user: CurrentUser,
  projectId: string,
  file: File | null,
): Promise<SabiJobStart> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: sabiFailureMessages.forbidden };
  }

  if (!file || file.size === 0) {
    return { ok: false, message: sabiFailureMessages.empty };
  }

  if (file.size > sabiMaxBytes) {
    return { ok: false, message: sabiFailureMessages.too_large };
  }

  if (
    !projectIdPattern.test(projectId) ||
    !(await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    }))
  ) {
    return { ok: false, message: sabiFailureMessages.not_found };
  }

  // Read the upload now: the request body is gone once the response is sent.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const job = await prisma.sabiImportJob.create({
    data: {
      id: randomUUID(),
      projectId,
      userId: user.id,
      fileName: file.name.slice(0, 255),
      status: "running",
      stage: "queued",
    },
    select: { id: true },
  });

  after(async () => {
    const setStage = async ({ stage }: { stage: string }) => {
      await prisma.sabiImportJob.update({
        where: { id: job.id },
        data: { stage },
      });
    };

    try {
      const result = await confirmSabiImport(
        user,
        projectId,
        bytes,
        file.name,
        setStage,
      );

      await prisma.sabiImportJob.update({
        where: { id: job.id },
        data: result.ok
          ? {
              status: "done",
              stage: "done",
              error: `Ficha actualizada con SABI (${result.value.years.join(", ")}).`,
              finishedAt: new Date(),
            }
          : {
              status: "failed",
              error: sabiFailureMessages[result.code],
              finishedAt: new Date(),
            },
      });

      if (result.ok) {
        for (const path of [
          "/admin/empresas",
          "/mi-empresa",
          "/proyectos",
          "/mercado",
        ]) {
          try {
            revalidatePath(path, "layout");
          } catch {
            // Outside a render scope revalidation may be unavailable; the client refreshes on completion.
          }
        }
      }
    } catch (error) {
      console.error(
        "[sabi-job] import failed",
        job.id,
        error instanceof Error ? error.message : "unknown",
      );
      await prisma.sabiImportJob
        .update({
          where: { id: job.id },
          data: {
            status: "failed",
            error: "La importación falló en el servidor. Vuelve a intentarlo.",
            finishedAt: new Date(),
          },
        })
        .catch(() => undefined);
    }
  });

  return { ok: true, jobId: job.id };
}

/** The admin's running jobs and the ones that finished in the last minutes, newest first. */
export async function listSabiJobs(user: CurrentUser): Promise<SabiJobView[]> {
  if (!user.onboarded || user.role !== "admin") {
    return [];
  }

  const now = Date.now();
  const jobs = await prisma.sabiImportJob.findMany({
    where: {
      userId: user.id,
      OR: [
        { status: "running" },
        { finishedAt: { gte: new Date(now - recentMs) } },
      ],
      createdAt: { gte: new Date(now - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const projects = jobs.length
    ? await prisma.project.findMany({
        where: { id: { in: [...new Set(jobs.map((job) => job.projectId))] } },
        select: { id: true, slug: true, legalName: true, codename: true },
      })
    : [];
  const byId = new Map(projects.map((project) => [project.id, project]));

  return jobs.map((job) => {
    const project = byId.get(job.projectId);
    const stale =
      job.status === "running" && now - job.updatedAt.getTime() > staleMs;
    return {
      id: job.id,
      projectId: job.projectId,
      slug: project?.slug ?? null,
      companyName: project?.legalName.trim() || project?.codename || "Empresa",
      fileName: job.fileName,
      status: stale ? "failed" : (job.status as SabiJobView["status"]),
      stage: job.stage,
      message: stale
        ? "La importación se interrumpió. Vuelve a subir el archivo."
        : job.error,
      createdAt: job.createdAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
    };
  });
}
