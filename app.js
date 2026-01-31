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
  DOM
*********************************/
const authModal = document.getElementById("authModal");
const authError = document.getElementById("authError");
const authLoader = document.getElementById("authLoader");
const authModeTitle = document.getElementById("authModeTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const rememberMe = document.getElementById("rememberMe");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileBtn = document.getElementById("profileBtn");
const profileAvatar = document.getElementById("profileAvatar");

const profilePage = document.getElementById("profilePage");
const profilePageAvatar = document.getElementById("profilePageAvatar");
const profilePageName = document.getElementById("profilePageName");
const profilePageEmail = document.getElementById("profilePageEmail");

const profileMenu = document.getElementById("profileMenu");
const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");

const DEFAULT_AVATAR = "https://i.pravatar.cc/150";

/*********************************
  PROFILE MENU
*********************************/
window.toggleProfileMenu = (e) => {
  e.stopPropagation();
  profileMenu.classList.toggle("hidden");
};

document.addEventListener("click", () => {
  profileMenu.classList.add("hidden");
});

/*********************************
  AUTH MODAL
*********************************/
window.openAuth = () => {
  profileMenu.classList.add("hidden");
  authModal.classList.remove("hidden");
};

window.closeAuth = () => authModal.classList.add("hidden");

let isSignupMode = false;
window.toggleAuthMode = () => {
  isSignupMode = !isSignupMode;
  authModeTitle.textContent = isSignupMode ? "Sign Up" : "Login";
  authSubmitBtn.textContent = isSignupMode ? "Create Account" : "Login";
};

/*********************************
  AUTH ACTIONS
*********************************/
window.googleLogin = async () => {
  await signInWithPopup(auth, new GoogleAuthProvider());
};

window.handleAuth = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    authError.textContent = "Email and password required";
    authError.classList.remove("hidden");
    return;
  }

  authError.classList.add("hidden");
  authLoader.classList.remove("hidden");

  try {
    await setPersistence(
      auth,
      rememberMe.checked
        ? browserLocalPersistence
        : browserSessionPersistence
    );

    isSignupMode
      ? await createUserWithEmailAndPassword(auth, email, password)
      : await signInWithEmailAndPassword(auth, email, password);

  } catch (e) {
    authError.textContent = e.message;
    authError.classList.remove("hidden");
  } finally {
    authLoader.classList.add("hidden");
  }
};

window.logout = async () => {
  await signOut(auth);
  profileMenu.classList.add("hidden");
};

/*********************************
  PROFILE PAGE
*********************************/
window.openProfilePage = () => {
  profileMenu.classList.add("hidden");
  profilePage.classList.remove("hidden");
};

window.closeProfilePage = () => {
  profilePage.classList.add("hidden");
};

/*********************************
  AUTH STATE (SINGLE SOURCE)
*********************************/
onAuthStateChanged(auth, user => {
  if (user) {
    profileAvatar.src = user.photoURL || DEFAULT_AVATAR;
    profilePageAvatar.src = profileAvatar.src;
    profilePageName.textContent = user.displayName || "User";
    profilePageEmail.textContent = user.email;

    loginBtn.classList.add("hidden");
    profileBtn.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    profileAvatar.src = DEFAULT_AVATAR;

    loginBtn.classList.remove("hidden");
    profileBtn.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    profilePage.classList.add("hidden");
  }

  authModal.classList.add("hidden");
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
    gallery.innerHTML = "";
    page = 1;
  }

  loading.style.display = "block";

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${currentQuery}&page=${page}&per_page=12`,
    { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
  );

  const data = await res.json();

  data.results.forEach(photo => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = photo.urls.regular;

    const isPremium = Math.random() < 0.3;
    img.onclick = () =>
      isPremium ? showPremiumComingSoon() : openWallpaperModal(photo);

    card.appendChild(img);

    if (isPremium) {
      const lock = document.createElement("div");
      lock.className = "premium-lock";
      lock.innerHTML = "<span>🔒</span>";
      lock.style.zIndex = "5";
      card.appendChild(lock);
    }

    gallery.appendChild(card);
  });

  page++;
  isLoading = false;
  loading.style.display = "none";
}

/*********************************
  WALLPAPER MODAL
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

  const img = modal.querySelector("#modalImage");
  const quality = modal.querySelector("#qualitySelect");

  quality.onchange = () => img.src = photo.urls[quality.value];

  modal.querySelector("#downloadBtn").onclick = () =>
    window.open(photo.urls[quality.value], "_blank");

  modal.querySelector("#shareBtn").onclick = async () => {
    navigator.share
      ? navigator.share({ title: "Faynx", url: photo.links.html })
      : navigator.clipboard.writeText(photo.links.html);
  };

  modal.querySelector(".back-btn").onclick = () => modal.remove();
}

function showPremiumComingSoon() {
  const modal = document.createElement("div");
  modal.className = "wallpaper-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🔒 Premium Wallpapers</h2>
      <p>Coming soon</p>
      <button class="back-btn">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".back-btn").onclick = () => modal.remove();
}

/*********************************
  SEARCH & INIT
*********************************/
let searchTimeout;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentQuery = searchInput.value.trim() || "wallpaper";
    loadWallpapers(true);
  }, 400);
});

window.addEventListener("scroll", () => {
  if (innerHeight + scrollY >= document.body.offsetHeight - 300) {
    loadWallpapers();
  }
});

loadWallpapers();

/*********************************
  APP DOWNLOAD BUTTON
*********************************/
document.getElementById("appDownloadFloat")?.addEventListener("click", () => {
  window.open("https://your-app-download-link.com", "_blank");
});
