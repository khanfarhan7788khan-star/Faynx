/* ═══════════════════════════════════════════
   FAYNX app.js — Fixed & Complete
   Fixes:
   - selectedQuality used before declaration → moved to top
   - applyPrefs called before selectedQuality declared → reordered
   - renderPin called with 3rd arg but gallery was const, fixed
   - loadPhotos retry button calls loadPhotos(true) but fn not global → exposed
   - newCollSave: auth.currentUser may be null → guard added
   - heroBanner.style.display crashed if element missing → optional chain
   - header scroll: uses id "header" but element has class "header" → fixed to use class
   - install popup: PWA beforeinstallprompt wired + cookie so it only shows once per day
   - All event listeners guarded with ?. to prevent null crashes
   - Favorite save button on card now syncs state from userData on render
═══════════════════════════════════════════ */

/*──────────── FIREBASE ────────────*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const FB   = initializeApp({ apiKey:"AIzaSyDWcWf_vcl_OLRM1Lj-Heh20k2zJqmGLok", authDomain:"faynx0.firebaseapp.com", projectId:"faynx0" });
const auth = getAuth(FB);
const db   = getFirestore(FB);

/*──────────── UNSPLASH ────────────*/
const KEY  = "FMEevPJq5OgeZ4W2-k2fDpwchFyA_cyYhvs2HoDC6UM";
const BASE = "https://api.unsplash.com";
const H    = () => ({ Authorization: `Client-ID ${KEY}` });

const API = {
  async topics()                     { const r=await fetch(`${BASE}/topics?per_page=20&order_by=featured`,{headers:H()}); if(!r.ok)throw 0; return r.json(); },
  async topicPhotos(slug,pg=1)       { const r=await fetch(`${BASE}/topics/${slug}/photos?page=${pg}&per_page=20&order_by=popular`,{headers:H()}); if(!r.ok)throw 0; return r.json(); },
  async search(q,pg=1)               { const r=await fetch(`${BASE}/search/photos?query=${encodeURIComponent(q)}&page=${pg}&per_page=20`,{headers:H()}); if(!r.ok)throw 0; const d=await r.json(); return d.results; },
  async random(n=8)                  { const r=await fetch(`${BASE}/photos/random?count=${n}&topics=wallpapers`,{headers:H()}); if(!r.ok)throw 0; return r.json(); },
  async trackDownload(photo)         { try{await fetch(photo.links.download_location,{headers:H()});}catch{} }
};

/*──────────── HELPERS ────────────*/
const $   = id => document.getElementById(id);
const el  = id => document.getElementById(id);  // alias

function toast(msg, type="info") {
  const c = $("toastContainer"); if(!c) return;
  const t = document.createElement("div");
  t.className = `toast ${type}`; t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 320); }, 2800);
}

function fmt(n) {
  if(!n && n!==0) return "—";
  if(n>=1e6) return (n/1e6).toFixed(1)+"M";
  if(n>=1e3) return (n/1e3).toFixed(1)+"k";
  return String(n);
}

