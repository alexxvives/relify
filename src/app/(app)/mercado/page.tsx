import { Suspense } from "react";
import { MarketSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { MarketBrowser } from "@/components/investor/market-browser";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { marketCopy } from "@/lib/market-copy";
import { pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";
import { listPublicProjects } from "@/lib/server/list-public-projects";
import { requireRole } from "@/lib/server/require-role";
import { listFavoriteSlugs } from "@/lib/server/toggle-project-favorite";

export function generateMetadata(): Metadata {
  return {
    title: marketCopy.title,
    robots: { index: false, follow: false },
    ...pageSocialMetadata({
      title: marketCopy.title,
      description: marketCopy.title,
      path: "/mercado",
      origin: readSiteUrl(),
    }),
  };
}

async function MarketPageContent() {
  const user = await requireRole("investor");
  const [projects, favoriteSlugs] = await Promise.all([listPublicProjects(), listFavoriteSlugs(user.id)]);

  return (
    <>
      <MarketBrowser projects={projects} favoriteSlugs={favoriteSlugs} heading={marketCopy.title} />
    </>
  );
}

export default function MarketPage() {
  return (
    <SignedInPage title={marketCopy.title} showTitle={false}>
      <Suspense fallback={<MarketSkeleton />}>
        <MarketPageContent />
      </Suspense>
    </SignedInPage>
  );
}
