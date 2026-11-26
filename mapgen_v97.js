// Random map generator. Each floor rolls a theme and a size, from tiny arenas to huge open deserts.
// Boxes can float (y0 > 0): roofs, bridges, catwalks and lintels you can walk under or on top of.
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function makeBuilder(seed) {
  const boxes = [], decorList = [], pads = [], r = mulberry(seed);
  const B = {
    r, boxes, decorList, pads,
    box(x, z, w, d, h, color, y0 = 0) { if (w > 0 && d > 0 && h > y0) boxes.push({ x, z, w, d, h, color, y0 }); },
    slab(x, z, w, d, top, thick, color) { B.box(x, z, w, d, top, color, top - thick); },
    decor(x, y, z, w, h, d, color, shadow = true, kind = 'box') { decorList.push({ x, y, z, w, h, d, color, shadow, kind }); },
    pad(x, z) { pads.push({ x, z, r: 1.1 }); },
    // dir: direction the stairs climb ('n' = -z, 's' = +z, 'e' = +x, 'w' = -x). (x,z) = outer edge centre of the bottom step.
    stairs(x, z, dir, width, height, color, run = .55, rise = .33) {
      const n = Math.ceil(height / rise), [dx, dz] = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[dir];
      for (let i = 0; i < n; i++) { const o = i * run + run / 2; B.box(x + dx * o, z + dz * o, dx ? run : width, dz ? run : width, Math.min(height, (i + 1) * rise), color); }
      return n * run;
    },
    free(x, z, w, d, gap) { return !boxes.some(c => c.y0 < 2 && x + w / 2 + gap > c.x - c.w / 2 && x - w / 2 - gap < c.x + c.w / 2 && z + d / 2 + gap > c.z - c.d / 2 && z - d / 2 - gap < c.z + c.d / 2); },
    pick(a) { return a[Math.floor(r() * a.length)]; },
  };
  return B;
}

const C = { coral: 0xe07a5f, mustard: 0xf2cc8f, sage: 0x81b29a, navy: 0x3d405b, paper: 0xfffaf0, ink: 0x2b2d42, sky: 0x9cc5d6, brick: 0xc8735a, steel: 0x8d99a6, wood: 0xb5734a, olive: 0x7d8a5a, sand: 0xd9c49a, stone: 0xd8cbb3, dark: 0xb9a888, leaf: 0x6f9f6a, rust: 0xb5523b };
const THEMES = [
  { id: 'toybox', name: 'Toybox Yard', bg: 0xf6efe2, floor: 0xeadfca, grid: [0xd8c8ab, 0xdfd1b6], wall: C.mustard, pal: [C.coral, C.mustard, C.sage, C.navy, C.paper], feats: { building: 2, crates: 3, tower: 2, containers: 1, plaza: 1, trees: 1, ruins: 1, overpass: 1 } },
  { id: 'city', name: 'Downtown', bg: 0xe9eef0, floor: 0xcfc9bf, grid: [0xc4bdb1, 0xc9c2b6], wall: C.brick, pal: [C.brick, C.sky, C.mustard, C.paper, C.sage, C.coral], feats: { building: 6, cars: 2, plaza: 1, tower: 1, trees: 1, overpass: 1 } },
  { id: 'yard', name: 'Shipyard', bg: 0xefe6d6, floor: 0xd9d3c7, grid: [0xc9c1b1, 0xcfc7b8], wall: C.steel, pal: [C.coral, C.sage, C.sky, C.mustard, C.navy, C.rust], feats: { containers: 5, building: 2, tower: 2, tanks: 2, crates: 2, overpass: 1 } },
  { id: 'fort', name: 'Fortress', bg: 0xf3ead8, floor: 0xe6d3ad, grid: [0xd8c39a, 0xdcc8a0], wall: C.sand, pal: [C.stone, C.dark, C.sand, C.olive], feats: { trench: 3, tower: 3, ruins: 3, crates: 1, building: 1 }, keep: true },
  { id: 'desert', name: 'Dust Outpost', bg: 0xf7ead2, floor: 0xe9cf9f, grid: [0xdcc08d, 0xe0c592], wall: 0xd9a066, pal: [0xd9a066, C.brick, C.mustard, 0x8a7f72, C.paper], feats: { ruins: 3, building: 2, rocks: 3, tower: 1, tanks: 1, cars: 1 } },
  { id: 'garden', name: 'Hedge Garden', bg: 0xeef3e6, floor: 0xcfe0b8, grid: [0xbcd0a2, 0xc3d6aa], wall: C.sage, pal: [C.sage, 0x5f8a6b, C.paper, C.coral, C.mustard], feats: { hedges: 4, plaza: 2, trees: 3, tower: 1, building: 1 } },
  { id: 'frost', name: 'Frost Base', bg: 0xf1f5f8, floor: 0xe8eef2, grid: [0xd5dee4, 0xdce4ea], wall: C.sky, pal: [C.sky, C.navy, C.paper, C.coral, C.steel], feats: { building: 3, containers: 2, tower: 2, rocks: 2, tanks: 1, overpass: 1, scaffold: 1 } },
  { id: 'market', name: 'Night Market', bg: 0xf4ece4, floor: 0xd9cfc2, grid: [0xcac0b2, 0xd0c6b8], wall: C.coral, pal: [C.coral, C.mustard, C.sky, C.sage, C.paper], feats: { stalls: 4, building: 2, plaza: 1, cars: 1, trees: 1, scaffold: 1 } },
  { id: 'works', name: 'Pipe Works', bg: 0xebe8e2, floor: 0xcdc8be, grid: [0xc0bab0, 0xc6c0b5], wall: C.steel, pal: [C.steel, C.rust, C.mustard, C.navy, C.sky], feats: { pipes: 4, tanks: 2, containers: 2, scaffold: 2, tower: 1, crates: 1 } },
];
// huge open maps get their own desert themes: long sightlines, dunes, cacti and wrecks
const DESERTS = [
  { id: 'desert', name: 'Great Dunes', bg: 0xf8ead0, floor: 0xedd3a0, grid: [0xe0c48e, 0xe5ca95], wall: 0xd9a066, pal: [0xd9a066, C.brick, C.mustard, 0x8a7f72, C.paper], feats: { dunes: 5, rocks: 3, cacti: 3, wreck: 2, ruins: 2, oasis: 1, tents: 2 }, sparse: .5 },
  { id: 'desert', name: 'Canyon Flats', bg: 0xf6e3cf, floor: 0xe4c39a, grid: [0xd8b68b, 0xdcba90], wall: C.rust, pal: [C.rust, 0xd9a066, C.brick, C.paper], feats: { rocks: 6, dunes: 3, cacti: 2, wreck: 1, ruins: 2, tower: 1, tents: 1 }, sparse: .45 },
];
// map sizes (half-width in metres). Every floor rolls one, so the tower mixes tiny brawls with huge open deserts.
const SIZES = [
  { id: 'tiny', label: 'TINY ARENA', min: 32, max: 40, w: 4, from: 1 },
  { id: 'small', label: 'SMALL', min: 48, max: 66, w: 5, from: 1 },
  { id: 'medium', label: 'MEDIUM', min: 85, max: 110, w: 3, from: 1 },
  { id: 'large', label: 'LARGE', min: 140, max: 175, w: 1.5, from: 2 },
  { id: 'huge', label: 'HUGE DESERT', min: 220, max: 250, w: .8, from: 3 },
];

