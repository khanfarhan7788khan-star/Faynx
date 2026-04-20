# Faynx — Free HD & 4K Wallpapers PWA

A fast, SEO-optimised PWA wallpaper app powered by the Unsplash API and Firebase.

## Features
- HD / 4K wallpaper browsing (Unsplash API)
- Full-text search with suggestions
- Topic categories (Nature, Anime, Cars, Space, Minimal, Aesthetic)
- Save favourites + collections (Firebase Firestore)
- Download history
- Sign In / Sign Up / Google Auth (Firebase Auth)
- Dark/light theme toggle
- PWA install + offline fallback
- Service worker caching

## SEO Pages (generated via `generate.js`)
- 960+ individual wallpaper pages with schema markup
- 6 category landing pages with image grids
- About, Contact, Privacy Policy trust pages
- `sitemap.xml` with priorities + lastmod
- `robots.txt`

## Setup

### 1. Install dependencies
```bash
npm install  # (no dependencies for generate.js — pure Node.js)
```

### 2. Run the generator
```bash
node generate.js
```
Outputs:
- `wallpaper/*.html` — 960 wallpaper pages
- `category/*.html` — 6 category pages  
- `about.html`, `contact.html`, `privacy-policy.html`
- `sitemap.xml`, `robots.txt`

### 3. Configure Firebase
Edit `app.js` line 14 with your Firebase project config.

### 4. Configure Unsplash
Edit `app.js` line 19 with your Unsplash Access Key.

### 5. Deploy
Upload all files to your hosting (Netlify, Vercel, GitHub Pages, etc.)

## File Structure
```
/
├── index.html          # PWA homepage
├── style.css           # Complete design system
├── app.js              # Firebase + Unsplash PWA logic
├── generate.js         # SEO page generator
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline caching
├── offline.html        # Offline fallback
├── about.html          # About page
├── contact.html        # Contact page
├── privacy-policy.html # Privacy policy
├── robots.txt
├── sitemap.xml         # Auto-generated
├── wallpaper/          # Generated wallpaper pages
└── category/           # Generated category pages
```

## Unsplash API Key
Get your free API key at [unsplash.com/developers](https://unsplash.com/developers).
Free tier: 50 requests/hour. For production, apply for production access (5000/hour).
