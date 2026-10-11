import { CircleHelp } from "lucide-react";

export function FieldHint({
  text,
  align = "start",
  tone = "ink",
}: {
  text: string;
  align?: "start" | "center" | "end";
  tone?: "ink" | "light";
}) {
  const place = align === "center" ? "left-1/2 -translate-x-1/2" : align === "end" ? "right-0" : "left-0";
  const icon = tone === "light" ? "text-white/70 hover:text-white" : "text-[#8b95a7] hover:text-[#465ab4]";

  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={text}
        className={`inline-flex size-5 items-center justify-center rounded-full ${icon}`}
      >
        <CircleHelp className="size-4" aria-hidden />
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-30 mb-2 hidden w-64 rounded-xl bg-[#1c2740] px-3 py-2 text-left text-xs leading-5 font-normal whitespace-pre-line text-white shadow-lg group-focus-within:block group-hover:block ${place}`}
      >
        {text}
      </span>
    </span>
  );
}
