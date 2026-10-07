import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PublicSite } from "@/components/public-site";
import { blogCopy, blogPost, blogPosts, formatBlogDate } from "@/lib/blog";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPost(slug);

  if (!post) {
    return { title: blogCopy.title };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = blogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <PublicSite>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8">
        <Link href="/blog" className="text-sm font-medium text-public-clay hover:underline">
          {blogCopy.back}
        </Link>
        <header>
          <p className="text-xs tracking-[0.16em] text-public-clay uppercase">
            {post.category} · {formatBlogDate(post.date)} · {post.readTime} {blogCopy.minutes}
          </p>
          <h1 className="mt-3 text-5xl leading-none tracking-tight italic [font-family:var(--public-display)]">{post.title}</h1>
          <p className="mt-4 text-lg leading-7 text-public-muted">{post.excerpt}</p>
        </header>
        <div className="flex flex-col gap-4 text-base leading-7">
          {post.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <NewsletterSignup />
      </main>
    </PublicSite>
  );
}
