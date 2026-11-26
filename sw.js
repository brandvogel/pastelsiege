// Offline support: the first visit saves every game file, so after that the game also loads with no internet.
// The page itself (index.html) is always fetched fresh when you're online, so a new upload shows up straight away.
// Game files have the version in their name (game_v96.js), so a new version is a new file and never mixed up.
const VERSION = 'pastel-siege-v96';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './logo.png', 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js', 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.core.js', './abilities_v96.js', './account_v96.js', './attachments_v96.js', './audio_v96.js', './bots_v96.js', './charms_v96.js', './controls_v96.js', './crosshair_v96.js', './game_v96.js', './gunkit_v96.js', './helpers_v96.js', './mapgen_v96.js', './meta_v96.js', './models2_v96.js', './models_v96.js', './mutations_v96.js', './nav_v96.js', './net_v96.js', './platform_v96.js', './post_v96.js', './run_v96.js', './shop_v96.js', './skins_v96.js', './textures_v96.js', './weapons_v96.js', './world_v96.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const save = (req, res) => { const o = new URL(req.url).origin; if (res.ok && (o === location.origin || o === 'https://cdn.jsdelivr.net')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url), page = req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (page || url.pathname.endsWith('/sw.js')) {
    // the page: network first (new uploads show at once), the saved copy only when offline
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => save(req, res)).catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match('./index.html'))));
    return;
  }
  // game files and the 3D engine: saved copy first (fast, works offline), the network if it's not saved yet
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => save(req, res))));
});
