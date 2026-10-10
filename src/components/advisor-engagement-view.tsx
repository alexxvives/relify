import { AdvisorCloseForm, AdvisorDepositForm, AdvisorNdaForm } from "@/components/advisor-engagement-forms";
import { AdvisorContactDesk } from "@/components/advisor-contact-desk";
import { AppToast } from "@/components/app-toast";
import { CompanyProfile } from "@/components/company-profile-view";
import { engagementCopy } from "@/lib/engagement-copy";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { AdvisorEngagementPage } from "@/server/advisoryEngagement";

export function AdvisorEngagementView({
  engagement,
  thread,
  today,
  notice,
}: {
  engagement: AdvisorEngagementPage;
  thread: AdvisorContactView | null;
  today: string;
  notice: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AppToast message={notice} tone={notice === engagementCopy.depositPaidNote ? "ok" : "error"} />
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <p className="text-sm text-[#64748b]">{engagement.clientLabel}</p>
        <h2 className="mt-1 text-3xl font-semibold text-[#1c2740]">{engagement.codename}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{engagement.region}</p>
        <p className="mt-2 text-sm text-[#3d4a63]">{engagement.services}</p>
        {engagement.preview?.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#3d4a63]">{engagement.preview.description}</p> : null}
        {engagement.preview && engagement.preview.facts.length > 0 ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {engagement.preview.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs text-[#64748b]">{fact.label}</dt>
                <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {engagement.preview?.showInvestor ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[#1c2740]">{engagementCopy.depositInvestor}</h3>
            {engagement.preview.investor.length === 0 ? (
              <p className="mt-2 text-sm text-[#64748b]">{engagementCopy.depositInvestorEmpty}</p>
            ) : (
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {engagement.preview.investor.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs text-[#64748b]">{fact.label}</dt>
                    <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ) : null}
        {engagement.figures.length > 0 ? (
          <dl className="mt-4 grid grid-cols-2 gap-4">
            {engagement.figures.map((figure) => (
              <div key={figure.label}>
                <dt className="text-xs text-[#64748b]">{figure.label}</dt>
                <dd className="mt-1 text-sm font-medium">{figure.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {engagement.deposit.paid && engagement.view === "public" ? <p className="mt-4 text-sm text-[#614d05]">{engagementCopy.publicOnly}</p> : null}
      </section>
      {engagement.deposit.paid ? null : <AdvisorDepositForm engagementId={engagement.id} amountLabel={engagement.deposit.amountLabel} />}
      {engagement.ndaText ? <AdvisorNdaForm engagementId={engagement.id} text={engagement.ndaText} /> : null}
      {thread ? <AdvisorContactDesk contacts={[thread]} today={today} showDocuments={false} /> : null}
      {engagement.profile ? <CompanyProfile project={engagement.profile} /> : null}
      {engagement.view === "investor" ? (
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.documentsTitle}</h2>
          {engagement.documents.length === 0 ? (
            <p className="mt-3 text-sm text-[#64748b]">{engagementCopy.documentsEmpty}</p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {engagement.documents.map((file) => (
                <li key={file.id}>
                  <a className="text-sm font-medium text-[#465ab4]" href={`/mi-empresa/documentos/archivo/${file.id}`}>
                    {file.folder} · {file.fileName}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      {engagement.view === "seller" ? (
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.foldersTitle}</h2>
          <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.processNote}</p>
          {engagement.folders.length === 0 && !engagement.processOpened ? (
            <p className="mt-3 text-sm text-[#64748b]">{engagementCopy.sellerWait}</p>
          ) : null}
          <ul className="mt-4 grid gap-3">
            {engagement.folders.map((folder) => (
              <li key={folder.name} className="rounded-2xl bg-[#f7f8fb] p-4">
                <h3 className="text-base font-semibold">{folder.name}</h3>
                {folder.files.length === 0 ? <p className="mt-2 text-sm text-[#64748b]">Sin archivos</p> : null}
                <ul className="mt-2 grid gap-1">
                  {folder.files.map((file) => (
                    <li key={file.id}>
                      <a className="text-sm text-[#465ab4]" href={`/mi-empresa/documentos/archivo/${file.id}`}>
                        {file.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-lg font-semibold">{engagementCopy.processTitle}</h3>
          {engagement.processOpened ? (
            <ol className="mt-3 grid gap-2">
              {engagementCopy.steps.map((step) => (
                <li key={step} className="rounded-xl bg-[#f7f8fb] px-3 py-2 text-sm">
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-[#64748b]">{engagementCopy.processClosed}</p>
          )}
        </section>
      ) : null}
      {engagement.deposit.paid ? <AdvisorCloseForm engagementId={engagement.id} closed={engagement.closed} feeLabel={engagement.feeLabel} /> : null}
    </div>
  );
}
