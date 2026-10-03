import type { Metadata } from "next";
import { MarketBrowser } from "@/components/market-browser";
import { SignedInPage } from "@/components/signed-in-page";
import { WorkspaceNote } from "@/components/workspace-note";
import { investorCopy } from "@/lib/investor-copy";
import { listPublicProjects } from "@/server/listPublicProjects";
import { requireRole } from "@/server/requireRole";
import { listFavoriteSlugs } from "@/server/toggleProjectFavorite";

export const metadata: Metadata = {
  title: investorCopy.favoritesTitle,
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await requireRole("investor");
  const [projects, favoriteSlugs] = await Promise.all([listPublicProjects(), listFavoriteSlugs(user.id)]);
  const favorites = projects.filter((project) => favoriteSlugs.includes(project.slug));

  return (
    <SignedInPage title={investorCopy.favoritesTitle}>
      {favorites.length === 0 ? (
        <WorkspaceNote title={investorCopy.favoritesEmpty} body={investorCopy.favoritesEmptyBody} />
      ) : (
        <MarketBrowser projects={favorites} favoriteSlugs={favoriteSlugs} />
      )}
    </SignedInPage>
  );
}
