import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: "GraphicsGraphy — Ideas made visible", template: "%s | GraphicsGraphy" },
    description: settings.seo_description,
    openGraph: { type: "website", siteName: settings.brand_name, title: "GraphicsGraphy — Ideas made visible", description: settings.seo_description, url: siteUrl },
    alternates: { canonical: "/" }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader/><main>{children}</main><SiteFooter/></body></html>;
}