function setCookie(name, val, days) {
  const d = new Date(); d.setTime(d.getTime()+(days*864e5));
  document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/`;
}
function getCookie(name) {
  const v = document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)'));
  return v ? v[2] : null;
}

/*──────────── USER DATA ────────────*/
let userData = {
  favorites:[], collections:{}, downloads:[], premium:false,
  prefs:{ quality:"regular", layout:"masonry", safeSearch:true }
};

// ← selectedQuality MUST be declared before applyPrefs
let selectedQuality = "regular";

async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db,"users",uid));
    if(snap.exists()) {
      const d = snap.data();
      userData.favorites   = Array.isArray(d.favorites)   ? d.favorites   : [];
      userData.collections = d.collections && typeof d.collections==="object" ? d.collections : {};
      userData.downloads   = Array.isArray(d.downloads)   ? d.downloads   : [];
      userData.premium     = !!d.premium;
      userData.prefs       = { ...userData.prefs, ...(d.prefs||{}) };
    }
    applyPrefs();
    updateProfileUI();
  } catch(e) { console.warn("loadUserData",e); }
}

async function saveUserData(uid) {
  if(!uid) return;
  try {
    await setDoc(doc(db,"users",uid), {
      favorites:userData.favorites, collections:userData.collections,
      downloads:userData.downloads, premium:userData.premium, prefs:userData.prefs
    }, { merge:true });
  } catch(e) { console.warn("saveUserData",e); }
}

function applyPrefs() {
  const q = userData.prefs.quality  || "regular";
  const l = userData.prefs.layout   || "masonry";
  selectedQuality = q;
  const dq = $("defaultQuality"); if(dq) dq.value = q;
  const dl = $("defaultLayout");  if(dl) dl.value = l;
  const ss = $("safeSearch");     if(ss) ss.checked = userData.prefs.safeSearch !== false;
  applyLayout(l);
}

function applyLayout(l) {
  const g = $("gallery"); if(!g) return;
  if(l==="grid") {
    g.classList.add("grid-view");
    $("viewGrid")?.classList.add("active");
    $("viewMasonry")?.classList.remove("active");
  } else {
    g.classList.remove("grid-view");
    $("viewMasonry")?.classList.add("active");
    $("viewGrid")?.classList.remove("active");
  }
}

function savePrefs() { const u=auth.currentUser; if(u) saveUserData(u.uid); }

/*──────────── INSTALL POPUP ────────────*/
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function initInstallPopup() {
  // Show if not dismissed today and not already installed
  if(getCookie("faynx_install_dismissed")) return;
  if(window.matchMedia("(display-mode: standalone)").matches) return;

  const popup = $("installPopup");
  if(!popup) return;

  // Show after 3 seconds
  setTimeout(() => popup.classList.add("show"), 3000);

  $("installConfirmBtn")?.addEventListener("click", async () => {
    popup.classList.remove("show");
    if(deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if(outcome === "accepted") toast("App installed! 🎉","success");
      deferredInstallPrompt = null;
    } else {
      // iOS Safari — show instructions
      toast("Tap Share → 'Add to Home Screen' to install","info");
    }
    setCookie("faynx_install_dismissed","1",1);
  });

  $("installLaterBtn")?.addEventListener("click", () => {
    popup.classList.remove("show");
    setCookie("faynx_install_dismissed","1",1);
  });

  $("installCloseBtn")?.addEventListener("click", () => {
    popup.classList.remove("show");
    setCookie("faynx_install_dismissed","1",1);
  });
}

/*──────────── SPLASH ────────────*/
(function() {
  const sp  = $("splash");
  const bar = $("splashBar");
  if(!sp) return;
  let w = 0;
  const iv = setInterval(() => {
    w = Math.min(w + Math.random()*28, 88);
    if(bar) bar.style.width = w+"%";
  }, 180);
  const done = () => {
    clearInterval(iv);
    if(bar) bar.style.width = "100%";
    setTimeout(() => sp.classList.add("out"), 380);
  };
  if(document.readyState === "complete") { done(); }
  else { window.addEventListener("load", done); }
  // Failsafe
  setTimeout(done, 4000);
})();

/*──────────── HERO BANNER ────────────*/
const HERO_TAGS = ["neon city","mountains sunrise","abstract art","ocean waves","dark forest","space galaxy","cherry blossoms","rainy street"];

function initHero() {
  const wrap = $("heroTags"); if(!wrap) return;
  HERO_TAGS.forEach(tag => {
    const b = document.createElement("button");
    b.className = "hero-tag"; b.textContent = tag; b.type = "button";
    b.addEventListener("click", () => {
      const hsi = $("heroSearchInput"); if(hsi) hsi.value = tag;
      $("heroSearchBtn")?.click();
    });
    wrap.appendChild(b);
  });
}

async function setHeroBg() {
  try {
    const photos = await API.random(5);
    const bg = $("heroBg"); if(!bg || !photos?.length) return;
    let i = 0;
    const set = () => { bg.style.backgroundImage = `url(${photos[i].urls.regular})`; };
    set();
    setInterval(() => { i=(i+1)%photos.length; set(); }, 6000);
  } catch {}
}

/*──────────── SEARCH SUGGESTIONS ────────────*/
const SUGGESTIONS = [
  "anime wallpaper","dark aesthetic","minimalist","neon lights","cyberpunk city",
  "forest morning","ocean sunset","abstract","mountain landscape","space nebula",
  "black and white","vintage","flowers macro","city night","rainy street",
  "geometric","night sky","tropical beach","autumn leaves","cozy interior"
];

let suggTimer;
function initSearchSuggestions() {
  const inp  = $("searchInput");
  const drop = $("suggestionsDrop");
  if(!inp || !drop) return;

  inp.addEventListener("input", e => {
    const val = e.target.value.trim().toLowerCase();
    clearTimeout(suggTimer);
    if(!val) { drop.classList.add("hidden"); return; }
    suggTimer = setTimeout(() => {
      const hits = SUGGESTIONS.filter(s => s.includes(val)).slice(0,6);
      if(!hits.length) { drop.classList.add("hidden"); return; }
      drop.innerHTML = hits.map(m =>
        `<div class="sugg-item" data-q="${m}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="7.5"/><path d="m20 20-4-4"/></svg>
          ${m}</div>`).join("");
      drop.classList.remove("hidden");
      drop.querySelectorAll(".sugg-item").forEach(el => {
        el.addEventListener("click", () => {
          inp.value = el.dataset.q;
          drop.classList.add("hidden");
          triggerSearch(el.dataset.q);
        });
      });
    }, 180);
  });

  document.addEventListener("click", e => {
    if(!inp.contains(e.target) && !drop.contains(e.target)) drop.classList.add("hidden");
  });
}

/*──────────── TOPICS BAR ────────────*/
const FALLBACK_TOPICS = [
  {slug:"wallpapers",title:"✨ All"},{slug:"nature",title:"🌿 Nature"},
  {slug:"architecture-interior",title:"🏛 Architecture"},{slug:"travel",title:"✈️ Travel"},
  {slug:"street-photography",title:"🌆 Street"},{slug:"experimental",title:"🎨 Abstract"},
  {slug:"textures-patterns",title:"🔲 Textures"},{slug:"animals",title:"🐾 Animals"},
  {slug:"fashion-beauty",title:"💄 Fashion"},{slug:"film",title:"🎞 Film"},
  {slug:"food-drink",title:"🍜 Food"},{slug:"athletics",title:"🏃 Sport"},
];

async function buildTopics() {
  const bar = $("topicsBar"); if(!bar) return;
  let topics = FALLBACK_TOPICS;
  try {
    const live = await API.topics();
    if(live?.length) {
      const em = Object.fromEntries(FALLBACK_TOPICS.map(t=>[t.slug, t.title.split(" ")[0]]));
      topics = live.map(t => ({ slug:t.slug, title:(em[t.slug]||"")+" "+t.title }));
    }
  } catch {}
  topics.forEach((t,i) => {
    const btn = document.createElement("button");
    btn.className = "topic-btn"+(i===0?" active":"");
    btn.textContent = t.title; btn.dataset.slug = t.slug; btn.type = "button";
    btn.addEventListener("click", () => {
      document.querySelectorAll(".topic-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const si = $("searchInput"); if(si) si.value="";
      const mi = $("mobileSearchInput"); if(mi) mi.value="";
      const st = $("sectionTitle"); if(st) st.textContent = t.title.replace(/^\S+ /,"")+" Wallpapers";
      feedMode="topic"; feedSlug=t.slug; searchQuery="";
      loadPhotos(true);
    });
    bar.appendChild(btn);
  });
}

/*──────────── GALLERY STATE ────────────*/
let page=1, feedMode="topic", feedSlug="wallpapers", searchQuery="";
let isLoading=false, noMore=false, reqId=0, controller=null;
window.allPhotos=[];

let currentPhotos=[], currentIndex=0, lightboxPhoto=null;

/*──────────── SEARCH HANDLER ────────────*/
let sTimer;
function handleSearch(val) {
  clearTimeout(sTimer);
  sTimer = setTimeout(() => {
    document.querySelectorAll(".topic-btn").forEach(b=>b.classList.remove("active"));
    const q = val.trim();
    if(q) {
      feedMode="search"; searchQuery=q;
      const st=$("sectionTitle"); if(st) st.textContent=`Results for "${q}"`;
    } else {
      feedMode="topic"; feedSlug="wallpapers"; searchQuery="";
      document.querySelector(".topic-btn")?.classList.add("active");
      const st=$("sectionTitle"); if(st) st.textContent="Trending Wallpapers";
    }
    const hb=$("heroBanner"); if(hb) hb.style.display="none";
    loadPhotos(true);
  }, 380);
}

$("searchInput")?.addEventListener("input",      e => handleSearch(e.target.value));
$("mobileSearchInput")?.addEventListener("input", e => handleSearch(e.target.value));

// Global so inline onclick can call it
window._triggerSearch = triggerSearch;
function triggerSearch(q) {
  const si = $("searchInput"); if(si) si.value = q;
  handleSearch(q);
}

// View toggle
$("viewMasonry")?.addEventListener("click", () => { userData.prefs.layout="masonry"; applyLayout("masonry"); savePrefs(); });
$("viewGrid")?.addEventListener("click",    () => { userData.prefs.layout="grid";    applyLayout("grid");    savePrefs(); });

/*──────────── GALLERY ────────────*/
const gallery = $("gallery");

// Expose for retry button
window.loadPhotos = loadPhotos;

async function loadPhotos(reset=false) {
  if(!gallery) return;
  if(isLoading && !reset) return;
  if(noMore    && !reset) return;
  isLoading=true; noMore=false;

  const id=++reqId;
  if(controller) controller.abort();
  controller = new AbortController();

  if(reset) { gallery.innerHTML=""; page=1; window.allPhotos=[]; $("endOfFeed")?.classList.add("hidden"); }

  // Skeletons only on first page
  if(page===1) showSkeletons();
  else $("loadSpinner")?.classList.remove("hidden");

  try {
    let photos=[];
    if(feedMode==="search") photos = await API.search(searchQuery, page);
    else                    photos = await API.topicPhotos(feedSlug, page);

    if(id!==reqId) return;  // stale request

    if(!photos?.length) {
      if(page===1) showError("Nothing found — try a different search");
      noMore=true;
      if(page>1) $("endOfFeed")?.classList.remove("hidden");
      return;
    }

    window.allPhotos = [...window.allPhotos, ...photos].slice(-300);
    photos.forEach((p,i) => renderPin(p, i, gallery));
    page++;

  } catch(err) {
    if(err?.name!=="AbortError" && id===reqId)
      if(page===1) showError("Couldn't load wallpapers. Check your connection.");
  } finally {
    removeSkeletons();
    $("loadSpinner")?.classList.add("hidden");
    isLoading=false;
  }
}

window.addEventListener("scroll", () => {
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadPhotos();
}, { passive:true });

/*──────────── SKELETONS ────────────*/
const SKH=[280,200,340,250,190,315,220,290,170,355,235,265,300,180,310];
function showSkeletons() {
  removeSkeletons();
  SKH.forEach(h => {
    const s=document.createElement("div");
    s.className="pin-skeleton"; s.style.height=h+"px";
    gallery.appendChild(s);
  });
}
function removeSkeletons() { gallery?.querySelectorAll(".pin-skeleton").forEach(e=>e.remove()); }
function showError(msg) {
  gallery.innerHTML = `<div class="error-state"><div class="err-ico">😵</div><p>${msg}</p><button class="retry-btn" onclick="loadPhotos(true)" type="button">Retry</button></div>`;
}

/*──────────── RENDER CARD ────────────*/
function renderPin(photo, idx=0, container=gallery) {
  if(!container) return;
  const card = document.createElement("div");
  card.className="pin-card";
  card.style.animationDelay=`${Math.min(idx,12)*40}ms`;
  card.style.background = photo.color||"#1c1c21";

  const img = document.createElement("img");
  img.className="pin-img"; img.loading="lazy";
  img.alt = photo.alt_description||"";
  img.style.aspectRatio = `${photo.width}/${photo.height}`;
  img.src = photo.urls.small;
  img.style.opacity="0"; img.style.transition="opacity 0.35s ease";
  img.onload = () => { img.style.opacity="1"; };
  img.onerror = () => { img.style.opacity="1"; };  // don't leave blank

  const ov = document.createElement("div"); ov.className="pin-overlay";
  const top = document.createElement("div"); top.className="pin-top-row";
  const bot = document.createElement("div"); bot.className="pin-bot-row";

  // Save button
  const saveBtn = document.createElement("button");
  saveBtn.className="pin-save-btn"; saveBtn.type="button";
  const alreadySaved = userData.favorites.some(f=>f.id===photo.id);
  saveBtn.textContent = alreadySaved ? "Saved ✓" : "Save";
  if(alreadySaved) saveBtn.classList.add("saved");

  saveBtn.addEventListener("click", async e => {
    e.stopPropagation();
    if(!auth.currentUser) { openAuth(); return; }
    const state = await toggleFav(photo);
    saveBtn.textContent = state ? "Saved ✓" : "Save";
    saveBtn.classList.toggle("saved", state);
    toast(state?"Saved 💖":"Removed", state?"success":"info");
  });

  // Share button
  const shareBtn = document.createElement("button");
  shareBtn.className="pin-icon-btn"; shareBtn.type="button"; shareBtn.title="Share";
  shareBtn.innerHTML=`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
  shareBtn.addEventListener("click", async e => {
    e.stopPropagation();
    const url = photo.links.html+"?utm_source=faynx&utm_medium=referral";
    try {
      if(navigator.share) await navigator.share({ title:"Faynx Wallpaper", url });
      else { await navigator.clipboard.writeText(url); toast("Link copied!","success"); }
    } catch {}
  });

  // Credit + likes
  const credit = document.createElement("div");
  credit.className="pin-credit"; credit.textContent=`📷 ${photo.user?.name||""}`;

  const likes = document.createElement("span");
  likes.className="pin-likes-badge";
  likes.textContent = (photo.likes||0)>999 ? fmt(photo.likes)+" ♥" : `${photo.likes||0} ♥`;

  top.append(saveBtn, shareBtn);
  bot.append(credit, likes);
  ov.append(top, bot);
  card.append(img, ov);
  card.addEventListener("click", () => openLightbox(photo));
  container.appendChild(card);
}

