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
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWcWf_vcl_OLRM1Lj-Heh20k2zJqmGLok",
  authDomain: "faynx0.firebaseapp.com",
  projectId: "faynx0"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

/*********************************
  FIREBASE AUTH FUNCTIONS
*********************************/
window.googleLogin = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    alert("Logged in successfully");
  } catch (e) {
    alert(e.message);
  }
};

window.emailLogin = async () => {
  const email = document.getElementById("emailInput")?.value;
  const password = document.getElementById("passwordInput")?.value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in");
  } catch (e) {
    alert(e.message);
  }
};

window.emailSignup = async () => {
  const email = document.getElementById("emailInput")?.value;
  const password = document.getElementById("passwordInput")?.value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created");
  } catch (e) {
    alert(e.message);
  }
};

window.logout = async () => {
  await signOut(auth);
  alert("Logged out");
};

/*********************************
  AUTH STATE
*********************************/
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("User logged in:", user.email);
  } else {
    console.log("User logged out");
  }
});

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileAvatar = document.getElementById("profileAvatar");

const DEFAULT_AVATAR = "https://i.pravatar.cc/100";

onAuthStateChanged(auth, user => {
  if (user) {
    /* 🔐 Logged in */
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");

    /* 👤 Profile photo */
    profileAvatar.src = user.photoURL || DEFAULT_AVATAR;

    console.log("Logged in:", user.email);
  } else {
    /* 🚪 Logged out */
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");

    profileAvatar.src = DEFAULT_AVATAR;

    console.log("Logged out");
  }
});


/*********************************
  PROFILE MENU
*********************************/
const profileMenu = document.getElementById("profileMenu");

window.toggleProfileMenu = () => {
  document.getElementById("profileMenu")?.classList.toggle("hidden");
};

document.addEventListener("click", e => {
  if (!e.target.closest(".profile-wrapper")) {
    document.getElementById("profileMenu")?.classList.add("hidden");
  }
});

window.openAuth = () => {
  alert("Open login panel"); // replace with your auth panel later
};

window.logout = async () => {
  await signOut(auth);
};


/*********************************
  UNSPLASH CONFIG
*********************************/
const ACCESS_KEY = "3wPR19vEBSEYPY4kDbGgTH9jClLsKqgM93J_ZK56SP0";

/*********************************
  DOM
*********************************/
const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");

/*********************************
  STATE
*********************************/
let page = 1;
let isLoading = false;
let currentQuery = "wallpaper";

/*********************************
  LOAD WALLPAPERS
*********************************/
async function loadWallpapers(reset = false) {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    gallery.innerHTML = "";
    page = 1;
  }

  loading.style.display = "block";

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${currentQuery}&page=${page}&per_page=12`,
      { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
    );

    if (!res.ok) throw new Error("Unsplash API error");

    const data = await res.json();

    data.results.forEach(photo => {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = photo.urls.regular;

      const isPremium = Math.random() < 0.3;

      img.onclick = () => {
        isPremium ? showPremiumComingSoon() : openWallpaperModal(photo);
      };

      card.appendChild(img);

      if (isPremium) {
        const lock = document.createElement("div");
        lock.className = "premium-lock";
        lock.innerHTML = "<span>🔒</span>";
        card.appendChild(lock);
      }

      gallery.appendChild(card);
    });

    page++;
  } catch (err) {
    console.error(err);
    loading.textContent = "Failed to load wallpapers";
  } finally {
    isLoading = false;
    loading.style.display = "none";
  }
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
      <img id="modalImage" src="${photo.urls.regular}">
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

  quality.onchange = () => {
    img.src = photo.urls[quality.value];
  };

  modal.querySelector("#downloadBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = photo.urls[quality.value];
    a.download = "faynx-wallpaper.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  modal.querySelector("#shareBtn").onclick = async () => {
    if (navigator.share) {
      navigator.share({ title: "Faynx Wallpaper", url: photo.links.html });
    } else {
      await navigator.clipboard.writeText(photo.links.html);
      alert("Link copied");
    }
  };

  modal.querySelector(".back-btn").onclick = () => modal.remove();
}

/*********************************
  PREMIUM COMING SOON
*********************************/
function showPremiumComingSoon() {
  const modal = document.createElement("div");
  modal.className = "wallpaper-modal";

  modal.innerHTML = `
    <div class="modal-content">
      <h2>🔒 Premium Wallpapers</h2>
      <p>Premium wallpapers are coming soon.</p>
      <button class="back-btn">Close</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector(".back-btn").onclick = () => modal.remove();
}

/*********************************
  SEARCH
*********************************/
searchInput?.addEventListener("input", () => {
  currentQuery = searchInput.value.trim() || "wallpaper";
  loadWallpapers(true);
});

/*********************************
  INFINITE SCROLL
*********************************/
window.addEventListener("scroll", () => {
  if (innerHeight + scrollY >= document.body.offsetHeight - 300) {
    loadWallpapers();
  }
});

/*********************************
  INIT
*********************************/
loadWallpapers();
