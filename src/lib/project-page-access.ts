import type { Metadata } from "next";
import { authCopy } from "./auth-copy";
import { catalogCopy } from "./catalog-copy";
import { signInHref } from "./sign-in-return";

export function projectSignInHref(slug: string): string {
  return signInHref(`/proyectos/${slug}`);
}

export function projectDetailMetadata(input: {
  signedIn: boolean;
  project: { slug: string; codename: string; region: string } | null;
}): Metadata {
  if (!input.signedIn) {
    return {
      title: authCopy.signInTitle,
      robots: { index: false, follow: false },
    };
  }

  if (!input.project) {
    return { title: catalogCopy.missingTitle, robots: { index: false, follow: false } };
  }

  return {
    title: input.project.codename,
    description: `${input.project.codename} en ${input.project.region}. Facturación, EBITDA y precio en euros, sin el nombre legal.`,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/proyectos/${input.project.slug}`,
    },
  };
}
