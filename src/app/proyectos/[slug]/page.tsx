import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BadgeCheck, Lock, MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { InvestorProject } from "@/components/investor/investor-project";
import { ProjectSkeleton } from "@/components/shell/page-skeletons";
import { ProjectFigures } from "@/components/investor/project-card";
import { catalogCopy } from "@/lib/catalog-copy";
import { projectDetailMetadata, projectSignInHref } from "@/lib/project-page-access";
import { spanishDate } from "@/lib/deal-documents";
import { dealPipeline, processFlags, type DealStep } from "@/lib/deal-pipeline";
import { madridToday } from "@/lib/meeting";
import { otherPublishedProjects } from "@/lib/public-project";
import type { ProjectAccessView } from "@/lib/project-access";
import { buyerProjectView } from "@/lib/report-veil";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { buyerMatchBudget } from "@/lib/server/buyer-plan";
import { buyerProfileComplete } from "@/lib/server/investor-profile";
import { getInvestorProject } from "@/lib/server/get-investor-project";
import { getBuyerRegistry } from "@/lib/server/sabi-registry";
import { getProjectAccess } from "@/lib/server/get-project-access";
import { listFavoriteSlugs } from "@/lib/server/toggle-project-favorite";
import { listProjectMessages } from "@/lib/server/list-project-messages";
import { listClientContacts } from "@/lib/server/engagement-thread";
import { counterpartyTabIds, readProcessTab } from "@/lib/process-tabs";
import { getPublicProject } from "@/lib/server/get-public-project";
import { listPublicProjects } from "@/lib/server/list-public-projects";
import { recordProjectView } from "@/lib/server/project-views";


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
      closed: false,
    }),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const user = await getCurrentUser();

  if (!user) {
    return projectDetailMetadata({ signedIn: false, project: null });
  }

  const { slug } = await params;
  const project = await getPublicProject(slug);
  return projectDetailMetadata({
    signedIn: true,
    project: project ? { slug: project.slug, codename: project.codename, region: project.region } : null,
  });
}

async function InvestorProjectContent({
  user,
  slug,
  tab,
  sold,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  slug: string;
  sold: boolean;
  tab: string | string[] | undefined;
}) {
  const profile = await getInvestorProject(user, slug);
  if (!profile) {
    notFound();
  }
  const [published, access, favorites, messages, billing, profileComplete, contacts] = await Promise.all([
    // Recorded alongside the reads so the Worker doesn't drop the write after responding.
    recordProjectView(user.id, slug).then(() => listPublicProjects()),
    getProjectAccess(user, slug),
    listFavoriteSlugs(user.id),
    listProjectMessages(user, slug),
    buyerMatchBudget(user.id),
    buyerProfileComplete(user.id, user.email),
    listClientContacts(user),
  ]);
  // S43: the buyer's own advisor thread for this company (listClientContacts only returns the buyer's encargos).
  const advisors = contacts.filter((row) => row.slug === profile.slug);
  if (sold && access === "none") {
    return <SoldNotice codename={profile.codename} />;
  }
  const registry = await getBuyerRegistry(profile.slug, access === "accepted");
  return (
    <InvestorProject
      project={buyerProjectView(profile, access === "accepted")}
      registry={registry}
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
      profileComplete={profileComplete}
      initialTab={readProcessTab(tab, counterpartyTabIds("investor", { advisor: advisors.length > 0 }))}
      advisors={advisors}
      accessId={messages.threads[0]?.accessId ?? ""}
    />
  );
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
  const user = await getCurrentUser();

  if (!user) {
    redirect(projectSignInHref(slug));
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const project = await getPublicProject(slug);

  if (!project) {
    notFound();
  }

  // Sellers manage their own company from Mis procesos (company + buyer card per process);
  // the buyer-facing project page is not meant for the owner.
  if (user?.role === "seller" && (await prisma.project.count({ where: { slug, ownerId: user.id } })) > 0) {
    redirect("/mi-empresa/procesos");
  }

  if (user?.role === "investor") {
    return (
      <AppShell>
        <Suspense fallback={<ProjectSkeleton />}>
          <InvestorProjectContent user={user} slug={slug} tab={query.tab} sold={project.sold === true} />
        </Suspense>
      </AppShell>
    );
  }

  if (project.sold) {
    return (
      <AppShell>
        <SoldNotice codename={project.codename} />
      </AppShell>
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
          </div>
          <div className="mt-6">
            <ProjectFigures project={project} tone="public" />
          </div>
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
  );

  return (
    <AppShell>
      <div className="text-public-ink">{listing}</div>
    </AppShell>
  );
}
