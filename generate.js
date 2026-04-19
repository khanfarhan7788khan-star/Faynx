/**
 * ══════════════════════════════════════════════════════════════
 *  FAYNX — Programmatic SEO Engine v3
 *  Generates: wallpaper pages, category pages, trust pages,
 *             sitemap, robots.txt, about/contact/privacy
 * ══════════════════════════════════════════════════════════════
 */

const fs   = require("fs");
const path = require("path");

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const BASE_URL  = "https://faynx.tech";
const SITE_NAME = "Faynx";
const TODAY     = new Date().toISOString().split("T")[0];

// ─────────────────────────────────────────
// TOPIC CLUSTERS — semantic grouping for
// topical authority & dedup protection
// ─────────────────────────────────────────
const CLUSTERS = [
  {
    slug: "nature",
    label: "Nature",
    icon: "🌿",
    color: "#1a3a2a",
    accent: "#4ade80",
    description: "Stunning nature wallpapers featuring forests, mountains, oceans, and wildlife in HD and 4K resolution.",
    seoIntro: "Nature wallpapers bring the beauty of the outdoors directly to your screen. Whether you love lush green forests, snow-capped mountain peaks, or the calming sound of ocean waves, our nature collection has thousands of free high-resolution wallpapers for every device.",
    keywords: [
      { kw: "dark forest",       modifier: "wallpaper",    variant: "4K Desktop" },
      { kw: "mountain view",     modifier: "wallpaper",    variant: "HD Phone" },
      { kw: "ocean wave",        modifier: "wallpaper",    variant: "Aesthetic" },
      { kw: "nature hd",         modifier: "wallpaper",    variant: "Free Download" },
      { kw: "forest morning",    modifier: "wallpaper",    variant: "4K" },
      { kw: "waterfall nature",  modifier: "wallpaper",    variant: "HD" },
      { kw: "cherry blossom",    modifier: "wallpaper",    variant: "4K" },
      { kw: "green landscape",   modifier: "wallpaper",    variant: "Desktop" },
      { kw: "sunrise mountains", modifier: "wallpaper",    variant: "HD" },
      { kw: "autumn forest",     modifier: "wallpaper",    variant: "Aesthetic" }
    ]
  },
  {
    slug: "anime",
    label: "Anime",
    icon: "🎌",
    color: "#2a1a3a",
    accent: "#c084fc",
    description: "Anime wallpapers from your favourite series and original art, available in HD and 4K for desktop and mobile.",
    seoIntro: "Anime wallpapers have become one of the most searched wallpaper categories globally. From iconic shounen scenes to peaceful slice-of-life artwork, our anime collection features thousands of free wallpapers perfect for personalising any device.",
    keywords: [
      { kw: "anime sky",         modifier: "wallpaper",    variant: "4K" },
      { kw: "anime aesthetic",   modifier: "wallpaper",    variant: "Phone" },
      { kw: "anime girl",        modifier: "wallpaper",    variant: "HD" },
      { kw: "anime landscape",   modifier: "wallpaper",    variant: "Desktop" },
      { kw: "dark anime",        modifier: "wallpaper",    variant: "4K" },
      { kw: "anime city night",  modifier: "wallpaper",    variant: "Aesthetic" },
      { kw: "anime flowers",     modifier: "wallpaper",    variant: "HD" },
      { kw: "anime wolf",        modifier: "wallpaper",    variant: "4K" },
      { kw: "anime space",       modifier: "wallpaper",    variant: "Desktop" },
      { kw: "lo-fi anime",       modifier: "wallpaper",    variant: "Chill" }
    ]
  },
  {
    slug: "cars",
    label: "Cars",
    icon: "🚗",
    color: "#1a1a2a",
    accent: "#f59e0b",
    description: "High-speed car wallpapers featuring supercars, sports cars, JDM legends, and luxury vehicles in 4K quality.",
    seoIntro: "Car wallpapers are the go-to choice for automotive enthusiasts. From raw JDM machines drifting through mountain roads to gleaming supercars parked at sunset, our car wallpaper collection celebrates speed and style in stunning HD and 4K resolution.",
    keywords: [
      { kw: "car 4k",            modifier: "wallpaper",    variant: "Desktop" },
      { kw: "supercar",          modifier: "wallpaper",    variant: "4K" },
      { kw: "JDM car",           modifier: "wallpaper",    variant: "HD" },
      { kw: "sports car night",  modifier: "wallpaper",    variant: "Neon" },
      { kw: "muscle car",        modifier: "wallpaper",    variant: "4K" },
      { kw: "car drift",         modifier: "wallpaper",    variant: "HD" },
      { kw: "luxury car",        modifier: "wallpaper",    variant: "Aesthetic" },
      { kw: "classic car",       modifier: "wallpaper",    variant: "Vintage" },
      { kw: "car sunset",        modifier: "wallpaper",    variant: "Desktop" },
      { kw: "racing car",        modifier: "wallpaper",    variant: "4K" }
    ]
  },
  {
    slug: "space",
    label: "Space",
    icon: "🌌",
    color: "#0a0a1a",
    accent: "#38bdf8",
    description: "Breathtaking space wallpapers featuring galaxies, nebulae, planets, and cosmic phenomena in 4K resolution.",
    seoIntro: "Space wallpapers transform your screen into a window to the cosmos. Our curated collection features breathtaking nebulae, spiral galaxies, planetary surfaces, and deep-field telescope imagery — all available free in HD and 4K resolution.",
    keywords: [
      { kw: "space galaxy",      modifier: "wallpaper",    variant: "4K" },
      { kw: "nebula",            modifier: "wallpaper",    variant: "HD" },
      { kw: "planet earth",      modifier: "wallpaper",    variant: "4K" },
      { kw: "milky way",         modifier: "wallpaper",    variant: "Night Sky" },
      { kw: "black hole",        modifier: "wallpaper",    variant: "4K" },
      { kw: "astronaut",         modifier: "wallpaper",    variant: "Aesthetic" },
      { kw: "galaxy minimal",    modifier: "wallpaper",    variant: "Dark" },
      { kw: "cosmic stars",      modifier: "wallpaper",    variant: "HD" },
      { kw: "mars planet",       modifier: "wallpaper",    variant: "4K" },
      { kw: "space exploration", modifier: "wallpaper",    variant: "Desktop" }
    ]
  },
  {
    slug: "minimal",
    label: "Minimal",
    icon: "◻",
    color: "#111118",
    accent: "#e2e8f0",
    description: "Clean minimal wallpapers with geometric shapes, solid colours, and subtle gradients for a distraction-free desktop.",
    seoIntro: "Minimal wallpapers are perfect for professionals and designers who prefer a clean, focused desktop. Our minimalist collection features carefully curated geometric patterns, solid gradients, abstract shapes, and monochrome designs that look stunning on any screen.",
    keywords: [
      { kw: "minimal black",     modifier: "wallpaper",    variant: "AMOLED" },
      { kw: "minimal geometric", modifier: "wallpaper",    variant: "4K" },
      { kw: "clean white",       modifier: "wallpaper",    variant: "Desktop" },
      { kw: "gradient minimal",  modifier: "wallpaper",    variant: "HD" },
      { kw: "abstract lines",    modifier: "wallpaper",    variant: "4K" },
      { kw: "flat color",        modifier: "wallpaper",    variant: "Phone" },
      { kw: "pastel minimal",    modifier: "wallpaper",    variant: "Aesthetic" },
      { kw: "dark minimal",      modifier: "wallpaper",    variant: "AMOLED" },
      { kw: "minimal typography",modifier: "wallpaper",    variant: "Desktop" },
      { kw: "solid black",       modifier: "wallpaper",    variant: "4K" }
    ]
  },
  {
    slug: "aesthetic",
    label: "Aesthetic",
    icon: "✨",
    color: "#1a1020",
    accent: "#f9a8d4",
    description: "Aesthetic wallpapers with dreamy lo-fi vibes, neon cityscapes, sunset tones, and cottagecore moods.",
    seoIntro: "Aesthetic wallpapers are all about mood and atmosphere. Whether you love the warm glow of a lo-fi sunset, the cool neon lights of a cyberpunk city, the dreamy pastels of cottagecore, or the dark romance of moody skies, our aesthetic wallpaper collection has thousands of options.",
    keywords: [
      { kw: "sunset aesthetic",  modifier: "wallpaper",    variant: "4K" },
      { kw: "neon city",         modifier: "wallpaper",    variant: "Cyberpunk" },
      { kw: "lo-fi aesthetic",   modifier: "wallpaper",    variant: "Chill" },
      { kw: "cottagecore",       modifier: "wallpaper",    variant: "Aesthetic" },
      { kw: "dark aesthetic",    modifier: "wallpaper",    variant: "Phone" },
      { kw: "pink aesthetic",    modifier: "wallpaper",    variant: "HD" },
      { kw: "purple aesthetic",  modifier: "wallpaper",    variant: "4K" },
      { kw: "vintage aesthetic", modifier: "wallpaper",    variant: "Retro" },
      { kw: "city lights",       modifier: "wallpaper",    variant: "Night" },
      { kw: "foggy aesthetic",   modifier: "wallpaper",    variant: "Moody" }
    ]
  }
];