/*──────────── LIGHTBOX ────────────*/
function openLightbox(photo) {
  currentPhotos = window.allPhotos.length ? window.allPhotos : [photo];
  currentIndex  = currentPhotos.findIndex(p=>p.id===photo.id);
  if(currentIndex===-1) { currentPhotos=[photo]; currentIndex=0; }
  lightboxPhoto = photo;
  $("lightbox")?.classList.remove("hidden");
  document.body.style.overflow="hidden";
  renderLightbox();
}

function closeLightbox() {
  $("lightbox")?.classList.add("hidden");
  document.body.style.overflow="";
}

function renderLightbox() {
  const p = currentPhotos[currentIndex];
  if(!p) return;
  lightboxPhoto = p;

  // Image
  const lbImg = $("lbImg");
  const lbShimmer = $("lbShimmer");
  if(lbShimmer) lbShimmer.classList.add("on");
  if(lbImg) lbImg.style.opacity="0";
  const src = p.urls[selectedQuality] || p.urls.regular;
  const tmp = new Image();
  tmp.src = src;
  tmp.onload  = () => { if(lbImg){lbImg.src=tmp.src; lbImg.style.opacity="1";} if(lbShimmer) lbShimmer.classList.remove("on"); };
  tmp.onerror = () => { if(lbImg){lbImg.src=p.urls.regular; lbImg.style.opacity="1";} if(lbShimmer) lbShimmer.classList.remove("on"); };

  // Author
  const av = $("lbAuthorAv");
  if(av) { av.src = p.user?.profile_image?.medium||""; av.onerror=()=>{av.style.display="none"}; }
  const an = $("lbAuthorName");   if(an) an.textContent = p.user?.name||"";
  const ah = $("lbAuthorHandle"); if(ah) ah.textContent = p.user?.username ? `@${p.user.username}` : "";

  // Description
  const desc = $("lbDesc");
  if(desc) { desc.textContent=p.description||p.alt_description||""; desc.style.display=desc.textContent?"":"none"; }

  // Color palette
  const pal = $("lbPalette");
  if(pal) {
    pal.innerHTML="";
    if(p.color) {
      [p.color, lightenHex(p.color,30), darkenHex(p.color,30)].forEach(c=>{
        const sw=document.createElement("div");
        sw.className="lb-swatch"; sw.style.background=c; sw.title=c;
        sw.addEventListener("click",async()=>{ await navigator.clipboard.writeText(c); toast(`Copied ${c}!`,"success"); });
        pal.appendChild(sw);
      });
    }
  }

  // Tags
  const tags = $("lbTags");
  if(tags) {
    tags.innerHTML="";
    (p.tags||[]).slice(0,10).forEach(t=>{
      const span=document.createElement("span");
      span.className="lb-tag"; span.textContent=t.title;
      span.addEventListener("click",()=>{ closeLightbox(); triggerSearch(t.title); });
      tags.appendChild(span);
    });
  }

  // Stats
  const stats = $("lbStats");
  if(stats) stats.innerHTML=`
    <div class="lb-stat"><span class="lb-stat-v">${fmt(p.likes)}</span><span class="lb-stat-l">Likes</span></div>
    <div class="lb-stat"><span class="lb-stat-v">${fmt(p.downloads||0)}</span><span class="lb-stat-l">Downloads</span></div>
    <div class="lb-stat"><span class="lb-stat-v">${p.width}×${p.height}</span><span class="lb-stat-l">Resolution</span></div>
    <div class="lb-stat"><span class="lb-stat-v">${p.exif?.model||"—"}</span><span class="lb-stat-l">Camera</span></div>`;

  // Nav
  const prev=$("lbPrev"), next=$("lbNext");
  if(prev) prev.disabled = currentIndex===0;
  if(next) next.disabled = currentIndex>=currentPhotos.length-1;
  const ctr=$("lbCounter"); if(ctr) ctr.textContent=`${currentIndex+1} / ${currentPhotos.length}`;

  // Save state
  updateLbSaveBtn(p);

  // Attribution
  const alink=$("lbUnsplashLink"); if(alink) alink.href=p.links?.html+"?utm_source=faynx&utm_medium=referral";
  const aname=$("lbAttribName");  if(aname) aname.textContent=p.user?.name||"";

  // Preload neighbours
  const nx=currentPhotos[currentIndex+1]; if(nx) new Image().src=nx.urls.regular;
  const pv=currentPhotos[currentIndex-1]; if(pv) new Image().src=pv.urls.regular;
}

