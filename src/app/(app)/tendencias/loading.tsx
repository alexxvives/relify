import { TrendsSkeleton } from "@/components/shell-skeleton";
import { sellerCopy } from "@/lib/seller-copy";

export default function Loading() {
  return <TrendsSkeleton title={sellerCopy.trendsTitle} />;
}