// ─────────────────────────────────────────
// UNSPLASH COLLECTIONS — stable curated IDs
// These are real Unsplash collection IDs for
// reliable, topic-relevant images
// ─────────────────────────────────────────
const UNSPLASH_COLLECTIONS = {
  nature:    "1163637",  // Nature & Landscape
  anime:     "4332580",  // Anime & Illustration
  cars:      "1976082",  // Cars & Vehicles
  space:     "1242160",  // Space & Cosmos
  minimal:   "827743",   // Minimal & Abstract
  aesthetic: "3694365"   // Aesthetic & Moody
};

// Deterministic image URL by keyword + variant
// Uses Unsplash Source with specific search terms (stable enough for SEO)
function imageUrl(keyword, width = 1920, height = 1080) {
  const q = encodeURIComponent(keyword.replace(/\s+/g, ","));
  return `https://source.unsplash.com/${width}x${height}/?${q}`;
}
function thumbUrl(keyword) {
  return imageUrl(keyword, 400, 600);
}

// ─────────────────────────────────────────
// CONTENT LIBRARY — unique descriptions
// ─────────────────────────────────────────
const CLUSTER_CONTENT = {
  nature: [
    "Immerse yourself in the tranquil beauty of the natural world with this stunning wallpaper. Nature has always been one of humanity's greatest sources of inspiration, and bringing that energy to your screen can transform how you feel about your digital workspace.",
    "There's a reason nature photography continues to dominate wallpaper downloads worldwide. The organic shapes, natural colour palettes, and sense of scale these images provide create an immediate psychological effect — reducing stress, boosting creativity, and improving focus.",
    "Whether you're setting this as your desktop background, phone lock screen, or tablet wallpaper, this nature image delivers crisp detail at any resolution. The colours are preserved with precision, ensuring every leaf, wave, or mountain peak looks as vivid as the real thing."
  ],
  anime: [
    "Anime art has evolved into one of the most visually rich and emotionally expressive art forms of the modern era. This wallpaper captures that essence with its bold composition and distinctive visual style.",
    "Whether you're a fan of action-packed shonen, tranquil slice-of-life, or dark atmospheric seinen, anime wallpapers let you carry that emotional connection with your favourite visual universe wherever you go.",
    "The art in this wallpaper demonstrates the extraordinary craft of anime illustration — from the precise linework to the layered colour gradients and expressive compositions that make this style so globally beloved."
  ],
  cars: [
    "Automotive photography at its finest — this wallpaper captures the engineering artistry, raw power, and pure design beauty that makes car culture such a passionate global community.",
    "Great car wallpapers do more than just show a vehicle. They tell a story of speed, craftsmanship, and the relationship between machine and road. This image delivers that experience at full 4K resolution.",
    "Whether you're a gearhead who appreciates every curve of a bodykit, or someone who simply loves the aesthetic of a well-composed automotive shot, this wallpaper delivers premium quality for your screen."
  ],
  space: [
    "The cosmos has fascinated humanity since the first stargazers looked up and wondered. This space wallpaper brings the infinite scale and breathtaking beauty of the universe directly to your device.",
    "Space imagery captures something no other photography can — the humbling realisation of our place in an unfathomably vast universe, combined with the sheer visual spectacle of nebulae, galaxies, and cosmic phenomena.",
    "With modern telescope technology and deep-field imaging, we can now see corners of the universe that were invisible to previous generations. This wallpaper represents that frontier, bringing the cosmos to your screen in stunning clarity."
  ],
  minimal: [
    "Minimalism is not about emptiness — it's about clarity and intention. This minimal wallpaper strips away distraction to let your icons and widgets breathe, creating a clean, focused desktop environment.",
    "The psychology of minimalist design is well-documented: less visual noise means fewer cognitive interruptions, leading to greater focus and reduced anxiety. A clean wallpaper is a small but effective step toward a more productive digital environment.",
    "Minimal wallpapers are perennially popular among designers, developers, and creatives who spend long hours staring at screens. The clean aesthetic provides visual rest while keeping your setup looking polished and professional."
  ],
  aesthetic: [
    "Aesthetic wallpapers are defined by mood, atmosphere, and emotional resonance. This image was selected for its ability to evoke a specific feeling — that golden-hour warmth, that neon-soaked urban cool, or that dreamy lo-fi calm.",
    "The aesthetic wallpaper movement grew out of tumblr culture and has since evolved into a diverse visual language with countless sub-genres: cottagecore, dark academia, cyberpunk, vaporwave, and more. This image speaks to that tradition.",
    "Setting an aesthetic wallpaper is one of the simplest ways to personalise your digital space. It signals your taste, mood, and personality every time you look at your phone or unlock your laptop."
  ]
};

