/* ═══════════════════════════════════════
   FAYNX app.js  —  Full feature build
═══════════════════════════════════════ */

/*────────────────────────────────────────
  FIREBASE
────────────────────────────────────────*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const FB = initializeApp({
  apiKey:    "AIzaSyDWcWf_vcl_OLRM1Lj-Heh20k2zJqmGLok",
  authDomain:"faynx0.firebaseapp.com",
  projectId: "faynx0"
});
const auth = getAuth(FB);
const db   = getFirestore(FB);

/*────────────────────────────────────────
  UNSPLASH API
────────────────────────────────────────*/
const KEY  = "FMEevPJq5OgeZ4W2-k2fDpwchFyA_cyYhvs2HoDC6UM";
const BASE = "https://api.unsplash.com";
const H    = () => ({ Authorization: `Client-ID ${KEY}` });

const API = {
  async topics() {
    const r = await fetch(`${BASE}/topics?per_page=20&order_by=featured`, { headers: H() });
    if (!r.ok) throw 0; return r.json();
  },
  async topicPhotos(slug, page = 1, perPage = 20) {
    const r = await fetch(`${BASE}/topics/${slug}/photos?page=${page}&per_page=${perPage}&order_by=popular`, { headers: H() });
    if (!r.ok) throw 0; return r.json();
  },
  async search(q, page = 1, perPage = 20) {
    const r = await fetch(`${BASE}/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`, { headers: H() });
    if (!r.ok) throw 0; const d = await r.json(); return d.results;
  },
  async photo(id) {
    const r = await fetch(`${BASE}/photos/${id}`, { headers: H() });
    if (!r.ok) throw 0; return r.json();
  },
  async trackDownload(photo) {
    try { await fetch(photo.links.download_location, { headers: H() }); } catch {}
  },
  async random(count = 20) {
    const r = await fetch(`${BASE}/photos/random?count=${count}&topics=wallpapers`, { headers: H() });
    if (!r.ok) throw 0; return r.json();
  }
};

/*────────────────────────────────────────
  HELPERS
────────────────────────────────────────*/
const $ = id => document.getElementById(id);

function toast(msg, type = "info") {
  const c = $("toastContainer");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 320); }, 2800);
}

function fmtNum(n) {
  if (!n) return "—";
  if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(1)+"k";
  return String(n);
}

function closePage(id) {
  $(id).classList.add("hidden");
  $("mainGallery").style.display = "";
  $("heroBanner") && ($("heroBanner").style.display = "");
}

/*────────────────────────────────────────
  USER STATE (local cache)
────────────────────────────────────────*/
let userData = {
  favorites: [],
  collections: {},    // { id: { name, desc, photoIds:[], cover:url } }
  downloads: [],      // [ { photoId, thumb, author, ts } ]
  premium: false,
  prefs: { quality: "regular", layout: "masonry", safeSearch: true }
};

async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const d = snap.data();
      userData.favorites   = d.favorites   || [];
      userData.collections = d.collections || {};
      userData.downloads   = d.downloads   || [];
      userData.premium     = d.premium     || false;
      userData.prefs       = { ...userData.prefs, ...(d.prefs||{}) };
    }
    applyPrefs();
    updateProfileUI();
  } catch {}
}

async function saveUserData(uid) {
  try {
    await setDoc(doc(db, "users", uid), {
      favorites:   userData.favorites,
      collections: userData.collections,
      downloads:   userData.downloads,
      premium:     userData.premium,
      prefs:       userData.prefs
    }, { merge: true });
  } catch {}
}

function applyPrefs() {
  const q = userData.prefs.quality;
  const l = userData.prefs.layout;
  selectedQuality = q;
  $("defaultQuality") && ($("defaultQuality").value = q);
  $("defaultLayout")  && ($("defaultLayout").value  = l);
  if ($("safeSearch")) $("safeSearch").checked = userData.prefs.safeSearch !== false;
  applyLayout(l);
}

function applyLayout(l) {
  const g = $("gallery");
  if (!g) return;
  if (l === "grid") { g.classList.add("grid-view"); $("viewGrid")?.classList.add("active"); $("viewMasonry")?.classList.remove("active"); }
  else              { g.classList.remove("grid-view"); $("viewMasonry")?.classList.add("active"); $("viewGrid")?.classList.remove("active"); }
}

/*────────────────────────────────────────
  SPLASH
────────────────────────────────────────*/
(function runSplash() {
  const sp = $("splash");
  const bar = $("splashProgress");
  if (!sp) return;
  let w = 0;
  const iv = setInterval(() => {
    w = Math.min(w + Math.random() * 25, 90);
    bar.style.width = w + "%";
  }, 200);
  window.addEventListener("load", () => {
    clearInterval(iv);
    bar.style.width = "100%";
    setTimeout(() => sp.classList.add("out"), 400);
  });
})();

/*────────────────────────────────────────
  HERO BANNER — rotating backgrounds
────────────────────────────────────────*/
const HERO_TAGS = ["neon city","mountains at sunrise","abstract art","ocean waves","dark forest","space galaxy","cherry blossoms","rainy night street"];

(function initHero() {
  const heroTagsEl = $("heroTags");
  HERO_TAGS.forEach(tag => {
    const b = document.createElement("button");
    b.className = "hero-tag";
    b.textContent = tag;
    b.addEventListener("click", () => {
      $("heroSearchInput").value = tag;
      $("heroSearchBtn").click();
    });
    heroTagsEl.appendChild(b);
  });
})();

