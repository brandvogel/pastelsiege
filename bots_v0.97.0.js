import { THREE, scene, camera, world, quality, resolveCircle, lineOfSight, insideSolid, openPoint, openPointNear, rand, clamp, angDiff, tracer, beam, sparks, blood, pool, flashLight, SND, goreBurst, gibs, fountain, drip, fxSettings, explosionFx } from './world_v0.97.0.js';
import { at3 } from './audio_v0.97.0.js';

// Set by game.js: player state, whether the game is live, difficulty, damage and explosion callbacks.
export const ctx = { player: null, playing: () => false, diff: null, hurt: () => {}, explode: () => {} };
export const bots = [], shots = [];
// ---------- co-op ----------
// mates: the other players in a co-op run, as seen by the host. Each is { id, pos, vel, yaw, eyeH, crouch, eye, alive, hurt(dmg, from, head) }.
// The host's bots pick the nearest living player to chase and shoot; while a bot thinks about a friend, the game
// briefly treats that friend as "the player" (see withTarget in game.js), so the AI needs no other changes.
export const mates = [];
let NID = 0;
// ---------- anti-cheat: memory editing ----------
// A cheat script that gets hold of the player or a bot (by hooking a built-in function for a moment) could just write
// player.cash = 1e9 or bot.hp = 0. These values are guarded: every change is checked to come from the game's own files.
// The game itself always passes the check, whatever happens in play, so it can't flag someone for being good.
const OUR_FILE = /_v\d+\.\d+\.\d+\.js/;
export function fromGame() {
  if (Error.stackTraceLimit !== undefined && Error.stackTraceLimit < 12) Error.stackTraceLimit = 12; // a script can set it to 0 to hide
  const st = new Error().stack; if (typeof st !== 'string') return true; // browser without stacks: allow
  const lines = st.split('\n'), i = lines.findIndex(l => l.includes('psGuardSet')); if (i < 0) return true;
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j];
    if (/\[native code\]|\(<anonymous>\)|\(native\)/.test(l) || !/:\d+:\d+/.test(l)) continue; // built-ins like Object.assign or forEach
    return OUR_FILE.test(l);
  }
  return false; // nothing but the console called it
}
export function guardProps(o, keys, onBad) {
  for (const k of keys) {
    let v = o[k];
    Object.defineProperty(o, k, { enumerable: true, configurable: false, get() { return v; },
      set: function psGuardSet(n) { if (n !== v && !fromGame()) { onBad?.(); return; } v = n; } });
  }
}
export const botByNid = nid => bots.find(b => b.nid === nid);
// bot shots share a few geometries and materials (one per colour) instead of making new ones for every shot
const BOLT_GEO = { small: new THREE.SphereGeometry(.12, 8, 6), heavy: new THREE.SphereGeometry(.17, 8, 6), rocket: new THREE.CylinderGeometry(.08, .08, .5, 8), tail: new THREE.CylinderGeometry(.01, .05, .7, 6), tailH: new THREE.CylinderGeometry(.01, .08, .9, 6) };
const boltMats = new Map();
function boltMat(col, k, tail = false) { const key = col + '|' + k + tail; let m = boltMats.get(key); if (!m) { m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), ...(tail ? { transparent: true, opacity: .5, depthWrite: false } : {}) }); boltMats.set(key, m); } return m; }
const V3 = THREE.Vector3;

const P = { coral: 0xe07a5f, mustard: 0xf2cc8f, sage: 0x81b29a, navy: 0x3d405b, ink: 0x2b2d42, paper: 0xfffaf0, sky: 0x9cc5d6, orange: 0xff8c42, brick: 0xb5523b, steel: 0x5b7fa6, leaf: 0x6f9f6a, olive: 0x7d8a5a, red: 0xd6453d, gold: 0xd4a73a };
// weapon: blaster (dodgeable bolts), shotgun (bolt spread), sniper (laser then hitscan), rocket, none (kamikaze)
export const TYPES = {
  scout:   { name: 'Scout',   hp: 60,  speed: 7.5, color: P.sage,    dmg: 5,  rate: .45, acc: .72, pts: 100, cash: 150, scale: .88, range: [7, 14],  head: 1,  weapon: 'blaster', view: 30, blurb: 'Fast flanker with an SMG. Fragile.' },
  grunt:   { name: 'Grunt',   hp: 100, speed: 5,   color: P.coral,   dmg: 8,  rate: .75, acc: .85, pts: 150, cash: 200, scale: 1,   range: [12, 22], head: 1,  weapon: 'blaster', view: 28, blurb: 'Standard rifle trooper in a chest rig.' },
  brawler: { name: 'Brawler', hp: 120, speed: 6.8, color: P.brick,   dmg: 6,  rate: 1.1, acc: .7,  pts: 200, cash: 250, scale: 1.05, range: [2, 7],  head: 1,  weapon: 'shotgun', view: 20, pellets: 6, blurb: 'Hulking shotgunner. Rushes you.' },
  heavy:   { name: 'Heavy',   hp: 260, speed: 3.2, color: P.navy,    dmg: 15, rate: 1.25, acc: .9, pts: 300, cash: 450, scale: 1.25, range: [10, 26], head: .6, weapon: 'blaster', view: 26, helmet: true, blurb: 'Armoured tank with a rotary cannon. Helmet resists headshots.' },
  sniper:  { name: 'Sniper',  hp: 90,  speed: 3.4, color: P.mustard, dmg: 42, rate: 3.2, acc: .9,  pts: 250, cash: 350, scale: .95, range: [30, 80], head: 1,  weapon: 'sniper',  view: 55, blurb: 'Cloaked marksman. Watch for the red laser.' },
  medic:   { name: 'Medic',   hp: 90,  speed: 4.6, color: P.paper,   dmg: 5,  rate: 1,   acc: .7,  pts: 250, cash: 350, scale: .95, range: [18, 30], head: 1,  weapon: 'blaster', view: 24, heals: true, blurb: 'Heals nearby bots. Kill it first.' },
  shield:  { name: 'Shield',  hp: 160, speed: 3.6, color: P.steel,   dmg: 10, rate: .9,  acc: .82, pts: 300, cash: 400, scale: 1.1, range: [5, 13],  head: .8, weapon: 'blaster', view: 24, shield: true, blurb: 'Riot shield blocks bullets. Flank it or use explosives.' },
  drone:   { name: 'Drone',   hp: 45,  speed: 8,   color: P.mustard, dmg: 4,  rate: .35, acc: .65, pts: 150, cash: 200, scale: 1,   range: [8, 18],  head: 1,  weapon: 'blaster', view: 32, fly: 3.6, blurb: 'Hovering quadcopter. Hit the eye.' },
  bomber:  { name: 'Bomber',  hp: 55,  speed: 8.2, color: P.orange,  dmg: 0,  rate: 1,   acc: 1,   pts: 200, cash: 250, scale: .9,  range: [0, 1.5], head: 1,  weapon: 'none',    view: 20, kamikaze: true, blurb: 'Runs at you and blows up. Pop it early.' },
  boss:    { name: 'Warden',  hp: 1600, speed: 2.6, color: P.ink,    dmg: 12, rate: .18, acc: .85, pts: 2500, cash: 3000, scale: 2,  range: [12, 30], head: .6, weapon: 'boss',    view: 38, helmet: true, boss: true, blurb: 'Floor boss: twin cannons and rockets.' },
  titan:   { name: 'Titan',   hp: 9000, speed: 2.1, color: P.navy,   dmg: 14, rate: .14, acc: .86, pts: 10000, cash: 12000, scale: 3.4, range: [14, 42], head: .5, weapon: 'boss', view: 70, helmet: true, boss: true, titan: true, blurb: 'Every 10th floor. Armoured everywhere except the glowing core on its chest.' },
};
// 20 more enemies. Each reuses an existing body and brain ("base") with its own stats, colours and tricks:
// dr = damage taken multiplier (armour), regen = HP per second, blink = teleports while it can see you,
// split = breaks into two of that type when it dies, from = first wave it can show up, w = how often it shows up.
const MORE = {
  sprinter:   ['scout',   { name: 'Sprinter',   hp: 45,  speed: 10,  color: 0xa8e6cf, trim: P.ink,    dmg: 4,  rate: .3,  pts: 150, cash: 200, scale: .8,  blurb: 'Tiny, blindingly fast SMG runner. Lead your shots.' }, 5, 1.4],
  ember:      ['scout',   { name: 'Ember',      hp: 50,  speed: 8,   color: 0xff9a76, trim: P.red,    dmg: 9,  rate: .4,  acc: .8, pts: 220, cash: 280, blurb: 'Glass cannon. Hits hard, dies to a sneeze.' }, 7, 1],
  phantom:    ['scout',   { name: 'Phantom',    hp: 70,  speed: 7.5, color: 0xc3b1e1, trim: P.navy,   dmg: 6,  pts: 300, cash: 380, blink: 3.2, blurb: 'Blinks to a new spot every few seconds while it can see you.' }, 9, .8],
  trooper:    ['grunt',   { name: 'Trooper',    hp: 140, speed: 5.4, color: 0xe5989b, trim: P.navy,   dmg: 10, rate: .6,  acc: .9, pts: 220, cash: 280, blurb: 'Veteran rifleman. Better aim, faster trigger.' }, 6, 2],
  ironclad:   ['grunt',   { name: 'Ironclad',   hp: 150, speed: 4.2, color: 0x8d99ae, trim: P.gold,   dmg: 9,  pts: 320, cash: 420, dr: .55, blurb: 'Plated all over. Takes about half damage from everything.' }, 10, 1],
  splitter:   ['grunt',   { name: 'Splitter',   hp: 120, speed: 5,   color: 0xffb4a2, trim: P.mustard, dmg: 7, pts: 300, cash: 380, split: 'mite', blurb: 'Bursts into two Mites when it dies. Back off.' }, 8, 1],
  berserker:  ['brawler', { name: 'Berserker',  hp: 170, speed: 8,   color: 0xd62839, trim: P.ink,    dmg: 7,  rate: .9,  pts: 320, cash: 400, regen: 6, blurb: 'Shotgun rusher that heals while it runs. Burst it down.' }, 9, 1],
  stalker:    ['brawler', { name: 'Stalker',    hp: 130, speed: 7,   color: 0x5e548e, trim: P.coral,  dmg: 6,  pts: 340, cash: 420, blink: 2.6, blurb: 'Teleports in close, then unloads a shotgun.' }, 11, .8],
  juggernaut: ['heavy',   { name: 'Juggernaut', hp: 480, speed: 2.8, color: 0x2b2d42, trim: P.red,    dmg: 18, pts: 600, cash: 800, scale: 1.4, dr: .7, blurb: 'Bigger, angrier Heavy. Armoured and slow.' }, 12, .7],
  hydra:      ['heavy',   { name: 'Hydra',      hp: 300, speed: 3.4, color: 0x52796f, trim: P.mustard, dmg: 13, pts: 520, cash: 650, split: 'trooper', blurb: 'Splits into two Troopers when it falls.' }, 14, .6],
  marksman:   ['sniper',  { name: 'Marksman',   hp: 100, speed: 3.8, color: 0xf6bd60, trim: P.navy,   dmg: 28, rate: 2,   pts: 280, cash: 380, blurb: 'Fires faster than a Sniper, a little weaker.' }, 7, .8],
  railgunner: ['sniper',  { name: 'Railgunner', hp: 120, speed: 3,   color: 0x84a59d, trim: P.red,    dmg: 70, rate: 4.5, pts: 450, cash: 600, view: 70, blurb: 'One shot can nearly end you. Break line of sight.' }, 13, .5],
  lancer:     ['sniper',  { name: 'Lancer',     hp: 110, speed: 4.6, color: 0xf28482, trim: P.ink,    dmg: 20, rate: 1.4, pts: 300, cash: 400, range: [16, 36], view: 40, blurb: 'Mid-range laser rifle. Moves and fires a lot.' }, 9, .8],
  surgeon:    ['medic',   { name: 'Surgeon',    hp: 140, speed: 5,   color: 0xcdeac0, trim: P.red,    dmg: 7,  pts: 350, cash: 450, regen: 5, blurb: 'Heals others and itself. Top priority.' }, 10, .6],
  bulwark:    ['shield',  { name: 'Bulwark',    hp: 260, speed: 3.2, color: 0x6d6875, trim: P.gold,   dmg: 12, pts: 450, cash: 560, scale: 1.25, blurb: 'Huge riot shield and a lot more HP. Go round it.' }, 12, .7],
  hornet:     ['drone',   { name: 'Hornet',     hp: 30,  speed: 10.5, color: 0xffd60a, trim: P.ink,   dmg: 3,  rate: .25, pts: 160, cash: 200, scale: .7, blurb: 'Tiny buzzing drone. Comes in fast.' }, 6, 1.2],
  gunship:    ['drone',   { name: 'Gunship',    hp: 160, speed: 5.5, color: 0x3d5a80, trim: P.coral,  dmg: 9,  rate: .5,  pts: 420, cash: 520, scale: 1.5, fly: 5, blurb: 'Armoured flying gun platform.' }, 11, .6],
  mite:       ['bomber',  { name: 'Mite',       hp: 25,  speed: 9.5, color: 0xffc8dd, trim: P.ink,    pts: 80,  cash: 100, scale: .6, blurb: 'Little bomb on legs. Usually comes in pairs.' }, 7, .9],
  nuke:       ['bomber',  { name: 'Nuke',       hp: 140, speed: 6,   color: 0x9ef01a, trim: P.ink,    pts: 400, cash: 500, scale: 1.25, boom: 1.8, blurb: 'Slow walking bomb. Huge blast. Kill it far away.' }, 12, .5],
  revenant:   ['grunt',   { name: 'Revenant',   hp: 200, speed: 5.6, color: 0x4a4e69, trim: 0xc77dff, dmg: 11, rate: .55, acc: .92, pts: 480, cash: 600, regen: 8, dr: .8, blurb: 'Late-floor nightmare: tough, tanky and it heals.' }, 15, .6],
};
export const SPAWN_EXTRA = [];
for (const [id, [base, o, from, w]] of Object.entries(MORE)) { TYPES[id] = { ...TYPES[base], ...o, base }; SPAWN_EXTRA.push([id, from, w]); }
const VISOR = { patrol: 0x4fd1c5, suspicious: 0xffd166, hunt: 0xffb347, engage: 0xff3b30, retreat: 0xc77dff };
const NAMES = ['Bolt', 'Rivet', 'Sprocket', 'Widget', 'Gizmo', 'Pixel', 'Servo', 'Cog', 'Byte', 'Tinker', 'Nano', 'Fuse', 'Dynamo', 'Ratchet', 'Zap', 'Chip', 'Flux', 'Quark'];