// ─────────────────────────────────────────
// SHARED CSS — injected into every page
// ─────────────────────────────────────────
const SHARED_CSS = `
  :root {
    --bg: #0a0a12;
    --bg2: #111120;
    --bg3: #181826;
    --bg4: #1e1e2e;
    --border: rgba(255,255,255,0.07);
    --text: #eeeef5;
    --text2: #7a7a9a;
    --text3: #3a3a58;
    --accent: #7c5cbf;
    --accent2: #a879f5;
    --gold: #f5c518;
    --r: 10px;
    --r-lg: 16px;
  }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { font-family: 'Inter', system-ui, sans-serif; background:var(--bg); color:var(--text); line-height:1.6; }
  a { color:inherit; text-decoration:none; }
  img { display:block; max-width:100%; }

  /* Header */
  .site-header {
    background:rgba(10,10,18,0.95);
    backdrop-filter:blur(20px);
    border-bottom:1px solid var(--border);
    padding:0 24px;
    position:sticky; top:0; z-index:100;
  }
  .header-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; gap:20px; height:60px; }
  .site-logo { font-size:22px; font-weight:800; font-style:italic; background:linear-gradient(135deg,#a879f5,#7c5cbf); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .header-nav { display:flex; gap:20px; margin-left:auto; }
  .header-nav a { font-size:13px; color:var(--text2); transition:color .15s; font-weight:500; }
  .header-nav a:hover { color:var(--text); }
  .header-cta { padding:7px 16px; border-radius:999px; background:var(--accent); color:#fff; font-size:13px; font-weight:700; border:none; cursor:pointer; transition:opacity .15s; }
  .header-cta:hover { opacity:.85; }

  /* Breadcrumbs */
  .breadcrumb { padding:14px 0; font-size:12px; color:var(--text2); display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
  .breadcrumb a { color:var(--text2); transition:color .12s; }
  .breadcrumb a:hover { color:var(--accent2); }
  .breadcrumb span { color:var(--text3); }

  /* Footer */
  .site-footer { background:var(--bg2); border-top:1px solid var(--border); padding:40px 24px 28px; margin-top:60px; }
  .footer-inner { max-width:1200px; margin:0 auto; }
  .footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px; margin-bottom:36px; }
  .footer-brand { }
  .footer-logo { font-size:24px; font-weight:800; font-style:italic; background:linear-gradient(135deg,#a879f5,#7c5cbf); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:10px; }
  .footer-desc { font-size:13px; color:var(--text2); line-height:1.65; max-width:260px; }
  .footer-col h4 { font-size:11px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.1em; margin-bottom:12px; }
  .footer-col a { display:block; font-size:13px; color:var(--text2); margin-bottom:7px; transition:color .12s; }
  .footer-col a:hover { color:var(--accent2); }
  .footer-bottom { border-top:1px solid var(--border); padding-top:20px; display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--text3); flex-wrap:wrap; gap:10px; }
  .footer-bottom a { color:var(--text3); transition:color .12s; }
  .footer-bottom a:hover { color:var(--text2); }

  /* Buttons */
  .btn { display:inline-flex; align-items:center; gap:8px; padding:11px 22px; border-radius:999px; font-size:14px; font-weight:700; cursor:pointer; border:none; transition:all .15s; text-decoration:none; }
  .btn-primary { background:var(--accent); color:#fff; }
  .btn-primary:hover { background:#6847aa; transform:translateY(-1px); box-shadow:0 6px 24px rgba(124,92,191,.4); }
  .btn-outline { background:transparent; border:1px solid var(--border); color:var(--text2); }
  .btn-outline:hover { border-color:var(--accent); color:var(--accent); background:rgba(124,92,191,.06); }
  .btn-download { background:linear-gradient(135deg,#7c5cbf,#a879f5); color:#fff; box-shadow:0 4px 20px rgba(124,92,191,.35); }
  .btn-download:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(124,92,191,.5); }

  /* Tags */
  .tag { display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:500; background:var(--bg3); border:1px solid var(--border); color:var(--text2); transition:all .12s; cursor:default; }
  .tag-link { cursor:pointer; }
  .tag-link:hover { border-color:var(--accent); color:var(--accent); background:rgba(124,92,191,.08); }

  /* Image card */
  .wall-card { border-radius:var(--r-lg); overflow:hidden; position:relative; background:var(--bg3); transition:transform .2s, box-shadow .2s; display:block; }
  .wall-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.6); }
  .wall-card img { width:100%; height:100%; object-fit:cover; display:block; }
  .wall-card-info { padding:10px 12px; }
  .wall-card-title { font-size:13px; font-weight:600; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:3px; }
  .wall-card-meta { font-size:11px; color:var(--text2); }

  /* Grid */
  .wall-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
  .wall-grid-lg { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
  .wall-masonry { columns:4; column-gap:12px; }
  .wall-masonry .wall-card { break-inside:avoid; margin-bottom:12px; }

  @media(max-width:768px) {
    .wall-masonry { columns:2; }
    .wall-grid { grid-template-columns:repeat(2,1fr); gap:8px; }
    .footer-grid { grid-template-columns:1fr 1fr; gap:24px; }
    .header-nav { display:none; }
  }
  @media(max-width:480px) {
    .wall-grid { grid-template-columns:repeat(2,1fr); }
  }
`;

// ─────────────────────────────────────────
// HEADER HTML
// ─────────────────────────────────────────
function headerHTML(activePath = "") {
  return `
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="site-logo">Faynx</a>
    <nav class="header-nav">
      <a href="/category/nature.html">Nature</a>
      <a href="/category/anime.html">Anime</a>
      <a href="/category/cars.html">Cars</a>
      <a href="/category/space.html">Space</a>
      <a href="/category/minimal.html">Minimal</a>
      <a href="/category/aesthetic.html">Aesthetic</a>
    </nav>
    <a href="/" class="header-cta">Browse All</a>
  </div>
</header>`;
}

// ─────────────────────────────────────────
// FOOTER HTML
// ─────────────────────────────────────────
function footerHTML() {
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-logo">Faynx</div>
        <p class="footer-desc">Free HD & 4K wallpapers for every screen. Curated daily, no watermarks, instant download.</p>
      </div>
      <div class="footer-col">
        <h4>Categories</h4>
        <a href="/category/nature.html">Nature Wallpapers</a>
        <a href="/category/anime.html">Anime Wallpapers</a>
        <a href="/category/cars.html">Car Wallpapers</a>
        <a href="/category/space.html">Space Wallpapers</a>
        <a href="/category/minimal.html">Minimal Wallpapers</a>
        <a href="/category/aesthetic.html">Aesthetic Wallpapers</a>
      </div>
      <div class="footer-col">
        <h4>Popular Tags</h4>
        <a href="/category/nature.html">Dark Forest</a>
        <a href="/category/space.html">Galaxy 4K</a>
        <a href="/category/aesthetic.html">Neon City</a>
        <a href="/category/minimal.html">AMOLED Black</a>
        <a href="/category/anime.html">Anime Sky</a>
      </div>
      <div class="footer-col">
        <h4>Faynx</h4>
        <a href="/about.html">About Us</a>
        <a href="/contact.html">Contact</a>
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Faynx. Free wallpapers powered by Unsplash.</span>
      <span><a href="/privacy-policy.html">Privacy</a> · <a href="/contact.html">Contact</a> · <a href="/sitemap.xml">Sitemap</a></span>
    </div>
  </div>
</footer>`;
}

// ─────────────────────────────────────────
// WEBSITE SCHEMA (once, for homepage)
// ─────────────────────────────────────────
function websiteSchema() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": BASE_URL,
    "description": "Free HD & 4K wallpapers — nature, anime, cars, space, minimal, aesthetic.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${BASE_URL}/?q={search_term_string}` },
      "query-input": "required name=search_term_string"
    }
  }, null, 2);
}

// ─────────────────────────────────────────
// BUILD ALL SLUGS from clusters
// ─────────────────────────────────────────
let allPages = []; // { slug, keyword, variant, cluster, index }

CLUSTERS.forEach(cluster => {
  cluster.keywords.forEach((kwObj, ki) => {
    // generate ~16 pages per keyword (suffix 1-16) = ~960 total
    for (let i = 1; i <= 16; i++) {
      const fullKw   = `${kwObj.kw} ${kwObj.modifier}`;
      const suffix   = `${slugify(kwObj.kw)}-${kwObj.variant.toLowerCase().replace(/\s+/g,"-")}-${i}`;
      allPages.push({
        slug:     suffix,
        keyword:  kwObj.kw,
        modifier: kwObj.modifier,
        variant:  kwObj.variant,
        cluster:  cluster.slug,
        clusterLabel: cluster.label,
        fullKeyword: fullKw,
        index:    allPages.length
      });
    }
  });
});

