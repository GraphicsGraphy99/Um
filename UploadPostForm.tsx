"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { savePostFormAction } from "@/app/admin/posts/form-actions";

type Existing = {
  id?: string; title?: string; slug?: string; description?: string; post_type?: "image"|"video";
  media_path?: string; thumbnail_path?: string|null; category?: string|null; tags?: string[];
  status?: "draft"|"published"|"archived"; alt_text?: string|null; allow_download?: boolean;
};

export function UploadPostForm({ existing, initialType = "image" }: { existing?: Existing; initialType?: "image"|"video" }) {
  const [title, setTitle] = useState(existing?.title || "");
  const [slug, setSlug] = useState(existing?.slug || "");
  const [type, setType] = useState<"image"|"video">(existing?.post_type || initialType);
  const [mediaPath, setMediaPath] = useState(existing?.media_path || "");
  const [thumbPath, setThumbPath] = useState(existing?.thumbnail_path || "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [preview, setPreview] = useState("");
  const [slugEdited, setSlugEdited] = useState(Boolean(existing?.slug));

  async function upload(file: File, kind: "media"|"thumbnail") {
    setUploading(true); setProgress("Checking file…");
    try {
      const allowed = kind === "thumbnail"
        ? ["image/jpeg","image/png","image/webp","image/avif"]
        : type === "image" ? ["image/jpeg","image/png","image/webp","image/avif","image/gif"] :
          ["video/mp4","video/webm","video/quicktime"];
      const maxBytes = kind === "thumbnail" || type === "image" ? 12 * 1024 * 1024 : 300 * 1024 * 1024;
      if (!allowed.includes(file.type)) throw new Error("That file type is not supported.");
      if (file.size > maxBytes) throw new Error(`File is too large. Maximum size is ${Math.round(maxBytes/1024/1024)} MB.`);
      if (file.size === 0) throw new Error("This file is empty.");
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"") || "bin";
      const path = `${crypto.randomUUID()}.${ext}`;
      setProgress("Uploading file…");
      const { error } = await supabase.storage.from("published-media").upload(path, file, { upsert:false, contentType:file.type, cacheControl:"3600" });
      if (error) throw new Error(error.message);
      if (kind === "media") {
        setMediaPath(path);
        if (type === "image") setPreview(URL.createObjectURL(file));
      } else {
        setThumbPath(path);
        setPreview(URL.createObjectURL(file));
      }
      setProgress("Upload complete.");
    } catch (err) {
      setProgress(err instanceof Error ? err.message : "Upload failed.");
    } finally { setUploading(false); }
  }

  return <form className="admin-form" action={savePostFormAction}>
    <input type="hidden" name="id" value={existing?.id || ""}/>
    <div className="form-row"><label htmlFor="title">Post title *</label><input className="field" id="title" name="title" value={title} onChange={e=>{setTitle(e.target.value);if(!slugEdited)setSlug(slugify(e.target.value));}} required minLength={2} maxLength={140}/></div>
    <div className="form-row"><label htmlFor="slug">Post URL slug *</label><input className="field" id="slug" name="slug" value={slug} onChange={e=>{setSlugEdited(true);setSlug(slugify(e.target.value));}} required pattern="[a-z0-9]+(-[a-z0-9]+)*"/><span className="help-text">Your post URL will look like /posts/{slug || "your-post-title"}.</span></div>
    <div className="form-row"><label htmlFor="description">Description *</label><textarea className="textarea" id="description" name="description" rows={6} defaultValue={existing?.description || ""} required maxLength={12000}/></div>
    <div className="form-grid">
      <div className="form-row"><label htmlFor="post_type">Post type *</label><select className="select" id="post_type" name="post_type" value={type} onChange={e=>setType(e.target.value as "image"|"video")}><option value="image">Picture</option><option value="video">Video</option></select></div>
      <div className="form-row"><label htmlFor="category">Category</label><input className="field" id="category" name="category" defaultValue={existing?.category || ""} maxLength={80} placeholder="e.g. Posters"/></div>
    </div>
    <div className="form-row"><label htmlFor="media_file">Upload {type === "image" ? "picture" : "video"} {type === "image" ? "(JPG, PNG, WebP, AVIF, GIF · max 12 MB)" : "(MP4, WebM, MOV · max 300 MB)"}</label><input className="field" id="media_file" type="file" accept={type==="image"?"image/jpeg,image/png,image/webp,image/avif,image/gif":"video/mp4,video/webm,video/quicktime"} disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"media");}}/><input type="hidden" name="media_path" value={mediaPath}/><span className="help-text">Upload to persistent cloud storage. Large videos may require a larger plan or resumable uploads.</span></div>
    {type==="video" && <div className="form-row"><label htmlFor="thumbnail_file">Custom thumbnail (optional)</label><input className="field" id="thumbnail_file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"thumbnail");}}/><input type="hidden" name="thumbnail_path" value={thumbPath}/></div>}
    {type==="image" && <div className="form-row"><label htmlFor="alt_text">Alternative text</label><input className="field" id="alt_text" name="alt_text" defaultValue={existing?.alt_text || ""} maxLength={300} placeholder="Describe the image for screen-reader users"/></div>}
    <div className="form-row"><label htmlFor="tags">Tags (comma separated)</label><input className="field" id="tags" name="tags" defaultValue={(existing?.tags || []).join(", ")} maxLength={800} placeholder="design, poster, digital art"/></div>
    <div className="form-row"><label htmlFor="status">Publishing status</label><select className="select" id="status" name="status" defaultValue={existing?.status || "draft"}><option value="draft">Save as draft</option><option value="published">Publish now</option><option value="archived">Archive / unpublish</option></select></div>
    {type==="image" && <label style={{display:"flex",gap:9,alignItems:"center",marginBottom:18}}><input type="checkbox" name="allow_download" defaultChecked={existing?.allow_download || false}/> Allow visitors to download this picture</label>}
    {preview && <div style={{marginBottom:16}}><p className="help-text">Local preview</p>{type==="image" ? <img src={preview} alt="Upload preview" style={{maxWidth:"100%",maxHeight:300,borderRadius:10}}/> : <img src={preview} alt="Thumbnail preview" style={{maxWidth:"100%",maxHeight:220,borderRadius:10}}/>}</div>}
    {progress && <p role="status" className="help-text">{progress}</p>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button className="button" type="submit" disabled={uploading || !mediaPath}>{uploading ? "Uploading…" : existing?.id ? "Save changes" : "Save post"}</button><a className="button secondary" href="/admin/posts">Cancel</a></div>
    <p className="help-text" style={{marginTop:15}}>Publishing saves your post to the database. Public pages only display published posts.</p>
  </form>;
}
