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
      <img id="modalImage" src="${photo.urls.regular}" />

      <select id="qualitySelect">
        <option value="regular">HD</option>
        <option value="full">Full HD</option>
        <option value="raw">4K</option>
      </select>

      <button id="downloadBtn">Download</button>
      <button id="shareBtn">Share</button>
      <button class="close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  const imageEl = modal.querySelector("#modalImage");
  const qualitySelect = modal.querySelector("#qualitySelect");

  qualitySelect.onchange = () => {
    imageEl.src = photo.urls[qualitySelect.value];
  };

  modal.querySelector("#downloadBtn").onclick = () => {
    const quality = qualitySelect.value;
    const link = document.createElement("a");
    link.href = photo.urls[quality];
    link.download = "faynx-wallpaper.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  modal.querySelector("#shareBtn").onclick = async () => {
    if (navigator.share) {
      navigator.share({
        title: "Faynx Wallpaper",
        url: photo.links.html
      });
    } else {
      await navigator.clipboard.writeText(photo.links.html);
      alert("Link copied to clipboard");
    }
  };

  modal.querySelector(".close-btn").onclick = () => modal.remove();
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