function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ═══════════════════════════════════════════════════════════════
// 1. WALLPAPER PAGE TEMPLATE
// ═══════════════════════════════════════════════════════════════
function generateWallpaperPage(item) {
  const { slug, keyword, variant, cluster, clusterLabel, fullKeyword, index } = item;

  // Pick stable image using keyword-based URL
  const mainImg     = imageUrl(keyword, 1920, 1080);
  const mainImgMd   = imageUrl(keyword, 1280, 720);
  const mainImgSm   = imageUrl(keyword, 640, 360);
  const thumbMain   = imageUrl(keyword, 800, 500);
  const mainImgPort = imageUrl(keyword, 1080, 1920); // portrait/phone

  // Pull related pages from same cluster, different keyword
  const sameCluster = allPages.filter(p => p.cluster === cluster && p.slug !== slug);
  const related = [];
  const seen = new Set();
  for (const p of sameCluster) {
    if (!seen.has(p.keyword) && related.length < 8) {
      seen.add(p.keyword);
      related.push(p);
    }
  }

  // Cluster object
  const clusterObj  = CLUSTERS.find(c => c.slug === cluster);
  const contentBlocks = CLUSTER_CONTENT[cluster] || CLUSTER_CONTENT.nature;
  const descBlock   = contentBlocks[index % contentBlocks.length];

  // Tags
  const tags = [
    keyword, `${keyword} wallpaper`, `${keyword} hd`, `${keyword} 4k`,
    `${variant} wallpaper`, `free ${keyword}`, `${clusterLabel} wallpaper`,
    `hd wallpaper`, `4k wallpaper`, `free wallpaper download`
  ];

  // JSON-LD
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ImageObject",
        "@id": `${BASE_URL}/wallpaper/${slug}.html#image`,
        "name": `${keyword} Wallpaper ${variant} — Free Download`,
        "description": `Free ${keyword} wallpaper in HD and 4K. Download ${keyword} background for desktop and phone. ${descBlock.substring(0, 200)}`,
        "contentUrl": mainImg,
        "thumbnailUrl": thumbMain,
        "encodingFormat": "image/jpeg",
        "width": "1920",
        "height": "1080",
        "author": { "@type": "Organization", "name": "Faynx" },
        "license": "https://unsplash.com/license",
        "acquireLicensePage": `${BASE_URL}/wallpaper/${slug}.html`
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
          { "@type": "ListItem", "position": 2, "name": `${clusterLabel} Wallpapers`, "item": `${BASE_URL}/category/${cluster}.html` },
          { "@type": "ListItem", "position": 3, "name": `${keyword} Wallpaper`, "item": `${BASE_URL}/wallpaper/${slug}.html` }
        ]
      },
      {
        "@type": "WebPage",
        "name": `${keyword} Wallpaper ${variant} — Free HD & 4K Download | Faynx`,
        "url": `${BASE_URL}/wallpaper/${slug}.html`,
        "description": `Download ${keyword} wallpaper in ${variant} quality. Free HD & 4K ${keyword} backgrounds for desktop and phone. No watermarks.`,
        "dateModified": TODAY,
        "isPartOf": { "@type": "WebSite", "url": BASE_URL, "name": SITE_NAME }
      }
    ]
  };

  const relatedCards = related.map(r => `
    <a href="/wallpaper/${r.slug}.html" class="wall-card" style="aspect-ratio:16/9">
      <img src="${thumbUrl(r.keyword)}" alt="${r.keyword} wallpaper" loading="lazy" width="400" height="225"/>
      <div class="wall-card-info">
        <div class="wall-card-title">${r.keyword} wallpaper</div>
        <div class="wall-card-meta">${r.variant} · Free Download</div>
      </div>
    </a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${keyword} Wallpaper ${variant} — Free HD & 4K Download | Faynx</title>
  <meta name="description" content="Download ${keyword} wallpaper in ${variant} quality, free. Beautiful ${keyword} background for desktop, phone & tablet. No watermark, instant download."/>
  <meta name="keywords" content="${tags.join(", ")}"/>
  <link rel="canonical" href="${BASE_URL}/wallpaper/${slug}.html"/>
  <meta property="og:title" content="${keyword} Wallpaper ${variant} — Free HD 4K | Faynx"/>
  <meta property="og:description" content="Free ${keyword} wallpaper in HD and 4K. Instant download, no watermarks."/>
  <meta property="og:image" content="${thumbMain}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${BASE_URL}/wallpaper/${slug}.html"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:image" content="${thumbMain}"/>
  <link rel="preconnect" href="https://source.unsplash.com"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>
  <style>
    ${SHARED_CSS}

    /* Page-specific */
    .hero-img-wrap { position:relative; border-radius:var(--r-lg); overflow:hidden; background:var(--bg3); }
    .hero-img { width:100%; height:auto; display:block; max-height:620px; object-fit:cover; }
    .img-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(10,10,18,.8) 0%, transparent 60%); }
    .img-actions { position:absolute; bottom:20px; left:0; right:0; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; z-index:2; }
    
    .main-grid { display:grid; grid-template-columns:1fr 320px; gap:32px; max-width:1200px; margin:0 auto; padding:24px; align-items:start; }
    .content-col { min-width:0; }
    .sidebar { position:sticky; top:80px; }
    
    .wallpaper-title { font-size:clamp(22px,4vw,34px); font-weight:800; line-height:1.15; margin-bottom:8px; }
    .wallpaper-subtitle { font-size:15px; color:var(--text2); margin-bottom:20px; }
    
    .meta-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:24px; }
    .meta-badge { padding:5px 13px; border-radius:999px; font-size:12px; font-weight:600; background:var(--bg3); border:1px solid var(--border); color:var(--text2); }
    .meta-badge.accent { background:rgba(124,92,191,.15); border-color:rgba(124,92,191,.3); color:#a879f5; }
    
    .download-section { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-lg); padding:20px; margin-bottom:24px; }
    .download-section h3 { font-size:14px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:14px; }
    .size-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
    .size-btn { padding:9px 14px; border-radius:var(--r); border:1px solid var(--border); background:var(--bg3); color:var(--text); font-size:13px; cursor:pointer; transition:all .15s; text-align:center; text-decoration:none; display:block; }
    .size-btn:hover { border-color:var(--accent); color:var(--accent); background:rgba(124,92,191,.08); }
    .size-btn strong { display:block; font-size:14px; font-weight:700; }
    .size-btn span { font-size:11px; color:var(--text2); }
    
    .content-section { margin-bottom:28px; }
    .content-section h2 { font-size:18px; font-weight:700; margin-bottom:12px; }
    .content-section p { font-size:15px; color:var(--text2); line-height:1.75; margin-bottom:14px; }
    
    .tags-wrap { display:flex; flex-wrap:wrap; gap:7px; }
    
    .specs-table { width:100%; border-collapse:collapse; font-size:13px; }
    .specs-table tr { border-bottom:1px solid var(--border); }
    .specs-table tr:last-child { border-bottom:none; }
    .specs-table td { padding:10px 0; }
    .specs-table td:first-child { color:var(--text2); width:140px; }
    .specs-table td:last-child { font-weight:600; }
    
    .related-section { max-width:1200px; margin:0 auto; padding:0 24px 48px; }
    .section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    .section-title { font-size:20px; font-weight:700; }
    .section-link { font-size:13px; color:var(--accent2); }

    @media(max-width:860px) {
      .main-grid { grid-template-columns:1fr; }
      .sidebar { position:static; }
    }
  </style>
</head>
<body>

${headerHTML()}

<div style="max-width:1200px;margin:0 auto;padding:0 24px">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/">Home</a>
    <span>›</span>
    <a href="/category/${cluster}.html">${clusterLabel} Wallpapers</a>
    <span>›</span>
    <span>${keyword} Wallpaper</span>
  </nav>
</div>

<div class="main-grid">
  <!-- Main content -->
  <div class="content-col">
    <div class="hero-img-wrap">
      <picture>
        <source srcset="${mainImgSm}" media="(max-width:640px)" width="640" height="360"/>
        <source srcset="${mainImgMd}" media="(max-width:1280px)" width="1280" height="720"/>
        <img
          class="hero-img"
          src="${mainImg}"
          alt="${keyword} wallpaper in ${variant} quality — free download"
          width="1920" height="1080"
          loading="eager"
          fetchpriority="high"
        />
      </picture>
      <div class="img-overlay"></div>
      <div class="img-actions">
        <a href="${mainImg}" download="faynx-${slug}-hd.jpg" class="btn btn-download" rel="nofollow">
          ↓ Download HD (1920×1080)
        </a>
        <a href="${mainImgPort}" download="faynx-${slug}-mobile.jpg" class="btn btn-outline" style="background:rgba(0,0,0,.5);backdrop-filter:blur(8px);color:#fff;border-color:rgba(255,255,255,.2)" rel="nofollow">
          📱 Mobile Version
        </a>
      </div>
    </div>

    <div style="margin-top:24px">
      <h1 class="wallpaper-title">${keyword.charAt(0).toUpperCase()+keyword.slice(1)} Wallpaper — ${variant}</h1>
      <p class="wallpaper-subtitle">Free HD & 4K ${keyword} background for desktop, phone, and tablet. No watermarks. No sign-up required.</p>
      
      <div class="meta-row">
        <span class="meta-badge accent">${variant}</span>
        <span class="meta-badge">${clusterLabel}</span>
        <span class="meta-badge">Free Download</span>
        <span class="meta-badge">No Watermark</span>
      </div>

      <!-- About this wallpaper -->
      <div class="content-section">
        <h2>About This ${keyword.charAt(0).toUpperCase()+keyword.slice(1)} Wallpaper</h2>
        <p>${descBlock}</p>
        <p>This <strong>${keyword} wallpaper</strong> is available in multiple resolutions including full HD (1920×1080), 4K Ultra HD (3840×2160), and mobile portrait format (1080×1920). All versions are completely free to download and use as personal wallpapers with no watermarks or attribution requirements.</p>
        <p>The <strong>${variant}</strong> variant of this wallpaper has been curated specifically for users who want a high-quality, visually striking ${keyword} background. Whether you're using it on a dual-monitor desktop setup, a 4K display, or as a phone lock screen, this image delivers excellent clarity and colour fidelity at any size.</p>
      </div>

      <!-- How to set as wallpaper -->
      <div class="content-section">
        <h2>How to Set as Wallpaper</h2>
        <p><strong>Desktop (Windows):</strong> Right-click the downloaded image → "Set as desktop background." For best quality, choose "Fill" or "Fit" as the display mode.</p>
        <p><strong>Desktop (Mac):</strong> Right-click the image → "Set Desktop Picture," or open System Settings → Wallpaper and drag the image in.</p>
        <p><strong>iPhone:</strong> Save the image to Photos → open the image → tap the share icon → "Use as Wallpaper" → choose Lock Screen, Home Screen, or both.</p>
        <p><strong>Android:</strong> Long-press your home screen → Wallpapers → select the downloaded image, then crop and position to your preference.</p>
      </div>

      <!-- Tags -->
      <div class="content-section">
        <h2>Tags & Keywords</h2>
        <div class="tags-wrap">
          ${tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
      </div>
    </div>
  </div>

  <!-- Sidebar -->
  <aside class="sidebar">
    <!-- Download panel -->
    <div class="download-section">
      <h3>Download Sizes</h3>
      <div class="size-grid">
        <a href="${imageUrl(keyword, 1920, 1080)}" download="faynx-${slug}-1080p.jpg" class="size-btn" rel="nofollow">
          <strong>1920×1080</strong>
          <span>Full HD · 16:9</span>
        </a>
        <a href="${imageUrl(keyword, 2560, 1440)}" download="faynx-${slug}-1440p.jpg" class="size-btn" rel="nofollow">
          <strong>2560×1440</strong>
          <span>QHD · 16:9</span>
        </a>
        <a href="${imageUrl(keyword, 3840, 2160)}" download="faynx-${slug}-4k.jpg" class="size-btn" rel="nofollow">
          <strong>3840×2160</strong>
          <span>4K UHD · 16:9</span>
        </a>
        <a href="${imageUrl(keyword, 1080, 1920)}" download="faynx-${slug}-mobile.jpg" class="size-btn" rel="nofollow">
          <strong>1080×1920</strong>
          <span>Mobile · 9:16</span>
        </a>
        <a href="${imageUrl(keyword, 1170, 2532)}" download="faynx-${slug}-iphone.jpg" class="size-btn" rel="nofollow">
          <strong>1170×2532</strong>
          <span>iPhone · Pro</span>
        </a>
        <a href="${imageUrl(keyword, 1440, 3040)}" download="faynx-${slug}-android.jpg" class="size-btn" rel="nofollow">
          <strong>1440×3040</strong>
          <span>Android · HD</span>
        </a>
      </div>
      <a href="${mainImg}" download="faynx-${slug}-original.jpg" class="btn btn-download" style="width:100%;justify-content:center" rel="nofollow">
        ↓ Download Original
      </a>
    </div>

    <!-- Specs -->
    <div class="download-section">
      <h3>Image Details</h3>
      <table class="specs-table">
        <tr><td>Category</td><td>${clusterLabel}</td></tr>
        <tr><td>Variant</td><td>${variant}</td></tr>
        <tr><td>Keyword</td><td>${keyword}</td></tr>
        <tr><td>Max Resolution</td><td>4K (3840×2160)</td></tr>
        <tr><td>Format</td><td>JPEG</td></tr>
        <tr><td>License</td><td>Free (Unsplash)</td></tr>
        <tr><td>Watermark</td><td>None</td></tr>
      </table>
    </div>

    <!-- Category link -->
    <div class="download-section">
      <h3>Browse Category</h3>
      <p style="font-size:13px;color:var(--text2);margin-bottom:12px">Explore more ${clusterLabel.toLowerCase()} wallpapers in our curated collection.</p>
      <a href="/category/${cluster}.html" class="btn btn-primary" style="width:100%;justify-content:center">
        View All ${clusterLabel} →
      </a>
    </div>
  </aside>
</div>

<!-- Related wallpapers -->
<section class="related-section">
  <div class="section-head">
    <h2 class="section-title">More ${clusterLabel} Wallpapers</h2>
    <a href="/category/${cluster}.html" class="section-link">View all →</a>
  </div>
  <div class="wall-grid-lg">
    ${relatedCards}
  </div>
</section>

${footerHTML()}

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// 2. CATEGORY PAGE TEMPLATE
// ═══════════════════════════════════════════════════════════════
function generateCategoryPage(cluster) {
  const pages  = allPages.filter(p => p.cluster === cluster.slug);
  const PAGE_SIZE = 48;
  const totalPages = Math.ceil(pages.length / PAGE_SIZE);

  // Only generate page 1 here (full pagination would be separate)
  const firstPage = pages.slice(0, PAGE_SIZE);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "name": `${cluster.label} Wallpapers — Free HD & 4K | Faynx`,
        "url": `${BASE_URL}/category/${cluster.slug}.html`,
        "description": cluster.description,
        "dateModified": TODAY,
        "isPartOf": { "@type": "WebSite", "url": BASE_URL, "name": SITE_NAME }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
          { "@type": "ListItem", "position": 2, "name": `${cluster.label} Wallpapers`, "item": `${BASE_URL}/category/${cluster.slug}.html` }
        ]
      },
      {
        "@type": "ItemList",
        "name": `${cluster.label} Wallpapers`,
        "numberOfItems": pages.length,
        "itemListElement": firstPage.slice(0, 10).map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "url": `${BASE_URL}/wallpaper/${p.slug}.html`,
          "name": `${p.keyword} wallpaper ${p.variant}`
        }))
      }
    ]
  };

  // Group by keyword for sub-sections (max 5 keywords shown = 4 images each)
  const keywordGroups = {};
  firstPage.forEach(p => {
    if (!keywordGroups[p.keyword]) keywordGroups[p.keyword] = [];
    if (keywordGroups[p.keyword].length < 4) keywordGroups[p.keyword].push(p);
  });

  const gridCards = firstPage.map(p => `
    <a href="/wallpaper/${p.slug}.html" class="wall-card" style="aspect-ratio:4/3" aria-label="${p.keyword} wallpaper ${p.variant}">
      <img
        src="${thumbUrl(p.keyword)}"
        alt="${p.keyword} ${p.variant} wallpaper free download"
        loading="lazy"
        width="400" height="300"
      />
      <div class="wall-card-info">
        <div class="wall-card-title">${p.keyword.charAt(0).toUpperCase()+p.keyword.slice(1)}</div>
        <div class="wall-card-meta">${p.variant} · Free</div>
      </div>
    </a>`).join("");

  // Other categories for cross-linking
  const otherClusters = CLUSTERS.filter(c => c.slug !== cluster.slug).slice(0, 5);
  const crossLinks = otherClusters.map(c =>
    `<a href="/category/${c.slug}.html" class="tag tag-link">${c.icon} ${c.label} Wallpapers</a>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${cluster.label} Wallpapers — Free HD & 4K Download | Faynx</title>
  <meta name="description" content="${cluster.description} Browse ${pages.length}+ free wallpapers, instant download, no watermarks."/>
  <meta name="keywords" content="${cluster.label.toLowerCase()} wallpaper, ${cluster.label.toLowerCase()} wallpaper 4k, ${cluster.label.toLowerCase()} wallpaper hd, free ${cluster.label.toLowerCase()} wallpaper, ${cluster.label.toLowerCase()} background"/>
  <link rel="canonical" href="${BASE_URL}/category/${cluster.slug}.html"/>
  <meta property="og:title" content="${cluster.label} Wallpapers — Free HD & 4K | Faynx"/>
  <meta property="og:description" content="${cluster.description}"/>
  <meta property="og:image" content="${imageUrl(cluster.keywords[0].kw, 1200, 630)}"/>
  <meta property="og:type" content="website"/>
  <link rel="preconnect" href="https://source.unsplash.com"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>
  <style>
    ${SHARED_CSS}

    .cat-hero { padding:52px 24px 40px; max-width:1200px; margin:0 auto; }
    .cat-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 14px; border-radius:999px; background:rgba(124,92,191,.12); border:1px solid rgba(124,92,191,.25); color:#a879f5; font-size:12px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; margin-bottom:16px; }
    .cat-title { font-size:clamp(28px,5vw,52px); font-weight:800; line-height:1.1; margin-bottom:14px; }
    .cat-desc { font-size:16px; color:var(--text2); max-width:640px; line-height:1.7; margin-bottom:24px; }
    .cat-stats { display:flex; gap:28px; flex-wrap:wrap; margin-bottom:28px; }
    .cat-stat { }
    .cat-stat strong { display:block; font-size:24px; font-weight:800; }
    .cat-stat span { font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; }
    .cat-seo { font-size:14px; color:var(--text2); line-height:1.75; margin-bottom:32px; }

    .filters-bar { display:flex; gap:8px; flex-wrap:wrap; padding:16px 24px; background:var(--bg2); border-top:1px solid var(--border); border-bottom:1px solid var(--border); max-width:100%; overflow-x:auto; }
    .filter-pill { padding:6px 16px; border-radius:999px; border:1px solid var(--border); background:transparent; color:var(--text2); font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; transition:all .12s; text-decoration:none; display:inline-block; }
    .filter-pill:hover, .filter-pill.active { background:var(--accent); border-color:var(--accent); color:#fff; }

    .gallery-wrap { max-width:1200px; margin:0 auto; padding:24px; }
    .gallery-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; font-size:13px; color:var(--text2); }
    .sort-select { background:var(--bg3); border:1px solid var(--border); color:var(--text); padding:6px 12px; border-radius:var(--r); font-size:13px; outline:none; }

    .pagination { display:flex; justify-content:center; gap:8px; margin-top:40px; flex-wrap:wrap; }
    .page-btn { width:38px; height:38px; border-radius:var(--r); border:1px solid var(--border); background:transparent; color:var(--text2); font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .12s; text-decoration:none; }
    .page-btn:hover, .page-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }

    .seo-section { max-width:1200px; margin:48px auto 0; padding:0 24px 48px; }
    .seo-section h2 { font-size:20px; font-weight:700; margin-bottom:12px; }
    .seo-section p { font-size:14px; color:var(--text2); line-height:1.75; margin-bottom:10px; }
    .cross-links { margin-top:20px; display:flex; flex-wrap:wrap; gap:8px; }

    @media(max-width:600px) {
      .cat-stats { gap:16px; }
      .wall-grid { grid-template-columns:repeat(2,1fr); gap:8px; }
    }
  </style>
