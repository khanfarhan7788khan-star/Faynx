const fs = require("fs");

const baseUrl = "https://faynx.tech";

// Keywords
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

// Slug function
const slugify = (text) =>
  text.toLowerCase().replace(/\s+/g, "-");

// Store all pages
let allSlugs = [];

// ✅ STEP 1 — Generate slugs
for (let i = 1; i <= 1000; i++) {
  const keyword = keywords[i % keywords.length];
  const slug = `${slugify(keyword)}-${i}`;
  allSlugs.push({ slug, keyword });
}

// ✅ STEP 2 — Generate wallpaper pages
allSlugs.forEach((item, index) => {
  const { slug, keyword } = item;

  const related = allSlugs
    .filter((_, i) => i !== index)
    .slice(index, index + 5);

  const relatedLinks = related
    .map(
      (r) =>
        `<a href="/wallpaper/${r.slug}.html">${r.keyword} wallpaper</a>`
    )
    .join("<br>");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${keyword} Wallpaper HD & 4K Free Download</title>
  <meta name="description" content="Download ${keyword} wallpaper in HD & 4K quality.">
  <link rel="canonical" href="${baseUrl}/wallpaper/${slug}.html">
</head>

<body>
  <h1>${keyword} Wallpaper HD</h1>

  <img src="https://source.unsplash.com/random/1920x1080/?${encodeURIComponent(
    keyword
  )}" alt="${keyword} wallpaper">

  <p>Download ${keyword} wallpaper in HD and 4K resolution.</p>

  <h2>Related Wallpapers</h2>
  ${relatedLinks}

  <br><br>
  <a href="/">← Back to Home</a>
</body>
</html>
`;

  fs.writeFileSync(`wallpaper/${slug}.html`, html);
});

// ✅ STEP 3 — Generate category pages (NOW allSlugs exists)

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
        `<a href="/wallpaper/${w.slug}.html">${w.keyword} wallpaper</a>`
    )
    .join("<br>");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${cat} Wallpapers HD & 4K</title>
  <meta name="description" content="Download ${cat} wallpapers in HD & 4K quality.">
  <link rel="canonical" href="${baseUrl}/category/${cat}.html">
</head>

<body>
  <h1>${cat} Wallpapers</h1>

  <p>Explore ${cat} wallpapers in HD and 4K resolution.</p>

  <h2>Top ${cat} Wallpapers</h2>
  ${links}

  <br><br>
  <a href="/">← Back to Home</a>
</body>
</html>
`;

  fs.writeFileSync(`category/${cat}.html`, html);
});

// ✅ STEP 4 — Generate sitemap

let sitemapUrls = [];

// Homepage
sitemapUrls.push(`
<url>
  <loc>${baseUrl}/</loc>
</url>`);

// Wallpaper pages
allSlugs.forEach((item) => {
  sitemapUrls.push(`
<url>
  <loc>${baseUrl}/wallpaper/${item.slug}.html</loc>
</url>`);
});

// Category pages
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

console.log("✅ Everything generated: pages + categories + sitemap");