"use client";

import { useState } from "react";
import Link from "next/link";
import { blogCategories, blogCopy, formatBlogDate, type BlogPost } from "@/lib/blog";

export function BlogIndex({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<string>(blogCopy.all);
  const visible = category === blogCopy.all ? posts : posts.filter((post) => post.category === category);
  const [featured, ...rest] = visible;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label={blogCopy.title}>
        {[blogCopy.all, ...blogCategories].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={
              category === item
                ? "rounded-full bg-public-ink px-4 py-2 text-sm text-white"
                : "rounded-full border border-public-line bg-white px-4 py-2 text-sm text-public-muted"
            }
          >
            {item}
          </button>
        ))}
      </div>
      {featured ? <Featured post={featured} /> : <p className="text-sm text-public-muted">{blogCopy.description}</p>}
      {rest.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Featured({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block rounded-[2rem] border border-public-line bg-public-card p-6 shadow-public hover:border-public-ink sm:p-8">
      <p className="text-xs tracking-[0.16em] text-public-clay uppercase">
        {post.category} · {formatBlogDate(post.date)}
      </p>
      <h2 className="mt-3 max-w-3xl text-4xl leading-none tracking-tight italic [font-family:var(--public-display)] sm:text-5xl">{post.title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-public-muted">{post.excerpt}</p>
      <p className="mt-4 text-sm text-public-muted">
        {post.readTime} {blogCopy.minutes}
      </p>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex h-full flex-col rounded-3xl border border-public-line bg-white p-5 hover:border-public-ink">
      <p className="text-xs tracking-[0.14em] text-public-clay uppercase">
        {post.category} · {formatBlogDate(post.date)}
      </p>
      <h2 className="mt-3 text-2xl leading-tight tracking-tight">{post.title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-public-muted">{post.excerpt}</p>
      <p className="mt-4 text-sm text-public-muted">
        {post.readTime} {blogCopy.minutes}
      </p>
    </Link>
  );
}