async function setHeroBg() {
  try {
    const photos = await API.random(4);
    const bg = $("heroBg");
    if (!bg || !photos?.length) return;
    let i = 0;
    bg.style.backgroundImage = `url(${photos[0].urls.regular})`;
    setInterval(() => {
      i = (i + 1) % photos.length;
      bg.style.backgroundImage = `url(${photos[i].urls.regular})`;
    }, 5000);
  } catch {}
}

/*────────────────────────────────────────
  SEARCH SUGGESTIONS
────────────────────────────────────────*/
const SUGGESTIONS = [
  "anime wallpaper","dark aesthetic","minimalist","neon lights","cyberpunk city",
  "forest morning","ocean sunset","abstract","mountain landscape","space nebula",
  "black and white","vintage","flowers macro","city night","rainy street",
  "geometric","night sky stars","tropical beach","autumn leaves","cozy cafe"
];

let suggDebounce;
function setupSearch() {
  const inp = $("searchInput");
  const drop = $("suggestionsDrop");
  if (!inp || !drop) return;

  inp.addEventListener("input", e => {
    const val = e.target.value.trim().toLowerCase();
    clearTimeout(suggDebounce);
    if (!val) { drop.classList.add("hidden"); return; }
    suggDebounce = setTimeout(() => {
      const matches = SUGGESTIONS.filter(s => s.includes(val)).slice(0, 6);
      if (!matches.length) { drop.classList.add("hidden"); return; }
      drop.innerHTML = matches.map(m => `
        <div class="sugg-item" data-q="${m}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7.5"/><path d="m20 20-4-4"/></svg>
          ${m}
        </div>`).join("");
      drop.classList.remove("hidden");
      drop.querySelectorAll(".sugg-item").forEach(el => {
        el.addEventListener("click", () => {
          inp.value = el.dataset.q;
          drop.classList.add("hidden");
          window._triggerSearch?.(el.dataset.q);
        });
      });
    }, 200);
  });

  document.addEventListener("click", e => {
    if (!inp.contains(e.target) && !drop.contains(e.target)) drop.classList.add("hidden");
  });
}

/*────────────────────────────────────────
  TOPICS BAR
────────────────────────────────────────*/
const FALLBACK_TOPICS = [
  { slug:"wallpapers",            title:"✨ All" },
  { slug:"nature",                title:"🌿 Nature" },
  { slug:"architecture-interior", title:"🏛 Architecture" },
  { slug:"travel",                title:"✈️ Travel" },
  { slug:"street-photography",    title:"🌆 Street" },
  { slug:"experimental",          title:"🎨 Abstract" },
  { slug:"textures-patterns",     title:"🔲 Textures" },
  { slug:"animals",               title:"🐾 Animals" },
  { slug:"fashion-beauty",        title:"💄 Fashion" },
  { slug:"film",                  title:"🎞 Film" },
  { slug:"food-drink",            title:"🍜 Food" },
  { slug:"athletics",             title:"🏃 Sport" },
];

async function buildTopics() {
  const bar = $("topicsBar");
  if (!bar) return;
  let topics = FALLBACK_TOPICS;
  try {
    const live = await API.topics();
    if (live?.length) {
      const em = Object.fromEntries(FALLBACK_TOPICS.map(t => [t.slug, t.title.split(" ")[0]]));
      topics = live.map(t => ({ slug: t.slug, title: (em[t.slug]||"") + " " + t.title }));
    }
  } catch {}

  topics.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.className = "topic-btn" + (i===0?" active":"");
    btn.textContent = t.title;
    btn.dataset.slug = t.slug;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".topic-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      $("searchInput") && ($("searchInput").value = "");
      $("mobileSearchInput") && ($("mobileSearchInput").value = "");
      $("sectionTitle") && ($("sectionTitle").textContent = t.title.replace(/^.{1,3} /,"") + " Wallpapers");
      feedMode = "topic"; feedSlug = t.slug; searchQuery = "";
      loadPhotos(true);
    });
    bar.appendChild(btn);
  });
}

/*────────────────────────────────────────
  GALLERY STATE
────────────────────────────────────────*/
let page        = 1;
let feedMode    = "topic";
let feedSlug    = "wallpapers";
let searchQuery = "";
let isLoading   = false;
let noMore      = false;
let reqId       = 0;
let controller  = null;
window.allPhotos = [];

let currentPhotos   = [];
let currentIndex    = 0;
let selectedQuality = "regular";
let lightboxPhoto   = null;  // full photo for add-to-collection

/*────────────────────────────────────────
  SEARCH HANDLER
────────────────────────────────────────*/
let sDebounce;
function handleSearch(val) {
  clearTimeout(sDebounce);
  sDebounce = setTimeout(() => {
    document.querySelectorAll(".topic-btn").forEach(b => b.classList.remove("active"));
    const q = val.trim();
    if (q) {
      feedMode = "search"; searchQuery = q;
      $("sectionTitle") && ($("sectionTitle").textContent = `Results for "${q}"`);
    } else {
      feedMode = "topic"; feedSlug = "wallpapers"; searchQuery = "";
      document.querySelector(".topic-btn")?.classList.add("active");
      $("sectionTitle") && ($("sectionTitle").textContent = "Trending Wallpapers");
    }
    loadPhotos(true);
    $("heroBanner").style.display = "none";
  }, 380);
}

$("searchInput")?.addEventListener("input", e => handleSearch(e.target.value));
$("mobileSearchInput")?.addEventListener("input", e => handleSearch(e.target.value));

