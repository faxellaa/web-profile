# Supabase setup

## SPMB applications and gallery

Apply `migrations/004_spmb_and_gallery.sql` to the Supabase project before using the updated SPMB form or gallery admin.

The migration:

- Creates a private `spmb-documents` bucket, limited to PDF/JPG/PNG files up to 10 MB each.
- Creates `spmb_applications` with public inserts handled only by the server endpoint; reads and status updates require a school admin.
- Creates `school_gallery_items`; gallery items are publicly readable and writable only by a school admin.
- Limits content mutations on existing school data tables to school admins.

Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the server environment. `SUPABASE_SECRET_KEY` is a server-only secret and must never use a `NEXT_PUBLIC_` name or be exposed to browser code. The public SPMB endpoint returns `503` until both values are configured.

## Grant admin access

Admin sign-in continues to use Supabase Auth email and password. A registered account is not automatically an administrator. In the Supabase SQL Editor, assign the admin role only to trusted registered accounts:

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = lower('YOUR_REGISTERED_ADMIN_EMAIL');
```

Confirm that the update affects exactly the intended account. The account must sign out and sign in again for the new role claim to appear in its access token. Admin access is checked both in the interface and by database/storage row-level security.

## Applicant data

The public form collects the applicant's name, nickname, previous school, place/date of birth, NIK, and parent/guardian consent. `Foto/Scan SNSP` is kept as the supplied label until its full name is confirmed. Both document inputs are optional unless the form is updated to mark them required. Uploaded documents are stored in the private bucket and are available to authorized admins through short-lived signed links.

Application status values are `Baru`, `Diverifikasi`, and `Diterima`.
