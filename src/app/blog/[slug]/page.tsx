import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogProse } from "@/components/public/blog-prose";
import { NewsletterSignup } from "@/components/public/newsletter-signup";
import { PublicSite } from "@/components/landing/public-site";
import { blogCopy, blogPost, blogPosts, formatBlogDate } from "@/lib/blog";
import { readSiteUrl } from "@/lib/env";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPost(slug);

  if (!post) {
    return { title: blogCopy.title };
  }

  const origin = readSiteUrl();
  const url = new URL(`/blog/${post.slug}`, origin).href;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      locale: "es_ES",
      images: [{ url: new URL(post.cover.src, origin).href, alt: post.cover.alt }],
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = blogPost(slug);

  if (!post) {
    notFound();
  }

  const siteUrl = readSiteUrl();
  const pageUrl = new URL(`/blog/${post.slug}`, siteUrl).href;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    inLanguage: "es",
    image: new URL(post.cover.src, siteUrl).href,
    mainEntityOfPage: pageUrl,
    author: { "@type": "Organization", name: "Relify" },
    publisher: { "@type": "Organization", name: "Relify", url: new URL("/", siteUrl).href },
  };

  return (
    <PublicSite>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto flex w-full max-w-[88rem] flex-col gap-10 px-5 py-12 sm:px-8 lg:px-10">
        <Link href="/blog" className="text-sm font-medium text-public-clay hover:underline">
          {blogCopy.back}
        </Link>
        <header>
          <p className="text-xs tracking-[0.16em] text-public-clay uppercase">
            {post.category} · {formatBlogDate(post.date)} · {post.readTime} {blogCopy.minutes}
          </p>
          <h1 className="releva-page-title mt-3 max-w-5xl">{post.title}</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-public-muted sm:text-xl sm:leading-9">
            <BlogProse text={post.excerpt} />
          </p>
        </header>
        <figure className="overflow-hidden rounded-[1.75rem] border border-public-line bg-public-card">
          <div className="relative aspect-[16/9]">
            <Image src={post.cover.src} alt={post.cover.alt} fill priority className="object-cover" sizes="(min-width: 1024px) 88rem, 100vw" />
          </div>
          <figcaption className="px-5 py-3 text-sm leading-6 text-public-muted">{post.cover.caption}</figcaption>
        </figure>
        <div className="flex flex-col gap-14">
          {post.sections.map((section) => (
            <section
              key={section.heading}
              className={section.image ? "grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]" : "flex flex-col gap-4"}
            >
              <div className="flex flex-col gap-4">
                <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-lg leading-9 text-public-ink">
                    <BlogProse text={paragraph} />
                  </p>
                ))}
                {section.points ? (
                  <ul className="list-disc space-y-2 pl-5 text-lg leading-9">
                    {section.points.map((point) => (
                      <li key={point}>
                        <BlogProse text={point} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {section.image ? (
                <figure className="overflow-hidden rounded-[1.5rem] border border-public-line bg-white lg:sticky lg:top-28">
                  <div className="relative aspect-[16/10]">
                    <Image src={section.image.src} alt={section.image.alt} fill className="object-cover" sizes="(min-width: 1024px) 28rem, 100vw" />
                  </div>
                  <figcaption className="px-5 py-3 text-sm leading-6 text-public-muted">{section.image.caption}</figcaption>
                </figure>
              ) : null}
            </section>
          ))}
        </div>
        <nav aria-label={blogCopy.related} className="rounded-[1.5rem] border border-public-line bg-white p-6">
          <p className="text-sm font-medium">{blogCopy.related}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {post.related.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-public-clay hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <NewsletterSignup />
      </article>
    </PublicSite>
  );
}
