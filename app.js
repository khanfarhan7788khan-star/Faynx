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
  projectId: "faynx0",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Google Login
window.googleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    alert("Logged in successfully");
  } catch (e) {
    alert(e.message);
  }
};

// Email Login
window.emailLogin = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in");
  } catch (e) {
    alert(e.message);
  }
};

// Signup
window.emailSignup = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created");
  } catch (e) {
    alert(e.message);
  }
};

// Logout
window.logout = async () => {
  await signOut(auth);
  alert("Logged out");
};

onAuthStateChanged(auth, user => {
  if (user) {
    console.log("User logged in:", user.email);
  } else {
    console.log("User logged out");
  }
});

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
      {
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`
        }
      }
    );

    if (!res.ok) throw new Error("Unsplash API error");

    const data = await res.json();

    data.results.forEach(photo => {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = photo.urls.regular;

      const isPremiumPhoto = Math.random() < 0.3;

      img.onclick = () => {
        if (isPremiumPhoto) {
          showPremiumComingSoon();
        } else {
          openWallpaperModal(photo);
        }
      };

      card.appendChild(img);

      /* 🔒 PREMIUM LOCK OVERLAY */
      if (isPremiumPhoto) {
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

  const imageEl = modal.querySelector("#modalImage");
  const qualitySelect = modal.querySelector("#qualitySelect");

  qualitySelect.onchange = () => {
    imageEl.src = photo.urls[qualitySelect.value];
  };

  modal.querySelector("#downloadBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = photo.urls[qualitySelect.value];
    a.download = "faynx-wallpaper.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  modal.querySelector("#shareBtn").onclick = async () => {
    if (navigator.share) {
      navigator.share({
        title: "Faynx Wallpaper",
        url: photo.links.html
      });
    } else {
      await navigator.clipboard.writeText(photo.links.html);
      alert("Link copied");
    }
  };

  /* ✅ BACK BUTTON */
  modal.querySelector(".back-btn").onclick = () => modal.remove();
}


/*********************************
  PREMIUM COMING SOON MODAL
*********************************/
function showPremiumComingSoon() {
  const modal = document.createElement("div");
  modal.className = "wallpaper-modal";

  modal.innerHTML = `
    <div class="modal-content">
      <h2>🔒 Premium Wallpapers</h2>
      <p>Premium wallpapers are coming soon.</p>
      <button class="close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector(".close-btn").onclick = () => modal.remove();
}

/*********************************
  SEARCH
*********************************/
searchInput.addEventListener("input", () => {
  currentQuery = searchInput.value.trim() || "wallpaper";
  loadWallpapers(true);
});

/*********************************
  INFINITE SCROLL
*********************************/
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    loadWallpapers();
  }
});

/*********************************
  INIT
*********************************/
loadWallpapers();
