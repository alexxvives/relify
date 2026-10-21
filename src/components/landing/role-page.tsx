import Image from "next/image";
import Link from "next/link";
import { ChartColumn, FileSearch, MessagesSquare, ShieldCheck } from "lucide-react";
import { PublicSite } from "@/components/public-site";

const featureTones = [
  {
    icon: FileSearch,
    className: "bg-[#e7f7f4] text-[#0e7c6b]",
    card: "border-[#b7e4dc] bg-[#f3fbf9]",
  },
  {
    icon: ChartColumn,
    className: "bg-[#fff1e6] text-[#b8612d]",
    card: "border-[#f0d0b8] bg-[#fff8f3]",
  },
  {
    icon: ShieldCheck,
    className: "bg-[#eef1fb] text-[#465ab4]",
    card: "border-[#d5dcf3] bg-[#f7f8fd]",
  },
] as const;

const stepTones = ["bg-[#16324f]", "bg-[#0e7c6b]", "bg-[#b8612d]", "bg-[#465ab4]"] as const;

export function RolePage({
  kicker,
  title,
  lead,
  image,
  imageAlt,
  featuresTitle,
  features,
  stepsTitle,
  steps,
  showcase = false,
}: {
  kicker: string;
  title: string;
  lead: string;
  image: string;
  imageAlt: string;
  featuresTitle: string;
  features: { title: string; body: string }[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
  showcase?: boolean;
}) {
  return (
    <PublicSite>
      <main className="bg-public-paper text-public-ink">
        <section className={showcase ? "mx-auto grid max-w-[1440px] items-center gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:px-10 lg:py-20" : "mx-auto grid max-w-[1180px] items-center gap-12 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:py-24"}>
          <div>
            <p className="text-sm text-public-clay">{kicker}</p>
            <h1 className="releva-page-title mt-3 text-4xl leading-[1.05] md:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-public-muted">{lead}</p>
            <Link href={showcase ? "/registro?rol=empresa" : "/lista-de-espera"} className="mt-8 inline-flex h-12 items-center rounded-full bg-public-ink px-6 text-white">
              {showcase ? "Crear cuenta de empresa" : "Apuntarme"}
            </Link>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-public-line bg-white shadow-public">
            <Image src={image} alt={imageAlt} width={1440} height={760} className="h-auto w-full" priority />
          </div>
        </section>

        {showcase ? (
          <SellerPanels featuresTitle={featuresTitle} features={features} stepsTitle={stepsTitle} steps={steps} />
        ) : (
          <>
            <section className="border-y border-public-line bg-white">
              <div className="mx-auto max-w-[1180px] px-6 py-16">
                <h2 className="max-w-xl text-3xl leading-[1.05] font-medium tracking-tight md:text-4xl">
                  {featuresTitle}
                </h2>
                <div className="mt-10 grid gap-8 md:grid-cols-3">
                  {features.map((feature) => (
                    <article key={feature.title} className="border-t border-public-line pt-5">
                      <h3 className="text-lg">{feature.title}</h3>
                      <p className="mt-2 leading-relaxed text-public-muted">{feature.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
            <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-24">
              <h2 className="text-3xl leading-[1.05] font-medium tracking-tight md:text-4xl">
                {stepsTitle}
              </h2>
              <ol className="mt-10 grid gap-6 md:grid-cols-2">
                {steps.map((step, index) => (
                  <li key={step.title} className="rounded-[1.5rem] border border-public-line bg-white p-6">
                    <p className="text-3xl font-medium tracking-tight text-public-clay">
                      0{index + 1}
                    </p>
                    <h3 className="mt-3 text-xl">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-public-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </main>
    </PublicSite>
  );
}

function SellerPanels({
  featuresTitle,
  features,
  stepsTitle,
  steps,
}: {
  featuresTitle: string;
  features: { title: string; body: string }[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
}) {
  return (
    <>
      <section className="border-y border-public-line bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10 lg:py-20">
          <p className="text-sm font-medium tracking-[0.16em] text-[#0e7c6b] uppercase">En un solo panel</p>
          <h2 className="mt-3 max-w-3xl text-3xl leading-[1.05] font-medium tracking-tight md:text-5xl">
            {featuresTitle}
          </h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {features.map((feature, index) => {
              const tone = featureTones[index] ?? featureTones[0];
              const Icon = tone.icon;
              return (
                <article
                  key={feature.title}
                  className={`releva-seller-card rounded-[1.75rem] border p-6 shadow-[0_18px_40px_-32px_rgba(22,50,79,0.45)] transition duration-300 hover:-translate-y-1 ${tone.card}`}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${tone.className}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-2xl leading-tight">{feature.title}</h3>
                  <p className="mt-3 text-base leading-7 text-public-muted">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-6 py-16 md:py-24 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-public-clay uppercase">El recorrido</p>
            <h2 className="mt-3 max-w-3xl text-3xl leading-[1.05] font-medium tracking-tight md:text-5xl">
              {stepsTitle}
            </h2>
          </div>
          <MessagesSquare className="size-8 text-[#465ab4]" aria-hidden />
        </div>
        <ol className="relative mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="releva-seller-card relative overflow-hidden rounded-[1.75rem] border border-public-line bg-white p-6"
              style={{ animationDelay: `${180 + index * 90}ms` }}
            >
              <span className={`inline-flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white ${stepTones[index] ?? stepTones[0]}`}>
                0{index + 1}
              </span>
              <h3 className="mt-5 text-xl">{step.title}</h3>
              <p className="mt-2 leading-7 text-public-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
