/*
  KONFIGURASI SUPABASE:
  Masukkan Project URL dan anon/public key dari Supabase Dashboard > Project Settings > API.
  Jangan pernah memasukkan service_role key ke dalam website.
*/
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured as configured } from "./supabase-config.js";

if (configured) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: settings, error: settingsError } = await supabase.from("site_settings").select("*").eq("id", "site").maybeSingle();
    if (!settingsError && settings) {
      const setText = (id, value) => { const el = document.getElementById(id); if (el && value) el.textContent = value; };
      setText("schoolAddress", settings.address);
      setText("schoolPhone", settings.phone);
      setText("heroTitle", settings.hero_title);
      setText("heroSubtitle", settings.hero_subtitle);
      setText("aboutTitle", settings.about_title);
      setText("aboutText", settings.about_text);
      setText("schoolVision", settings.vision);
      setText("schoolMission", settings.mission);
      setText("majorName", settings.major_name);
      if (settings.school_name) {
        document.querySelectorAll('.brand > div:nth-child(2)').forEach(el => { el.childNodes[0].textContent = settings.school_name; });
      }
      if (settings.logo_url) {
        ["brandLogo", "heroLogo"].forEach(id => {
          const el = document.getElementById(id);
          if (el) { el.textContent = ""; const img = document.createElement("img"); img.src = settings.logo_url; img.alt = "Logo SMK Moch Sroedji Jember"; el.appendChild(img); }
        });
      }
      if (settings.email) {
        const emailEl = document.querySelector('#kontak .contact-item:nth-of-type(3) span');
        if (emailEl) emailEl.textContent = settings.email;
      }
      if (settings.hours) {
        const hoursEl = document.querySelector('#kontak .contact-item:nth-of-type(4) span');
        if (hoursEl) hoursEl.textContent = settings.hours;
      }
    }
    const { data: news, error: newsError } = await supabase.from("news").select("id,title,type,date_label,status,body,image_url,created_at").eq("status", "published").order("created_at", { ascending: false }).limit(9);
    const feed = document.getElementById("publicNewsFeed");
    const status = document.getElementById("newsStatus");
    if (!newsError && feed) {
      if (news && news.length) {
        feed.innerHTML = "";
        news.forEach(n => {
          const article = document.createElement("article"); article.className = "card";
          if (n.image_url) {
            const img = document.createElement("img"); img.src = n.image_url; img.alt = n.title || "Foto berita"; img.style.cssText = "width:100%;height:150px;object-fit:cover"; article.appendChild(img);
          } else {
            const visual = document.createElement("div"); visual.className = "news-visual"; visual.textContent = n.type === "Pengumuman" ? "📣" : "📰"; article.appendChild(visual);
          }
          const content = document.createElement("div"); content.className = "news-content";
          const small = document.createElement("small"); small.textContent = (n.type || "BERITA").toUpperCase();
          const title = document.createElement("h3"); title.textContent = n.title || "Tanpa judul";
          const date = document.createElement("p"); date.textContent = n.date_label || "";
          const body = document.createElement("p"); body.textContent = n.body || "";
          content.append(small, title, date, body); article.appendChild(content); feed.appendChild(article);
        });
        if (status) status.textContent = "Berita dan pengumuman resmi sekolah.";
      } else if (status) status.textContent = "Belum ada berita atau pengumuman yang diterbitkan.";
    }
  } catch (err) {
    console.warn("Data portal Supabase belum dapat dimuat. Periksa konfigurasi dan kebijakan RLS.", err);
  }
}

// Ganti nomor WhatsApp di bawah dengan nomor resmi sekolah, format internasional tanpa tanda + atau spasi.
const SCHOOL_WHATSAPP = "6282235003417"; // Ganti bila nomor resmi sekolah berbeda.
const menu=document.getElementById('menu'),nav=document.getElementById('navlinks');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'✕':'☰'});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}));
document.getElementById('year').textContent=new Date().getFullYear();
// Logo dapat dipratinjau dengan memilih file gambar di kontrol logo tersembunyi yang ditambahkan saat logo diunggah.
document.querySelectorAll('.gallery-tile input').forEach(input=>input.addEventListener('change',()=>{const file=input.files&&input.files[0];if(!file)return;if(!file.type.startsWith('image/'))return;const tile=input.closest('.gallery-tile');const img=tile.querySelector('img');img.src=URL.createObjectURL(file);tile.classList.add('has-image')}));
document.getElementById('clearGallery').addEventListener('click',()=>document.querySelectorAll('.gallery-tile').forEach(tile=>{const img=tile.querySelector('img');if(img.src.startsWith('blob:'))URL.revokeObjectURL(img.src);img.removeAttribute('src');tile.classList.remove('has-image');tile.querySelector('input').value=''}));
let preparedPpdb='';
document.getElementById('ppdbForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);preparedPpdb=`Halo panitia PPDB/ SPMB SMK Moch Sroedji Jember. Saya ingin bertanya mengenai pendaftaran.\nNama calon siswa: ${f.get('nama')}\nAsal sekolah: ${f.get('asal')}\nNomor WhatsApp: ${f.get('hp')}\nMinat program keahlian: ${f.get('jurusan')||'-'}\nPertanyaan: ${f.get('pesan')||'-'}`;const result=document.getElementById('ppdbResult');result.textContent=preparedPpdb;result.style.display='block';document.getElementById('copyPpdb').style.display='inline-flex';if(SCHOOL_WHATSAPP){window.open('https://wa.me/'+SCHOOL_WHATSAPP+'?text='+encodeURIComponent(preparedPpdb),'_blank','noopener')}});
document.getElementById('copyPpdb').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(preparedPpdb);document.getElementById('copyPpdb').textContent='Tersalin ✓'}catch(e){document.getElementById('ppdbResult').textContent=preparedPpdb+'\n\nSilakan salin teks di atas secara manual.'}});
document.getElementById('contactForm').addEventListener('submit',e=>{e.preventDefault();const msg=`Halo SMK Moch Sroedji Jember, saya ${document.getElementById('cNama').value} (${document.getElementById('cPeran').value}). Kontak: ${document.getElementById('cKontak').value}. Pesan: ${document.getElementById('cPesan').value}`;const note=document.getElementById('contactNote');if(SCHOOL_WHATSAPP){window.open('https://wa.me/'+SCHOOL_WHATSAPP+'?text='+encodeURIComponent(msg),'_blank','noopener');note.textContent='WhatsApp dibuka dengan draf pesan. Silakan periksa lalu kirim.'}else{note.textContent='Nomor WhatsApp sekolah belum diatur. Pesan yang disiapkan: '+msg}});
