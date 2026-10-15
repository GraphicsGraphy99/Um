import { createClient } from "@/lib/supabase/server";
import type { Post, SiteSettings } from "@/lib/types";

export const defaultSettings: SiteSettings = {
  brand_name: "GraphicsGraphy",
  tagline: "Ideas made visible.",
  about_intro: "GraphicsGraphy is a creative space for thoughtful visuals, bold compositions, and digital storytelling.",
  about_mission: "Our mission is to make original visual work easy to discover, appreciate, and share.",
  about_vision: "We imagine a welcoming home for visual ideas, from striking poster designs to motion-led stories.",
  contact_email: "",
  instagram_url: "",
  youtube_url: "",
  homepage_picture_limit: 6,
  homepage_video_limit: 3,
  seo_description: "Explore graphic design, digital artwork, posters, thumbnails, and creative videos from GraphicsGraphy."
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("setting_key,setting_value");
    if (!data) return defaultSettings;
    const values = Object.fromEntries(data.map((row) => [row.setting_key, row.setting_value]));
    return { ...defaultSettings, ...values } as SiteSettings;
  } catch {
    return defaultSettings;
  }
}

export async function getPublishedPosts(limit?: number, type?: "image" | "video"): Promise<Post[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("posts").select("*").eq("status", "published")
      .not("published_at", "is", null).order("published_at", { ascending: false });
    if (type) query = query.eq("post_type", type);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Post[];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("posts").select("*").eq("slug", slug)
      .eq("status", "published").not("published_at", "is", null).maybeSingle();
    return (data as Post | null) ?? null;
  } catch {
    return null;
  }
}

export async function getMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("published-media").createSignedUrl(path, 60 * 30);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