window._triggerSearch = function(q) {
  $("searchInput").value = q;
  handleSearch(q);
};

// View toggle
$("viewMasonry")?.addEventListener("click", () => { userData.prefs.layout="masonry"; applyLayout("masonry"); savePrefs(); });
$("viewGrid")?.addEventListener("click",    () => { userData.prefs.layout="grid";    applyLayout("grid");    savePrefs(); });

function savePrefs() {
  const u = auth.currentUser;
  if (u) saveUserData(u.uid);
}

/*────────────────────────────────────────
  LOAD PHOTOS
────────────────────────────────────────*/
const gallery = $("gallery");

async function loadPhotos(reset = false) {
  if (!gallery) return;
  if (isLoading && !reset) return;
  if (noMore   && !reset) return;
  isLoading = true;
  noMore    = false;

  const id = ++reqId;
  if (controller) controller.abort();
  controller = new AbortController();

  if (reset) { gallery.innerHTML = ""; page = 1; window.allPhotos = []; }

  showSkeletons();
  const spinner = $("loadSpinner");
  if (page > 1 && spinner) spinner.classList.remove("hidden");

  try {
    let photos = [];
    if (feedMode === "search") photos = await API.search(searchQuery, page);
    else                       photos = await API.topicPhotos(feedSlug, page);

    if (id !== reqId) return;

    if (!photos?.length) {
      if (page === 1) showError("Nothing found — try a different search");
      noMore = true;
      if ($("endOfFeed") && page > 1) $("endOfFeed").classList.remove("hidden");
      return;
    }

    window.allPhotos = [...window.allPhotos, ...photos].slice(-300);
    photos.forEach((p, i) => renderPin(p, i, gallery));
    page++;

  } catch (err) {
    if (err?.name !== "AbortError" && id === reqId)
      if (page === 1) showError("Couldn't load. Check connection.");
  } finally {
    removeSkeletons();
    spinner?.classList.add("hidden");
    isLoading = false;
  }
}

// Infinite scroll
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) loadPhotos();
}, { passive: true });

/*────────────────────────────────────────
  SKELETONS
────────────────────────────────────────*/
const SKH = [280,200,340,250,190,315,220,290,170,355,235,265,300,180,310];
function showSkeletons() {
  removeSkeletons();
  if (page > 1) return;
  SKH.forEach(h => {
    const s = document.createElement("div");
    s.className = "pin-skeleton"; s.style.height = h+"px";
    gallery.appendChild(s);
  });
}
function removeSkeletons() { gallery.querySelectorAll(".pin-skeleton").forEach(el=>el.remove()); }
function showError(msg) {
  gallery.innerHTML = `<div class="error-state"><div class="err-ico">😵</div><p>${msg}</p><button class="retry-btn" onclick="loadPhotos(true)">Retry</button></div>`;
}

/*────────────────────────────────────────
  RENDER PIN CARD
────────────────────────────────────────*/
function renderPin(photo, idx = 0, container = gallery) {
  const card = document.createElement("div");
  card.className = "pin-card";
  card.style.animationDelay = `${Math.min(idx,10)*45}ms`;
  card.style.background = photo.color || "#1c1c21";

  // Image
  const img = document.createElement("img");
  img.className = "pin-img";
  img.loading = "lazy";
  img.alt = photo.alt_description || "";
  img.style.aspectRatio = `${photo.width}/${photo.height}`;
  img.src = photo.urls.small;
  img.style.opacity = "0";
  img.style.transition = "opacity 0.35s ease";
  img.onload = () => { img.style.opacity="1"; };

  // Overlay
  const ov = document.createElement("div");
  ov.className = "pin-overlay";

  // Top row
  const top = document.createElement("div");
  top.className = "pin-top-row";

  const saveBtn = document.createElement("button");
  saveBtn.className = "pin-save-btn";
  const isSaved = userData.favorites.some(f => f.id === photo.id);
  saveBtn.textContent = isSaved ? "Saved ✓" : "Save";
  if (isSaved) saveBtn.classList.add("saved");

  saveBtn.addEventListener("click", async e => {
    e.stopPropagation();
    if (!auth.currentUser) { openAuth(); return; }
    const state = await toggleFav(photo);
    saveBtn.textContent = state ? "Saved ✓" : "Save";
    saveBtn.classList.toggle("saved", state);
    toast(state ? "Saved 💖" : "Removed", state ? "success" : "info");
  });

  const moreBtn = document.createElement("button");
  moreBtn.className = "pin-icon-btn";
  moreBtn.title = "Share";
  moreBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
  moreBtn.addEventListener("click", async e => {
    e.stopPropagation();
    const url = photo.links.html+"?utm_source=faynx&utm_medium=referral";
    if (navigator.share) await navigator.share({ title:"Faynx Wallpaper", url });
    else { await navigator.clipboard.writeText(url); toast("Link copied!","success"); }
  });

  top.append(saveBtn, moreBtn);

  // Bottom row (credit + likes)
  const bot = document.createElement("div");
  bot.className = "pin-bot-row";

  const credit = document.createElement("div");
  credit.className = "pin-credit";
  credit.textContent = `📷 ${photo.user.name}`;

  const likes = document.createElement("span");
  likes.className = "pin-likes-badge";
  likes.textContent = photo.likes > 999 ? `${(photo.likes/1000).toFixed(1)}k ♥` : `${photo.likes} ♥`;

  bot.append(credit, likes);
  ov.append(top, bot);
  card.append(img, ov);
  card.addEventListener("click", () => openLightbox(photo));
  container.appendChild(card);
}

