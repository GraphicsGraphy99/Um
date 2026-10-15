import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

// Basic per-process limiter for local/single-instance use. Use a shared Redis/Upstash limiter
// or hosting-provider edge rate limit for production multi-instance deployments.
const buckets = new Map<string, { count: number; start: number }>();
function limited(key: string) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.start > 10 * 60 * 1000) {
    buckets.set(key, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many submissions. Please wait a little and try again." }, { status: 429 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Contact service is not configured yet." }, { status: 503 });
  }

  // This key is server-only and must never be imported into client components or exposed in NEXT_PUBLIC_ vars.
  const supabase = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: "new"
  });

  if (error) {
    console.error("Contact message persistence failed", { code: error.code });
    return NextResponse.json({ error: "We couldn't save your message right now. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
