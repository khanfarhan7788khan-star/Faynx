const ACCESS_KEY = "Gj2IdthS_6q_yLZ6TOyADqyF1WgJ7hvu99u7Jhm73gs";

const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");

let page = 1;
let query = "wallpaper";
let isLoading = false;

/* =========================
   Dynamic Image Quality
========================= */
function getBestQuality(urls) {
  if (window.innerWidth >= 1440) return urls.raw;
  if (window.innerWidth >= 1024) return urls.full;
  return urls.regular;
}

/* =========================
   IndexedDB Setup
========================= */
let db;
const request = indexedDB.open("WallifyDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("favorites", { keyPath: "id" });
  db.createObjectStore("collections", { keyPath: "name" });
};

request.onsuccess = e => {
  db = e.target.result;
};

/* =========================
   Save Favorite
========================= */
function saveOffline(photo) {
  if (!db) return;
  const tx = db.transaction("favorites", "readwrite");
  tx.objectStore("favorites").put({
    id: photo.id,
    urls: photo.urls,
    time: Date.now()
  });
}

/* =========================
   DIRECT DOWNLOAD (REAL FILE)
========================= */
async function directDownload(photo) {
  try {
    // Notify Unsplash (required)
    await fetch(photo.links.download_location, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`
      }
    });

    // Fetch image file
    const res = await fetch(photo.urls.full);
    const blob = await res.blob();

    // Force download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wallify-${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Download failed:", err);
  }
}

/* =========================
   Load Wallpapers
========================= */
async function loadWallpapers() {
  if (isLoading) return;
  isLoading = true;
  loading.style.display = "block";

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=12`,
      {
        headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
      }
    );

    if (!res.ok) throw new Error(res.status);

    const data = await res.json();

    data.results.forEach(photo => {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = getBestQuality(photo.urls);
      img.alt = "Wallpaper";
      img.onclick = () => openPreview(photo.urls);

      const download = document.createElement("a");
      download.href = "#";
      download.className = "card-download";
      download.textContent = "⬇ Download";
      download.onclick = e => {
        e.preventDefault();
        directDownload(photo);
      };

      const likeBtn = document.createElement("button");
      likeBtn.className = "like-btn";
      likeBtn.textContent = "❤";
      likeBtn.onclick = () => {
        saveOffline(photo);
        likeBtn.classList.add("liked");
      };

      card.append(img, download, likeBtn);
      gallery.appendChild(card);
    });

    page++;
  } catch (err) {
    console.error("Error:", err);
  }

  loading.style.display = "none";
  isLoading = false;
}

/* =========================
   Infinite Scroll
========================= */
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 400
  ) {
    loadWallpapers();
  }
});

/* =========================
   Search
========================= */
searchInput.onkeydown = e => {
  if (e.key === "Enter") {
    query = searchInput.value;
    page = 1;
    gallery.innerHTML = "";
    loadWallpapers();
  }
};

/* =========================
   Categories
========================= */
document.querySelectorAll(".categories button")
  .forEach(btn => {
    btn.onclick = () => {
      query = btn.dataset.cat;
      page = 1;
      gallery.innerHTML = "";
      loadWallpapers();
    };
  });

/* =========================
   Initial Load
========================= */
loadWallpapers();
