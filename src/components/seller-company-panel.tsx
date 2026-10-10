import { CompanyDraftForm } from "@/components/company-draft-form";
import { companyCopy } from "@/lib/company-copy";
import type { CompanyDraftInput } from "@/lib/company-draft";
import type { SellerFocusPanel } from "@/lib/company-profile";

export function SellerCompanyPanel({
  draft,
  cif,
  registryFilled,
  focus = null,
  promptSetup = false,
  reviewPending = false,
  coverSrc = null,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  registryFilled: boolean;
  focus?: SellerFocusPanel | null;
  promptSetup?: boolean;
  reviewPending?: boolean;
  coverSrc?: string | null;
}) {
  return (
    <>
      {registryFilled ? (
        <p className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#3d646c]">{companyCopy.nifPrefilled}</p>
      ) : null}
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
