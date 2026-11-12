import { NoteSkeleton } from "@/components/shell/shell-skeleton";
import { investorCopy } from "@/lib/investor-copy";

export default function Loading() {
  return <NoteSkeleton title={investorCopy.dataroomTitle} />;
}