export function generateMap(floor, seed = Math.floor(Math.random() * 1e9)) {
  const rr = mulberry(seed), themeRoll = rr(), sizeRoll = rr(), spanRoll = rr();
  const pool = SIZES.filter(s => floor >= s.from), total = pool.reduce((a, s) => a + s.w, 0);
  let x = sizeRoll * total, sz = pool[0]; for (const s of pool) { x -= s.w; if (x <= 0) { sz = s; break; } }
  const size = Math.round(sz.min + spanRoll * (sz.max - sz.min));
  const theme = sz.id === 'huge' ? DESERTS[Math.floor(themeRoll * DESERTS.length)] : THEMES[Math.floor(themeRoll * THEMES.length)];
  const def = {
    id: theme.id + '-' + seed, seed, name: theme.name, floor, size, sizeId: sz.id, sizeLabel: sz.label, wallH: 6, spawn: [0, size - 6],
    theme: { bg: theme.bg, floor: theme.floor, grid: theme.grid, fog: sz.id === 'huge' ? [110, 420] : sz.id === 'tiny' ? [60, 200] : [70, 330], wall: theme.wall },
    build(B) {
      buildFloor(B, theme, size);
      // The spawn pad must stay walkable. A staircase from a nearby building can reach into it on rare seeds,
      // which would drop the player inside the steps. If that happened, nudge the spawn to the closest clear spot.
      const [ox, oz] = def.spawn;
      if (!B.free(ox, oz, 1.4, 1.4, .35)) {
        let best = null;
        for (let r = 1; r <= 14 && !best; r++) for (let a = 0; a < 24; a++) {
          const ang = a / 24 * Math.PI * 2, x = ox + Math.cos(ang) * r, z = oz + Math.sin(ang) * r;
          if (Math.abs(x) < size - 3 && Math.abs(z) < size - 3 && B.free(x, z, 1.4, 1.4, .35)) { best = [x, z]; break; }
        }
        if (best) def.spawn = best;
      }
    },
  };
  return def;
}

