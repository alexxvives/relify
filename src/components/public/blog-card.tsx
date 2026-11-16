import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogCopy, formatBlogDate, type BlogPost } from "@/lib/blog";

function Meta({ post }: { post: BlogPost }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-public-muted">
      <span className="rounded-full bg-[#e6f4f2] px-2 py-0.5 font-medium text-public-clay">{post.category}</span>
      <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
      <span aria-hidden>·</span>
      <span>
        {post.readTime} {blogCopy.minutes}
      </span>
    </p>
  );
}

/** S27: blog card. The whole card is one link; the title carries the accessible name. */
export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-public-line bg-white transition-shadow hover:shadow-[0_12px_32px_-18px_rgba(18,52,58,0.35)] @[40rem]:flex-row">
      <div className="relative aspect-[16/10] overflow-hidden bg-public-card @[40rem]:aspect-auto @[40rem]:min-h-[14rem] @[40rem]:w-1/2 @[40rem]:shrink-0">
        <Image
          src={post.cover.src}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5 @[40rem]:justify-center @[40rem]:p-7">
        <Meta post={post} />
        <h3 className="text-lg leading-snug font-semibold tracking-tight text-public-ink">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-[#2fc4b2]">
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-6 text-public-muted">{post.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-public-clay">
          {blogCopy.readMore}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}

/** S27: featured post: wide image next to the text on desktop, stacked on phones. */
export function BlogFeatured({ post }: { post: BlogPost }) {
  return (
    <article className="group relative grid overflow-hidden rounded-[1.5rem] border border-public-line bg-white md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-public-card md:aspect-auto md:min-h-[20rem]">
        <Image
          src={post.cover.src}
          alt={post.cover.alt}
          fill
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          sizes="(min-width: 768px) 55vw, 100vw"
        />
      </div>
      <div className="flex flex-col justify-center gap-3 p-5 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-public-clay uppercase">{blogCopy.featured}</p>
        <h2 className="text-2xl leading-tight font-semibold tracking-tight text-public-ink sm:text-3xl">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#2fc4b2]">
            {post.title}
          </Link>
        </h2>
        <p className="text-base leading-7 text-public-muted">{post.excerpt}</p>
        <Meta post={post} />
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-public-clay">
          {blogCopy.readMore}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}
