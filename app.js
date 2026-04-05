/*********************************
  FIREBASE SETUP
*********************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWcWf_vcl_OLRM1Lj-Heh20k2zJqmGLok",
  authDomain: "faynx0.firebaseapp.com",
  projectId: "faynx0"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

// ✅ ADD THIS HERE
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      console.log("LOGIN SUCCESS:", result.user);
      showToast("Signed in successfully", "success");
    }
  })
  .catch((error) => {
    console.error("REDIRECT ERROR:", error);
  });

/*********************************
  GLOBAL STATE
*********************************/
const ACCESS_KEY = "FMEevPJq5OgeZ4W2-k2fDpwchFyA_cyYhvs2HoDC6UM";

let page = 1;
let isLoading = false;
let controller = null;
let requestId = 0;
let currentPhotos = [];
let currentIndex = 0;
window.allPhotos = [];

/*********************************
  DOM HELPERS
*********************************/
const $ = id => document.getElementById(id);

const gallery        = $("gallery");
const searchInput    = $("searchInput");
const mobileSearch   = $("mobileSearchInput");
const loginBtn       = $("loginBtn");
const logoutBtn      = $("logoutBtn");
const profileBtn     = $("profileBtn");
const authModal      = $("authModal");
const authSubmitBtn  = $("authSubmitBtn");
const googleBtn      = $("googleBtn");
const emailInput     = $("emailInput");
const passwordInput  = $("passwordInput");
const authError      = $("authError");
const profilePage    = $("profilePage");
const closeProfileBtn = $("closeProfileBtn");
const redeemBtn      = $("redeemBtn");
const redeemInput    = $("redeemInput");

