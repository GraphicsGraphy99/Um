"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Post } from "@/lib/types";
import { PostArchiveCard } from "@/components/PostArchiveCard";

export function PostArchive({ posts }: { posts: Post[] }) {
  const params = useSearchParams();
  const initial = params.get("type");
  const [type, setType] = useState(initial === "image" || initial === "video" ? initial : "all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return posts.filter(post => (type === "all" || post.post_type === type) &&
      (!needle || [post.title, post.description, post.category || "", ...(post.tags || [])].join(" ").toLowerCase().includes(needle)))
      .sort((a,b) => {
        const diff = new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime();
        return sort === "oldest" ? diff : -diff;
      });
  }, [posts, type, search, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function chooseType(value: typeof type) { setType(value); setPage(1); }
  return <>
    <div className="toolbar">
      <div className="filter-row" aria-label="Filter by type">
        {(["all","image","video"] as const).map(item => <button key={item} className={`filter-chip ${type === item ? "active" : ""}`} onClick={() => chooseType(item)}>{item === "all" ? "All" : item === "image" ? "Pictures" : "Videos"}</button>)}
      </div>
      <input className="field search-field" value={search} onChange={e => {setSearch(e.target.value);setPage(1);}} placeholder="Search posts…" aria-label="Search posts"/>
      <select className="select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort posts"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
    </div>
    {visible.length ? <div className="grid-posts">{visible.map(post => <PostArchiveCard key={post.id} post={post}/>)}</div> : <div className="empty-state">No posts match that search. Try another word or filter.</div>}
    {filtered.length > pageSize && <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:15,padding:"32px 0"}}><button className="button secondary" disabled={page <= 1} onClick={() => setPage(page-1)}>Previous</button><span className="help-text">Page {page} of {pageCount}</span><button className="button secondary" disabled={page >= pageCount} onClick={() => setPage(page+1)}>Next</button></div>}
  </>;
}
