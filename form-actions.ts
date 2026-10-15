"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { postSchema } from "@/lib/validation";

export async function savePostFormAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const status = String(formData.get("status") || "draft");
  const parsed = postSchema.safeParse({
    title: formData.get("title"), slug: formData.get("slug"), description: formData.get("description"),
    post_type: formData.get("post_type"), media_path: formData.get("media_path"),
    thumbnail_path: String(formData.get("thumbnail_path") || "") || null,
    category: String(formData.get("category") || "") || null,
    tags: String(formData.get("tags") || "").split(",").map(t=>t.trim()).filter(Boolean),
    status, alt_text: String(formData.get("alt_text") || "") || null,
    allow_download: formData.get("allow_download") === "on",
    published_at: status === "published" ? new Date().toISOString() : null
  });
  if (!parsed.success) redirect("/admin/posts/new?error=invalid");
  const payload = { ...parsed.data, author_id: user.id, updated_at: new Date().toISOString(),
    published_at: status === "published" ? (parsed.data.published_at || new Date().toISOString()) : null };
  const id = String(formData.get("id") || "");
  const result = id ? await supabase.from("posts").update(payload).eq("id",id).select("id").single()
    : await supabase.from("posts").insert(payload).select("id").single();
  if (result.error) redirect(`/admin/posts/new?error=save`);
  revalidatePath("/"); revalidatePath("/posts"); revalidatePath("/admin/posts");
  redirect("/admin/posts?saved=1");
}
