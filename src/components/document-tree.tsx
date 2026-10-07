"use client";

import { useState } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";

export type TreeNode = {
  id: string;
  label: string;
  kind: "folder" | "file";
  children?: TreeNode[];
};

type Row = { node: TreeNode; level: number };

export function DocumentTree({
  nodes,
  label,
  selectedId,
  onSelect,
  defaultExpandedIds = [],
}: {
  nodes: TreeNode[];
  label: string;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  defaultExpandedIds?: string[];
}) {
  const [expanded, setExpanded] = useState<string[]>(defaultExpandedIds);
  const open = new Set(expanded);
  const rows = flatten(nodes, open, 0);

  function toggle(id: string) {
    setExpanded((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function move(currentId: string, direction: -1 | 1) {
    const index = rows.findIndex((row) => row.node.id === currentId);
    const next = rows[index + direction];
    if (!next) {
      return;
    }
    const button = document.getElementById(`tree-${next.node.id}`);
    if (button instanceof HTMLButtonElement) {
      button.focus();
    }
  }

  return (
    <div role="tree" aria-label={label} className="flex flex-col">
      {rows.map((row, index) => {
        const folder = row.node.kind === "folder";
        const isOpen = folder && open.has(row.node.id);
        const selected = selectedId === row.node.id;
        return (
          <button
            key={row.node.id}
            id={`tree-${row.node.id}`}
            type="button"
            role="treeitem"
            aria-level={row.level + 1}
            aria-posinset={index + 1}
            aria-setsize={rows.length}
            aria-expanded={folder ? isOpen : undefined}
            aria-selected={selected}
            tabIndex={selected || (selectedId === null && index === 0) ? 0 : -1}
            onClick={() => {
              onSelect(row.node);
              if (folder) {
                toggle(row.node.id);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(row.node.id, 1);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                move(row.node.id, -1);
              }
              if (event.key === "ArrowRight" && folder && !isOpen) {
                event.preventDefault();
                toggle(row.node.id);
              }
              if (event.key === "ArrowLeft" && folder && isOpen) {
                event.preventDefault();
                toggle(row.node.id);
              }
            }}
            className={
              selected
                ? "flex h-9 items-center gap-1.5 rounded-lg bg-[#f4f5f7] pr-2 text-left text-sm font-medium text-[#1c2740]"
                : "flex h-9 items-center gap-1.5 rounded-lg pr-2 text-left text-sm text-[#3d4a63] hover:bg-[#f7f8fb]"
            }
            style={{ paddingLeft: `${8 + row.level * 16}px` }}
          >
            {folder ? (
              <ChevronRight className={isOpen ? "size-3.5 shrink-0 rotate-90 text-[#667085]" : "size-3.5 shrink-0 text-[#667085]"} aria-hidden />
            ) : (
              <span className="size-3.5 shrink-0" aria-hidden />
            )}
            {folder ? <Folder className="size-4 shrink-0 text-[#98a2b3]" aria-hidden /> : <FileText className="size-4 shrink-0 text-[#465ab4]" aria-hidden />}
            <span className="min-w-0 truncate">{row.node.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FolderFileTree({ label, nodes }: { label: string; nodes: TreeNode[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null);

  return (
    <DocumentTree
      nodes={nodes}
      label={label}
      selectedId={selectedId}
      defaultExpandedIds={nodes.map((node) => node.id)}
      onSelect={(node) => {
        setSelectedId(node.id);
      }}
    />
  );
}

function flatten(nodes: TreeNode[], open: Set<string>, level: number): Row[] {
  return nodes.flatMap((node) => {
    const row = { node, level };
    if (node.kind === "folder" && node.children && open.has(node.id)) {
      return [row, ...flatten(node.children, open, level + 1)];
    }
    return [row];
  });
}
