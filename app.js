/* ═══════════════════════════════════════════════════
   FAYNX app.js — Fixed + Upgraded
   All buttons wired, Auth complete, Sign In/Up fixed
═══════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const FB   = initializeApp({ apiKey:"AIzaSyDWcWf_vcl_OLRM1Lj-Heh20k2zJqmGLok", authDomain:"faynx0.firebaseapp.com", projectId:"faynx0" });
const auth = getAuth(FB);
const db   = getFirestore(FB);
const gProvider = new GoogleAuthProvider();

const KEY  = "FMEevPJq5OgeZ4W2-k2fDpwchFyA_cyYhvs2HoDC6UM";
const BASE = "https://api.unsplash.com";
const UH   = { Authorization: `Client-ID ${KEY}` };

const API = {
  async topics()            { const r=await fetch(`${BASE}/topics?per_page=20&order_by=featured`,{headers:UH}); if(!r.ok) throw new Error("topics"); return r.json(); },
  async topicPhotos(s,p=1)  { const r=await fetch(`${BASE}/topics/${s}/photos?page=${p}&per_page=20&order_by=popular`,{headers:UH}); if(!r.ok) throw new Error("topicPhotos"); return r.json(); },
  async search(q,p=1)       { const r=await fetch(`${BASE}/search/photos?query=${encodeURIComponent(q)}&page=${p}&per_page=20`,{headers:UH}); if(!r.ok) throw new Error("search"); return (await r.json()).results; },
  async random(n=6)         { const r=await fetch(`${BASE}/photos/random?count=${n}&topics=wallpapers`,{headers:UH}); if(!r.ok) throw new Error("random"); return r.json(); },
  trackDownload(photo)      { try{ fetch(photo.links.download_location,{headers:UH}); }catch(_){} }
};

const get  = id => document.getElementById(id);
const fmt  = n  => { if(!n&&n!==0) return "—"; if(n>=1e6) return (n/1e6).toFixed(1)+"M"; if(n>=1e3) return (n/1e3).toFixed(1)+"k"; return String(n); };
const show = el => { if(el) el.style.display=""; };
const hide = el => { if(el) el.style.display="none"; };
const setCk= (k,v,d)=>{ const x=new Date(); x.setTime(x.getTime()+d*864e5); document.cookie=`${k}=${v};expires=${x.toUTCString()};path=/`; };
const getCk= k =>{ const m=document.cookie.match(new RegExp('(^| )'+k+'=([^;]+)')); return m?m[2]:null; };

function toast(msg, type="info") {
  const c = get("toastStack"); if(!c) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("show"));
  setTimeout(()=>{ el.classList.remove("show"); setTimeout(()=>el.remove(),320); }, 2800);
}

let userData = { favorites:[], collections:{}, downloads:[], premium:false, prefs:{quality:"regular",layout:"masonry",safe:true} };
let selectedQuality = "regular";
let currentPhotos = [], currentIndex = 0, lightboxPhoto = null;
let feedMode = "topic", feedSlug = "wallpapers", feedQuery = "";
let page = 1, loading = false, noMore = false, reqId = 0;
window.allPhotos = [];

async function loadUser(uid) {
  try {
    const s = await getDoc(doc(db,"users",uid));
    if(s.exists()) {
      const d = s.data();
      userData.favorites   = Array.isArray(d.favorites)   ? d.favorites   : [];
      userData.collections = (d.collections&&typeof d.collections==="object") ? d.collections : {};
      userData.downloads   = Array.isArray(d.downloads)   ? d.downloads   : [];
      userData.premium     = !!d.premium;
      userData.prefs       = {...userData.prefs,...(d.prefs||{})};
    }
    syncPrefs(); refreshProfileUI();
  } catch(e){ console.warn("loadUser:",e); }
}
async function saveUser(uid) {
  if(!uid) return;
  try { await setDoc(doc(db,"users",uid),{ favorites:userData.favorites, collections:userData.collections, downloads:userData.downloads, premium:userData.premium, prefs:userData.prefs },{merge:true}); }
  catch(e){ console.warn("saveUser:",e); }
}
const uid = () => auth.currentUser?.uid || null;

function syncPrefs() {
  const {quality,layout,safe} = userData.prefs;
  selectedQuality = quality||"regular";
  const pq=get("prefQuality"); if(pq) pq.value=quality||"regular";
  const pl=get("prefLayout");  if(pl) pl.value=layout||"masonry";
  const ps=get("prefSafe");    if(ps) ps.checked=safe!==false;
  applyLayout(layout||"masonry");
}
function applyLayout(l) {
  const g=get("gallery"); if(!g) return;
  if(l==="grid"){ g.classList.add("grid-mode"); get("btnGrid")?.classList.add("active"); get("btnMasonry")?.classList.remove("active"); }
  else           { g.classList.remove("grid-mode"); get("btnMasonry")?.classList.add("active"); get("btnGrid")?.classList.remove("active"); }
}
function savePref() { const u=uid(); if(u) saveUser(u); }
get("prefQuality")?.addEventListener("change", e=>{ userData.prefs.quality=e.target.value; selectedQuality=e.target.value; savePref(); });
get("prefLayout")?.addEventListener("change",  e=>{ userData.prefs.layout=e.target.value; applyLayout(e.target.value); savePref(); });
get("prefSafe")?.addEventListener("change",    e=>{ userData.prefs.safe=e.target.checked; savePref(); });
get("btnMasonry")?.addEventListener("click",   ()=>{ userData.prefs.layout="masonry"; applyLayout("masonry"); savePref(); });
get("btnGrid")?.addEventListener("click",      ()=>{ userData.prefs.layout="grid"; applyLayout("grid"); savePref(); });

(function(){
  const sp=get("splash"), bar=get("splashBar"); if(!sp) return;
  let w=0;
  const iv=setInterval(()=>{ w=Math.min(w+Math.random()*28,88); if(bar) bar.style.width=w+"%"; },180);
  const done=()=>{ clearInterval(iv); if(bar) bar.style.width="100%"; setTimeout(()=>sp.classList.add("out"),380); };
  if(document.readyState==="complete") done(); else window.addEventListener("load",done);
  setTimeout(done,4000);
})();

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); deferredPrompt=e; });
(function(){
  if(getCk("fx_no_install")) return;
  if(window.matchMedia("(display-mode: standalone)").matches) return;
  const banner=get("installBanner"); if(!banner) return;
  setTimeout(()=>banner.classList.remove("hidden"),3500);
  get("installYesBtn")?.addEventListener("click",async()=>{
    banner.classList.add("hidden"); setCk("fx_no_install","1",1);
    if(deferredPrompt){ deferredPrompt.prompt(); const{outcome}=await deferredPrompt.userChoice; if(outcome==="accepted") toast("App installed!","success"); deferredPrompt=null; }
    else toast("Tap Share → 'Add to Home Screen' to install","info");
  });
  get("installNoBtn")?.addEventListener("click",()=>{ get("installBanner").classList.add("hidden"); setCk("fx_no_install","1",1); });
})();

let darkMode = !localStorage.getItem("fx_light");
function applyTheme() {
  document.body.classList.toggle("light",!darkMode);
  const ico = get("themeIcon"); if(!ico) return;
  ico.innerHTML = darkMode
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
}
applyTheme();
get("themeBtn")?.addEventListener("click",()=>{
  darkMode=!darkMode;
  if(darkMode) localStorage.removeItem("fx_light"); else localStorage.setItem("fx_light","1");
  applyTheme();
});

let lastY=0;
window.addEventListener("scroll",()=>{
  const y=window.scrollY, h=get("siteHeader");
  if(h){ if(y>lastY&&y>80) h.classList.add("hidden-up"); else h.classList.remove("hidden-up"); }
  lastY=y;
},{passive:true});

get("logoBtn")?.addEventListener("click",()=>{ showSection("main"); setBnav("home"); });

get("mobileSearchBtn")?.addEventListener("click",()=>{
  const ms=get("mobileSearch"); if(!ms) return;
  const open=ms.style.display==="none"||ms.style.display==="";
  ms.style.display=open?"block":"none";
  if(open){ const mi=get("mobileSearchInput"); if(mi){ mi.focus(); mi.value=get("searchInput")?.value||""; } }
});
get("mobileSearchInput")?.addEventListener("input", e=>handleSearch(e.target.value));

get("searchInput")?.addEventListener("input", e=>{
  const v=e.target.value;
  const clr=get("searchClear");
  if(clr){ if(v) clr.classList.add("visible"); else clr.classList.remove("visible"); }
  handleSearch(v); buildSuggestions(v);
});
get("searchInput")?.addEventListener("keydown",e=>{ if(e.key==="Enter"){ get("suggDrop")?.classList.remove("open"); } });
get("searchClear")?.addEventListener("click",()=>{
  const si=get("searchInput"); if(si) si.value="";
  get("searchClear")?.classList.remove("visible");
  get("suggDrop")?.classList.remove("open");
  handleSearch("");
});

const SUGGS = ["dark aesthetic wallpaper","lo-fi wallpaper","neon city night","4K nature wallpaper","AMOLED black wallpaper","minimal desktop","space galaxy wallpaper","forest morning mist","ocean waves 4K","anime wallpaper","cottagecore aesthetic","purple gradient wallpaper","cyberpunk city","mountain sunrise","abstract art wallpaper","vintage aesthetic","black and white minimal","rainy street night","cozy room wallpaper","iPhone lock screen wallpaper"];
let suggTimer;
function buildSuggestions(v) {
  const drop=get("suggDrop"); if(!drop) return;
  const q=v.trim().toLowerCase();
  if(!q){ drop.classList.remove("open"); return; }
  clearTimeout(suggTimer);
  suggTimer=setTimeout(()=>{
    const hits=SUGGS.filter(s=>s.includes(q)).slice(0,6);
    if(!hits.length){ drop.classList.remove("open"); return; }
    drop.innerHTML=hits.map(m=>`<div class="sugg-item" data-q="${m}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>${m}</div>`).join("");
    drop.classList.add("open");
    drop.querySelectorAll(".sugg-item").forEach(el=>{
      el.addEventListener("click",()=>{ const q2=el.dataset.q; const si=get("searchInput"); if(si) si.value=q2; drop.classList.remove("open"); trigSearch(q2); });
    });
  },180);
}
document.addEventListener("click",e=>{
  const box=get("desktopSearchBox"), drop=get("suggDrop");
  if(box&&drop&&!box.contains(e.target)&&!drop.contains(e.target)) drop.classList.remove("open");
});

const avatarBtn = get("avatarBtn");
const accMenu   = get("accountMenu");
avatarBtn?.addEventListener("click", e=>{
  e.stopPropagation();
  const open=accMenu?.classList.contains("open");
  if(open){ accMenu.classList.remove("open"); avatarBtn.setAttribute("aria-expanded","false"); }
  else    { accMenu?.classList.add("open");   avatarBtn.setAttribute("aria-expanded","true"); }
});
document.addEventListener("click",e=>{
  if(accMenu?.classList.contains("open")&&!get("avatarWrap")?.contains(e.target)){
    accMenu.classList.remove("open"); avatarBtn?.setAttribute("aria-expanded","false");
  }
});
function closeMenu(){ accMenu?.classList.remove("open"); avatarBtn?.setAttribute("aria-expanded","false"); }

get("menuSignIn")?.addEventListener("click",     ()=>{ closeMenu(); openAuth("signin"); });
get("menuSaved")?.addEventListener("click",      ()=>{ closeMenu(); openSaved(); });
get("menuCollections")?.addEventListener("click", ()=>{ closeMenu(); openCollections(); });
get("menuDownloads")?.addEventListener("click",  ()=>{ closeMenu(); openDownloads(); });
get("menuProfile")?.addEventListener("click",    ()=>{ closeMenu(); openProfile(); });
get("menuSignOut")?.addEventListener("click",    ()=>{ closeMenu(); doSignOut(); });

const HERO_CHIPS=["dark aesthetic","lo-fi wallpaper","neon city","forest mist","space galaxy","minimal black","cottagecore","anime sky"];
function initHero(){
  const wrap=get("heroChips"); if(!wrap) return;
  HERO_CHIPS.forEach(tag=>{
    const b=document.createElement("button"); b.className="hero-chip"; b.textContent=tag; b.type="button";
    b.addEventListener("click",()=>{ const hi=get("heroSearch"); if(hi) hi.value=tag; get("heroSearchBtn")?.click(); });
    wrap.appendChild(b);
  });
}
get("heroSearchBtn")?.addEventListener("click",()=>{
  const q=(get("heroSearch")?.value||"").trim(); if(!q) return;
  const si=get("searchInput"); if(si) si.value=q;
  trigSearch(q);
  const hero=get("hero"); if(hero){ hero.style.display="none"; hero.dataset.hiddenBySearch="1"; }
});
get("heroSearch")?.addEventListener("keydown",e=>{ if(e.key==="Enter") get("heroSearchBtn")?.click(); });
async function initHeroBg(){
  try{
    const ps=await API.random(5); if(!ps?.length) return;
    const bg=get("heroBg"); if(!bg) return;
    let i=0;
    bg.style.backgroundImage=`url(${ps[0].urls.regular})`;
    setInterval(()=>{ i=(i+1)%ps.length; bg.style.backgroundImage=`url(${ps[i].urls.regular})`; },6000);
  }catch(_){}
}

const FALLBACK_TOPICS=[
  {slug:"wallpapers",title:"✨ All"},{slug:"nature",title:"🌿 Nature"},
  {slug:"architecture-interior",title:"🏛 Architecture"},{slug:"travel",title:"✈️ Travel"},
  {slug:"street-photography",title:"🌆 Street"},{slug:"experimental",title:"🎨 Abstract"},
  {slug:"textures-patterns",title:"🔲 Textures"},{slug:"animals",title:"🐾 Animals"},
  {slug:"fashion-beauty",title:"💄 Fashion"},{slug:"film",title:"🎞 Film"},
  {slug:"food-drink",title:"🍜 Food"},{slug:"athletics",title:"🏃 Sport"}
];
async function buildTopics(){
  const bar=get("topicsBar"); if(!bar) return;
  let topics=FALLBACK_TOPICS;
  try{
    const live=await API.topics();
    if(live?.length){
      const em=Object.fromEntries(FALLBACK_TOPICS.map(t=>[t.slug,t.title.split(" ")[0]]));
      topics=live.map(t=>({slug:t.slug,title:(em[t.slug]||"")+" "+t.title}));
    }
  }catch(_){}
  topics.forEach((t,i)=>{
    const btn=document.createElement("button");
    btn.className="topic-pill"+(i===0?" active":"");
    btn.textContent=t.title; btn.type="button"; btn.dataset.slug=t.slug;
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".topic-pill").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const si=get("searchInput"); if(si) si.value="";
      const mi=get("mobileSearchInput"); if(mi) mi.value="";
      get("searchClear")?.classList.remove("visible");
      const gt=get("galleryTitle"); if(gt) gt.textContent=t.title.replace(/^\S+\s/,"")+" Wallpapers";
      feedMode="topic"; feedSlug=t.slug; feedQuery="";
      loadPhotos(true); showSection("main");
    });
    bar.appendChild(btn);
  });
}

let sTimer;
function handleSearch(val){
  clearTimeout(sTimer);
  sTimer=setTimeout(()=>{
    document.querySelectorAll(".topic-pill").forEach(b=>b.classList.remove("active"));
    const q=val.trim();
    if(q){
      feedMode="search"; feedQuery=q;
      const gt=get("galleryTitle"); if(gt) gt.textContent=`Results for "${q}"`;
      const hero=get("hero"); if(hero) hero.style.display="none";
    }else{
      feedMode="topic"; feedSlug="wallpapers"; feedQuery="";
      document.querySelector(".topic-pill")?.classList.add("active");
      const gt=get("galleryTitle"); if(gt) gt.textContent="Trending Wallpapers";
    }
    loadPhotos(true);
  },380);
}
function trigSearch(q){
  const si=get("searchInput"); if(si) si.value=q;
  handleSearch(q); showSection("main");
}
window._triggerSearch = trigSearch;

const gallery = get("gallery");
window.loadPhotos = loadPhotos;

async function loadPhotos(reset=false){
  if(!gallery) return;
  if(loading&&!reset) return;
  if(noMore&&!reset) return;
  loading=true; noMore=false;
  const id=++reqId;
  if(reset){ gallery.innerHTML=""; page=1; window.allPhotos=[]; hide(get("galleryEnd")); }
  if(page===1) showSkels(); else show(get("gallerySpinner"));
  try{
    const photos = feedMode==="search" ? await API.search(feedQuery,page) : await API.topicPhotos(feedSlug,page);
    if(id!==reqId) return;
    if(!photos?.length){ if(page===1) showErr("Nothing found — try a different search"); noMore=true; if(page>1) show(get("galleryEnd")); return; }
    window.allPhotos=[...window.allPhotos,...photos].slice(-300);
    photos.forEach((p,i)=>renderPin(p,i,gallery));
    page++;
  }catch(e){
    if(e?.name!=="AbortError"&&id===reqId&&page===1) showErr("Failed to load. Check your connection.");
  }finally{
    removeSkels(); hide(get("gallerySpinner")); loading=false;
  }
}
window.addEventListener("scroll",()=>{
  if(window.innerHeight+window.scrollY>=document.body.offsetHeight-600) loadPhotos();
},{passive:true});

const SKEL_H=[280,200,340,250,190,315,220,290,170,355,235,265,300,180,310];
function showSkels(){ removeSkels(); SKEL_H.forEach(h=>{ const s=document.createElement("div"); s.className="pin-skel"; s.style.height=h+"px"; gallery.appendChild(s); }); }
function removeSkels(){ gallery?.querySelectorAll(".pin-skel").forEach(e=>e.remove()); }
function showErr(msg){ gallery.innerHTML=`<div class="err-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="52" height="52"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>${msg}</p><button class="retry-btn" onclick="loadPhotos(true)">Retry</button></div>`; }

function renderPin(photo,idx=0,container=gallery){
  if(!container) return;
  const card=document.createElement("div");
  card.className="pin"; card.style.animationDelay=`${Math.min(idx,12)*38}ms`;
  card.style.background=photo.color||"#1c1c21";
  const img=document.createElement("img"); img.className="pin-img"; img.loading="lazy";
  img.alt=photo.alt_description||"wallpaper"; img.src=photo.urls.small;
  img.style.cssText="opacity:0;transition:opacity .35s ease;"; img.style.aspectRatio=`${photo.width}/${photo.height}`;
  img.onload=()=>{ img.style.opacity="1"; };
  img.onerror=()=>{ img.style.opacity="1"; };
  const ov=document.createElement("div"); ov.className="pin-overlay";
  const top=document.createElement("div"); top.className="pin-top";
  const bot=document.createElement("div"); bot.className="pin-bottom";
  const saveBtn=document.createElement("button"); saveBtn.type="button"; saveBtn.className="pin-save";
  const isSaved=userData.favorites.some(f=>f.id===photo.id);
  saveBtn.textContent=isSaved?"Saved ✓":"Save"; if(isSaved) saveBtn.classList.add("is-saved");
  saveBtn.addEventListener("click",async e=>{
    e.stopPropagation();
    if(!auth.currentUser){ openAuth("signin"); return; }
    const s=await toggleFav(photo);
    saveBtn.textContent=s?"Saved ✓":"Save"; saveBtn.classList.toggle("is-saved",s);
    toast(s?"Saved 💖":"Removed",s?"success":"info");
  });
  const dlBtn=document.createElement("button"); dlBtn.type="button"; dlBtn.className="pin-icon-btn"; dlBtn.title="Quick download";
  dlBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  dlBtn.addEventListener("click",async e=>{ e.stopPropagation(); await quickDownload(photo); });
  const shareBtn=document.createElement("button"); shareBtn.type="button"; shareBtn.className="pin-icon-btn"; shareBtn.title="Share";
  shareBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  shareBtn.addEventListener("click",async e=>{ e.stopPropagation(); await sharePhoto(photo); });
  const credit=document.createElement("div"); credit.className="pin-credit"; credit.textContent=`📷 ${photo.user?.name||""}`;
  const likes=document.createElement("span"); likes.className="pin-likes"; likes.textContent=`${fmt(photo.likes||0)} ♥`;
  top.append(saveBtn,dlBtn,shareBtn); bot.append(credit,likes); ov.append(top,bot);
  card.append(img,ov); card.addEventListener("click",()=>openLightbox(photo)); container.appendChild(card);
}

async function quickDownload(photo){
  toast("Preparing…","info");
  try{
    API.trackDownload(photo);
    const url=photo.urls[selectedQuality]||photo.urls.regular;
    const res=await fetch(url); const blob=await res.blob();
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`faynx-${photo.id}.jpg`; a.click();
    toast("Download started!","success"); recordDownload(photo);
  }catch(_){ toast("Download failed","error"); }
}

async function sharePhoto(photo){
  const url=photo.links.html+"?utm_source=faynx&utm_medium=referral";
  try{
    if(navigator.share) await navigator.share({title:"Faynx Wallpaper",url});
    else{ await navigator.clipboard.writeText(url); toast("Link copied!","success"); }
  }catch(_){}
}

function openLightbox(photo){
  currentPhotos=window.allPhotos.length?[...window.allPhotos]:[photo];
  currentIndex=currentPhotos.findIndex(p=>p.id===photo.id);
  if(currentIndex===-1){ currentPhotos=[photo]; currentIndex=0; }
  lightboxPhoto=photo;
  get("lightbox").style.display="flex"; document.body.style.overflow="hidden"; renderLB();
}
function closeLightbox(){ get("lightbox").style.display="none"; document.body.style.overflow=""; }
function renderLB(){
  const p=currentPhotos[currentIndex]; if(!p) return; lightboxPhoto=p;
  const img=get("lbImg"), loader=get("lbLoader");
  if(loader) loader.classList.add("on"); if(img) img.style.opacity="0";
  const src=p.urls[selectedQuality]||p.urls.regular;
  const tmp=new Image();
  tmp.onload=()=>{ if(img){img.src=tmp.src;img.style.opacity="1";} loader?.classList.remove("on"); };
  tmp.onerror=()=>{ if(img){img.src=p.urls.regular;img.style.opacity="1";} loader?.classList.remove("on"); };
  tmp.src=src;
  const av=get("lbAuthorAv"); if(av){ av.src=p.user?.profile_image?.medium||""; av.onerror=()=>{hide(av);}; }
  const an=get("lbAuthorName"); if(an) an.textContent=p.user?.name||"";
  const ah=get("lbAuthorHandle"); if(ah) ah.textContent=p.user?.username?`@${p.user.username}`:"";
  const desc=get("lbDesc"); if(desc){ const t=p.description||p.alt_description||""; desc.textContent=t; desc.style.display=t?"":"none"; }
  const sw=get("lbSwatches");
  if(sw){ sw.innerHTML=""; if(p.color){ [p.color,lighten(p.color,28),darken(p.color,28)].forEach(c=>{ const d=document.createElement("div"); d.className="lb-swatch"; d.style.background=c; d.title=`Copy ${c}`; d.addEventListener("click",async()=>{ try{await navigator.clipboard.writeText(c);toast(`Copied ${c}!`,"success");}catch(_){} }); sw.appendChild(d); }); } }
  const tags=get("lbTags"); if(tags){ tags.innerHTML=""; (p.tags||[]).slice(0,10).forEach(t=>{ const s=document.createElement("span"); s.className="lb-tag"; s.textContent=t.title; s.addEventListener("click",()=>{ closeLightbox(); trigSearch(t.title); }); tags.appendChild(s); }); }
  const stats=get("lbStats"); if(stats) stats.innerHTML=`<div class="lb-stat"><span class="lb-stat-v">${fmt(p.likes)}</span><span class="lb-stat-l">Likes</span></div><div class="lb-stat"><span class="lb-stat-v">${fmt(p.downloads||0)}</span><span class="lb-stat-l">Downloads</span></div><div class="lb-stat"><span class="lb-stat-v">${p.width}×${p.height}</span><span class="lb-stat-l">Resolution</span></div>${p.exif?.model?`<div class="lb-stat"><span class="lb-stat-v">${p.exif.model}</span><span class="lb-stat-l">Camera</span></div>`:""}`;
  const prev=get("lbPrev"), next=get("lbNext");
  if(prev) prev.disabled=currentIndex===0; if(next) next.disabled=currentIndex>=currentPhotos.length-1;
  const ctr=get("lbCounter"); if(ctr) ctr.textContent=`${currentIndex+1} / ${currentPhotos.length}`;
  get("qualityPills")?.querySelectorAll(".qpill").forEach(b=>b.classList.toggle("active",b.dataset.q===selectedQuality));
  syncLbSave(p);
  const lnk=get("lbCredit"); if(lnk) lnk.href=(p.links?.html||"#")+"?utm_source=faynx&utm_medium=referral";
  const lcn=get("lbCreditName"); if(lcn) lcn.textContent=p.user?.name||"";
  const nx=currentPhotos[currentIndex+1]; if(nx) new Image().src=nx.urls.regular;
  const pv=currentPhotos[currentIndex-1]; if(pv) new Image().src=pv.urls.regular;
}
function syncLbSave(photo){
  const btn=get("lbSave"); if(!btn) return;
  const s=userData.favorites.some(f=>f.id===photo.id);
  btn.classList.toggle("is-saved",s);
  btn.innerHTML=s?'<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save';
}
get("lbClose")?.addEventListener("click",closeLightbox);
get("lbBg")?.addEventListener("click",closeLightbox);
get("lbPrev")?.addEventListener("click",()=>{ if(currentIndex>0){currentIndex--;renderLB();} });
get("lbNext")?.addEventListener("click",()=>{ if(currentIndex<currentPhotos.length-1){currentIndex++;renderLB();} });
document.addEventListener("keydown",e=>{
  if(get("lightbox")?.style.display==="none") return;
  if(e.key==="Escape") closeLightbox();
  if(e.key==="ArrowRight"&&currentIndex<currentPhotos.length-1){currentIndex++;renderLB();}
  if(e.key==="ArrowLeft"&&currentIndex>0){currentIndex--;renderLB();}
});
let _tx=0,_ty=0;
get("lightbox")?.addEventListener("touchstart",e=>{_tx=e.touches[0].clientX;_ty=e.touches[0].clientY;},{passive:true});
get("lightbox")?.addEventListener("touchend",e=>{
  const dx=_tx-e.changedTouches[0].clientX, dy=Math.abs(_ty-e.changedTouches[0].clientY);
  if(Math.abs(dx)>60&&dy<80){ if(dx>0&&currentIndex<currentPhotos.length-1){currentIndex++;renderLB();} else if(dx<0&&currentIndex>0){currentIndex--;renderLB();} }
},{passive:true});
get("qualityPills")?.addEventListener("click",e=>{
  const btn=e.target.closest(".qpill"); if(!btn) return;
  selectedQuality=btn.dataset.q;
  get("qualityPills").querySelectorAll(".qpill").forEach(b=>b.classList.toggle("active",b.dataset.q===selectedQuality));
  renderLB();
});
get("lbDownload")?.addEventListener("click",async()=>{
  const p=currentPhotos[currentIndex]; if(!p) return;
  toast("Preparing download…","info");
  try{
    API.trackDownload(p);
    const url=p.urls[selectedQuality]||p.urls.full||p.urls.regular;
    const res=await fetch(url); const blob=await res.blob();
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`faynx-${p.id}.jpg`; a.click();
    toast("Download started!","success"); recordDownload(p);
  }catch(_){ toast("Download failed","error"); }
});
get("lbSave")?.addEventListener("click",async()=>{
  if(!auth.currentUser){ openAuth("signin"); return; }
  const p=currentPhotos[currentIndex]; if(!p) return;
  const s=await toggleFav(p); syncLbSave(p); toast(s?"Saved 💖":"Removed",s?"success":"info");
});
get("lbCopy")?.addEventListener("click",async()=>{
  const p=currentPhotos[currentIndex]; if(!p) return;
  try{ await navigator.clipboard.writeText(p.urls.regular); toast("Image URL copied!","success"); }
  catch(_){ toast("Copy not supported","error"); }
});
get("lbShare")?.addEventListener("click",async()=>{ const p=currentPhotos[currentIndex]; if(p) await sharePhoto(p); });
get("lbAddToCollection")?.addEventListener("click",()=>{ if(!auth.currentUser){ openAuth("signin"); return; } openCollPicker(); });

function lighten(hex,a){ const s=hex.replace("#","").padStart(6,"0"),n=parseInt(s,16); return `#${((1<<24)|(Math.min(255,((n>>16)&255)+a)<<16)|(Math.min(255,((n>>8)&255)+a)<<8)|Math.min(255,(n&255)+a)).toString(16).slice(1)}`; }
function darken(hex,a) { const s=hex.replace("#","").padStart(6,"0"),n=parseInt(s,16); return `#${((1<<24)|(Math.max(0,((n>>16)&255)-a)<<16)|(Math.max(0,((n>>8)&255)-a)<<8)|Math.max(0,(n&255)-a)).toString(16).slice(1)}`; }

async function toggleFav(photo){
  const u=uid(); if(!u) return false;
  const exists=userData.favorites.some(f=>f.id===photo.id);
  userData.favorites=exists?userData.favorites.filter(f=>f.id!==photo.id):[...userData.favorites,photo];
  await saveUser(u); refreshStats(); return !exists;
}

function openSaved(){
  if(!auth.currentUser){ openAuth("signin"); return; }
  const grid=get("savedGrid"); if(!grid) return;
  grid.innerHTML="";
  const empty=get("savedEmpty");
  if(!userData.favorites.length){ show(empty); if(get("savedBadge")) get("savedBadge").textContent=""; }
  else{
    hide(empty);
    if(get("savedBadge")) get("savedBadge").textContent=`(${userData.favorites.length})`;
    userData.favorites.slice().reverse().forEach((p,i)=>renderPin(p,i,grid));
  }
  showSection("saved");
}
get("savedClose")?.addEventListener("click",()=>{ showSection("main"); setBnav("home"); });
get("savedClearBtn")?.addEventListener("click",async()=>{
  if(!userData.favorites.length) return;
  userData.favorites=[];
  const u=uid(); if(u) await saveUser(u);
  openSaved(); refreshStats(); toast("All saves cleared","info");
});

function openCollections(){
  if(!auth.currentUser){ openAuth("signin"); return; }
  renderCollections(); showSection("collections");
}
function renderCollections(){
  const grid=get("collectionsGrid"); if(!grid) return;
  grid.innerHTML="";
  const empty=get("collectionsEmpty");
  const cols=Object.entries(userData.collections);
  if(!cols.length){ show(empty); return; }
  hide(empty);
  cols.forEach(([id,col])=>{
    const card=document.createElement("div"); card.className="coll-card";
    const urls=(col.photoIds||[]).map(pid=>{ const p=window.allPhotos.find(x=>x.id===pid); return p?p.urls.small:null; }).filter(Boolean).slice(0,4);
    const cover=document.createElement("div"); cover.className=`coll-cover${urls.length<=1?" one":""}`;
    if(urls.length){ urls.forEach(u=>{ const i=document.createElement("img"); i.src=u; i.loading="lazy"; cover.appendChild(i); }); }
    else{ cover.style.background="var(--bg4)"; }
    const info=document.createElement("div"); info.className="coll-info";
    info.innerHTML=`<h4>${col.name}</h4><small>${col.photoIds?.length||0} wallpapers</small>`;
    card.append(cover,info); grid.appendChild(card);
  });
}
get("collectionsClose")?.addEventListener("click",()=>{ showSection("main"); setBnav("home"); });
get("newCollBtn")?.addEventListener("click",openNewCollModal);

function openCollPicker(){
  const list=get("collPickerList"); if(!list) return;
  list.innerHTML="";
  const cols=Object.entries(userData.collections);
  if(!cols.length){ list.innerHTML='<p style="color:var(--text2);font-size:13px;padding:8px 0">No collections yet. Create one below!</p>'; }
  else{
    cols.forEach(([id,col])=>{
      const item=document.createElement("div"); item.className="cp-item";
      const cover=col.photoIds?.length?(window.allPhotos.find(x=>x.id===col.photoIds[0])?.urls?.small||""):"";
      item.innerHTML=`${cover?`<img src="${cover}" loading="lazy" alt=""/>`:'<div style="width:36px;height:46px;background:var(--bg4);border-radius:6px;flex-shrink:0"></div>'}<div class="cp-item-info"><b>${col.name}</b><small>${col.photoIds?.length||0} items</small></div>`;
      item.addEventListener("click",async()=>{
        if(lightboxPhoto){ if(!col.photoIds) col.photoIds=[]; if(!col.photoIds.includes(lightboxPhoto.id)){ col.photoIds.push(lightboxPhoto.id); const u=uid(); if(u) await saveUser(u); refreshStats(); } }
        get("collPickerOverlay").style.display="none"; toast(`Added to "${col.name}"!`,"success");
      });
      list.appendChild(item);
    });
  }
  get("collPickerOverlay").style.display="flex";
}
get("collPickerClose")?.addEventListener("click",()=>{ get("collPickerOverlay").style.display="none"; });
get("collPickerOverlay")?.addEventListener("click",e=>{ if(e.target===get("collPickerOverlay")) get("collPickerOverlay").style.display="none"; });
get("collPickerNewBtn")?.addEventListener("click",()=>{ get("collPickerOverlay").style.display="none"; openNewCollModal(); });

function openNewCollModal(){
  const ov=get("newCollOverlay"); if(!ov) return;
  const n=get("newCollName"),d=get("newCollDesc"); if(n) n.value=""; if(d) d.value="";
  ov.style.display="flex"; setTimeout(()=>n?.focus(),100);
}
get("newCollClose")?.addEventListener("click",()=>{ get("newCollOverlay").style.display="none"; });
get("newCollOverlay")?.addEventListener("click",e=>{ if(e.target===get("newCollOverlay")) get("newCollOverlay").style.display="none"; });
get("newCollSaveBtn")?.addEventListener("click",async()=>{
  const u=uid(); if(!u){ toast("Sign in first","warn"); openAuth("signin"); return; }
  const name=(get("newCollName")?.value||"").trim(); if(!name){ toast("Please enter a name","warn"); return; }
  const id="c"+Date.now();
  userData.collections[id]={ name, desc:(get("newCollDesc")?.value||"").trim(), photoIds:[], created:Date.now() };
  await saveUser(u); get("newCollOverlay").style.display="none";
  toast("Collection created!","success"); refreshStats(); renderCollections();
});

function recordDownload(photo){
  const u=uid(); if(!u) return;
  userData.downloads.unshift({ photoId:photo.id, thumb:photo.urls.thumb||photo.urls.small, author:photo.user?.name||"", width:photo.width, height:photo.height, ts:Date.now(), urls:photo.urls });
  userData.downloads=userData.downloads.slice(0,100); saveUser(u); refreshStats();
}
function openDownloads(){
  if(!auth.currentUser){ openAuth("signin"); return; }
  const list=get("downloadsList"); if(!list) return;
  list.innerHTML="";
  const empty=get("downloadsEmpty");
  if(!userData.downloads.length){ show(empty); showSection("downloads"); return; }
  hide(empty);
  userData.downloads.forEach((dl,i)=>{
    const row=document.createElement("div"); row.className="dl-row"; row.style.animationDelay=`${i*22}ms`;
    const img=document.createElement("img"); img.src=dl.thumb||""; img.loading="lazy"; img.onerror=()=>hide(img);
    const info=document.createElement("div"); info.className="dl-info";
    info.innerHTML=`<b>${dl.author||"Unknown"}</b><small>${dl.width||"?"}×${dl.height||"?"} · ${new Date(dl.ts).toLocaleDateString()}</small>`;
    const btn=document.createElement("button"); btn.className="dl-redown"; btn.type="button"; btn.textContent="↓ Re-download";
    btn.addEventListener("click",async()=>{
      try{
        const url=dl.urls?.[selectedQuality]||dl.urls?.regular||dl.thumb||""; if(!url){ toast("URL unavailable","error"); return; }
        const res=await fetch(url); const blob=await res.blob();
        const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`faynx-${dl.photoId}.jpg`; a.click(); toast("Download started!","success");
      }catch(_){ toast("Download failed","error"); }
    });
    row.append(img,info,btn); list.appendChild(row);
  });
  showSection("downloads");
}
get("downloadsClose")?.addEventListener("click",()=>{ showSection("main"); setBnav("home"); });
get("clearHistoryBtn")?.addEventListener("click",async()=>{
  userData.downloads=[]; const u=uid(); if(u) await saveUser(u);
  openDownloads(); refreshStats(); toast("History cleared","info");
});

function openProfile(){
  if(!auth.currentUser){ openAuth("signin"); return; }
  refreshProfileUI(); showSection("profile"); setBnav("profile");
}
get("profileClose")?.addEventListener("click",()=>{ showSection("main"); setBnav("home"); });
function refreshProfileUI(){
  const user=auth.currentUser; if(!user) return;
  const n=encodeURIComponent(user.displayName||"U");
  const src=user.photoURL||`https://ui-avatars.com/api/?name=${n}&background=1c1c21&color=00ffd5&size=150&bold=true`;
  const src80=user.photoURL||`https://ui-avatars.com/api/?name=${n}&background=1c1c21&color=00ffd5&size=80&bold=true`;
  [get("profileAvatar"),get("headerAvatar")].forEach(el=>{ if(el) el.src=src; });
  const ma=get("menuAvatar"); if(ma) ma.src=src80;
  const mn=get("menuDisplayName"); if(mn) mn.textContent=user.displayName||"User";
  const me=get("menuEmail"); if(me) me.textContent=user.email||"";
  const pdn=get("profileDisplayName"); if(pdn) pdn.textContent=user.displayName||"User";
  const pet=get("profileEmailText"); if(pet) pet.textContent=user.email||"";
  const ni=get("nameInput"); if(ni) ni.value=user.displayName||"";
  const tier=get("profileTier"); if(tier){ tier.textContent=userData.premium?"⭐ Premium":"Free"; tier.className="tier-badge "+(userData.premium?"tier-premium":"tier-free"); }
  const ub=get("upgradeBtn"); if(ub) ub.style.display=userData.premium?"none":"";
  if(get("menuUserInfo")) get("menuUserInfo").style.display="flex";
  [get("menuSep1"),get("menuProfile"),get("menuSignOut"),get("menuSep2")].forEach(el=>{ if(el) el.style.display=""; });
  if(get("menuSignIn")) get("menuSignIn").style.display="none";
  refreshStats();
}
function refreshStats(){
  const s=get("pstatSaved"),d=get("pstatDownloads"),c=get("pstatCollections");
  if(s) s.textContent=userData.favorites.length;
  if(d) d.textContent=userData.downloads.length;
  if(c) c.textContent=Object.keys(userData.collections).length;
}
get("saveNameBtn")?.addEventListener("click",async()=>{
  const user=auth.currentUser; if(!user) return;
  const n=(get("nameInput")?.value||"").trim(); if(!n){ toast("Enter a name","warn"); return; }
  try{ await updateProfile(user,{displayName:n}); refreshProfileUI(); toast("Name updated!","success"); }
  catch(_){ toast("Update failed","error"); }
});
get("upgradeBtn")?.addEventListener("click",()=>toast("Premium plans coming soon! 🚀","info"));
get("signOutBtn")?.addEventListener("click",doSignOut);
get("redeemBtn")?.addEventListener("click",async()=>{
  const code=(get("redeemInput")?.value||"").trim().toUpperCase();
  if(!code){ toast("Enter a code","warn"); return; }
  const u=uid(); if(!u){ openAuth("signin"); return; }
  if(["FAYNX2024","PREMIUM1","WALLHD99","FAYNXPRO","UPGRADE50"].includes(code)){
    userData.premium=true; await saveUser(u); refreshProfileUI();
    toast("🎉 Premium activated!","success"); const ri=get("redeemInput"); if(ri) ri.value="";
  }else{ toast("Invalid code","error"); }
});

/* ═══════════════════════════════════════════════════
   AUTH — Fixed & Upgraded
═══════════════════════════════════════════════════ */
function openAuth(tab="signin"){
  const modal=get("authModal"); if(!modal) return;
  modal.style.display="flex"; switchAuthTab(tab); clearAuthErrs();
  setTimeout(()=>{ if(tab==="signin") get("siEmail")?.focus(); else get("suName")?.focus(); },120);
}
function closeAuth(){ const modal=get("authModal"); if(modal) modal.style.display="none"; clearAuthErrs(); }
function switchAuthTab(tab){
  const isSI=tab==="signin";
  get("tabSignIn")?.classList.toggle("active",isSI); get("tabSignUp")?.classList.toggle("active",!isSI);
  if(get("panelSignIn")) get("panelSignIn").style.display=isSI?"block":"none";
  if(get("panelSignUp")) get("panelSignUp").style.display=isSI?"none":"block";
  clearAuthErrs();
}
function clearAuthErrs(){ [get("siErr"),get("suErr")].forEach(e=>{ if(e){ e.textContent=""; e.style.display="none"; } }); }
function showAuthErr(id,msg){ const e=get(id); if(!e) return; e.textContent=msg; e.style.display="block"; }
function fmtErr(code){ return ({"auth/user-not-found":"No account found with this email.","auth/wrong-password":"Incorrect password.","auth/email-already-in-use":"An account already exists with this email.","auth/invalid-email":"Please enter a valid email address.","auth/weak-password":"Password must be at least 6 characters.","auth/too-many-requests":"Too many attempts. Please try again later.","auth/invalid-credential":"Incorrect email or password.","auth/popup-closed-by-user":"Sign-in popup was closed.","auth/network-request-failed":"Network error. Check your connection."}[code]||"Something went wrong. Please try again."); }

