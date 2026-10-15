import Link from "next/link";
import { getSettings } from "@/lib/data";

export async function SiteFooter() {
  const settings = await getSettings();
  return <footer className="site-footer"><div className="container footer-inner">
    <div>© {new Date().getFullYear()} {settings.brand_name}. Made for visual thinkers.</div>
    <div className="footer-links">
      {settings.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}
      {settings.youtube_url && <a href={settings.youtube_url} target="_blank" rel="noreferrer">YouTube</a>}
      <Link href="/contact">Get in touch</Link>
    </div>
  </div></footer>;
}
