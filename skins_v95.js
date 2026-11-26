// Gun skins, weapon levels and saved progress.
// Bought skins are yours forever and fit any gun. Mastery skins unlock per gun by levelling it up.

export const SKINS = [
  { id: 'factory', name: 'Factory', price: 0, tier: 'Stock', desc: 'The finish it left the factory with.' },
  { id: 'arctic', name: 'Arctic', price: 800, tier: 'Common', body: 0xeef1f4, acc: 0x9fb3c2, poly: 0xd6dde3 },
  { id: 'desert', name: 'Desert Tan', price: 800, tier: 'Common', body: 0xc9a978, acc: 0x7a6248, poly: 0xb39467 },
  { id: 'olive', name: 'Olive Drab', price: 800, tier: 'Common', body: 0x5f6f52, acc: 0x3a4232, poly: 0x4d5a42 },
  { id: 'sakura', name: 'Sakura', price: 1500, tier: 'Rare', body: 0xf4b6c2, acc: 0xfffaf0, poly: 0xf7cdd5 },
  { id: 'mint', name: 'Mint Chip', price: 1500, tier: 'Rare', body: 0xa8e6cf, acc: 0x3d2c25, poly: 0x8fd6bc },
  { id: 'woodland', name: 'Woodland Camo', price: 2200, tier: 'Rare', pattern: 'camo', cols: ['#4b5a3a', '#6f7d4f', '#2f3326', '#8a7a55'] },
  { id: 'digital', name: 'Urban Digital', price: 2200, tier: 'Rare', pattern: 'digital', cols: ['#6b7078', '#9aa0a8', '#3f434a', '#c8ccd2'] },
  { id: 'tiger', name: 'Tiger Stripe', price: 2800, tier: 'Epic', pattern: 'tiger', cols: ['#e0892f', '#1b1b1f'] },
  { id: 'candy', name: 'Candy Swirl', price: 2800, tier: 'Epic', pattern: 'candy', cols: ['#f4a6b8', '#fffaf0', '#a8e6cf'] },
  { id: 'carbon', name: 'Carbon Fibre', price: 3500, tier: 'Epic', pattern: 'carbon', clear: 1 },
  { id: 'neon', name: 'Neon Grid', price: 5000, tier: 'Legendary', pattern: 'neon', glow: true },
  { id: 'damascus', name: 'Damascus', price: 6000, tier: 'Legendary', pattern: 'damascus', metal: .9 },
  { id: 'chrome', name: 'Mirror Chrome', price: 6500, tier: 'Legendary', body: 0xf3f5f8, acc: 0xc9ced6, poly: 0xe8ebef, metal: 1, rough: .05, all: true },
  { id: 'galaxy', name: 'Galaxy', price: 9000, tier: 'Mythic', pattern: 'galaxy', glow: true },
  // mastery: earned by levelling a gun
  { id: 'bronze', name: 'Bronze Mastery', level: 5, tier: 'Mastery', body: 0xb0703a, acc: 0x6e4422, poly: 0x8c5a30, metal: 1, rough: .32, all: true },
  { id: 'silver', name: 'Silver Mastery', level: 10, tier: 'Mastery', body: 0xd8dde3, acc: 0x8f96a0, poly: 0xb9bfc7, metal: 1, rough: .2, all: true },
  { id: 'gold', name: 'Gold Mastery', level: 15, tier: 'Mastery', body: 0xe2b43c, acc: 0x9a7420, poly: 0xc99a2e, metal: 1, rough: .18, all: true },
  { id: 'prism', name: 'Prism Mastery', level: 20, tier: 'Mastery', body: 0xffffff, acc: 0xe9e4ff, poly: 0xf4f0ff, metal: 1, rough: .12, iri: true, all: true },
];
export const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];
export const TIER_COL = { Stock: '#8d8676', Common: '#81b29a', Rare: '#5b8fd6', Epic: '#a36be0', Legendary: '#e8a33d', Mythic: '#e0457b', Mastery: '#d4a73a' };

