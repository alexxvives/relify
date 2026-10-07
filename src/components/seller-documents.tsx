"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
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
  renameDataRoomFolderAction,
  shareDataRoomFileFormAction,
  storeDataRoomFileAction,
  type DataRoomActionState,
} from "@/app/mi-empresa/documentos/actions";
import type { DataRoomShareView, OwnerFileView } from "@/lib/data-room";
import { documentCountLabel, sellerCopy } from "@/lib/seller-copy";

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
    <div className="mt-6">
      <div
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
            ? "flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#465ab4] bg-[#eef2ff] px-6 py-8 text-center"
            : "flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c5d0f5] bg-[#f7f8ff] px-6 py-8 text-center"
        }
      >
        <UploadIcon size={32} className="text-[#465ab4]" aria-hidden />
        <p className="mt-3 text-sm font-medium text-[#1c2740]">{pending ? sellerCopy.addingDocument : sellerCopy.dropDocument}</p>
        <label className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white">
          {sellerCopy.chooseDocuments}
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
      </div>
      <div className="mt-3">
        <ActionNote state={state} saved={sellerCopy.documentSaved} />
      </div>
    </div>
  );
}

function ShareMenu({
  file,
  investors,
}: {
  file: OwnerFileView;
  investors: DataRoomShareView[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const shared = new Set(file.viewers.map((viewer) => viewer.accessId));

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
        {sellerCopy.shareFile}
      </button>
      {open ? (
        <div className="absolute top-9 right-0 z-20 w-56 rounded-2xl border border-[#e6e9f0] bg-white p-2 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]">
          <p className="px-2 py-1 text-xs font-medium text-[#667085]">{sellerCopy.shareFileWith}</p>
          {investors.length === 0 ? <p className="px-2 py-2 text-sm text-[#667085]">{sellerCopy.shareNone}</p> : null}
          <ul className="flex flex-col">
            {investors.map((investor) => {
              const on = shared.has(investor.accessId);
              return (
                <li key={investor.accessId}>
                  <form action={shareDataRoomFileFormAction}>
                    <input type="hidden" name="fileId" value={file.id} />
                    <input type="hidden" name="accessId" value={investor.accessId} />
                    <input type="hidden" name="shared" value={on ? "0" : "1"} />
                    <button
                      type="submit"
                      className="flex h-10 w-full items-center justify-between gap-2 rounded-xl px-2 text-left text-sm hover:bg-[#f4f7ff]"
                    >
                      <span className="truncate">{investor.label}</span>
                      <span className={on ? "shrink-0 text-xs font-semibold text-[#17663a]" : "shrink-0 text-xs text-[#8b95a7]"}>
                        {on ? sellerCopy.shareVisible : sellerCopy.shareFile}
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FolderDelete({ name }: { name: string }) {
  const [state, action, pending] = useActionState(deleteDataRoomFolderAction, null);
  const [confirming, setConfirming] = useState(false);

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
  );
}

function FileDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteDataRoomFileAction, null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={sellerCopy.documentDelete}
        onClick={() => {
          setConfirming(true);
        }}
        className="inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-[#8b95a7] hover:bg-[#fff1f1] hover:text-red-700"
      >
        <Trash2Icon size={16} aria-hidden />
      </button>
    );
  }

  return (
    <form action={action}>
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

function FolderCard({ name, count, onOpen }: { name: string; count: number; onOpen: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [state, action, pending] = useActionState(renameDataRoomFolderAction, null);
  const [closed, setClosed] = useState<DataRoomActionState>(null);

  if (state?.ok && state !== closed) {
    setClosed(state);
    setEditing(false);
  }

  return (
    <li className="relative">
      {editing ? (
        <form action={action} className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-[#e1e6ee] bg-[#fbfbfc] px-4">
          <input type="hidden" name="from" value={name} />
          <FolderOpenIcon size={40} className="text-[#d5dbe3]" aria-hidden />
          <input
            name="name"
            required
            maxLength={40}
            value={value}
            aria-label={sellerCopy.folderName}
            onChange={(event) => {
              setValue(event.target.value);
            }}
            className="h-10 w-full rounded-xl border border-[#e1e6ee] bg-white px-3 text-center text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setValue(name);
                setEditing(false);
              }}
              className="inline-flex h-8 items-center rounded-full border border-[#e1e6ee] px-3 text-xs font-medium"
            >
              {sellerCopy.meetingsCancel}
            </button>
            <button
              type="submit"
              disabled={pending || value.trim() === name}
              className="inline-flex h-8 items-center rounded-full bg-[#465ab4] px-3 text-xs font-medium text-white disabled:opacity-60"
            >
              {sellerCopy.folderRename}
            </button>
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
            <FolderOpenIcon size={64} className="text-[#d5dbe3]" aria-hidden />
            <span className="mt-3 text-sm font-semibold text-[#1c2740]">{name}</span>
            <span className="mt-1 text-xs text-[#667085]">{documentCountLabel(count)}</span>
          </button>
          <div className="absolute top-3 right-3 flex items-center">
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

export function SellerDocuments({
  files,
  folders,
  shares,
}: {
  files: OwnerFileView[];
  folders: string[];
  shares: DataRoomShareView[];
}) {
  const [folder, setFolder] = useState<string | null>(null);
  const [namingFolder, setNamingFolder] = useState(false);
  const [openFile, setOpenFile] = useState<OwnerFileView | null>(null);
  const [createState, createAction, createPending] = useActionState(createDataRoomFolderAction, null);
  const [createClosed, setCreateClosed] = useState<DataRoomActionState>(null);
  const inFolder = files.filter((file) => file.folder === folder);

  if (createState?.ok && createState !== createClosed) {
    setCreateClosed(createState);
    setNamingFolder(false);
  }

  return (
    <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
      {folder === null ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <li>
            {namingFolder ? (
              <form action={createAction} className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#c5cdd8] bg-[#fbfbfc] px-4">
                <input
                  name="name"
                  required
                  maxLength={40}
                  autoFocus
                  aria-label={sellerCopy.folderName}
                  placeholder={sellerCopy.folderName}
                  className="h-10 w-full rounded-xl border border-[#e1e6ee] bg-white px-3 text-center text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNamingFolder(false);
                    }}
                    className="inline-flex h-8 items-center rounded-full border border-[#e1e6ee] px-3 text-xs font-medium"
                  >
                    {sellerCopy.meetingsCancel}
                  </button>
                  <button
                    type="submit"
                    disabled={createPending}
                    className="inline-flex h-8 items-center rounded-full bg-[#465ab4] px-3 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {sellerCopy.folderCreate}
                  </button>
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
              count={files.filter((file) => file.folder === name).length}
              onOpen={() => {
                setFolder(name);
              }}
            />
          ))}
        </ul>
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
          {inFolder.length > 0 ? (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {inFolder.map((file) => (
                <li key={file.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenFile(file);
                    }}
                    className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-[#eef0f3] bg-[#fbfbfc] px-3 pt-6 text-center hover:border-[#c5d0f5]"
                  >
                    <FileTextIcon size={64} className="text-[#465ab4]" aria-hidden />
                    <span className="mt-3 line-clamp-2 text-sm font-medium text-[#1c2740]">{file.fileName}</span>
                  </button>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {file.viewers.length > 0 ? (
                      <span className="inline-flex -space-x-1" aria-label={sellerCopy.viewersLabel}>
                        {file.viewers.map((viewer) => (
                          <span
                            key={viewer.accessId}
                            title={viewer.label}
                            className="inline-flex size-6 items-center justify-center rounded-full border border-white bg-[#465ab4] text-[10px] font-semibold text-white"
                          >
                            {viewer.label.replace("Inversor ", "")}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    <ShareMenu file={file} investors={shares} />
                  </div>
                  <div className="absolute right-2 bottom-2">
                    <FileDelete id={file.id} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <DocumentDrop folder={folder} />
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
