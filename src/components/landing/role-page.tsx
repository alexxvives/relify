import Image from "next/image";
import Link from "next/link";
import { ArcScope } from "@/components/arc/arc-scope";
import { FaqSection } from "@/components/arc/blocks/faq-section/faq-section";
import { ArrowRight, Check, ChartColumn, FileSearch, ShieldCheck } from "lucide-react";
import { PublicSite } from "@/components/public-site";
import { PublishMorph } from "@/components/landing/publish-morph";

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
  /** Empresas only: the stat card shows the ficha going from "lista para publicar" to "publicada". */
  publishMorph?: boolean;
  featuresTitle: string;
  features: { title: string; body: string }[];
  productTitle: string;
  productBody: string;
  stepsTitle: string;
  steps: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  faqIntro?: string;
  closingTitle: string;
};

/**
 * Role landing page (empresas, compradores, asesores). Alex (t32): stronger
 * UI/UX with imagery. Layout: split hero with photo + floating product card,
 * highlights, feature cards, product screenshot band, steps, FAQ and a closing CTA.
 */
export function RolePage(props: RolePageProps) {
  const { kicker, title, lead, photo, photoAlt, image, imageAlt, cta, highlights, stat, publishMorph } = props;
  return (
    <PublicSite>
      <main className="overflow-x-clip bg-public-paper text-public-ink">
        <section className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 pt-8 pb-12 sm:gap-12 sm:px-6 sm:pt-12 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
          <div className="min-w-0">
            <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{kicker}</p>
            <h1 className="releva-page-title mt-4 text-balance sm:mt-5">{title}</h1>
            <p className="mt-4 max-w-xl text-[16px] leading-7 text-public-muted sm:mt-6 sm:text-lg sm:leading-relaxed">{lead}</p>
            <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link
                href={cta.href}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-public-clay px-6 font-medium text-white transition-colors duration-200 hover:bg-public-clay-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay sm:w-auto"
              >
                {cta.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href="#como-funciona" className="inline-flex h-12 w-full items-center justify-center rounded-full border border-public-line bg-white px-6 text-public-ink transition-colors duration-200 hover:border-public-clay sm:w-auto">
                Ver cómo funciona
              </a>
            </div>
            <ul className="mt-6 grid gap-2.5 text-[15px] text-public-ink sm:mt-8">
              {highlights.map((item, index) => (
                <li key={item} className={`flex items-start gap-2.5 ${index > 1 ? "hidden sm:flex" : ""}`}>
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e7f7f4] text-[#0e7c6b]">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-w-0 sm:pb-16">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-public-line bg-white shadow-public sm:aspect-[4/3] sm:rounded-[2rem]">
              <Image src={photo} alt={photoAlt} fill sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" priority />
            </div>
            <div className="absolute -bottom-2 left-4 hidden w-[62%] max-w-[360px] overflow-hidden rounded-2xl border border-public-line bg-white shadow-[0_24px_60px_-28px_rgba(18,52,58,0.55)] sm:left-[-1.5rem] sm:block">
              <Image src={image} alt={imageAlt} width={1440} height={760} sizes="360px" className="h-auto w-full" />
            </div>
            <div className="absolute bottom-3 left-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-[0_16px_40px_-24px_rgba(18,52,58,0.6)] backdrop-blur sm:top-6 sm:right-[-1rem] sm:bottom-auto sm:left-auto">
              <p className="text-2xl font-semibold tracking-tight tabular-nums text-public-ink">{stat.value}</p>
              <p className="text-xs text-public-muted">{stat.label}</p>
              {publishMorph ? <PublishMorph /> : null}
            </div>
          </div>
        </section>

        <section className="border-y border-public-line bg-white">
          <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
            <h2 className="releva-section-title max-w-3xl text-balance">{props.featuresTitle}</h2>
            <div className="mt-6 grid gap-4 sm:mt-10 md:grid-cols-3">
              {props.features.map((feature, index) => {
                const tone = featureTones[index % featureTones.length];
                const Icon = tone.icon;
                return (
                  <article key={feature.title} className="rounded-3xl border border-[#e7eaee] bg-public-paper/40 p-6 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none">
                    <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${tone.chip}`}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-xl leading-tight">{feature.title}</h3>
                    <p className="mt-2.5 hidden leading-7 text-public-muted sm:block">{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-10 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-public-clay uppercase">Dentro de Relify</p>
            <h2 className="releva-section-title mt-2 text-balance sm:mt-3">{props.productTitle}</h2>
            <p className="mt-3 hidden max-w-md text-[16px] leading-7 text-public-muted sm:mt-4 sm:block sm:text-lg sm:leading-relaxed">{props.productBody}</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-public-line bg-white p-2 shadow-public">
            <Image src={image} alt={imageAlt} width={1440} height={760} sizes="(min-width: 1024px) 760px, 100vw" className="h-auto w-full rounded-2xl" />
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 bg-[#12343a] text-white">
          <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
            <p className="text-sm font-medium tracking-[0.16em] text-[#8fd8cf] uppercase">El recorrido</p>
            <h2 className="releva-section-title mt-2 max-w-3xl text-balance text-white sm:mt-3">{props.stepsTitle}</h2>
            <ol className="mt-6 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              {props.steps.map((step, index) => (
                <li key={step.title} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:rounded-3xl sm:p-6">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#2fc4b2] text-sm font-semibold text-[#0f1b24] tabular-nums">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 text-lg sm:mt-5 sm:text-xl">{step.title}</h3>
                  <p className="mt-2 hidden leading-7 text-[#c3d3d6] sm:block">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div id="preguntas" className="scroll-mt-24">
        <ArcScope>
        <FaqSection
          variant="accordion"
          title="Preguntas frecuentes"
          description={props.faqIntro ?? "Lo que más nos preguntan antes de empezar."}
          items={props.faq.map((item) => ({ id: item.q, question: item.q, answer: item.a }))}
          contact={{ label: "¿No encuentras tu respuesta?", description: "Escríbenos desde la página de contacto.", href: "/contacto" }}
          className="releva-faq"
        />
        </ArcScope>
        </div>

        <section className="px-5 pb-12 sm:px-6 sm:pb-20 lg:px-8">
          <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[1.5rem] bg-[#12343a] sm:rounded-[2rem]">
            <Image src={photo} alt="" fill sizes="1280px" className="object-cover opacity-25" />
            <div className="relative flex flex-col items-stretch gap-5 px-5 py-10 sm:items-start sm:gap-6 sm:px-12 sm:py-14 md:flex-row md:items-center md:justify-between">
              <h2 className="releva-section-title max-w-xl text-balance text-white">{props.closingTitle}</h2>
              <Link href={cta.href} className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 font-medium text-[#12343a] transition-colors duration-200 hover:bg-[#e5eef0] md:w-auto">
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
