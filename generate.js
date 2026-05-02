/**
 * ═══════════════════════════════════════════════════════════════
 *  FAYNX — Programmatic SEO Engine v4 (Redesigned)
 *  New: content variation engine, image sitemap, WebP URLs,
 *       deduplication, CTR-optimised titles, luxury design tokens
 * ═══════════════════════════════════════════════════════════════
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
// UTILS
// ─────────────────────────────────────────
function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Deterministic hash for content variation — no randomness = reproducible builds */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Unsplash Imgix URL with WebP + quality */
function imgUrl(keyword, w = 1920, h = 1080, fmt = "webp") {
  const q = encodeURIComponent(keyword.replace(/\s+/g, ","));
  return `https://source.unsplash.com/${w}x${h}/?${q}&fm=${fmt}&q=80`;
}
function thumbUrl(keyword) { return imgUrl(keyword, 400, 300); }
function heroUrl(keyword)  { return imgUrl(keyword, 1920, 1080); }
function ogUrl(keyword)    { return imgUrl(keyword, 1200, 630, "jpeg"); }

// ─────────────────────────────────────────
// CLUSTERS
// ─────────────────────────────────────────
const CLUSTERS = [
  {
    slug: "nature", label: "Nature", icon: "✦",
    color: "#0a1a10",
    accent: "#4ade80",
    description: "Stunning nature wallpapers featuring forests, mountains, oceans, and wildlife in HD and 4K.",
    seoIntro: "Nature wallpapers bring the raw beauty of the natural world directly to your screen. Whether you love lush green forests, snow-capped mountain peaks, or the calming expanse of ocean waves, our nature collection delivers thousands of free high-resolution wallpapers for every device — desktop, iPhone, and Android.",
    keywords: [
      { kw: "dark forest",       modifier: "wallpaper", variant: "4K Desktop" },
      { kw: "mountain view",     modifier: "wallpaper", variant: "HD Phone" },
      { kw: "ocean wave",        modifier: "wallpaper", variant: "Aesthetic" },
      { kw: "nature hd",         modifier: "wallpaper", variant: "Free Download" },
      { kw: "forest morning",    modifier: "wallpaper", variant: "4K" },
      { kw: "waterfall nature",  modifier: "wallpaper", variant: "HD" },
      { kw: "cherry blossom",    modifier: "wallpaper", variant: "4K" },
      { kw: "green landscape",   modifier: "wallpaper", variant: "Desktop" },
      { kw: "sunrise mountains", modifier: "wallpaper", variant: "HD" },
      { kw: "autumn forest",     modifier: "wallpaper", variant: "Aesthetic" }
    ]
  },
  {
    slug: "anime", label: "Anime", icon: "◈",
    color: "#120a1a",
    accent: "#c084fc",
    description: "Anime wallpapers from iconic series and original art, in HD and 4K for desktop and mobile.",
    seoIntro: "Anime wallpapers have become one of the most searched wallpaper categories globally. From iconic shounen battle scenes to tranquil slice-of-life artwork, our anime collection features thousands of free wallpapers for personalising any device.",
    keywords: [
      { kw: "anime sky",         modifier: "wallpaper", variant: "4K" },
      { kw: "anime aesthetic",   modifier: "wallpaper", variant: "Phone" },
      { kw: "anime landscape",   modifier: "wallpaper", variant: "Desktop" },
      { kw: "dark anime",        modifier: "wallpaper", variant: "4K" },
      { kw: "anime city night",  modifier: "wallpaper", variant: "Aesthetic" },
      { kw: "anime flowers",     modifier: "wallpaper", variant: "HD" },
      { kw: "anime wolf",        modifier: "wallpaper", variant: "4K" },
      { kw: "anime space",       modifier: "wallpaper", variant: "Desktop" },
      { kw: "lo-fi anime",       modifier: "wallpaper", variant: "Chill" },
      { kw: "anime rain",        modifier: "wallpaper", variant: "Moody" }
    ]
  },
  {
    slug: "cars", label: "Cars", icon: "◎",
    color: "#0a0a1a",
    accent: "#f59e0b",
    description: "High-speed car wallpapers: supercars, JDM legends, sports cars, and luxury vehicles in 4K.",
    seoIntro: "Car wallpapers are the go-to choice for automotive enthusiasts. From raw JDM machines drifting through mountain passes to gleaming supercars parked at golden hour, our car wallpaper collection celebrates speed, engineering, and style in stunning HD and 4K resolution.",
    keywords: [
      { kw: "supercar",          modifier: "wallpaper", variant: "4K" },
      { kw: "JDM car",           modifier: "wallpaper", variant: "HD" },
      { kw: "sports car night",  modifier: "wallpaper", variant: "Neon" },
      { kw: "muscle car",        modifier: "wallpaper", variant: "4K" },
      { kw: "car drift",         modifier: "wallpaper", variant: "HD" },
      { kw: "luxury car",        modifier: "wallpaper", variant: "Aesthetic" },
      { kw: "classic car",       modifier: "wallpaper", variant: "Vintage" },
      { kw: "car sunset",        modifier: "wallpaper", variant: "Desktop" },
      { kw: "racing car",        modifier: "wallpaper", variant: "4K" },
      { kw: "electric car",      modifier: "wallpaper", variant: "Minimal" }
    ]
  },
  {
    slug: "space", label: "Space", icon: "◇",
    color: "#04040f",
    accent: "#38bdf8",
    description: "Breathtaking space wallpapers: galaxies, nebulae, planets, and cosmic phenomena in 4K.",
    seoIntro: "Space wallpapers transform your screen into a window to the cosmos. Our curated collection features breathtaking nebulae, spiral galaxies, planetary surfaces, and deep-field imagery — all available free in HD and 4K resolution.",
    keywords: [
      { kw: "space galaxy",      modifier: "wallpaper", variant: "4K" },
      { kw: "nebula",            modifier: "wallpaper", variant: "HD" },
      { kw: "planet earth",      modifier: "wallpaper", variant: "4K" },
      { kw: "milky way",         modifier: "wallpaper", variant: "Night Sky" },
      { kw: "black hole",        modifier: "wallpaper", variant: "4K" },
      { kw: "astronaut",         modifier: "wallpaper", variant: "Aesthetic" },
      { kw: "galaxy minimal",    modifier: "wallpaper", variant: "Dark" },
      { kw: "cosmic stars",      modifier: "wallpaper", variant: "HD" },
      { kw: "mars planet",       modifier: "wallpaper", variant: "4K" },
      { kw: "deep space",        modifier: "wallpaper", variant: "Desktop" }
    ]
  },
  {
    slug: "minimal", label: "Minimal", icon: "◻",
    color: "#08080f",
    accent: "#e2e8f0",
    description: "Clean minimal wallpapers with geometric shapes, gradients, and AMOLED blacks.",
    seoIntro: "Minimal wallpapers are perfect for professionals and designers who prefer a clean, focused desktop. Our minimalist collection features geometric patterns, solid gradients, abstract shapes, and monochrome designs that look stunning on any screen — from AMOLED phones to 4K monitors.",
    keywords: [
      { kw: "minimal black",      modifier: "wallpaper", variant: "AMOLED" },
      { kw: "minimal geometric",  modifier: "wallpaper", variant: "4K" },
      { kw: "clean white",        modifier: "wallpaper", variant: "Desktop" },
      { kw: "gradient minimal",   modifier: "wallpaper", variant: "HD" },
      { kw: "abstract lines",     modifier: "wallpaper", variant: "4K" },
      { kw: "flat color",         modifier: "wallpaper", variant: "Phone" },
      { kw: "pastel minimal",     modifier: "wallpaper", variant: "Aesthetic" },
      { kw: "dark minimal",       modifier: "wallpaper", variant: "AMOLED" },
      { kw: "minimal typography", modifier: "wallpaper", variant: "Desktop" },
      { kw: "solid black",        modifier: "wallpaper", variant: "4K" }
    ]
  },
  {
    slug: "aesthetic", label: "Aesthetic", icon: "◉",
    color: "#0f0814",
    accent: "#f9a8d4",
    description: "Aesthetic wallpapers with lo-fi vibes, neon cityscapes, sunset tones, and cottagecore moods.",
    seoIntro: "Aesthetic wallpapers are defined by mood and atmosphere. Whether you love the warm glow of a lo-fi sunset, the cool neon of a cyberpunk city, dreamy cottagecore pastels, or the dark romance of moody skies — our aesthetic wallpaper collection captures every visual mood in stunning quality.",
    keywords: [
      { kw: "sunset aesthetic",  modifier: "wallpaper", variant: "4K" },
      { kw: "neon city",         modifier: "wallpaper", variant: "Cyberpunk" },
      { kw: "lo-fi aesthetic",   modifier: "wallpaper", variant: "Chill" },
      { kw: "cottagecore",       modifier: "wallpaper", variant: "Aesthetic" },
      { kw: "dark aesthetic",    modifier: "wallpaper", variant: "Phone" },
      { kw: "pink aesthetic",    modifier: "wallpaper", variant: "HD" },
      { kw: "purple aesthetic",  modifier: "wallpaper", variant: "4K" },
      { kw: "vintage aesthetic", modifier: "wallpaper", variant: "Retro" },
      { kw: "city lights",       modifier: "wallpaper", variant: "Night" },
      { kw: "foggy aesthetic",   modifier: "wallpaper", variant: "Moody" }
    ]
  }
];

