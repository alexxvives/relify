import type { Metadata } from "next";
import { AdvisoryPicker } from "@/components/advisory-picker";
import { SignedInPage } from "@/components/signed-in-page";
import { advisoryCopy } from "@/lib/advisory";
import { listPublicAdvisors } from "@/server/listPublicAdvisors";
import { listPublicProjects } from "@/server/listPublicProjects";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisoryCopy.title,
  robots: { index: false, follow: false },
};

export default async function AdvisoryPage() {
  await requireRole("investor");
  const [advisors, projects] = await Promise.all([listPublicAdvisors(), listPublicProjects()]);

  return (
    <SignedInPage title={advisoryCopy.title}>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-6">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisoryCopy.heading}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisoryCopy.intro}</p>
        <AdvisoryPicker
          layout="cards"
          advisors={advisors}
          companies={projects.map((project) => ({ slug: project.slug, codename: project.codename, region: project.region }))}
        />
      </section>
    </SignedInPage>
  );
}
