# GraphicsGraphy

A full-stack content publishing website for graphic design, digital artwork, posters, thumbnails, and videos.

## Architecture

- **Next.js App Router + TypeScript**: public pages, admin UI, server actions, metadata and sitemap.
- **Tailwind CSS v4**: build-time CSS framework, with a small custom editorial design system in `src/app/globals.css`.
- **Supabase Auth**: email/password login with server-side role checks and refreshed HTTP-only session cookies.
- **PostgreSQL + Row Level Security**: persistent posts, profiles, categories, contact messages and site settings.
- **Supabase Storage**: private persistent media storage with administrator-only upload policies.
- **Zod**: server-side schema validation.
- **Vitest**: unit tests for slug and input validation.

> Important: this is a project scaffold with the core application implemented, but production readiness depends on configuring Supabase policies and testing against your own deployment. Do not describe any deployment as fully secure until you have tested it.

## Routes

- `/` — latest picture posts and latest video posts only, plus shared header/footer.
- `/about` — administrator-editable brand story, mission and vision.
- `/posts` — archive with type filter, search, sorting and pagination.
- `/posts/[slug]` — shareable post details.
- `/contact` — contact form and privacy note.
- `/admin/login` — admin login.
- `/admin` — dashboard overview.
- `/admin/posts` — post list.
- `/admin/posts/new` and `/admin/posts/[id]/edit` — create and edit.
- `/admin/settings` — editable site settings.

## Requirements

- Node.js 20.9 or newer
- A Supabase project
- A GitHub account and a Next.js-compatible hosting provider (e.g. Vercel)

## Local setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
3. In Authentication settings, enable email/password sign-in. Disable public signups after creating the admin account.
4. Create your account in Supabase Authentication.
5. In the SQL Editor, grant the account admin role (replace the UUID with the new user's ID):

   ```sql
   update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
   ```

   This is an intentional manual privilege grant; do not provide an open registration route that lets users choose their own role.
6. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
   - `NEXT_PUBLIC_SUPABASE_URL` from Project Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` / publishable key from Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API, **server-only**, for validated contact-message inserts. Never prefix it with `NEXT_PUBLIC_` or put it in client code.
7. Install and run:

   ```bash
   npm install
   npm run dev
   ```

8. Visit `http://localhost:3000`, then sign in at `/admin/login`.

## First administrator and account safety

- Create an auth user through Supabase Dashboard → Authentication → Users → Add user.
- Use a strong unique password. Use your password manager.
- Copy the auth user's UUID, then run the admin role update shown above.
- Disable public sign-ups and configure email confirmation / password reset in Supabase Auth.
- Never expose the service-role key in `NEXT_PUBLIC_*` variables or in client components.
- Keep at least two trusted project owners where operationally appropriate, and remove admin access promptly when no longer needed.

## Media storage

The SQL migration creates a **private** `published-media` bucket. Admin uploads are restricted by Storage RLS. The upload UI checks MIME type and size in the browser for user experience; browser checks alone do not prove a file's actual contents. For a production hardening pass, add a server-side file-signature inspection pipeline and malware scanning before making media available.

The current detail-page media helper issues 30-minute signed URLs. For stable SEO/social preview images and public delivery of published assets, consider a separate publishing workflow that moves approved media to a public-read delivery bucket after publication. Keep drafts in private storage. Do not change a bucket to public unless that exposure is intentional.

Video uploads are limited to 300 MB in this starter. For large files or unreliable mobile connections, use Supabase resumable uploads (TUS) and display upload progress.

## Contact form status

The contact form validates values server-side and inserts messages into `contact_messages` through a server-only service-role key. Set `SUPABASE_SERVICE_ROLE_KEY` in local and production server environment variables. Never expose it in the browser or any `NEXT_PUBLIC_*` variable. The current rate limiter is process-local and suitable only for local/single-instance testing; use a shared Redis/Upstash limiter or platform edge protection in production. Email notifications are not configured; messages are stored in the database and visible to admins at `/admin/contact`.

## Important implementation checklist before launch

- [ ] Replace the process-local contact limiter with shared Redis/Upstash or platform edge rate limiting.
- [ ] Confirm the profile role and every admin route/server action deny non-admin users.
- [ ] Test RLS policies using anonymous, regular authenticated, and admin accounts.
- [ ] Add server-side media signature checks, optional malware scanning, and upload quotas.
- [ ] Add an audit log table and record admin publish/edit/delete actions.
- [ ] Configure transactional email for contact notifications and password resets.
- [ ] Add robust shared rate limiting for login and contact submissions at the edge.
- [ ] Add an administrator UI for changing contact-message processing status and managing categories.
- [ ] Test responsive layouts on real Android/iOS devices.
- [ ] Run tests, lint, and a production build.
- [ ] Configure production domain, HTTPS, backups, monitoring, and restore drills.

## Deploy

1. Push this folder to a private or public GitHub repository.
2. Import the repository into Vercel (or another Next.js-compatible host).
3. Set the same environment variables in the hosting provider's project settings.
4. Set `NEXT_PUBLIC_SITE_URL` to your production HTTPS URL.
5. Deploy and verify `/`, `/posts`, `/about`, `/contact`, `/admin/login`, sitemap and robots.
6. Add your custom domain in the hosting provider and configure the DNS records it provides.
7. Confirm HTTPS is active before using admin accounts.
8. Re-run the RLS/auth/contact/upload test checklist after deployment.

## Backups and recovery

- Schedule regular PostgreSQL backups using your Supabase plan / backup tooling.
- Keep a separate copy of irreplaceable original media.
- Periodically export or snapshot your storage objects and settings.
- Test restoring both database records and media into a non-production project.
- Store backup access separately from the production account and document who can restore.

## Daily publishing from your phone

1. Open your website and go to `/admin/login`.
2. Sign in with your admin email and password.
3. Tap **New post**.
4. Enter a clear title. The URL slug is generated automatically and can be edited.
5. Add a description, category, and comma-separated tags.
6. Choose **Picture** or **Video**, then choose the file on your phone. Wait for the upload confirmation.
7. For pictures, add alternative text. For videos, optionally upload a thumbnail.
8. Choose **Save as draft** to keep it private, or **Publish now** to make it public.
9. Open the preview/public URL to check the layout on your phone.
10. To correct a post, go to **Manage posts → Edit**. Change its status to Draft or Archived to remove it from public listings.

## Troubleshooting

- **Login keeps returning to the login page:** check that the Supabase profile exists and has role `admin`.
- **Uploads are denied:** check Storage policies, bucket name, accepted MIME type, size limit, and current admin role.
- **Posts don't appear publicly:** verify status is `published`, `published_at` is set, and the row is readable by the public RLS policy.
- **Contact form reports unavailable:** the restricted server-side insert adapter described above has not been configured.
- **Images expire:** signed URLs are short-lived by design. Configure a published-media delivery strategy before public launch.
- **Build errors:** use Node.js 20.9+, run `npm install`, then `npm run build`, and resolve TypeScript/ESLint errors.

## Security note

No web application is completely secure. This project includes server-side role checks, RLS policies, input schemas, secure session handling via Supabase SSR, and basic security headers, but deployment-specific security testing and the remaining checklist items are required before production use.