// ─────────────────────────────────────────
// CONTENT VARIATION ENGINE
// Prevents thin content / Panda penalties
// ─────────────────────────────────────────
const CONTENT_LIBRARY = {
  nature: {
    intros: [
      kw => `${kw.charAt(0).toUpperCase()+kw.slice(1)} wallpapers bring the raw beauty of the natural world directly to your screen. Nature photography has an unmatched ability to transport you — whether you're at a desk in a city apartment or glancing at your phone between meetings.`,
      kw => `Few things transform a workspace quite like a stunning ${kw} background. This high-resolution image was curated from thousands of landscape photographs to deliver maximum visual impact on any display.`,
      kw => `There's a reason ${kw} imagery remains among the most downloaded wallpaper categories globally. The organic shapes, natural palettes, and sense of scale create an immediate psychological effect — reducing stress and restoring focus.`,
    ],
    extras: [
      "Pair with a minimal icon pack for a clean, nature-inspired desktop setup that feels both calm and intentional.",
      "This image works beautifully as a dual-monitor panoramic background when extended across displays.",
      "The colour temperature of this image makes it particularly striking on OLED and AMOLED screens.",
    ]
  },
  anime: {
    intros: [
      kw => `${kw.charAt(0).toUpperCase()+kw.slice(1)} wallpapers represent the extraordinary craft of anime illustration — from precise linework to layered colour gradients that make this art form so globally beloved.`,
      kw => `Anime art has evolved into one of the most visually rich and emotionally expressive art forms of the modern era. This ${kw} wallpaper captures that essence with bold composition and distinctive visual style.`,
      kw => `Whether you're a fan of action-packed shonen or tranquil slice-of-life, ${kw} wallpapers let you carry that emotional connection with the visual universe you love.`,
    ],
    extras: [
      "Works especially well as an iPhone lock screen where the vertical composition shines.",
      "The bold colour palette of this image pops on high-refresh-rate AMOLED displays.",
      "Anime wallpapers are among the most shared on social platforms — this design is built for that.",
    ]
  },
  cars: {
    intros: [
      kw => `${kw.charAt(0).toUpperCase()+kw.slice(1)} wallpapers do more than show a vehicle — they capture the relationship between machine and road, engineering ambition and raw speed, in a single frame.`,
      kw => `This ${kw} wallpaper captures the engineering artistry, power, and design beauty that makes car culture such a passionate global community.`,
      kw => `Great automotive photography tells a story. This ${kw} wallpaper delivers that experience at full 4K resolution, whether you're a gearhead or simply love the aesthetic of a well-composed car shot.`,
    ],
    extras: [
      "Particularly striking on ultrawide monitors where the horizontal composition extends naturally.",
      "Works well as a lock screen background — the dark tones reduce battery drain on AMOLED displays.",
      "Pair with a dark system theme for a cohesive, dramatic desktop aesthetic.",
    ]
  },
  space: {
    intros: [
      kw => `${kw.charAt(0).toUpperCase()+kw.slice(1)} wallpapers capture something no other photography can — the humbling scale of the universe combined with the sheer visual spectacle of cosmic phenomena.`,
      kw => `The cosmos has fascinated humanity since the first stargazers looked up and wondered. This ${kw} wallpaper brings that infinite beauty directly to your device at full 4K resolution.`,
      kw => `With modern deep-field imaging and telescope technology, we can now see corners of the universe invisible to previous generations. This ${kw} wallpaper represents that frontier.`,
    ],
    extras: [
      "The deep blacks in this image make it ideal for AMOLED displays, where pure black pixels consume no power.",
      "Extended across a dual-monitor setup, space wallpapers create an immersive, almost cinematic desktop environment.",
      "The scale and depth of this image are best appreciated on a 4K display where every star cluster is visible.",
    ]
  },
  minimal: {
    intros: [
      kw => `${kw.charAt(0).toUpperCase()+kw.slice(1)} wallpapers are not about emptiness — they are about clarity and intention. This design strips away distraction so your icons and widgets breathe.`,
      kw => `The psychology of minimalist design is well-documented: less visual noise means fewer cognitive interruptions. This ${kw} wallpaper creates a clean, focused digital environment by design.`,
      kw => `Minimal wallpapers are perennially popular among designers and developers who spend long hours at screens. This ${kw} design provides visual rest while keeping your setup polished and professional.`,
    ],
    extras: [
      "On AMOLED screens, minimal black wallpapers save significant battery life compared to bright alternatives.",
      "Particularly effective when paired with a matching minimal icon set for a truly cohesive home screen.",
      "The geometric precision of this design scales perfectly across any resolution from HD to 8K.",
    ]
  },
  aesthetic: {
    intros: [
      kw => `${kw.charAt(0).toUpperCase()+kw.slice(1)} wallpapers are defined by mood and atmosphere. This image was selected specifically for its ability to evoke a distinct emotional response — that quality that makes you stop and look.`,
      kw => `The aesthetic wallpaper movement grew from a desire to make personal devices truly personal. This ${kw} image speaks to a specific visual language — one that resonates with mood, era, and style simultaneously.`,
      kw => `Setting a ${kw} wallpaper is one of the simplest ways to personalise your digital space. It signals your taste and personality every time you look at your device.`,
    ],
    extras: [
      "The warm colour palette of this image is particularly effective as a lock screen on dark-themed systems.",
      "The composition is intentionally designed for vertical displays — making it ideal for phone wallpapers.",
      "This aesthetic pairs exceptionally well with widget customisation apps for a fully cohesive home screen.",
    ]
  }
};

