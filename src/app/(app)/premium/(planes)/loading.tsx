import { PlansSkeleton } from "@/components/shell-skeleton";
import { billingCopy } from "@/lib/billing-copy";

export default function Loading() {
  return <PlansSkeleton title={billingCopy.title} />;
}
