import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog-index";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PublicSite } from "@/components/public-site";
import { blogCopy, blogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: blogCopy.title,
  description: blogCopy.description,
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = [...blogPosts].sort((left, right) => right.date.localeCompare(left.date));

  return (
    <PublicSite>
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-5 py-12 sm:px-8">
        <header>
          <p className="text-xs tracking-[0.2em] text-public-clay uppercase">{blogCopy.kicker}</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-none tracking-tight italic [font-family:var(--public-display)] sm:text-6xl">{blogCopy.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-public-muted">{blogCopy.description}</p>
        </header>
        <BlogIndex posts={posts} />
        <NewsletterSignup />
      </main>
    </PublicSite>
  );
}
