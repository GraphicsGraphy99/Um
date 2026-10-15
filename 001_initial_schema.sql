-- GraphicsGraphy schema. Apply through the Supabase SQL Editor or Supabase CLI.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'visitor' check (role in ('visitor','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check (char_length(description) between 1 and 12000),
  post_type text not null check (post_type in ('image','video')),
  media_path text not null,
  thumbnail_path text,
  category text check (category is null or char_length(category) <= 80),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  allow_download boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  constraint published_requires_date check (status <> 'published' or published_at is not null)
);

create index if not exists posts_public_listing_idx on public.posts(status, published_at desc) where status = 'published';
create index if not exists posts_type_listing_idx on public.posts(post_type, status, published_at desc);
create index if not exists posts_category_idx on public.posts(category);
create index if not exists posts_tags_idx on public.posts using gin(tags);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  subject text not null check (char_length(subject) between 2 and 160),
  message text not null check (char_length(message) between 10 and 5000),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam'))
);

create table if not exists public.site_settings (
  setting_key text primary key check (char_length(setting_key) between 1 and 100),
  setting_value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings(setting_key, setting_value) values
('brand_name','"GraphicsGraphy"'),
('tagline','"Ideas made visible."'),
('about_intro','"GraphicsGraphy is a creative space for thoughtful visuals, bold compositions, and digital storytelling."'),
('about_mission','"Our mission is to make original visual work easy to discover, appreciate, and share."'),
('about_vision','"We imagine a welcoming home for visual ideas, from striking poster designs to motion-led stories."'),
('contact_email','""'), ('instagram_url','""'), ('youtube_url','""'),
('homepage_picture_limit','6'), ('homepage_video_limit','3'),
('seo_description','"Explore graphic design, digital artwork, posters, thumbnails, and creative videos from GraphicsGraphy."')
on conflict (setting_key) do nothing;

-- Profiles are created when auth users are created. Role is visitor by default.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name',''), 'visitor')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;

-- Public visitors may read only published posts; all writes require an admin profile.
create policy "Published posts are public" on public.posts for select to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());
create policy "Admins read all posts" on public.posts for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins insert posts" on public.posts for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins update posts" on public.posts for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins delete posts" on public.posts for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Public read categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins manage settings" on public.site_settings for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins read contact messages" on public.contact_messages for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins update contact messages" on public.contact_messages for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
-- Anonymous insert is intentionally not enabled. The contact API uses a server-only service key
-- to insert validated messages. Never expose that key to the browser.

create policy "Users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Admins can read profiles" on public.profiles for select to authenticated
using (exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

-- Storage bucket is private; signed URLs are issued by the server for published media.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('published-media','published-media',false,314572800,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = 314572800;

-- Published media may be read via signed URLs; draft/unpublished media stays private.
create policy "Published post media can be signed" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'published-media'
  and exists (
    select 1 from public.posts p
    where p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
      and (p.media_path = storage.objects.name or p.thumbnail_path = storage.objects.name)
  )
);

create policy "Admins upload media" on storage.objects for insert to authenticated
with check (bucket_id = 'published-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins update media" on storage.objects for update to authenticated
using (bucket_id = 'published-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (bucket_id = 'published-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins delete media" on storage.objects for delete to authenticated
using (bucket_id = 'published-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