// "?" and "!" markers above bots' heads
function marker(ch, col) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#2b2d42'; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill(); x.strokeStyle = col; x.lineWidth = 4; x.stroke();
  x.fillStyle = col; x.font = 'bold 38px Futura, Trebuchet MS, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 32, 34);
  return new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false });
}
const MARK = { '?': marker('?', '#f2cc8f'), '!': marker('!', '#ff3b30') };

// ---------- models ----------
// Body-part shapes are made once and shared by every bot (building fresh ones for each spawn caused hitches)
const GEO = new Map();
function shared(k, make) { let g = GEO.get(k); if (!g) { g = make(); g.userData.shared = true; GEO.set(k, g); } return g; }
// Built facing +z, feet at y = 0, before the per-type scale is applied.
function buildBody(bot) {
  const t = bot.t, type = bot.kind, g = bot.group, elite = bot.elite;
  const std = (c, r = .55, m = 0, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...x });
  // glossy toy-plastic shell, satin dark parts, polished metal joints
  // Potato skips the clear-coat and sheen layers: same look from a distance, far cheaper to draw
  const cheap = quality.level === "potato", Phys = cheap ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
  const mat = new Phys({ color: t.color, roughness: .42, metalness: .02, ...(cheap ? {} : { clearcoat: .8, clearcoatRoughness: .25, sheen: .25, sheenColor: 0xffffff }) });
  const dark = new Phys({ color: P.ink, roughness: .45, metalness: .35, ...(cheap ? {} : { clearcoat: .4, clearcoatRoughness: .4 }) }), joint = std(0x5b5e72, .28, .8);
  const trim = std(elite ? P.gold : t.trim || ({ scout: P.coral, grunt: P.ink, brawler: P.mustard, heavy: P.mustard, sniper: P.olive, medic: P.red, shield: P.mustard, bomber: P.ink, boss: P.coral, titan: P.gold })[type] || P.ink, .35, elite ? .85 : .25);
  const visor = bot.visorMat = new THREE.MeshStandardMaterial({ color: 0x222233, emissive: new THREE.Color(VISOR.patrol), emissiveIntensity: 1.8 });
  bot.mats = [mat, dark, joint, trim, visor];
  const M = (geo, m, x = 0, y = 0, z = 0, parent = g, flag) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; if (flag) o.userData[flag] = true; parent.add(o); return o; };
  const cap = (r, len, seg = 10) => shared(`c${r},${len},${seg}`, () => new THREE.CapsuleGeometry(r, len, 4, seg));
  const sph = (r, a = 16, b = 12, ...more) => shared(`s${r},${a},${b},${more}`, () => new THREE.SphereGeometry(r, a, b, ...more));
  const box = (w, h, d) => shared(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
  const cyl = (r, h, s = 14, r2 = r) => shared(`y${r},${h},${s},${r2}`, () => new THREE.CylinderGeometry(r2, r, h, s));
  const legs = bot.legs = [], arms = bot.arms = [];
  // limbs hang from a pivot so they can swing
  const leg = (s, hipX, hipY, len, r, footW = .16) => {
    const p = new THREE.Group(); p.position.set(s * hipX, hipY, 0); g.add(p);
    M(cap(r, len * .4), mat, 0, -len * .25, 0, p, 'limb');
    M(sph(r * 1.15, 10, 8), joint, 0, -len * .5, .02, p, 'limb');
    M(cap(r * .9, len * .38), dark, 0, -len * .74, 0, p, 'limb');
    M(box(footW, .07, footW * 1.7), dark, 0, -hipY + .035, .05, p, 'limb');
    legs.push(p); return p;
  };
  const arm = (s, shX, shY, len, r, fist = r * 1.25, pose = -1.3) => {
    const p = new THREE.Group(); p.position.set(s * shX, shY, 0); p.rotation.x = pose; p.rotation.z = -s * .12; g.add(p);
    M(sph(r * 1.25, 10, 8), joint, 0, 0, 0, p, 'limb');
    M(cap(r, len * .4), mat, 0, -len * .25, 0, p, 'limb');
    M(cap(r * .9, len * .38), dark, 0, -len * .72, 0, p, 'limb');
    M(sph(fist, 10, 8), dark, 0, -len, 0, p, 'limb');
    arms.push(p); return p;
  };
  // gun held out front at chest height; returns muzzle position
  const gun = (kind, x, y, z) => {
    const G = new THREE.Group(); G.position.set(x, y, z); g.add(G);
    if (kind === 'rifle') { M(box(.09, .13, .5), dark, 0, 0, .15, G); M(cyl(.025, .3), joint, 0, .02, .55, G).rotation.x = Math.PI / 2; M(box(.06, .16, .07), trim, 0, -.12, .05, G); M(box(.06, .05, .18), dark, 0, .09, .05, G); return new V3(x, y + .02, z + .72); }
    if (kind === 'smg') { M(box(.08, .12, .32), dark, 0, 0, .1, G); M(box(.05, .14, .06), trim, 0, -.12, .12, G); M(cyl(.02, .12), joint, 0, .02, .32, G).rotation.x = Math.PI / 2; return new V3(x, y + .02, z + .4); }
    if (kind === 'shotgun') { M(box(.12, .14, .45), dark, 0, 0, .15, G); [-1, 1].forEach(s => M(cyl(.035, .3), joint, s * .035, .02, .5, G).rotation.x = Math.PI / 2); M(box(.1, .06, .14), trim, 0, -.07, .34, G); return new V3(x, y + .02, z + .66); }
    if (kind === 'minigun') { M(box(.2, .2, .35), dark, 0, 0, .05, G); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; M(cyl(.022, .55), joint, Math.cos(a) * .06, Math.sin(a) * .06, .45, G).rotation.x = Math.PI / 2; } M(cyl(.1, .05, 16), trim, 0, 0, .6, G).rotation.x = Math.PI / 2; bot.spinner = G; return new V3(x, y, z + .75); }
    if (kind === 'sniper') { M(box(.07, .12, .7), dark, 0, 0, .2, G); M(cyl(.022, .55), joint, 0, .02, .8, G).rotation.x = Math.PI / 2; M(cyl(.045, .32, 14), dark, 0, .12, .2, G).rotation.x = Math.PI / 2; M(cyl(.05, .02, 14), visor, 0, .12, .37, G).rotation.x = Math.PI / 2; M(box(.06, .1, .2), mat, 0, -.03, -.2, G); return new V3(x, y + .02, z + 1.08); }
    if (kind === 'syringe') { M(box(.07, .1, .26), std(P.paper, .3), 0, 0, .08, G); M(cyl(.035, .16, 12), std(0x7dff8a, .1, 0, { transparent: true, opacity: .7, emissive: 0x2a8a40 }), 0, .07, .08, G).rotation.x = Math.PI / 2; M(cyl(.01, .14), joint, 0, 0, .28, G).rotation.x = Math.PI / 2; return new V3(x, y, z + .36); }
    if (kind === 'pistol') { M(box(.06, .1, .22), dark, 0, 0, .08, G); M(box(.05, .12, .05), trim, 0, -.09, .02, G); return new V3(x, y + .02, z + .22); }
    return new V3(x, y, z + .3);
  };
  // head: a group so it can come off cleanly; returns the group
  const headAt = (y, z = 0) => { const h = new THREE.Group(); h.position.set(0, y, z); g.add(h); bot.head = h; return h; };
  const visorBar = (h, w, y, z, hgt = .1) => M(box(w, hgt, .08), visor, 0, y, z, h, 'head');

  let muzzle;
  if (t.fly) { // ---- drone: armoured core, four ducted rotors, camera eye, belly gun
    bot.body = M(sph(.3, 20, 14), mat);
    M(new THREE.TorusGeometry(.31, .05, 8, 28), dark, 0, 0, 0).rotation.x = Math.PI / 2;
    M(sph(.2, 16, 10, 0), dark, 0, .12, 0).scale.y = .6;
    const eye = M(sph(.12, 14, 10), visor, 0, 0, .26, g, 'head'); void eye; M(new THREE.TorusGeometry(.13, .025, 8, 20), joint, 0, 0, .27);
    bot.rotors = [];
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + Math.PI / 4, ax = Math.cos(a), az = Math.sin(a);
      const armM = M(box(.42, .05, .07), dark, ax * .38, .05, az * .38); armM.rotation.y = -a;
      M(new THREE.TorusGeometry(.17, .03, 8, 24), trim, ax * .62, .07, az * .62).rotation.x = Math.PI / 2;
      const rot = new THREE.Group(); rot.position.set(ax * .62, .08, az * .62); g.add(rot);
      [0, Math.PI / 2].forEach(r => { const b = M(box(.3, .008, .045), std(P.paper, .4, 0, { transparent: true, opacity: .75 }), 0, 0, 0, rot); b.rotation.y = r; b.castShadow = false; });
      bot.rotors.push(rot);
    }
    M(box(.08, .08, .3), dark, 0, -.26, .1); M(cyl(.02, .2), joint, 0, -.26, .32).rotation.x = Math.PI / 2;
    M(cyl(.01, .25, 6), dark, 0, .3, -.1); M(sph(.03), visor, 0, .43, -.1);
    muzzle = new V3(0, -.26, .42);
  } else if (type === 'bomber') { // ---- bomber: round runner with a bomb and lit fuse
    leg(-1, .17, .55, .55, .1, .18); leg(1, .17, .55, .55, .1, .18);
    bot.body = M(sph(.48, 22, 16), mat, 0, 1.0, 0);
    [-.14, .14].forEach(y => M(new THREE.TorusGeometry(.485, .04, 6, 28), trim, 0, 1 + y, 0).rotation.x = Math.PI / 2);
    const h = headAt(1.42); M(sph(.24, 16, 10), mat, 0, 0, 0, h, 'head'); [-1, 1].forEach(s => M(cyl(.07, .06, 14), visor, s * .09, .02, .2, h, 'head').rotation.x = Math.PI / 2); M(box(.36, .04, .1), dark, 0, .02, .16, h);
    bot.bomb = M(cyl(.22, .62, 16), std(P.ink, .4, .4), 0, 1.0, -.45); bot.bomb.rotation.z = Math.PI / 2;
    [-1, 1].forEach(s => M(cyl(.225, .06, 16), std(P.mustard, .5), s * .2, 1.0, -.45).rotation.z = Math.PI / 2);
    M(cyl(.012, .22, 6), std(0xcfb58a, .9), 0, 1.3, -.45);
    bot.light = M(sph(.05), new THREE.MeshBasicMaterial({ color: 0xff3b30 }), 0, 1.42, -.45);
    arm(-1, .48, 1.15, .45, .08, .1, -2.4); arm(1, .48, 1.15, .45, .08, .1, -2.4);
    muzzle = new V3(0, 1, .5);
  } else if (type === 'boss' || type === 'titan') { // ---- Warden (and the giant Titan): walking fortress
    leg(-1, .3, .95, .95, .17, .3); leg(1, .3, .95, .95, .17, .3);
    M(box(.75, .2, .5), dark, 0, .98, 0);
    bot.body = M(box(1.1, .85, .7), mat, 0, 1.5, 0);
    M(box(1.14, .12, .74), trim, 0, 1.22, 0); M(box(.8, .5, .1), dark, 0, 1.55, .36);
    const titan = type === 'titan', core = M(sph(titan ? .2 : .14, 16, 12), new THREE.MeshStandardMaterial({ color: titan ? 0x7dffe0 : P.coral, emissive: titan ? 0x4fd1c5 : P.coral, emissiveIntensity: titan ? 3.5 : 2 }), 0, 1.55, titan ? .45 : .42); bot.core = core; core.userData.core = titan;
    if (titan) { M(new THREE.TorusGeometry(.26, .035, 8, 24), std(P.gold, .3, .9), 0, 1.55, .43); [-1, 1].forEach(s => { M(box(.18, .55, .18), trim, s * .45, 2.0, -.32); M(cyl(.06, .3, 10), dark, s * .45, 2.4, -.32); }); }
    [-1, 1].forEach(s => { M(box(.42, .3, .55), trim, s * .7, 1.85, 0); const c = M(cyl(.11, .7, 16), dark, s * .7, 2.08, .2); c.rotation.x = Math.PI / 2; M(cyl(.08, .04, 16), visor, s * .7, 2.08, .56).rotation.x = Math.PI / 2; });
    const h = headAt(2.1); M(sph(.3, 18, 10, 0), mat, 0, 0, 0, h, 'head').scale.set(1.2, .8, 1); visorBar(h, .5, .02, .27, .09);
    for (let i = 0; i < 5; i++) { const a = (i - 2) * .35; M(new THREE.ConeGeometry(.05, .22, 6), std(P.gold, .3, .9), Math.sin(a) * .26, .26, Math.cos(a) * .05 - .02, h); }
    arm(-1, .62, 1.7, .8, .14, .18, -1.4); arm(1, .62, 1.7, .8, .14, .18, -1.4);
    [-1, 1].forEach(s => { const c = M(cyl(.12, .5, 16), dark, s * .62, 1.55, .85); c.rotation.x = Math.PI / 2; });
    muzzle = new V3(.62, 1.55, 1.12);
  } else {
    // ---- humanoids: proportions per type
    const L = {
      scout: { hip: .82, leg: .82, legR: .085, tw: .27, th: .32, ty: 1.2, sh: .34, arm: .55, armR: .07, hy: 1.68, hr: .25 },
      grunt: { hip: .8, leg: .8, legR: .11, tw: .36, th: .38, ty: 1.2, sh: .44, arm: .6, armR: .09, hy: 1.82, hr: .28 },
      brawler: { hip: .7, leg: .7, legR: .14, tw: .5, th: .4, ty: 1.22, sh: .62, arm: .78, armR: .14, hy: 1.7, hr: .22 },
      heavy: { hip: .78, leg: .78, legR: .16, tw: .5, th: .45, ty: 1.3, sh: .62, arm: .66, armR: .13, hy: 1.98, hr: .26 },
      sniper: { hip: .9, leg: .9, legR: .085, tw: .26, th: .45, ty: 1.32, sh: .33, arm: .62, armR: .07, hy: 1.9, hr: .24 },
      medic: { hip: .8, leg: .8, legR: .1, tw: .34, th: .38, ty: 1.2, sh: .42, arm: .58, armR: .085, hy: 1.8, hr: .27 },
      shield: { hip: .8, leg: .8, legR: .12, tw: .4, th: .4, ty: 1.22, sh: .48, arm: .6, armR: .1, hy: 1.86, hr: .28 },
    }[type] || {};
    leg(-1, L.tw * .45, L.hip, L.leg, L.legR, type === 'heavy' ? .24 : .17); leg(1, L.tw * .45, L.hip, L.leg, L.legR, type === 'heavy' ? .24 : .17);
    M(box(L.tw * 1.6, .14, L.tw * 1.1), dark, 0, L.hip + .04, 0);                                // pelvis
    if (type === 'brawler') { bot.body = M(sph(.5, 20, 14), mat, 0, L.ty + .05, .05); bot.body.scale.set(1.25, 1, 1); M(sph(.38, 16, 10), dark, 0, L.ty - .25, .05).scale.set(1.2, .6, 1); }
    else if (type === 'heavy') { bot.body = M(box(.95, .78, .6), mat, 0, L.ty + .05, 0); M(box(.7, .5, .12), dark, 0, L.ty + .05, .32); M(box(.6, .7, .32), trim, 0, L.ty + .05, -.45); M(new THREE.TorusGeometry(.2, .035, 8, 18, Math.PI), std(P.gold, .3, .9), .35, L.ty - .1, -.2).rotation.y = Math.PI / 2; }
    else bot.body = M(cap(L.tw, L.th, 14), mat, 0, L.ty, 0);
    // shoulders
    if (type === 'heavy') [-1, 1].forEach(s => M(box(.34, .26, .42), trim, s * .6, L.ty + .38, 0));
    else if (type === 'brawler') [-1, 1].forEach(s => { M(sph(.22, 12, 8), trim, s * .62, L.ty + .32, 0); M(new THREE.ConeGeometry(.06, .2, 6), std(P.paper, .4), s * .66, L.ty + .52, 0); });
    else if (type !== 'sniper') [-1, 1].forEach(s => M(sph(L.armR * 2.1, 12, 8, 0), trim, s * L.sh, L.ty + L.th * .5 + .1, 0).scale.y = .7);
    // arms reach forward to the gun
    const pose = type === 'brawler' ? -1.1 : -1.35;
    arm(-1, L.sh, L.ty + L.th * .5 + .08, L.arm, L.armR, type === 'brawler' ? .17 : L.armR * 1.25, pose - .1);
    arm(1, L.sh, L.ty + L.th * .5 + .08, L.arm, L.armR, type === 'brawler' ? .17 : L.armR * 1.25, pose);
    // details: a neck, a belt with pouches, glowing seams (lit by the visor material, so they change colour with the
    // bot's mood: patrol, alert, attacking), and on medium graphics and up knee pads, elbow pads, toe caps and back vents
    const fine = !['potato', 'low'].includes(quality.level), hz = type === 'brawler' ? .18 : 0;
    M(cyl(L.armR * 1.05, .16, 12), joint, 0, L.hy - L.hr - .03, hz);
    M(box(L.tw * 2.1, .07, L.tw * 1.5), trim, 0, L.hip + .14, 0);
    [-1, 1].forEach(s => M(box(.09, .1, .06), dark, s * L.tw * .6, L.hip + .12, L.tw * .78));
    if (type === 'heavy') M(box(.5, .03, .02), visor, 0, L.ty + .22, .385);
    else if (type === 'brawler') M(box(.34, .035, .03), visor, 0, L.ty + .18, .56);
    else { const seam = M(new THREE.TorusGeometry(L.tw * 1.01, .012, 6, 28), visor, 0, L.ty - L.th * .1, 0); seam.rotation.x = Math.PI / 2; seam.castShadow = false; }
    if (fine) {
      legs.forEach(p => { M(box(L.legR * 2.2, .13, .06), trim, 0, -L.leg * .5, L.legR * 1.05, p, 'limb'); M(box(.17, .05, .07), trim, 0, -L.hip + .05, .2, p, 'limb'); });
      arms.forEach(p => M(sph(L.armR * 1.18, 10, 8), trim, 0, -L.arm * .5, 0, p, 'limb'));
      if (!['scout', 'medic', 'heavy', 'sniper'].includes(type)) [-1, 1].forEach(s => {
        M(cyl(.045, .1, 10), dark, s * .1, L.ty + .1, -(L.tw + .02)).rotation.x = Math.PI / 2;
        M(cyl(.03, .02, 10), visor, s * .1, L.ty + .1, -(L.tw + .075)).rotation.x = Math.PI / 2;
      });
    }
    // head
    const h = headAt(L.hy, type === 'brawler' ? .18 : 0);
    if (type === 'scout') {
      M(sph(L.hr), std(P.paper, .4), 0, 0, 0, h, 'head');
      [-1, 1].forEach(s => { M(cyl(.08, .08, 16), visor, s * .1, .03, .21, h, 'head').rotation.x = Math.PI / 2; M(new THREE.TorusGeometry(.085, .02, 6, 16), dark, s * .1, .03, .25, h); });
      M(box(.5, .03, .03), dark, 0, .03, .1, h);
      M(cyl(.012, .38, 6), dark, -.12, .3, -.05, h); M(box(.12, .07, .01), std(P.coral, .6), -.06, .45, -.05, h);
      M(new THREE.TorusGeometry(.2, .06, 8, 18), std(P.coral, .7), 0, -.22, 0, h).rotation.x = Math.PI / 2;
      const tail = M(box(.1, .35, .03), std(P.coral, .7), .08, -.4, -.2, h); tail.rotation.x = .5; bot.scarf = tail;
      M(box(.26, .3, .14), dark, 0, L.ty, -.28);
    } else if (type === 'grunt') {
      M(sph(L.hr), std(P.paper, .4), 0, 0, 0, h, 'head');
      M(sph(L.hr + .04, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), trim, 0, .03, 0, h, 'head');
      M(box(.62, .04, .5), trim, 0, .03, .04, h);
      visorBar(h, .42, -.02, .22);
      M(box(.5, .4, .14), dark, 0, L.ty + .02, .24); [-.14, 0, .14].forEach(x => M(box(.1, .12, .08), trim, x, L.ty - .08, .33));
      M(box(.12, .3, .08), dark, 0, L.ty, -.32);
    } else if (type === 'brawler') {
      M(sph(L.hr), std(P.paper, .4), 0, 0, 0, h, 'head'); visorBar(h, .32, 0, .18, .08);
      for (let i = 0; i < 4; i++) M(box(.03, .14 - i * .015, .1), trim, 0, .2 - i * .01, .06 - i * .09, h, 'head');
      M(box(.42, .1, .3), dark, 0, -.17, .02, h);
    } else if (type === 'heavy') {
      M(box(.5, .46, .5), mat, 0, 0, 0, h, 'head'); M(box(.54, .1, .54), trim, 0, .2, 0, h, 'head');
      visorBar(h, .4, .02, .26, .06); M(box(.3, .14, .1), dark, 0, -.12, .26, h);
      [-1, 1].forEach(s => M(box(.08, .2, .26), dark, s * .29, 0, 0, h));
    } else if (type === 'sniper') {
      M(sph(L.hr), std(P.ink, .5), 0, 0, 0, h, 'head');
      M(cyl(.1, .1, 18), visor, .02, .02, .22, h, 'head').rotation.x = Math.PI / 2; M(new THREE.TorusGeometry(.105, .025, 8, 18), dark, .02, .02, .27, h);
      M(sph(L.hr + .07, 16, 10, Math.PI / 2 + .75, Math.PI * 2 - 1.5, 0, Math.PI * .62), std(P.olive, .9, 0, { side: THREE.DoubleSide }), 0, .02, -.03, h, 'head'); // hood, open at the face
      const cloak = M(new THREE.ConeGeometry(.55, 1.25, 10, 1, true), std(P.olive, .95, 0, { side: THREE.DoubleSide }), 0, L.ty - .05, -.05); cloak.scale.z = .75;
      for (let i = 0; i < 14; i++) { const a = rand(0, Math.PI * 2), y = rand(.6, 1.8); M(new THREE.ConeGeometry(.05, .16, 5), std(i % 2 ? P.leaf : P.olive, .95), Math.cos(a) * (.2 + (1.8 - y) * .22), y, Math.sin(a) * (.2 + (1.8 - y) * .2) - .05).rotation.set(rand(-.6, .6), 0, rand(-.6, .6)); }
    } else if (type === 'medic') {
      M(sph(L.hr), std(P.paper, .35), 0, 0, 0, h, 'head'); visorBar(h, .4, 0, .21);
      const red = std(P.red, .5); M(box(.16, .05, .03), red, 0, .2, .17, h); M(box(.05, .16, .03), red, 0, .2, .17, h);
      M(box(.3, .08, .03), red, 0, L.ty + .05, .37); M(box(.08, .3, .03), red, 0, L.ty + .05, .37);
      M(box(.48, .55, .24), std(P.paper, .4), 0, L.ty + .05, -.38);
      const tank = M(cyl(.1, .5, 14), std(0x7dff8a, .15, 0, { emissive: 0x2a8a40, emissiveIntensity: .8, transparent: true, opacity: .85 }), .18, L.ty + .1, -.53); void tank;
      M(new THREE.TorusGeometry(.15, .02, 6, 16, Math.PI), dark, .3, L.ty + .25, -.25).rotation.y = Math.PI / 2;
      bot.halo = M(new THREE.TorusGeometry(.22, .025, 8, 28), new THREE.MeshBasicMaterial({ color: 0x7dff8a }), 0, .42, 0, h); bot.halo.rotation.x = Math.PI / 2; bot.halo.castShadow = false;
    } else if (type === 'shield') {
      M(sph(L.hr), std(P.paper, .4), 0, 0, 0, h, 'head');
      M(sph(L.hr + .05, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), mat, 0, .02, 0, h, 'head');
      visorBar(h, .36, 0, .23, .08);
      for (let i = -2; i <= 2; i++) M(box(.02, .22, .02), joint, i * .06, -.06, .3, h);
      M(box(.56, .48, .3), dark, 0, L.ty, .05);
    }
    if (elite) { const crown = M(new THREE.TorusGeometry(.2, .035, 8, 24), std(P.gold, .25, .9, { emissive: 0x6b4c10, emissiveIntensity: .6 }), 0, .44, 0, h); crown.rotation.x = Math.PI / 2; }
    // guns
    const gy = L.ty + .05, gz = L.arm * .9;
    if (type === 'scout') muzzle = gun('smg', .14, gy, gz * .8);
    else if (type === 'brawler') muzzle = gun('shotgun', .25, gy - .05, gz * .7);
    else if (type === 'heavy') muzzle = gun('minigun', .38, gy - .1, gz * .6);
    else if (type === 'sniper') muzzle = gun('sniper', .1, gy + .08, gz * .5);
    else if (type === 'medic') muzzle = gun('syringe', .2, gy, gz * .8);
    else if (type === 'shield') muzzle = gun('pistol', .35, gy, gz);
    else muzzle = gun('rifle', .16, gy, gz * .6);
    if (t.shield) {
      bot.shieldM = M(box(1.05, 1.5, .08), new THREE.MeshStandardMaterial({ color: P.sky, roughness: .2, metalness: .3, transparent: true, opacity: .7 }), -.15, 1.05, .7, g, 'shield');
      M(box(1.1, .08, .12), dark, -.15, 1.8, .7, g, 'shield'); M(box(1.1, .08, .12), dark, -.15, .3, .7, g, 'shield');
      [-1, 1].forEach(s => M(box(.06, 1.5, .12), std(P.mustard, .5), -.15 + s * .52, 1.05, .7, g, 'shield'));
      M(box(.5, .14, .1), std(0x222233, .1, .4), -.15, 1.45, .74, g, 'shield');
    }
  }
  bot.muzzle = new THREE.Object3D(); bot.muzzle.position.copy(muzzle); g.add(bot.muzzle);
}

