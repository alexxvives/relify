import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Link2, Lock, MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdvisoryPicker } from "@/components/advisory-picker";
import { InvestorProject } from "@/components/investor-project";
import { PublicSite } from "@/components/public-site";
import { ProjectFigures } from "@/components/project-card";
import { catalogCopy } from "@/lib/catalog-copy";
import { spanishDate } from "@/lib/deal-documents";
import { dealPipeline, processFlags, type DealStep } from "@/lib/deal-pipeline";
import { madridToday } from "@/lib/meeting";
import { otherPublishedProjects } from "@/lib/public-project";
import type { ProjectAccessView } from "@/lib/project-access";
import { getCurrentUser } from "@/server/getCurrentUser";
import { buyerMatchBudget } from "@/server/buyerPlan";
import { getInvestorProject } from "@/server/getInvestorProject";
import { getProjectAccess } from "@/server/getProjectAccess";
import { listFavoriteSlugs } from "@/server/toggleProjectFavorite";
import { listProjectMessages } from "@/server/listProjectMessages";
import { getPublicProject } from "@/server/getPublicProject";
import { listPublicAdvisors } from "@/server/listPublicAdvisors";
import { listPublicProjects } from "@/server/listPublicProjects";
import { advisoryCopy } from "@/lib/advisory";

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
      roomShared: false,
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
    const profile = await getInvestorProject(user, slug);
    if (!profile) {
      notFound();
    }
    const [published, access, favorites, messages, billing, advisors] = await Promise.all([
      listPublicProjects(),
      getProjectAccess(user, slug),
      listFavoriteSlugs(user.id),
      listProjectMessages(user, slug),
      buyerMatchBudget(user.id),
      listPublicAdvisors(),
    ]);
    return (
      <AppShell title={profile.codename} showTitle={false}>
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
          initialTab={readTab(query.tab)}
        />
        <section className="mt-8 rounded-2xl border border-[#e7eaee] bg-white p-6">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisoryCopy.heading}</h2>
          <p className="mt-1 text-sm text-[#64748b]">{advisoryCopy.intro}</p>
          <AdvisoryPicker layout="cards" advisors={advisors} projectSlug={profile.slug} />
        </section>
      </AppShell>
    );
  }

  return (
    <PublicSite>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-16 sm:px-8">
        <section className="border border-public-ink bg-public-card p-6 shadow-public sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.28em] text-public-muted uppercase">{catalogCopy.detailKicker}</p>
              <h1 className="mt-2 text-5xl leading-none tracking-tight text-public-ink italic [font-family:var(--public-display)] sm:text-6xl">
                {project.codename}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-public-muted">
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
    </PublicSite>
  );
}