// ─────────────────────────────────────────
// TITLE TEMPLATES — CTR optimised
// ─────────────────────────────────────────
const TITLE_TEMPLATES = {
  nature:    [
    (kw, v) => `${kw} Wallpaper ${v} — Free HD 4K Download | Faynx`,
    (kw, v) => `Best ${kw} Backgrounds ${v} — Free & No Watermark | Faynx`,
    (kw, v) => `${kw} Wallpaper — Free ${v} Download | Faynx`,
  ],
  anime:     [
    (kw, v) => `${kw} Wallpaper ${v} — Free Anime Backgrounds | Faynx`,
    (kw, v) => `Free ${kw} HD Wallpaper ${v} — No Watermark | Faynx`,
  ],
  cars:      [
    (kw, v) => `${kw} Wallpaper ${v} — Free Automotive Backgrounds | Faynx`,
    (kw, v) => `${kw} HD Wallpaper — Free ${v} Download | Faynx`,
  ],
  space:     [
    (kw, v) => `${kw} Wallpaper ${v} — Free Space Backgrounds 4K | Faynx`,
    (kw, v) => `Free ${kw} Wallpaper ${v} — HD & 4K | Faynx`,
  ],
  minimal:   [
    (kw, v) => `${kw} Wallpaper ${v} — Free Minimal Backgrounds | Faynx`,
    (kw, v) => `${kw} Desktop Wallpaper ${v} — Free Download | Faynx`,
  ],
  aesthetic: [
    (kw, v) => `${kw} Wallpaper ${v} — Free Aesthetic Backgrounds | Faynx`,
    (kw, v) => `Free ${kw} Wallpaper ${v} — No Watermark | Faynx`,
  ],
};

const META_TEMPLATES = {
  default: (kw, v) =>
    `Download free ${kw} wallpaper in ${v} — HD, 2K and 4K. No watermarks, no sign-up. Works on desktop, iPhone & Android. 1000+ curated wallpapers on Faynx.`,
};

// ─────────────────────────────────────────
// BUILD ALL SLUGS WITH DEDUPLICATION
// ─────────────────────────────────────────
let allPages = [];
const seenKeys = new Set();

CLUSTERS.forEach(cluster => {
  cluster.keywords.forEach((kwObj) => {
    // Dedup: normalise keyword to prevent near-identical pages
    const norm = kwObj.kw.toLowerCase()
      .replace(/\b(wallpaper|hd|4k|free|download)\b/g, "")
      .trim().split(" ").sort().join("-");

    for (let i = 1; i <= 16; i++) {
      const dedupKey = `${norm}-${slugify(kwObj.variant)}-${i}`;
      if (seenKeys.has(dedupKey)) { console.warn(`DUPE skipped: ${dedupKey}`); continue; }
      seenKeys.add(dedupKey);

      const suffix = `${slugify(kwObj.kw)}-${kwObj.variant.toLowerCase().replace(/\s+/g,"-")}-${i}`;
      allPages.push({
        slug:         suffix,
        keyword:      kwObj.kw,
        modifier:     kwObj.modifier,
        variant:      kwObj.variant,
        cluster:      cluster.slug,
        clusterObj:   cluster,
        clusterLabel: cluster.label,
        fullKeyword:  `${kwObj.kw} ${kwObj.modifier}`,
        index:        allPages.length
      });
    }
  });
});

// ─────────────────────────────────────────
// RELATED WALLPAPERS ENGINE
// Scored by cluster match + keyword overlap
// ─────────────────────────────────────────
function getRelated(item, count = 6) {
  const kwTokens = item.keyword.split(" ");
  return allPages
    .filter(p => p.slug !== item.slug)
    .map(p => ({
      ...p,
      score: (p.cluster === item.cluster ? 3 : 0) +
             p.keyword.split(" ").filter(t => kwTokens.includes(t)).length
    }))
    .sort((a, b) => b.score - a.score)
    .filter((p, i, arr) => {
      // Deduplicate by keyword in results
      return arr.findIndex(x => x.keyword === p.keyword) === i;
    })
    .slice(0, count);
}