// ---------- falling parts ----------
const debris = [];
export function updateDebris(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i], o = d.o; d.t += dt;
    if (!d.rest) {
      d.v.y -= 20 * dt; o.position.addScaledVector(d.v, dt);
      if (d.bleed && d.t < 1.6 && Math.random() < dt * 25) drip(o.position, d.base);
      o.rotation.x += d.spin.x * dt; o.rotation.y += d.spin.y * dt; o.rotation.z += d.spin.z * dt;
      if (o.position.y < d.r) {
        o.position.y = d.r; if (Math.abs(d.v.y) > 2 && d.t < 1.5 && Math.random() < .3) SND.casing();
        if (d.bleed && Math.abs(d.v.y) > 2) pool(o.position, .35, d.base);
        d.v.y *= -.3; d.v.x *= .55; d.v.z *= .55; d.spin.multiplyScalar(.5);
        if (Math.abs(d.v.y) < .6 && d.v.lengthSq() < .5) d.rest = true;
      }
      if (insideSolid(o.position)) { d.v.x *= -.3; d.v.z *= -.3; o.position.x += d.v.x * dt * 2; o.position.z += d.v.z * dt * 2; }
    }
    if (d.t > d.life - 1) o.material.opacity = Math.max(0, d.life - d.t);
    if (d.t >= d.life) { scene.remove(o); if (!o.geometry.userData.shared) o.geometry.dispose(); debris.splice(i, 1); }
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt; const f = Math.min(1, r.t / r.life), e = 1 - (1 - f) ** 2;
    r.m.scale.setScalar(r.from + (r.to - r.from) * e); r.m.material.opacity = r.op * (1 - f * f);
    if (f >= 1) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); }
  }
}
export function clearDebris() { debris.forEach(d => scene.remove(d.o)); debris.length = 0; rings.forEach(r => { scene.remove(r.m); r.m.material.dispose(); }); rings.length = 0; }

