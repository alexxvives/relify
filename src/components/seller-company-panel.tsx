import { CompanyDraftForm } from "@/components/company-draft-form";
import { InfoHint } from "@/components/ui/info-hint";
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
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#667085]">
          {companyCopy.nifPrefilledLabel}
          <InfoHint text={companyCopy.nifPrefilled} icon="info" align="start" width="md" />
        </p>
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
