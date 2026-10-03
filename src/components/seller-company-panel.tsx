import { CompanyDraftForm } from "@/components/company-draft-form";
import type { CompanyDraftInput } from "@/lib/company-draft";

export function SellerCompanyPanel({
  draft,
  cif,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  registryFilled: boolean;
}) {
  return <CompanyDraftForm draft={draft} cif={cif} />;
}