/*********************************
  TOAST NOTIFICATIONS
*********************************/
function showToast(msg, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast-show"));

  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

/*********************************
  UNSPLASH API LAYER
  - Topics API  → curated feeds
  - Search API  → keyword search
  - Collections → curated packs
  - Photo stats → track downloads
*********************************/
const UNSPLASH = {
  base: "https://api.unsplash.com",
  headers: () => ({ Authorization: `Client-ID ${ACCESS_KEY}` }),

  async getTopics() {
    const res = await fetch(
      `${this.base}/topics?per_page=20&order_by=featured`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error("Topics fetch failed");
    return res.json();
  },

  async getTopicPhotos(topicSlug, page = 1, perPage = 15) {
    const res = await fetch(
      `${this.base}/topics/${topicSlug}/photos?page=${page}&per_page=${perPage}&orientation=portrait`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error("Topic photos fetch failed");
    return res.json(); // returns array directly
  },

  async search(query, page = 1, perPage = 15) {
    const res = await fetch(
      `${this.base}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=portrait`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return data.results;
  },

  async getCollections(page = 1) {
    const res = await fetch(
      `${this.base}/collections/featured?page=${page}&per_page=12`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error("Collections fetch failed");
    return res.json();
  },

  async getCollectionPhotos(collectionId, page = 1, perPage = 15) {
    const res = await fetch(
      `${this.base}/collections/${collectionId}/photos?page=${page}&per_page=${perPage}&orientation=portrait`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error("Collection photos fetch failed");
    return res.json();
  },

  // Unsplash requires triggering download endpoint when user downloads
  async trackDownload(photo) {
    try {
      await fetch(photo.links.download_location, { headers: this.headers() });
    } catch { /* non-blocking */ }
  },

  // Random wallpapers for homepage
  async getRandom(count = 15) {
    const res = await fetch(
      `${this.base}/photos/random?count=${count}&orientation=portrait&topics=wallpapers`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error("Random fetch failed");
    return res.json();
  }
};

/*********************************
  FEED MODE — controls which API
  endpoint drives the gallery
  modes: "topic" | "search" | "collection" | "random"
*********************************/
let feedMode   = "topic";           // current mode
let feedSlug   = "wallpapers";      // topic slug or collection id
let searchQuery = "";               // only used in search mode

/*********************************
  CATEGORIES  (built from Unsplash Topics API)
*********************************/

// Fallback topics in case API is slow / rate-limited
const FALLBACK_TOPICS = [
  { slug: "wallpapers",    title: "✨ All",         emoji: "✨" },
  { slug: "nature",        title: "🌿 Nature",      emoji: "🌿" },
  { slug: "architecture-interior", title: "🏛 Architecture", emoji: "🏛" },
  { slug: "travel",        title: "✈️ Travel",      emoji: "✈️" },
  { slug: "street-photography", title: "🌆 Street",  emoji: "🌆" },
  { slug: "experimental",  title: "🎨 Abstract",    emoji: "🎨" },
  { slug: "textures-patterns", title: "🔲 Textures", emoji: "🔲" },
  { slug: "animals",       title: "🐾 Animals",     emoji: "🐾" },
  { slug: "fashion-beauty", title: "💄 Fashion",    emoji: "💄" },
  { slug: "film",          title: "🎞 Film",        emoji: "🎞" },
  { slug: "people",        title: "👤 People",      emoji: "👤" },
  { slug: "food-drink",    title: "🍜 Food",        emoji: "🍜" },
];

async function buildCategories() {
  const wrap = $("categoriesBar");
  if (!wrap) return;

  let topics = FALLBACK_TOPICS;

  try {
    const live = await UNSPLASH.getTopics();
    if (live?.length) {
      // Map live topics, add emoji from fallback if we know the slug
      const emojiMap = Object.fromEntries(FALLBACK_TOPICS.map(t => [t.slug, t.emoji]));
      topics = live.map(t => ({
        slug:  t.slug,
        title: (emojiMap[t.slug] ? emojiMap[t.slug] + " " : "") + t.title,
        cover: t.cover_photo?.urls?.thumb
      }));
    }
  } catch {
    // silently fall back
  }

  topics.forEach((topic, i) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (i === 0 ? " active" : "");
    btn.textContent = topic.title;
    btn.dataset.slug = topic.slug;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Clear search inputs
      if (searchInput)  searchInput.value  = "";
      if (mobileSearch) mobileSearch.value = "";

      feedMode  = "topic";
      feedSlug  = topic.slug;
      searchQuery = "";
      loadWallpapers(true);
    });

    wrap.appendChild(btn);
  });
}

/*********************************
  SEARCH (DEBOUNCED)
*********************************/
let debounceTimer;

function handleSearch(val) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const q = val.trim();
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));

    if (q) {
      feedMode    = "search";
      searchQuery = q;
    } else {
      // Empty search → restore default topic
      feedMode  = "topic";
      feedSlug  = "wallpapers";
      searchQuery = "";
      document.querySelector(".cat-btn")?.classList.add("active");
    }
    loadWallpapers(true);
  }, 420);
}

searchInput?.addEventListener("input", e => handleSearch(e.target.value));
mobileSearch?.addEventListener("input", e => handleSearch(e.target.value));

/*********************************
  SKELETON LOADING
*********************************/
function showSkeletons() {
  removeSkeletons();
  const count = window.innerWidth < 600 ? 4 : 8;
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    gallery.appendChild(sk);
  }
}

function removeSkeletons() {
  gallery.querySelectorAll(".skeleton").forEach(el => el.remove());
}

/*********************************
  ERROR UI
*********************************/
function showError(msg = "Something went wrong") {
  gallery.innerHTML = `
    <div class="error-state">
      <div class="error-icon">😵</div>
      <p>${msg}</p>
      <button onclick="loadWallpapers(true)" class="retry-btn">Try Again</button>
    </div>`;
}

