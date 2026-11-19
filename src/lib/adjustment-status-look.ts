import { companyCopy } from "@/lib/company-copy";
import type { AdjustmentStatus } from "@/lib/ebitda-adjustments";

/** S32: one label and colour per EBITDA adjustment status (seller form, admin and seller report). */
export const adjustmentStatusLook: Record<AdjustmentStatus, { label: string; className: string }> = {
  approved: { label: companyCopy.adjustmentApproved, className: "bg-[#e8f6ee] text-[#17663a]" },
  pending: { label: companyCopy.adjustmentPending, className: "bg-[#fff4e5] text-[#7a4700]" },
  rejected: { label: companyCopy.adjustmentRejected, className: "bg-[#fef3f2] text-[#b42318]" },
};
