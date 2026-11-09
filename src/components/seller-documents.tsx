"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, Lock, Share2 } from "lucide-react";
import { InfoHint } from "@/components/ui/info-hint";
import { Trash2Icon } from "@/components/ui/trash-2";
import { FileTextIcon } from "@/components/ui/file-text";
import { FolderOpenIcon } from "@/components/ui/folder-open";
import { PlusIcon } from "@/components/ui/plus";
import { SquarePenIcon } from "@/components/ui/square-pen";
import { UploadIcon } from "@/components/ui/upload";
import { FilePreviewDialog, fileHref } from "@/components/file-preview-dialog";
import {
  createDataRoomFolderAction,
  deleteDataRoomFileAction,
  deleteDataRoomFolderAction,
  renameDataRoomFileAction,
  renameDataRoomFolderAction,
  shareDataRoomScopeFormAction,
  storeDataRoomFileAction,
  type DataRoomActionState,
} from "@/app/(app)/mi-empresa/documentos/actions";
import { filesWithBytes, type DataRoomShareView, type OwnerFileView } from "@/lib/data-room";

export type DocumentAdvisor = {
  engagementId: string;
  name: string;
  folders: string[];
  fileIds: string[];
};

type ShareScope = { kind: "file"; fileId: string } | { kind: "folder"; folder: string } | { kind: "room" };
import { documentCountLabel, sellerCopy } from "@/lib/seller-copy";
import { Button, Input } from "@/components/ui/form";

function ActionNote({ state, saved }: { state: DataRoomActionState; saved: string }) {
  if (!state) {
    return null;
  }

  if (state.ok) {
    return <p className="text-sm text-[#157a45]">{saved}</p>;
  }

  return (
    <p className="text-sm text-red-700" role="alert">
      {state.message}
    </p>
  );
}

function DocumentDrop({ folder }: { folder: string }) {
  const [state, setState] = useState<DataRoomActionState>(null);
  const [pending, setPending] = useState(false);
  const [over, setOver] = useState(false);

  async function addFiles(list: File[]) {
    if (list.length === 0 || pending) {
      return;
    }

    setPending(true);
    setState(null);
    let last: DataRoomActionState = { ok: true };

    for (const file of list) {
      const name = file.name.split(/[/\\]/).pop()?.trim() ?? "";
      const data = new FormData();
      data.set("folder", folder);
      data.set("fileName", name);
      data.set("file", file);
      last = await storeDataRoomFileAction(null, data);

      if (!last?.ok) {
        break;
      }
    }

    setState(last);
    setPending(false);
  }

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => {
          setOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void addFiles([...event.dataTransfer.files]);
        }}
        className={
          over
            ? "flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#465ab4] bg-[#eef2ff] px-3 text-center"
            : "flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c5d0f5] bg-[#f7f8ff] px-3 text-center"
        }
      >
        <UploadIcon size={40} className="text-[#465ab4]" aria-hidden />
        <span className="mt-3 text-sm font-medium text-[#1c2740]">{pending ? sellerCopy.addingDocument : sellerCopy.dropDocument}</span>
        <span className="mt-1 text-xs font-medium text-[#465ab4]">{sellerCopy.chooseDocuments}</span>
        <input
          type="file"
          multiple
          className="sr-only"
          disabled={pending}
          onChange={(event) => {
            const chosen = event.target.files ? [...event.target.files] : [];
            event.target.value = "";
            void addFiles(chosen);
          }}
        />
      </label>
      <div className="mt-2">
        <ActionNote state={state} saved={sellerCopy.documentSaved} />
      </div>
    </div>
  );
}

function shareableFiles(files: OwnerFileView[], scope: ShareScope): OwnerFileView[] {
  const stored = files.filter((file) => !file.platform);
  if (scope.kind === "file") {
    return stored.filter((file) => file.id === scope.fileId);
  }
  if (scope.kind === "folder") {
    return stored.filter((file) => file.folder === scope.folder);
  }
  return stored;
}

function investorIsOn(accessId: string, files: OwnerFileView[], scope: ShareScope): boolean {
  const chosen = shareableFiles(files, scope);
  return chosen.length > 0 && chosen.every((file) => file.viewers.some((viewer) => viewer.accessId === accessId));
}

