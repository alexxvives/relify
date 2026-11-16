import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "cn";

export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterChip({
  selected = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-11 shrink-0 snap-start items-center rounded-full px-4 text-sm font-medium",
        selected ? "bg-[#1c2740] text-white" : "border border-[#d5dbe3] bg-white text-[#1c2740]",
        className,
      )}
      {...props}
    />
  );
}