// ─────────────────────────────────────────
// DESIGN TOKENS — shared CSS (new aesthetic)
// ─────────────────────────────────────────
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --ink:    #06060a;
    --ink2:   #0d0d14;
    --ink3:   #151520;
    --ink4:   #1e1e2c;
    --rule:   rgba(255,255,255,0.06);
    --rule2:  rgba(255,255,255,0.11);
    --snow:   #f0f0f8;
    --mist:   #8888a4;
    --fog:    #44445a;
    --gold:   #c9a96e;
    --gold2:  #e8c98a;
    --gold-glow: rgba(201,169,110,0.18);
    --r:      10px;
    --r-lg:   16px;
    --r-xl:   22px;
    --shadow: 0 8px 40px rgba(0,0,0,.7);
    /* aliases */
    --bg: var(--ink); --bg2: var(--ink2); --bg3: var(--ink3); --bg4: var(--ink4);
    --text: var(--snow); --text2: var(--mist); --text3: var(--fog);
    --accent: var(--gold); --accent2: var(--gold2); --border: var(--rule); --border2: var(--rule2);
  }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { font-family:'DM Sans',system-ui,sans-serif; background:var(--ink); color:var(--snow); line-height:1.6; }
  a { color:inherit; text-decoration:none; }
  img { display:block; max-width:100%; }

  /* Header */
  .site-header { background:rgba(6,6,10,.92); backdrop-filter:blur(24px); border-bottom:1px solid var(--rule); padding:0 24px; position:sticky; top:0; z-index:100; }
  .header-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; gap:20px; height:56px; }
  .site-logo { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600; letter-spacing:.2em; color:var(--gold); text-transform:uppercase; }
  .header-nav { display:flex; gap:20px; margin-left:auto; }
  .header-nav a { font-size:11px; color:var(--mist); letter-spacing:.08em; text-transform:uppercase; transition:color .15s; font-weight:400; }
  .header-nav a:hover { color:var(--snow); }
  .header-cta { padding:6px 16px; border-radius:999px; background:var(--gold); color:var(--ink); font-size:11px; font-weight:600; font-family:'DM Sans',sans-serif; letter-spacing:.06em; transition:background .15s; }
  .header-cta:hover { background:var(--gold2); }

  /* Breadcrumb */
  .breadcrumb { padding:12px 0; font-size:11px; color:var(--mist); display:flex; gap:6px; align-items:center; flex-wrap:wrap; letter-spacing:.04em; font-family:'DM Sans',sans-serif; }
  .breadcrumb a { color:var(--mist); transition:color .12s; }
  .breadcrumb a:hover { color:var(--gold); }
  .breadcrumb span { color:var(--fog); }

  /* Footer */
  .site-footer { background:var(--ink2); border-top:1px solid var(--rule); padding:48px 24px 28px; margin-top:60px; }
  .footer-inner { max-width:1200px; margin:0 auto; }
  .footer-top { display:grid; grid-template-columns:1.8fr 1fr 1fr 1fr; gap:48px; margin-bottom:40px; }
  .footer-wordmark { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:600; letter-spacing:.2em; color:var(--gold); display:block; margin-bottom:12px; text-transform:uppercase; }
  .footer-brand p { font-size:13px; color:var(--mist); line-height:1.7; max-width:260px; font-weight:300; }
  .footer-col h4 { font-size:10px; font-weight:500; color:var(--fog); text-transform:uppercase; letter-spacing:.15em; margin-bottom:14px; font-family:'DM Sans',sans-serif; }
  .footer-col a { display:block; font-size:13px; color:var(--mist); margin-bottom:8px; transition:color .12s; font-weight:300; }
  .footer-col a:hover { color:var(--gold); }
  .footer-bottom { border-top:1px solid var(--rule); padding-top:20px; display:flex; align-items:center; justify-content:space-between; font-size:11px; color:var(--fog); flex-wrap:wrap; gap:10px; letter-spacing:.04em; }
  .footer-bottom a { color:var(--fog); transition:color .12s; }
  .footer-bottom a:hover { color:var(--mist); }

  /* Buttons */
  .btn { display:inline-flex; align-items:center; gap:8px; padding:11px 22px; border-radius:999px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all .15s; text-decoration:none; font-family:'DM Sans',sans-serif; letter-spacing:.04em; }
  .btn-gold { background:var(--gold); color:var(--ink); }
  .btn-gold:hover { background:var(--gold2); transform:translateY(-1px); }
  .btn-outline { background:transparent; border:1px solid var(--rule2); color:var(--mist); }
  .btn-outline:hover { border-color:var(--gold); color:var(--gold); }

  /* Tags */
  .tag { display:inline-block; padding:4px 11px; border-radius:999px; font-size:11px; background:var(--ink3); border:1px solid var(--rule); color:var(--mist); font-family:'DM Sans',sans-serif; letter-spacing:.04em; }
  .tag-link { cursor:pointer; transition:all .12s; }
  .tag-link:hover { border-color:var(--gold); color:var(--gold); background:rgba(201,169,110,.07); }

  /* Wall cards */
  .wall-card { border-radius:var(--r-lg); overflow:hidden; position:relative; background:var(--ink3); transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; display:block; border:1px solid var(--rule); }
  .wall-card:hover { transform:translateY(-6px) scale(1.01); box-shadow:0 24px 56px rgba(0,0,0,.8); border-color:var(--gold); }
  .wall-card img { width:100%; height:100%; object-fit:cover; display:block; transition:opacity .3s; }
  .wall-card-info { padding:10px 13px; }
  .wall-card-title { font-size:13px; font-weight:400; color:var(--snow); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:3px; font-family:'DM Sans',sans-serif; }
  .wall-card-meta { font-size:11px; color:var(--mist); letter-spacing:.04em; font-family:'DM Sans',sans-serif; }

  /* Grids */
  .wall-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
  .wall-grid-lg { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }

  @media(max-width:768px) {
    .wall-grid,.wall-grid-lg { grid-template-columns:repeat(2,1fr); gap:8px; }
    .footer-top { grid-template-columns:1fr 1fr; gap:24px; }
    .header-nav { display:none; }
  }
  @media(max-width:480px) { .wall-grid,.wall-grid-lg { grid-template-columns:repeat(2,1fr); gap:6px; } }
`;

// ─────────────────────────────────────────
// HEADER + FOOTER HTML
// ─────────────────────────────────────────
function headerHTML() {
  return `
<header class="site-header" role="banner">
  <div class="header-inner">
    <a href="/" class="site-logo">FAYNX</a>
    <nav class="header-nav" aria-label="Navigation">
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

function footerHTML() {
  return `
<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="footer-wordmark">FAYNX</span>
        <p>Free HD &amp; 4K wallpapers for every screen. Curated daily, no watermarks, instant download.</p>
      </div>
      <div class="footer-col">
        <h4>Categories</h4>
        <a href="/category/nature.html">Nature</a>
        <a href="/category/anime.html">Anime</a>
        <a href="/category/cars.html">Cars</a>
        <a href="/category/space.html">Space</a>
        <a href="/category/minimal.html">Minimal</a>
        <a href="/category/aesthetic.html">Aesthetic</a>
      </div>
      <div class="footer-col">
        <h4>Popular</h4>
        <a href="/category/nature.html">Dark Forest</a>
        <a href="/category/space.html">Galaxy 4K</a>
        <a href="/category/aesthetic.html">Neon City</a>
        <a href="/category/minimal.html">AMOLED Black</a>
        <a href="/category/anime.html">Anime Sky</a>
      </div>
      <div class="footer-col">
        <h4>Faynx</h4>
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
        <a href="/privacy-policy.html">Privacy</a>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; ${new Date().getFullYear()} Faynx &middot; Photos via <a href="https://unsplash.com?utm_source=faynx&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a></span>
      <span><a href="/privacy-policy.html">Privacy</a> &middot; <a href="/contact.html">Contact</a> &middot; <a href="/sitemap.xml">Sitemap</a></span>
    </div>
  </div>
</footer>`;
}

