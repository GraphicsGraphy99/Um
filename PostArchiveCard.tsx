import Link from "next/link";
import { Play } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PostArchiveCard({ post }: { post: Post }) {
  const imageUrl = post.post_type === "video" ? (post.thumbnail_url || post.media_url) : post.media_url;
  return <article className="post-card">
    <Link href={`/posts/${post.slug}`} aria-label={`Open ${post.title}`}>
      <div className="post-image">
        {imageUrl ? <img src={imageUrl} alt={post.post_type === "image" ? (post.alt_text || post.title) : `${post.title} thumbnail`} loading="lazy"/> :
          <div style={{height:"100%",display:"grid",placeItems:"center",color:"#777"}}>Media preview</div>}
        {post.post_type === "video" && <span className="play-pill" aria-label="Video"><Play size={18} fill="currentColor"/></span>}
      </div>
      <div className="card-meta"><span>{formatDate(post.published_at)}</span>{post.category && <span className="category-pill">{post.category}</span>}</div>
      <h3>{post.title}</h3>
      <p>{post.description.slice(0,145)}{post.description.length > 145 ? "…" : ""}</p>
    </Link>
  </article>;
}
