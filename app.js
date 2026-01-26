const ACCESS_KEY = "Gj2IdthS_6q_yLZ6TOyADqyF1WgJ7hvu99u7Jhm73gs";

const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");
const modal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const modalDownload = document.getElementById("modalDownload");
const closeBtn = document.querySelector(".close");

let page = 1;
let query = "wallpaper";
let isLoading = false;
let currentPhoto = null;

/* Best image for device */
function bestQuality(urls) {
  if (innerWidth >= 1440) return urls.raw;
  if (innerWidth >= 1024) return urls.full;
  return urls.regular;
}

/* Direct download */
async function downloadImage(photo) {
  await fetch(photo.links.download_location, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
  });

  const res = await fetch(photo.urls.full);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `wallify-${photo.id}.jpg`;
  a.click();
}

/* Preview */
function openPreview(photo) {
  currentPhoto = photo;
  previewImage.src = photo.urls.regular;
  modal.style.display = "flex";
}

closeBtn.onclick = () => modal.style.display = "none";
modalDownload.onclick = () => downloadImage(currentPhoto);

/* Load wallpapers */
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
    img.src = bestQuality(photo.urls);
    img.onclick = () => openPreview(photo);

    const btn = document.createElement("button");
    btn.className = "card-download";
    btn.textContent = "⬇";
    btn.onclick = () => downloadImage(photo);

    card.append(img, btn);
    gallery.appendChild(card);
  });

  page++;
  loading.style.display = "none";
  isLoading = false;
}

/* Infinite scroll */
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