/*********************************
  LOAD WALLPAPERS  (multi-mode)
*********************************/
async function loadWallpapers(reset = false) {
  if (!gallery) return;
  if (isLoading && !reset) return;
  isLoading = true;

  const id = ++requestId;

  if (controller) controller.abort();
  controller = new AbortController();

  if (reset) {
    gallery.innerHTML = "";
    page = 1;
    window.allPhotos = [];
  }

  showSkeletons();

  try {
    let photos = [];

    if (feedMode === "search") {
      photos = await UNSPLASH.search(searchQuery, page);
    } else if (feedMode === "collection") {
      photos = await UNSPLASH.getCollectionPhotos(feedSlug, page);
    } else {
      // "topic" mode (default)
      photos = await UNSPLASH.getTopicPhotos(feedSlug, page);
    }

    if (id !== requestId) return;

    if (!photos?.length) {
      if (page === 1) showError("No wallpapers found");
      return;
    }

    window.allPhotos = [...window.allPhotos, ...photos].slice(-120);

    photos.forEach((photo, idx) => renderCard(photo, idx));

    page++;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error(err);
      if (page === 1) showError("Failed to load wallpapers. Check your connection.");
    }
  } finally {
    removeSkeletons();
    isLoading = false;
  }
}

/*********************************
  RENDER CARD
*********************************/
function renderCard(photo, idx = 0) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.animationDelay = `${idx * 40}ms`;

  // Blurhash placeholder color
  const color = photo.color || "#111";
  card.style.background = color;

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = photo.alt_description || photo.description || "wallpaper";
  img.src = photo.urls.small;
  img.style.opacity = "0";
  img.style.transition = "opacity 0.4s ease";
  img.onload = () => { img.style.opacity = "1"; };

  // Photographer credit
  const credit = document.createElement("div");
  credit.className = "card-credit";
  credit.innerHTML = `📷 ${photo.user.name}`;

  // Like count badge
  const likes = document.createElement("div");
  likes.className = "card-likes";
  likes.textContent = photo.likes > 999
    ? `${(photo.likes / 1000).toFixed(1)}k ♥`
    : `${photo.likes} ♥`;

  // Fav badge
  const favBadge = document.createElement("button");
  favBadge.className = "card-fav-badge";
  favBadge.innerHTML = "🤍";
  favBadge.title = "Add to favorites";
  favBadge.addEventListener("click", async (e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) { showToast("Login to save favorites", "warn"); return; }
    const state = await toggleFavorite(photo);
    favBadge.innerHTML = state ? "💖" : "🤍";
    showToast(state ? "Added to favorites" : "Removed", state ? "success" : "info");
  });

  card.addEventListener("click", () => openModal(photo));
  card.appendChild(img);
  card.appendChild(credit);
  card.appendChild(likes);
  card.appendChild(favBadge);
  gallery.appendChild(card);
}

/*********************************
  INFINITE SCROLL
*********************************/
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    loadWallpapers();
  }
}, { passive: true });

