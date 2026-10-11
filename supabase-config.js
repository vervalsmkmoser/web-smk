// Konfigurasi Supabase untuk website SMK Moch Sroedji Jember.
// Publishable key memang digunakan di frontend; keamanan tetap bergantung pada RLS.
// Jangan pernah menaruh secret/service_role key di frontend atau repositori publik.
export const SUPABASE_URL = "https://hhhxhnmgldazloabijhq.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Mis0jbEIz5YG30_0vQQs7A_2odoVGoS";
export const supabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_URL.endsWith("supabase.co") &&
  SUPABASE_ANON_KEY.startsWith("sb_publishable_");
