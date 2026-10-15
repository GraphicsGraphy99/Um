import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(12000),
  post_type: z.enum(["image", "video"]),
  media_path: z.string().min(1).max(700),
  thumbnail_path: z.string().max(700).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  status: z.enum(["draft", "published", "archived"]),
  alt_text: z.string().trim().max(300).nullable().optional(),
  allow_download: z.boolean().default(false),
  published_at: z.string().datetime().nullable().optional()
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional() // honeypot; must remain empty
});
