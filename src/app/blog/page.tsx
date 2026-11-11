import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog-index";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PublicSite } from "@/components/public-site";
import { blogCopy, blogPosts } from "@/lib/blog";
import { readSiteUrl } from "@/lib/env";
import { pageSocialMetadata } from "@/lib/seo-head";

export function generateMetadata(): Metadata {
  return {
    title: blogCopy.title,
    description: blogCopy.description,
    ...pageSocialMetadata({
      title: blogCopy.title,
      description: blogCopy.description,
      path: "/blog",
      origin: readSiteUrl(),
    }),
  };
}

export default function BlogPage() {
  const posts = [...blogPosts].sort((left, right) => right.date.localeCompare(left.date));

  return (
    <PublicSite>
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-8 sm:gap-10 sm:px-8 sm:py-12">
        <header>
          <p className="text-xs tracking-[0.2em] text-public-clay uppercase">{blogCopy.kicker}</p>
          <h1 className="releva-page-title mt-3 max-w-3xl">{blogCopy.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-public-muted sm:mt-4">{blogCopy.description}</p>
        </header>
        <BlogIndex posts={posts} />
        <NewsletterSignup />
      </main>
    </PublicSite>
  );
}
