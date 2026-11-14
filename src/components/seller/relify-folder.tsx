"use client";

import dynamic from "next/dynamic";
import { relevaDrafts } from "@/lib/releva-drafts";

const Folder = dynamic(() => import("@/components/Folder"), { ssr: false });

const papers = ["Teaser", ...relevaDrafts.map((draft) => draft.fileName.replace(".pdf", "").replace(/-/g, " "))];

/** 3D Relify folder on Mis documentos. Other folders keep the lucide icon. */
export function RelifyFolder() {
  return (
    <Folder
      items={papers}
      label="Relify"
      color="#465ab4"
      paperColor="#ffffff"
      size={0.62}
      theme="light"
      openOn="hover"
      draggable={false}
      zoomOnClick={false}
      intro={false}
      className="pointer-events-auto"
    />
  );
}
