import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Always validate the server-side user and role; never trust UI visibility. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");
  return { supabase, user };
}