get("tabSignIn")?.addEventListener("click",()=>switchAuthTab("signin"));
get("tabSignUp")?.addEventListener("click",()=>switchAuthTab("signup"));
get("authClose")?.addEventListener("click",closeAuth);
get("authModal")?.addEventListener("click",e=>{ if(e.target===get("authModal")) closeAuth(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&get("authModal")?.style.display==="flex") closeAuth(); });

document.addEventListener("click",e=>{
  if(!e.target.classList.contains("pw-eye")) return;
  const target=get(e.target.dataset.for); if(!target) return;
  target.type=target.type==="password"?"text":"password";
  e.target.textContent=target.type==="password"?"👁":"🙈";
});

get("suPass")?.addEventListener("input",e=>{
  const v=e.target.value;
  const s=[/[A-Z]/,/[0-9]/,/[^A-Za-z0-9]/,/.{8,}/].filter(r=>r.test(v)).length;
  const bar=get("pwMeterBar"); const lbl=get("pwMeterLabel");
  const cols=["","#ef4444","#f59e0b","#22c55e","#00b894"]; const labs=["","Weak","Fair","Strong","Very strong"];
  if(bar){ bar.style.width=(s*25)+"%"; bar.style.background=cols[s]||""; }
  if(lbl){ lbl.textContent=v?labs[s]:""; lbl.style.color=cols[s]||"var(--text3)"; }
});