function buildFloor(B, T, S) {
  const r = B.r, pal = T.pal, col = () => B.pick(pal), info = { roofs: [] };
  const spawn = [0, S - 6], nearSpawn = (x, z, rad) => Math.hypot(x - spawn[0], z - spawn[1]) < rad;
  const weights = Object.entries(T.feats), total = weights.reduce((s, [, w]) => s + w, 0);
  const pickFeat = () => { let x = r() * total; for (const [k, w] of weights) { x -= w; if (x <= 0) return k; } return 'crates'; };
  if (T.keep) FEATS.keep(B, 0, 0, Math.min(20, S * .4), r, col, info, T);
  // lay the arena out as a grid of lots, each holding one feature (tighter lots on tiny maps, emptier ones in the desert)
  const cell = S < 50 ? 14 : 20, n = Math.floor((S * 2 - 6) / cell), off = -((n - 1) * cell) / 2, empty = T.sparse ?? .12;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const cx = off + i * cell + (r() - .5) * 4, cz = off + j * cell + (r() - .5) * 4;
    if (nearSpawn(cx, cz, S < 50 ? 8 : 11) || (T.keep && Math.hypot(cx, cz) < 16)) continue;
    if (r() < empty) continue; // some open ground
    if (n > 6 && (i % 5 === 2 || j % 5 === 2) && r() < .8) continue; // wide avenues every 100m: long sightlines and quick routes across the map
    FEATS[pickFeat()](B, cx, cz, cell - 5, r, col, info, T);
  }
  // bridges between nearby rooftops of similar height
  const roofs = info.roofs;
  for (let a = 0; a < roofs.length; a++) for (let b = a + 1; b < roofs.length; b++) {
    const A = roofs[a], Bb = roofs[b]; if (Math.abs(A.h - Bb.h) > .4 || r() < .35) continue;
    const dx = Bb.x - A.x, dz = Bb.z - A.z;
    if (Math.abs(dz) < Math.min(A.d, Bb.d) / 2 - 1.5 && Math.abs(dx) < 26) {
      const x0 = Math.min(A.x, Bb.x) + (dx > 0 ? A.w : Bb.w) / 2, x1 = Math.max(A.x, Bb.x) - (dx > 0 ? Bb.w : A.w) / 2, z = (A.z + Bb.z) / 2;
      if (x1 - x0 > 2) bridge(B, (x0 + x1) / 2, z, x1 - x0 + .6, 2.4, A.h, 'x');
    } else if (Math.abs(dx) < Math.min(A.w, Bb.w) / 2 - 1.5 && Math.abs(dz) < 26) {
      const z0 = Math.min(A.z, Bb.z) + (dz > 0 ? A.d : Bb.d) / 2, z1 = Math.max(A.z, Bb.z) - (dz > 0 ? Bb.d : A.d) / 2, x = (A.x + Bb.x) / 2;
      if (z1 - z0 > 2) bridge(B, x, (z0 + z1) / 2, 2.4, z1 - z0 + .6, A.h, 'z');
    }
  }
  // scattered small cover, street clutter and jump pads (more of it than before, so open ground is never empty)
  const desert = !!T.sparse;
  for (let k = 0, t = 0; k < S * .85 && t < 3000; t++) {
    const x = (r() * 2 - 1) * (S - 4), z = (r() * 2 - 1) * (S - 4), w = 1 + r() * 1.6, d = 1 + r() * 1.6;
    if (nearSpawn(x, z, 6) || !B.free(x, z, w, d, 2.2)) continue;
    const kind = r();
    if (kind < .26) B.box(x, z, w * 1.6, .7, 1.1, 0xc9b48a);                              // sandbags
    else if (kind < .44) { B.box(x, z, .9, .9, 1.3, B.pick([C.rust, C.sky, C.mustard])); B.decor(x, 1.32, z, .9, .04, .9, C.ink, false); } // barrel
    else if (kind < .54) { if (desert) cactus(B, x, z, r); else { B.box(x, z, .22, .22, 4.2, C.ink); B.decor(x, 4.3, z, .7, .25, .7, C.mustard, false); B.decor(x + .3, 4.1, z, .35, .2, .35, 0xfff1c0, false); } } // lamp post or cactus
    else if (kind < .62) { B.box(x, z, 2, .55, .5, C.wood); B.box(x, z - .22, 2, .12, 1, C.wood, .5); }          // bench
    else if (kind < .69) { for (let q = 0; q < 3; q++) B.decor(x + q * .6 - .6, .3, z, .4, .6, .4, C.coral, false, 'cyl'); } // traffic cones
    else if (kind < .75) { B.decor(x, .25, z, 1.1, .5, 1.1, C.ink, false, 'cyl'); B.decor(x + .5, .25, z + .9, 1.1, .5, 1.1, C.ink, false, 'cyl'); } // tyre pile
    else if (kind < .8) { B.box(x, z, .15, .15, 2.4, C.steel); B.decor(x, 2.3, z, 1.4, .9, .08, B.pick([C.coral, C.mustard, C.sky, C.paper])); } // sign
    else B.box(x, z, w, d, B.pick([1.2, 1.2, 2]), col());
    k++;
  }
  // jump pads sit at the foot of tall buildings, so each one clearly leads up onto a roof
  const tall = info.roofs.filter(f => f.h > 2.8).sort(() => r() - .5), want = Math.max(4, Math.floor(S / 7));
  let placed = 0;
  for (const f of tall) {
    if (placed >= want) break;
    const side = Math.floor(r() * 4), off = 2.6;
    const x = side === 0 ? f.x - f.w / 2 - off : side === 1 ? f.x + f.w / 2 + off : f.x + (r() - .5) * (f.w - 3);
    const z = side === 2 ? f.z - f.d / 2 - off : side === 3 ? f.z + f.d / 2 + off : f.z + (r() - .5) * (f.d - 3);
    if (Math.abs(x) > S - 6 || Math.abs(z) > S - 6 || nearSpawn(x, z, 8) || !B.free(x, z, 2.6, 2.6, 1)) continue;
    B.pad(x, z); placed++;
  }
}