// ---------- teleport effects (Phantom / Stalker) ----------
const BLINK = 0xc77dff, BLINK_WIND = .4; // purple, and how long it charges before jumping
const ringGeo = new THREE.RingGeometry(.82, 1, 40); ringGeo.rotateX(-Math.PI / 2);
const rings = [];
function ring(x, z, color, from, to, life, op = .9) {
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(x, .06, z); m.scale.setScalar(from); m.raycast = () => {}; m.renderOrder = 3; scene.add(m);
  rings.push({ m, from, to, life, t: 0, op });
}
function blinkAway(b) { // a column of light that collapses, sparks, and a ring that sucks inwards
  const c = b.center(), base = new V3(b.pos.x, 0, b.pos.z), s = b.t.scale;
  beam(base, base.clone().setY(2.8 * s), BLINK, .3 * s, .3); sparks(c, BLINK, 16, 6); flashLight(c, BLINK, 6, 9, .25);
  ring(b.pos.x, b.pos.z, BLINK, 1.5 * s, .1, .3); at3(c, () => SND.blinkOut());
}
function blinkArrive(b) { // a bright flash, a shockwave ring on the floor, and the bot snapping back to full size
  const c = b.center(), base = new V3(b.pos.x, 0, b.pos.z), s = b.t.scale;
  b.group.position.set(b.pos.x, b.alt || 0, b.pos.z);
  beam(base, base.clone().setY(3.6 * s), BLINK, .4 * s, .45); sparks(c, BLINK, 22, 7); sparks(base.clone().setY(.2), 0xfff4ff, 8, 3);
  flashLight(c, BLINK, 9, 12, .35); ring(b.pos.x, b.pos.z, BLINK, .3, 3.2 * s, .45); ring(b.pos.x, b.pos.z, 0xfff4ff, .2, 1.8 * s, .3, .6);
  b.spawnT = .45; at3(c, () => SND.blinkIn());
}