// Enter key navigation
get("siEmail")?.addEventListener("keydown",  e=>{ if(e.key==="Enter") get("siPass")?.focus(); });
get("siPass")?.addEventListener("keydown",   e=>{ if(e.key==="Enter") get("siSubmit")?.click(); });
get("suName")?.addEventListener("keydown",   e=>{ if(e.key==="Enter") get("suEmail")?.focus(); });
get("suEmail")?.addEventListener("keydown",  e=>{ if(e.key==="Enter") get("suPass")?.focus(); });
get("suPass")?.addEventListener("keydown",   e=>{ if(e.key==="Enter") get("suSubmit")?.click(); });

get("siSubmit")?.addEventListener("click",async()=>{
  const email=(get("siEmail")?.value||"").trim(), pass=get("siPass")?.value||"";
  if(!email||!pass){ showAuthErr("siErr","Please fill in all fields"); return; }
  clearAuthErrs();
  const btn=get("siSubmit"); btn.textContent="Signing in…"; btn.disabled=true;
  try{ await signInWithEmailAndPassword(auth,email,pass); closeAuth(); toast("Welcome back! 👋","success"); }
  catch(e){ showAuthErr("siErr",fmtErr(e.code)); }
  finally{ btn.textContent="Sign In"; btn.disabled=false; }
});

