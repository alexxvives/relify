"use client";

import { useActionState } from "react";
import { setAdvisorFolderAction, setAdvisorProcessAction } from "@/app/mandatos/encargos/actions";
import { engagementCopy } from "@/lib/engagement-copy";
import type { SellerAdvisorAccess } from "@/server/advisoryEngagement";

export function AdvisorAccessPanel({
  access,
  folders,
  mode,
}: {
  access: SellerAdvisorAccess;
  folders: string[];
  mode: "folders" | "process";
}) {
  if (!access.waiting && access.ready.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-2xl border border-[#e7eaee] bg-white p-5">
      <h2 className="text-xl font-semibold text-[#2b3b4a]">{engagementCopy.accessTitle}</h2>
      {access.waiting ? <p className="mt-2 text-sm text-[#64748b]">{engagementCopy.noAdvisorYet}</p> : null}
      <ul className="mt-4 grid gap-4">
        {access.ready.map((row) => (
          <li key={row.engagementId} className="rounded-2xl bg-[#f7f8fb] p-4">
            <p className="text-sm font-semibold text-[#1c2740]">{row.advisorName}</p>
            {mode === "folders" ? (
              <ul className="mt-3 grid gap-2">
                {folders.map((folder) => {
                  const open = row.folders.includes(folder);
                  return (
                    <li key={folder}>
                      <FolderToggle engagementId={row.engagementId} folder={folder} open={open} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ProcessToggle engagementId={row.engagementId} open={row.processOpened} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FolderToggle({ engagementId, folder, open }: { engagementId: string; folder: string; open: boolean }) {
  const [state, action, pending] = useActionState(setAdvisorFolderAction, null);

  return (
    <form action={action} className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{folder}</span>
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="folder" value={folder} />
      <input type="hidden" name="open" value={open ? "0" : "1"} />
      <button type="submit" disabled={pending} className="text-sm font-medium text-[#465ab4]">
        {open ? engagementCopy.closeFolder : engagementCopy.openFolder}
      </button>
      {state && !state.ok ? <span className="text-sm text-red-700">{state.message}</span> : null}
    </form>
  );
}

function ProcessToggle({ engagementId, open }: { engagementId: string; open: boolean }) {
  const [state, action, pending] = useActionState(setAdvisorProcessAction, null);

  return (
    <form action={action} className="mt-3 flex flex-col items-start gap-2">
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="open" value={open ? "0" : "1"} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {open ? engagementCopy.closeProcess : engagementCopy.openProcess}
      </button>
      <p className="text-sm text-[#64748b]">{engagementCopy.processNote}</p>
      {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
    </form>
  );
}