/*********************************
  FULLSCREEN MODAL  (single, clean implementation)
*********************************/
function openModal(photo) {
  currentPhotos = window.allPhotos;
  currentIndex = currentPhotos.findIndex(p => p.id === photo.id);
  if (currentIndex === -1) { currentPhotos = [photo]; currentIndex = 0; }

  // Remove any existing modal
  document.querySelector(".wallpaper-fullscreen")?.remove();

  const modal = document.createElement("div");
  modal.className = "wallpaper-fullscreen";
  modal.innerHTML = `
    <div class="fullscreen-bg"></div>
    <img class="fullscreen-img" alt="wallpaper" />

    <div class="top-bar">
      <button class="fs-btn close-btn" title="Close (Esc)">✕</button>
      <span class="photo-counter"></span>
    </div>

    <button class="nav-btn nav-prev" title="Previous (←)">&#8592;</button>
    <button class="nav-btn nav-next" title="Next (→)">&#8594;</button>

    <div class="bottom-bar">
      <select id="qualitySelect" class="quality-select">
        <option value="regular">HD</option>
        <option value="full">4K</option>
      </select>
      <button id="downloadBtn" class="fs-btn" title="Download">⬇ Download</button>
      <button id="shareBtn"   class="fs-btn" title="Share">🔗 Share</button>
      <button id="favBtn"     class="fs-btn" title="Favorite">🤍</button>
    </div>
  `;

  document.body.appendChild(modal);

  const img         = modal.querySelector(".fullscreen-img");
  const bgBlur      = modal.querySelector(".fullscreen-bg");
  const qualitySel  = modal.querySelector("#qualitySelect");
  const counter     = modal.querySelector(".photo-counter");
  const favBtn      = modal.querySelector("#favBtn");
  const navPrev     = modal.querySelector(".nav-prev");
  const navNext     = modal.querySelector(".nav-next");

  // ---- Pinch/Zoom state ----
  let scale = 1, posX = 0, posY = 0;
  let lastTap = 0;
  let pinchDist = null;

  function resetTransform() {
    scale = 1; posX = 0; posY = 0;
    img.style.transform = "";
    img.style.cursor = "default";
  }

  // ---- Image loading ----
  function updateImage() {
    const p = currentPhotos[currentIndex];
    if (!p) return;

    const src = p.urls[qualitySel.value] || p.urls.regular;
    resetTransform();

    img.style.opacity = "0";
    bgBlur.style.backgroundImage = `url(${p.urls.small})`;

    const tmp = new Image();
    tmp.src = src;
    tmp.onload = () => {
      img.src = src;
      img.style.opacity = "1";
    };

    // counter
    counter.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;

    // nav visibility
    navPrev.style.opacity = currentIndex > 0 ? "1" : "0.2";
    navPrev.style.pointerEvents = currentIndex > 0 ? "auto" : "none";
    navNext.style.opacity = currentIndex < currentPhotos.length - 1 ? "1" : "0.2";
    navNext.style.pointerEvents = currentIndex < currentPhotos.length - 1 ? "auto" : "none";

    // preload neighbours
    const next = currentPhotos[currentIndex + 1];
    const prev = currentPhotos[currentIndex - 1];
    if (next) new Image().src = next.urls.regular;
    if (prev) new Image().src = prev.urls.regular;

    updateFavUI();
  }

  function goNext() {
    if (currentIndex < currentPhotos.length - 1) { currentIndex++; updateImage(); }
  }
  function goPrev() {
    if (currentIndex > 0) { currentIndex--; updateImage(); }
  }

  // ---- Nav buttons ----
  navNext.addEventListener("click", e => { e.stopPropagation(); goNext(); });
  navPrev.addEventListener("click", e => { e.stopPropagation(); goPrev(); });

  // ---- Keyboard ----
  function onKey(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goPrev();
    if (e.key === "Escape") closeModal();
  }
  document.addEventListener("keydown", onKey);

  // ---- Close ----
  function closeModal() {
    document.removeEventListener("keydown", onKey);
    modal.style.opacity = "0";
    setTimeout(() => modal.remove(), 300);
  }
  modal.querySelector(".close-btn").addEventListener("click", closeModal);

  // ---- Swipe gesture (mobile) ----
  let touchStartX = 0, touchStartY = 0;

  modal.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  modal.addEventListener("touchmove", e => {
    if (e.touches.length === 2 && pinchDist !== null) {
      e.preventDefault();
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale = Math.max(1, Math.min(4, scale * (newDist / pinchDist)));
      pinchDist = newDist;
      img.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
      img.style.cursor = scale > 1 ? "grab" : "default";
    } else if (e.touches.length === 1 && scale > 1) {
      posX += (e.touches[0].clientX - touchStartX) / scale;
      posY += (e.touches[0].clientY - touchStartY) / scale;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      img.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
    }
  }, { passive: false });

  modal.addEventListener("touchend", e => {
    pinchDist = null;
    if (scale > 1) return; // don't swipe when zoomed

    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = Math.abs(touchStartY - e.changedTouches[0].clientY);

    if (Math.abs(diffX) > 55 && diffY < 80) {
      if (diffX > 0) goNext(); else goPrev();
    }

    // double-tap to zoom
    const now = Date.now();
    if (now - lastTap < 280) {
      if (scale > 1) { resetTransform(); img.style.transform = ""; }
      else { scale = 2; img.style.transform = `scale(2)`; }
    }
    lastTap = now;
  }, { passive: true });

  // ---- UI visibility toggle on img click ----
  let uiVisible = true;
  const topBar    = modal.querySelector(".top-bar");
  const bottomBar = modal.querySelector(".bottom-bar");

  img.addEventListener("click", () => {
    uiVisible = !uiVisible;
    const v = uiVisible ? "1" : "0";
    topBar.style.opacity    = v;
    bottomBar.style.opacity = v;
    navPrev.style.opacity   = uiVisible ? (currentIndex > 0 ? "1" : "0.2") : "0";
    navNext.style.opacity   = uiVisible ? (currentIndex < currentPhotos.length - 1 ? "1" : "0.2") : "0";
  });

  // ---- Download ----
  modal.querySelector("#downloadBtn").addEventListener("click", async () => {
    const photo = currentPhotos[currentIndex];
    const url   = photo.urls[qualitySel.value] || photo.urls.regular;
    showToast("Preparing download…", "info");
    try {
      // Required by Unsplash API guidelines: trigger download endpoint
      await UNSPLASH.trackDownload(photo);

      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `faynx-${photo.id}.jpg`;
      a.click();
      showToast("Download started! 🎉", "success");
    } catch {
      showToast("Download failed", "error");
    }
  });

  // ---- Share ----
  modal.querySelector("#shareBtn").addEventListener("click", async () => {
    const url = currentPhotos[currentIndex].urls.regular;
    if (navigator.share) {
      await navigator.share({ title: "Faynx Wallpaper", url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link copied!", "success");
    }
  });

  // ---- Favorite ----
  async function updateFavUI() {
    const user = auth.currentUser;
    favBtn.innerHTML = "🤍";
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const favs = snap.data()?.favorites || [];
      const isFav = favs.some(p => p.id === currentPhotos[currentIndex].id);
      favBtn.innerHTML = isFav ? "💖" : "🤍";
    } catch { /* offline */ }
  }

  favBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) { showToast("Login to save favorites", "warn"); return; }
    const state = await toggleFavorite(currentPhotos[currentIndex]);
    favBtn.innerHTML = state ? "💖" : "🤍";
    showToast(state ? "Added to favorites 💖" : "Removed from favorites", state ? "success" : "info");
  });

  qualitySel.addEventListener("change", updateImage);

  updateImage();
}

