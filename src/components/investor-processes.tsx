"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DealPipeline } from "@/components/deal-pipeline";
import { pipelineStatus } from "@/lib/deal-pipeline";
import { investorCopy } from "@/lib/investor-copy";
import type { InvestorProcessCard } from "@/server/investorDesk";

export function InvestorProcesses({ items }: { items: InvestorProcessCard[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.slug}>
          <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white px-5 py-4 xl:flex-row xl:items-center">
            <div className="min-w-0 xl:w-52">
              <h2 className="text-lg font-semibold text-[#2b3b4a]">{item.codename}</h2>
              <p className="mt-1 text-sm text-[#64748b]">
                {item.region} · {pipelineStatus(item.steps)}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <DealPipeline steps={item.steps} compact />
            </div>
            <Link
              href={`/proyectos/${item.slug}`}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white"
            >
              {investorCopy.openCompany}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>
        </li>
      ))}
    </ul>
  );
}
