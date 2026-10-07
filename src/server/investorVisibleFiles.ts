import { dataRoomReadGate, sharedFileIds } from "@/lib/data-room";
import { prisma } from "@/server/db";

export type VisibleFile = {
  id: string;
  folder: string;
  fileName: string;
};

export async function investorVisibleFiles(investorId: string, projectId: string): Promise<VisibleFile[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  });

  if (!project) {
    return [];
  }

  const [access, grant, files, shares] = await Promise.all([
    prisma.projectAccess.findUnique({
      where: { projectId_investorId: { projectId, investorId } },
      select: { ndaAcceptedAt: true },
    }),
    prisma.dataRoomGrant.findUnique({
      where: { projectId_investorId: { projectId, investorId } },
      select: { id: true },
    }),
    prisma.dataRoomFile.findMany({
      where: { projectId },
      select: { id: true, folder: true, fileName: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dataRoomFileShare.findMany({
      where: { investorId, file: { projectId } },
      select: { fileId: true, investorId: true },
    }),
  ]);
  const gate = dataRoomReadGate({
    onboarded: true,
    role: "investor",
    ownsProject: false,
    projectStatus: project.status,
    ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
    granted: grant !== null,
  });

  if (!gate.ok) {
    return [];
  }

  const visible = sharedFileIds({ files, investorId, granted: true, shares });

  return files.filter((file) => visible.has(file.id));
}
