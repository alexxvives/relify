import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BadgeCheck, Heart, Link2, Lock, MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { InvestorProject } from "@/components/investor-project";
import { ProjectSkeleton } from "@/components/page-skeletons";
import { PublicSite } from "@/components/public-site";
import { ProjectFigures } from "@/components/project-card";
import { catalogCopy } from "@/lib/catalog-copy";
import { spanishDate } from "@/lib/deal-documents";
import { dealPipeline, processFlags, type DealStep } from "@/lib/deal-pipeline";
import { madridToday } from "@/lib/meeting";
import { projectImageSrc } from "@/lib/project-image";
import { sectorImageSrc, type SectorImageKey } from "@/lib/sector-image";
import { otherPublishedProjects } from "@/lib/public-project";
import type { ProjectAccessView } from "@/lib/project-access";
import { getCurrentUser } from "@/server/getCurrentUser";
import { buyerMatchBudget } from "@/server/buyerPlan";
import { getInvestorProject } from "@/server/getInvestorProject";
import { getProjectAccess } from "@/server/getProjectAccess";
import { listFavoriteSlugs } from "@/server/toggleProjectFavorite";
import { listProjectMessages } from "@/server/listProjectMessages";
import { getPublicProject } from "@/server/getPublicProject";
import { listPublicProjects } from "@/server/listPublicProjects";

type ProjectTab = "company" | "questions" | "meetings";

function bannerSteps(access: ProjectAccessView, steps: DealStep[]): DealStep[] {
  if (steps.length > 0) {
    return steps;
  }

  if (access === "none") {
    return [];
  }

  return dealPipeline(
    "investor",
    processFlags({
      accepted: access === "requested" || access === "accepted",
      nda: access === "accepted",
      questions: false,
      meeting: false,
      offer: false,
      loiAccepted: false,
      roomShared: false,
      passedDiligence: false,
      closed: false,
    }),
  );
}

function readTab(value: string | string[] | undefined): ProjectTab {
  const tab = Array.isArray(value) ? value[0] : value;

  if (tab === "company" || tab === "questions" || tab === "meetings") {
    return tab;
  }

  return "company";
}

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

async function InvestorProjectContent({
  user,
  slug,
  tab,
  sold,
  cover,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  slug: string;
  sold: boolean;
  cover: { src: string; ai: boolean } | null;
  tab: string | string[] | undefined;
}) {
  const profile = await getInvestorProject(user, slug);
  if (!profile) {
    notFound();
  }
  const [published, access, favorites, messages, billing] = await Promise.all([
    listPublicProjects(),
    getProjectAccess(user, slug),
    listFavoriteSlugs(user.id),
    listProjectMessages(user, slug),
    buyerMatchBudget(user.id),
  ]);
  if (sold && access === "none") {
    return <SoldNotice codename={profile.codename} />;
  }
  return (
    <InvestorProject
      project={profile}
      recommendations={otherPublishedProjects(published, profile.slug)}
      access={access}
      plan={billing.plan}
      favorited={favorites.includes(profile.slug)}
      messages={messages.threads[0]?.messages ?? []}
      documents={messages.threads[0]?.documents ?? []}
      steps={bannerSteps(access, messages.threads[0]?.steps ?? [])}
      today={madridToday(new Date())}
      partyName={messages.threads[0]?.partyName ?? ""}
      buyerName={user.displayName}
      dateLabel={spanishDate(new Date())}
      matchesLeft={billing.remaining}
      initialTab={readTab(tab)}
      accessId={messages.threads[0]?.accessId ?? ""}
      cover={cover}
    />
  );
}

function bannerImage(project: { slug: string; coverSrc?: string | null; sectorKey?: SectorImageKey }): { src: string; ai: boolean } | null {
  const own = project.coverSrc && project.coverSrc.length > 0 ? project.coverSrc : projectImageSrc(project.slug);
  if (own) return { src: own, ai: false };
  return project.sectorKey ? { src: sectorImageSrc(project.sectorKey), ai: true } : null;
}

function SoldNotice({ codename }: { codename: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-5 py-16 sm:px-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f6ee] px-3 py-1 text-sm font-medium text-[#1b7a45]">
        <BadgeCheck className="size-4" aria-hidden />
        Vendida
      </span>
      <h1 className="text-3xl font-semibold tracking-tight text-[#1c2740]">{codename}</h1>
      <p className="text-base text-[#5c6b78]">
        Esta empresa ya se ha vendido y no acepta nuevas solicitudes. Hay otras empresas disponibles en el mercado.
      </p>
      <Link
        href="/mercado"
        className="inline-flex h-11 items-center rounded-full bg-[#0c7c78] px-5 text-base font-medium text-white hover:bg-[#0a6764] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Ver empresas en venta
      </Link>
    </main>
  );
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: PageProps<"/proyectos/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const project = await getPublicProject(slug);

  if (!project) {
    notFound();
  }

  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  if (user?.role === "investor") {
    return (
      <AppShell title={project.codename} showTitle={false}>
        <Suspense fallback={<ProjectSkeleton />}>
          <InvestorProjectContent user={user} slug={slug} tab={query.tab} sold={project.sold === true} cover={bannerImage(project)} />
        </Suspense>
      </AppShell>
    );
  }

  const signedIn = user !== null;
  if (project.sold) {
    return signedIn ? (
      <AppShell title={project.codename} showTitle={false}>
        <SoldNotice codename={project.codename} />
      </AppShell>
    ) : (
      <PublicSite>
        <SoldNotice codename={project.codename} />
      </PublicSite>
    );
  }
  const listing = (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-16 sm:px-8">
        <section className="border border-public-ink bg-public-card p-6 shadow-public sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-public-muted">{catalogCopy.detailKicker}</p>
              <h1 className="releva-page-title mt-2 text-5xl leading-[0.96] text-public-ink sm:text-6xl">
                {project.codename}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-public-muted">
                <MapPin className="size-4" aria-hidden />
                {project.region}
              </p>
            </div>
            {signedIn ? null : (
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
            )}
          </div>
          <div className="mt-6">
            <ProjectFigures project={project} tone="public" />
          </div>
          {signedIn ? null : <p className="mt-4 text-sm text-public-muted">{catalogCopy.signInToAct}</p>}
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
          {signedIn ? null : (
            <Link
              href="/entrar"
              className="mt-6 inline-flex h-12 items-center gap-2 bg-public-clay px-6 text-base text-public-paper hover:bg-public-clay-deep"
            >
              <Lock className="size-4" aria-hidden />
              Entra y conecta para ver las cifras
            </Link>
          )}
        </section>
      </main>
  );

  if (signedIn) {
    return (
      <AppShell title={project.codename} showTitle={false}>
        <div className="text-public-ink">{listing}</div>
      </AppShell>
    );
  }

  return <PublicSite>{listing}</PublicSite>;
}
