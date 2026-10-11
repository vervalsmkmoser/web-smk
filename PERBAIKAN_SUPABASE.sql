-- Jalankan di Supabase SQL Editor jika akun admin sudah tercatat tetapi simpan/unggah masih gagal.
-- Skrip ini memperbarui hanya policy bernama di bawah; tidak menonaktifkan RLS.

-- 1) Pastikan tabel admin ada dan akun admin terdaftar.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2) Kebijakan berita: publik membaca berita terbit; admin dapat membaca semua dan mengelola konten.
DROP POLICY IF EXISTS "public can read published news" ON public.news;
CREATE POLICY "public can read published news" ON public.news FOR SELECT TO anon, authenticated
USING (status = 'published' OR EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins can insert news" ON public.news;
CREATE POLICY "admins can insert news" ON public.news FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins can update news" ON public.news;
CREATE POLICY "admins can update news" ON public.news FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins can delete news" ON public.news;
CREATE POLICY "admins can delete news" ON public.news FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- 3) Kebijakan pengaturan situs.
DROP POLICY IF EXISTS "public can read site settings" ON public.site_settings;
CREATE POLICY "public can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins can insert site settings" ON public.site_settings;
CREATE POLICY "admins can insert site settings" ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins can update site settings" ON public.site_settings;
CREATE POLICY "admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- 4) Bucket media: format sesuai file yang diterima kode portal (JPG/PNG/WebP/GIF), maks 5 MB.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('school-media', 'school-media', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

DROP POLICY IF EXISTS "public can view school media" ON storage.objects;
CREATE POLICY "public can view school media" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'school-media');
DROP POLICY IF EXISTS "admins can upload school media" ON storage.objects;
CREATE POLICY "admins can upload school media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-media' AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins can update school media" ON storage.objects;
CREATE POLICY "admins can update school media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'school-media' AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
WITH CHECK (bucket_id = 'school-media' AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));
DROP POLICY IF EXISTS "admins can delete school media" ON storage.objects;
CREATE POLICY "admins can delete school media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-media' AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- 5) Verifikasi akun admin setelah menjalankan skrip:
-- SELECT u.email, a.user_id FROM auth.users u JOIN public.admin_users a ON a.user_id = u.id;
