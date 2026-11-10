import { CompanyDraftForm } from "@/components/company-draft-form";
import { RegistryOverview } from "@/components/company-report";
import { Card } from "@/components/ui/form";
import type { SabiDetailForm } from "@/server/sabiDetail";
import type { SellerFichaExtras } from "@/server/sellerFichaExtras";
import { sabiRegistryIsEmpty, type SabiRegistry } from "@/lib/sabi/registry";
import type { CompanyDraftInput } from "@/lib/company-draft";
import type { SellerFocusPanel } from "@/lib/company-profile";

export function SellerCompanyPanel({
  draft,
  cif,
  focus = null,
  initialTab = "company",
  coverSrc = null,
  sabiRegistry = null,
  fichaExtras = null,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  focus?: SellerFocusPanel | null;
  initialTab?: "company" | "deal";
  coverSrc?: string | null;
  /** t76: no longer shown to sellers (raw accounting detail; figures are loaded by us). Kept for callers. */
  sabiDetail?: SabiDetailForm | null;
  sabiRegistry?: SabiRegistry | null;
  fichaExtras?: SellerFichaExtras | null;
}) {
  return (
    <>
      <CompanyDraftForm
        key={cif || "nueva"}
        draft={draft}
        cif={cif}
        focus={focus}
        initialTab={initialTab}
        reportYears={sabiRegistry?.years ?? null}
        fichaExtras={fichaExtras}
        coverSrc={coverSrc}
        financeExtra={
          sabiRegistry ? (
            <>
              {sabiRegistry && !sabiRegistryIsEmpty(sabiRegistry) ? (
                <Card className="p-0">
                  <details id="panel-sabi-registry" className="group scroll-mt-20 lg:scroll-mt-6">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-2xl p-5 focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0">
                        <span className="block text-2xl font-semibold text-[#2b3b4a]">Datos del registro mercantil</span>
                        <span className="mt-1 block max-w-3xl text-sm text-[#64748b]">Socios, administradores, participadas y auditorías. Solo los ves tú y Relify; los compradores no ven nombres.</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center rounded-full border border-[#d5dbe3] px-3 py-1 text-xs font-semibold text-[#3d4a63] group-open:hidden">Ver</span>
                      <span className="hidden shrink-0 items-center rounded-full border border-[#d5dbe3] px-3 py-1 text-xs font-semibold text-[#3d4a63] group-open:inline-flex">Ocultar</span>
                    </summary>
                    <div className="px-5 pb-5">
                      <RegistryOverview registry={{ ...sabiRegistry, banks: [] }} />
                    </div>
                  </details>
                </Card>
              ) : null}
            </>
          ) : null
        }
      />
    </>
  );
}
