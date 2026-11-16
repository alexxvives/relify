"use client";

import { relevaDrafts } from "@/lib/releva-drafts";
import { DocumentsFolder } from "@/components/seller/documents-folder";

const papers = ["Teaser", ...relevaDrafts.map((draft) => draft.fileName.replace(".pdf", "").replace(/-/g, " "))];

/** 3D Relify folder on Mis documentos. Accent colour; other folders stay grey. */
export function RelifyFolder() {
  return <DocumentsFolder label="Relify" items={papers} accent />;
}