// ---------- the big skin collection: bought in the buy menu (Gun Studio > Skins), priced by rarity ----------
// [name, pattern or null, colours]. Solid ones use colours as [body, accent].
const MORE_SKINS = {
  Common: [
    ['Bubblegum', null, [0xff9ecf, 0xfffaf0]], ['Lemonade', null, [0xffe14d, 0xfffaf0]], ['Peach Fuzz', null, [0xffb38a, 0x8a4b2a]], ['Lilac', null, [0xc8b6ff, 0x3d2b6b]],
    ['Seafoam', null, [0x9be3c9, 0x2b5a4a]], ['Cocoa', null, [0x7a4b35, 0xf2cc8f]], ['Slate', null, [0x6b7078, 0x2b2d42]], ['Coral Reef', null, [0xe07a5f, 0x3d405b]],
    ['Butter', null, [0xfff1b8, 0xd4a73a]], ['Sky High', null, [0x9cd3f2, 0xfffaf0]], ['Moss', null, [0x6f8a4f, 0x2f3326]], ['Brickwork', null, [0xa8483a, 0xe6d3ad]],
    ['Fog', null, [0xd9d6cf, 0x8d8676]], ['Plum', null, [0x6b2d5c, 0xf4b6c2]], ['Sandcastle', null, [0xe6cf9f, 0x8a6d3b]], ['Teal Deal', null, [0x2a9d8f, 0xf2cc8f]],
    ['Rusty', null, [0xb5562a, 0x2b2d42]], ['Ink', null, [0x2b2d42, 0x8d99ae]], ['Vanilla', null, [0xfffaf0, 0xc9b79c]], ['Berry', null, [0xb5179e, 0xffc6ec]],
    ['Sage', null, [0x81b29a, 0xfffaf0]], ['Navy Seal', null, [0x1d3557, 0xe63946]], ['Apricot', null, [0xf8a46b, 0xfff1d6]], ['Charcoal', null, [0x3a3a40, 0xffd34d]],
  ],
  Uncommon: [
    ['Candy Cane', 'stripes', ['#ff4f6d', '#fffaf0']], ['Bumblebee', 'stripes', ['#ffd34d', '#2b2d42']], ['Mint Stripe', 'stripes', ['#a8e6cf', '#fffaf0', '#3d2c25']],
    ['Referee', 'stripes', ['#1b1b1f', '#f4f4f4']], ['Sorbet', 'stripes', ['#ffb38a', '#ff9ecf', '#fff1b8']], ['Pool Party', 'stripes', ['#4fd1c5', '#fffaf0', '#5b8fd6']],
    ['Polka Pink', 'dots', ['#ff9ecf', '#fffaf0']], ['Ladybug', 'dots', ['#d6453d', '#1b1b1f']], ['Sprinkles', 'dots', ['#fff1d6', '#ff4fd8', '#4fd1c5', '#ffd34d']],
    ['Night Dots', 'dots', ['#2b2d42', '#ffe14d']], ['Seafoam Dots', 'dots', ['#9be3c9', '#2b5a4a']], ['Mushroom', 'dots', ['#c0392b', '#fffaf0']],
    ['Picnic', 'checker', ['#e63946', '#fffaf0']], ['Race Day', 'checker', ['#1b1b1f', '#f4f4f4']], ['Lavender Tile', 'checker', ['#c8b6ff', '#efe8ff']],
    ['Lime Tile', 'checker', ['#b5e550', '#3f6b2a']], ['Cafe Floor', 'checker', ['#7a4b35', '#f2cc8f']], ['Arcade Tile', 'checker', ['#ff4fd8', '#2b2d42']],
  ],
  Rare: [
    ['Sunset', 'fade', ['#ff9ecf', '#ffb38a', '#ffe14d']], ['Deep Sea', 'fade', ['#0b3d5c', '#2a9d8f', '#9be3c9']], ['Cotton Candy', 'fade', ['#9cd3f2', '#c8b6ff', '#ff9ecf']],
    ['Ocean Waves', 'waves', ['#5b8fd6', '#9cd3f2', '#fffaf0']], ['Strawberry Milk', 'waves', ['#ff9ecf', '#fffaf0']], ['Dune Waves', 'waves', ['#e6cf9f', '#c9a978', '#8a6d3b']],
    ['8-Bit', 'pixel', ['#5b8fd6', '#ffd34d', '#e63946', '#2b2d42', '#fffaf0']], ['Gameboy', 'pixel', ['#9bbc0f', '#8bac0f', '#306230', '#0f380f']], ['Pastel Pixels', 'pixel', ['#ff9ecf', '#9cd3f2', '#a8e6cf', '#fff1b8', '#c8b6ff']],
    ['Zebra', 'zebra', ['#f4f4f4', '#1b1b1f']], ['Pink Zebra', 'zebra', ['#ffc6ec', '#b5179e']],
    ['Leopard', 'leopard', ['#e0a95c', '#6b3f1d', '#1b1b1f']], ['Snow Leopard', 'leopard', ['#eef1f4', '#8d99ae', '#2b2d42']], ['Candy Leopard', 'leopard', ['#ff9ecf', '#c8b6ff', '#3d2b6b']],
  ],
  Epic: [
    ['Sweetheart', 'hearts', ['#ffc6ec', '#e63946']], ['Love Bug', 'hearts', ['#2b2d42', '#ff4fd8']], ['Valentine', 'hearts', ['#fffaf0', '#ff9ecf', '#e63946']],
    ['Starry Night', 'stars', ['#1d2a5c', '#ffe14d']], ['Gold Star', 'stars', ['#fff1b8', '#d4a73a']], ['Shooting Stars', 'stars', ['#3d2b6b', '#fffaf0', '#4fd1c5']],
    ['Marble', 'marble', ['#f4f2ee', '#8d8676']], ['Rose Marble', 'marble', ['#ffd6e0', '#b5476b']],
    ['Honeycomb', 'hex', ['#ffd34d', '#8a5a00']], ['Mint Hex', 'hex', ['#a8e6cf', '#2b5a4a']],
    ['Confetti', 'confetti', ['#fffaf0', '#ff4fd8', '#4fd1c5', '#ffd34d', '#5b8fd6']], ['Party Dark', 'confetti', ['#2b2d42', '#ff9ecf', '#a8e6cf', '#ffe14d']],
  ],
  Legendary: [
    ['Magma', 'lava', ['#1b1010', '#ff5a1f', '#ffd34d']], ['Blue Lava', 'lava', ['#0b1020', '#3be8ff', '#c8b6ff']],
    ['Motherboard', 'circuit', ['#0f2a1d', '#5dffb0']], ['Hot Wire', 'circuit', ['#1d0f2a', '#ff3bd4']],
    ['Hologram', 'holo', ['#9cd3f2', '#c8b6ff', '#ff9ecf', '#a8e6cf']], ['Opal', 'holo', ['#fffaf0', '#ffd6e0', '#c8f0ff', '#e8ffe0']],
    ['Rainbow Road', 'rainbow', ['#ff5a5a', '#ffb347', '#ffe14d', '#5dffb0', '#3bb8ff', '#b37cff']], ['Pastel Rainbow', 'rainbow', ['#ff9ecf', '#ffb38a', '#fff1b8', '#a8e6cf', '#9cd3f2', '#c8b6ff']],
  ],
  Mythic: [
    ['Supernova', 'nova', ['#140a2e', '#ff4fd8', '#ffe14d']], ['Aurora', 'aurora', ['#071a2e', '#5dffb0', '#b37cff']],
    ['Molten Gold', 'lava', ['#3a2400', '#ffd34d', '#fff6c8']], ['Prismatic', null, [0xffffff, 0xf4f0ff], { iri: true, metal: 1, rough: .08 }],
  ],
  Exotic: [['Glitch', 'glitch', ['#0b0b12', '#ff3bd4', '#3be8ff', '#fffaf0']], ['Event Horizon', 'void', ['#000000', '#ffb347', '#b37cff']]],
  Celestial: [['The Pastel One', 'celestial', ['#fffaf0', '#ff9ecf', '#9cd3f2', '#a8e6cf', '#fff1b8', '#c8b6ff', '#d4a73a']]],
};
const GLOWY = ['Legendary', 'Mythic', 'Exotic', 'Celestial'];
const TIER_PRICE = { Common: 600, Uncommon: 1200, Rare: 2000, Epic: 3200, Legendary: 6000, Mythic: 9500, Exotic: 15000, Celestial: 30000 };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const EXTRA_SKINS = [];
for (const tier in MORE_SKINS) for (const [name, pattern, cols, extra] of MORE_SKINS[tier]) {
  const s = { id: 'x-' + slug(name), name, tier, price: TIER_PRICE[tier] };
  if (pattern) Object.assign(s, { pattern, cols, glow: GLOWY.includes(tier), clear: tier === 'Celestial' ? 1 : 0 });
  else Object.assign(s, { body: cols[0], acc: cols[1], poly: cols[0] }, extra || {}, extra?.iri ? { all: true } : {});
  EXTRA_SKINS.push(s);
}
SKINS.push(...EXTRA_SKINS);
Object.assign(TIER_COL, { Uncommon: '#4fa3a5', Exotic: '#ff3b30', Celestial: '#7b5cd6' });

