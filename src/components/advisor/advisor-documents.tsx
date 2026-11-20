"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAdvisorDocumentAction, storeAdvisorDocumentAction } from "@/app/(app)/mis-servicios/actions";
import { DocumentThumb } from "@/components/seller/seller-documents";
import { UploadDropzone } from "@/components/seller/upload-dropzone";
import { Trash2Icon } from "@/components/ui/trash-2";
import { advisorCopy } from "@/lib/advisor-copy";
import type { AdvisorDocumentView } from "@/lib/advisor-documents";

/** S37 (Alex): the seller's Mis documentos upload box, then each file as a preview the same size as the box. */
export function AdvisorDocuments({ documents }: { documents: AdvisorDocumentView[] }) {
  const router = useRouter();

  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <li data-upload-tile>
        <UploadDropzone
          corner={4}
          onUpload={async (file) => {
            const data = new FormData();
            data.set("file", file);
            const result = await storeAdvisorDocumentAction(data);
            if (!result.ok) {
              return { ok: false, message: result.message };
            }
            router.refresh();
            return { ok: true };
          }}
        />
      </li>
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </ul>
  );
}

function DocumentCard({ document }: { document: AdvisorDocumentView }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex flex-col items-center gap-2" data-advisor-document>
      <span className="relative block w-full max-w-[11.5rem]">
        <a href={document.href} target="_blank" rel="noopener" aria-label={`${advisorCopy.documentOpen}: ${document.fileName}`} className="releva-doc-sheet w-full">
          <DocumentThumb src={document.href} fileName={document.fileName} />
        </a>
        <span className="absolute top-2 right-2 z-10">
          {confirming ? (
            <button
              type="button"
              disabled={pending}
              onBlur={() => {
                setConfirming(false);
              }}
              onClick={async () => {
                setPending(true);
                const result = await deleteAdvisorDocumentAction(document.id);
                setPending(false);
                setConfirming(false);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                router.refresh();
              }}
              className="inline-flex h-8 items-center rounded-full bg-red-700 px-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {pending ? advisorCopy.documentDeleting : advisorCopy.documentDelete}
            </button>
          ) : (
            <button
              type="button"
              aria-label={advisorCopy.documentDelete}
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-[#8b95a7] hover:bg-[#fff1f1] hover:text-red-700"
            >
              <Trash2Icon size={16} aria-hidden />
            </button>
          )}
        </span>
      </span>
      <span className="line-clamp-2 w-full px-1 text-center text-xs font-medium text-[#1c2740]">{document.fileName}</span>
      {error ? (
        <p role="alert" className="text-center text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </li>
  );
}
