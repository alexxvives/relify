import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

const nativeSelectClassName =
  "h-11 w-full appearance-none rounded-xl border border-[#e1e6ee] bg-white pr-10 pl-3 text-sm text-[#1c2740] outline-none focus-visible:border-[#5c4de0] focus-visible:ring-3 focus-visible:ring-[#5c4de0]/25";

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block min-w-0">
      <select className={cn(nativeSelectClassName, className)} {...props} />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#5c6b78]"
        aria-hidden
      />
    </span>
  );
}