// ---------- far-away bots ----------
// Past the LOD distance (90m on High, set per quality) a bot is drawn as one simple capsule in a single shared mesh instead of its 40-80 separate parts.
// You can still shoot it: bullets test the real (hidden) model.
// Bots also stop casting shadows past a shorter distance: each part costs a second draw for the shadow, and a small far shadow is hard to see.
const LOD_MAX = 96;
const farMesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .9, 2, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .55 }), LOD_MAX);
farMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(LOD_MAX * 3), 3);
farMesh.count = 0; farMesh.frustumCulled = false; farMesh.raycast = () => {}; scene.add(farMesh);
const _lo = new THREE.Object3D(), _lc = new THREE.Color();
function botShadows(b, on) {
  b.shadowOn = on;
  b.group.traverse(o => { if (!o.isMesh) return; if (o.userData.cs === undefined) o.userData.cs = o.castShadow; o.castShadow = on && o.userData.cs; });
}
export function updateLOD(eye, far = 90, shadowD = 40) {
  let n = 0;
  for (const b of bots) {
    if (!b.alive) continue;
    const d2 = b.pos.distanceToSquared(eye), lim = b.far ? far - 6 : far;
    b.far = d2 > lim * lim && n < LOD_MAX;
    b.group.visible = !b.far;
    if (!b.far) { const sl = b.shadowOn ? shadowD + 4 : shadowD, sh = !!shadowD && (d2 < sl * sl || !!b.t.boss); if (sh !== (b.shadowOn ?? true)) botShadows(b, sh); continue; }
    if (d2 > 340 * 340) continue;
    const s = b.t.scale;
    _lo.position.set(b.pos.x, b.alt ? b.alt : .77 * s, b.pos.z); _lo.rotation.set(0, 0, 0); _lo.scale.set(s, b.alt ? .6 : s, s); _lo.updateMatrix();
    farMesh.setMatrixAt(n, _lo.matrix); _lc.set(b.t.color); farMesh.instanceColor.setXYZ(n, _lc.r, _lc.g, _lc.b); n++;
  }
  farMesh.count = n; farMesh.instanceMatrix.needsUpdate = true; farMesh.instanceColor.needsUpdate = true;
}

