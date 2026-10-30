import { ShellSkeleton } from "@/components/shell-skeleton";

// Detail page without its own skeleton: generic state instead of the parent list's skeleton.
export default function Loading() {
  return <ShellSkeleton />;
}
