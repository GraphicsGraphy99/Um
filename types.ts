export type PostType = "image" | "video";
export type PostStatus = "draft" | "published" | "archived";

export type Post = {
  id: string;
  title: string;
  slug: string;
  description: string;
  post_type: PostType;
  media_path: string;
  thumbnail_path: string | null;
  media_url?: string;
  thumbnail_url?: string | null;
  category: string | null;
  tags: string[];
  status: PostStatus;
  alt_text: string | null;
  allow_download: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_id: string | null;
};

export type SiteSettings = {
  brand_name: string;
  tagline: string;
  about_intro: string;
  about_mission: string;
  about_vision: string;
  contact_email: string;
  instagram_url: string;
  youtube_url: string;
  homepage_picture_limit: number;
  homepage_video_limit: number;
  seo_description: string;
};
