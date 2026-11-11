import { PublicSite } from "@/components/public-site";

export function LegalDoc({
  kicker,
  title,
  lead,
  updated,
  sections,
}: {
  kicker: string;
  title: string;
  lead: string;
  updated: string;
  sections: readonly { title: string; body: readonly string[] }[];
}) {
  return (
    <PublicSite>
      <main>
        <section className="bg-gradient-to-b from-[#dceff0] to-transparent text-[#12343a]">
          <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 pb-10 sm:px-8 sm:pt-16 sm:pb-16">
            <p className="text-sm font-semibold tracking-[0.14em] text-[#2f939b] uppercase">{kicker}</p>
            <h1 className="releva-page-title mt-3 max-w-3xl text-balance">{title}</h1>
            <p className="mt-4 max-w-2xl text-pretty text-[16px] leading-7 text-[#12343a]/75 sm:text-lg">{lead}</p>
            <p className="mt-3 text-sm text-[#12343a]/60">{updated}</p>
          </div>
        </section>
        <section className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 py-12 sm:px-8 lg:grid-cols-2">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className={`rounded-3xl border border-public-line bg-white p-6 shadow-public ${index === sections.length - 1 && sections.length % 2 === 1 ? "lg:col-span-2" : ""}`}
            >
              <h2 className="text-xl font-semibold text-public-ink">{section.title}</h2>
              <div className="mt-3 grid gap-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[16px] leading-7 text-public-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </PublicSite>
  );
}