</head>
<body>

${headerHTML()}

<!-- Category hero -->
<div style="background:linear-gradient(135deg,${cluster.color} 0%,var(--bg) 100%)">
  <div class="cat-hero">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> <span>›</span>
      <span>${cluster.label} Wallpapers</span>
    </nav>
    <div class="cat-badge">${cluster.icon} ${cluster.label}</div>
    <h1 class="cat-title">${cluster.label} Wallpapers<br/><span style="color:${cluster.accent}">HD & 4K Free</span></h1>
    <p class="cat-desc">${cluster.description}</p>
    <div class="cat-stats">
      <div class="cat-stat"><strong>${pages.length}+</strong><span>Wallpapers</span></div>
      <div class="cat-stat"><strong>4K</strong><span>Max Quality</span></div>
      <div class="cat-stat"><strong>Free</strong><span>No Watermark</span></div>
      <div class="cat-stat"><strong>Fast</strong><span>Instant Download</span></div>
    </div>
  </div>
</div>

<!-- Keyword filters -->
<div class="filters-bar" role="navigation" aria-label="Filter by style">
  <a href="/category/${cluster.slug}.html" class="filter-pill active">All</a>
  ${cluster.keywords.map(k =>
    `<a href="/category/${cluster.slug}.html#${slugify(k.kw)}" class="filter-pill">${k.kw}</a>`
  ).join("")}
