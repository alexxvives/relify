import { AccountSkeleton } from "@/components/page-skeletons";

// Route-level state while /cuenta loads: the title bone stands in for the real h1.
export default function Loading() {
  return (
    <>
      <div aria-hidden className="h-9 w-40 animate-pulse rounded-lg bg-[#d5dce5] motion-reduce:animate-none" />
      <div className="mt-6">
        <AccountSkeleton />
      </div>
    </>
  );
}