// ---------- weapon levels ----------
export const MAX_LEVEL = 20;
export const xpNeed = lvl => 300 + 150 * (lvl - 1);          // xp from level lvl to lvl+1
export function levelOf(xp) {
  let l = 1, need = xpNeed(1);
  while (l < MAX_LEVEL && xp >= need) { xp -= need; l++; need = xpNeed(l); }
  return { level: l, into: xp, need: l >= MAX_LEVEL ? 0 : need };
}
export const xpForLevel = L => { let s = 0; for (let l = 1; l < L; l++) s += xpNeed(l); return s; };
// Each level gives a small, permanent edge on that gun.
export const PERKS = [
  [2, 'Reload 5% faster', { reload: .95, emptyReload: .95, shell: .95 }],
  [3, 'Recoil −5%', { recoilV: .95, recoilH: .95 }],
  [4, 'Aim speed +6%', { adsSpeed: 1.06 }],
  [5, 'Bronze Mastery skin'],
  [6, 'Hip-fire spread −6%', { hip: .94 }],
  [7, 'Damage +4%', { dmg: 1.04 }],
  [8, 'Recoil −5%', { recoilV: .95, recoilH: .95 }],
  [9, 'Weapon swap 10% faster', { draw: .9 }],
  [10, 'Silver Mastery skin'],
  [11, 'Reserve ammo +20%', { reserve: 1.2 }],
  [12, 'Damage +4%', { dmg: 1.04 }],
  [13, 'Shot consistency +10%', { bloom: .9 }],
  [14, 'Reload 5% faster', { reload: .95, emptyReload: .95, shell: .95 }],
  [15, 'Gold Mastery skin'],
  [16, 'Recoil −5%', { recoilV: .95, recoilH: .95 }],
  [17, 'Aim speed +6%', { adsSpeed: 1.06 }],
  [18, 'Headshot damage +5%', { head: 1.05 }],
  [19, 'Damage +4%', { dmg: 1.04 }],
  [20, 'Prism Mastery skin'],
];
export function applyLevel(w, level) {
  for (const [l, , mul] of PERKS) if (l <= level && mul) for (const k in mul) if (w[k]) w[k] *= mul[k];
  w.reserve = Math.round(w.reserve); w.level = level;
  return w;
}