</div>

<!-- Gallery -->
<div class="gallery-wrap">
  <div class="gallery-meta">
    <span>Showing <strong>${firstPage.length}</strong> of <strong>${pages.length}</strong> wallpapers</span>
    <select class="sort-select" aria-label="Sort order">
      <option>Most Popular</option>
      <option>Newest</option>
      <option>4K First</option>
    </select>
  </div>
  <div class="wall-grid">
    ${gridCards}
  </div>

  <!-- Pagination -->
  <nav class="pagination" aria-label="Page navigation">
    <span class="page-btn active">1</span>
    ${Array.from({length: Math.min(totalPages - 1, 5)}, (_, i) =>
      `<a href="/category/${cluster.slug}-page-${i+2}.html" class="page-btn">${i+2}</a>`
    ).join("")}
    ${totalPages > 6 ? `<span class="page-btn" style="pointer-events:none">…</span><a href="/category/${cluster.slug}-page-${totalPages}.html" class="page-btn">${totalPages}</a>` : ""}
  </nav>
</div>

<!-- SEO content section -->
<section class="seo-section">
  <h2>About ${cluster.label} Wallpapers</h2>
  <p>${cluster.seoIntro}</p>
  <p>All wallpapers in this collection are available in multiple resolutions: Full HD (1920×1080), 2K (2560×1440), 4K UHD (3840×2160), and mobile-optimised portrait formats. Every image is free to download with no watermarks or sign-up required.</p>
  <p>Our ${cluster.label.toLowerCase()} wallpaper collection is updated regularly with new images curated to ensure quality, variety, and visual impact. Use our filter bar above to narrow down by specific style or resolution.</p>
  <div class="cross-links">
    <strong style="font-size:13px;color:var(--text2);align-self:center">Also explore:</strong>
    ${crossLinks}
  </div>
