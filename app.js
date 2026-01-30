/*********************************
  UNSPLASH CONFIG
*********************************/
const ACCESS_KEY = "Gj2IdthS_6q_yLZ6TOyADqyF1WgJ7hvu99u7Jhm73gs";

/*********************************
  FIREBASE
*********************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/*********************************
  FIREBASE CONFIG
*********************************/
const firebaseConfig = {
  apiKey: "AIzaSyDWcWf_vcl_OLRM1Lj-Heh20k2zJqmGLok",
  authDomain: "faynx0.firebaseapp.com",
  projectId: "faynx0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/*********************************
  DOM
*********************************/
const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");

const authPage = document.getElementById("authPage");
const profileMenu = document.getElementById("profileMenu");

const settingsName = document.getElementById("settingsName");
const settingsEmail = document.getElementById("settingsEmail");
const settingsPlan = document.getElementById("settingsPlan");

/*********************************
  STATE
*********************************/
let page = 1;
let isLoading = false;
let IS_PREMIUM = false;
let isSignupMode = false;

/*********************************
  PROFILE MENU
*********************************/
window.toggleProfileMenu = () => {
  profileMenu.classList.toggle("hidden");
};

window.openAuth = () => {
  profileMenu.classList.add("hidden");
  authPage.classList.remove("hidden");
};

window.openProfileSettings = () => {
  profileMenu.classList.add("hidden");
  document.getElementById("profileSettings").classList.remove("hidden");
};

/*********************************
  AUTH
*********************************/
window.googleLogin = async () => {
  await signInWithPopup(auth, new GoogleAuthProvider());
};

window.logout = async () => {
  await signOut(auth);
  location.reload();
};

window.toggleAuthMode = () => {
  isSignupMode = !isSignupMode;
  document.getElementById("authTitle").textContent =
    isSignupMode ? "Create account" : "Welcome back";
  document.getElementById("authSubtitle").textContent =
    isSignupMode ? "Sign up to continue" : "Sign in to continue";
};

window.emailLogin = async () => {
  const email = emailInput.value;
  const pass = passwordInput.value;

  try {
    if (isSignupMode) {
      await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  } catch (e) {
    alert(e.message);
  }
};

/*********************************
  AUTH STATE
*********************************/
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    IS_PREMIUM = false;
    settingsName.textContent = "Guest";
    settingsEmail.textContent = "Not logged in";
    settingsPlan.textContent = "Free";
    return;
  }

  authPage.classList.add("hidden");

  settingsName.textContent = user.displayName || "User";
  settingsEmail.textContent = user.email || "";
  
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      premium: false,
      createdAt: serverTimestamp()
    });
    IS_PREMIUM = false;
  } else {
    IS_PREMIUM = snap.data().premium === true;
  }

  settingsPlan.textContent = IS_PREMIUM ? "Premium" : "Free";
});

/*********************************
  WALLPAPERS
*********************************/
async function loadWallpapers() {
  if (isLoading) return;
  isLoading = true;
  loading.style.display = "block";

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=wallpaper&page=${page}&per_page=12`,
    { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
  );

  const data = await res.json();

  data.results.forEach(photo => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = photo.urls.regular;

    const isPremiumPhoto = Math.random() < 0.3;

    img.onclick = () => {
      if (isPremiumPhoto && !IS_PREMIUM) {
        openAuth();
        alert("Premium wallpaper 🔐");
        return;
      }
      openWallpaperModal(photo);
    };

    if (isPremiumPhoto && !IS_PREMIUM) {
      img.style.filter = "blur(8px)";
    }

    card.appendChild(img);
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
      <img src="${photo.urls.regular}">
      <select id="quality">
        <option value="regular">HD</option>
        <option value="full">Full HD</option>
        <option value="raw">4K</option>
      </select>
      <button id="downloadBtn">Download</button>
      <button id="shareBtn">Share</button>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("downloadBtn").onclick = () => {
    const q = document.getElementById("quality").value;
    window.open(photo.urls[q], "_blank");
  };

  document.getElementById("shareBtn").onclick = async () => {
    if (navigator.share) {
      await navigator.share({ url: photo.links.html });
    } else {
      navigator.clipboard.writeText(photo.links.html);
      alert("Link copied!");
    }
  };
}

/*********************************
  INIT
*********************************/
loadWallpapers();

window.addEventListener("scroll", () => {
  if (innerHeight + scrollY >= document.body.offsetHeight - 300) {
    loadWallpapers();
  }
});