/*********************************
  FAVORITES
*********************************/
async function toggleFavorite(photo) {
  const user = auth.currentUser;
  if (!user) return false;

  const ref = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(ref);
    let favs = snap.exists() ? (snap.data().favorites || []) : [];
    const exists = favs.some(p => p.id === photo.id);
    favs = exists ? favs.filter(p => p.id !== photo.id) : [...favs, photo];
    await setDoc(ref, { favorites: favs }, { merge: true });
    return !exists;
  } catch (err) {
    showToast("Error saving favorite", "error");
    return false;
  }
}

async function openFavorites() {
  const user = auth.currentUser;
  if (!user) { showToast("Login to view favorites", "warn"); return; }

  const snap = await getDoc(doc(db, "users", user.uid));
  const favs = snap.data()?.favorites || [];

  const grid = $("favoritesGrid");
  grid.innerHTML = "";

  if (!favs.length) {
    grid.innerHTML = `<div class="error-state"><div class="error-icon">💔</div><p>No favorites yet</p></div>`;
  }

  favs.forEach(photo => {
    const div = document.createElement("div");
    div.className = "card";
    const img = document.createElement("img");
    img.src = photo.urls.small;
    img.alt = "favorite";
    img.onclick = () => openModal(photo);
    div.appendChild(img);
    grid.appendChild(div);
  });

  $("gallery").style.display = "none";
  $("favoritesPage").classList.remove("hidden");
}

window.closeFavorites = function() {
  $("favoritesPage").classList.add("hidden");
  $("gallery").style.display = "";
};

window.openFavorites = openFavorites;

/*********************************
  AUTH
*********************************/
function showAuthError(msg) {
  if (!authError) return;
  authError.textContent = msg;
  authError.classList.remove("hidden");
}
function clearAuthError() {
  if (!authError) return;
  authError.textContent = "";
  authError.classList.add("hidden");
}

