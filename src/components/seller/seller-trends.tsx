"use client";

import { useState } from "react";
import Link from "next/link";
import { SellerTabs } from "@/components/seller/seller-tabs";
import { blogPosts, formatBlogDate, type BlogLane } from "@/lib/blog";
import { sellerCopy } from "@/lib/seller-copy";

const tabs = [
  { id: "all", label: sellerCopy.trendsAll },
  { id: "guide", label: sellerCopy.trendsGuides },
  { id: "deal", label: sellerCopy.trendsDeals },
] as const;

type TrendTab = (typeof tabs)[number]["id"];

export function SellerTrends() {
  const [tab, setTab] = useState<TrendTab>("all");
  const posts = [...blogPosts]
    .filter((post) => (tab === "all" ? true : post.lane === tab))
    .sort((left, right) => right.date.localeCompare(left.date));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SellerTabs label={sellerCopy.trendsTitle} tabs={tabs} value={tab} onChange={setTab} />
        <Link href="/blog" className="text-sm font-medium text-[#465ab4] hover:underline">
          {sellerCopy.trendsDiary}
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">{sellerCopy.trendsIntro}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="block rounded-2xl border border-[#e6e9f0] bg-white p-5 hover:border-[#465ab4]">
              <p className="text-xs font-semibold tracking-wide text-[#465ab4]">
                {laneLabel(post.lane)} · {formatBlogDate(post.date)}
              </p>
              <h2 className="mt-2 text-base font-semibold text-[#1c2740]">{post.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function laneLabel(lane: BlogLane): string {
  return lane === "deal" ? sellerCopy.trendsDeals : sellerCopy.trendsGuides;
}