// ═══════════════════════════════════════════════════════════════
// 1. WALLPAPER PAGE
// ═══════════════════════════════════════════════════════════════
function generateWallpaperPage(item) {
  const { slug, keyword, variant, cluster, clusterObj, clusterLabel, index } = item;

  // Content variation — deterministic, reproducible
  const lib      = CONTENT_LIBRARY[cluster] || CONTENT_LIBRARY.nature;
  const introIdx = hashCode(slug)          % lib.intros.length;
  const extraIdx = hashCode(slug + "extra") % lib.extras.length;
  const intro    = lib.intros[introIdx](keyword);
  const extra    = lib.extras[extraIdx];

  // Title & meta variation
  const tmpl     = TITLE_TEMPLATES[cluster] || TITLE_TEMPLATES.nature;
  const titleIdx = hashCode(slug + "title") % tmpl.length;
  const title    = tmpl[titleIdx](keyword.charAt(0).toUpperCase()+keyword.slice(1), variant);
  const metaDesc = META_TEMPLATES.default(keyword, variant);

  // Images — WebP via Imgix params
  const mainImg  = imgUrl(keyword, 1920, 1080);
  const mdImg    = imgUrl(keyword, 1280, 720);
  const smImg    = imgUrl(keyword, 640, 360);
  const portImg  = imgUrl(keyword, 1080, 1920);
  const ogImg    = ogUrl(keyword);

  // Related
  const related  = getRelated(item, 6);

  // Tags
  const tags = [
    keyword, `${keyword} wallpaper`, `${keyword} hd`, `${keyword} 4k`,
    `${variant.toLowerCase()} wallpaper`, `free ${keyword}`,
    `${clusterLabel.toLowerCase()} wallpaper`, "hd wallpaper", "4k wallpaper", "free wallpaper"
  ];

  // JSON-LD — ImageObject + BreadcrumbList + WebPage
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ImageObject",
        "@id": `${BASE_URL}/wallpaper/${slug}.html#image`,
        "name": `${keyword} Wallpaper ${variant}`,
        "description": `${intro.substring(0,200)}`,
        "contentUrl": mainImg,
        "thumbnailUrl": thumbUrl(keyword),
        "encodingFormat": "image/webp",
        "width": "1920", "height": "1080",
        "license": "https://unsplash.com/license",
        "acquireLicensePage": `${BASE_URL}/wallpaper/${slug}.html`,
        "creditText": "Unsplash",
        "creator": { "@type": "Organization", "name": "Unsplash", "url": "https://unsplash.com" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type":"ListItem","position":1,"name":"Home","item":BASE_URL },
          { "@type":"ListItem","position":2,"name":`${clusterLabel} Wallpapers`,"item":`${BASE_URL}/category/${cluster}.html` },
          { "@type":"ListItem","position":3,"name":`${keyword} Wallpaper`,"item":`${BASE_URL}/wallpaper/${slug}.html` }
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${BASE_URL}/wallpaper/${slug}.html`,
        "name": title,
        "url": `${BASE_URL}/wallpaper/${slug}.html`,
        "description": metaDesc,
        "dateModified": TODAY,
        "isPartOf": { "@type":"WebSite","url":BASE_URL,"name":SITE_NAME },
        "primaryImageOfPage": { "@id":`${BASE_URL}/wallpaper/${slug}.html#image` }
      }
    ]
  };

  const relatedHTML = related.map(r => `
    <a href="/wallpaper/${r.slug}.html" class="wall-card" style="aspect-ratio:4/3" aria-label="${r.keyword} wallpaper">
      <img src="${thumbUrl(r.keyword)}" alt="${r.keyword} ${r.variant} wallpaper — free download" loading="lazy" width="300" height="225"/>
      <div class="wall-card-info">
        <div class="wall-card-title">${r.keyword.charAt(0).toUpperCase()+r.keyword.slice(1)}</div>
        <div class="wall-card-meta">${r.variant} &middot; Free</div>
      </div>
    </a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <meta name="description" content="${metaDesc}"/>
  <meta name="keywords" content="${tags.join(", ")}"/>
  <link rel="canonical" href="${BASE_URL}/wallpaper/${slug}.html"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${metaDesc}"/>
  <meta property="og:image" content="${ogImg}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${BASE_URL}/wallpaper/${slug}.html"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:image" content="${ogImg}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="icon" href="/icons/icon-192.png"/>
  <script type="application/ld+json">${JSON.stringify(schema,null,2)}</script>
  <style>
    ${SHARED_CSS}

    .hero-wrap { position:relative; border-radius:var(--r-xl); overflow:hidden; background:var(--ink4); }
    .hero-img { width:100%; height:auto; display:block; max-height:600px; object-fit:cover; }
    .hero-grad { position:absolute; inset:0; background:linear-gradient(to top,rgba(6,6,10,.88) 0%,transparent 55%); pointer-events:none; }
    .hero-actions { position:absolute; bottom:20px; left:0; right:0; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; z-index:2; }

    .main-layout { display:grid; grid-template-columns:1fr 300px; gap:28px; max-width:1200px; margin:0 auto; padding:20px 24px 0; align-items:start; }
    .content-col { min-width:0; }
    .sidebar { position:sticky; top:72px; }

    .wall-title { font-family:'Cormorant Garamond',serif; font-size:clamp(24px,4vw,38px); font-weight:400; font-style:italic; line-height:1.1; margin-bottom:8px; color:var(--snow); }
    .wall-sub { font-size:14px; color:var(--mist); margin-bottom:18px; font-weight:300; }

    .meta-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
    .meta-pill { padding:4px 12px; border-radius:999px; font-size:11px; font-weight:400; background:var(--ink3); border:1px solid var(--rule); color:var(--mist); letter-spacing:.04em; font-family:'DM Sans',sans-serif; }
    .meta-pill.hl { background:rgba(201,169,110,.1); border-color:rgba(201,169,110,.25); color:var(--gold); }

    .dl-card { background:var(--ink2); border:1px solid var(--rule); border-radius:var(--r-lg); padding:18px; margin-bottom:14px; }
    .dl-card h3 { font-size:9px; font-weight:500; color:var(--fog); text-transform:uppercase; letter-spacing:.16em; margin-bottom:12px; font-family:'DM Sans',sans-serif; }
    .size-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:12px; }
    .size-btn { padding:8px 10px; border-radius:var(--r); border:1px solid var(--rule); background:var(--ink3); color:var(--mist); font-size:12px; cursor:pointer; transition:all .15s; text-align:center; display:block; font-family:'DM Sans',sans-serif; }
    .size-btn:hover { border-color:var(--gold); color:var(--gold); background:rgba(201,169,110,.06); }
    .size-btn strong { display:block; font-size:13px; font-weight:500; color:var(--snow); margin-bottom:2px; }
    .size-btn span { font-size:10px; color:var(--fog); }

    .specs-table { width:100%; font-size:12px; border-collapse:collapse; }
    .specs-table tr { border-bottom:1px solid var(--rule); }
    .specs-table tr:last-child { border-bottom:none; }
    .specs-table td { padding:9px 0; }
    .specs-table td:first-child { color:var(--mist); width:130px; font-weight:300; }
    .specs-table td:last-child { font-weight:400; color:var(--snow); }

    .content-h2 { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:400; font-style:italic; color:var(--snow); margin:32px 0 12px; display:flex; align-items:center; gap:10px; }
    .content-h2::after { content:''; flex:1; height:1px; background:var(--rule); }
    .content-p { font-size:13px; color:var(--mist); line-height:1.82; margin-bottom:12px; font-weight:300; }

    .related-wrap { max-width:1200px; margin:40px auto 0; padding:0 24px 56px; }
    .section-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .section-hd h2 { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:400; font-style:italic; color:var(--mist); }
    .section-hd a { font-size:11px; color:var(--gold); letter-spacing:.06em; }

    .attribution-note { font-size:11px; color:var(--fog); text-align:center; padding:20px 0 0; font-family:'DM Sans',sans-serif; letter-spacing:.04em; }
    .attribution-note a { color:var(--gold); }

    @media(max-width:860px) { .main-layout { grid-template-columns:1fr; } .sidebar { position:static; } }
  </style>
</head>
<body>

${headerHTML()}

<div style="max-width:1200px;margin:0 auto;padding:0 24px">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/">Home</a><span>›</span>
    <a href="/category/${cluster}.html">${clusterLabel}</a><span>›</span>
    <span>${keyword}</span>
  </nav>
</div>

<div class="main-layout">
  <div class="content-col">
    <!-- Hero image -->
    <div class="hero-wrap">
      <picture>
        <source srcset="${smImg}" media="(max-width:640px)" width="640" height="360"/>
        <source srcset="${mdImg}" media="(max-width:1280px)" width="1280" height="720"/>
        <img class="hero-img" src="${mainImg}"
          alt="${keyword} wallpaper ${variant} — free HD 4K download on Faynx"
          width="1920" height="1080" loading="eager" fetchpriority="high"/>
      </picture>
      <div class="hero-grad"></div>
      <div class="hero-actions">
        <a href="${mainImg}" download="faynx-${slug}-1080p.webp" class="btn btn-gold" rel="nofollow">
          ↓ Download HD Free
        </a>
        <a href="${portImg}" download="faynx-${slug}-mobile.webp" class="btn btn-outline" style="background:rgba(0,0,0,.55);backdrop-filter:blur(8px);color:#fff;border-color:rgba(255,255,255,.18)" rel="nofollow">
          Phone Version
        </a>
      </div>
    </div>

    <!-- Title + meta -->
    <div style="margin-top:22px">
      <h1 class="wall-title">${keyword.charAt(0).toUpperCase()+keyword.slice(1)} Wallpaper — <em>${variant}</em></h1>
      <p class="wall-sub">Free HD &amp; 4K ${keyword} background for desktop, iPhone, and Android. No watermarks. No sign-up.</p>
      <div class="meta-row">
        <span class="meta-pill hl">${variant}</span>
        <span class="meta-pill">${clusterLabel}</span>
        <span class="meta-pill">Free Download</span>
        <span class="meta-pill">No Watermark</span>
        <span class="meta-pill">4K Available</span>
      </div>

      <h2 class="content-h2">About This Wallpaper</h2>
      <p class="content-p">${intro}</p>
      <p class="content-p">This <strong>${keyword} wallpaper</strong> is available in multiple resolutions — Full HD (1920×1080), QHD (2560×1440), 4K UHD (3840×2160), and mobile portrait (1080×1920). All versions are free to download with no watermarks or attribution required.</p>
      <p class="content-p">${extra}</p>

      <h2 class="content-h2">How to Set as Wallpaper</h2>
      <p class="content-p"><strong style="color:var(--snow)">Windows:</strong> Right-click the downloaded image → "Set as desktop background." Choose "Fill" or "Fit" as the display mode for best results.</p>
      <p class="content-p"><strong style="color:var(--snow)">macOS:</strong> Right-click → "Set Desktop Picture," or open System Settings → Wallpaper and drag the image in.</p>
      <p class="content-p"><strong style="color:var(--snow)">iPhone:</strong> Save to Photos → open → tap Share → "Use as Wallpaper" → choose Lock Screen, Home Screen, or both.</p>
      <p class="content-p"><strong style="color:var(--snow)">Android:</strong> Long-press home screen → Wallpapers → select the downloaded image, then crop and position.</p>

      <h2 class="content-h2">Tags</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:24px">
        ${tags.map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
    </div>
  </div>

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="dl-card">
      <h3>Download Resolutions</h3>
      <div class="size-grid">
        <a href="${imgUrl(keyword,1920,1080)}" download="faynx-${slug}-1080p.webp" class="size-btn" rel="nofollow">
          <strong>1920×1080</strong><span>Full HD</span>
        </a>
        <a href="${imgUrl(keyword,2560,1440)}" download="faynx-${slug}-1440p.webp" class="size-btn" rel="nofollow">
          <strong>2560×1440</strong><span>QHD</span>
        </a>
        <a href="${imgUrl(keyword,3840,2160)}" download="faynx-${slug}-4k.webp" class="size-btn" rel="nofollow">
          <strong>3840×2160</strong><span>4K UHD</span>
        </a>
        <a href="${imgUrl(keyword,1080,1920)}" download="faynx-${slug}-mobile.webp" class="size-btn" rel="nofollow">
          <strong>1080×1920</strong><span>Mobile</span>
        </a>
        <a href="${imgUrl(keyword,1170,2532)}" download="faynx-${slug}-iphone.webp" class="size-btn" rel="nofollow">
          <strong>1170×2532</strong><span>iPhone Pro</span>
        </a>
        <a href="${imgUrl(keyword,1440,3040)}" download="faynx-${slug}-android.webp" class="size-btn" rel="nofollow">
          <strong>1440×3040</strong><span>Android HD</span>
        </a>
      </div>
      <a href="${mainImg}" download="faynx-${slug}-original.webp" class="btn btn-gold" style="width:100%;justify-content:center" rel="nofollow">
        ↓ Download Free
      </a>
    </div>

    <div class="dl-card">
      <h3>Image Details</h3>
      <table class="specs-table">
        <tr><td>Category</td><td>${clusterLabel}</td></tr>
        <tr><td>Style</td><td>${variant}</td></tr>
        <tr><td>Max Resolution</td><td>4K UHD</td></tr>
        <tr><td>Format</td><td>WebP / JPEG</td></tr>
        <tr><td>License</td><td>Free · Unsplash</td></tr>
        <tr><td>Watermark</td><td>None</td></tr>
      </table>
    </div>

    <div class="dl-card">
      <h3>Browse Category</h3>
      <p style="font-size:12px;color:var(--mist);margin-bottom:12px;font-weight:300">Explore more ${clusterLabel.toLowerCase()} wallpapers in our collection.</p>
      <a href="/category/${cluster}.html" class="btn btn-gold" style="width:100%;justify-content:center">
        All ${clusterLabel} →
      </a>
    </div>

    <p class="attribution-note">Photos sourced from <a href="https://unsplash.com?utm_source=faynx&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a></p>
  </aside>
</div>

<!-- Related -->
<section class="related-wrap" aria-label="Related wallpapers">
  <div class="section-hd">
    <h2>More ${clusterLabel} Wallpapers</h2>
    <a href="/category/${cluster}.html">View all →</a>
  </div>
  <div class="wall-grid-lg">${relatedHTML}</div>
</section>

${footerHTML()}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// 2. CATEGORY PAGE
// ═══════════════════════════════════════════════════════════════
function generateCategoryPage(cluster) {
  const pages    = allPages.filter(p => p.cluster === cluster.slug);
  const firstPage = pages.slice(0, 48);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "name": `${cluster.label} Wallpapers — Free HD & 4K | Faynx`,
        "url": `${BASE_URL}/category/${cluster.slug}.html`,
        "description": cluster.description,
        "dateModified": TODAY,
        "isPartOf": { "@type":"WebSite","url":BASE_URL,"name":SITE_NAME }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type":"ListItem","position":1,"name":"Home","item":BASE_URL },
          { "@type":"ListItem","position":2,"name":`${cluster.label} Wallpapers`,"item":`${BASE_URL}/category/${cluster.slug}.html` }
        ]
      },
      {
        "@type": "ItemList",
        "name": `${cluster.label} Wallpapers`,
        "numberOfItems": pages.length,
        "itemListElement": firstPage.slice(0,10).map((p,i) => ({
          "@type":"ListItem","position":i+1,
          "url":`${BASE_URL}/wallpaper/${p.slug}.html`,
          "name":`${p.keyword} wallpaper ${p.variant}`
        }))
      }
    ]
  };

  const gridCards = firstPage.map(p => `
    <a href="/wallpaper/${p.slug}.html" class="wall-card" style="aspect-ratio:4/3" aria-label="${p.keyword} ${p.variant} wallpaper">
      <img src="${thumbUrl(p.keyword)}"
        alt="${p.keyword} ${p.variant} wallpaper — free HD download"
        loading="lazy" width="300" height="225"/>
      <div class="wall-card-info">
        <div class="wall-card-title">${p.keyword.charAt(0).toUpperCase()+p.keyword.slice(1)}</div>
        <div class="wall-card-meta">${p.variant} &middot; Free</div>
      </div>
    </a>`).join("");

  const crossLinks = CLUSTERS.filter(c => c.slug !== cluster.slug).map(c =>
    `<a href="/category/${c.slug}.html" class="tag tag-link">${c.icon} ${c.label}</a>`
  ).join("");

  const totalPages = Math.ceil(pages.length / 48);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${cluster.label} Wallpapers — Free HD & 4K Download | Faynx</title>
  <meta name="description" content="${cluster.description} Browse ${pages.length}+ free wallpapers. Instant download, no watermarks."/>
  <meta name="keywords" content="${cluster.label.toLowerCase()} wallpaper, ${cluster.label.toLowerCase()} wallpaper 4k, ${cluster.label.toLowerCase()} wallpaper hd, free ${cluster.label.toLowerCase()} wallpaper"/>
  <link rel="canonical" href="${BASE_URL}/category/${cluster.slug}.html"/>
  <meta property="og:title" content="${cluster.label} Wallpapers — Free HD & 4K | Faynx"/>
  <meta property="og:description" content="${cluster.description}"/>
  <meta property="og:image" content="${ogUrl(cluster.keywords[0].kw)}"/>
  <meta property="og:type" content="website"/>
  <link rel="icon" href="/icons/icon-192.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <script type="application/ld+json">${JSON.stringify(schema,null,2)}</script>
  <style>
    ${SHARED_CSS}

    .cat-hero { padding:56px 24px 40px; max-width:1200px; margin:0 auto; }
    .cat-eyebrow { font-size:10px; color:var(--gold); letter-spacing:.22em; text-transform:uppercase; margin-bottom:14px; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:8px; }
    .cat-eyebrow::before { content:''; width:24px; height:1px; background:var(--gold); flex-shrink:0; }
    .cat-title { font-family:'Cormorant Garamond',serif; font-size:clamp(32px,6vw,64px); font-weight:300; line-height:1.05; margin-bottom:14px; }
    .cat-title em { font-style:italic; color:var(--gold); }
    .cat-desc { font-size:15px; color:var(--mist); max-width:600px; line-height:1.75; margin-bottom:24px; font-weight:300; }
    .cat-stats { display:flex; gap:32px; flex-wrap:wrap; margin-bottom:28px; }
    .cat-stat strong { display:block; font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:600; color:var(--gold); }
    .cat-stat span { font-size:10px; color:var(--mist); text-transform:uppercase; letter-spacing:.12em; font-family:'DM Sans',sans-serif; }

    .filters-bar { overflow-x:auto; padding:12px 24px; background:var(--ink2); border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); scrollbar-width:none; }
    .filters-bar::-webkit-scrollbar { display:none; }
    .filters-track { display:flex; gap:6px; width:max-content; }
    .filter-pill { padding:5px 15px; border-radius:999px; border:1px solid var(--rule); background:transparent; color:var(--mist); font-size:11px; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; display:inline-block; }
    .filter-pill:hover,.filter-pill.active { background:var(--gold); border-color:var(--gold); color:var(--ink); }

    .gallery-wrap { max-width:1200px; margin:0 auto; padding:24px; }
    .gallery-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; font-size:12px; color:var(--mist); font-family:'DM Sans',sans-serif; }

    .pagination { display:flex; justify-content:center; gap:6px; margin-top:40px; flex-wrap:wrap; }
    .page-btn { width:36px; height:36px; border-radius:var(--r); border:1px solid var(--rule); background:transparent; color:var(--mist); font-size:12px; font-weight:400; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .12s; text-decoration:none; font-family:'DM Sans',sans-serif; }
    .page-btn:hover,.page-btn.active { background:var(--gold); border-color:var(--gold); color:var(--ink); }

    .seo-section { max-width:1200px; margin:0 auto; padding:0 24px 56px; border-top:1px solid var(--rule); margin-top:48px; }
    .seo-section h2 { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:400; font-style:italic; color:var(--mist); margin:32px 0 12px; }
    .seo-section p { font-size:13px; color:var(--fog); line-height:1.82; margin-bottom:10px; font-weight:300; }
    .cross-wrap { display:flex; flex-wrap:wrap; gap:7px; margin-top:16px; }

    @media(max-width:600px) { .cat-stats { gap:16px; } }
  </style>
</head>
<body>

${headerHTML()}

<div style="background:linear-gradient(160deg,${cluster.color} 0%,var(--ink) 60%)">
  <div class="cat-hero">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><span>${cluster.label} Wallpapers</span>
    </nav>
    <p class="cat-eyebrow">${cluster.icon} ${cluster.label}</p>
    <h1 class="cat-title"><em>${cluster.label}</em> Wallpapers<br/>HD &amp; 4K — Free</h1>
    <p class="cat-desc">${cluster.description}</p>
    <div class="cat-stats">
      <div class="cat-stat"><strong>${pages.length}+</strong><span>Wallpapers</span></div>
      <div class="cat-stat"><strong>4K</strong><span>Max Quality</span></div>
      <div class="cat-stat"><strong>Free</strong><span>No Watermark</span></div>
    </div>
  </div>
</div>

<div class="filters-bar" role="navigation" aria-label="Filter by style">
  <div class="filters-track">
    <a href="/category/${cluster.slug}.html" class="filter-pill active">All</a>
    ${cluster.keywords.map(k =>
      `<a href="/category/${cluster.slug}.html#${slugify(k.kw)}" class="filter-pill">${k.kw}</a>`
    ).join("")}
  </div>
</div>

<div class="gallery-wrap">
  <div class="gallery-meta">
    <span>Showing <strong style="color:var(--snow)">${firstPage.length}</strong> of <strong style="color:var(--snow)">${pages.length}</strong> ${cluster.label.toLowerCase()} wallpapers</span>
  </div>
  <div class="wall-grid">${gridCards}</div>

  <nav class="pagination" aria-label="Page navigation">
    <span class="page-btn active">1</span>
    ${Array.from({length:Math.min(totalPages-1,5)},(_,i) =>
      `<a href="/category/${cluster.slug}-page-${i+2}.html" class="page-btn">${i+2}</a>`
    ).join("")}
    ${totalPages>6?`<span class="page-btn" style="pointer-events:none">…</span><a href="/category/${cluster.slug}-page-${totalPages}.html" class="page-btn">${totalPages}</a>`:""}
  </nav>
</div>

<section class="seo-section" aria-label="About ${cluster.label} Wallpapers">
  <h2>About ${cluster.label} Wallpapers</h2>
  <p>${cluster.seoIntro}</p>
  <p>All wallpapers in this collection are available in Full HD (1920×1080), 2K (2560×1440), 4K UHD (3840×2160), and mobile portrait formats — delivered in WebP for the fastest possible load times. Every image is free to download with no watermarks or sign-up required.</p>
  <p>Our ${cluster.label.toLowerCase()} wallpaper collection is curated and updated regularly to ensure quality, variety, and visual impact across every device from desktop monitors to iPhone and Android lock screens.</p>
  <div class="cross-wrap">
    <span style="font-size:11px;color:var(--fog);align-self:center;letter-spacing:.08em;text-transform:uppercase;font-family:'DM Sans',sans-serif">Also explore</span>
    ${crossLinks}
  </div>
</section>

${footerHTML()}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// 3. IMAGE SITEMAP
// ═══════════════════════════════════════════════════════════════
function generateImageSitemap() {
  const entries = allPages.map(p => `  <url>
    <loc>${BASE_URL}/wallpaper/${p.slug}.html</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>0.7</priority>
    <image:image>
      <image:loc>${heroUrl(p.keyword)}</image:loc>
      <image:title>${p.keyword} wallpaper ${p.variant} — free HD 4K download</image:title>
      <image:caption>${p.keyword} ${p.variant} wallpaper — free HD and 4K download on Faynx. No watermarks.</image:caption>
      <image:license>https://unsplash.com/license</image:license>
    </image:image>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries}
