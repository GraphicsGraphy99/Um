import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const posts = await getPublishedPosts();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/posts`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
    ...posts.map(post => ({ url: `${base}/posts/${post.slug}`, lastModified: new Date(post.updated_at), changeFrequency: "monthly" as const, priority: 0.7 }))
  ];
}
