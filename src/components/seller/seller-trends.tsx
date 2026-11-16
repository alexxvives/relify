import Image from "next/image";
import Link from "next/link";
import { blogPosts, formatBlogDate, type BlogLane, type BlogPost } from "@/lib/blog";
import { sellerCopy } from "@/lib/seller-copy";

/** S28 (Alex): one visual grid, newest first, at least three cards per row from a ~44rem column (1280 px). */
export const trendsGridClass =
  "grid grid-cols-1 gap-4 @[34rem]/trends:grid-cols-2 @[44rem]/trends:grid-cols-3 @[72rem]/trends:grid-cols-4";

export function SellerTrends() {
  const posts = [...blogPosts].sort((left, right) => right.date.localeCompare(left.date));

  return (
    <div className="@container/trends">
      <p className="max-w-2xl text-sm leading-6 text-[#667085]">{sellerCopy.trendsIntro}</p>
      <ul className={`mt-4 ${trendsGridClass}`}>
        {posts.map((post, index) => (
          <li key={post.slug} className="flex">
            <TrendCard post={post} eager={index < 3} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendCard({ post, eager }: { post: BlogPost; eager: boolean }) {
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white transition-shadow hover:shadow-[0_14px_32px_-20px_rgba(28,39,64,0.45)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#eef1f6]">
        <Image
          src={post.cover.src}
          alt=""
          fill
          loading={eager ? "eager" : "lazy"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#33429a] backdrop-blur">
          {laneLabel(post.lane)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <time dateTime={post.date} className="text-xs text-[#667085]">
          {formatBlogDate(post.date)}
        </time>
        <h2 className="text-base leading-snug font-semibold text-[#1c2740]">
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#2fc4b2]"
          >
            {post.title}
          </Link>
        </h2>
        <p className="line-clamp-3 text-sm leading-6 text-[#667085]">{post.excerpt}</p>
      </div>
    </article>
  );
}

function laneLabel(lane: BlogLane): string {
  return lane === "deal" ? sellerCopy.trendsDeals : sellerCopy.trendsGuides;
}