// ---------- save protection ----------
// Every save carries a checksum, and a second copy is kept in a scrambled form. A script that edits the saved numbers
// from outside the game (searching the browser's storage for "cash" or "xp" and changing them) breaks the checksum,
// and the game quietly puts back the last real save. The scrambled copy isn't readable as data, so those scripts skip it.
// This stops save editing tools, not someone who rewrites the game's own code; server checks will cover that once
// there are accounts.
const SALT = 'pS~v1:' + [112, 97, 115, 116, 101, 108].map(c => String.fromCharCode(c + 3)).join('') + ':Q7m';
function hash(str) { // cyrb53: fast 53-bit string hash
  let h1 = 0xdeadbeef ^ 0x51, h2 = 0x41c6ce57 ^ 0x51;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const pack = s => btoa(unescape(encodeURIComponent(s))).split('').reverse().join('');
const unpack = s => decodeURIComponent(escape(atob(s.split('').reverse().join(''))));
export const tamper = { keys: [] }; // saves that were edited outside the game this session
export function sealSave(key, obj) {
  const d = JSON.stringify(obj), s = hash(SALT + key + d);
  localStorage.setItem(key, JSON.stringify({ d: obj, s })); localStorage.setItem(key + '~', pack(s + '|' + d)); localStorage.setItem('psSeal', '1');
}
export function openSave(key) {
  let raw = null; try { raw = JSON.parse(localStorage.getItem(key)); } catch (e) { }
  const bak = localStorage.getItem(key + '~');
  if (raw && raw.d && typeof raw.s === 'string' && hash(SALT + key + JSON.stringify(raw.d)) === raw.s) return raw.d;
  // an old save from before checksums is accepted once (and sealed on the next save), but only on a browser that has
  // never had a protected save: otherwise it's a script that deleted the backup and wrote a plain save to get around
  // the checksum.
  if (raw && !bak && !(raw.d && raw.s) && !localStorage.getItem('psSeal')) return raw;
  if (!raw && !bak) return null;
  tamper.keys.push(key);
  // edited: put back the last real copy
  try { const b = unpack(bak), i = b.indexOf('|'), s = b.slice(0, i), d = b.slice(i + 1); if (hash(SALT + key + d) === s) { const o = JSON.parse(d); sealSave(key, o); return o; } } catch (e) { }
  try { localStorage.removeItem(key); localStorage.removeItem(key + '~'); } catch (e) { } // no good copy left
  return null;
}
export const dropSave = key => { try { localStorage.removeItem(key); localStorage.removeItem(key + '~'); } catch (e) { } };

// ---------- saved progress ----------
const KEY = 'pastelSiegeProgress9';
export const prog = (() => {
  let p = null; try { p = openSave(KEY); } catch (e) { p = null; }
  return Object.assign({ xp: {}, skins: ['factory'], skinOf: {}, bestFloor: 0, bestScore: 0, kills: 0, runs: 0 }, p || {});
})();
export const saveProg = () => { try { sealSave(KEY, prog); } catch (e) { } };
export const gunLevel = id => levelOf(prog.xp[id] || 0).level;
export function skinUnlocked(skin, gunId) { return skin.level ? gunLevel(gunId) >= skin.level : prog.skins.includes(skin.id); }

// ---------- pattern textures (2D canvas, shared by the 3D materials and the shop swatches) ----------
const cache = {};
function seeded(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export function skinCanvas(skin) {
  if (!skin.pattern) return null;
  if (cache[skin.id]) return cache[skin.id];
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), r = seeded(skin.id.length * 7919 + 13);
  // draw a shape at every wrap offset so the texture tiles without seams
  const wrap = fn => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { x.save(); x.translate(ox, oy); fn(); x.restore(); } };
  const P = skin.pattern, cols = skin.cols || [];
  if (P === 'camo') {
    x.fillStyle = cols[1]; x.fillRect(0, 0, N, N);
    [0, 2, 3, 0, 2].forEach(ci => { for (let i = 0; i < 9; i++) { const cx = r() * N, cy = r() * N, rx = 14 + r() * 34, ry = 10 + r() * 22, a = r() * 3; wrap(() => { x.fillStyle = cols[ci]; x.beginPath(); x.ellipse(cx, cy, rx, ry, a, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + rx * .6, cy + ry * .3, rx * .6, ry * .7, a + 1, 0, 7); x.fill(); }); } });
  } else if (P === 'digital') {
    const s = 8; x.fillStyle = cols[1]; x.fillRect(0, 0, N, N);
    for (let k = 0; k < 140; k++) { const ci = [0, 2, 3][k % 3], gx = Math.floor(r() * N / s), gy = Math.floor(r() * N / s), w = 1 + Math.floor(r() * 4), h = 1 + Math.floor(r() * 3); x.fillStyle = cols[ci]; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) if (r() > .25) x.fillRect(((gx + i) % (N / s)) * s, ((gy + j) % (N / s)) * s, s, s); }
  } else if (P === 'tiger') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N); x.fillStyle = cols[1];
    for (let i = 0; i < 11; i++) { const y0 = i / 11 * N + r() * 10, amp = 6 + r() * 10, th = 5 + r() * 9; wrap(() => { x.beginPath(); x.moveTo(0, y0); for (let t = 0; t <= N; t += 8) x.lineTo(t, y0 + Math.sin(t / 40 + i) * amp - th * (1 - Math.abs(t / N - .5) * 1.4)); for (let t = N; t >= 0; t -= 8) x.lineTo(t, y0 + Math.sin(t / 40 + i) * amp + th * .4); x.closePath(); x.fill(); }); }
  } else if (P === 'candy') {
    for (let i = -N; i < N * 2; i += 24) { x.fillStyle = cols[Math.abs(i / 24) % 3]; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 24, 0); x.lineTo(i + 24 - N, N); x.lineTo(i - N, N); x.closePath(); x.fill(); }
  } else if (P === 'carbon') {
    const s = 16; for (let i = 0; i < N / s; i++) for (let j = 0; j < N / s; j++) {
      const g = (i + j) % 2 ? x.createLinearGradient(i * s, 0, i * s + s, 0) : x.createLinearGradient(0, j * s, 0, j * s + s);
      g.addColorStop(0, '#15161b'); g.addColorStop(.5, '#3a3d47'); g.addColorStop(1, '#15161b'); x.fillStyle = g; x.fillRect(i * s, j * s, s, s);
    }
  } else if (P === 'neon') {
    x.fillStyle = '#14131f'; x.fillRect(0, 0, N, N);
    x.strokeStyle = '#ff3bd4'; x.lineWidth = 2; x.shadowColor = '#ff3bd4'; x.shadowBlur = 6;
    for (let i = 0; i <= N; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.stroke(); }
    x.strokeStyle = '#3be8ff'; x.shadowColor = '#3be8ff'; for (let i = 0; i <= N; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(N, i); x.stroke(); }
  } else if (P === 'damascus') {
    const img = x.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = i / N * Math.PI * 2, v = j / N * Math.PI * 2, f = Math.sin(v * 9 + Math.sin(u * 3) * 2.2 + Math.sin(u * 2 + v) * 1.3), k = 120 + f * 70, o = (j * N + i) * 4;
      img.data[o] = k; img.data[o + 1] = k + 4; img.data[o + 2] = k + 12; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  } else if (P === 'galaxy') {
    x.fillStyle = '#120c2e'; x.fillRect(0, 0, N, N);
    [['#5b2a86', 70], ['#2a6fdb', 55], ['#e0457b', 40], ['#3be8ff', 25]].forEach(([col, rad]) => { for (let i = 0; i < 5; i++) { const cx = r() * N, cy = r() * N; wrap(() => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, col + 'cc'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }); } });
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${.4 + r() * .6})`; const s = r() < .1 ? 2 : 1; x.fillRect(r() * N, r() * N, s, s); }
  } else if (P === 'stripes') {
    const w = 18 + Math.floor(r() * 3) * 6; for (let i = -N, k = 0; i < N * 2; i += w, k++) { x.fillStyle = cols[k % cols.length]; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + w, 0); x.lineTo(i + w - N, N); x.lineTo(i - N, N); x.closePath(); x.fill(); }
  } else if (P === 'dots') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N); const s = 32;
    for (let j = 0; j < N / s; j++) for (let i = 0; i < N / s; i++) { x.fillStyle = cols[1 + (i + j * 3) % (cols.length - 1)]; x.beginPath(); x.arc(i * s + (j % 2 ? s : s / 2) % N, j * s + s / 2, 7, 0, 7); x.fill(); if (j % 2 && i === 0) { x.beginPath(); x.arc(N, j * s + s / 2, 7, 0, 7); x.fill(); } }
  } else if (P === 'checker') {
    const s = 32; for (let j = 0; j < N / s; j++) for (let i = 0; i < N / s; i++) { x.fillStyle = cols[(i + j) % 2]; x.fillRect(i * s, j * s, s, s); }
  } else if (P === 'fade') {
    const g = x.createLinearGradient(0, 0, 0, N); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1) * .5, c)); cols.slice().reverse().forEach((c, i) => g.addColorStop(.5 + i / (cols.length - 1) * .5, c)); x.fillStyle = g; x.fillRect(0, 0, N, N);
  } else if (P === 'waves') {
    x.fillStyle = cols[cols.length - 1]; x.fillRect(0, 0, N, N);
    for (let k = 0; k < 8; k++) { x.fillStyle = cols[k % (cols.length > 2 ? cols.length - 1 : 1)]; const y0 = k * N / 8; x.beginPath(); x.moveTo(0, y0 + 14); for (let t = 0; t <= N; t += 4) x.lineTo(t, y0 + Math.sin(t / N * Math.PI * 4) * 8); x.lineTo(N, y0 + 16); for (let t = N; t >= 0; t -= 4) x.lineTo(t, y0 + 16 + Math.sin(t / N * Math.PI * 4) * 8); x.closePath(); x.fill(); }
  } else if (P === 'pixel') {
    const s = 16; for (let j = 0; j < N / s; j++) for (let i = 0; i < N / s; i++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.fillRect(i * s, j * s, s, s); }
  } else if (P === 'zebra') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N); x.fillStyle = cols[1];
    for (let i = 0; i < 14; i++) { const y0 = i / 14 * N, ph = r() * 6, amp = 8 + r() * 12; wrap(() => { x.beginPath(); for (let t = 0; t <= N; t += 6) x.lineTo(t, y0 + Math.sin(t / 30 + ph) * amp); for (let t = N; t >= 0; t -= 6) x.lineTo(t, y0 + Math.sin(t / 30 + ph) * amp + 4 + Math.abs(Math.sin(t / 50 + i)) * 7); x.closePath(); x.fill(); }); }
  } else if (P === 'leopard') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 46; i++) { const cx = r() * N, cy = r() * N, rr = 6 + r() * 7, a = r() * 3; wrap(() => { x.fillStyle = cols[1]; x.beginPath(); x.ellipse(cx, cy, rr, rr * .75, a, 0, 7); x.fill(); x.strokeStyle = cols[2]; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, rr + 2, rr * .75 + 2, a, .4, 5.2); x.stroke(); }); }
  } else if (P === 'hearts' || P === 'stars') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N); const s = 42;
    const heart = (cx, cy, k) => { x.beginPath(); x.moveTo(cx, cy + k * .9); x.bezierCurveTo(cx - k * 1.4, cy - k * .1, cx - k * .6, cy - k * 1.1, cx, cy - k * .35); x.bezierCurveTo(cx + k * .6, cy - k * 1.1, cx + k * 1.4, cy - k * .1, cx, cy + k * .9); x.fill(); };
    const star = (cx, cy, k) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rad = i % 2 ? k * .45 : k; x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } x.closePath(); x.fill(); };
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { const cx = i * N / 6 + (j % 2) * N / 12, cy = j * N / 6, k = 7 + r() * 5; x.fillStyle = cols[1 + (i + j) % (cols.length - 1)]; wrap(() => (P === 'hearts' ? heart : star)(cx, cy, k)); }
  } else if (P === 'marble' || P === 'lava') {
    const img = x.createImageData(N, N), c0 = hexRGB(cols[0]), c1 = hexRGB(cols[1]), c2 = hexRGB(cols[2] || cols[1]), lava = P === 'lava';
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = i / N * Math.PI * 2, v = j / N * Math.PI * 2, f = Math.sin(u * 2 + Math.sin(v * 3) * 2.4 + Math.sin(u * 5 + v * 2) * .9 + Math.cos(v * 4) * .7);
      let k = lava ? Math.pow(Math.max(0, 1 - Math.abs(f) * 2.6), 1.6) : Math.pow(1 - Math.abs(f), 7), o = (j * N + i) * 4, hot = lava ? Math.pow(k, 3) : 0;
      img.data[o] = c0[0] + (c1[0] - c0[0]) * k + (c2[0] - c1[0]) * hot; img.data[o + 1] = c0[1] + (c1[1] - c0[1]) * k + (c2[1] - c1[1]) * hot; img.data[o + 2] = c0[2] + (c1[2] - c0[2]) * k + (c2[2] - c1[2]) * hot; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  } else if (P === 'hex') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N); x.strokeStyle = cols[1]; x.lineWidth = 4; const s = 16, h = s * Math.sqrt(3);
    for (let j = -1; j < N / h + 1; j++) for (let i = -1; i < N / (s * 3) + 1; i++) for (const [ox, oy] of [[0, 0], [s * 1.5, h / 2]]) { const cx = i * s * 3 + ox, cy = j * h + oy; x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; x.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } x.closePath(); x.stroke(); }
  } else if (P === 'confetti') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 130; i++) { const cx = r() * N, cy = r() * N, a = r() * 3, col = cols[1 + Math.floor(r() * (cols.length - 1))]; wrap(() => { x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = col; x.fillRect(-5, -2, 10, 4); x.restore(); }); }
  } else if (P === 'circuit') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N); x.strokeStyle = cols[1]; x.fillStyle = cols[1]; x.lineWidth = 2; x.shadowColor = cols[1]; x.shadowBlur = 5; const s = 16;
    for (let k = 0; k < 34; k++) { let px = Math.floor(r() * N / s) * s, py = Math.floor(r() * N / s) * s; x.beginPath(); x.moveTo(px, py); for (let n = 0; n < 4; n++) { if (r() < .5) px += (r() < .5 ? -1 : 1) * s * (1 + Math.floor(r() * 3)); else py += (r() < .5 ? -1 : 1) * s * (1 + Math.floor(r() * 3)); x.lineTo(px, py); } x.stroke(); x.beginPath(); x.arc(px, py, 3.5, 0, 7); x.fill(); }
  } else if (P === 'holo' || P === 'rainbow') {
    const g = x.createLinearGradient(0, 0, P === 'holo' ? N : 0, N); const cs = cols.concat(cols[0]); cs.forEach((c, i) => g.addColorStop(i / (cs.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, N, N);
    if (P === 'holo') for (let i = 0; i < 6; i++) { const s = x.createLinearGradient(0, 0, N, N), at = r(); s.addColorStop(Math.max(0, at - .05), 'rgba(255,255,255,0)'); s.addColorStop(at, 'rgba(255,255,255,.5)'); s.addColorStop(Math.min(1, at + .05), 'rgba(255,255,255,0)'); x.fillStyle = s; x.fillRect(0, 0, N, N); }
  } else if (P === 'nova' || P === 'aurora' || P === 'void' || P === 'celestial') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N);
    if (P === 'aurora') for (let i = 0; i < 5; i++) { const y0 = N * (.2 + i * .15), g = x.createLinearGradient(0, y0 - 40, 0, y0 + 40); g.addColorStop(0, cols[1] + '00'); g.addColorStop(.5, (i % 2 ? cols[2] : cols[1]) + 'cc'); g.addColorStop(1, cols[1] + '00'); x.fillStyle = g; x.beginPath(); x.moveTo(0, y0); for (let t = 0; t <= N; t += 8) x.lineTo(t, y0 + Math.sin(t / 40 + i) * 18 - 30); for (let t = N; t >= 0; t -= 8) x.lineTo(t, y0 + Math.sin(t / 40 + i) * 18 + 30); x.fill(); }
    else if (P === 'nova') for (let i = 0; i < 4; i++) { const cx = r() * N, cy = r() * N; wrap(() => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, 90); g.addColorStop(0, '#ffffff'); g.addColorStop(.15, cols[2]); g.addColorStop(.45, cols[1] + 'aa'); g.addColorStop(1, cols[1] + '00'); x.fillStyle = g; x.fillRect(cx - 90, cy - 90, 180, 180); }); }
    else if (P === 'void') { const g = x.createRadialGradient(N / 2, N / 2, 20, N / 2, N / 2, N * .55); g.addColorStop(0, '#000'); g.addColorStop(.32, '#000'); g.addColorStop(.38, cols[1]); g.addColorStop(.5, cols[2] + '88'); g.addColorStop(1, '#00000000'); x.fillStyle = g; x.fillRect(0, 0, N, N); }
    else { const g = x.createLinearGradient(0, 0, N, N); cols.slice(1, 6).concat(cols[1]).forEach((c, i) => g.addColorStop(i / 5, c)); x.fillStyle = g; x.fillRect(0, 0, N, N); x.strokeStyle = cols[6]; x.lineWidth = 3; for (let i = 0; i < 9; i++) { const cx = r() * N, cy = r() * N; wrap(() => { x.beginPath(); x.arc(cx, cy, 10 + r() * 16, 0, 7); x.stroke(); }); } }
    for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(255,255,255,${.4 + r() * .6})`; const s = r() < .12 ? 2 : 1; x.fillRect(r() * N, r() * N, s, s); }
  } else if (P === 'glitch') {
    x.fillStyle = cols[0]; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 46; i++) { const y = r() * N, h = 2 + r() * 10, w = 30 + r() * 140, px = r() * N; x.fillStyle = cols[1 + Math.floor(r() * (cols.length - 1))]; x.globalAlpha = .55 + r() * .45; x.fillRect(px, y, w, h); x.fillRect(px - N, y, w, h); }
    x.globalAlpha = 1;
  }
  return (cache[skin.id] = c);
}

