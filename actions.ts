"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { postSchema } from "@/lib/validation";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function savePostAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const rawTags = String(formData.get("tags") || "");
  const published = String(formData.get("status")) === "published";
  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    post_type: formData.get("post_type"),
    media_path: formData.get("media_path"),
    thumbnail_path: String(formData.get("thumbnail_path") || "") || null,
    category: String(formData.get("category") || "") || null,
    tags: rawTags.split(",").map(t => t.trim()).filter(Boolean),
    status: formData.get("status"),
    alt_text: String(formData.get("alt_text") || "") || null,
    allow_download: formData.get("allow_download") === "on",
    published_at: published ? new Date().toISOString() : null
  });
  if (!parsed.success) redirect(`/admin/posts/new?error=invalid`);
  const payload = { ...parsed.data, author_id: user.id, updated_at: new Date().toISOString(),
    published_at: published ? (parsed.data.published_at || new Date().toISOString()) : null };
  const id = String(formData.get("id") || "");
  const result = id
    ? await supabase.from("posts").update(payload).eq("id", id).select("id").single()
    : await supabase.from("posts").insert(payload).select("id").single();
  if (result.error) redirect(`/admin/posts/${id ? `${id}/edit` : "new"}?error=save`);
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${parsed.data.slug}`);
  revalidatePath("/admin/posts");
  redirect("/admin/posts?saved=1");
}

export async function deletePostAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/posts?error=invalid");
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) redirect("/admin/posts?error=delete");
  revalidatePath("/");
  revalidatePath("/posts");
  redirect("/admin/posts?deleted=1");
}

export async function saveSettingsAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const allowed = [
    "brand_name", "tagline", "about_intro", "about_mission", "about_vision",
    "contact_email", "instagram_url", "youtube_url", "homepage_picture_limit",
    "homepage_video_limit", "seo_description"
  ];
  const rows = allowed.map(setting_key => {
    const raw = String(formData.get(setting_key) || "");
    let setting_value: string | number = raw.trim().slice(0, 12000);
    if (setting_key === "homepage_picture_limit" || setting_key === "homepage_video_limit") {
      setting_value = Math.min(12, Math.max(1, Number.parseInt(raw, 10) || 3));
    }
    return { setting_key, setting_value };
  });
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "setting_key" });
  if (error) redirect("/admin/settings?error=save");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  redirect("/admin/settings?saved=1");
}
