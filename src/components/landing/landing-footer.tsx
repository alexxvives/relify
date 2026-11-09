"use client";

import { ArcScope } from "@/components/arc/arc-scope";
import { SiteFooter } from "@/components/arc/blocks/site-footer/site-footer";
import { subscribeNewsletter } from "@/app/contacto/actions";
import { Logo } from "@/components/logo";
import { landingCopy } from "@/lib/landing-copy";

export function LandingFooter() {
  return (
    <div className="px-5 pt-4 pb-[max(2.5rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))]">
      <ArcScope className="relify-footer mx-auto w-full max-w-[1440px] overflow-hidden rounded-[2rem] bg-public-card shadow-public">
        <SiteFooter
          variant="columns"
          brand={{ name: "Relify", href: "/", mark: <Logo /> }}
          tagline={landingCopy.footer.blurb}
          columns={landingCopy.footer.columns.map((column) => ({ title: column.title, links: column.links.map((link) => ({ ...link })) }))}
          legal={[]}
          socials={[]}
          status={null}
          newsletter={{
            title: "Una nota al mes del diario",
            description: "Guardamos solo tu email para avisarte de notas nuevas.",
            placeholder: "nombre@empresa.es",
            onSubscribe: (email) => subscribeNewsletter(email),
          }}
        />
      </ArcScope>
    </div>
  );
}
