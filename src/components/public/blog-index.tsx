"use client";

import { ArcScope } from "@/components/arc/arc-scope";
import { BlogGrid, type BlogPost as GridPost } from "@/components/arc/blocks/blog-grid/blog-grid";
import { blogCategories, type BlogPost } from "@/lib/blog";

export function BlogIndex({ posts }: { posts: BlogPost[] }) {
  const items: GridPost[] = posts.map((post, index) => ({
    id: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    date: post.date,
    readTime: post.readTime,
    author: { name: "Relify" },
    image: { src: post.cover.src, alt: post.cover.alt },
    featured: index === 0,
  }));

  return (
    <ArcScope>
      <BlogGrid
        title="Últimos artículos"
        description=""
        posts={items}
        categories={[...blogCategories]}
        pageSize={6}
        getHref={(post) => `/blog/${post.id}`}
      />
    </ArcScope>
  );
}
