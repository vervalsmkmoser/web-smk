import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured as configured } from "./supabase-config.js";
const $ = id => document.getElementById(id);
const loginPanel = $("loginPanel"), appPanel = $("appPanel"), loginStatus = $("loginStatus");
let supabase = null;
let currentUser = null;
let loadingUserData = false;

function message(text, login = false) {
  const el = login ? loginStatus : $("globalStatus");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("hidden");
  el.setAttribute("role", "status");
}
function errorText(err) {
  if (!err) return "Error tidak memberikan detail.";
  const parts = [err.message, err.error, err.statusCode ? `status ${err.statusCode}` : "", err.name && err.name !== "Error" ? err.name : ""]
    .filter(Boolean);
  return parts.join(" · ") || String(err);
}
function requireAdmin() {
  if (!supabase) { message("Supabase belum dikonfigurasi."); return false; }
  if (!currentUser) { message("Sesi admin tidak terdeteksi. Silakan logout lalu login kembali."); return false; }
  return true;
}
function safeExtension(file) {
  const typeToExt = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  const ext = typeToExt[file.type];
  if (!ext) throw new Error("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
  return ext;
}
async function uploadImage(file, folder) {
  if (!file) return null;
  const ext = safeExtension(file);
  if (file.size <= 0) throw new Error("File gambar kosong atau tidak dapat dibaca.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");
  // Nama objek dibuat sederhana agar karakter/spasi dari nama file asli tidak memicu Bad Request.
  const objectPath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from("school-media").upload(objectPath, file, {
    cacheControl: "3600", upsert: false, contentType: file.type
  });
  if (error) {
    throw new Error(`Unggah ke bucket school-media gagal (${error.statusCode || "tanpa status"}): ${error.message || error.error || "tidak ada detail"}. Periksa bucket, batas ukuran/MIME, dan policy Storage.`);
  }
  const { data: urlData } = supabase.storage.from("school-media").getPublicUrl(data.path || objectPath);
  if (!urlData?.publicUrl) throw new Error("File terunggah, tetapi URL publik tidak berhasil dibuat.");
  return urlData.publicUrl;
}
async function refreshAdminData() {
  if (!currentUser || loadingUserData) return;
  loadingUserData = true;
  try { await loadSettings(); await loadNews(); }
  finally { loadingUserData = false; }
}

if (!configured) {
  message("Supabase belum dikonfigurasi. Periksa SUPABASE_URL dan SUPABASE_ANON_KEY di supabase-config.js.", true);
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const submit = e.submitter;
    if (submit) { submit.disabled = true; submit.dataset.originalText ||= submit.textContent; submit.textContent = "Memeriksa…"; }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
      if (error) message("Login gagal: " + error.message, true);
      else message("Login berhasil. Memuat data portal…", true);
    } catch (err) { message("Login gagal: " + errorText(err), true); }
    finally { if (submit) { submit.disabled = false; submit.textContent = submit.dataset.originalText || "Masuk ke portal"; } }
  });
  $("logoutBtn").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) message("Gagal logout: " + error.message);
  });
  // Jangan menjalankan query Supabase yang di-await langsung di callback auth; jadwalkan sesudah callback selesai.
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    loginPanel.classList.toggle("hidden", !!currentUser);
    appPanel.classList.toggle("hidden", !currentUser);
    $("logoutBtn").classList.toggle("hidden", !currentUser);
    if (currentUser) queueMicrotask(() => refreshAdminData().catch(err => message("Gagal memuat data admin: " + errorText(err))));
  });
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) message("Gagal membaca sesi login: " + error.message, true);
    currentUser = data?.session?.user || currentUser;
    loginPanel.classList.toggle("hidden", !!currentUser);
    appPanel.classList.toggle("hidden", !currentUser);
    $("logoutBtn").classList.toggle("hidden", !currentUser);
    if (currentUser) refreshAdminData().catch(err => message("Gagal memuat data admin: " + errorText(err)));
  }).catch(err => message("Gagal membaca sesi login: " + errorText(err), true));
}

document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  $("newsTab").classList.toggle("hidden", btn.dataset.tab !== "newsTab");
  $("settingsTab").classList.toggle("hidden", btn.dataset.tab !== "settingsTab");
}));

