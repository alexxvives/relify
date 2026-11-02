import { CompanyDraftForm } from "@/components/company-draft-form";
import { SabiDetailPanel } from "@/components/sabi-detail-panel";
import { RegistryOverview } from "@/components/company-report";
import { Card } from "@/components/ui/form";
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
        reportYears={sabiRegistry?.years ?? null}
        coverSrc={coverSrc}
        financeExtra={
          sabiDetail || sabiRegistry ? (
            <>
              {sabiDetail ? <SabiDetailPanel detail={sabiDetail} /> : null}
              {sabiRegistry && !sabiRegistryIsEmpty(sabiRegistry) ? (
                <Card id="panel-sabi-registry" className="scroll-mt-6">
                  <h2 className="text-2xl font-semibold text-[#2b3b4a]">Datos del registro mercantil</h2>
                  <p className="mt-1 max-w-3xl text-sm text-[#64748b]">Socios, administradores, participadas, auditorías y bancos importados del registro. Solo los ves tú y Releva; los compradores no ven nombres.</p>
                  <div className="mt-5">
                    <RegistryOverview registry={sabiRegistry} />
                  </div>
                </Card>
              ) : null}
            </>
          ) : null
        }
      />
    </>
  );
}
