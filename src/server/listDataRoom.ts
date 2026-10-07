import {
  dataRoomReadGate,
  fileViewerLabels,
  sharedFileIds,
  toDataRoomFileView,
  toDataRoomShareView,
  visibleFolderNames,
  type DataRoomFileView,
  type DataRoomShareView,
  type OwnerFileView,
} from "@/lib/data-room";
import { labelAccesses } from "@/lib/project-message";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

export type OwnerDataRoom = {
  audience: "owner";
  files: OwnerFileView[];
  folders: string[];
  shares: DataRoomShareView[];
};

export type InvestorRoom = {
  slug: string;
  codename: string;
  files: DataRoomFileView[];
};

export type InvestorDataRoom = {
  audience: "investor";
  rooms: InvestorRoom[];
};

export type DataRoomListing = OwnerDataRoom | InvestorDataRoom | { audience: "none" };

export async function listDataRoom(user: CurrentUser): Promise<DataRoomListing> {
  if (!user.onboarded || user.role === "advisor" || user.role === "admin" || user.role === null) {
    return { audience: "none" };
  }

  if (user.role === "seller") {
    const activeId = await activeSellerProjectId(user.id);
    const projects = activeId
      ? await prisma.project.findMany({
          where: { id: activeId, ownerId: user.id },
          select: { id: true },
        })
      : [];
    const ids = projects.map((project) => project.id);

    if (ids.length === 0) {
      return { audience: "owner", files: [], folders: [], shares: [] };
    }

    const [files, accesses, grants, shareRows, folderRows] = await Promise.all([
      prisma.dataRoomFile.findMany({
        where: { projectId: { in: ids } },
        select: { id: true, folder: true, fileName: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.projectAccess.findMany({
        where: { projectId: { in: ids }, ndaAcceptedAt: { not: null } },
        select: { id: true, investorId: true, projectId: true, requestedAt: true },
        orderBy: { requestedAt: "asc" },
      }),
      prisma.dataRoomGrant.findMany({
        where: { projectId: { in: ids } },
        select: { investorId: true },
      }),
      prisma.dataRoomFileShare.findMany({
        where: { file: { projectId: { in: ids } } },
        select: { fileId: true, investorId: true },
      }),
      prisma.dataRoomFolder.findMany({
        where: { projectId: { in: ids } },
        select: { name: true, hidden: true },
      }),
    ]);
    const granted = new Set(grants.map((grant) => grant.investorId));
    const investors = labelAccesses(accesses).map((access) => ({
      investorId: access.investorId,
      accessId: access.id,
      label: access.label,
      granted: granted.has(access.investorId),
    }));

    return {
      audience: "owner",
      folders: visibleFolderNames({ records: folderRows, usedByFiles: files.map((file) => file.folder) }),
      files: files.map((file) => ({
        ...toDataRoomFileView(file),
        id: file.id,
        viewers: fileViewerLabels({ fileId: file.id, files, investors, shares: shareRows }),
      })),
      shares: investors.map((access) =>
        toDataRoomShareView({ id: access.accessId, label: access.label, granted: access.granted }),
      ),
    };
  }

  const grants = await prisma.dataRoomGrant.findMany({
    where: { investorId: user.id },
    select: {
      project: {
        select: {
          id: true,
          slug: true,
          codename: true,
          status: true,
          dataRoomFiles: {
            select: { id: true, folder: true, fileName: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  const projectIds = grants.map((grant) => grant.project.id);
  const acceptances =
    projectIds.length === 0
      ? []
      : await prisma.projectAccess.findMany({
          where: { investorId: user.id, projectId: { in: projectIds } },
          select: { projectId: true, ndaAcceptedAt: true },
        });
  const acceptedAt = new Map(acceptances.map((row) => [row.projectId, row.ndaAcceptedAt]));
  const shareRows =
    projectIds.length === 0
      ? []
      : await prisma.dataRoomFileShare.findMany({
          where: { investorId: user.id, file: { projectId: { in: projectIds } } },
          select: { fileId: true, investorId: true },
        });
  const rooms: InvestorRoom[] = [];

  for (const grant of grants) {
    const gate = dataRoomReadGate({
      onboarded: user.onboarded,
      role: user.role,
      ownsProject: false,
      projectStatus: grant.project.status,
      ndaAcceptedAt: acceptedAt.get(grant.project.id) ?? null,
      granted: true,
    });

    if (!gate.ok || gate.audience !== "investor") {
      continue;
    }

    const visible = sharedFileIds({
      files: grant.project.dataRoomFiles,
      investorId: user.id,
      granted: true,
      shares: shareRows,
    });
    rooms.push({
      slug: grant.project.slug,
      codename: grant.project.codename,
      files: grant.project.dataRoomFiles
        .filter((file) => visible.has(file.id))
        .map((file) => toDataRoomFileView(file)),
    });
  }

  return { audience: "investor", rooms };
}