function advisorIsOn(advisor: DocumentAdvisor, files: OwnerFileView[], folders: string[], scope: ShareScope): boolean {
  if (scope.kind === "file") {
    const file = files.find((item) => item.id === scope.fileId);
    return advisor.fileIds.includes(scope.fileId) || (file ? advisor.folders.includes(file.folder) : false);
  }
  if (scope.kind === "folder") {
    return advisor.folders.includes(scope.folder);
  }
  return folders.length > 0 && folders.every((folder) => advisor.folders.includes(folder));
}

function ShareMenu({
  scope,
  investors,
  advisors,
  files,
  folders,
  label,
  align = "right",
}: {
  scope: ShareScope;
  investors: DataRoomShareView[];
  advisors: DocumentAdvisor[];
  files: OwnerFileView[];
  folders: string[];
  label: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function close(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="inline-flex h-8 items-center gap-1 rounded-full border border-[#e1e6ee] bg-white px-2 text-xs font-medium text-[#3d34b8]"
      >
        <Share2 className="size-3.5" aria-hidden />
        {label}
      </button>
      {open ? (
        <div
          className={
            align === "left"
              ? "absolute top-9 left-0 z-20 w-64 rounded-2xl border border-[#e6e9f0] bg-white p-2 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]"
              : "absolute top-9 right-0 z-20 w-64 rounded-2xl border border-[#e6e9f0] bg-white p-2 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]"
          }
        >
          <p className="px-2 py-1 text-xs font-medium text-[#667085]">{sellerCopy.shareInvestors}</p>
          {investors.length === 0 ? <p className="px-2 py-2 text-sm text-[#667085]">{sellerCopy.shareNone}</p> : null}
          <ul className="flex flex-col">
            {investors.map((investor) => {
              const on = investorIsOn(investor.accessId, files, scope);
              return (
                <li key={investor.accessId}>
                  <ShareTargetForm
                    scope={scope}
                    accessId={investor.accessId}
                    engagementId=""
                    on={on}
                    label={investor.label}
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-2 px-2 py-1 text-xs font-medium text-[#667085]">{sellerCopy.shareAdvisors}</p>
          {advisors.length === 0 ? <p className="px-2 py-2 text-sm text-[#667085]">{sellerCopy.shareNoAdvisor}</p> : null}
          <ul className="flex flex-col">
            {advisors.map((advisor) => {
              const on = advisorIsOn(advisor, files, folders, scope);
              return (
                <li key={advisor.engagementId}>
                  <ShareTargetForm
                    scope={scope}
                    accessId=""
                    engagementId={advisor.engagementId}
                    on={on}
                    label={advisor.name}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ShareTargetForm({
  scope,
  accessId,
  engagementId,
  on,
  label,
}: {
  scope: ShareScope;
  accessId: string;
  engagementId: string;
  on: boolean;
  label: string;
}) {
  return (
    <form action={shareDataRoomScopeFormAction}>
      <input type="hidden" name="scope" value={scope.kind} />
      <input type="hidden" name="fileId" value={scope.kind === "file" ? scope.fileId : ""} />
      <input type="hidden" name="folder" value={scope.kind === "folder" ? scope.folder : ""} />
      <input type="hidden" name="accessId" value={accessId} />
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="shared" value={on ? "0" : "1"} />
      <button type="submit" className="flex h-10 w-full items-center justify-between gap-2 rounded-xl px-2 text-left text-sm hover:bg-[#f4f7ff]">
        <span className="truncate">{label}</span>
        <span className={on ? "shrink-0 text-xs font-semibold text-[#17663a]" : "shrink-0 text-xs text-[#8b95a7]"}>
          {on ? sellerCopy.shareVisible : sellerCopy.shareFile}
        </span>
      </button>
    </form>
  );
}

function FolderDelete({ name }: { name: string }) {
  const [state, action, pending] = useActionState(deleteDataRoomFolderAction, null);
  const [confirming, setConfirming] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirming) {
      return;
    }

    function cancel(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node) || !boxRef.current?.contains(target)) {
        setConfirming(false);
      }
    }

    document.addEventListener("click", cancel);
    return () => {
      document.removeEventListener("click", cancel);
    };
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={sellerCopy.folderDelete}
        onClick={() => {
          setConfirming(true);
        }}
        className="inline-flex size-8 items-center justify-center rounded-full text-[#8b95a7] hover:bg-[#fff1f1] hover:text-red-700"
      >
        <Trash2Icon size={16} aria-hidden />
      </button>
    );
  }

  return (
    <div ref={boxRef} className="flex items-center gap-1">
      <form action={action} className="flex items-center gap-1">
        <input type="hidden" name="name" value={name} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center rounded-full bg-red-700 px-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? sellerCopy.folderDeleting : sellerCopy.folderDelete}
        </button>
        <ActionNote state={state} saved="" />
      </form>
    </div>
  );
}

function FileDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteDataRoomFileAction, null);
  const [confirming, setConfirming] = useState(false);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!confirming) {
      return;
    }

    function cancel(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node) || !boxRef.current?.contains(target)) {
        setConfirming(false);
      }
    }

    document.addEventListener("click", cancel);
    return () => {
      document.removeEventListener("click", cancel);
    };
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={sellerCopy.documentDelete}
        onClick={() => {
          setConfirming(true);
        }}
        className="inline-flex size-8 items-center justify-center rounded-full text-[#8b95a7] hover:bg-[#fff1f1] hover:text-red-700"
      >
        <Trash2Icon size={16} aria-hidden />
      </button>
    );
  }

  return (
    <form ref={boxRef} action={action}>
      <input type="hidden" name="fileId" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-8 items-center rounded-full bg-red-700 px-2 text-xs font-medium text-white disabled:opacity-60"
      >
        {pending ? sellerCopy.documentDeleting : sellerCopy.documentDelete}
      </button>
      <ActionNote state={state} saved="" />
    </form>
  );
}

function latestUpload(files: readonly OwnerFileView[]): string | null {
  return files.reduce<string | null>((latest, file) => (file.uploadedAt && (!latest || file.uploadedAt > latest) ? file.uploadedAt : latest), null);
}

function folderDate(iso: string): string {
  return `act. ${new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" })}`;
}

function FolderCard({
  name,
  count,
  updatedAt = null,
  viewers = 0,
  onOpen,
  share,
}: {
  name: string;
  count: number;
  updatedAt?: string | null;
  viewers?: number;
  onOpen: () => void;
  share: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [state, action, pending] = useActionState(renameDataRoomFolderAction, null);
  const [closed, setClosed] = useState<DataRoomActionState>(null);

  if (state?.ok && state !== closed) {
    setClosed(state);
    setEditing(false);
  }

  return (
    <li className="group/folder relative">
      {editing ? (
        <form action={action} className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-[#e1e6ee] bg-[#fbfbfc] px-4">
          <input type="hidden" name="from" value={name} />
          <FolderOpenIcon size={40} className="text-[#d5dbe3]" aria-hidden />
          <Input
            name="name"
            required
            maxLength={40}
            value={value}
            aria-label={sellerCopy.folderName}
            onChange={(event) => {
              setValue(event.target.value);
            }}
            size="sm" className="text-center"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                setValue(name);
                setEditing(false);
              }}
              tone="outline" size="sm" className="text-xs"
>
              {sellerCopy.meetingsCancel}
            </Button>
            <Button
              type="submit"
              disabled={pending || value.trim() === name}
              size="sm" className="text-xs"
>
              {sellerCopy.folderRename}
            </Button>
          </div>
          <ActionNote state={state} saved={sellerCopy.folderRenamed} />
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={onOpen}
            className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-[#eef0f3] bg-[#fbfbfc] px-3 text-center"
          >
            <FolderOpenIcon size={64} className={count > 0 ? "text-[#8f9bd6]" : "text-[#d5dbe3]"} aria-hidden />
            <span className="mt-3 text-sm font-semibold text-[#1c2740]">{name}</span>
            <span className="mt-1 text-xs text-[#667085]">
              {documentCountLabel(count)}
              {updatedAt ? ` · ${folderDate(updatedAt)}` : ""}
            </span>
            {viewers > 0 ? (
              <span className="mt-2 rounded-full bg-[#e8f5ee] px-2 py-0.5 text-xs font-medium text-[#157a45]">
                {viewers === 1 ? "Visible para 1 comprador" : `Visible para ${viewers} compradores`}
              </span>
            ) : null}
          </button>
          <div className="absolute top-3 left-3 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/folder:opacity-100 [@media(hover:hover)]:group-focus-within/folder:opacity-100">{share}</div>
          <div className="absolute top-3 right-3 flex items-center transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/folder:opacity-100 [@media(hover:hover)]:group-focus-within/folder:opacity-100">
            <button
              type="button"
              aria-label={sellerCopy.folderRename}
              onClick={() => {
                setEditing(true);
              }}
              className="inline-flex size-8 items-center justify-center rounded-full text-[#8b95a7] hover:bg-[#eef2ff] hover:text-[#465ab4]"
            >
              <SquarePenIcon size={16} aria-hidden />
            </button>
            <FolderDelete name={name} />
          </div>
        </>
      )}
    </li>
  );
}

function FileCard({
  file,
  onOpen,
  share,
}: {
  file: OwnerFileView;
  onOpen: () => void;
  share: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(file.fileName);
  const [state, action, pending] = useActionState(renameDataRoomFileAction, null);
  const [closed, setClosed] = useState<DataRoomActionState>(null);

  if (state?.ok && state !== closed) {
    setClosed(state);
    setEditing(false);
  }

  return (
    <li className="relative">
      {editing ? (
        <form action={action} className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-[#e1e6ee] bg-[#fbfbfc] px-3">
          <input type="hidden" name="fileId" value={file.id} />
          <Input
            name="name"
            required
            maxLength={120}
            value={value}
            aria-label={sellerCopy.folderRename}
            onChange={(event) => {
              setValue(event.target.value);
            }}
            size="sm" className="text-center"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                setValue(file.fileName);
                setEditing(false);
              }}
              tone="outline" size="sm" className="text-xs"
>
              {sellerCopy.meetingsCancel}
            </Button>
            <Button
              type="submit"
              disabled={pending || value.trim() === file.fileName}
              size="sm" className="text-xs"
>
              {sellerCopy.folderRename}
            </Button>
          </div>
          <ActionNote state={state} saved={sellerCopy.folderRenamed} />
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={onOpen}
            className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-[#eef0f3] bg-[#fbfbfc] px-3 pt-6 text-center hover:border-[#c5d0f5]"
          >
            <FileTextIcon size={64} className="text-[#465ab4]" aria-hidden />
            <span className="mt-3 line-clamp-2 text-sm font-medium text-[#1c2740]">{file.fileName}</span>
          </button>
          {file.platform ? null : <div className="absolute top-2 left-2 z-10">{share}</div>}
          {file.viewers.length > 0 ? (
            <span className="absolute bottom-2 left-2 z-10 inline-flex -space-x-1" aria-label={sellerCopy.viewersLabel}>
              {file.viewers.map((viewer) => (
                <span
                  key={viewer.accessId}
                  title={viewer.label}
                  className="inline-flex size-6 items-center justify-center rounded-full border border-white bg-[#465ab4] text-xs font-semibold text-white"
                >
                  {viewerInitials(viewer.label)}
                </span>
              ))}
            </span>
          ) : null}
          <div className="absolute top-2 right-2 z-10 flex items-center">
            <button
              type="button"
              aria-label={sellerCopy.documentEdit}
              onClick={() => {
                setEditing(true);
              }}
              className="inline-flex size-8 items-center justify-center rounded-full text-[#8b95a7] hover:bg-[#eef2ff] hover:text-[#465ab4]"
            >
              <SquarePenIcon size={16} aria-hidden />
            </button>
            <FileDelete id={file.id} />
          </div>
        </>
      )}
    </li>
  );
}

export function SellerDocuments({
  files,
  folders,
  shares,
  advisors,
}: {
  files: OwnerFileView[];
  folders: string[];
  shares: DataRoomShareView[];
  advisors: DocumentAdvisor[];
}) {
  const [folder, setFolder] = useState<string | null>(null);
  const [namingFolder, setNamingFolder] = useState(false);
  const [openFile, setOpenFile] = useState<OwnerFileView | null>(null);
  const [createState, createAction, createPending] = useActionState(createDataRoomFolderAction, null);
  const [createClosed, setCreateClosed] = useState<DataRoomActionState>(null);
  const listed = filesWithBytes(files);
  const inFolder = listed.filter((file) => file.folder === folder);

  if (createState?.ok && createState !== createClosed) {
    setCreateClosed(createState);
    setNamingFolder(false);
  }

  return (
    <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
      {folder === null ? (
        <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-[1_1_28rem] items-center gap-3 rounded-xl bg-[#f5f7ff] px-3.5 py-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#465ab4]">
              <Lock className="size-4" aria-hidden />
            </span>
            <p className="flex min-w-0 flex-1 items-center gap-2 text-sm leading-6 text-[#3d4a63]">
              <span className="font-semibold text-[#1c2740]">{sellerCopy.documentsNoteShort}</span>
              <InfoHint text={`${sellerCopy.documentsNoteTitle}. ${sellerCopy.documentsNoteBody}`} icon="info" width="lg" />
            </p>
          </div>
          <ShareMenu scope={{ kind: "room" }} investors={shares} advisors={advisors} files={listed} folders={folders} label={sellerCopy.shareAll} />
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <li>
            {namingFolder ? (
              <form action={createAction} className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#c5cdd8] bg-[#fbfbfc] px-4">
                <Input
                  name="name"
                  required
                  maxLength={40}
                  autoFocus
                  aria-label={sellerCopy.folderName}
                  placeholder={sellerCopy.folderName}
                  size="sm" className="text-center"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setNamingFolder(false);
                    }}
                    tone="outline" size="sm" className="text-xs"
>
                    {sellerCopy.meetingsCancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPending}
                    size="sm" className="text-xs"
>
                    {sellerCopy.folderCreate}
                  </Button>
                </div>
                <ActionNote state={createState} saved={sellerCopy.folderSaved} />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNamingFolder(true);
                }}
                className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#c5cdd8] bg-[#fbfbfc] text-[#465ab4] hover:bg-[#f4f7ff]"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#eef2ff]">
                  <PlusIcon size={22} aria-hidden />
                </span>
                <span className="text-sm font-semibold">{sellerCopy.folderCreate}</span>
              </button>
            )}
          </li>
          {folders.map((name) => (
            <FolderCard
              key={name}
              name={name}
              count={listed.filter((file) => file.folder === name).length}
              updatedAt={latestUpload(listed.filter((file) => file.folder === name))}
              viewers={new Set(listed.filter((file) => file.folder === name).flatMap((file) => file.viewers.map((viewer) => viewer.accessId))).size}
              onOpen={() => {
                setFolder(name);
              }}
              share={
                <ShareMenu
                  scope={{ kind: "folder", folder: name }}
                  investors={shares}
                  advisors={advisors}
                  files={listed}
                  folders={folders}
                  label={sellerCopy.shareFile}
                  align="left"
                />
              }
            />
          ))}
        </ul>
        </>
      ) : (
        <div className="px-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setFolder(null);
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#3d34b8]"
            >
              <ChevronLeft className="size-4" aria-hidden />
              {folder}
            </button>
            <p className="text-sm text-[#667085]">{documentCountLabel(inFolder.length)}</p>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <li>
              <DocumentDrop folder={folder} />
            </li>
              {inFolder.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onOpen={() => {
                    setOpenFile(file);
                  }}
                  share={
                    <ShareMenu
                      scope={{ kind: "file", fileId: file.id }}
                      investors={shares}
                      advisors={advisors}
                      files={listed}
                      folders={folders}
                      label={sellerCopy.shareFile}
                      align="left"
                    />
                  }
                />
              ))}
            </ul>
        </div>
      )}
      <FilePreviewDialog
        file={
          openFile
            ? { fileName: openFile.fileName, folder: openFile.folder, href: fileHref(openFile) }
            : null
        }
        onClose={() => {
          setOpenFile(null);
        }}
      />
    </div>
  );
}

/** "Comprador 2" → "2"; a connected buyer's name → initials ("MS"). */
function viewerInitials(label: string): string {
  if (label.startsWith("Comprador ")) {
    return label.slice("Comprador ".length);
  }

  return label
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
