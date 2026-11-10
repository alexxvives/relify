import type { Metadata } from "next";
import { Clock, LineChart, ShieldCheck } from "lucide-react";
import { ValuationRequestForm } from "@/components/valuation-request-form";
import { PublicSite } from "@/components/public-site";
import { valuationCopy } from "@/lib/valuation-request";
import { getCurrentUser } from "@/server/getCurrentUser";

export const metadata: Metadata = {
  title: valuationCopy.title,
  description: valuationCopy.description,
  alternates: { canonical: "/valorar" },
};

const asideIcons = [LineChart, Clock, ShieldCheck];

export default async function ValuationPage() {
  const user = await getCurrentUser();
  const account = user
    ? { name: user.displayName, email: user.email, phone: user.phone }
    : null;

  return (
    <PublicSite>
      <main className="mx-auto grid w-full max-w-[1440px] items-start gap-8 px-5 py-10 sm:gap-12 sm:px-10 sm:py-16 lg:min-h-[calc(100svh-12rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:py-20">
        <div>
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{valuationCopy.kicker}</p>
          <h1 className="releva-page-title mt-3 max-w-3xl">{valuationCopy.heading}</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-public-muted sm:hidden">{valuationCopy.bodyShort}</p>
          <p className="mt-4 hidden max-w-2xl text-[16px] leading-7 text-public-muted sm:mt-6 sm:block sm:text-lg sm:leading-8">
            {valuationCopy.body}
          </p>
          <ValuationRequestForm account={account} />
        </div>
        <aside
          className="rounded-3xl border border-[#e7eaee] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(28,39,64,0.45)] sm:p-8"
          aria-label={valuationCopy.asideTitle}
        >
          <h2 className="text-lg font-semibold text-public-ink">{valuationCopy.asideTitle}</h2>
          <ul className="mt-5 flex flex-col gap-5">
            {valuationCopy.aside.map((item, index) => {
              const Icon = asideIcons[index] ?? LineChart;
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f4] text-[#0f6b62]">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-public-ink">{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-public-muted">{item.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </main>
    </PublicSite>
  );
}
