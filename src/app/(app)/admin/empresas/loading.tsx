import { AdminListSkeleton } from "@/components/page-skeletons";
import { RouteLoading } from "@/components/route-loading";

// Same skeleton as the page's Suspense fallback, so navigation shows one layout.
export default function Loading() {
  return (
    <RouteLoading>
      <AdminListSkeleton kind="companies" />
    </RouteLoading>
  );
}