get("suSubmit")?.addEventListener("click",async()=>{
  const name=(get("suName")?.value||"").trim();
  const email=(get("suEmail")?.value||"").trim();
  const pass=get("suPass")?.value||"";
  const agree=get("suAgree")?.checked;
  if(!name){ showAuthErr("suErr","Please enter your name"); return; }
  if(!email||!pass){ showAuthErr("suErr","Please fill in all fields"); return; }
  if(pass.length<6){ showAuthErr("suErr","Password must be at least 6 characters"); return; }
  if(!agree){ showAuthErr("suErr","Please agree to the Terms of Service"); return; }
  clearAuthErrs();
  const btn=get("suSubmit"); btn.textContent="Creating account…"; btn.disabled=true;
  try{
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    if(name) await updateProfile(cred.user,{displayName:name});
    closeAuth(); toast(`Welcome to Faynx, ${name}! 🎉`,"success");
  }catch(e){ showAuthErr("suErr",fmtErr(e.code)); }
  finally{ btn.textContent="Create Account"; btn.disabled=false; }
});

[get("siGoogle"),get("suGoogle")].forEach(btn=>{
  if(!btn) return;
  btn.addEventListener("click",async()=>{
    btn.disabled=true;
    try{ await signInWithPopup(auth,gProvider); closeAuth(); toast("Signed in with Google ✓","success"); }
    catch(e){ showAuthErr(btn.id==="siGoogle"?"siErr":"suErr",fmtErr(e.code)); }
    finally{ btn.disabled=false; }
  });
});