</urlset>`;
}

// ═══════════════════════════════════════════════════════════════
// 4. MAIN SITEMAP INDEX
// ═══════════════════════════════════════════════════════════════
function generateSitemapIndex() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-main.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-images.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generateMainSitemap() {
  const urls = [
    { loc:`${BASE_URL}/`,                  priority:"1.0", changefreq:"daily" },
    { loc:`${BASE_URL}/about.html`,        priority:"0.5", changefreq:"monthly" },
    { loc:`${BASE_URL}/contact.html`,      priority:"0.4", changefreq:"monthly" },
    { loc:`${BASE_URL}/privacy-policy.html`, priority:"0.3", changefreq:"yearly" },
    ...CLUSTERS.map(c => ({ loc:`${BASE_URL}/category/${c.slug}.html`, priority:"0.9", changefreq:"weekly" })),
    ...allPages.map(p => ({ loc:`${BASE_URL}/wallpaper/${p.slug}.html`, priority:"0.7", changefreq:"monthly" }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u =>`  <url>
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
Disallow: /api/
Disallow: /*.json$

# Sitemap index
Sitemap: ${BASE_URL}/sitemap.xml
Host: ${BASE_URL}`;
}

// ═══════════════════════════════════════════════════════════════
// WRITE ALL FILES
// ═══════════════════════════════════════════════════════════════
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive:true });
}

console.log("🚀 Faynx SEO Engine v4 starting…\n");

ensureDir("wallpaper");
ensureDir("category");

// Wallpaper pages
console.log(`📄 Generating ${allPages.length} wallpaper pages…`);
allPages.forEach((item, i) => {
  fs.writeFileSync(`wallpaper/${item.slug}.html`, generateWallpaperPage(item));
  if ((i+1) % 100 === 0) process.stdout.write(`  ${i+1}/${allPages.length}\n`);
});
console.log(`  ✅ ${allPages.length} wallpaper pages written\n`);

// Category pages
console.log("📂 Generating category pages…");
CLUSTERS.forEach(cluster => {
  fs.writeFileSync(`category/${cluster.slug}.html`, generateCategoryPage(cluster));
  console.log(`  ✅ /category/${cluster.slug}.html`);
});
console.log();

// Sitemaps
console.log("🗺  Generating sitemaps…");
fs.writeFileSync("sitemap.xml",        generateSitemapIndex());
fs.writeFileSync("sitemap-main.xml",   generateMainSitemap());
fs.writeFileSync("sitemap-images.xml", generateImageSitemap());
console.log(`  ✅ sitemap.xml (index) + sitemap-main.xml + sitemap-images.xml\n`);

// Robots
fs.writeFileSync("robots.txt", generateRobots());
console.log("  ✅ robots.txt\n");

console.log("══════════════════════════════════════════");
console.log(`✅ ${allPages.length} wallpaper pages`);
console.log(`✅ ${CLUSTERS.length} category pages`);
console.log("✅ Sitemap index + image sitemap");
console.log("✅ robots.txt");
console.log("══════════════════════════════════════════");
