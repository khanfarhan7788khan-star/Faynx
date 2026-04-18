const fs = require("fs");

const baseUrl = "https://faynx.tech";

const keywords = [
  "dark forest",
  "anime sky",
  "neon city",
  "minimal black",
  "space galaxy",
  "mountain view",
  "ocean wave",
  "car 4k",
  "nature hd",
  "sunset aesthetic"
];

const slugify = (text) =>
  text.toLowerCase().replace(/\s+/g, "-");

let allSlugs = [];

// STEP 1
for (let i = 1; i <= 1000; i++) {
  const keyword = keywords[i % keywords.length];
  const slug = `${slugify(keyword)}-${i}`;
  allSlugs.push({ slug, keyword });
}

// STEP 2 — WALLPAPER PAGES
allSlugs.forEach((item, index) => {
  const { slug, keyword } = item;

  const related = allSlugs
    .filter((_, i) => i !== index)
    .slice(index, index + 5);

  const relatedLinks = related
    .map(
      (r) =>
        `<li><a href="/wallpaper/${r.slug}.html">${r.keyword} wallpaper</a></li>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${keyword} Wallpaper HD & 4K</title>
  <meta name="description" content="Download ${keyword} wallpaper in HD & 4K quality.">
  <link rel="canonical" href="${baseUrl}/wallpaper/${slug}.html">

  <!-- 🔥 ADD YOUR MAIN CSS -->
  <link rel="stylesheet" href="../style.css">

  <style>
    body { font-family: Arial; background:#0b0b0f; color:#fff; margin:0 }
    .container { max-width:900px; margin:auto; padding:20px }
    img { width:100%; border-radius:12px }
    a { color:#4fd1ff }
  </style>
</head>

<body>

<header style="padding:15px;border-bottom:1px solid #222">
  <a href="/" style="color:#fff;text-decoration:none;font-weight:bold">
    Faynx
  </a>
</header>

<main class="container">

  <h1>${keyword} Wallpaper HD & 4K</h1>

  <p>
    Download high-quality ${keyword} wallpaper in HD and 4K resolution 
    for mobile, desktop, and tablet.
  </p>

  <img 
    src="https://source.unsplash.com/random/1920x1080/?${encodeURIComponent(keyword)}" 
    alt="${keyword} wallpaper hd 4k"
  >

  <h2>Download ${keyword} Wallpaper</h2>
  <p>Click image to view full resolution.</p>

  <!-- 🔥 CATEGORY LINK (IMPORTANT FOR SEO) -->
  <p>
    Explore more: 
    <a href="/category/${keyword.split(" ")[0]}.html">
      ${keyword.split(" ")[0]} wallpapers
    </a>
  </p>

  <h2>Related Wallpapers</h2>
  <ul>
    ${relatedLinks}
  </ul>

  <br>
  <a href="/">← Back to Home</a>

</main>

</body>
</html>
`;

  fs.writeFileSync(`wallpaper/${slug}.html`, html);
});


// STEP 3 — CATEGORY PAGES
const categories = [
  "nature",
  "anime",
  "car",
  "space",
  "minimal",
  "aesthetic"
];

categories.forEach((cat) => {
  const filtered = allSlugs.filter((item) =>
    item.keyword.includes(cat)
  );

  const links = filtered
    .slice(0, 50)
    .map(
      (w) =>
        `<li><a href="/wallpaper/${w.slug}.html">${w.keyword} wallpaper</a></li>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${cat} Wallpapers HD & 4K</title>
  <meta name="description" content="Download ${cat} wallpapers in HD & 4K quality.">
  <link rel="canonical" href="${baseUrl}/category/${cat}.html">

  <link rel="stylesheet" href="../style.css">

  <style>
    body { font-family: Arial; background:#0b0b0f; color:#fff; margin:0 }
    .container { max-width:900px; margin:auto; padding:20px }
    a { color:#4fd1ff }
  </style>
</head>

<body>

<header style="padding:15px;border-bottom:1px solid #222">
  <a href="/" style="color:#fff;text-decoration:none;font-weight:bold">
    Faynx
  </a>
</header>

<main class="container">

  <h1>${cat} Wallpapers HD & 4K</h1>

  <p>
    Browse the best ${cat} wallpapers in HD and 4K resolution.
    Free download for all devices.
  </p>

  <h2>Top ${cat} Wallpapers</h2>

  <ul>
    ${links}
  </ul>

  <br>
  <a href="/">← Back to Home</a>

</main>

</body>
</html>
`;

  fs.writeFileSync(`category/${cat}.html`, html);
});


// STEP 4 — SITEMAP
let sitemapUrls = [];

sitemapUrls.push(`
<url>
  <loc>${baseUrl}/</loc>
</url>`);

allSlugs.forEach((item) => {
  sitemapUrls.push(`
<url>
  <loc>${baseUrl}/wallpaper/${item.slug}.html</loc>
</url>`);
});

categories.forEach((cat) => {
  sitemapUrls.push(`
<url>
  <loc>${baseUrl}/category/${cat}.html</loc>
</url>`);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join("\n")}
</urlset>`;

fs.writeFileSync("sitemap.xml", sitemap);

console.log("✅ Pages now styled + SEO optimized");