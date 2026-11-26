// Offline support: the first visit saves every game file, so after that the game also loads with no internet.
// The page itself (index.html) is always fetched fresh when you're online, so a new upload shows up straight away.
// Game files have the version in their name (game_v95.js), so a new version is a new file and never mixed up.
const VERSION = 'pastel-siege-v95';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './logo.png', 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js', 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.core.js', './abilities_v95.js', './account_v95.js', './attachments_v95.js', './audio_v95.js', './bots_v95.js', './charms_v95.js', './controls_v95.js', './crosshair_v95.js', './game_v95.js', './gunkit_v95.js', './helpers_v95.js', './mapgen_v95.js', './meta_v95.js', './models2_v95.js', './models_v95.js', './mutations_v95.js', './nav_v95.js', './net_v95.js', './platform_v95.js', './post_v95.js', './run_v95.js', './shop_v95.js', './skins_v95.js', './textures_v95.js', './weapons_v95.js', './world_v95.js'];
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
