import { PublicSite } from "@/components/landing/public-site";

export function MarketingPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <PublicSite>
      <main className="mx-auto flex min-h-[50vh] max-w-[1200px] flex-col justify-center px-5 py-12 sm:min-h-[60vh] sm:py-20">
        <p className="text-xs tracking-[0.2em] text-public-clay uppercase">Relify</p>
        <h1 className="releva-page-title mt-4 max-w-3xl border-l-4 border-public-clay pl-5">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-7 text-public-muted sm:mt-6">{description}</p>
      </main>
    </PublicSite>
  );
}
