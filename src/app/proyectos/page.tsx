import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { PublicSite } from "@/components/public-site";
import { catalogCopy } from "@/lib/catalog-copy";
import { listPublicProjects } from "@/server/listPublicProjects";

export const metadata: Metadata = {
  title: catalogCopy.indexTitle,
  description: catalogCopy.indexDescription,
  alternates: {
    canonical: "/proyectos",
  },
};

export default async function ProjectsPage() {
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
