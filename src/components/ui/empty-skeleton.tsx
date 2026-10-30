import type { LucideIcon } from "lucide-react";

/**
 * Empty state drawn as a faded preview of the list it will become,
 * so an empty admin page still shows what will appear there.
 */
export function EmptySkeleton({
  icon: Icon,
  title,
  text,
  rows = 3,
  variant = "cards",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  rows?: number;
  variant?: "cards" | "rows";
}) {
  return (
    <div className="relative mt-4 min-h-60 overflow-hidden rounded-2xl border border-dashed border-[#c5ced8] bg-[#f8f9fb]">
      <div aria-hidden="true" className={`flex flex-col p-4 opacity-60 ${variant === "rows" ? "gap-0 divide-y divide-[#e7eaee]" : "gap-3"}`}>
        {Array.from({ length: rows }, (_, index) =>
          variant === "rows" ? (
            <div key={index} className="flex items-center justify-between gap-4 bg-white px-4 py-4 first:rounded-t-xl last:rounded-b-xl">
              <span className="h-3 rounded-full bg-[#e3e8ef]" style={{ width: `${46 - index * 7}%` }} />
              <span className="h-3 w-24 rounded-full bg-[#eef1f5]" />
            </div>
          ) : (
            <div key={index} className="rounded-xl border border-[#e7eaee] bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="h-3 rounded-full bg-[#e3e8ef]" style={{ width: `${40 - index * 6}%` }} />
                <span className="h-3 w-20 rounded-full bg-[#eef1f5]" />
              </div>
              <span className="mt-3 block h-2.5 w-24 rounded-full bg-[#e6f4f2]" />
              <span className="mt-3 block h-2.5 w-[85%] rounded-full bg-[#eef1f5]" />
              <span className="mt-2 block h-2.5 w-[60%] rounded-full bg-[#eef1f5]" />
            </div>
          ),
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#f8f9fb]/30 via-[#f8f9fb]/85 to-[#f8f9fb]/30 p-6">
        <div className="max-w-sm text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#1c2740] text-white">
            <Icon className="size-5" aria-hidden />
          </span>
          <p className="mt-3 text-base font-semibold text-[#1c2740]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{text}</p>
        </div>
      </div>
    </div>
  );
}