function cactus(B, x, z, r) {
  const h = 2 + r() * 2.2, g = B.pick([0x6f9f6a, 0x5f8a6b, 0x81b29a]);
  B.box(x, z, .55, .55, h, g);
  if (r() < .8) { const a = h * (.45 + r() * .2); B.box(x + .5, z, .5, .4, a + .35, g, a); B.box(x + .7, z, .4, .4, a + 1.1, g, a + .35); }
  if (r() < .6) { const a = h * (.3 + r() * .2); B.box(x - .5, z, .5, .4, a + .35, g, a); B.box(x - .7, z, .4, .4, a + .9, g, a + .35); }
  B.decor(x, h + .08, z, .3, .16, .3, 0xff9ecf, false, 'ball');
}

function bridge(B, x, z, w, d, h, axis) {
  B.slab(x, z, w, d, h, .35, 0x8d99a6);
  if (axis === 'x') { B.box(x, z - d / 2 + .1, w, .15, h + 1, 0x3d405b, h); B.box(x, z + d / 2 - .1, w, .15, h + 1, 0x3d405b, h); }
  else { B.box(x - w / 2 + .1, z, .15, d, h + 1, 0x3d405b, h); B.box(x + w / 2 - .1, z, .15, d, h + 1, 0x3d405b, h); }
}

// Wall along x or z from a to b at a fixed other coordinate, with door and window openings.
// band: optional trim stripes { ys: heights, off: offset from the wall centre } drawn only on solid wall, never across openings.
function wall(B, axis, at, a, b, h, t, color, openings, band) {
  let cur = a; const seg = (s, e, top, y0 = 0) => {
    if (e - s < .05) return; const m = (s + e) / 2, L = e - s; axis === 'x' ? B.box(m, at, L, t, top, color, y0) : B.box(at, m, t, L, top, color, y0);
    if (band) for (const y of band.ys) if (y > y0 + .15 && y < top - .15) axis === 'x' ? B.decor(m, y, at + band.off, L, .1, .06, C.ink, false) : B.decor(at + band.off, y, m, .06, .1, L, C.ink, false);
  };
  openings.sort((p, q) => p.at - q.at).forEach(o => {
    const s = o.at - o.w / 2, e = o.at + o.w / 2; if (s < cur + .3 || e > b - .3) return;
    seg(cur, s, h);
    if (o.door) seg(s, e, h, 2.6); else { seg(s, e, 1.1); seg(s, e, h, 2.1); }
    cur = e;
  });
  seg(cur, b, h);
}

