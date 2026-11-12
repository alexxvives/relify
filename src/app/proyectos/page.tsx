import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProjectCard } from "@/components/investor/project-card";
import { PublicSite } from "@/components/landing/public-site";
import { authCopy } from "@/lib/auth-copy";
import { catalogCopy } from "@/lib/catalog-copy";
import { signInHref } from "@/lib/sign-in-return";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { listPublicProjects } from "@/lib/server/list-public-projects";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      title: authCopy.signInTitle,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: catalogCopy.indexTitle,
    description: catalogCopy.indexDescription,
    alternates: {
      canonical: "/proyectos",
    },
    robots: { index: false, follow: false },
  };
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(signInHref("/proyectos"));
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const projects = await listPublicProjects();

  return (
    <PublicSite>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 py-16 sm:px-8">
        <div className="flex max-w-2xl flex-col gap-3 border-l-4 border-public-clay pl-5">
          <h1 className="releva-page-title text-4xl leading-[0.96] sm:text-5xl">{catalogCopy.indexTitle}</h1>
          <p className="text-lg leading-8 text-public-muted">{catalogCopy.indexIntro}</p>
        </div>
        {projects.length === 0 ? (
          <p className="text-public-muted">{catalogCopy.empty}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </main>
    </PublicSite>
  );
}