function updateLbSaveBtn(photo) {
  const btn = $("lbSave"); if(!btn) return;
  const saved = userData.favorites.some(f=>f.id===photo.id);
  btn.classList.toggle("saved", saved);
  btn.innerHTML = saved
    ? `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Saved`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Save`;
}

// Lightbox event listeners
$("lbClose")?.addEventListener("click", closeLightbox);
$("lbBackdrop")?.addEventListener("click", closeLightbox);
$("lbPrev")?.addEventListener("click", () => { if(currentIndex>0){currentIndex--;renderLightbox();} });
$("lbNext")?.addEventListener("click", () => { if(currentIndex<currentPhotos.length-1){currentIndex++;renderLightbox();} });

document.addEventListener("keydown", e => {
  if($("lightbox")?.classList.contains("hidden")) return;
  if(e.key==="ArrowRight" && currentIndex<currentPhotos.length-1) { currentIndex++; renderLightbox(); }
  if(e.key==="ArrowLeft"  && currentIndex>0)                       { currentIndex--; renderLightbox(); }
  if(e.key==="Escape") closeLightbox();
});

// Swipe
let _tx=0, _ty=0;
$("lightbox")?.addEventListener("touchstart", e=>{_tx=e.touches[0].clientX;_ty=e.touches[0].clientY;},{passive:true});
$("lightbox")?.addEventListener("touchend", e=>{
  const dx=_tx-e.changedTouches[0].clientX;
  const dy=Math.abs(_ty-e.changedTouches[0].clientY);
  if(Math.abs(dx)>60 && dy<80) {
    if(dx>0 && currentIndex<currentPhotos.length-1){currentIndex++;renderLightbox();}
    if(dx<0 && currentIndex>0){currentIndex--;renderLightbox();}
  }
},{passive:true});

// Quality pills
$("qpills")?.addEventListener("click", e=>{
  const btn=e.target.closest(".qp"); if(!btn) return;
  $("qpills").querySelectorAll(".qp").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  selectedQuality=btn.dataset.q;
  renderLightbox();
});

// Download
$("lbDownload")?.addEventListener("click", async () => {
  const p=currentPhotos[currentIndex]; if(!p) return;
  toast("Preparing download…","info");
  try {
    await API.trackDownload(p);
    const url=p.urls[selectedQuality]||p.urls.full||p.urls.regular;
    const res=await fetch(url);
    const blob=await res.blob();
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=`faynx-${p.id}.jpg`; a.click();
    toast("Download started! 🎉","success");
    recordDownload(p);
  } catch { toast("Download failed","error"); }
});

// Save
$("lbSave")?.addEventListener("click", async () => {
  if(!auth.currentUser){openAuth();return;}
  const p=currentPhotos[currentIndex]; if(!p) return;
  const state=await toggleFav(p);
  updateLbSaveBtn(p);
  toast(state?"Saved 💖":"Removed", state?"success":"info");
});

// Copy
$("lbCopy")?.addEventListener("click", async () => {
  const p=currentPhotos[currentIndex]; if(!p) return;
  try { await navigator.clipboard.writeText(p.urls.regular); toast("Image URL copied!","success"); }
  catch { toast("Copy failed","error"); }
});

// Share
$("lbShare")?.addEventListener("click", async () => {
  const p=currentPhotos[currentIndex]; if(!p) return;
  const url=p.links?.html+"?utm_source=faynx&utm_medium=referral";
  try {
    if(navigator.share) await navigator.share({title:`${p.user?.name} on Faynx`,url});
    else { await navigator.clipboard.writeText(url); toast("Link copied!","success"); }
  } catch {}
});

// Add to collection
$("lbAddToCollection")?.addEventListener("click", () => {
  if(!auth.currentUser){openAuth();return;}
  openCollPicker();
});

/*──────────── COLOR UTILS ────────────*/
function lightenHex(hex,amt) {
  const safe=hex.replace(/^#/,"").padStart(6,"0");
  const n=parseInt(safe,16);
  const r=Math.min(255,((n>>16)&0xff)+amt);
  const g=Math.min(255,((n>>8)&0xff)+amt);
  const b=Math.min(255,(n&0xff)+amt);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}
function darkenHex(hex,amt) {
  const safe=hex.replace(/^#/,"").padStart(6,"0");
  const n=parseInt(safe,16);
  const r=Math.max(0,((n>>16)&0xff)-amt);
  const g=Math.max(0,((n>>8)&0xff)-amt);
  const b=Math.max(0,(n&0xff)-amt);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}

/*──────────── FAVORITES ────────────*/
async function toggleFav(photo) {
  const user=auth.currentUser; if(!user) return false;
  const exists=userData.favorites.some(f=>f.id===photo.id);
  if(exists) userData.favorites=userData.favorites.filter(f=>f.id!==photo.id);
  else userData.favorites.push(photo);
  await saveUserData(user.uid);
  updateProfileStats();
  return !exists;
}

/*──────────── SAVED PAGE ────────────*/
function openSaved() {
  if(!auth.currentUser){openAuth();return;}
  const grid=$("savedGrid"); if(!grid) return;
  grid.innerHTML="";
  if(!userData.favorites.length) {
    grid.innerHTML=`<div class="error-state"><div class="err-ico">💔</div><p>No saved wallpapers yet.<br>Tap Save on any wallpaper.</p></div>`;
  } else {
    userData.favorites.slice().reverse().forEach((p,i) => renderPin(p,i,grid));
    const sc=$("savedCount"); if(sc) sc.textContent=`(${userData.favorites.length})`;
  }
  hideMain(); $("savedPage")?.classList.remove("hidden"); setBnav("saved");
}

$("savedBack")?.addEventListener("click", () => { $("savedPage")?.classList.add("hidden"); showMain(); setBnav("home"); });

/*──────────── COLLECTIONS ────────────*/
function openCollections() {
  if(!auth.currentUser){openAuth();return;}
  renderCollections();
  hideMain(); $("collectionsPage")?.classList.remove("hidden");
}

function renderCollections() {
  const grid=$("collectionsGrid"); if(!grid) return;
  grid.innerHTML="";
  const cols=Object.entries(userData.collections);
  if(!cols.length) {
    grid.innerHTML=`<div class="error-state" style="grid-column:1/-1"><div class="err-ico">🗂</div><p>No collections yet.</p></div>`;
    return;
  }
  cols.forEach(([id,col]) => {
    const card=document.createElement("div"); card.className="coll-card";
    const urls=(col.photoIds||[]).map(pid=>{
      const p=window.allPhotos.find(x=>x.id===pid);
      return p?p.urls.small:null;
    }).filter(Boolean).slice(0,4);

    const coverHtml = urls.length
      ? urls.map(u=>`<img src="${u}" alt="" loading="lazy"/>`).join("")
      : `<div style="background:var(--bg4);width:100%;height:100%;grid-column:1/-1"></div>`;

    card.innerHTML=`
      <div class="coll-cover ${urls.length<=1?"single":""}">${coverHtml}</div>
      <div class="coll-meta"><h4>${col.name}</h4><small>${col.photoIds?.length||0} wallpapers</small></div>`;
    grid.appendChild(card);
  });
}

$("collectionsBack")?.addEventListener("click", ()=>{ $("collectionsPage")?.classList.add("hidden"); showMain(); });
$("newCollectionBtn")?.addEventListener("click", openNewCollModal);

/*──────────── COLLECTION PICKER ────────────*/
function openCollPicker() {
  const modal=$("collPickerModal"), list=$("collPickerList"); if(!modal||!list) return;
  list.innerHTML="";
  const cols=Object.entries(userData.collections);
  if(!cols.length) {
    list.innerHTML=`<p style="color:var(--text2);font-size:13px;padding:8px 0">No collections yet.</p>`;
  } else {
    cols.forEach(([id,col])=>{
      const item=document.createElement("div"); item.className="cp-item";
      const cover=col.photoIds?.length ? (window.allPhotos.find(x=>x.id===col.photoIds[0])?.urls?.small||"") : "";
      item.innerHTML=`
        ${cover?`<img src="${cover}" alt="" loading="lazy"/>`:`<div style="width:40px;height:52px;background:var(--bg4);border-radius:6px;flex-shrink:0"></div>`}
        <div class="cp-item-info"><b>${col.name}</b><small>${col.photoIds?.length||0} items</small></div>`;
      item.addEventListener("click",async()=>{
        if(lightboxPhoto) {
          if(!col.photoIds) col.photoIds=[];
          if(!col.photoIds.includes(lightboxPhoto.id)) {
            col.photoIds.push(lightboxPhoto.id);
            const u=auth.currentUser; if(u) await saveUserData(u.uid);
            updateProfileStats();
          }
        }
        modal.classList.add("hidden");
        toast(`Added to "${col.name}"!`,"success");
      });
      list.appendChild(item);
    });
  }
  modal.classList.remove("hidden");
}

$("collPickerClose")?.addEventListener("click",  ()=>$("collPickerModal")?.classList.add("hidden"));
$("collPickerNewBtn")?.addEventListener("click", ()=>{ $("collPickerModal")?.classList.add("hidden"); openNewCollModal(); });

function openNewCollModal() {
  $("newCollModal")?.classList.remove("hidden");
  const n=$("newCollName"), d=$("newCollDesc");
  if(n) n.value=""; if(d) d.value="";
  setTimeout(()=>$("newCollName")?.focus(),100);
}
$("newCollClose")?.addEventListener("click", ()=>$("newCollModal")?.classList.add("hidden"));
$("newCollSave")?.addEventListener("click", async ()=>{
  const user=auth.currentUser;
  if(!user){toast("Sign in first","warn");return;}
  const name=($("newCollName")?.value||"").trim();
  if(!name){toast("Enter a collection name","warn");return;}
  const id="coll_"+Date.now();
  userData.collections[id]={ name, desc:($("newCollDesc")?.value||"").trim(), photoIds:[], createdAt:Date.now() };
  await saveUserData(user.uid);
  $("newCollModal")?.classList.add("hidden");
  toast("Collection created! 🗂","success");
  updateProfileStats();
  renderCollections();
});

/*──────────── DOWNLOADS ────────────*/
function recordDownload(photo) {
  const user=auth.currentUser; if(!user) return;
  userData.downloads.unshift({
    photoId:photo.id, thumb:photo.urls.thumb||photo.urls.small,
    author:photo.user?.name||"", width:photo.width, height:photo.height,
    ts:Date.now(), urls:photo.urls
  });
  userData.downloads=userData.downloads.slice(0,100);
  saveUserData(user.uid);
  updateProfileStats();
}

function openDownloads() {
  const list=$("downloadsList"); if(!list) return;
  list.innerHTML="";
  if(!userData.downloads.length) {
    list.innerHTML=`<div class="error-state"><div class="err-ico">📥</div><p>No download history yet.</p></div>`;
  } else {
    userData.downloads.forEach((dl,i)=>{
      const row=document.createElement("div"); row.className="dl-item"; row.style.animationDelay=`${i*25}ms`;
      row.innerHTML=`
        <img src="${dl.thumb||""}" alt="" loading="lazy" onerror="this.style.display='none'"/>
        <div class="dl-item-info">
          <b>${dl.author||"Unknown"}</b>
          <small>${dl.width||"?"}×${dl.height||"?"} · ${new Date(dl.ts).toLocaleDateString()}</small>
        </div>
        <button class="dl-redownload" type="button">↓ Re-download</button>`;
      row.querySelector(".dl-redownload").addEventListener("click",async()=>{
        try {
          const url=dl.urls?.[selectedQuality]||dl.urls?.regular||dl.thumb||"";
          if(!url){toast("URL unavailable","error");return;}
          const res=await fetch(url); const blob=await res.blob();
          const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
          a.download=`faynx-${dl.photoId}.jpg`; a.click();
          toast("Download started!","success");
        } catch { toast("Download failed","error"); }
      });
      list.appendChild(row);
    });
  }
  hideMain(); $("downloadsPage")?.classList.remove("hidden");
}

$("downloadsBack")?.addEventListener("click", ()=>{ $("downloadsPage")?.classList.add("hidden"); showMain(); });
$("clearDownloadsBtn")?.addEventListener("click", async ()=>{
  userData.downloads=[];
  const u=auth.currentUser; if(u) await saveUserData(u.uid);
  openDownloads(); toast("History cleared","info");
});

/*──────────── PROFILE ────────────*/
function openProfile() {
  if(!auth.currentUser){openAuth();return;}
  updateProfileUI();
  hideMain(); $("profilePage")?.classList.remove("hidden"); setBnav("profile");
}

$("profileBack")?.addEventListener("click", ()=>{ $("profilePage")?.classList.add("hidden"); showMain(); setBnav("home"); });

function updateProfileUI() {
  const user=auth.currentUser; if(!user) return;
  const photoSrc = user.photoURL||`https://i.pravatar.cc/80?u=${user.uid}`;
  const ha=$("headerAvatar"); if(ha) ha.src=photoSrc;
  const ma=$("menuAvatar");   if(ma) ma.src=photoSrc;
  const pa=$("profileAvatar"); if(pa) pa.src=photoSrc;
  const mn=$("menuName");     if(mn) mn.textContent=user.displayName||"User";
  const me=$("menuEmail");    if(me) me.textContent=user.email||"";
  const pn=$("profileName");  if(pn) pn.textContent=user.displayName||"User";
  const pe=$("profileEmail"); if(pe) pe.textContent=user.email||"";
  const di=$("displayNameInput"); if(di) di.value=user.displayName||"";
  const badge=$("profileBadge");
  if(badge){ badge.textContent=userData.premium?"⭐ Premium":"Free"; badge.className="badge "+(userData.premium?"premium":"free"); }
  $("upgradeBtn")?.classList.toggle("hidden", userData.premium);
  // Show user info section in menu
  $("menuUserInfo")?.classList.toggle("hidden", false);
  $("menuDiv1")?.classList.remove("hidden");
  updateProfileStats();
}

