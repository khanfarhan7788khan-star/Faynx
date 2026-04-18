const fs = require("fs");

// base url
const baseUrl = "https://faynx.tech";

// keywords
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

// slug function
const slugify = (text) =>
  text.toLowerCase().replace(/\s+/g, "-");

// ensure folders exist
if (!fs.existsSync("wallpaper")) fs.mkdirSync("wallpaper");
if (!fs.existsSync("category")) fs.mkdirSync("category");

// store pages
let allSlugs = [];

// STEP 1 — generate slugs
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
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<title>${keyword} Wallpaper HD & 4K</title>
<meta name="description" content="Download ${keyword} wallpaper in HD & 4K quality.">

<link rel="canonical" href="${baseUrl}/wallpaper/${slug}.html">
<link rel="stylesheet" href="/style.css">

<style>
body {background:#0d0d0f;color:#fff;font-family:Arial;margin:0;text-align:center;}
.container {max-width:1000px;margin:auto;padding:20px;}
img {width:100%;border-radius:10px;}
.grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:20px;}
a {color:#fff;text-decoration:none;}
</style>
</head>

<body>

<div class="container">

<h1>${keyword} Wallpaper</h1>

<img src="https://source.unsplash.com/random/1920x1080/?${encodeURIComponent(
    keyword
  )}" alt="${keyword} wallpaper">

<p>Download ${keyword} wallpaper in HD & 4K resolution.</p>

<h2>Related Wallpapers</h2>

<ul>
${relatedLinks}
</ul>

<br>
<a href="/">← Home</a>

</div>

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

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<title>${cat} Wallpapers HD & 4K</title>
<meta name="description" content="Download ${cat} wallpapers in HD & 4K quality.">

<link rel="canonical" href="${baseUrl}/category/${cat}.html">
<link rel="stylesheet" href="/style.css">

<style>
body {background:#0d0d0f;color:#fff;font-family:Arial;margin:0;}
.container {max-width:1200px;margin:auto;padding:20px;}
.grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;}
.card img {width:100%;height:250px;object-fit:cover;border-radius:10px;}
a {color:#fff;text-decoration:none;}
</style>
</head>

<body>

<div class="container">

<h1>${cat} Wallpapers</h1>

<p>Explore ${cat} wallpapers in HD & 4K resolution.</p>

<div class="grid">

${filtered
  .slice(0, 50)
  .map(
    (w) => `
<a href="/wallpaper/${w.slug}.html" class="card">
<img src="https://source.unsplash.com/random/400x600/?${encodeURIComponent(
      w.keyword
    )}">
</a>
`
  )
  .join("")}

</div>

<br>
<a href="/">← Home</a>

</div>

</body>
</html>
`;

  fs.writeFileSync(`category/${cat}.html`, html);
});

// STEP 4 — SITEMAP
let sitemapUrls = [];

// homepage
sitemapUrls.push(`
<url>
  <loc>${baseUrl}/</loc>
</url>`);

// wallpaper pages
allSlugs.forEach((item) => {
  sitemapUrls.push(`
<url>
  <loc>${baseUrl}/wallpaper/${item.slug}.html</loc>
</url>`);
});

// category pages
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

console.log("✅ DONE: 1000 pages + categories + sitemap generated");