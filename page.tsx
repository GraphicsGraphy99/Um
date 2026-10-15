import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, getSettings } from "@/lib/data";
import { PostCard } from "@/components/PostCard";

export const metadata: Metadata = { title: "Home", description: "The latest picture and video work from GraphicsGraphy." };

export default async function HomePage() {
  const settings = await getSettings();
  const [pictures, videos] = await Promise.all([
    getPublishedPosts(settings.homepage_picture_limit, "image"),
    getPublishedPosts(settings.homepage_video_limit, "video")
  ]);
  return <div className="container">
    <section className="hero">
      <span className="eyebrow">A creative publishing space</span>
      <h1>Ideas made<br/>visible.</h1>
      <p>Discover graphic design, digital artwork, bold posters, thumbnails, and visual stories created to make you look twice.</p>
    </section>
    <section className="section" aria-labelledby="latest-pictures">
      <div className="section-head"><div><span className="eyebrow">Fresh from the studio</span><h2 id="latest-pictures">Latest Picture Posts</h2></div><Link className="text-link" href="/posts?type=image">View all pictures ↗</Link></div>
      {pictures.length ? <div className="grid-posts">{pictures.map(post => <PostCard key={post.id} post={post}/>)}</div> : <div className="empty-state">No picture posts yet. Check back soon for new creative work.</div>}
    </section>
    <section className="section" aria-labelledby="latest-videos">
      <div className="section-head"><div><span className="eyebrow">Motion and process</span><h2 id="latest-videos">Latest Video Posts</h2></div><Link className="text-link" href="/posts?type=video">View all videos ↗</Link></div>
      {videos.length ? <div className="grid-posts">{videos.map(post => <PostCard key={post.id} post={post}/>)}</div> : <div className="empty-state">No video posts yet. New videos will appear here when published.</div>}
    </section>
  </div>;
}