function updateProfileStats() {
  const ss=$("statSaved");       if(ss) ss.textContent=userData.favorites.length;
  const sd=$("statDownloads");   if(sd) sd.textContent=userData.downloads.length;
  const sc=$("statCollections"); if(sc) sc.textContent=Object.keys(userData.collections).length;
}

$("saveNameBtn")?.addEventListener("click", async ()=>{
  const user=auth.currentUser; if(!user) return;
  const name=($("displayNameInput")?.value||"").trim();
  if(!name){toast("Enter a name","warn");return;}
  try { await updateProfile(user,{displayName:name}); updateProfileUI(); toast("Name updated!","success"); }
  catch { toast("Update failed","error"); }
});

$("defaultQuality")?.addEventListener("change", e=>{ userData.prefs.quality=e.target.value; selectedQuality=e.target.value; savePrefs(); });
$("defaultLayout")?.addEventListener("change",  e=>{ userData.prefs.layout=e.target.value; applyLayout(e.target.value); savePrefs(); });
$("safeSearch")?.addEventListener("change",     e=>{ userData.prefs.safeSearch=e.target.checked; savePrefs(); });
$("upgradeBtn")?.addEventListener("click",      ()=>toast("Premium plans coming soon! 🚀","info"));
$("signOutBtn2")?.addEventListener("click",     ()=>$("menuSignOut")?.click());
$("redeemBtn")?.addEventListener("click", async ()=>{
  const code=($("redeemInput")?.value||"").trim().toUpperCase();
  if(!code){toast("Enter a code","warn");return;}
  const user=auth.currentUser; if(!user){openAuth();return;}
  if(["FAYNX2024","PREMIUM1","WALLHD99","FAYNXPRO","UPGRADE50"].includes(code)){
    userData.premium=true;
    await saveUserData(user.uid);
    updateProfileUI();
    toast("🎉 Premium activated!","success");
    const ri=$("redeemInput"); if(ri) ri.value="";
  } else { toast("Invalid or expired code","error"); }
});

