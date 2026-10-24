import Link from "next/link";
import { catalogCopy } from "@/lib/catalog-copy";
import { formatWholeEur } from "@/lib/money";
import type { PublicProjectCard } from "@/lib/public-project";

export function ProjectFigures({
  project,
  tone = "app",
}: {
  project: PublicProjectCard;
  tone?: "app" | "public";
}) {
  if (tone === "public") {
    return (
      <dl className="grid grid-cols-2 gap-px bg-public-line">
        {catalogCopy.metrics.map((metric) => (
          <div key={metric.key} className="bg-public-card px-3 py-2">
            <dt className="text-xs text-public-muted">{metric.label}</dt>
            <dd className="mt-1 text-sm text-public-ink">{formatWholeEur(project[metric.key])}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-4">
      {catalogCopy.metrics.map((metric) => (
        <div key={metric.key}>
          <dt className="text-xs text-muted-foreground">{metric.label}</dt>
          <dd className="mt-1 text-sm font-medium">{formatWholeEur(project[metric.key])}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProjectCard({ project }: { project: PublicProjectCard }) {
  return (
    <article className="border border-public-ink bg-public-card shadow-public transition hover:-translate-y-0.5">
      <Link href={`/proyectos/${project.slug}`} className="flex flex-col">
        <div className="border-b-4 border-public-clay px-5 py-4">
          <h2 className="font-public text-2xl tracking-tight">{project.codename}</h2>
          <p className="text-sm text-public-muted">{project.region}</p>
        </div>
        <div className="p-5">
          <ProjectFigures project={project} tone="public" />
        </div>
      </Link>
    </article>
  );
}