</section>

${footerHTML()}

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// 3. TRUST PAGES
// ═══════════════════════════════════════════════════════════════
function generateAboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Faynx — Free HD & 4K Wallpapers",
    "url": `${BASE_URL}/about.html`,
    "isPartOf": { "@type": "WebSite", "url": BASE_URL, "name": SITE_NAME }
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>About Faynx — Free HD & 4K Wallpaper Website</title>
  <meta name="description" content="Learn about Faynx — a free HD and 4K wallpaper website with thousands of curated backgrounds for desktop and mobile. No watermarks, no sign-up."/>
  <link rel="canonical" href="${BASE_URL}/about.html"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>
  <style>${SHARED_CSS}
  .page-wrap { max-width:800px; margin:0 auto; padding:48px 24px; }
  .page-title { font-size:clamp(28px,5vw,44px); font-weight:800; margin-bottom:16px; }
  .page-lead { font-size:17px; color:var(--text2); line-height:1.75; margin-bottom:32px; }
  h2 { font-size:22px; font-weight:700; margin:32px 0 12px; }
  p { font-size:15px; color:var(--text2); line-height:1.8; margin-bottom:14px; }
  ul { padding-left:20px; margin-bottom:14px; }
  li { font-size:15px; color:var(--text2); line-height:1.8; margin-bottom:6px; }
  .stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:24px 0; }
  .stat-box { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-lg); padding:20px; text-align:center; }
  .stat-box strong { display:block; font-size:28px; font-weight:800; background:linear-gradient(135deg,#a879f5,#7c5cbf); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .stat-box span { font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; }
  </style>
</head>
<body>
${headerHTML()}
<div class="page-wrap">
  <nav class="breadcrumb"><a href="/">Home</a> <span>›</span> <span>About</span></nav>
  <h1 class="page-title">About Faynx</h1>
  <p class="page-lead">Faynx is a free HD and 4K wallpaper website designed to make it easy to find and download beautiful, high-quality backgrounds for any device — desktop, phone, or tablet.</p>

  <div class="stat-row">
    <div class="stat-box"><strong>1000+</strong><span>Wallpapers</span></div>
    <div class="stat-box"><strong>6</strong><span>Categories</span></div>
    <div class="stat-box"><strong>4K</strong><span>Max Quality</span></div>
  </div>

  <h2>Our Mission</h2>
  <p>We believe everyone deserves a beautiful digital environment. Faynx was built to be the cleanest, fastest, and most comprehensive free wallpaper resource on the web — with no ads cluttering the experience, no watermarks on downloads, and no account required.</p>
  <p>We curate our collection across six major categories: Nature, Anime, Cars, Space, Minimal, and Aesthetic — covering the most searched wallpaper styles globally.</p>

  <h2>Image Quality & Sources</h2>
  <p>All images on Faynx are sourced from Unsplash, one of the world's largest repositories of freely-licensed photography. Unsplash images are contributed by talented photographers from around the world and are available under the <a href="https://unsplash.com/license" style="color:var(--accent2)">Unsplash License</a>, which permits free use for personal and commercial projects.</p>
  <p>Every wallpaper on Faynx is available in multiple resolutions, from standard HD (1920×1080) to 4K UHD (3840×2160), as well as mobile-optimised portrait formats for iPhone and Android devices.</p>

  <h2>What We Offer</h2>
  <ul>
    <li>1000+ curated wallpapers across 6 categories</li>
    <li>Multiple download resolutions: HD, 2K, 4K, Mobile</li>
    <li>Zero watermarks on all downloads</li>
    <li>No account or sign-up required</li>
    <li>Fast loading with optimised image delivery</li>
    <li>Regular updates with new wallpapers</li>
    <li>Free to use for personal and commercial purposes</li>
  </ul>

  <h2>Contact Us</h2>
  <p>Have a suggestion, found a broken image, or want to contribute? We'd love to hear from you. Visit our <a href="/contact.html" style="color:var(--accent2)">contact page</a> to get in touch.</p>
</div>
${footerHTML()}
</body>
</html>`;
}

function generateContactPage() {
  const schema = { "@context":"https://schema.org","@type":"ContactPage","name":"Contact Faynx","url":`${BASE_URL}/contact.html` };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Contact Faynx — Get in Touch</title>
  <meta name="description" content="Contact the Faynx team. Report issues, suggest wallpapers, or ask questions about our free HD wallpaper website."/>
  <link rel="canonical" href="${BASE_URL}/contact.html"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>
  <style>${SHARED_CSS}
  .page-wrap { max-width:640px; margin:0 auto; padding:48px 24px; }
  .page-title { font-size:clamp(26px,4vw,40px); font-weight:800; margin-bottom:12px; }
  p { font-size:15px; color:var(--text2); line-height:1.8; margin-bottom:16px; }
  .contact-form { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-lg); padding:28px; margin-top:24px; }
  .form-group { margin-bottom:18px; }
  label { display:block; font-size:12px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; margin-bottom:6px; }
  input, textarea, select { width:100%; padding:11px 14px; background:var(--bg3); border:1px solid var(--border); border-radius:var(--r); color:var(--text); font-size:14px; font-family:inherit; transition:border-color .15s; }
  input:focus, textarea:focus { border-color:var(--accent); outline:none; box-shadow:0 0 0 3px rgba(124,92,191,.15); }
  textarea { height:120px; resize:vertical; }
  .submit-btn { width:100%; padding:13px; background:var(--accent); color:#fff; border:none; border-radius:999px; font-size:15px; font-weight:700; cursor:pointer; transition:opacity .15s; }
  .submit-btn:hover { opacity:.85; }
  .contact-methods { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:28px; }
  .contact-method { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-lg); padding:16px; }
  .contact-method h3 { font-size:13px; font-weight:700; margin-bottom:5px; }
  .contact-method p { font-size:12px; color:var(--text2); margin:0; }
  </style>
</head>
<body>
${headerHTML()}
<div class="page-wrap">
  <nav class="breadcrumb"><a href="/">Home</a> <span>›</span> <span>Contact</span></nav>
  <h1 class="page-title">Contact Us</h1>
  <p>We'd love to hear from you. Whether you've found a broken image, want to suggest a new wallpaper category, have a partnership enquiry, or just want to say hello — use the form below.</p>

  <div class="contact-form">
    <div class="form-group">
      <label for="contact-name">Your Name</label>
      <input type="text" id="contact-name" name="name" placeholder="Jane Smith" autocomplete="name"/>
    </div>
    <div class="form-group">
      <label for="contact-email">Email Address</label>
      <input type="email" id="contact-email" name="email" placeholder="jane@example.com" autocomplete="email"/>
    </div>
    <div class="form-group">
      <label for="contact-subject">Subject</label>
      <select id="contact-subject" name="subject">
        <option>General Enquiry</option>
        <option>Report Broken Image</option>
        <option>Suggest Wallpaper Category</option>
        <option>Copyright / DMCA</option>
        <option>Partnership / Collaboration</option>
        <option>Technical Issue</option>
      </select>
    </div>
    <div class="form-group">
      <label for="contact-message">Message</label>
      <textarea id="contact-message" name="message" placeholder="Tell us how we can help…"></textarea>
    </div>
    <button type="submit" class="submit-btn">Send Message</button>
  </div>

  <div class="contact-methods">
    <div class="contact-method">
      <h3>📧 Email</h3>
      <p>hello@faynx.tech</p>
    </div>
    <div class="contact-method">
      <h3>⏱ Response Time</h3>
      <p>Usually within 48 hours</p>
    </div>
    <div class="contact-method">
      <h3>🛡 Copyright / DMCA</h3>
      <p>dmca@faynx.tech</p>
    </div>
    <div class="contact-method">
      <h3>🌐 Based</h3>
      <p>Online · Worldwide</p>
    </div>
  </div>
</div>
${footerHTML()}
</body>
</html>`;
}

function generatePrivacyPage() {
  const schema = { "@context":"https://schema.org","@type":"WebPage","name":"Privacy Policy — Faynx","url":`${BASE_URL}/privacy-policy.html` };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Privacy Policy — Faynx</title>
  <meta name="description" content="Faynx privacy policy. Learn how we handle data, cookies, and analytics on our free wallpaper website."/>
  <link rel="canonical" href="${BASE_URL}/privacy-policy.html"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>
  <style>${SHARED_CSS}
  .page-wrap { max-width:800px; margin:0 auto; padding:48px 24px; }
  .page-title { font-size:clamp(26px,4vw,40px); font-weight:800; margin-bottom:8px; }
  .updated { font-size:13px; color:var(--text3); margin-bottom:28px; }
  h2 { font-size:19px; font-weight:700; margin:28px 0 10px; color:var(--text); }
  p, li { font-size:14px; color:var(--text2); line-height:1.8; margin-bottom:10px; }
  ul { padding-left:20px; margin-bottom:14px; }
  a { color:var(--accent2); }
  </style>
</head>
<body>
${headerHTML()}
<div class="page-wrap">
  <nav class="breadcrumb"><a href="/">Home</a> <span>›</span> <span>Privacy Policy</span></nav>
  <h1 class="page-title">Privacy Policy</h1>
  <p class="updated">Last updated: ${TODAY}</p>

  <p>Faynx ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains what information we collect when you visit faynx.tech, how we use it, and your rights regarding that information.</p>

  <h2>1. Information We Collect</h2>
  <p>We collect minimal data to provide and improve our service:</p>
  <ul>
    <li><strong>Usage data:</strong> Pages visited, time on site, browser type, and referring URL via anonymised analytics.</li>
    <li><strong>Download events:</strong> We record when wallpaper downloads occur (without linking them to individual users).</li>
    <li><strong>Contact form submissions:</strong> Name and email address when you contact us voluntarily.</li>
  </ul>

  <h2>2. Cookies</h2>
  <p>We use cookies for:</p>
  <ul>
    <li>Analytics (e.g. Google Analytics in anonymised mode)</li>
    <li>Remembering your theme/layout preferences</li>
    <li>PWA service worker functionality for offline support</li>
  </ul>
  <p>We do not use cookies for advertising or third-party tracking.</p>

  <h2>3. Third-Party Services</h2>
  <p>Images on Faynx are served via Unsplash. When images load, your browser may connect to Unsplash's servers. Please review <a href="https://unsplash.com/privacy" target="_blank" rel="noopener">Unsplash's privacy policy</a> for details on how they handle requests.</p>
  <p>We may use Google Analytics for aggregated, anonymised traffic analysis. IP anonymisation is enabled.</p>

  <h2>4. Data Retention</h2>
  <p>We retain anonymised analytics data for up to 26 months. Contact form submissions are retained for up to 12 months. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

  <h2>5. Your Rights</h2>
  <p>Under GDPR and applicable laws, you have the right to access, correct, or delete any personal data we hold about you. To exercise these rights, contact us at privacy@faynx.tech.</p>

  <h2>6. Changes to This Policy</h2>
  <p>We may update this policy periodically. Significant changes will be noted on this page with an updated date.</p>

  <h2>7. Contact</h2>
  <p>Questions about this policy? Email us at <a href="mailto:privacy@faynx.tech">privacy@faynx.tech</a> or visit our <a href="/contact.html">contact page</a>.</p>
</div>
${footerHTML()}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// 4. SITEMAP GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateSitemap() {
  const urls = [
    { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE_URL}/about.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE_URL}/contact.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${BASE_URL}/privacy-policy.html`, priority: "0.3", changefreq: "yearly" },
    ...CLUSTERS.map(c => ({ loc: `${BASE_URL}/category/${c.slug}.html`, priority: "0.9", changefreq: "weekly" })),
    ...allPages.map(p => ({ loc: `${BASE_URL}/wallpaper/${p.slug}.html`, priority: "0.7", changefreq: "monthly" }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}

// ═══════════════════════════════════════════════════════════════
// 5. ROBOTS.TXT
// ═══════════════════════════════════════════════════════════════
function generateRobots() {
  return `User-agent: *
Allow: /
Disallow: /cdn-cgi/

Sitemap: ${BASE_URL}/sitemap.xml
Host: ${BASE_URL}`;
}

// ═══════════════════════════════════════════════════════════════
// WRITE ALL FILES
// ═══════════════════════════════════════════════════════════════
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

console.log("🚀 Faynx SEO Engine starting...\n");

// Dirs
ensureDir("wallpaper");
ensureDir("category");

// Wallpaper pages
console.log(`📄 Generating ${allPages.length} wallpaper pages...`);
allPages.forEach((item, i) => {
  fs.writeFileSync(`wallpaper/${item.slug}.html`, generateWallpaperPage(item));
  if ((i + 1) % 100 === 0) process.stdout.write(`  ${i + 1}/${allPages.length} done\n`);
});
console.log(`  ✅ ${allPages.length} wallpaper pages written\n`);

// Category pages
console.log("📂 Generating category pages...");
CLUSTERS.forEach(cluster => {
  fs.writeFileSync(`category/${cluster.slug}.html`, generateCategoryPage(cluster));
  console.log(`  ✅ /category/${cluster.slug}.html`);
});
console.log();

// Trust pages
console.log("🛡 Generating trust pages...");
fs.writeFileSync("about.html", generateAboutPage());
console.log("  ✅ /about.html");
fs.writeFileSync("contact.html", generateContactPage());
console.log("  ✅ /contact.html");
fs.writeFileSync("privacy-policy.html", generatePrivacyPage());
console.log("  ✅ /privacy-policy.html");
console.log();

// Sitemap + robots
console.log("🗺 Generating sitemap & robots.txt...");
fs.writeFileSync("sitemap.xml", generateSitemap());
console.log(`  ✅ sitemap.xml (${allPages.length + CLUSTERS.length + 4} URLs)`);
fs.writeFileSync("robots.txt", generateRobots());
console.log("  ✅ robots.txt\n");

// Summary
console.log("══════════════════════════════════════════════");
console.log(`✅ DONE — ${allPages.length} wallpaper pages`);
console.log(`✅ DONE — ${CLUSTERS.length} category pages`);
console.log("✅ DONE — about, contact, privacy-policy");
console.log("✅ DONE — sitemap.xml + robots.txt");
console.log("══════════════════════════════════════════════");
