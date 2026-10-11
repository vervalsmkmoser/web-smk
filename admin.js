import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured as configured } from "./supabase-config.js";
const $ = id => document.getElementById(id);
const loginPanel=$("loginPanel"), appPanel=$("appPanel"), loginStatus=$("loginStatus");
let supabase, currentUser;
function message(text, login=false){const el=login?loginStatus:$("globalStatus");el.textContent=text;el.classList.remove("hidden");}
if (!configured) {
  message("Supabase belum dikonfigurasi. Ikuti PETUNJUK_SETUP_SUPABASE_GITHUB_PAGES.txt, lalu isi SUPABASE_URL dan SUPABASE_ANON_KEY di supabase-config.js.", true);
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email: $("email").value, password: $("password").value });
    if (error) message("Login gagal: " + error.message, true);
    else message("Login berhasil.");
  });
  $("logoutBtn").addEventListener("click", async () => { await supabase.auth.signOut(); });
  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    loginPanel.classList.toggle("hidden", !!currentUser);
    appPanel.classList.toggle("hidden", !currentUser);
    $("logoutBtn").classList.toggle("hidden", !currentUser);
    if (currentUser) { await loadSettings(); await loadNews(); }
  });
}
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll("[data-tab]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
 $("newsTab").classList.toggle("hidden",btn.dataset.tab!=="newsTab");$("settingsTab").classList.toggle("hidden",btn.dataset.tab!=="settingsTab");
}));
async function loadNews(){
 const list=$("newsList");list.innerHTML="<p class='muted'>Memuat...</p>";
 const { data, error } = await supabase.from("news").select("*").order("created_at",{ascending:false});
 if(error){message("Gagal memuat berita: "+error.message);return;}
 list.innerHTML="";
 const all = data || [];
 $("totalContent").textContent = all.length;
 $("publishedContent").textContent = all.filter(n=>n.status==="published").length;
 $("draftContent").textContent = all.filter(n=>n.status!=="published").length;
 if(!all.length){list.innerHTML="<p class='muted'>Belum ada berita atau pengumuman. Tambahkan konten melalui formulir di atas.</p>";return;}
 all.forEach(n=>{
   const row=document.createElement("div");row.className="news-row";
   const info=document.createElement("div");const title=document.createElement("h3");title.textContent=n.title||"(Tanpa judul)";
   const meta=document.createElement("p");meta.textContent=(n.type||"Berita")+" · "+(n.date_label||"Tanpa tanggal")+" · "+(n.status==="published"?"Terbit":"Draf");
   const body=document.createElement("p");body.textContent=(n.body||"").slice(0,180);info.append(title,meta,body);
   const actions=document.createElement("div");actions.className="actions";
   const edit=document.createElement("button");edit.className="btn secondary";edit.textContent="Edit";edit.onclick=()=>fillNews(n);
   const del=document.createElement("button");del.className="btn danger";del.textContent="Hapus";del.onclick=async()=>{if(confirm("Hapus konten ini?")){const {error}=await supabase.from("news").delete().eq("id",n.id);if(error)message("Gagal menghapus: "+error.message);else{await loadNews();message("Konten dihapus.");}}};
   actions.append(edit,del);row.append(info,actions);list.appendChild(row);
 });
}
function fillNews(n){$("newsId").value=n.id;$("newsTitle").value=n.title||"";$("newsType").value=n.type||"Berita";$("newsDate").value=n.date_label||"";$("newsStatus").value=n.status||"draft";$("newsBody").value=n.body||"";window.scrollTo({top:0,behavior:"smooth"});}
$("resetNews").addEventListener("click",()=>{$("newsForm").reset();$("newsId").value="";});
$("newsForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!currentUser)return;
 try{
  let imageUrl="";
  const file=$("newsImage").files[0];
  if(file){
   if(!file.type.startsWith("image/"))throw new Error("File harus berupa gambar.");
   if(file.size>5*1024*1024)throw new Error("Ukuran foto maksimal 5 MB.");
   const path=`news/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
   const {error:uploadError}=await supabase.storage.from("school-media").upload(path,file,{upsert:false,contentType:file.type});
   if(uploadError)throw uploadError;
   const {data:urlData}=supabase.storage.from("school-media").getPublicUrl(path);imageUrl=urlData.publicUrl;
  }
  const payload={title:$("newsTitle").value.trim(),type:$("newsType").value,date_label:$("newsDate").value.trim(),status:$("newsStatus").value,body:$("newsBody").value.trim(),updated_at:new Date().toISOString()};
  if(imageUrl)payload.image_url=imageUrl;
  if(!$("newsId").value){payload.created_by=currentUser.id;const {error}=await supabase.from("news").insert(payload);if(error)throw error;}
  else {const {error}=await supabase.from("news").update(payload).eq("id",$("newsId").value);if(error)throw error;}
  $("newsForm").reset();$("newsId").value="";await loadNews();message("Berita/pengumuman berhasil disimpan.");
 }catch(err){message("Gagal menyimpan konten: "+(err.message||String(err)));}
});
async function loadSettings(){
 const {data,error}=await supabase.from("site_settings").select("*").eq("id","site").maybeSingle();
 if(error){message("Gagal memuat informasi sekolah: "+error.message);return;}if(!data)return;
 const mapping={schoolName:"school_name",majorNameInput:"major_name",address:"address",phone:"phone",emailSchool:"email",hours:"hours",heroTitleInput:"hero_title",heroSubtitleInput:"hero_subtitle",aboutTitleInput:"about_title",aboutTextInput:"about_text",vision:"vision",mission:"mission"};
 Object.entries(mapping).forEach(([field,key])=>{if(data[key]!==undefined)$(field).value=data[key]||"";});
}
$("settingsForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!currentUser)return;
 try{
  const payload={id:"site",school_name:$("schoolName").value.trim(),major_name:$("majorNameInput").value.trim(),address:$("address").value.trim(),phone:$("phone").value.trim(),email:$("emailSchool").value.trim(),hours:$("hours").value.trim(),hero_title:$("heroTitleInput").value.trim(),hero_subtitle:$("heroSubtitleInput").value.trim(),about_title:$("aboutTitleInput").value.trim(),about_text:$("aboutTextInput").value.trim(),vision:$("vision").value.trim(),mission:$("mission").value.trim(),updated_at:new Date().toISOString()};
  const file=$("logoImage").files[0];
  if(file){
   if(!file.type.startsWith("image/"))throw new Error("Logo harus berupa gambar.");
   if(file.size>5*1024*1024)throw new Error("Ukuran logo maksimal 5 MB.");
   const path=`school/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
   const {error:uploadError}=await supabase.storage.from("school-media").upload(path,file,{upsert:false,contentType:file.type});if(uploadError)throw uploadError;
   const {data:urlData}=supabase.storage.from("school-media").getPublicUrl(path);payload.logo_url=urlData.publicUrl;
  }
  const {error}=await supabase.from("site_settings").upsert(payload,{onConflict:"id"});if(error)throw error;message("Informasi sekolah berhasil disimpan.");
 }catch(err){message("Gagal menyimpan informasi: "+(err.message||String(err)));}
});
