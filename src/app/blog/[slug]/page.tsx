import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BlogCard } from "@/components/public/blog-card";
import { BlogProse } from "@/components/public/blog-prose";
import { NewsletterSignup } from "@/components/public/newsletter-signup";
import { PublicSite } from "@/components/landing/public-site";
import { blogCopy, blogHeadingId, blogPost, blogPosts, formatBlogDate, relatedBlogPosts } from "@/lib/blog";
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

  const sectionIds = post.sections.map((section) => blogHeadingId(section.heading));
  const more = relatedBlogPosts(post.slug, 3);

  return (
    <PublicSite>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto flex w-full max-w-[80rem] flex-col gap-8 px-5 py-8 sm:gap-10 sm:px-8 sm:py-12">
        <header className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <Link href="/blog" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-public-clay hover:underline">
            <ArrowLeft className="size-4" aria-hidden />
            {blogCopy.back}
          </Link>
          <p>
            <span className="rounded-full bg-[#e6f4f2] px-2.5 py-1 text-xs font-medium text-public-clay">{post.category}</span>
          </p>
          <h1 className="releva-page-title">{post.title}</h1>
          <p className="text-lg leading-8 text-public-muted">
            <BlogProse text={post.excerpt} />
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-public-line pt-4 text-sm text-public-muted">
            <span className="font-medium text-public-ink">{blogCopy.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>
              {post.readTime} {blogCopy.minutes}
            </span>
          </p>
        </header>
        <figure className="mx-auto w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-public-line bg-public-card">
          <div className="relative aspect-[16/9]">
            <Image src={post.cover.src} alt={post.cover.alt} fill priority className="object-cover" sizes="(min-width: 1024px) 64rem, 100vw" />
          </div>
          <figcaption className="px-5 py-3 text-sm leading-6 text-public-muted">{post.cover.caption}</figcaption>
        </figure>
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-12">
          {post.sections.length > 2 ? (
            <nav aria-label={blogCopy.toc} className="rounded-2xl border border-public-line bg-white p-4 lg:sticky lg:top-28 lg:order-2 lg:self-start lg:border-0 lg:bg-transparent lg:p-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-public-muted uppercase">{blogCopy.toc}</p>
              <ol className="mt-3 flex flex-col gap-2 text-sm lg:border-l lg:border-public-line">
                {post.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a href={`#${sectionIds[index]}`} className="block leading-5 text-public-ink hover:text-public-clay lg:-ml-px lg:border-l-2 lg:border-transparent lg:pl-3 lg:hover:border-public-clay">
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className="flex max-w-[42rem] min-w-0 flex-col gap-10">
            {post.sections.map((section, index) => (
              <section key={section.heading} aria-labelledby={sectionIds[index]} className="flex flex-col gap-4">
                <h2 id={sectionIds[index]} className="scroll-mt-28 text-2xl leading-tight font-semibold tracking-tight text-public-ink sm:text-[1.75rem]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[1.0625rem] leading-8 text-public-ink">
                    <BlogProse text={paragraph} />
                  </p>
                ))}
                {section.points ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-[1.0625rem] leading-8 marker:text-public-clay">
                    {section.points.map((point) => (
                      <li key={point}>
                        <BlogProse text={point} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.image ? (
                  <figure className="mt-2 overflow-hidden rounded-2xl border border-public-line bg-white">
                    <div className="relative aspect-[16/9]">
                      <Image src={section.image.src} alt={section.image.alt} fill className="object-cover" sizes="(min-width: 1024px) 42rem, 100vw" />
                    </div>
                    <figcaption className="px-4 py-2.5 text-sm leading-6 text-public-muted">{section.image.caption}</figcaption>
                  </figure>
                ) : null}
              </section>
            ))}
          </div>
        </div>
        <aside className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 rounded-[1.5rem] bg-[#1c2740] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <p className="text-xl font-semibold tracking-tight sm:text-2xl">{blogCopy.ctaTitle}</p>
            <p className="mt-2 text-sm leading-6 text-white/75">{blogCopy.ctaBody}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/empresas" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#1c2740] hover:bg-[#eef2ff] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none">
              {blogCopy.ctaSell}
            </Link>
            <Link href="/proyectos" className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none">
              {blogCopy.ctaBuy}
            </Link>
          </div>
        </aside>
        {more.length > 0 ? (
          <section aria-labelledby="blog-more" className="mx-auto flex w-full max-w-5xl flex-col gap-5">
            <h2 id="blog-more" className="text-xl font-semibold tracking-tight text-public-ink sm:text-2xl">
              {blogCopy.morePosts}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {more.map((item) => (
                <li key={item.slug}>
                  <BlogCard post={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <NewsletterSignup />
      </article>
    </PublicSite>
  );
}
