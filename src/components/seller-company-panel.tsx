import { CompanyDraftForm } from "@/components/company-draft-form";
import { SabiDetailPanel } from "@/components/sabi-detail-panel";
import { SabiRegistryCards } from "@/components/sabi-registry-cards";
import type { SabiDetailForm } from "@/server/sabiDetail";
import { sabiRegistryIsEmpty, type SabiRegistry } from "@/lib/sabi/registry";
import type { CompanyDraftInput } from "@/lib/company-draft";
import type { SellerFocusPanel } from "@/lib/company-profile";

export function SellerCompanyPanel({
  draft,
  cif,
  focus = null,
  reviewPending = false,
  coverSrc = null,
  sabiDetail = null,
  sabiRegistry = null,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  focus?: SellerFocusPanel | null;
  reviewPending?: boolean;
  coverSrc?: string | null;
  sabiDetail?: SabiDetailForm | null;
  sabiRegistry?: SabiRegistry | null;
}) {
  return (
    <>
      <CompanyDraftForm
        key={cif || "nueva"}
        draft={draft}
        cif={cif}
        focus={focus}
        reviewPending={reviewPending}
        coverSrc={coverSrc}
        financeExtra={
          sabiDetail || sabiRegistry ? (
            <>
              {sabiDetail ? <SabiDetailPanel detail={sabiDetail} /> : null}
              {sabiRegistry && !sabiRegistryIsEmpty(sabiRegistry) ? <SabiRegistryCards registry={sabiRegistry} /> : null}
            </>
          ) : null
        }
      />
    </>
  );
}
