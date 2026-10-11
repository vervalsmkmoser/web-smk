-- SQL untuk Supabase: jalankan seluruh isi file ini di SQL Editor.
-- Setelah membuat akun admin melalui Authentication > Users, masukkan UID-nya ke admin_users.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Berita',
  date_label text not null default '',
  body text not null,
  image_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key default 'site' check (id = 'site'),
  school_name text not null default 'SMK Moch Sroedji Jember',
  major_name text not null default 'Manajemen Perkantoran',
  address text not null default 'Jl. Sriwijaya No. 32, Sumbersari, Jember',
  phone text not null default '0822-3500-3417',
  email text not null default '',
  hours text not null default '',
  hero_title text not null default 'Belajar Hari Ini, Memimpin Esok',
  hero_subtitle text not null default '',
  about_title text not null default 'Mengenal SMK Moch Sroedji Jember',
  about_text text not null default '',
  vision text not null default '',
  mission text not null default '',
  logo_url text,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.news enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "public can read published news" on public.news;
create policy "public can read published news" on public.news for select to anon, authenticated
using (status = 'published' or exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can insert news" on public.news;
create policy "admins can insert news" on public.news for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can update news" on public.news;
create policy "admins can update news" on public.news for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can delete news" on public.news;
create policy "admins can delete news" on public.news for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings for select to anon, authenticated using (true);

drop policy if exists "admins can insert site settings" on public.site_settings;
create policy "admins can insert site settings" on public.site_settings for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can update site settings" on public.site_settings;
create policy "admins can update site settings" on public.site_settings for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Storage bucket untuk foto berita dan logo sekolah.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-media', 'school-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "public can view school media" on storage.objects;
create policy "public can view school media" on storage.objects for select to anon, authenticated
using (bucket_id = 'school-media');

drop policy if exists "admins can upload school media" on storage.objects;
create policy "admins can upload school media" on storage.objects for insert to authenticated
with check (bucket_id = 'school-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can update school media" on storage.objects;
create policy "admins can update school media" on storage.objects for update to authenticated
using (bucket_id = 'school-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (bucket_id = 'school-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can delete school media" on storage.objects;
create policy "admins can delete school media" on storage.objects for delete to authenticated
using (bucket_id = 'school-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Langkah sesudah membuat user admin:
-- insert into public.admin_users (user_id) values ('GANTI_DENGAN_UID_USER_ADMIN');
-- Jangan pernah menaruh service_role key di file HTML atau repository publik.
