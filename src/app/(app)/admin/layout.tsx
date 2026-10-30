import type { ReactNode } from "react";
import { SabiJobsIndicator } from "@/components/sabi-jobs-indicator";

// t67: admin-wide frame so a SABI import keeps reporting while the admin moves between pages.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SabiJobsIndicator />
    </>
  );
}
