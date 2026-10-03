import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Link2, Lock, MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CatalogHeader } from "@/components/catalog-header";
import { InvestorProject } from "@/components/investor-project";
import { ProjectFigures } from "@/components/project-card";
import { catalogCopy } from "@/lib/catalog-copy";
import { otherPublishedProjects } from "@/lib/public-project";
import { getCurrentUser } from "@/server/getCurrentUser";
import { getInvestorProject } from "@/server/getInvestorProject";
import { getProjectAccess } from "@/server/getProjectAccess";
import { listFavoriteSlugs } from "@/server/toggleProjectFavorite";
import { getPublicProject } from "@/server/getPublicProject";
import { listPublicProjects } from "@/server/listPublicProjects";

export async function generateMetadata({
  params,
}: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) {
    return { title: catalogCopy.missingTitle };
  }

  const description = `${project.codename} en ${project.region}. Facturación, EBITDA y precio en euros, sin el nombre legal.`;

  return {
    title: project.codename,
    description,
    alternates: {
      canonical: `/proyectos/${project.slug}`,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps<"/proyectos/[slug]">) {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) {
    notFound();
  }

  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  if (user?.role === "investor") {
    const profile = await getInvestorProject(user, slug);
    if (!profile) {
      notFound();
    }
    const [published, access, favorites] = await Promise.all([
      listPublicProjects(),
      getProjectAccess(user, slug),
      listFavoriteSlugs(user.id),
    ]);
    return (
      <AppShell title={profile.codename}>
        <InvestorProject
          project={profile}
          recommendations={otherPublishedProjects(published, profile.slug)}
          access={access}
          favorited={favorites.includes(profile.slug)}
        />
      </AppShell>
    );
  }

  return (
    <div className="min-h-full bg-public-paper font-public text-public-ink">
      <CatalogHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <section className="border border-public-ink bg-public-card p-6 shadow-public sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl tracking-tight sm:text-5xl">{project.codename}</h1>
              <p className="mt-2 flex items-center gap-2 text-public-muted">
                <MapPin className="size-4" aria-hidden />
                {project.region}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/entrar"
                aria-label={catalogCopy.saveCompany}
                className="inline-flex size-11 items-center justify-center border border-public-ink text-public-ink hover:bg-public-sand"
              >
                <Heart className="size-4" aria-hidden />
              </Link>
              <Link
                href="/entrar"
                className="inline-flex h-11 items-center gap-2 bg-public-clay px-4 text-sm text-public-paper hover:bg-public-clay-deep"
              >
                <Link2 className="size-4" aria-hidden />
                {catalogCopy.connect}
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <ProjectFigures project={project} tone="public" />
          </div>
          <p className="mt-4 text-sm text-public-muted">{catalogCopy.signInToAct}</p>
        </section>
        <section aria-labelledby="cifras-bloqueadas">
          <h2 id="cifras-bloqueadas" className="flex items-center gap-2 text-2xl tracking-tight">
            <Lock className="size-5 text-public-clay" aria-hidden />
            {catalogCopy.detailLockedHeading}
          </h2>
          <p className="mt-3 text-public-muted">{catalogCopy.detailLockedNote}</p>
          <dl className="mt-6 divide-y divide-public-line border border-public-ink bg-public-card">
            {project.lockedFinancials.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <dt className="text-sm">{item.label}</dt>
                <dd className="inline-flex items-center gap-2 text-sm text-public-muted">
                  <Lock className="size-3.5" aria-hidden />
                  {catalogCopy.lockedLabel}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
