"use client";

import { useState } from "react";
import { ChevronDown, Folder, Home } from "lucide-react";
import { SellerTabs } from "@/components/seller-tabs";
import { documentFolders, sellerCopy } from "@/lib/seller-copy";

const tabs = [
  { id: "documents", label: "Documentos" },
  { id: "permissions", label: sellerCopy.permissions },
] as const;

type DocumentTab = (typeof tabs)[number]["id"];

export function SellerDocuments() {
  const [folder, setFolder] = useState<string | null>(null);
  const [tab, setTab] = useState<DocumentTab>("documents");
  const visible = folder === null ? documentFolders : documentFolders.filter((item) => item.name === folder);

  return (
    <div>
      <SellerTabs label={sellerCopy.documentsTitle} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "permissions" ? (
        <section className="mt-6 rounded-2xl border border-[#e6e9f0] bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{sellerCopy.permissionsTitle}</h2>
            <button
              type="button"
              disabled
              className="inline-flex h-10 items-center rounded-full bg-[#c9c3f5] px-4 text-sm font-medium text-white"
            >
              {sellerCopy.addAccess}
            </button>
          </div>
          <p className="mt-1 text-sm text-[#667085]">{sellerCopy.permissionsIntro}</p>
          <p className="mt-8 text-center text-sm font-medium">{sellerCopy.permissionsEmpty}</p>
          <p className="mt-1 text-center text-sm text-[#667085]">{sellerCopy.permissionsEmptyBody}</p>
        </section>
      ) : (
        <div className="mt-4 grid gap-4 rounded-2xl border border-[#e7eaee] bg-white p-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <button
              type="button"
              onClick={() => {
                setFolder(null);
              }}
              className={
                folder === null
                  ? "flex w-full items-center justify-between rounded-lg bg-[#f4f5f7] px-3 py-2 text-left text-sm font-medium"
                  : "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm"
              }
            >
              <span className="inline-flex items-center gap-2">
                <Home className="size-4" aria-hidden />
                {sellerCopy.allFolders}
              </span>
              <ChevronDown className="size-4 text-[#667085]" aria-hidden />
            </button>
            <ul className="mt-2">
              {documentFolders.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => {
                      setFolder(item.name);
                    }}
                    className={
                      folder === item.name
                        ? "flex w-full items-center gap-2 rounded-lg bg-[#f4f5f7] px-3 py-2 text-left text-sm font-medium"
                        : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#3d4a63]"
                    }
                  >
                    <Folder className="size-4 text-[#98a2b3]" aria-hidden />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <section>
            <div className="flex items-center justify-between gap-3 px-2">
              <h2 className="text-sm font-medium text-[#1c2740]">{folder ?? sellerCopy.allFolders}</h2>
              <p className="text-sm text-[#667085]">{folder === null ? sellerCopy.folderCount : visible[0]?.count}</p>
            </div>
            {folder !== null && visible[0] !== undefined ? (
              <div className="mt-6 px-2 pb-4">
                <p className="font-medium">{sellerCopy.folderEmpty}</p>
                <p className="mt-1 text-sm text-[#667085]">{sellerCopy.folderEmptyBody}</p>
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((item) => (
                  <li key={item.name}>
                    <button
                      type="button"
                      onClick={() => {
                        setFolder(item.name);
                      }}
                      className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-[#eef0f3] bg-[#fbfbfc] px-3 text-center"
                    >
                      <Folder className="size-16 text-[#d5dbe3]" strokeWidth={1.25} aria-hidden />
                      <span className="mt-3 text-sm font-semibold text-[#1c2740]">{item.name}</span>
                      <span className="mt-1 text-xs text-[#667085]">{item.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