export class Bot {
  constructor(type, pos, opts = {}) {
    const base = TYPES[type];
    this.elite = !!opts.elite && !base.boss;
    const t = this.t = { ...base };
    if (this.elite) { t.hp = Math.round(t.hp * 1.6); t.acc = Math.min(1, t.acc * 1.2); t.pts *= 2; t.cash = Math.round(t.cash * 1.8); t.speed *= 1.1; t.name = 'Elite ' + t.name; }
    if (opts.hpMul) t.hp = Math.round(t.hp * opts.hpMul);
    this.hpMul = opts.hpMul || 0;
    this.type = type; this.kind = base.base || type; this.nid = opts.nid || ++NID; this.puppet = !!opts.puppet;
    this.name = t.titan ? 'TITAN' : t.boss ? 'WARDEN' : NAMES[Math.floor(Math.random() * NAMES.length)] + '-' + Math.floor(rand(10, 99));
    this.pos = pos.clone(); this.pos.y = 0; this.yaw = rand(0, Math.PI * 2);
    this.hp = t.hp; this.alive = true; this.state = 'patrol';
    this.aware = 0; this.lastKnown = null; this.alert = 0; this.react = 0; this.cd = rand(.6, 1.6); this.charge = 0; this.burst = 0;
    this.strafe = Math.random() < .5 ? 1 : -1; this.strafeT = rand(.8, 2); this.avoid = Math.random() < .5 ? 1 : -1;
    this.stuckT = 0; this.lastPos = this.pos.clone(); this.retreated = false; this.dieT = 0; this.spawnT = 0; this.walk = rand(0, 6);
    this.path = null; this.pi = 0; this.repath = 0; this.losT = 0; this.canSee = false; this.sees = false; this.scanT = 0; this.healT = 0; this.fuse = 0;
    this.alt = t.fly || 0; this.flinch = 0;
    this.build();
  }
  build() {
    const t = this.t, g = this.group = new THREE.Group();
    buildBody(this);
    // health bar
    this.bar = new THREE.Group(); this.bar.position.y = t.fly ? .8 : t.boss ? 2.7 : 2.55;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, .14), new THREE.MeshBasicMaterial({ color: P.ink, depthTest: false, transparent: true }));
    this.fg = new THREE.Mesh(new THREE.PlaneGeometry(.94, .08), new THREE.MeshBasicMaterial({ color: this.elite ? 0xd4a73a : P.coral, depthTest: false, transparent: true })); this.fg.position.z = .001;
    this.fgLag = new THREE.Mesh(new THREE.PlaneGeometry(.94, .08), new THREE.MeshBasicMaterial({ color: 0xfffaf0, depthTest: false, transparent: true })); this.fgLag.position.z = .0005; this.lagF = 1;
    bg.renderOrder = this.fgLag.renderOrder = this.fg.renderOrder = 6;
    bg.userData.ui = this.fg.userData.ui = this.fgLag.userData.ui = true; this.bar.add(bg, this.fgLag, this.fg); this.bar.visible = false; g.add(this.bar);
    this.mark = new THREE.Sprite(MARK['?']); this.mark.scale.setScalar(.45); this.mark.position.y = t.fly ? 1.1 : t.boss ? 3.05 : 2.9; this.mark.visible = false; this.mark.userData.ui = true; this.mark.renderOrder = 7; this.mark.raycast = () => {}; g.add(this.mark);
    if (t.weapon === 'sniper') {
      this.laser = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]), new THREE.LineBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: .8 }));
      this.laser.frustumCulled = false; this.laser.visible = false; scene.add(this.laser);
    }
    g.scale.setScalar(.01); g.userData.bot = this; g.position.copy(this.pos); scene.add(g);
    // teleport-in: a column of light where the bot appears
    if (ctx.playing()) { const base = new V3(this.pos.x, 0, this.pos.z); beam(base, base.clone().setY(t.fly ? 5 : 3.5 * t.scale), t.boss ? 0xe07a5f : 0x4fd1c5, .35 * t.scale, .7); sparks(base.clone().setY(.4), t.color, 8, 3); }
  }
  remove() { scene.remove(this.group); if (this.laser) scene.remove(this.laser); }
  eye() { return new V3(this.pos.x, this.alt ? this.alt : 1.75 * this.t.scale, this.pos.z); }
  center() { return new V3(this.pos.x, this.alt ? this.alt : this.t.scale * 1.1, this.pos.z); }
  setState(s) { if (this.state !== s) { this.state = s; this.visorMat.emissive.set(VISOR[s]); } }
  // A sound at p. err = how far off their guess is. Bots that hear it go and investigate; they don't magically know where you are.
  noise(p, err = 4, strength = .5) {
    if (!this.alive || this.state === 'engage') return;
    this.lastKnown = new V3(p.x + rand(-err, err), 0, p.z + rand(-err, err));
    this.alert = Math.max(this.alert, 5); this.aware = Math.max(this.aware, Math.min(.85, this.aware + strength)); this.repath = 0;
  }
  goTo(p) { this.path = world.nav.findPath(this.pos, p); this.pi = 0; this.goal = p.clone(); this.repath = rand(1.2, 2); }
  follow() {
    while (this.path && this.pi < this.path.length) {
      const wp = this.path[this.pi], dx = wp.x - this.pos.x, dz = wp.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d < .8) { this.pi++; continue; }
      return new V3(dx / d, 0, dz / d);
    }
    return null;
  }
  setBar() { const f = Math.max(this.hp, 0) / this.t.hp; this.fg.scale.x = Math.max(.001, f); this.fg.position.x = -(1 - f) * .47; }
  // hit = { dir, head, force, blast, point }
  damage(n, hit = {}) {
    // co-op friend: their copy of a bot only shows the hit; the host works out the damage
    if (this.puppet) { this.hitFlash = .09; if (hit.point && !this.alt) blood(hit.point, hit.dir || new V3(0, 0, 1), Math.round(clamp(n / 6, 3, 14)), this.t.color); ctx.puppetHit?.(this, n, hit); return false; }
    if (this.t.dr) n *= this.t.dr;
    this.hp -= n; this.bar.visible = true; this.setBar(); this.flinch = Math.min(1, this.flinch + .5 + n / 80);
    this.hitFlash = .09;
    if (hit.point && !this.alt) blood(hit.point, hit.dir || new V3(0, 0, 1), Math.round(clamp(n / 6, 3, 14)) + (hit.head ? 6 : 0), this.t.color);
    else if (hit.point) sparks(hit.point, 0xffd166, 6, 4);
    if (this.hp <= 0) { this.die(hit); return true; }
    // getting shot tells them roughly where it came from, not exactly
    if (this.state !== 'engage') { this.noise(ctx.player.pos, 3, .7); this.yaw += angDiff(this.yaw, Math.atan2(ctx.player.pos.x - this.pos.x, ctx.player.pos.z - this.pos.z)) * .7; }
    if (this.react > .2) this.react = .2;
    if (this.hp < this.t.hp * .35 && !this.retreated && !['heavy', 'boss', 'titan', 'bomber', 'shield'].includes(this.kind)) this.startRetreat();
    return false;
  }
  die(hit = {}) {
    ctx.onDie?.(this, hit);
    this.alive = false; this.dieT = 4.2; this.bar.visible = this.mark.visible = false; this.visorMat.emissive.set(0x222222); this.mats[0].emissive.setRGB(0, 0, 0); this.mats[1].emissive.setRGB(0, 0, 0); if (this.laser) this.laser.visible = false;
    const dir = (hit.dir || new V3(this.pos.x - camera.position.x, 0, this.pos.z - camera.position.z)).clone().setY(0).normalize();
    const X = fxSettings.gore !== "normal", force = (hit.blast ? 11 : hit.force ?? 4) * (X ? 1.5 : 1);
    if (!this.alt) {
      const power = (hit.blast ? 1.7 : hit.head ? 1.15 : .85) * this.t.scale * (this.t.boss ? 1.8 : 1);
      goreBurst(this.center(), dir, this.t.color, power, this.t.color); blood(this.center(), dir, hit.head ? 22 : 14, this.t.color);
      pool(this.pos, (.9 + (hit.head ? .3 : 0) + (hit.blast ? .6 : 0)) * this.t.scale, this.t.color);
      if (hit.head) gibs(this.eye(), dir, X ? 10 : 3, this.t.color, 7, this.t.color);  // the head goes everywhere
    } else gibs(this.center(), dir, 6, 0x2b2d42, 5, this.t.color);
    this.shatter(dir, force, !!hit.head);
    if (this.t.split && !this.puppet && TYPES[this.t.split]) for (let i = 0; i < 2; i++) {
      const a = rand(0, Math.PI * 2), p = this.pos.clone().add(new V3(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6));
      const kid = new Bot(this.t.split, world.nav.free(p.x, p.z) ? p : this.pos.clone(), { hpMul: this.hpMul || 1 });
      kid.aware = 1; kid.lastKnown = ctx.player.pos.clone(); kid.alert = 6; kid.setState('hunt'); bots.push(kid);
    }
    at3(this.center(), () => SND.shatter());
    flashLight(this.center(), 0xffd166, 8, 6, .12); sparks(this.center(), 0xffd166, 10, 5);
  }
  // Break the robot into its parts and throw them. Headshots pop the head clean off.
  shatter(dir, force, headPop) {
    const g = this.group, c = this.center(); g.updateMatrixWorld(true);
    for (const m of this.mats) { m.transparent = true; m.needsUpdate = true; }
    const parts = []; g.traverse(o => { if (o.isMesh && !o.userData.ui) parts.push(o); }); let torso = null;
    for (const o of parts) {
      const isHead = this.head && (o.parent === this.head);
      scene.attach(o);
      if (!o.material.transparent) { o.material = o.material.clone(); o.material.transparent = true; }
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const r = Math.max(.04, o.geometry.boundingSphere.radius * o.scale.x * .5);
      const away = o.position.clone().sub(c); away.y *= .4; if (away.lengthSq() < 1e-4) away.set(rand(-1, 1), 0, rand(-1, 1)); away.normalize();
      const v = dir.clone().multiplyScalar(force * rand(.4, 1.1)).addScaledVector(away, rand(1, 3)).add(new V3(0, rand(1.5, 4.5), 0));
      if (isHead && headPop) v.add(new V3(0, 6, 0)).addScaledVector(dir, 3);
      o.castShadow = false;
      if (!isHead && (!torso || r > torso.r)) torso = { o, r };
      debris.push({ o, v, spin: new V3(rand(-9, 9), rand(-9, 9), rand(-9, 9)), r, t: 0, life: rand(3.2, 4.2), rest: false, bleed: !this.alt && Math.random() < .45, base: this.t.color });
    }
    scene.remove(g);
    // headshot kills leave the body spraying like a cartoon fountain
    if (headPop && torso && !this.alt) fountain(torso.o.position, this.t.color, 2, torso.o, 140);
  }
  // Phantom / Stalker: pop out of sight and reappear somewhere near you. A shrinking ring marks where it will land and
  // the bot stretches and shimmers for a moment first, so you can see it coming (and pre-aim the ring if you're quick).
  doBlink() {
    this.blinkT = rand(this.t.blink * .7, this.t.blink * 1.3);
    const pp = ctx.player.pos, near = this.kind === 'brawler';
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), r = near ? rand(5, 9) : rand(10, 22), x = pp.x + Math.cos(a) * r, z = pp.z + Math.sin(a) * r;
      if (!world.nav.free(x, z)) continue;
      this.blinkTo = { x, z, t: BLINK_WIND }; ring(x, z, BLINK, 1.8 * this.t.scale, .35 * this.t.scale, BLINK_WIND + .05, .75);
      at3(this.center(), () => SND.blinkCharge()); return;
    }
  }
  blinkStep(dt) {
    const B = this.blinkTo, s = this.t.scale; B.t -= dt;
    const k = 1 - Math.max(0, B.t) / BLINK_WIND, wob = Math.sin(B.t * 90) * .08 * k; // stretches up and thins out as it charges
    this.group.scale.set(s * (1 - k * .35 + wob), s * (1 + k * .45), s * (1 - k * .35 - wob));
    if (Math.random() < dt * 35) sparks(this.center(), BLINK, 1, 2.5);
    if (B.t > 0) return;
    this.blinkTo = null; this.group.scale.setScalar(s);
    if (!world.nav.free(B.x, B.z)) return;
    blinkAway(this); this.pos.set(B.x, 0, B.z); this.path = null; this.repath = 0; blinkArrive(this);
  }
  startRetreat() {
    this.retreated = true;
    for (let i = 0; i < 16; i++) {
      const a = rand(0, Math.PI * 2), r = rand(6, 16), p = new V3(this.pos.x + Math.cos(a) * r, 1.6, this.pos.z + Math.sin(a) * r);
      if (!world.nav.free(p.x, p.z)) continue;
      if (!lineOfSight(p, camera.position)) { this.goTo(p); this.retreatT = 4; this.setState('retreat'); return; }
    }
  }
  // Squad call-out: allies close by who can see this bot learn where it saw you.
  callOut() {
    for (const o of bots) if (o !== this && o.alive && o.state !== 'engage' && o.pos.distanceTo(this.pos) < 20 && lineOfSight(o.eye(), this.eye())) o.noise(this.lastKnown, 2, .6);
  }
  update(dt) {
    const g = this.group, t = this.t;
    if (!this.alive) { if (this.blinkTo) { this.blinkTo = null; g.scale.setScalar(t.scale); } this.dieT -= dt; return this.dieT > 0; }
    if (this.spawnT < 1) { this.spawnT = Math.min(1, this.spawnT + dt * 2.5); g.scale.setScalar(t.scale * (1 - Math.pow(1 - this.spawnT, 3))); }
    const pl = ctx.player, pe = camera.position, toP = new V3(pe.x - this.pos.x, 0, pe.z - this.pos.z), dist = toP.length();
    const facing = angDiff(this.yaw, Math.atan2(toP.x, toP.z));
    this.losT -= dt; this.repath -= dt;
    // ---- vision: needs line of sight, inside the view cone, within range ----
    if (this.losT <= 0) {
      this.losT = rand(.08, .16);
      const relaxed = this.state === 'patrol';
      const cone = relaxed ? .95 : this.state === 'suspicious' ? 1.25 : 1.6;   // half-angle in radians
      const near = dist < 3.5; // you can't sneak right up behind them
      const reach = t.view * (this.state === 'engage' ? 1.5 : this.state === 'hunt' ? 1.2 : 1) * (pl.crouch > .5 && relaxed ? .6 : 1); // short-sighted: once locked on they can track you a bit further
      this.canSee = ctx.playing() && !ctx.ghost && dist < reach && (Math.abs(facing) < cone || near) && lineOfSight(this.eye(), pe);
    }
    // awareness fills while they can see you: faster up close, in the open, or when you move; slower if you're crouched or far
    if (this.canSee) {
      const moving = Math.hypot(pl.vel.x, pl.vel.z) > 1.5, close = 1 - dist / t.view;
      let rate = (.06 + 2.6 * Math.max(0, close) ** 2) * (moving ? 1.5 : .7) * (pl.crouch > .5 ? .5 : 1) * (this.state === 'patrol' ? 1 : 2.2) / ctx.diff.react;
      if (dist < 6) rate *= 3;
      this.aware = Math.min(1, this.aware + rate * dt);
    } else if (this.state !== 'engage') this.aware = Math.max(0, this.aware - dt * (this.alert > 0 ? .05 : .18));
    const wasSeeing = this.sees;
    this.sees = this.canSee && this.aware >= 1;
    if (this.sees) {
      if (!wasSeeing) { const pre = this.lostT > 0 && this.lostT < 2.5 && (ctx.diff.skill || 0) > .45; this.react = rand(.28, .6) * ctx.diff.react * (pre ? .35 : 1); this.flagT = 1.2; }
      this.lastKnown = pl.pos.clone(); this.alert = 6;
      if (!wasSeeing) this.callOut();
    } else {
      if (wasSeeing) { this.aware = .9; this.lostT = 0; } // lost sight: keep hunting the last place they saw you
      this.lostT = (this.lostT ?? 9) + dt;
      this.alert -= dt;
    }
    // marker
    this.flagT = (this.flagT || 0) - dt;
    if (this.flagT > 0) { this.mark.material = MARK['!']; this.mark.visible = true; }
    else if (!this.sees && this.aware > .15 && ctx.playing()) { this.mark.material = MARK['?']; this.mark.visible = true; }
    else this.mark.visible = false;

    let move = null, speed = t.speed, faceYaw = null;
    if (t.heals) this.heal(dt);
    if (t.regen && this.hp < t.hp) { this.hp = Math.min(t.hp, this.hp + t.regen * dt); if (this.bar.visible) this.setBar(); }
    if (this.blinkTo) this.blinkStep(dt);
    else if (t.blink && this.sees && (this.blinkT = (this.blinkT ?? rand(1.5, t.blink)) - dt) <= 0) this.doBlink();
    if (this.state === 'retreat') {
      this.retreatT -= dt; move = this.follow(); speed *= 1.3;
      if (!move || this.retreatT <= 0) this.setState(this.sees ? 'engage' : 'hunt');
    } else if (this.sees) {
      this.setState('engage'); faceYaw = Math.atan2(toP.x, toP.z);
      const [nearR, farR] = t.range, dir = toP.clone().normalize(), side = new V3(dir.z, 0, -dir.x);
      const sk = ctx.diff.skill || 0, canStrafe = !['sniper', 'boss'].includes(t.weapon) && !t.shield && !t.kamikaze;
      move = new V3();
      if (dist > farR) move.add(dir); else if (dist < nearR) move.sub(dir);
      // strafing: lazy side-steps at low skill, rapid A-D spam at high skill
      this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe *= -1; this.strafeT = sk > .6 ? rand(.16, .5) * (1.6 - sk) : rand(.7, 2.2) * (1 - sk * .4); }
      // counter-strafe: good bots stop dead for the instant they fire, so their shot is accurate
      const stopping = sk > .4 && this.cd < .12 + sk * .1 && this.react <= .05;
      if (canStrafe && !stopping) move.addScaledVector(side, this.strafe * (.9 + sk * .5));
      if (stopping && canStrafe) move.multiplyScalar(.15);
      // crouch-peek: top bots duck while shooting
      if (canStrafe && sk > .68 && Math.random() < dt * 1.5) this.crouchT = rand(.25, .7);
      speed *= t.kamikaze ? 1.15 : t.shield ? .9 : .65 + sk * .45; this.react -= dt; this.cd -= dt;
      if (t.kamikaze) this.kamikaze(dt, dist);
      else if (t.weapon === 'sniper') this.sniperAim(dt, Math.abs(facing) < .3);
      else if (this.react <= 0 && this.cd <= 0 && Math.abs(facing) < .35) this.fireWeapon(dist);
      if (move.lengthSq() < .01) move = null;
    } else if (this.alert > 0 && this.lastKnown) {
      this.setState(this.aware > .5 ? 'hunt' : 'suspicious');
      if (this.repath <= 0 || (this.path && this.goal.distanceTo(this.lastKnown) > 4)) this.goTo(this.lastKnown);
      move = this.follow(); if (this.state === 'suspicious') speed *= .6;
      if (!move) { this.scanT += dt; this.yaw += dt * 1.8; if (this.scanT > 3) { this.alert = 0; this.lastKnown = null; this.scanT = 0; } }
    } else if (this.aware > .25 && this.canSee) {
      // half-noticed something: stop and look towards it
      this.setState('suspicious'); faceYaw = Math.atan2(toP.x, toP.z);
    } else {
      this.setState('patrol');
      move = this.follow();
      if (!move && this.repath <= 0) this.goTo(t.heals ? this.allySpot() : openPointNear(this.pos, 40));
      speed *= .5;
    }
    if (this.laser && (!this.sees || this.state !== 'engage')) { this.laser.visible = false; this.charge = Math.max(0, this.charge - dt); }

    if (this.slowT > 0) { this.slowT -= dt; speed *= 1 - (this.slowK || .5); } // slowed by a Cryo mutation
    if (move) {
      const probe = new V3(this.pos.x + move.x * 1.4, this.alt ? this.alt : .5, this.pos.z + move.z * 1.4);
      if (this.state === 'engage' && insideSolid(probe, .5)) move.set(move.z * this.avoid, 0, -move.x * this.avoid);
      for (const o of bots) if (o !== this && o.alive && !!o.alt === !!this.alt) {
        const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d = Math.hypot(dx, dz);
        if (d < 1.8 * Math.max(t.scale, o.t.scale) && d > .01) { move.x += dx / d * .7; move.z += dz / d * .7; }
      }
      move.normalize(); this.pos.addScaledVector(move, speed * dt * (1 - this.flinch * .5 * (1 - (ctx.diff.skill || 0) * .7)));
      // footsteps you can place in 3D: heavier bots thud louder
      if (!this.alt && dist < 30 && ctx.playing() && (this.stepT = (this.stepT || 0) - dt * speed) <= 0) { this.stepT = 1.5 * t.scale; const h = this.kind === "heavy" || t.boss ? 1 : 0; at3(new V3(this.pos.x, .1, this.pos.z), () => SND.botStep(h)); }
      if (faceYaw === null) faceYaw = Math.atan2(move.x, move.z);
      this.walk += dt * speed * 1.6;
    }
    const S = world.size - 1; this.pos.x = clamp(this.pos.x, -S, S); this.pos.z = clamp(this.pos.z, -S, S);
    resolveCircle(this.pos, .5 * t.scale, this.alt ? this.alt - .4 : 0);
    this.stuckT += dt;
    if (this.stuckT > 1) {
      if (move && this.pos.distanceTo(this.lastPos) < .5) { this.avoid *= -1; this.strafe *= -1; this.path = null; this.repath = 0; }
      this.lastPos.copy(this.pos); this.stuckT = 0;
    }
    if (faceYaw !== null) this.yaw += angDiff(this.yaw, faceYaw) * Math.min(1, dt * (this.state === 'engage' ? 7 : 4));
    // ---- animation ----
    this.flinch = Math.max(0, this.flinch - dt * 3);
    // brief white flash on the body when hit
    if (this.hitFlash > 0 || this.flashOn) { this.hitFlash = (this.hitFlash || 0) - dt; const f = Math.max(0, this.hitFlash) / .09; this.flashOn = f > 0; this.mats[0].emissive.setRGB(f * .9, f * .9, f * .9); this.mats[1].emissive.setRGB(f * .5, f * .5, f * .5); }
    const sw = Math.sin(this.walk), moving = !!move;
    if (this.alt) { g.position.set(this.pos.x, this.alt + Math.sin(this.walk * .5 + this.yaw) * .15, this.pos.z); this.rotors.forEach((r, i) => r.rotation.y += dt * 45 * (i % 2 ? 1 : -1)); g.rotation.x = moving ? .18 : 0; }
    else {
      g.position.set(this.pos.x, Math.abs(Math.cos(this.walk)) * .05 * (moving ? 1 : 0), this.pos.z);
      const stride = this.t.boss ? .45 : this.kind === "heavy" ? .5 : .75;
      this.legs.forEach((l, i) => l.rotation.x = (moving ? sw * stride : 0) * (i ? 1 : -1));
      if (this.body) this.body.rotation.z = sw * .04 * (moving ? 1 : 0);
      g.rotation.x = -this.flinch * .15;
      this.crouchT = (this.crouchT || 0) - dt; this.crouchK = (this.crouchK || 0) + ((this.crouchT > 0 ? 1 : 0) - (this.crouchK || 0)) * Math.min(1, dt * 14);
      if (this.spawnT >= 1 && !this.blinkTo) { g.scale.set(t.scale, t.scale * (1 - this.crouchK * .22), t.scale); }
      if (this.head) this.head.rotation.x = -this.flinch * .4;
      if (this.scarf) this.scarf.rotation.x = .5 + (moving ? .6 + sw * .15 : 0);
    }
    if (this.spinner && this.state === 'engage') this.spinner.rotation.z += dt * 20;
    if (this.halo) this.halo.rotation.z += dt * 2;
    if (this.core) this.core.material.emissiveIntensity = 1.6 + Math.sin(performance.now() / 200) * .6;
    g.rotation.y = this.yaw;
    if (this.light) this.light.visible = this.fuse > 0 ? Math.sin(this.fuse * 40) > 0 : Math.sin(performance.now() / 300) > 0;
    if (this.bar.visible) {
      this.bar.quaternion.copy(camera.quaternion).premultiply(g.quaternion.clone().invert());
      const f = Math.max(this.hp, 0) / t.hp; this.lagF += (f - this.lagF) * Math.min(1, dt * 3);
      this.fgLag.scale.x = Math.max(.001, this.lagF); this.fgLag.position.x = -(1 - this.lagF) * .47;
    }
    return true;
  }
  allySpot() { const a = bots.find(o => o !== this && o.alive && !o.t.heals); return a ? a.pos.clone().add(new V3(rand(-4, 4), 0, rand(-4, 4))) : openPoint(); }
  heal(dt) {
    this.healT -= dt; if (this.healT > 0) return; this.healT = 1.2;
    for (const o of bots) if (o.alive && o !== this && o.hp < o.t.hp && o.pos.distanceTo(this.pos) < 9) {
      o.hp = Math.min(o.t.hp, o.hp + 18); o.setBar();
      sparks(o.center().add(new V3(0, .6, 0)), 0x81b29a, 4, 2);
    }
  }
  kamikaze(dt, dist) {
    if (this.fuse > 0) {
      this.fuse -= dt;
      if (this.fuse <= 0) { const c = this.center(); this.hp = 0; this.die({ blast: true }); this.dieT = 4; ctx.explode(c, 5.5 * (this.t.boom || 1), 95 * Math.sqrt(this.t.boom || 1), { from: this });
        for (const m of mates) if (m.alive && m.pos.distanceTo(c) < 5.5 * (this.t.boom || 1)) m.hurt(95 * Math.sqrt(this.t.boom || 1) * (1 - m.pos.distanceTo(c) / (6 * (this.t.boom || 1))) * ctx.diff.dmg, this.pos, false); }
      return;
    }
    if (dist < 2.6) { this.fuse = .55; at3(this.center(), () => SND.fuse()); }
  }
  chest() { const p = camera.position.clone(); p.y -= ctx.player.eyeH * .4; return p; }
  sniperAim(dt, facing) {
    if (!facing || this.react > 0 || this.cd > 0) { this.laser.visible = false; return; }
    const from = this.muzzle.getWorldPosition(new V3());
    if (!this.aim) { this.snHead = Math.random() < (ctx.diff.head || 0); this.aim = this.chest().add(new V3(rand(-2, 2), rand(-1, 1), rand(-2, 2)).multiplyScalar(1.2 - (ctx.diff.skill || 0) * .8)); }
    const want = this.snHead ? camera.position.clone().add(new V3(0, -.05, 0)) : this.chest();
    this.aim.lerp(want, Math.min(1, dt * 2.2 * ctx.diff.acc * (1 + (ctx.diff.skill || 0) * 1.5)));
    this.charge += dt;
    const end = this.aim.clone().sub(from).normalize().multiplyScalar(from.distanceTo(this.aim) + 3).add(from);
    const pos = this.laser.geometry.attributes.position; pos.setXYZ(0, from.x, from.y, from.z); pos.setXYZ(1, end.x, end.y, end.z); pos.needsUpdate = true;
    this.laser.visible = true; this.laser.material.opacity = .35 + this.charge * .5;
    if (this.charge >= 1.5 * ctx.diff.react) {
      const pl = ctx.player, moving = Math.hypot(pl.vel.x, pl.vel.z) > 2;
      const chance = this.t.acc * ctx.diff.acc * (moving ? .45 + (ctx.diff.lead || 0) * .4 : 1) * (pl.crouch > .5 ? .8 : 1);
      const hit = Math.random() < chance && lineOfSight(from, camera.position), tgt = hit ? this.chest() : this.aim.clone().add(new V3(rand(-1.2, 1.2), rand(-.5, 1), rand(-1.2, 1.2)));
      tracer(from, tgt.clone().sub(from).multiplyScalar(1.6).add(from), 0xff4b4b, .25);
      if (hit) ctx.hurt(this.t.dmg * ctx.diff.dmg * (this.snHead ? 1.6 : 1), this.pos, this.snHead);
      at3(from, () => SND.snipe(0, from.distanceTo(camera.position)), !lineOfSight(from, camera.position));
      this.charge = 0; this.cd = this.t.rate * rand(.85, 1.2); this.aim = null; this.laser.visible = false;
    }
  }
  // Where a skilled bot aims: your chest or (more often as they improve) your head, led ahead of where you're moving.
  aimPoint(from, speed) {
    const pl = ctx.player, d = ctx.diff, head = Math.random() < (d.head || 0);
    const p = head ? camera.position.clone().add(new V3(0, -.06, 0)) : this.chest();
    if (d.lead > 0 && speed) { const tt = from.distanceTo(p) / speed; p.x += pl.vel.x * tt * d.lead; p.z += pl.vel.z * tt * d.lead; p.y += Math.max(-4, pl.vel.y) * tt * d.lead * .5; }
    return p;
  }
  pan() { const pl = ctx.player; return clamp(-Math.sin(angDiff(pl.yaw, Math.atan2(-(this.pos.x - pl.pos.x), -(this.pos.z - pl.pos.z)))), -1, 1) * .8; }
  fireWeapon(dist) {
    const t = this.t;
    if (t.weapon === 'shotgun') { if (dist < 14) { for (let i = 0; i < t.pellets; i++) this.bolt(.11, { quiet: i > 0 }); this.cd = t.rate * rand(.85, 1.2); } return; }
    if (t.weapon === 'boss') {
      // alternates a 6-round burst with a rocket
      if (this.burst <= 0 && Math.random() < .25) { this.bolt(0, { rocket: true }); this.cd = 1.6; return; }
      this.bolt(); this.burst = (this.burst || 6) - 1; this.cd = this.burst <= 0 ? 1.3 : t.rate; if (this.burst <= 0) this.burst = 0;
      return;
    }
    this.bolt(); this.cd = t.rate * rand(.8, 1.3) * (ctx.diff.fire || 1);
  }
  bolt(extraSpread = 0, o = {}) {
    const from = this.muzzle.getWorldPosition(new V3()), pl = ctx.player, d = ctx.diff, sk = d.skill || 0;
    const heavy = this.kind === "heavy" || o.rocket, speed = (o.rocket ? 22 : heavy ? 30 : 42) * (o.rocket ? 1 + sk * .5 : d.boltSpeed || 1);
    const aim = this.aimPoint(from, speed), dist = from.distanceTo(aim), moving = Math.hypot(pl.vel.x, pl.vel.z) > 1;
    // aim error: shrinks with skill; moving targets are harder unless they lead you; they're less accurate while running themselves
    const acc = clamp(this.t.acc * d.acc, 0, .97), selfMove = this.strafeT > 0 && !(sk > .4 && this.cd < .3) ? .02 * (1 - sk) : 0;
    const err = (1 - acc) * .22 + (moving ? .035 * (1 - (d.lead || 0) * .8) : 0) + dist * .0035 * (1 - sk * .6) + (pl.crouch > .5 ? .01 : 0) + selfMove + extraSpread;
    const dir = aim.sub(from).normalize();
    dir.x += rand(-err, err); dir.y += rand(-err, err) * .6; dir.z += rand(-err, err); dir.normalize();
    const col = o.rocket ? 0xff8c42 : heavy ? 0xff6b3d : this.elite ? 0xffd166 : sk > .84 ? 0xff2a6b : 0xff3b6b;
    const m = new THREE.Mesh(o.rocket ? BOLT_GEO.rocket : heavy ? BOLT_GEO.heavy : BOLT_GEO.small, boltMat(col, 3));
    if (o.rocket) m.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
    // glowing streak behind the bolt
    if (!o.rocket) { // glowing streak trailing behind (cone pointing back along the flight path)
      const len = heavy ? .9 : .7, tail = new THREE.Mesh(heavy ? BOLT_GEO.tailH : BOLT_GEO.tail, boltMat(col, 2.2, true));
      tail.position.copy(dir).multiplyScalar(-len / 2); tail.quaternion.setFromUnitVectors(new V3(0, -1, 0), dir); m.add(tail);
    }
    m.position.copy(from); scene.add(m);
    shots.push({ mesh: m, vel: dir.multiplyScalar(speed), dmg: this.t.dmg * ctx.diff.dmg, life: 3, from: this, rocket: !!o.rocket, tp: ctx.mate || null });
    ctx.onBolt?.(from, dir, col, !!o.rocket, heavy);
    if (!o.quiet) at3(from, () => SND.bot(0, dist, this.kind === "heavy" ? 'heavy' : this.t.boss ? 'boss' : this.t.weapon === 'shotgun' ? 'shotgun' : ''), !lineOfSight(from, camera.position));
  }
}
// bot health is guarded the same way (kept out of sight in a WeakMap, so there's no hidden copy to edit instead)
const BOT_HP = new WeakMap();
Object.defineProperty(Bot.prototype, 'hp', { configurable: false, enumerable: true, get() { return BOT_HP.get(this) ?? 0; },
  set: function psGuardSet(n) { const v = BOT_HP.get(this); if (v !== undefined && n !== v && !fromGame()) { ctx.onCheat?.('memory editing'); return; } BOT_HP.set(this, n); } });