get("forgotBtn")?.addEventListener("click",async()=>{
  const email=(get("siEmail")?.value||"").trim();
  if(!email){ showAuthErr("siErr","Enter your email address first"); return; }
  const btn=get("forgotBtn"); const orig=btn.textContent; btn.textContent="Sending…"; btn.disabled=true;
  try{ await sendPasswordResetEmail(auth,email); toast("Reset email sent 📬","success"); }
  catch(_){ toast("Could not send reset email","error"); }
  finally{ btn.textContent=orig; btn.disabled=false; }
});

async function doSignOut(){
  try{ await signOut(auth); }catch(_){}
  toast("Signed out","info");
  userData={favorites:[],collections:{},downloads:[],premium:false,prefs:{quality:"regular",layout:"masonry",safe:true}};
  refreshStats(); showSection("main"); setBnav("home");
  const ds="https://ui-avatars.com/api/?name=U&background=1c1c21&color=888&size=80";
  [get("headerAvatar"),get("menuAvatar")].forEach(el=>{ if(el) el.src=ds; });
}

onAuthStateChanged(auth,async user=>{
  const li=!!user;
  if(get("menuSignIn")) get("menuSignIn").style.display=li?"none":"";
  if(get("menuProfile")) get("menuProfile").style.display=li?"":"none";
  if(get("menuSignOut")) get("menuSignOut").style.display=li?"":"none";
  if(get("menuSep2")) get("menuSep2").style.display=li?"":"none";
  if(li){
    if(get("menuUserInfo")) get("menuUserInfo").style.display="flex";
    if(get("menuSep1")) get("menuSep1").style.display="";
    await loadUser(user.uid); refreshProfileUI();
  }else{
    if(get("menuUserInfo")) get("menuUserInfo").style.display="none";
    if(get("menuSep1")) get("menuSep1").style.display="none";
    const ds="https://ui-avatars.com/api/?name=U&background=1c1c21&color=888&size=80";
    [get("headerAvatar"),get("menuAvatar")].forEach(el=>{ if(el) el.src=ds; });
  }
});

