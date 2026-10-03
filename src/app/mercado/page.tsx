import type { Metadata } from "next";
import { MarketBrowser } from "@/components/market-browser";
import { SignedInPage } from "@/components/signed-in-page";
import { marketCopy } from "@/lib/market-copy";
import { listPublicProjects } from "@/server/listPublicProjects";
import { requireRole } from "@/server/requireRole";
import { listFavoriteSlugs } from "@/server/toggleProjectFavorite";

export const metadata: Metadata = {
  title: marketCopy.title,
  robots: { index: false, follow: false },
};

export default async function MarketPage() {
  const user = await requireRole("investor");
  const [projects, favoriteSlugs] = await Promise.all([listPublicProjects(), listFavoriteSlugs(user.id)]);

  return (
    <SignedInPage title={marketCopy.title}>
      <MarketBrowser projects={projects} favoriteSlugs={favoriteSlugs} />
    </SignedInPage>
  );
}