/*────────────────────────────────────────
  LIGHTBOX
────────────────────────────────────────*/
const lb = {
  el:       $("lightbox"),
  backdrop: $("lbBackdrop"),
  img:      $("lbImg"),
  shimmer:  $("lbShimmer"),
  prev:     $("lbPrev"),
  next:     $("lbNext"),
  counter:  $("lbCounter"),
  authorAv: $("lbAuthorAv"),
  authorNm: $("lbAuthorName"),
  authorHn: $("lbAuthorHandle"),
  desc:     $("lbDesc"),
  palette:  $("lbPalette"),
  tags:     $("lbTags"),
  stats:    $("lbStats"),
  download: $("lbDownload"),
  save:     $("lbSave"),
  copy:     $("lbCopy"),
  share:    $("lbShare"),
  close:    $("lbClose"),
  addColl:  $("lbAddToCollection"),
  attrib:   $("lbUnsplashLink"),
  attribNm: $("lbAttribName"),
  qpills:   $("qpills"),
};

function openLightbox(photo) {
  currentPhotos = window.allPhotos;
  currentIndex  = currentPhotos.findIndex(p => p.id === photo.id);
  if (currentIndex === -1) { currentPhotos = [photo]; currentIndex = 0; }
  lb.el.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  renderLightbox();
}

function closeLightbox() {
  lb.el.classList.add("hidden");
  document.body.style.overflow = "";
}

function renderLightbox() {
  const p = currentPhotos[currentIndex];
  if (!p) return;
  lightboxPhoto = p;

  // Image load with shimmer
  lb.shimmer.classList.add("on");
  lb.img.style.opacity = "0";
  const src = p.urls[selectedQuality] || p.urls.regular;
  const tmp = new Image();
  tmp.src = src;
  tmp.onload = () => { lb.img.src = tmp.src; lb.img.style.opacity="1"; lb.shimmer.classList.remove("on"); };
  tmp.onerror = () => { lb.img.src = p.urls.regular; lb.img.style.opacity="1"; lb.shimmer.classList.remove("on"); };

  // Author
  lb.authorAv.src  = p.user.profile_image?.medium || "";
  lb.authorNm.textContent = p.user.name;
  lb.authorHn.textContent = `@${p.user.username}`;

  // Description
  lb.desc.textContent = p.description || p.alt_description || "";
  lb.desc.style.display = lb.desc.textContent ? "" : "none";

  // Color palette
  lb.palette.innerHTML = "";
  if (p.color) {
    [p.color, lightenHex(p.color,30), darkenHex(p.color,30)].forEach(c => {
      const sw = document.createElement("div");
      sw.className = "lb-swatch";
      sw.style.background = c;
      sw.title = c;
      sw.addEventListener("click", async () => { await navigator.clipboard.writeText(c); toast(`Copied ${c}!`, "success"); });
      lb.palette.appendChild(sw);
    });
  }

  // Tags
  lb.tags.innerHTML = "";
  (p.tags||[]).slice(0,10).forEach(t => {
    const el = document.createElement("span");
    el.className = "lb-tag"; el.textContent = t.title;
    el.addEventListener("click", () => {
      closeLightbox();
      $("searchInput").value = t.title;
      window._triggerSearch(t.title);
    });
    lb.tags.appendChild(el);
  });

  // Stats
  lb.stats.innerHTML = `
    <div class="lb-stat"><span class="lb-stat-v">${fmtNum(p.likes)}</span><span class="lb-stat-l">Likes</span></div>
    <div class="lb-stat"><span class="lb-stat-v">${fmtNum(p.downloads||0)}</span><span class="lb-stat-l">Downloads</span></div>
    <div class="lb-stat"><span class="lb-stat-v">${p.width}×${p.height}</span><span class="lb-stat-l">Resolution</span></div>
    <div class="lb-stat"><span class="lb-stat-v">${p.exif?.model||"—"}</span><span class="lb-stat-l">Camera</span></div>
  `;

  // Nav
  lb.prev.disabled = currentIndex === 0;
  lb.next.disabled = currentIndex >= currentPhotos.length - 1;
  lb.counter.textContent = `${currentIndex+1} / ${currentPhotos.length}`;

  // Save state
  const saved = userData.favorites.some(f => f.id === p.id);
  lb.save.classList.toggle("saved", saved);
  lb.save.innerHTML = saved
    ? `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Saved`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Save`;

  // Attribution
  lb.attrib.href = p.links.html+"?utm_source=faynx&utm_medium=referral";
  lb.attribNm.textContent = p.user.name;

  // Preload neighbours
  const nx = currentPhotos[currentIndex+1];
  const pv = currentPhotos[currentIndex-1];
  if (nx) new Image().src = nx.urls.regular;
  if (pv) new Image().src = pv.urls.regular;
}

// Nav
lb.prev.addEventListener("click", () => { if (currentIndex>0) { currentIndex--; renderLightbox(); } });
lb.next.addEventListener("click", () => { if (currentIndex<currentPhotos.length-1) { currentIndex++; renderLightbox(); } });
lb.close.addEventListener("click", closeLightbox);
lb.backdrop.addEventListener("click", closeLightbox);

// Keyboard
document.addEventListener("keydown", e => {
  if (lb.el.classList.contains("hidden")) return;
  if (e.key==="ArrowRight") { if (currentIndex<currentPhotos.length-1){currentIndex++;renderLightbox();} }
  if (e.key==="ArrowLeft")  { if (currentIndex>0){currentIndex--;renderLightbox();} }
  if (e.key==="Escape") closeLightbox();
});

// Swipe
let _tx=0;
lb.el.addEventListener("touchstart", e=>{_tx=e.touches[0].clientX;},{passive:true});
lb.el.addEventListener("touchend", e=>{
  const diff=_tx-e.changedTouches[0].clientX;
  if(Math.abs(diff)>60){
    if(diff>0&&currentIndex<currentPhotos.length-1){currentIndex++;renderLightbox();}
    if(diff<0&&currentIndex>0){currentIndex--;renderLightbox();}
  }
},{passive:true});

// Quality pills
lb.qpills?.addEventListener("click", e => {
  const btn = e.target.closest(".qp");
  if (!btn) return;
  lb.qpills.querySelectorAll(".qp").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  selectedQuality = btn.dataset.q;
  renderLightbox();
});

// Download
lb.download.addEventListener("click", async () => {
  const p = currentPhotos[currentIndex];
  if (!p) return;
  toast("Preparing download…","info");
  try {
    await API.trackDownload(p);
    const url = p.urls[selectedQuality] || p.urls.full || p.urls.regular;
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `faynx-${p.id}.jpg`;
    a.click();
    toast("Download started! 🎉","success");
    // Save to download history
    recordDownload(p);
  } catch { toast("Download failed","error"); }
});

// Save
lb.save.addEventListener("click", async () => {
  if (!auth.currentUser) { openAuth(); return; }
  const p = currentPhotos[currentIndex];
  const state = await toggleFav(p);
  lb.save.classList.toggle("saved", state);
  lb.save.innerHTML = state
    ? `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Saved`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Save`;
  toast(state ? "Saved 💖" : "Removed", state ? "success" : "info");
});