export function updateShots(dt) {
  const me = ctx.player, myChest = camera.position.clone(); myChest.y -= me.eyeH * .4;
  const seg = new THREE.Line3(), cp = new V3(), mc = new V3();
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i], prev = s.mesh.position.clone();
    s.mesh.position.addScaledVector(s.vel, dt); s.life -= dt;
    const p = s.mesh.position;
    if (s.rocket && Math.random() < .5) sparks(prev, 0xffb347, 1, 1);
    // who this shot can hurt: you, or (on the host) the friend it was fired at. Copies of the host's shots
    // shown on a friend's screen (s.vis) can't hurt anyone; the host decides who gets hit.
    const T = s.tp, pl = T || me, chest = T ? mc.copy(T.eye).setY(T.eye.y - T.eyeH * .4) : myChest, half = pl.eyeH * .55;
    seg.set(prev, p); seg.closestPointToPoint(chest, true, cp);
    const hitPlayer = !s.vis && (!T || T.alive) && Math.hypot(cp.x - chest.x, cp.z - chest.z) < .5 && Math.abs(cp.y - chest.y) < half;
    // near-miss whizz (only for shots near you)
    if (!T && !hitPlayer && !s.whizz && cp.distanceTo(chest) < 1.6 && ctx.playing()) { s.whizz = true; ctx.whizz?.(s); }
    const blocked = s.life <= 0 || p.y < 0 || insideSolid(p);
    if (s.rocket && !s.vis && (hitPlayer || blocked)) {
      if (T) { if (hitPlayer || T.pos.distanceTo(prev) < 4) T.hurt(55 * ctx.diff.dmg, s.from.pos, false); explosionFx(prev, 4); }
      else ctx.explode(hitPlayer ? cp.clone() : prev, 4, 55 * ctx.diff.dmg, { from: s.from, noBots: true });
    }
    else if (hitPlayer) { const head = cp.y > (T ? T.eye.y : camera.position.y) - .24; (T ? T.hurt : ctx.hurt)(s.dmg * (head ? 1.6 : 1), s.from.pos, head); sparks(cp, 0xff3b6b, 4); }
    if (hitPlayer || blocked) {
      if (!hitPlayer && !s.rocket && p.y < 8) sparks(p, 0xff8a6b, 3);
      scene.remove(s.mesh); shots.splice(i, 1);
    }
  }
}
// a friend's screen: show a bolt the host's bot fired (it can't hurt you; the host sends real damage)
export function ghostBolt(from, vel, col, rocket, heavy) {
  const m = new THREE.Mesh(rocket ? BOLT_GEO.rocket : heavy ? BOLT_GEO.heavy : BOLT_GEO.small, boltMat(col, 3)), dir = vel.clone().normalize();
  if (rocket) m.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
  else { const len = heavy ? .9 : .7, tail = new THREE.Mesh(heavy ? BOLT_GEO.tailH : BOLT_GEO.tail, boltMat(col, 2.2, true)); tail.position.copy(dir).multiplyScalar(-len / 2); tail.quaternion.setFromUnitVectors(new V3(0, -1, 0), dir); m.add(tail); }
  m.position.copy(from); scene.add(m);
  shots.push({ mesh: m, vel: vel.clone(), dmg: 0, life: 3, from: { pos: from.clone() }, rocket, vis: true });
  at3(from, () => SND.bot(0, from.distanceTo(camera.position), heavy ? 'heavy' : ''), !lineOfSight(from, camera.position));
}
// a friend's screen: the host's bots, moved to where the host says they are (15 times a second, smoothed)
// co-op: a sniper's red laser as numbers for friends ([from xyz, end xyz, brightness]), or 0 when it isn't aiming
export function laserOf(b) {
  const L = b.laser; if (!L || !L.visible) return 0;
  const p = L.geometry.attributes.position.array, r = v => Math.round(v * 100) / 100;
  return [r(p[0]), r(p[1]), r(p[2]), r(p[3]), r(p[4]), r(p[5]), r(L.material.opacity)];
}
export function puppetStep(b, dt) {
  if (!b.alive) { b.dieT -= dt; return b.dieT > 0; }
  const g = b.group, t = b.t, N = b.net; if (!N) return true;
  if (b.spawnT < 1) { b.spawnT = Math.min(1, b.spawnT + dt * 2.5); g.scale.setScalar(t.scale * (1 - Math.pow(1 - b.spawnT, 3))); }
  const px = b.pos.x, pz = b.pos.z, k = Math.min(1, dt * 10);
  // the host's bot teleported: show it vanish and land here too, instead of sliding across the map
  if (t.blink && Math.hypot(N.x - px, N.z - pz) > 4) { blinkAway(b); b.pos.x = N.x; b.pos.z = N.z; blinkArrive(b); }
  b.pos.x += (N.x - b.pos.x) * k; b.pos.z += (N.z - b.pos.z) * k; b.yaw += angDiff(b.yaw, N.yaw) * Math.min(1, dt * 12);
  const speed = Math.hypot(b.pos.x - px, b.pos.z - pz) / Math.max(dt, 1e-3);
  if (b.state !== N.st) b.setState(N.st);
  b.walk += dt * speed * 2.2; const sw = Math.sin(b.walk) * Math.min(1, speed / 3) * .7;
  if (b.legs?.length) { b.legs[0].rotation.x = sw; b.legs[1] && (b.legs[1].rotation.x = -sw); }
  if (b.arms?.length) b.arms.forEach((a, i) => { if (a) a.rotation.x = (i ? 1 : -1) * sw * .3; });
  g.rotation.y = b.yaw;
  if (b.alt) g.position.set(b.pos.x, b.alt + Math.sin(b.walk * .5) * .15, b.pos.z); else g.position.set(b.pos.x, 0, b.pos.z);
  if (N.hp !== b.hp) { b.hp = N.hp; b.bar.visible = b.hp < t.hp; b.setBar(); }
  if (b.hitFlash > 0) b.hitFlash -= dt;
  if (b.laser) {
    const l = N.l; b.laser.visible = !!l;
    if (l) { const pos = b.laser.geometry.attributes.position; pos.setXYZ(0, l[0], l[1], l[2]); pos.setXYZ(1, l[3], l[4], l[5]); pos.needsUpdate = true; b.laser.material.opacity = l[6]; }
  }
  return true;
}
export function clearBots() { bots.forEach(b => b.remove()); bots.length = 0; shots.forEach(s => scene.remove(s.mesh)); shots.length = 0; clearDebris(); }
