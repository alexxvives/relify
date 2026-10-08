"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DealPipeline, ProcessHeaderCue } from "@/components/deal-pipeline";
import { loiAgreement, ndaAgreement } from "@/lib/deal-documents";
import { engagementCopy } from "@/lib/engagement-copy";
import { investorCopy } from "@/lib/investor-copy";
import type { DealStep } from "@/lib/deal-pipeline";
import type { InvestorProcessCard } from "@/server/investorDesk";

function wantsAdvisor(steps: readonly DealStep[]): boolean {
  const current = steps.find((step) => step.state === "current");
  return current?.id === "qa" || current?.id === "diligence";
}

export function InvestorProcesses({
  items,
  buyerName,
  dateLabel,
}: {
  items: InvestorProcessCard[];
  buyerName: string;
  dateLabel: string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.slug}>
          <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white px-5 py-5">
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="text-lg font-semibold text-[#2b3b4a]">{item.codename}</h2>
                <ProcessHeaderCue
                  steps={item.steps}
                  role="investor"
                  sign={{
                    slug: item.slug,
                    nda: ndaAgreement({
                      buyerName,
                      codename: item.codename,
                      region: item.region,
                      dateLabel,
                    }),
                    loi: loiAgreement({
                      buyerName,
                      codename: item.codename,
                      region: item.region,
                      askingPrice: item.askingPrice,
                      dateLabel,
                    }),
                  }}
                />
                {wantsAdvisor(item.steps) ? (
                  <Link
                    href="/asesoramiento"
                    className="inline-flex h-9 items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4]"
                  >
                    {engagementCopy.contactAdvisor}
                  </Link>
                ) : null}
                <Link
                  href={`/proyectos/${item.slug}`}
                  className="ml-auto inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white"
                >
                  {investorCopy.openCompany}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <p className="mt-1 text-sm text-[#64748b]">{item.region}</p>
            </div>
            <DealPipeline
              steps={item.steps}
              role="investor"
              hideAsideCue
              sign={{
                slug: item.slug,
                nda: ndaAgreement({
                  buyerName,
                  codename: item.codename,
                  region: item.region,
                  dateLabel,
                }),
                loi: loiAgreement({
                  buyerName,
                  codename: item.codename,
                  region: item.region,
                  askingPrice: item.askingPrice,
                  dateLabel,
                }),
              }}
              diligence={{ accessId: item.accessId, advisorHref: "/asesoramiento" }}
            />
          </section>
        </li>
      ))}
    </ul>
  );
}
