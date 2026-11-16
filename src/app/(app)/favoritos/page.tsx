import { Suspense } from "react";
import { MarketSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { MarketBrowser } from "@/components/investor/market-browser";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { WorkspaceNote } from "@/components/shell/workspace-note";
import { investorCopy } from "@/lib/investor-copy";
import { listPublicProjects } from "@/lib/server/list-public-projects";
import { requireRole } from "@/lib/server/require-role";
import { listFavoriteSlugs } from "@/lib/server/toggle-project-favorite";

export const metadata: Metadata = {
  title: investorCopy.favoritesTitle,
  robots: { index: false, follow: false },
};

async function FavoritesPageContent() {
  const user = await requireRole("investor");
  const [projects, favoriteSlugs] = await Promise.all([listPublicProjects(), listFavoriteSlugs(user.id)]);
  const favorites = projects.filter((project) => favoriteSlugs.includes(project.slug));

  return (
    <>
      {favorites.length === 0 ? (
        <WorkspaceNote title={investorCopy.favoritesEmpty} body={investorCopy.favoritesEmptyBody} />
      ) : (
        <MarketBrowser projects={favorites} favoriteSlugs={favoriteSlugs} onlyFavorites />
      )}
    </>
  );
}

export default function FavoritesPage() {
  return (
    <SignedInPage title={investorCopy.favoritesTitle}>
      <Suspense fallback={<MarketSkeleton heading={false} />}>
        <FavoritesPageContent />
      </Suspense>
    </SignedInPage>
  );
}
