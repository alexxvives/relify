import { PublicSite } from "@/components/public-site";

export function MarketingPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <PublicSite>
      <main className="mx-auto flex min-h-[60vh] max-w-[1200px] flex-col justify-center px-5 py-20">
        <p className="text-xs tracking-[0.2em] text-public-clay uppercase">Relify</p>
        <h1 className="mt-4 max-w-3xl border-l-4 border-public-clay pl-5 text-[2.5rem] leading-[1.02] tracking-tight sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-7 text-public-muted">{description}</p>
      </main>
    </PublicSite>
  );
}
