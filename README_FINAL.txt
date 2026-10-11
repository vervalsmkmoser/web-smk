WEBSITE FINAL — SMK MOCH SROEDJI JEMBER
=======================================

File utama:
- index.html       halaman publik website
- admin.html       portal administrator
- style.css        tema visual minimalis untuk website dan portal admin
- app.js           logika halaman publik
- admin.js         logika portal admin
- supabase-config.js konfigurasi Supabase (isi URL dan anon/public key)
- supabase_setup.sql skema database, RLS, dan storage
- PETUNJUK_SETUP_SUPABASE_GITHUB_PAGES.txt petunjuk setup dan publikasi

Cara mengaktifkan:
1. Buat proyek di Supabase.
2. Jalankan supabase_setup.sql di SQL Editor Supabase.
3. Buat user admin di Authentication, lalu daftarkan UID-nya di public.admin_users sesuai petunjuk SQL.
4. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di supabase-config.js.
5. Commit semua file ke repositori GitHub dan aktifkan GitHub Pages.
6. Buka /admin.html untuk login dan mengelola konten.

Keamanan: hanya gunakan anon/public key pada frontend. Jangan pernah memasukkan service_role key.
Website belum dapat terhubung ke database nyata sampai Anda mengisi konfigurasi proyek Supabase milik Anda.


PEMBARUAN PORTAL ADMIN
- Ringkasan jumlah konten: seluruh konten, konten terbit, dan draf.
- Kelola berita/pengumuman/kegiatan/prestasi/PPDB: tambah, edit, hapus, unggah foto, dan pilih status terbit/draf.
- Kelola profil sekolah: nama, program keahlian, alamat, WhatsApp, email, jam layanan, judul/deskripsi beranda, profil, visi, misi, serta logo.
- Galeri pada halaman publik saat ini masih berupa pratinjau lokal, belum menjadi fitur unggah galeri permanen dari portal admin.