async function loadNews() {
  if (!supabase) return;
  const list = $("newsList"); list.innerHTML = "<p class='muted'>Memuat...</p>";
  const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
  if (error) { list.innerHTML = ""; message("Gagal memuat berita: " + error.message); return; }
  list.innerHTML = "";
  const all = data || [];
  $("totalContent").textContent = all.length;
  $("publishedContent").textContent = all.filter(n => n.status === "published").length;
  $("draftContent").textContent = all.filter(n => n.status !== "published").length;
  if (!all.length) { list.innerHTML = "<p class='muted'>Belum ada berita atau pengumuman. Tambahkan konten melalui formulir di atas.</p>"; return; }
  all.forEach(n => {
    const row = document.createElement("div"); row.className = "news-row";
    const info = document.createElement("div");
    const title = document.createElement("h3"); title.textContent = n.title || "(Tanpa judul)";
    const meta = document.createElement("p"); meta.textContent = (n.type || "Berita") + " · " + (n.date_label || "Tanpa tanggal") + " · " + (n.status === "published" ? "Terbit" : "Draf");
    const body = document.createElement("p"); body.textContent = (n.body || "").slice(0, 180); info.append(title, meta, body);
    const actions = document.createElement("div"); actions.className = "actions";
    const edit = document.createElement("button"); edit.className = "btn secondary"; edit.textContent = "Edit"; edit.onclick = () => fillNews(n);
    const del = document.createElement("button"); del.className = "btn danger"; del.textContent = "Hapus";
    del.onclick = async () => {
      if (!requireAdmin() || !confirm("Hapus konten ini?")) return;
      del.disabled = true;
      try { const { error } = await supabase.from("news").delete().eq("id", n.id); if (error) throw error; await loadNews(); message("Konten dihapus."); }
      catch (err) { message("Gagal menghapus konten: " + errorText(err)); }
      finally { del.disabled = false; }
    };
    actions.append(edit, del); row.append(info, actions); list.appendChild(row);
  });
}
function fillNews(n) {
  $("newsId").value = n.id; $("newsTitle").value = n.title || ""; $("newsType").value = n.type || "Berita";
  $("newsDate").value = n.date_label || ""; $("newsStatus").value = n.status || "draft"; $("newsBody").value = n.body || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$("resetNews").addEventListener("click", () => { $("newsForm").reset(); $("newsId").value = ""; });
$("newsForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!requireAdmin()) return;
  const submit = e.submitter;
  if (submit) { submit.disabled = true; submit.dataset.originalText ||= submit.textContent; submit.textContent = "Menyimpan…"; }
  try {
    const payload = {
      title: $("newsTitle").value.trim(), type: $("newsType").value,
      date_label: $("newsDate").value.trim(), status: $("newsStatus").value,
      body: $("newsBody").value.trim(), updated_at: new Date().toISOString()
    };
    if (!payload.title || !payload.body) throw new Error("Judul dan isi berita wajib diisi.");
    const file = $("newsImage").files?.[0];
    if (file) { message("Mengunggah foto berita…"); payload.image_url = await uploadImage(file, "news"); }
    if (!$("newsId").value) {
      payload.created_by = currentUser.id;
      const { error } = await supabase.from("news").insert(payload);
      if (error) throw new Error(`Data berita ditolak database: ${error.message}`);
    } else {
      const { error } = await supabase.from("news").update(payload).eq("id", $("newsId").value);
      if (error) throw new Error(`Perubahan berita ditolak database: ${error.message}`);
    }
    $("newsForm").reset(); $("newsId").value = "";
    await loadNews(); message("Berita/pengumuman berhasil disimpan.");
  } catch (err) { message("Gagal menyimpan konten: " + errorText(err)); }
  finally { if (submit) { submit.disabled = false; submit.textContent = submit.dataset.originalText || "Simpan"; } }
});

async function loadSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", "site").maybeSingle();
  if (error) { message("Gagal memuat informasi sekolah: " + error.message); return; }
  if (!data) return;
  const mapping = { schoolName: "school_name", majorNameInput: "major_name", address: "address", phone: "phone", emailSchool: "email", hours: "hours", heroTitleInput: "hero_title", heroSubtitleInput: "hero_subtitle", aboutTitleInput: "about_title", aboutTextInput: "about_text", vision: "vision", mission: "mission" };
  Object.entries(mapping).forEach(([field, key]) => { if (data[key] !== undefined) $(field).value = data[key] || ""; });
}
$("settingsForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!requireAdmin()) return;
  const submit = e.submitter;
  if (submit) { submit.disabled = true; submit.dataset.originalText ||= submit.textContent; submit.textContent = "Menyimpan…"; }
  try {
    const payload = {
      id: "site", school_name: $("schoolName").value.trim(), major_name: $("majorNameInput").value.trim(),
      address: $("address").value.trim(), phone: $("phone").value.trim(), email: $("emailSchool").value.trim(),
      hours: $("hours").value.trim(), hero_title: $("heroTitleInput").value.trim(), hero_subtitle: $("heroSubtitleInput").value.trim(),
      about_title: $("aboutTitleInput").value.trim(), about_text: $("aboutTextInput").value.trim(),
      vision: $("vision").value.trim(), mission: $("mission").value.trim(), updated_at: new Date().toISOString()
    };
    const file = $("logoImage").files?.[0];
    if (file) { message("Mengunggah logo sekolah…"); payload.logo_url = await uploadImage(file, "school"); }
    const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });
    if (error) throw new Error(`Informasi sekolah ditolak database: ${error.message}`);
    message("Informasi sekolah berhasil disimpan.");
  } catch (err) { message("Gagal menyimpan informasi: " + errorText(err)); }
  finally { if (submit) { submit.disabled = false; submit.textContent = submit.dataset.originalText || "Simpan perubahan"; } }
});