// Swatch for the shop: pattern or a gradient of the skin colours.
export function drawSwatch(cv, skin) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, pc = skinCanvas(skin);
  x.clearRect(0, 0, W, H);
  if (pc) { x.drawImage(pc, 0, 0, 256, 256 * H / W, 0, 0, W, H); }
  else if (skin.body) {
    const hex = n => '#' + n.toString(16).padStart(6, '0'), g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, hex(skin.body)); g.addColorStop(.6, hex(skin.poly || skin.body)); g.addColorStop(1, hex(skin.acc || skin.body));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (skin.metal) { const s = x.createLinearGradient(0, 0, W, 0); s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(.45, 'rgba(255,255,255,.55)'); s.addColorStop(.55, 'rgba(255,255,255,0)'); x.fillStyle = s; x.fillRect(0, 0, W, H); }
    if (skin.iri) { const s = x.createLinearGradient(0, H, W, 0); ['#ff9ad5', '#9ad5ff', '#b8ffcf', '#ffe59a'].forEach((c, i) => s.addColorStop(i / 3, c + '88')); x.fillStyle = s; x.fillRect(0, 0, W, H); }
  } else { x.fillStyle = '#3d405b'; x.fillRect(0, 0, W, H); x.fillStyle = '#f2cc8f'; x.fillRect(0, H * .7, W, H * .3); }
}

