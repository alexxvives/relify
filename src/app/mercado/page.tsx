import { Suspense } from "react";
import { MarketSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { MarketBrowser } from "@/components/market-browser";
import { SignedInPage } from "@/components/signed-in-page";
import { marketCopy } from "@/lib/market-copy";
import { listPublicProjects } from "@/server/listPublicProjects";
import { requireRole } from "@/server/requireRole";
import { listFavoriteSlugs } from "@/server/toggleProjectFavorite";
import { listHiddenSlugs } from "@/server/toggleProjectHidden";

export const metadata: Metadata = {
  title: marketCopy.title,
  robots: { index: false, follow: false },
};

async function MarketPageContent() {
  const user = await requireRole("investor");
  const [projects, favoriteSlugs, hiddenSlugs] = await Promise.all([listPublicProjects(), listFavoriteSlugs(user.id), listHiddenSlugs(user.id)]);

  return (
    <>
      <MarketBrowser projects={projects} favoriteSlugs={favoriteSlugs} hiddenSlugs={hiddenSlugs} heading={marketCopy.title} />
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
