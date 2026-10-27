import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChartColumn, FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import { PublicSite } from "@/components/public-site";
import { AiImageTag } from "@/components/project-photo";
import { shellCopy } from "@/lib/shell";

const featureTones = [
  { icon: FileSearch, chip: "bg-[#e7f7f4] text-[#0e7c6b]" },
  { icon: ChartColumn, chip: "bg-[#fff1e6] text-[#b8612d]" },
  { icon: ShieldCheck, chip: "bg-[#eef1fb] text-[#465ab4]" },
] as const;

export type RolePageProps = {
  kicker: string;
  title: string;
  lead: string;
  /** Editorial photo (AI-generated, in /public/roles). */
  photo: string;
  photoAlt: string;
  /** Real product screenshot (in /public/product). */
  image: string;
  imageAlt: string;
  cta: { href: string; label: string };
  highlights: string[];
  stat: { value: string; label: string };
  featuresTitle: string;
  features: { title: string; body: string }[];
  productTitle: string;
  productBody: string;
  stepsTitle: string;
  steps: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  closingTitle: string;
};

/**
 * Role landing page (empresas, compradores, asesores). Alex (t32): stronger
 * UI/UX with imagery. Layout: split hero with photo + floating product card,
 * highlights, feature cards, product screenshot band, steps, FAQ and a closing CTA.
 */
export function RolePage(props: RolePageProps) {
  const { kicker, title, lead, photo, photoAlt, image, imageAlt, cta, highlights, stat } = props;
  return (
    <PublicSite>
      <main className="overflow-x-clip bg-public-paper text-public-ink">
        <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 pt-12 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-public-line bg-white/70 px-3 py-1 text-sm text-public-clay">
              <Sparkles className="size-4" aria-hidden />
              {kicker}
            </p>
            <h1 className="releva-page-title mt-5 text-[2.5rem] leading-[1.04] text-balance sm:text-5xl xl:text-6xl">{title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-public-muted">{lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={cta.href}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 font-medium text-white transition-colors duration-200 hover:bg-public-clay-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
              >
                {cta.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href="#como-funciona" className="inline-flex h-12 items-center rounded-full border border-public-line bg-white px-6 text-public-ink transition-colors duration-200 hover:border-public-clay">
                Ver cómo funciona
              </a>
            </div>
            <ul className="mt-8 grid gap-2.5 text-[15px] text-public-ink">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e7f7f4] text-[#0e7c6b]">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-w-0 sm:pb-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-public-line bg-white shadow-public">
              <Image src={photo} alt={photoAlt} fill sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" priority />
              <AiImageTag />
            </div>
            <div className="absolute -bottom-2 left-4 hidden w-[62%] max-w-[360px] overflow-hidden rounded-2xl border border-public-line bg-white shadow-[0_24px_60px_-28px_rgba(18,52,58,0.55)] sm:left-[-1.5rem] sm:block">
              <Image src={image} alt={imageAlt} width={1440} height={760} sizes="360px" className="h-auto w-full" />
            </div>
            <div className="absolute bottom-3 left-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-[0_16px_40px_-24px_rgba(18,52,58,0.6)] backdrop-blur sm:top-6 sm:right-[-1rem] sm:bottom-auto sm:left-auto">
              <p className="text-2xl font-semibold tracking-tight tabular-nums text-public-ink">{stat.value}</p>
              <p className="text-xs text-public-muted">{stat.label}</p>
            </div>
          </div>
        </section>

        <section className="border-y border-public-line bg-white">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
            <h2 className="max-w-3xl text-3xl leading-[1.08] font-medium tracking-tight text-balance md:text-[2.75rem]">{props.featuresTitle}</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {props.features.map((feature, index) => {
                const tone = featureTones[index % featureTones.length];
                const Icon = tone.icon;
                return (
                  <article key={feature.title} className="rounded-3xl border border-[#e7eaee] bg-public-paper/40 p-6 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none">
                    <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${tone.chip}`}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-xl leading-tight">{feature.title}</h3>
                    <p className="mt-2.5 leading-7 text-public-muted">{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-public-clay uppercase">Dentro de Relify</p>
            <h2 className="mt-3 text-3xl leading-[1.08] font-medium tracking-tight text-balance md:text-4xl">{props.productTitle}</h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-public-muted">{props.productBody}</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-public-line bg-white p-2 shadow-public">
            <Image src={image} alt={imageAlt} width={1440} height={760} sizes="(min-width: 1024px) 760px, 100vw" className="h-auto w-full rounded-2xl" />
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 bg-[#12343a] text-white">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
            <p className="text-sm font-medium tracking-[0.16em] text-[#8fd8cf] uppercase">El recorrido</p>
            <h2 className="mt-3 max-w-3xl text-3xl leading-[1.08] font-medium tracking-tight text-balance md:text-[2.75rem]">{props.stepsTitle}</h2>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {props.steps.map((step, index) => (
                <li key={step.title} className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#2fc4b2] text-sm font-semibold text-[#0f1b24] tabular-nums">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl">{step.title}</h3>
                  <p className="mt-2 leading-7 text-[#c3d3d6]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:px-8 lg:py-24">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-medium tracking-wide text-public-clay uppercase">FAQ</p>
            <h2 className="mt-3 text-3xl leading-[1.08] font-medium tracking-tight md:text-4xl">Preguntas frecuentes</h2>
            <p className="mt-4 max-w-sm leading-7 text-public-muted">
              ¿No encuentras tu respuesta? Escríbenos a{" "}
              <a href={shellCopy.helpEmailHref} className="font-medium text-public-ink underline decoration-public-line underline-offset-4 hover:decoration-public-clay">
                {shellCopy.helpEmail}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {props.faq.map((item, index) => (
              <details
                key={item.q}
                open={index === 0}
                className="group rounded-2xl border border-public-line bg-white px-6 py-4 transition-colors duration-200 open:border-public-clay/40 open:shadow-[0_16px_40px_-32px_rgba(18,52,58,0.45)]"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-public-sand text-xl leading-none text-public-clay transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-2xl pb-1 leading-7 text-public-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] bg-[#12343a]">
            <Image src={photo} alt="" fill sizes="1280px" className="object-cover opacity-25" />
            <div className="relative flex flex-col items-start gap-6 px-6 py-14 sm:px-12 md:flex-row md:items-center md:justify-between">
              <h2 className="max-w-xl text-3xl leading-[1.1] font-medium tracking-tight text-balance text-white md:text-4xl">{props.closingTitle}</h2>
              <Link href={cta.href} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 font-medium text-[#12343a] transition-colors duration-200 hover:bg-[#e5eef0]">
                {cta.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicSite>
  );
}