// Copy URL
lb.copy.addEventListener("click", async () => {
  const p = currentPhotos[currentIndex];
  await navigator.clipboard.writeText(p.urls.regular);
  toast("Image URL copied!","success");
});

// Share
lb.share.addEventListener("click", async () => {
  const p = currentPhotos[currentIndex];
  const url = p.links.html+"?utm_source=faynx&utm_medium=referral";
  if (navigator.share) await navigator.share({ title:`${p.user.name} on Faynx`, url });
  else { await navigator.clipboard.writeText(url); toast("Link copied!","success"); }
});

// Add to collection
lb.addColl.addEventListener("click", () => {
  if (!auth.currentUser) { openAuth(); return; }
  openCollPicker();
});

// Color helpers
function lightenHex(hex, amt) {
  const n = parseInt(hex.slice(1),16);
  const r = Math.min(255,((n>>16)&0xff)+amt);
  const g = Math.min(255,((n>>8)&0xff)+amt);
  const b = Math.min(255,(n&0xff)+amt);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}
function darkenHex(hex, amt) {
  const n = parseInt(hex.slice(1),16);
  const r = Math.max(0,((n>>16)&0xff)-amt);
  const g = Math.max(0,((n>>8)&0xff)-amt);
  const b = Math.max(0,(n&0xff)-amt);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}

/*────────────────────────────────────────
  FAVORITES
────────────────────────────────────────*/
async function toggleFav(photo) {
  const user = auth.currentUser;
  if (!user) return false;
  const exists = userData.favorites.some(f => f.id === photo.id);
  if (exists) userData.favorites = userData.favorites.filter(f => f.id !== photo.id);
  else userData.favorites.push(photo);
  await saveUserData(user.uid);
  updateProfileStats();
  return !exists;
}

/*────────────────────────────────────────
  SAVED PAGE
────────────────────────────────────────*/
function openSaved() {
  if (!auth.currentUser) { openAuth(); return; }
  const grid = $("savedGrid");
  grid.innerHTML = "";
  if (!userData.favorites.length) {
    grid.innerHTML = `<div class="error-state"><div class="err-ico">💔</div><p>No saved wallpapers yet.<br/>Tap ❤ on any wallpaper to save it.</p></div>`;
  } else {
    userData.favorites.slice().reverse().forEach((p,i) => renderPin(p,i,grid));
    $("savedCount").textContent = `(${userData.favorites.length})`;
  }
  hideMain();
  $("savedPage").classList.remove("hidden");
  setBnavActive("saved");
}

$("savedBack").addEventListener("click", () => { $("savedPage").classList.add("hidden"); showMain(); setBnavActive("home"); });

/*────────────────────────────────────────
  COLLECTIONS
────────────────────────────────────────*/
function openCollections() {
  if (!auth.currentUser) { openAuth(); return; }
  renderCollections();
  hideMain();
  $("collectionsPage").classList.remove("hidden");
}

function renderCollections() {
  const grid = $("collectionsGrid");
  grid.innerHTML = "";
  const cols = Object.entries(userData.collections);
  if (!cols.length) {
    grid.innerHTML = `<div class="error-state" style="grid-column:1/-1"><div class="err-ico">🗂</div><p>No collections yet. Create one!</p></div>`;
    return;
  }
  cols.forEach(([id, col]) => {
    const card = document.createElement("div");
    card.className = "coll-card";
    const photoUrls = (col.photoIds || []).map(pid => {
      const p = window.allPhotos.find(x => x.id === pid);
      return p ? p.urls.small : null;
    }).filter(Boolean).slice(0,4);

    card.innerHTML = `
      <div class="coll-cover ${photoUrls.length<=1?"single":""}">
        ${photoUrls.map(u=>`<img src="${u}" alt="" loading="lazy"/>`).join("") || "<div style='background:var(--bg4);width:100%;height:100%'></div>"}
      </div>
      <div class="coll-meta">
        <h4>${col.name}</h4>
        <small>${col.photoIds?.length||0} wallpapers${col.desc ? " · "+col.desc : ""}</small>
      </div>`;
    grid.appendChild(card);
  });
}

