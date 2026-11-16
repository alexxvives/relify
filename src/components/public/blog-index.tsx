"use client";

import { useState } from "react";
import { BlogCard, BlogFeatured } from "@/components/public/blog-card";
import { blogCategories, blogCopy, type BlogPost } from "@/lib/blog";

/** S27: featured post, topic filter and a dense card grid. Posts arrive newest first. */
export function BlogIndex({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<string>("");
  const [featured, ...rest] = posts;
  const shown = category ? posts.filter((post) => post.category === category) : rest;
  const topics = blogCategories.filter((topic) => posts.some((post) => post.category === topic));

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {featured ? <BlogFeatured post={featured} /> : null}
      <section aria-labelledby="blog-latest" className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="blog-latest" className="text-xl font-semibold tracking-tight text-public-ink sm:text-2xl">
            {blogCopy.latest}
          </h2>
          <div role="group" aria-label={blogCopy.filterLabel} className="releva-scroll-x -mx-5 flex gap-1.5 px-5 sm:mx-0 sm:px-0">
            {["", ...topics].map((topic) => {
              const active = topic === category;
              return (
                <button
                  key={topic || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(topic)}
                  className={`min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
                    active ? "border-public-ink bg-public-ink text-white" : "border-public-line bg-white text-public-ink hover:border-public-clay hover:text-public-clay"
                  }`}
                >
                  {topic || blogCopy.all}
                </button>
              );
            })}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-public-line bg-white/60 p-6 text-sm text-public-muted">{blogCopy.empty}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {shown.map((post) => (
              <li key={post.slug}>
                <BlogCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
