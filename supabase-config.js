// Isi dengan Project URL dan anon/public key dari Supabase Dashboard.
// Aman untuk frontend hanya jika RLS/policies pada supabase_setup.sql diterapkan.
// JANGAN menaruh service_role key di file frontend.
export const SUPABASE_URL = "ISI_SUPABASE_PROJECT_URL";
export const SUPABASE_ANON_KEY = "ISI_SUPABASE_ANON_KEY";
export const supabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_URL !== "ISI_SUPABASE_PROJECT_URL" &&
  SUPABASE_ANON_KEY !== "ISI_SUPABASE_ANON_KEY";
