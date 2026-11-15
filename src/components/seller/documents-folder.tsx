"use client";

import dynamic from "next/dynamic";

const Folder = dynamic(() => import("@/components/Folder"), { ssr: false });

export function DocumentsFolder({
  label,
  items,
  accent = false,
  onActivate,
}: {
  label: string;
  items: string[];
  accent?: boolean;
  onActivate?: () => void;
}) {
  const papers = items.length > 0 ? items.slice(0, 3) : [label];

  return (
    <Folder
      items={papers}
      label={label}
      color={accent ? "#465ab4" : "#9aa3b2"}
      paperColor="#ffffff"
      size={0.62}
      theme="light"
      openOn="hover"
      bounce={0.78}
      draggable={false}
      zoomOnClick={false}
      intro={false}
      onActivate={onActivate}
      className="pointer-events-auto"
    />
  );
}
