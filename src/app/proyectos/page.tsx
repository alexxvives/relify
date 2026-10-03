import type { Metadata } from "next";
import { CatalogHeader } from "@/components/catalog-header";
import { ProjectCard } from "@/components/project-card";
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
    <div className="min-h-full bg-public-paper font-public text-public-ink">
      <CatalogHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="flex max-w-2xl flex-col gap-3 border-l-4 border-public-clay pl-5">
          <h1 className="text-4xl tracking-tight sm:text-5xl">{catalogCopy.indexTitle}</h1>
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
    </div>
  );
}