const FEATS = {
  // climbable scaffolding: two decks joined by stairs, open sides to shoot through
  scaffold(B, cx, cz, L, r, col) {
    const w = 6 + r() * 4, d = 3.2, h1 = 3, h2 = 6, c = B.pick([C.mustard, C.coral, C.sky]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(cx + sx * (w / 2 - .1), cz + sz * (d / 2 - .1), .2, .2, h2 + 1, C.steel);
    B.slab(cx, cz, w, d, h1, .2, 0x8d99a6); B.slab(cx, cz, w, d, h2, .2, 0x8d99a6);
    B.box(cx, cz - d / 2 + .05, w, .1, h1 + .9, c, h1 + .6); B.box(cx, cz - d / 2 + .05, w, .1, h2 + .9, c, h2 + .6);
    B.stairs(cx - w / 2 + 1, cz + d / 2 + Math.ceil(h1 / .33) * .55, 'n', 1.3, h1, C.steel);
    B.box(cx + w / 2 - .8, cz, 1.4, d - .4, h1 + .33, C.wood, h1); // step box up to the top deck
    B.box(cx + w / 2 - .8, cz, 1.4, 1, h2, C.wood, h1 + .33);
    B.decor(cx, h2 + 1.4, cz - d / 2, w * .7, .9, .05, c); // banner
  },
  // market stalls: counters you can duck behind, striped awnings overhead
  stalls(B, cx, cz, L, r, col) {
    const n = 2 + Math.floor(r() * 3), rot = r() < .5;
    for (let k = 0; k < n; k++) {
      const o = (k - (n - 1) / 2) * 4.2, x = rot ? cx + o : cx, z = rot ? cz : cz + o, c = col();
      if (!B.free(x, z, 3.4, 2.4, .6)) continue;
      B.box(x, z, 3.2, 1.2, 1.1, C.wood);
      for (const a of [-1.5, 1.5]) B.box(rot ? x + a : x, rot ? z - .9 : z + a, .15, .15, 2.6, C.ink);
      B.decor(x, 2.7, rot ? z - .3 : z, rot ? 3.6 : 2.4, .18, rot ? 2.4 : 3.6, c);
      for (let q = 0; q < 3; q++) B.decor(x + (rot ? q - 1 : 0) * .9, 1.3, z + (rot ? 0 : q - 1) * .9, .45, .35, .45, B.pick([C.coral, C.mustard, C.sage, C.paper]), false, 'ball');
    }
    if (r() < .6) { const x = cx + (r() - .5) * 6, z = cz + (r() - .5) * 6; for (let q = -2; q <= 2; q++) B.decor(x + q * 1.4, 3.6 + Math.cos(q) * .2, z, .3, .3, .3, B.pick([C.mustard, 0xfff1c0, C.coral]), false, 'ball'); } // string lights
  },
  // big pipe runs: walk under the raised ones, take cover behind the low ones
  pipes(B, cx, cz, L, r, col) {
    const rot = r() < .5, len = L * (.7 + r() * .3);
    for (let k = 0; k < 2 + r() * 2; k++) {
      const o = (r() - .5) * (L - 4), y0 = B.pick([0, 0, 3]), R = B.pick([.9, 1.2, 1.6]), c = B.pick([C.steel, C.rust, C.sky]);
      const x = rot ? cx : cx + o, z = rot ? cz + o : cz;
      if (y0 === 0 && !B.free(x, z, rot ? len : R, rot ? R : len, .6)) continue;
      B.box(x, z, rot ? len : R, rot ? R : len, y0 + R, c, y0);
      if (y0 > 0) for (let q = -1; q <= 1; q += 2) B.box(rot ? x + q * len * .35 : x, rot ? z : z + q * len * .35, .4, .4, y0, C.ink);
      for (let q = -2; q <= 2; q++) B.decor(rot ? x + q * len / 5 : x, y0 + R / 2, rot ? z : z + q * len / 5, rot ? .2 : R + .1, R + .1, rot ? R + .1 : .2, C.ink, false); // flange rings
    }
    if (r() < .5) { const x = cx + (r() - .5) * 5, z = cz + (r() - .5) * 5; B.box(x, z, 1.6, 1.6, 2.2, C.mustard); B.decor(x, 2.5, z, .4, .5, .4, C.coral, false, 'cyl'); } // valve box
  },
  // sand dunes: low stepped mounds you can run up for height
  dunes(B, cx, cz, L, r) {
    const w = L * (.6 + r() * .4), d = L * (.4 + r() * .3), c = B.pick([0xe8cf9a, 0xe3c58c, 0xedd6a6]);
    for (let s = 0; s < 4; s++) {
      const k = 1 - s * .22, h = .45 * (s + 1);
      B.box(cx + (r() - .5) * s, cz + (r() - .5) * s, w * k, d * k, h, c, h - .45);
    }
  },
  cacti(B, cx, cz, L, r) {
    for (let k = 0; k < 3 + r() * 5; k++) { const x = cx + (r() - .5) * L, z = cz + (r() - .5) * L; if (B.free(x, z, 1.6, 1.6, 1)) cactus(B, x, z, r); }
    if (r() < .5) { const x = cx + (r() - .5) * 4, z = cz + (r() - .5) * 4; B.box(x, z, 2.2, 1.8, 1.2, 0x8a7f72); }
  },
  // a wrecked truck or bus: solid cover with a climbable roof
  wreck(B, cx, cz, L, r, col) {
    const rot = r() < .5, w = rot ? 7 : 2.8, d = rot ? 2.8 : 7, c = B.pick([C.rust, 0xa36b4f, C.steel]), tilt = r() * .5;
    if (!B.free(cx, cz, w, d, 1)) return;
    B.box(cx, cz, w, d, 2.4 + tilt, c, .5);
    B.box(cx, cz, w - .4, d - .4, .5, C.ink);
    B.box(rot ? cx + w / 2 + .9 : cx, rot ? cz : cz + d / 2 + .9, rot ? 1.8 : 2.6, rot ? 2.6 : 1.8, 1.9, c, .5); // cab
    for (const q of [-1, 1]) for (const p of [-1, 1]) B.decor(rot ? cx + q * w / 3 : cx + p * 1.45, .45, rot ? cz + p * 1.45 : cz + q * d / 3, .9, .9, .9, C.ink, false, 'cyl');
    B.stairs(rot ? cx - w / 2 - 1.8 : cx, rot ? cz : cz - d / 2 - 1.8, rot ? 'e' : 's', 1.4, 2.4 + tilt, 0x8a7f72);
  },
  // an oasis: a pool ringed by palms and rocks, the only shade in the desert
  oasis(B, cx, cz, L, r) {
    const R = 4 + r() * 3;
    B.decor(cx, .03, cz, R * 2, .06, R * 2, 0x6fb6c9, false, 'cyl');
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2 + r() * .4, x = cx + Math.cos(a) * (R + 1.5), z = cz + Math.sin(a) * (R + 1.5);
      if (k % 2) { B.box(x, z, .45, .45, 4 + r() * 2, 0x9a6b45); B.decor(x, 6.2, z, 3.4, .6, 3.4, 0x6f9f6a, true, 'ball'); }
      else B.box(x, z, 1.6 + r(), 1.4 + r(), .9 + r(), 0xa39a8a);
    }
  },
  // a desert camp: tents to hide in, crates and a fire pit
  tents(B, cx, cz, L, r, col) {
    for (let k = 0; k < 2 + r() * 2; k++) {
      const x = cx + (r() - .5) * (L - 6), z = cz + (r() - .5) * (L - 6), c = col(), s = 3.2 + r();
      if (!B.free(x, z, s, s, 1)) continue;
      B.box(x, z, s, s, 1.2, c);
      B.box(x, z, s * .7, s * .7, 2.1, c, 1.2);
      B.box(x, z, s * .35, s * .35, 2.8, c, 2.1);
      B.box(x, z + s / 2 - .05, 1.1, .12, 1.7, C.ink, 0); // dark doorway flap (solid, it's decorative cover)
    }
    B.decor(cx, .15, cz, 1.4, .3, 1.4, 0x8a7f72, false, 'cyl'); B.decor(cx, .5, cz, .6, .5, .6, 0xff8c42, false, 'ball');
    for (let k = 0; k < 3; k++) { const x = cx + (r() - .5) * 6, z = cz + (r() - .5) * 6; if (B.free(x, z, 1.2, 1.2, .6)) B.box(x, z, 1.2, 1.2, 1.2, C.wood); }
  },
  building(B, cx, cz, L, r, col, info) {
    const w = 8 + r() * (L - 8), d = 8 + r() * (L - 8), h = B.pick([4, 4, 4.5, 7]), c = col(), t = .45;
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const ops = len => { const o = [{ at: 0, w: 2.2, door: true }]; if (len > 9) o.push({ at: -len / 3, w: 1.8 }, { at: len / 3, w: 1.8 }); return o; };
    const shift = (o, base) => o.map(p => ({ ...p, at: p.at + base }));
    const ys = []; for (let y = 1.6; y < h - .6; y += 3) ys.push(y);
    wall(B, 'x', z0 + t / 2, x0, x1, h, t, c, r() < .7 ? shift(ops(w), cx) : [], { ys, off: -t / 2 - .03 });
    wall(B, 'x', z1 - t / 2, x0, x1, h, t, c, shift(ops(w), cx), { ys, off: t / 2 + .03 });
    wall(B, 'z', x0 + t / 2, z0 + t, z1 - t, h, t, c, r() < .6 ? shift(ops(d), cz) : shift(ops(d), cz).slice(1));
    wall(B, 'z', x1 - t / 2, z0 + t, z1 - t, h, t, c, r() < .6 ? shift(ops(d), cz) : []);
    B.slab(cx, cz, w, d, h, .3, 0x8d99a6);
    // roof parapet with a gap where the outside stairs arrive
    const ph = h + .9, sxp = cx + w / 4;
    B.box(cx, z0 + .12, w, .25, ph, c, h); B.box(x0 + .12, cz, .25, d, ph, c, h);
    B.box((x0 + sxp - 1.4) / 2, z1 - .12, sxp - 1.4 - x0, .25, ph, c, h); B.box((sxp + 1.4 + x1) / 2, z1 - .12, x1 - sxp - 1.4, .25, ph, c, h);
    B.box(x1 - .12, cz, .25, d, ph, c, h);
    if (r() < .8) B.stairs(sxp, z1 + Math.ceil(h / .33) * .55, 'n', 2, h, 0x8d99a6);
    // interior cover and roof clutter
    for (let k = 0; k < 2 + r() * 3; k++) { const x = cx + (r() - .5) * (w - 3), z = cz + (r() - .5) * (d - 3); B.box(x, z, 1.2 + r(), 1.2 + r(), B.pick([1.1, 1.6]), B.pick([C.wood, C.paper, C.sand])); }
    if (r() < .6) B.box(cx - w / 4, cz - d / 4, 1.8, 1.8, h + 1.1, 0x8d99a6, h);
    info.roofs.push({ x: cx, z: cz, w, d, h });
  },
  tower(B, cx, cz, L, r, col) {
    const ph = B.pick([4.5, 5.5, 6.5]), s = 4.2, c = col();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B.box(cx + a * (s / 2 - .2), cz + b * (s / 2 - .2), .4, .4, ph, C.wood));
    B.slab(cx, cz, s, s, ph, .3, C.wood);
    B.box(cx, cz - s / 2 + .08, s, .15, ph + 1.1, c, ph); B.box(cx - s / 2 + .08, cz, .15, s, ph + 1.1, c, ph); B.box(cx + s / 2 - .08, cz, .15, s, ph + 1.1, c, ph);
    B.box(cx - s / 4 - .5, cz + s / 2 - .08, s / 2 - 1, .15, ph + 1.1, c, ph); B.box(cx + s / 4 + .5, cz + s / 2 - .08, s / 2 - 1, .15, ph + 1.1, c, ph);
    B.stairs(cx, cz + s / 2 + Math.ceil(ph / .33) * .55, 'n', 1.6, ph, C.wood);
    B.decor(cx, ph + 2.6, cz, s + .6, .25, s + .6, c); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B.decor(cx + a * (s / 2 - .2), ph + 1.85, cz + b * (s / 2 - .2), .15, 1.3, .15, C.wood));
  },
  containers(B, cx, cz, L, r, col) {
    for (let k = 0; k < 3 + r() * 4; k++) {
      const rot = r() < .5, [w, d] = rot ? [6.2, 2.6] : [2.6, 6.2], x = cx + (r() - .5) * (L - 6), z = cz + (r() - .5) * (L - 6);
      if (!B.free(x, z, w, d, 1.6)) continue;
      B.box(x, z, w, d, 2.7, col()); for (let i = -2; i <= 2; i++) B.decor(rot ? x + i * 1.1 : x - 1.32, 1.35, rot ? z - 1.32 : z + i * 1.1, rot ? .08 : .04, 2.4, rot ? .04 : .08, C.ink, false);
      if (r() < .45) { B.box(x + (r() - .5) * .6, z, w, d, 5.4, col(), 2.7); if (r() < .5) B.stairs(rot ? x : x + 1.3 + Math.ceil(5.4 / .33) * .55, rot ? z + 1.3 + Math.ceil(5.4 / .33) * .55 : z, rot ? 'n' : 'w', 1.4, 5.4, 0x8d99a6); }
    }
    if (r() < .5) { const x = cx + (r() - .5) * 4, z = cz + (r() - .5) * 4; B.box(x, z, 1.2, 1.2, 7, C.mustard); B.decor(x, 7.4, z, 6, .4, .5, C.mustard); }
  },
  crates(B, cx, cz, L, r, col) {
    for (let k = 0; k < 4 + r() * 6; k++) {
      const s = 1.2 + r() * 1.6, x = cx + (r() - .5) * L, z = cz + (r() - .5) * L, h = B.pick([1.2, 1.2, 1.8, 2.4]);
      if (!B.free(x, z, s, s, 1.8)) continue;
      B.box(x, z, s, s, h, B.pick([C.wood, C.mustard, C.paper, col()]));
      if (r() < .35) B.box(x + (r() - .5) * .4, z + (r() - .5) * .4, s * .7, s * .7, h + s * .7, B.pick([C.wood, C.paper]), h);
    }
  },
  cars(B, cx, cz, L, r, col) {
    for (let k = 0; k < 2 + r() * 3; k++) {
      const along = r() < .5, x = cx + (r() - .5) * L, z = cz + (r() - .5) * L, [w, d] = along ? [2, 4.4] : [4.4, 2];
      if (!B.free(x, z, w, d, 1.5)) continue;
      const c = col(); B.box(x, z, w, d, 1.1, c); B.box(x, z, along ? 1.8 : 2.4, along ? 2.4 : 1.8, 1.75, C.ink, 1.1);
      [-1, 1].forEach(a => [-1, 1].forEach(b => B.decor(x + (along ? a * 1.02 : b * 1.4), .35, z + (along ? b * 1.4 : a * 1.02), along ? .12 : .7, .7, along ? .7 : .12, C.ink, false, 'cyl')));
    }
    B.box(cx + (r() - .5) * 6, cz + (r() - .5) * 6, 2.6, 9, 3, C.mustard);
  },
  plaza(B, cx, cz, L, r, col) {
    B.box(cx, cz, 4, 4, .9, C.paper); B.decor(cx, 1.4, cz, 1.2, 1, 1.2, C.sky, true, 'cyl'); B.decor(cx, 2.1, cz, 2.2, .2, 2.2, C.paper, true, 'cyl');
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => B.box(cx + a * 7, cz + b * 7, b ? 4 : 1, a ? 4 : 1, 1, C.sage));
    [[-1, -1], [1, 1], [-1, 1], [1, -1]].forEach(([a, b]) => { B.box(cx + a * 6, cz + b * 6, .25, .25, 4.5, C.ink); B.decor(cx + a * 6, 4.6, cz + b * 6, .6, .3, .6, C.mustard, false); });
    B.box(cx - 3, cz + 5, 2.4, .7, .9, C.wood); B.box(cx + 3, cz - 5, 2.4, .7, .9, C.wood);
  },
  trees(B, cx, cz, L, r) {
    for (let k = 0; k < 3 + r() * 4; k++) {
      const x = cx + (r() - .5) * L, z = cz + (r() - .5) * L; if (!B.free(x, z, .7, .7, 2)) continue;
      const h = 3 + r() * 2; B.box(x, z, .6, .6, h, C.wood);
      B.decor(x, h + .9, z, 3.4, 2.6, 3.4, B.pick([C.leaf, C.sage, 0x5f8a6b]), true, 'ball'); B.decor(x + .6, h + 1.8, z - .4, 2, 1.8, 2, C.sage, true, 'ball');
    }
  },
  ruins(B, cx, cz, L, r, col) {
    const c = col();
    for (let k = 0; k < 3 + r() * 3; k++) {
      const x = cx + (r() - .5) * (L - 4), z = cz + (r() - .5) * (L - 4), len = 3 + r() * 6, h = 1.2 + r() * 3.2;
      if (r() < .5) { B.box(x, z, len, .6, h, c); B.box(x + len / 2 - .3, z + len / 4, .6, len / 2, h * .7, c); }
      else { B.box(x, z, .6, len, h, c); B.box(x + len / 4, z - len / 2 + .3, len / 2, .6, h * .6, c); }
      if (r() < .5) B.box(x + 1.2, z + 1.2, 2.4, .6, h + .8, c, h - .2); // broken lintel
      for (let q = 0; q < 3; q++) B.box(x + (r() - .5) * 4, z + (r() - .5) * 4, .5 + r() * .6, .5 + r() * .6, .3 + r() * .4, c);
    }
    if (r() < .5) { B.box(cx, cz, .8, .8, 5, c); B.box(cx + 4, cz, .8, .8, 5, c); B.slab(cx + 2, cz, 5.4, 1.4, 5.6, .6, c); }
  },
  rocks(B, cx, cz, L, r, col) {
    for (let k = 0; k < 3 + r() * 4; k++) {
      const x = cx + (r() - .5) * L, z = cz + (r() - .5) * L, s = 2 + r() * 4, h = 1 + r() * 3; if (!B.free(x, z, s, s, 1.5)) continue;
      const c = B.pick([0x8a7f72, 0xa39a8a, col()]); B.box(x, z, s, s * (.6 + r() * .6), h, c); B.box(x + s * .2, z - s * .1, s * .6, s * .5, h + 1 + r(), c, h - .1);
    }
  },
  tanks(B, cx, cz, L, r, col) {
    for (let k = 0; k < 1 + r() * 2; k++) {
      const x = cx + (r() - .5) * (L - 8), z = cz + (r() - .5) * (L - 8), R = 2.2 + r() * 1.5, h = 4 + r() * 4; if (!B.free(x, z, R * 2, R * 2, 2)) continue;
      const c = col(); B.box(x, z, R * 1.42, R * 1.42, h, c); B.decor(x, h / 2, z, R * 2, h, R * 2, c, true, 'cyl'); B.decor(x, h + .3, z, R * 1.6, .6, R * 1.6, C.steel, true, 'cyl');
      B.stairs(x, z + R * .71 + Math.ceil(h / .33) * .55, 'n', 1.2, h, C.steel);
    }
  },
  hedges(B, cx, cz, L) {
    const hh = 2.3, g = 0x5f8a6b, s = L / 2;
    [[-s, 0, 'x'], [s, 0, 'x'], [0, -s, 'z'], [0, s, 'z']].forEach(([ox, oz, ax], i) => {
      const gap = (i % 2 ? .3 : -.3) * L;
      ax === 'x' ? (B.box(cx + ox, cz - s / 2 - gap / 2, .9, s - Math.abs(gap) / 2, hh, g), B.box(cx + ox, cz + s / 2 + 1.5, .9, s - 3, hh, g)) : (B.box(cx - s / 2 + 1.5, cz + oz, s - 3, .9, hh, g), B.box(cx + s / 2 - gap / 2, cz + oz, s - Math.abs(gap) / 2, .9, hh, g));
    });
    B.box(cx - 2, cz, 5, .9, hh, g); B.box(cx + 2, cz + 3, .9, 4, hh, g); B.decor(cx, 2.6, cz + 5, 1.4, 1.6, 1.4, C.coral, true, 'ball');
  },
  trench(B, cx, cz, L, r) {
    const bag = 0xc9b48a;
    for (let k = 0; k < 3; k++) { const z = cz - L / 3 + k * L / 3, w = L * (.5 + r() * .4); B.box(cx + (r() - .5) * 4, z, w, 1, 1.15, bag); if (r() < .6) B.box(cx + w / 2, z + 1.2, 1, 3, 1.15, bag); }
    for (let k = 0; k < 4; k++) { const x = cx + (r() - .5) * L, z = cz + (r() - .5) * L; B.box(x, z, 2, .45, .9, C.ink); B.box(x, z, .45, 2, .9, C.ink); }
  },
  overpass(B, cx, cz, L, r, col) {
    const along = r() < .5, len = L + 2, h = 4.5, c = col(), w = 4;
    const [sx, sz] = along ? [len, w] : [w, len];
    [-1, 1].forEach(s => { along ? B.box(cx + s * (len / 2 - 1), cz, 1.4, w, h, c) : B.box(cx, cz + s * (len / 2 - 1), w, 1.4, h, c); });
    B.box(cx, cz, 1.4, 1.4, h, c);
    B.slab(cx, cz, sx, sz, h + .4, .4, 0x8d99a6);
    if (along) { B.box(cx, cz - w / 2 + .1, len, .2, h + 1.4, C.ink, h + .4); B.box(cx, cz + w / 2 - .1, len, .2, h + 1.4, C.ink, h + .4); B.stairs(cx - len / 2 - Math.ceil(h / .33) * .55 + .2, cz, 'e', 2, h + .4, C.steel); }
    else { B.box(cx - w / 2 + .1, cz, .2, len, h + 1.4, C.ink, h + .4); B.box(cx + w / 2 - .1, cz, .2, len, h + 1.4, C.ink, h + .4); B.stairs(cx, cz + len / 2 + Math.ceil(h / .33) * .55 - .2, 'n', 2, h + .4, C.steel); }
  },
  keep(B, cx, cz, size, r, col, info) {
    const s = size * .45, h = 7, stone = C.stone, dark = C.dark;
    B.box(cx, cz, s, s, h, stone);
    B.box(cx - s / 2 + .3, cz, .6, s, h + 1, dark, h); B.box(cx + s / 2 - .3, cz, .6, s, h + 1, dark, h);
    B.box(cx - s / 4 - 1, cz - s / 2 + .3, s / 2 - 2, .6, h + 1, dark, h); B.box(cx + s / 4 + 1, cz - s / 2 + .3, s / 2 - 2, .6, h + 1, dark, h);
    B.box(cx - s / 4 - 1, cz + s / 2 - .3, s / 2 - 2, .6, h + 1, dark, h); B.box(cx + s / 4 + 1, cz + s / 2 - .3, s / 2 - 2, .6, h + 1, dark, h);
    B.stairs(cx, cz + s / 2 + Math.ceil(h / .33) * .55, 'n', 3, h, dark); B.stairs(cx, cz - s / 2 - Math.ceil(h / .33) * .55, 's', 3, h, dark);
    B.decor(cx, h + 3, cz, .15, 4, .15, C.ink); B.decor(cx + .9, h + 4.3, cz, 1.6, 1, .05, C.coral);
    info.roofs.push({ x: cx, z: cz, w: s, d: s, h });
  },
};