$("collectionsBack").addEventListener("click", () => { $("collectionsPage").classList.add("hidden"); showMain(); });
$("newCollectionBtn").addEventListener("click", () => openNewCollModal());

/*────────────────────────────────────────
  COLLECTION PICKER (for add-to-coll)
────────────────────────────────────────*/
function openCollPicker() {
  const modal = $("collPickerModal");
  const list  = $("collPickerList");
  list.innerHTML = "";
  const cols = Object.entries(userData.collections);
  if (!cols.length) {
    list.innerHTML = `<p style="color:var(--text2);font-size:13px">No collections yet.</p>`;
  } else {
    cols.forEach(([id, col]) => {
      const item = document.createElement("div");
      item.className = "cp-item";
      const cover = col.photoIds?.length
        ? window.allPhotos.find(x=>x.id===col.photoIds[0])?.urls?.small || ""
        : "";
      item.innerHTML = `
        ${cover ? `<img src="${cover}" alt=""/>` : `<div style="width:40px;height:52px;background:var(--bg4);border-radius:6px"></div>`}
        <div class="cp-item-info"><b>${col.name}</b><small>${col.photoIds?.length||0} items</small></div>`;
      item.addEventListener("click", async () => {
        await addToCollection(id, lightboxPhoto);
        modal.classList.add("hidden");
        toast(`Added to "${col.name}"!`, "success");
      });
      list.appendChild(item);
    });
  }
  modal.classList.remove("hidden");
}

async function addToCollection(collId, photo) {
  if (!photo) return;
  const col = userData.collections[collId];
  if (!col) return;
  if (!col.photoIds) col.photoIds = [];
  if (!col.photoIds.includes(photo.id)) {
    col.photoIds.push(photo.id);
    await saveUserData(auth.currentUser.uid);
    updateProfileStats();
  }
}

$("collPickerClose").addEventListener("click", () => $("collPickerModal").classList.add("hidden"));
$("collPickerNewBtn").addEventListener("click", () => { $("collPickerModal").classList.add("hidden"); openNewCollModal(); });

// New collection modal
function openNewCollModal() {
  $("newCollModal").classList.remove("hidden");
  $("newCollName").value = "";
  $("newCollDesc").value = "";
  setTimeout(() => $("newCollName").focus(), 100);
}
$("newCollClose").addEventListener("click", () => $("newCollModal").classList.add("hidden"));
$("newCollSave").addEventListener("click", async () => {
  const name = $("newCollName").value.trim();
  if (!name) { toast("Enter a name","warn"); return; }
  const id = "coll_" + Date.now();
  userData.collections[id] = {
    name, desc: $("newCollDesc").value.trim(),
    photoIds: [], createdAt: Date.now()
  };
  await saveUserData(auth.currentUser.uid);
  $("newCollModal").classList.add("hidden");
  toast("Collection created! 🗂","success");
  updateProfileStats();
  renderCollections();
});

/*────────────────────────────────────────
  DOWNLOADS HISTORY
────────────────────────────────────────*/
function recordDownload(photo) {
  const user = auth.currentUser;
  if (!user) return;
  userData.downloads.unshift({
    photoId: photo.id,
    thumb:   photo.urls.thumb || photo.urls.small,
    author:  photo.user.name,
    width:   photo.width,
    height:  photo.height,
    ts:      Date.now(),
    urls:    photo.urls
  });
  userData.downloads = userData.downloads.slice(0, 100);
  saveUserData(user.uid);
  updateProfileStats();
}

function openDownloads() {
  const list = $("downloadsList");
  list.innerHTML = "";
  if (!userData.downloads.length) {
    list.innerHTML = `<div class="error-state"><div class="err-ico">📥</div><p>No download history yet.</p></div>`;
  } else {
    userData.downloads.forEach((dl, i) => {
      const el = document.createElement("div");
      el.className = "dl-item";
      el.style.animationDelay = `${i*30}ms`;
      el.innerHTML = `
        <img src="${dl.thumb}" alt="" loading="lazy"/>
        <div class="dl-item-info">
          <b>${dl.author}</b>
          <small>${dl.width}×${dl.height} · ${new Date(dl.ts).toLocaleDateString()}</small>
        </div>
        <button class="dl-redownload" data-id="${dl.photoId}">Re-download</button>`;
      el.querySelector(".dl-redownload").addEventListener("click", async () => {
        try {
          const url = dl.urls?.[selectedQuality] || dl.urls?.regular || dl.thumb;
          const res = await fetch(url);
          const blob = await res.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob); a.download = `faynx-${dl.photoId}.jpg`; a.click();
          toast("Download started!","success");
        } catch { toast("Download failed","error"); }
      });
      list.appendChild(el);
    });
  }
  hideMain();
  $("downloadsPage").classList.remove("hidden");
}

$("downloadsBack").addEventListener("click", () => { $("downloadsPage").classList.add("hidden"); showMain(); });
$("clearDownloadsBtn").addEventListener("click", async () => {
  userData.downloads = [];
  const u = auth.currentUser;
  if (u) await saveUserData(u.uid);
  openDownloads();
  toast("History cleared","info");
});

