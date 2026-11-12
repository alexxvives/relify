import type { Metadata } from "next";
import Link from "next/link";
import { FolderFileTree, type TreeNode } from "@/components/seller/document-tree";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { WorkspaceNote } from "@/components/shell/workspace-note";
import type { DataRoomFileView } from "@/lib/data-room";
import { investorCopy } from "@/lib/investor-copy";
import { listDataRoom } from "@/lib/server/list-data-room";
import { requireRole } from "@/lib/server/require-role";
import { Card } from "@/components/ui/form";

export const metadata: Metadata = {
  title: investorCopy.dataroomTitle,
  robots: { index: false, follow: false },
};

export default async function DataroomPage() {
  const user = await requireRole("investor");
  const room = await listDataRoom(user);

  if (room.audience !== "investor" || room.rooms.length === 0) {
    return (
      <SignedInPage title={investorCopy.dataroomTitle}>
        <WorkspaceNote title={investorCopy.dataroomEmpty} body={investorCopy.dataroomEmptyBody} />
      </SignedInPage>
    );
  }

  return (
    <SignedInPage title={investorCopy.dataroomTitle}>
      <div className="flex flex-col gap-4">
        {room.rooms.map((item) => (
          <Card key={item.slug} className="p-6">
            <h2 className="text-lg font-semibold">
              <Link href={`/proyectos/${item.slug}`} className="hover:underline">
                {item.codename}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-[#667085]">{investorCopy.dataroomShared}</p>
            {item.files.length === 0 ? (
              <p className="mt-4 text-sm">{investorCopy.dataroomFolderEmpty}</p>
            ) : (
              <div className="mt-4">
                <FolderFileTree label={item.codename} nodes={roomNodes(item.files)} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </SignedInPage>
  );
}

function roomNodes(files: DataRoomFileView[]): TreeNode[] {
  const folders = [...new Set(files.map((file) => file.folder))];
  return folders.map((folder) => ({
    id: folder,
    label: folder,
    kind: "folder" as const,
    children: files
      .filter((file) => file.folder === folder)
      .map((file) => ({
        id: `${folder}/${file.fileName}`,
        label: file.fileName,
        kind: "file" as const,
      })),
  }));
}
