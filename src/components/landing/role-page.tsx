import Image from "next/image";
import Link from "next/link";
import { PublicSite } from "@/components/public-site";

export function RolePage({
  title,
  image,
  imageAlt,
  role,
  lead,
  steps,
  closeTitle,
  closeBody,
  points,
  cta,
  href,
}: {
  title: string;
  image: string;
  imageAlt: string;
  role: string;
  lead: string;
  steps: { title: string; body: string }[];
  closeTitle: string;
  closeBody: string;
  points: string[];
  cta: string;
  href: string;
}) {
  return (
    <PublicSite>
      <main className="bg-public-paper text-public-ink">
        <section className="mx-auto grid max-w-[1100px] items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem]">
            <Image src={image} alt={imageAlt} fill className="object-cover" sizes="(min-width: 768px) 520px, 100vw" priority />
          </div>
          <div>
            <p className="text-sm text-public-clay">{role}</p>
            <h1 className="mt-3 text-4xl leading-tight md:text-5xl" style={{ fontFamily: "var(--public-display)" }}>
              {title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-public-muted">{lead}</p>
          </div>
        </section>

        <section className="border-y border-public-line bg-white">
          <div className="mx-auto grid max-w-[1100px] gap-8 px-6 py-16 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title}>
                <p className="text-4xl text-public-clay" style={{ fontFamily: "var(--public-display)" }}>
                  0{index + 1}
                </p>
                <h2 className="mt-3 text-xl">{step.title}</h2>
                <p className="mt-2 leading-relaxed text-public-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-[1100px] items-center gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--public-display)" }}>
              {closeTitle}
            </h2>
            <p className="mt-4 leading-relaxed text-public-muted">{closeBody}</p>
            <ul className="mt-6 space-y-2">
              {points.map((point) => (
                <li key={point} className="border-l-2 border-public-clay pl-4">
                  {point}
                </li>
              ))}
            </ul>
            <Link href={href} className="mt-8 inline-flex h-12 items-center rounded-full bg-public-ink px-6 text-white">
              {cta}
            </Link>
          </div>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-center gap-4 rounded-2xl border border-public-line bg-white px-4 py-4">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-public-sand text-public-clay"
                  style={{ fontFamily: "var(--public-display)" }}
                >
                  {index + 1}
                </span>
                <span>{step.title}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </PublicSite>
  );
}