loginBtn?.addEventListener("click", () => {
  authModal.classList.remove("hidden");
  clearAuthError();
});

authModal?.addEventListener("click", e => {
  if (e.target === authModal) authModal.classList.add("hidden");
});

authSubmitBtn?.addEventListener("click", async () => {
  const email = emailInput?.value?.trim();
  const password = passwordInput?.value;

  if (!email || !password) { showAuthError("Please fill in both fields"); return; }
  clearAuthError();

  authSubmitBtn.textContent = "Loading…";
  authSubmitBtn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    authModal.classList.add("hidden");
    showToast("Welcome back! 👋", "success");
  } catch {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      authModal.classList.add("hidden");
      showToast("Account created! 🎉", "success");
    } catch (err) {
      showAuthError(err.message.replace("Firebase: ", "").replace(/\(auth.*\)/, ""));
    }
  } finally {
    authSubmitBtn.textContent = "Continue";
    authSubmitBtn.disabled = false;
  }
});

googleBtn?.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
await signInWithRedirect(auth, provider);

    authModal.classList.add("hidden");
    showToast("Signed in with Google ✓", "success");

  } catch (err) {
    console.error("GOOGLE AUTH ERROR:", err);

    showAuthError(
      err.message
        .replace("Firebase: ", "")
        .replace(/\(auth.*\)/, "")
    );
  }
});
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  showToast("Logged out", "info");
  profilePage?.classList.add("hidden");
});

onAuthStateChanged(auth, user => {
  loginBtn?.classList.toggle("hidden", !!user);
  logoutBtn?.classList.toggle("hidden", !user);
  profileBtn?.classList.toggle("hidden", !user);

  if (user) {
    const avatar = $("profileAvatar");
    const pageAvatar = $("profilePageAvatar");
    const pageName  = $("profilePageName");
    const pageEmail = $("profilePageEmail");

    if (user.photoURL && avatar) avatar.src = user.photoURL;
    if (user.photoURL && pageAvatar) pageAvatar.src = user.photoURL;
    if (pageName)  pageName.textContent  = user.displayName || "User";
    if (pageEmail) pageEmail.textContent = user.email;

    loadUserPremiumStatus(user.uid);
  }
});

/*********************************
  PROFILE
*********************************/
profileBtn?.addEventListener("click", () => {
  $("profileMenu")?.classList.add("hidden");
  profilePage?.classList.remove("hidden");
});

closeProfileBtn?.addEventListener("click", () => {
  profilePage?.classList.add("hidden");
});

async function loadUserPremiumStatus(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const isPremium = snap.data()?.premium === true;
    const statusEl = $("premiumStatus");
    const upgradeBtn = $("upgradeBtn");

    if (statusEl) {
      statusEl.textContent = isPremium ? "⭐ PREMIUM" : "FREE USER";
      statusEl.className = "premium-status " + (isPremium ? "premium" : "free");
    }
    if (upgradeBtn) upgradeBtn.classList.toggle("hidden", isPremium);
  } catch { /* offline */ }
}

redeemBtn?.addEventListener("click", async () => {
  const code = redeemInput?.value?.trim().toUpperCase();
  if (!code) { showToast("Enter a code", "warn"); return; }

  const user = auth.currentUser;
  if (!user) { showToast("Login first", "warn"); return; }

  // Example codes — swap with Firestore lookup in production
  const VALID_CODES = ["FAYNX2024", "PREMIUM1", "WALLHD99"];

  if (VALID_CODES.includes(code)) {
    await setDoc(doc(db, "users", user.uid), { premium: true }, { merge: true });
    showToast("🎉 Premium activated!", "success");
    loadUserPremiumStatus(user.uid);
    if (redeemInput) redeemInput.value = "";
  } else {
    showToast("Invalid or expired code", "error");
  }
});

/*********************************
  SERVICE WORKER
*********************************/
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .catch(err => console.warn("SW reg failed:", err));
}

/*********************************
  INIT
*********************************/
buildCategories();
loadWallpapers();
