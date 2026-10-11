import type { ReactNode } from "react";

export function AdminPageHeader({ title, note, children }: { title: string; note?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl tracking-tight text-public-ink">{title}</h1>
        {note ? <p className="mt-1 text-sm text-[#667085]">{note}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center justify-end gap-2">{children}</div> : null}
    </div>
  );
}

export function AdminSearchField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="flex h-9 items-center gap-2 rounded-full border border-[#e7eaee] bg-white px-3">
      <span className="shrink-0 text-xs text-[#667085]">{label}</span>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="w-32 bg-transparent text-sm text-[#1c2740] outline-none placeholder:text-[#98a2b3] sm:w-40"
      />
    </label>
  );
}