/*────────────────────────────────────────
  PROFILE PAGE
────────────────────────────────────────*/
function openProfile() {
  if (!auth.currentUser) { openAuth(); return; }
  updateProfileUI();
  hideMain();
  $("profilePage").classList.remove("hidden");
  setBnavActive("profile");
}

$("profileBack").addEventListener("click", () => { $("profilePage").classList.add("hidden"); showMain(); setBnavActive("home"); });

function updateProfileUI() {
  const user = auth.currentUser;
  if (!user) return;

  const av = $("profileAvatar");
  if (av && user.photoURL) av.src = user.photoURL;
  $("headerAvatar").src = user.photoURL || `https://i.pravatar.cc/80?u=${user.uid}`;
  $("menuAvatar").src   = user.photoURL || `https://i.pravatar.cc/80?u=${user.uid}`;
  const dn = $("profileName");  if(dn) dn.textContent = user.displayName || "User";
  const em = $("profileEmail"); if(em) em.textContent = user.email;
  const mn = $("menuName");     if(mn) mn.textContent = user.displayName || "User";
  const me = $("menuEmail");    if(me) me.textContent = user.email;
  const diNm = $("displayNameInput"); if(diNm) diNm.value = user.displayName || "";

  const badge = $("profileBadge");
  if (badge) {
    badge.textContent = userData.premium ? "⭐ Premium" : "Free";
    badge.className   = "badge " + (userData.premium ? "premium" : "free");
  }
  $("upgradeBtn")?.classList.toggle("hidden", userData.premium);
  updateProfileStats();
}

function updateProfileStats() {
  const ss = $("statSaved");       if(ss) ss.textContent = userData.favorites.length;
  const sd = $("statDownloads");   if(sd) sd.textContent = userData.downloads.length;
  const sc = $("statCollections"); if(sc) sc.textContent = Object.keys(userData.collections).length;
}

// Save display name
$("saveNameBtn")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;
  const name = $("displayNameInput")?.value?.trim();
  if (!name) return;
  try {
    await updateProfile(user, { displayName: name });
    updateProfileUI();
    toast("Name updated!","success");
  } catch { toast("Update failed","error"); }
});

// Preferences
$("defaultQuality")?.addEventListener("change", e => { userData.prefs.quality = e.target.value; selectedQuality = e.target.value; savePrefs(); });
$("defaultLayout")?.addEventListener("change",  e => { userData.prefs.layout  = e.target.value; applyLayout(e.target.value); savePrefs(); });
$("safeSearch")?.addEventListener("change",     e => { userData.prefs.safeSearch = e.target.checked; savePrefs(); });

// Premium redeem
$("redeemBtn")?.addEventListener("click", async () => {
  const code = $("redeemInput")?.value?.trim().toUpperCase();
  if (!code) { toast("Enter a code","warn"); return; }
  const user = auth.currentUser;
  if (!user) { openAuth(); return; }
  const VALID = ["FAYNX2024","PREMIUM1","WALLHD99","FAYNXPRO","UPGRADE50"];
  if (VALID.includes(code)) {
    userData.premium = true;
    await saveUserData(user.uid);
    updateProfileUI();
    toast("🎉 Premium activated!","success");
    if ($("redeemInput")) $("redeemInput").value = "";
  } else { toast("Invalid or expired code","error"); }
});

$("upgradeBtn")?.addEventListener("click", () => toast("Premium plans coming soon! 🚀","info"));
$("signOutBtn2")?.addEventListener("click", () => { $("menuSignOut")?.click(); });

/*────────────────────────────────────────
  AUTH
────────────────────────────────────────*/
function openAuth(tab = "signin") {
  const modal = $("authModal");
  modal.classList.remove("hidden");
  document.querySelectorAll(".auth-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  document.querySelectorAll(".auth-panel").forEach(p => {
    p.classList.toggle("active", p.id === (tab==="signin"?"signinPanel":"signupPanel"));
  });
  clearAuthErrors();
}

function clearAuthErrors() {
  [$("siError"), $("suError")].forEach(e => { if(e){e.classList.add("hidden");e.textContent="";} });
}

function showErr(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg; el.classList.remove("hidden");
}

// Sign In
$("siSubmit")?.addEventListener("click", async () => {
  const email = $("siEmail")?.value?.trim();
  const pass  = $("siPassword")?.value;
  if (!email || !pass) { showErr("siError","Please fill in all fields"); return; }
  clearAuthErrors();
  $("siSubmit").textContent = "Signing in…"; $("siSubmit").disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    $("authModal").classList.add("hidden");
    toast("Welcome back! 👋","success");
  } catch (err) {
    showErr("siError", friendlyAuthErr(err.code));
  } finally { $("siSubmit").textContent = "Sign In"; $("siSubmit").disabled = false; }
});

// Sign Up
$("suSubmit")?.addEventListener("click", async () => {
  const name  = $("suName")?.value?.trim();
  const email = $("suEmail")?.value?.trim();
  const pass  = $("suPassword")?.value;
  const agree = $("agreeTerms")?.checked;
  if (!email || !pass)  { showErr("suError","Please fill in all fields"); return; }
  if (pass.length < 6)  { showErr("suError","Password must be at least 6 characters"); return; }
  if (!agree)           { showErr("suError","Please agree to the Terms"); return; }
  clearAuthErrors();
  $("suSubmit").textContent = "Creating…"; $("suSubmit").disabled = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) await updateProfile(cred.user, { displayName: name });
    $("authModal").classList.add("hidden");
    toast("Account created! 🎉","success");
  } catch (err) {
    showErr("suError", friendlyAuthErr(err.code));
  } finally { $("suSubmit").textContent = "Create Account"; $("suSubmit").disabled = false; }
});