function setBnav(k){
  document.querySelectorAll(".bnav").forEach(b=>b.classList.remove("active"));
  const map={home:"bHome",search:"bSearch",saved:"bSaved",profile:"bProfile"};
  get(map[k])?.classList.add("active");
}
get("bHome")?.addEventListener("click",()=>{ showSection("main"); setBnav("home"); });
get("bSearch")?.addEventListener("click",()=>{
  const ms=get("mobileSearch"); if(!ms) return;
  const open=ms.style.display==="none"||!ms.style.display;
  ms.style.display=open?"block":"none";
  if(open) setTimeout(()=>get("mobileSearchInput")?.focus(),50);
  setBnav("search");
});
get("bSaved")?.addEventListener("click",()=>openSaved());
get("bProfile")?.addEventListener("click",()=>openProfile());

function showSection(name){
  ["savedPage","collectionsPage","downloadsPage","profilePage"].forEach(id=>{ const el=get(id); if(el) el.style.display="none"; });
  const showMain=name==="main";
  const mw=get("mainWrap"); if(mw) mw.style.display=showMain?"":"none";
  const hero=get("hero");
  if(hero&&!showMain) hero.style.display="none";
  else if(hero&&showMain&&hero.dataset.hiddenBySearch!=="1") hero.style.display="";
  if(name!=="main"){ const el=get(`${name}Page`); if(el) el.style.display=""; }
  window.scrollTo({top:0,behavior:"smooth"});
}

get("collPickerOverlay")?.addEventListener("click",e=>{ if(e.target===get("collPickerOverlay")) get("collPickerOverlay").style.display="none"; });
get("newCollOverlay")?.addEventListener("click",e=>{ if(e.target===get("newCollOverlay")) get("newCollOverlay").style.display="none"; });

if("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(()=>{});

buildTopics(); initHero(); initHeroBg(); loadPhotos(true);
