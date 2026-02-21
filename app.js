/*********************************
  FIREBASE SETUP
*********************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWcWf_vcl_OLRM1Lj-Heh20k2zJqmGLok",
  authDomain: "faynx0.firebaseapp.com",
  projectId: "faynx0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/*********************************
  DOM CACHE
*********************************/
const $ = id => document.getElementById(id);

const elements = {
  authModal: $("authModal"),
  authError: $("authError"),
  authLoader: $("authLoader"),
  authModeTitle: $("authModeTitle"),
  authSubmitBtn: $("authSubmitBtn"),
  emailInput: $("emailInput"),
  passwordInput: $("passwordInput"),
  rememberMe: $("rememberMe"),
  loginBtn: $("loginBtn"),
  logoutBtn: $("logoutBtn"),
  profileBtn: $("profileBtn"),
  profileAvatar: $("profileAvatar"),
  profilePage: $("profilePage"),
  profilePageAvatar: $("profilePageAvatar"),
  profilePageName: $("profilePageName"),
  profilePageEmail: $("profilePageEmail"),
  profileMenu: $("profileMenu"),
  gallery: $("gallery"),
  loading: $("loading"),
  searchInput: $("searchInput"),
  appDownloadFloat: $("appDownloadFloat")
};

const DEFAULT_AVATAR = "https://i.pravatar.cc/150";

/*********************************
  PROFILE MENU
*********************************/
$("profileToggleBtn")?.addEventListener("click", e => {
  e.stopPropagation();
  elements.profileMenu.classList.toggle("hidden");
});

document.addEventListener("click", () => {
  elements.profileMenu.classList.add("hidden");
});

/*********************************
  AUTH MODAL
*********************************/
let isSignupMode = false;

$("loginBtn")?.addEventListener("click", openAuth);
$("closeAuthBtn")?.addEventListener("click", closeAuth);
$("toggleAuthModeBtn")?.addEventListener("click", toggleAuthMode);
$("authSubmitBtn")?.addEventListener("click", handleAuth);
$("googleBtn")?.addEventListener("click", googleLogin);

function openAuth() {
  elements.profileMenu.classList.add("hidden");
  elements.authModal.classList.remove("hidden");
}

function closeAuth() {
  elements.authModal.classList.add("hidden");
}

function toggleAuthMode() {
  isSignupMode = !isSignupMode;
  elements.authModeTitle.textContent = isSignupMode ? "Sign Up" : "Login";
  elements.authSubmitBtn.textContent = isSignupMode ? "Create Account" : "Login";
}

/*********************************
  AUTH ACTIONS
*********************************/
async function googleLogin() {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    showError(err.message);
  }
}

async function handleAuth() {
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value.trim();

  if (!email || !password) {
    showError("Email and password required");
    return;
  }

  try {
    elements.authLoader.classList.remove("hidden");

    await setPersistence(
      auth,
      elements.rememberMe.checked
        ? browserLocalPersistence
        : browserSessionPersistence
    );

    if (isSignupMode) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }

  } catch (err) {
    showError(err.message);
  } finally {
    elements.authLoader.classList.add("hidden");
  }
}

function showError(message) {
  elements.authError.textContent = message;
  elements.authError.classList.remove("hidden");
}

async function logout() {
  await signOut(auth);
  elements.profileMenu.classList.add("hidden");
}

elements.logoutBtn?.addEventListener("click", logout);

/*********************************
  AUTH STATE
*********************************/
onAuthStateChanged(auth, user => {
  if (user) {
    const avatar = user.photoURL || DEFAULT_AVATAR;

    elements.profileAvatar.src = avatar;
    elements.profilePageAvatar.src = avatar;
    elements.profilePageName.textContent = user.displayName || "User";
    elements.profilePageEmail.textContent = user.email;

    elements.loginBtn.classList.add("hidden");
    elements.profileBtn.classList.remove("hidden");
    elements.logoutBtn.classList.remove("hidden");
  } else {
    elements.profileAvatar.src = DEFAULT_AVATAR;
    elements.loginBtn.classList.remove("hidden");
    elements.profileBtn.classList.add("hidden");
    elements.logoutBtn.classList.add("hidden");
  }

  closeAuth();
});

/*********************************
  UNSPLASH
*********************************/
const ACCESS_KEY = "3wPR19vEBSEYPY4kDbGgTH9jClLsKqgM93J_ZK56SP0";
let page = 1;
let isLoading = false;
let currentQuery = "wallpaper";

async function loadWallpapers(reset = false) {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    elements.gallery.innerHTML = "";
    page = 1;
  }

  elements.loading.classList.remove("hidden");

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${currentQuery}&page=${page}&per_page=12`,
      { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
    );

    if (!res.ok) throw new Error("API rate limit or network error");

    const data = await res.json();

    data.results.forEach(createCard);

    page++;
  } catch (err) {
    console.error(err);
  } finally {
    isLoading = false;
    elements.loading.classList.add("hidden");
  }
}

function createCard(photo) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  img.src = photo.urls.small;
  img.loading = "lazy";

  img.addEventListener("click", () => openWallpaperModal(photo));
  card.appendChild(img);
  elements.gallery.appendChild(card);
}


/*********************************
  WALLPAPER MODAL SYSTEM
*********************************/
function openWallpaperModal(photo) {
  const modal = document.createElement("div");
  modal.className = "wallpaper-modal";

  modal.innerHTML = `
    <div class="modal-content">
      <button class="back-btn">← Back</button>

      <img id="modalImage" src="${photo.urls.regular}" />

      <select id="qualitySelect">
        <option value="regular">HD</option>
        <option value="full">Full HD</option>
        <option value="raw">4K</option>
      </select>

      <button id="downloadBtn">Download</button>
      <button id="shareBtn">Share</button>
    </div>
  `;

  document.body.appendChild(modal);

  const modalImage = modal.querySelector("#modalImage");
  const qualitySelect = modal.querySelector("#qualitySelect");
  const downloadBtn = modal.querySelector("#downloadBtn");
  const shareBtn = modal.querySelector("#shareBtn");

  /* ===== QUALITY CHANGE ===== */
  qualitySelect.addEventListener("change", () => {
    const selectedQuality = qualitySelect.value;
    modalImage.src = photo.urls[selectedQuality];
  });

  /* ===== DOWNLOAD ===== */
  downloadBtn.addEventListener("click", async () => {
    const selectedQuality = qualitySelect.value;
    const imageUrl = photo.urls[selectedQuality];

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "faynx-wallpaper.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(imageUrl, "_blank");
    }
  });

  /* ===== SHARE ===== */
  shareBtn.addEventListener("click", async () => {
    const shareUrl = photo.links.html;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Faynx Wallpaper",
          text: "Check out this wallpaper!",
          url: shareUrl
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard");
    }
  });

  /* ===== CLOSE METHODS ===== */
  modal.querySelector(".back-btn").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });

  document.addEventListener("keydown", function escClose(e) {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", escClose);
    }
  });
}

/*********************************
  SEARCH + SCROLL
*********************************/
let searchTimeout;

elements.searchInput?.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentQuery = elements.searchInput.value.trim() || "wallpaper";
    loadWallpapers(true);
  }, 500);
});

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 400
  ) {
    loadWallpapers();
  }
});

loadWallpapers();

/*********************************
  APP DOWNLOAD
*********************************/
elements.appDownloadFloat?.addEventListener("click", () => {
  window.open("https://your-app-download-link.com", "_blank");
});