// Google Sign In / Sign Up
[$("siGoogle"), $("suGoogle")].forEach(btn => {
  btn?.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      $("authModal").classList.add("hidden");
      toast("Signed in with Google ✓","success");
    } catch { toast("Google sign-in failed","error"); }
  });
});

// Forgot password
$("forgotBtn")?.addEventListener("click", async () => {
  const email = $("siEmail")?.value?.trim();
  if (!email) { showErr("siError","Enter your email first"); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    toast("Reset email sent! Check your inbox 📬","success");
  } catch { toast("Could not send reset email","error"); }
});

// Close
$("authClose")?.addEventListener("click", () => $("authModal").classList.add("hidden"));
$("authModal")?.addEventListener("click", e => { if(e.target===$("authModal")) $("authModal").classList.add("hidden"); });

function friendlyAuthErr(code) {
  const MAP = {
    "auth/user-not-found":      "No account found with this email.",
    "auth/wrong-password":      "Incorrect password.",
    "auth/email-already-in-use":"An account already exists with this email.",
    "auth/invalid-email":       "Please enter a valid email address.",
    "auth/weak-password":       "Password is too weak (min 6 chars).",
    "auth/too-many-requests":   "Too many attempts. Please try again later.",
    "auth/invalid-credential":  "Incorrect email or password.",
  };
  return MAP[code] || "Something went wrong. Please try again.";
}

// Auth state
onAuthStateChanged(auth, async user => {
  const loggedIn = !!user;

  // Header items
  $("menuSignIn")   ?.classList.toggle("hidden", loggedIn);
  $("menuProfile")  ?.classList.toggle("hidden", !loggedIn);
  $("menuSignOut")  ?.classList.toggle("hidden", !loggedIn);
  $("menuSettings") ?.classList.toggle("hidden", !loggedIn);
  $("menuUserInfo") ?.classList.toggle("hidden", !loggedIn);
  $("menuDivider1") ?.classList.toggle("hidden", !loggedIn);

  if (user) {
    await loadUserData(user.uid);
    updateProfileUI();
  } else {
    userData = { favorites:[], collections:{}, downloads:[], premium:false, prefs:{quality:"regular",layout:"masonry",safeSearch:true} };
  }
});

// Menu wiring
$("menuSignIn")   ?.addEventListener("click", () => { $("accountMenu").classList.add("hidden"); openAuth("signin"); });
$("menuProfile")  ?.addEventListener("click", () => { $("accountMenu").classList.add("hidden"); openProfile(); });
$("menuSaved")    ?.addEventListener("click", () => { $("accountMenu").classList.add("hidden"); openSaved(); });
$("menuCollections")?.addEventListener("click",()=>{ $("accountMenu").classList.add("hidden"); openCollections(); });
$("menuDownloads") ?.addEventListener("click", () => { $("accountMenu").classList.add("hidden"); openDownloads(); });
$("menuSignOut")  ?.addEventListener("click", async () => {
  $("accountMenu").classList.add("hidden");
  await signOut(auth);
  toast("Signed out","info");
  $("profilePage").classList.add("hidden");
  showMain();
});

/*────────────────────────────────────────
  BOTTOM NAV
────────────────────────────────────────*/
function setBnavActive(page) {
  document.querySelectorAll(".bnav-btn").forEach(b => b.classList.remove("active"));
  const map = { home:"bnavHome", search:"bnavSearch", saved:"bnavSaved", profile:"bnavProfile" };
  $(map[page])?.classList.add("active");
}

$("bnavHome")?.addEventListener("click",    () => { hideAllPages(); showMain(); setBnavActive("home"); });
$("bnavSearch")?.addEventListener("click",  () => {
  const bar = $("mobileSearchBar");
  bar.classList.toggle("hidden");
  if (!bar.classList.contains("hidden")) $("mobileSearchInput").focus();
  setBnavActive("search");
});
$("bnavSaved")?.addEventListener("click",   () => openSaved());
$("bnavProfile")?.addEventListener("click", () => openProfile());

function hideAllPages() {
  ["savedPage","collectionsPage","downloadsPage","profilePage"].forEach(id => $(id)?.classList.add("hidden"));
}
function hideMain() {
  $("mainGallery").style.display = "none";
  $("heroBanner") && ($("heroBanner").style.display = "none");
}
function showMain() {
  $("mainGallery").style.display = "";
  $("heroBanner") && ($("heroBanner").style.display = "");
  hideAllPages();
}

/*────────────────────────────────────────
  HEADER SCROLL SHRINK
────────────────────────────────────────*/
let lastScroll = 0;
window.addEventListener("scroll", () => {
  const curr = window.scrollY;
  const header = $("header");
  if (curr > lastScroll && curr > 120) header.classList.add("header-hidden");
  else header.classList.remove("header-hidden");
  lastScroll = curr;
}, { passive: true });

/*────────────────────────────────────────
  SERVICE WORKER
────────────────────────────────────────*/
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}

/*────────────────────────────────────────
  INIT
────────────────────────────────────────*/
setupSearch();
buildTopics();
setHeroBg();
loadPhotos(true);

// Add header-hidden CSS dynamically
const style = document.createElement("style");
style.textContent = `.header-hidden { transform: translateY(-100%); transition: transform 0.3s var(--ease) !important; } .header { transition: transform 0.3s var(--ease); }`;
document.head.appendChild(style);