// Re-skins a gun's material set in place.
const texCache = {};
export function applySkin(THREE, M, skin) {
  if (!skin || skin.id === 'factory') return;
  const P = o => new THREE.MeshPhysicalMaterial(o);
  const pc = skinCanvas(skin);
  if (pc) {
    let tex = texCache[skin.id];
    if (!tex) { tex = texCache[skin.id] = new THREE.CanvasTexture(pc); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 5); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; }
    const m = P({ color: 0xffffff, map: tex, roughness: skin.metal ? .3 : skin.clear ? .35 : .5, metalness: skin.metal || (skin.clear ? .2 : .1), clearcoat: skin.clear ? 1 : .4, clearcoatRoughness: .2 });
    if (skin.glow) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = tex; m.emissiveIntensity = skin.pattern === 'neon' ? 1.1 : .55; }
    M.body = m; M.acc = m; M.poly = m; M.wood = m;
    return;
  }
  const mk = (c, extra = {}) => P({ color: c, roughness: skin.rough ?? .4, metalness: skin.metal ?? .25, clearcoat: .5, clearcoatRoughness: .2, ...(skin.iri ? { iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [200, 900] } : {}), ...extra });
  M.body = mk(skin.body); M.acc = mk(skin.acc ?? skin.body); M.poly = mk(skin.poly ?? skin.body, { roughness: Math.min(.8, (skin.rough ?? .4) + .2) });
  M.wood = M.acc;
  if (skin.all) { M.metal = mk(skin.acc ?? skin.body, { roughness: (skin.rough ?? .3) * .8 }); M.dark = mk(skin.acc ?? skin.body, { roughness: (skin.rough ?? .3) + .1 }); }
}
