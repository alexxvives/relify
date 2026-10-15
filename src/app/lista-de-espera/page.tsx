import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";
import { WaitlistForm, WaitlistSeats } from "@/components/landing/waitlist-form";
import { waitlistCopy } from "@/lib/waitlist";

export const metadata: Metadata = {
  title: waitlistCopy.title,
  description: waitlistCopy.description,
  alternates: { canonical: "/lista-de-espera" },
  openGraph: {
    title: waitlistCopy.title,
    description: waitlistCopy.description,
    url: "/lista-de-espera",
    locale: "es_ES",
    type: "website",
  },
};

export default function WaitlistPage() {
  return (
    <PublicSite>
      <main className="px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto grid w-full max-w-[1440px] items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <div>
            <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{waitlistCopy.kicker}</p>
            <h1 className="mt-3 max-w-3xl text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">{waitlistCopy.heading}</h1>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-public-muted">{waitlistCopy.body}</p>
            <section className="mt-10 rounded-[2rem] bg-public-ink px-6 py-8 text-white sm:px-8" aria-labelledby="sala-titulo">
              <h2 id="sala-titulo" className="text-2xl tracking-tight">
                {waitlistCopy.seatsTitle}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/70">{waitlistCopy.seatsBody}</p>
              <WaitlistSeats />
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {waitlistCopy.roles.map((item) => (
                  <li key={item.id} className="rounded-2xl bg-white/8 px-4 py-4">
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-white/70">{item.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <WaitlistForm />
        </div>
      </main>
    </PublicSite>
  );
}
