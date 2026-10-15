export function slugify(value: string) {
  return value.toLowerCase().trim()
    .normalize("NFKD").replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

export function formatDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function safeReturnPath(value: string | null, fallback = "/admin") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
