import { CompanyDraftForm } from "@/components/company-draft-form";
import type { CompanyDraftInput } from "@/lib/company-draft";
import type { SellerFocusPanel } from "@/lib/company-profile";

export function SellerCompanyPanel({
  draft,
  cif,
  focus = null,
  promptSetup = false,
  reviewPending = false,
  coverSrc = null,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  focus?: SellerFocusPanel | null;
  promptSetup?: boolean;
  reviewPending?: boolean;
  coverSrc?: string | null;
}) {
  return (
    <>
      <CompanyDraftForm
        key={cif || "nueva"}
        draft={draft}
        cif={cif}
        focus={focus}
        promptSetup={promptSetup}
        reviewPending={reviewPending}
        coverSrc={coverSrc}
      />
    </>
  );
}
