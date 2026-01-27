const ACCESS_KEY = "Gj2IdthS_6q_yLZ6TOyADqyF1WgJ7hvu99u7Jhm73gs";

const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");
const modal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const modalDownload = document.getElementById("modalDownload");
const shareBtn = document.getElementById("shareBtn");
const qualitySelect = document.getElementById("qualitySelect");
const closeBtn = document.querySelector(".close");

let page = 1;
let query = "wallpaper";
let isLoading = false;
let currentPhoto = null;

/* Download */
async function downloadImage(photo, quality) {
  await fetch(photo.links.download_location, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
  });
  const res = await fetch(photo.urls[quality]);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `faynx-${photo.id}.jpg`;
  a.click();
}

/* Share */
shareBtn.onclick = () => {
  if (navigator.share && currentPhoto) {
    navigator.share({
      title: "Faynx  Wallpaper",
      text: "Check out this wallpaper!",
      url: currentPhoto.links.html
    });
  } else {
    alert("Sharing not supported on this device");
  }
};

/* Preview */
function openPreview(photo) {
  currentPhoto = photo;
  previewImage.src = photo.urls[qualitySelect.value];
  modal.style.display = "flex";
}

qualitySelect.onchange = () => {
  if (currentPhoto)
    previewImage.src = currentPhoto.urls[qualitySelect.value];
};

modalDownload.onclick = () =>
  downloadImage(currentPhoto, qualitySelect.value);

closeBtn.onclick = () => modal.style.display = "none";

/* Load Wallpapers */
async function loadWallpapers() {
  if (isLoading) return;
  isLoading = true;
  loading.style.display = "block";

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=12`,
    { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
  );

  const data = await res.json();

  data.results.forEach(photo => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = photo.urls.regular;
    img.onclick = () => openPreview(photo);

    const btn = document.createElement("button");
    btn.className = "card-download";
    btn.textContent = "⬇";
    btn.onclick = () => downloadImage(photo, qualitySelect.value);

    card.append(img, btn);
    gallery.appendChild(card);
  });

  page++;
  loading.style.display = "none";
  isLoading = false;
}

/* Infinite Scroll */
window.addEventListener("scroll", () => {
  if (innerHeight + scrollY >= document.body.offsetHeight - 400) {
    loadWallpapers();
  }
});

/* Search */
searchInput.onkeydown = e => {
  if (e.key === "Enter") {
    query = searchInput.value;
    page = 1;
    gallery.innerHTML = "";
    loadWallpapers();
  }
};

/* Categories */
document.querySelectorAll(".categories button").forEach(btn => {
  btn.onclick = () => {
    query = btn.dataset.cat;
    page = 1;
    gallery.innerHTML = "";
    loadWallpapers();
  };
});

/* Init */
loadWallpapers();

/* =========================
   INSTALL APP BUTTON (FIXED)
========================= */

let deferredPrompt;
const installBtn = document.getElementById("installAppBtn");

/* Capture install prompt */
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  if (installBtn) {
    installBtn.hidden = false;
    installBtn.classList.add("show");
  }
});

/* Button click */
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    installBtn.classList.add("loading");
    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    installBtn.classList.remove("loading");

    if (choice.outcome === "accepted") {
      installBtn.classList.add("installed");
      setTimeout(() => {
        installBtn.hidden = true;
      }, 1200);
    }

    deferredPrompt = null;
  });
}

/* Hide after install */
window.addEventListener("appinstalled", () => {
  if (installBtn) {
    installBtn.hidden = true;
  }
});
/* =========================
   SIMPLE AUTH (LOCAL)
========================= */

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* Login / Signup */
function login() {
  const name = authName.value;
  const email = authEmail.value;

  if (!name || !email) {
    alert("Fill all fields");
    return;
  }

  localStorage.setItem("user", JSON.stringify({ name, email }));

  profileName.textContent = name;
  profileEmail.textContent = email;

  showPage("profilePage");
}

/* Logout */
function logout() {
  localStorage.removeItem("user");
  showPage("authPage");
}

/* Premium */
function openPremium() {
  showPage("premiumPage");
}

function buyPremium() {
  alert("Premium activated (demo)");
  localStorage.setItem("premium", "true");
}

/* Auto login */
const savedUser = localStorage.getItem("user");
if (savedUser) {
  const user = JSON.parse(savedUser);
  profileName.textContent = user.name;
  profileEmail.textContent = user.email;
  showPage("profilePage");
} else {
  showPage("authPage");
}
/* =========================
   FIREBASE CONFIG
========================= */
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
});

const auth = firebase.auth();

/* =========================
   PAGE NAV
========================= */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* =========================
   EMAIL LOGIN
========================= */
function emailLogin() {
  const email = emailInput.value;
  const pass = passwordInput.value;

  auth.signInWithEmailAndPassword(email, pass)
    .catch(() => auth.createUserWithEmailAndPassword(email, pass));
}

/* =========================
   GOOGLE LOGIN
========================= */
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}

/* =========================
   LOGOUT
========================= */
function logout() {
  auth.signOut();
}

/* =========================
   PROFILE
========================= */
function openEditProfile() {
  editName.value = auth.currentUser.displayName || "";
  showPage("editProfilePage");
}

function saveProfile() {
  auth.currentUser.updateProfile({
    displayName: editName.value
  }).then(() => {
    loadProfile();
    showPage("profilePage");
  });
}

function loadProfile() {
  const u = auth.currentUser;
  profileName.textContent = u.displayName || "User";
  profileEmail.textContent = u.email;
  profilePic.src = u.photoURL || "icons/icon-192.png";
}

/* =========================
   PREMIUM (DEMO)
========================= */
function openPremium() {
  showPage("premiumPage");
}

function activatePremium() {
  localStorage.setItem("premium", "true");
  alert("Premium activated!");
  showPage("profilePage");
}

/* =========================
   AUTH STATE
========================= */
auth.onAuthStateChanged(user => {
  if (user) {
    loadProfile();
    showPage("profilePage");
  } else {
    showPage("authPage");
  }
});
const isPremium = localStorage.getItem("premium") === "true";

if (photo.premium && !isPremium) {
  img.style.filter = "blur(8px)";
  img.onclick = openPremium;
}
