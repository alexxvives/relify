import Image from "next/image";
import Link from "next/link";
import { PublicSite } from "@/components/public-site";

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
}) {
  return (
    <PublicSite>
      <main className="bg-public-paper text-public-ink">
        <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:py-24">
          <div>
            <p className="text-sm text-public-clay">{kicker}</p>
            <h1 className="releva-page-title mt-3 text-4xl leading-[1.05] md:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-public-muted">{lead}</p>
            <Link href="/lista-de-espera" className="mt-8 inline-flex h-12 items-center rounded-full bg-public-ink px-6 text-white">
              Apuntarme
            </Link>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-public-line bg-white shadow-public">
            <Image src={image} alt={imageAlt} width={1440} height={760} className="h-auto w-full" priority />
          </div>
        </section>

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
      </main>
    </PublicSite>
  );
}