/*──────────── AUTH ────────────*/
function openAuth(tab="signin") {
  $("authModal")?.classList.remove("hidden");
  document.querySelectorAll(".auth-tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===tab));
  document.querySelectorAll(".auth-panel").forEach(p=>p.classList.toggle("active",p.id===(tab==="signin"?"signinPanel":"signupPanel")));
  clearAuthErr();
}

function clearAuthErr() {
  [$("siError"),$("suError")].forEach(e=>{if(e){e.classList.add("hidden");e.textContent="";}});
}
function showAuthErr(id,msg) {
  const e=$(id); if(!e) return; e.textContent=msg; e.classList.remove("hidden");
}
function friendlyErr(code) {
  return {"auth/user-not-found":"No account with this email.","auth/wrong-password":"Incorrect password.",
    "auth/email-already-in-use":"Email already in use.","auth/invalid-email":"Invalid email address.",
    "auth/weak-password":"Password too weak (min 6 chars).","auth/too-many-requests":"Too many attempts. Try later.",
    "auth/invalid-credential":"Incorrect email or password."}[code]||"Something went wrong. Please try again.";
}

// Sign In
$("siSubmit")?.addEventListener("click", async ()=>{
  const email=($("siEmail")?.value||"").trim(), pass=$("siPassword")?.value||"";
  if(!email||!pass){showAuthErr("siError","Please fill in all fields");return;}
  clearAuthErr();
  const btn=$("siSubmit"); btn.textContent="Signing in…"; btn.disabled=true;
  try {
    await signInWithEmailAndPassword(auth,email,pass);
    $("authModal")?.classList.add("hidden"); toast("Welcome back! 👋","success");
  } catch(e){showAuthErr("siError",friendlyErr(e.code));}
  finally{btn.textContent="Sign In";btn.disabled=false;}
});

// Sign Up
$("suSubmit")?.addEventListener("click", async ()=>{
  const name=($("suName")?.value||"").trim();
  const email=($("suEmail")?.value||"").trim();
  const pass=$("suPassword")?.value||"";
  const agree=$("agreeTerms")?.checked;
  if(!email||!pass){showAuthErr("suError","Please fill in all fields");return;}
  if(pass.length<6){showAuthErr("suError","Password must be at least 6 characters");return;}
  if(!agree){showAuthErr("suError","Please agree to the Terms of Service");return;}
  clearAuthErr();
  const btn=$("suSubmit"); btn.textContent="Creating…"; btn.disabled=true;
  try {
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    if(name) await updateProfile(cred.user,{displayName:name});
    $("authModal")?.classList.add("hidden"); toast("Account created! 🎉","success");
  } catch(e){showAuthErr("suError",friendlyErr(e.code));}
  finally{btn.textContent="Create Account";btn.disabled=false;}
});

// Google
[$("siGoogle"),$("suGoogle")].forEach(btn=>{
  btn?.addEventListener("click",async()=>{
    try { await signInWithPopup(auth,new GoogleAuthProvider()); $("authModal")?.classList.add("hidden"); toast("Signed in with Google ✓","success"); }
    catch { toast("Google sign-in failed. Check popups are allowed.","error"); }
  });
});

// Forgot
$("forgotBtn")?.addEventListener("click",async()=>{
  const email=($("siEmail")?.value||"").trim();
  if(!email){showAuthErr("siError","Enter your email first");return;}
  try { await sendPasswordResetEmail(auth,email); toast("Reset email sent 📬","success"); }
  catch { toast("Could not send reset email","error"); }
});

// Close auth
$("authClose")?.addEventListener("click",()=>$("authModal")?.classList.add("hidden"));

// Auth state
onAuthStateChanged(auth, async user=>{
  const li=!!user;
  $("menuSignIn")?.classList.toggle("hidden",li);
  $("menuProfile")?.classList.toggle("hidden",!li);
  $("menuSignOut")?.classList.toggle("hidden",!li);
  $("menuUserInfo")?.classList.toggle("hidden",!li);
  $("menuDiv1")?.classList.toggle("hidden",!li);
  if(user) { await loadUserData(user.uid); updateProfileUI(); }
  else { userData={favorites:[],collections:{},downloads:[],premium:false,prefs:{quality:"regular",layout:"masonry",safeSearch:true}}; }
});

// Menu wiring
$("menuSignIn")?.addEventListener("click",    ()=>{ $("accountMenu")?.classList.add("hidden"); openAuth(); });
$("menuProfile")?.addEventListener("click",   ()=>{ $("accountMenu")?.classList.add("hidden"); openProfile(); });
$("menuSaved")?.addEventListener("click",     ()=>{ $("accountMenu")?.classList.add("hidden"); openSaved(); });
$("menuCollections")?.addEventListener("click",()=>{ $("accountMenu")?.classList.add("hidden"); openCollections(); });
$("menuDownloads")?.addEventListener("click", ()=>{ $("accountMenu")?.classList.add("hidden"); openDownloads(); });
$("menuSignOut")?.addEventListener("click",   async()=>{
  $("accountMenu")?.classList.add("hidden");
  await signOut(auth); toast("Signed out","info");
  $("profilePage")?.classList.add("hidden"); showMain();
});

/*──────────── BOTTOM NAV ────────────*/
function setBnav(page) {
  document.querySelectorAll(".bnav-btn").forEach(b=>b.classList.remove("active"));
  const map={home:"bnavHome",search:"bnavSearch",saved:"bnavSaved",profile:"bnavProfile"};
  $(map[page])?.classList.add("active");
}

$("bnavHome")?.addEventListener("click",    ()=>{ hideAllPages(); showMain(); setBnav("home"); });
$("bnavSearch")?.addEventListener("click",  ()=>{
  const b=$("mobileSearchBar"); if(!b) return;
  b.classList.toggle("hidden");
  if(!b.classList.contains("hidden")) $("mobileSearchInput")?.focus();
  setBnav("search");
});
$("bnavSaved")?.addEventListener("click",   ()=>openSaved());
$("bnavProfile")?.addEventListener("click", ()=>openProfile());

/*──────────── PAGE UTILS ────────────*/
function hideAllPages() { ["savedPage","collectionsPage","downloadsPage","profilePage"].forEach(id=>$(id)?.classList.add("hidden")); }
function hideMain() {
  const mg=$("mainGallery"); if(mg) mg.style.display="none";
  const hb=$("heroBanner");  if(hb) hb.style.display="none";
}
function showMain() {
  const mg=$("mainGallery"); if(mg) mg.style.display="";
  const hb=$("heroBanner");  if(hb) hb.style.display="";
  hideAllPages();
}

/*──────────── HEADER AUTOHIDE ────────────*/
let lastY=0;
window.addEventListener("scroll",()=>{
  const cur=window.scrollY;
  const hdr=document.querySelector(".header");
  if(hdr) { if(cur>lastY && cur>80) hdr.classList.add("header-hidden"); else hdr.classList.remove("header-hidden"); }
  lastY=cur;
},{passive:true});

/*──────────── SERVICE WORKER ────────────*/
if("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(()=>{});

/*──────────── INIT ────────────*/
initInstallPopup();
initHero();
initSearchSuggestions();
buildTopics();
setHeroBg();
loadPhotos(true);
