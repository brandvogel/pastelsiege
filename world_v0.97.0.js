import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { makeBuilder } from './mapgen_v0.97.0.js';
import { Nav } from './nav_v0.97.0.js';
import { SND, ac, sfx } from './audio_v0.97.0.js';
import { makeEnv } from './gunkit_v0.97.0.js';
import { surfaces, ground } from './textures_v0.97.0.js';
export { THREE, SND, ac, sfx };

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
// the font picked in Settings, for text drawn on a canvas (which can't use the CSS variable directly)
export const uiFont = () => document.documentElement.style.getPropertyValue('--display') || 'Futura, "Trebuchet MS", sans-serif';

// Sun shadows only cover a box around the player. Without this, shadows stopped dead along a straight line ~70 m away.
// Near the edge of that box, each spot is nudged toward the sun so its shadow fades out gradually instead.
{
  const k = "bool frustumTest = inFrustum && shadowCoord.z <= 1.0;", ch = THREE.ShaderChunk.shadowmap_pars_fragment;
  if (ch && ch.includes(k)) THREE.ShaderChunk.shadowmap_pars_fragment = ch.replace(k, "float psEdge = min( min( shadowCoord.x, 1.0 - shadowCoord.x ), min( shadowCoord.y, 1.0 - shadowCoord.y ) );\n\t\tshadowCoord.z -= ( 1.0 - smoothstep( 0.0, 0.18, psEdge ) ) * 0.08;\n\t\t" + k);
}

// ---------- renderer / scene ----------
// Macs: Retina screens have 4x the pixels, so the game draws fewer of them and lets the post effects do the smoothing.
export const IS_MAC = /Mac/.test(navigator.platform || navigator.userAgent) && !(navigator.maxTouchPoints > 1), RETINA = devicePixelRatio >= 1.8;
const savedQ = (() => { try { return JSON.parse(localStorage.getItem('pastelSiegeSettings12'))?.quality; } catch (e) { return null; } })();
// the screen's own anti-aliasing is wasted when post effects are on (they have their own), and costs a lot at Retina size
export const renderer = new THREE.WebGLRenderer({ antialias: !(IS_MAC && RETINA) || savedQ === 'potato' || savedQ === 'low', powerPreference: 'high-performance', stencil: false });
// Which graphics chip is this? Apple M1-M4 chips are fast but share memory with the rest of the Mac, so the big costs
// are screen-sized passes (pixels moved around), not the 3D itself. Intel Macs get lower defaults.
export const GPU = (() => { try { const gl = renderer.getContext(), x = gl.getExtension("WEBGL_debug_renderer_info"); return String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { return ""; } })();
export const APPLE_SI = IS_MAC && /Apple/i.test(GPU) && !/Intel|AMD|Radeon/i.test(GPU);
export const CHIP = (GPU.match(/Apple M\d+(?: (?:Pro|Max|Ultra))?/) || [APPLE_SI ? "Apple silicon" : IS_MAC ? "Intel Mac" : ""])[0];
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = IS_MAC ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
// Neutral tone mapping keeps the pastel colours true while letting flashes and glows go brighter than white
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
document.getElementById('stage').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
// near plane .1 m: you can never get closer than .42 m to a wall, and a bigger near plane gives the depth buffer far more
// precision, so distant walls and roofs stop flickering through each other (the gun is drawn by its own camera)
export const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 700);
camera.rotation.order = 'YXZ'; scene.add(camera);
scene.environment = makeEnv(THREE, renderer); scene.environmentIntensity = .45; // soft reflections and bounce light
const hemi = new THREE.HemisphereLight(0xfff6e6, 0xc9b79c, 1.15); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.5);
sun.position.set(30, 60, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);
// a cool fill from the opposite side so shadowed faces read as blue-ish rather than flat grey
const fill = new THREE.DirectionalLight(0xb8d4ff, .45); fill.position.set(-30, 20, -25); scene.add(fill);
// graphics presets. pr = pixel ratio cap (a Retina Mac is 2, so 1.5 there is 75% of the screen's real pixels);
// lod = metres before a bot turns into a cheap capsule; botShadow = metres before bots stop casting shadows
export const quality = { level: 'high', shadow: 2048 };
export const QUALITY = {
  // think = far bots think every Nth frame; hudHz = HUD updates per second (0 = every frame); mm = minimap every Nth frame
  potato: { pr: .6, shadow: 0, post: false, bloom: false, samples: 0, lite: .35, lod: 32, botShadow: 0, think: 4, hudHz: 20, mm: 5, edges: 40 },
  low: { pr: .9, shadow: 1024, post: false, bloom: false, samples: 0, lite: .7, lod: 50, botShadow: 18, think: 3, hudHz: 30, mm: 3, edges: 70 },
  medium: { pr: 1.25, shadow: 2048, post: true, bloom: true, samples: 2, lod: 70, botShadow: 28 },
  high: { pr: 1.5, shadow: 2048, post: true, bloom: true, samples: 2, lod: 90, botShadow: 40 },
  ultra: { pr: 2, shadow: 4096, post: true, bloom: true, samples: 4, lod: 120, botShadow: 60 },
  // Super Ultra: drawn at 1.3x your screen's pixels, 8K shadows redrawn every frame, the heavy lighting pass (see post), cloud
  // shadows, and every bot in full detail. Made for screenshots: expect a very low frame rate on most computers.
  superultra: { pr: 3, ss: 1.3, shadow: 8192, post: true, bloom: true, samples: 8, lod: 400, botShadow: 200, edges: 260, hq: true, noAuto: true },
};
// Dynamic resolution: the game lowers its render resolution a little when frames get slow, and raises it back when there's headroom.
// resPct (Settings > Resolution) overrides the preset: a share of the screen's real pixels, so 100 is always pin-sharp.
let resScale = 1, resPct = 0;
// on Retina Macs Medium/High/Ultra draw a bit fewer pixels (Sharpen keeps it crisp); Settings > Resolution still overrides this
const MAC_PR = APPLE_SI ? { medium: 1.1, high: 1.3, ultra: 1.7 } : { low: .8, medium: .95, high: 1.1, ultra: 1.35 };
const basePR = () => resPct ? devicePixelRatio * resPct / 100 : quality.level === 'superultra' ? superPR() : Math.min(devicePixelRatio, (IS_MAC && RETINA && MAC_PR[quality.level]) || (QUALITY[quality.level] || QUALITY.high).pr);
// supersampling, kept under about 24 million pixels so the GPU doesn't run out of memory
const superPR = () => Math.min(devicePixelRatio * QUALITY.superultra.ss, Math.sqrt(24e6 / Math.max(1, innerWidth * innerHeight)));
function applyPR() { renderer.setPixelRatio(basePR() * resScale); renderer.setSize(innerWidth, innerHeight); }
export function setResScale(k) { if (Math.abs(k - resScale) < .01) return; resScale = k; applyPR(); }
export function setResPct(p) { p = +p || 0; if (p === resPct) return; resPct = p; applyPR(); }
export const getResScale = () => resScale;
export const renderPct = () => Math.round(basePR() * resScale / devicePixelRatio * 100);
export function setQuality(level) {
  const q = QUALITY[level] || QUALITY.high; quality.level = level; quality.shadow = q.shadow; fxSettings.lite = q.lite ?? 1;
  const soft = level === 'superultra' || !IS_MAC ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  if (renderer.shadowMap.type !== soft) { renderer.shadowMap.type = soft; sun.shadow.map?.dispose(); sun.shadow.map = null; }
  sun.castShadow = q.shadow > 0 && !world.night; renderer.shadowMap.enabled = q.shadow > 0; scene.traverse(o => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; });
  scene.environmentIntensity = world.night ? 0 : q.hq ? .6 : .45;
  setClouds(cloudCount(level), !!q.hq);
  buildPrecip(); // more raindrops or snowflakes on higher presets
  applyPR();
  applyShadowSize();
  return q;
}
// The sun's shadow covers a 140m square around the player, moved in whole shadow-map texels so edges don't shimmer.
const SHADOW_R = 70;
function applyShadowSize() {
  if (!quality.shadow) return; const cap = quality.level === 'superultra' ? Math.min(8192, renderer.capabilities.maxTextureSize) : IS_MAC ? 2048 : 4096, n = Math.min(cap, quality.shadow);
  if (sun.shadow.mapSize.x !== n) { sun.shadow.mapSize.set(n, n); sun.shadow.map?.dispose(); sun.shadow.map = null; }
}
export const SUN_DIR = new THREE.Vector3(30, 60, 20).normalize();
let shadowTick = false, lastSX = 1e9, lastSZ = 1e9;
export function followShadow(p) {
  // the box jumps in ~4m steps (a whole number of texels), so the map only has to be redrawn every frame when it moves
  const tex = SHADOW_R * 2 / sun.shadow.mapSize.x * 64, x = Math.round(p.x / tex) * tex, z = Math.round(p.z / tex) * tex, moved = x !== lastSX || z !== lastSZ; lastSX = x; lastSZ = z;
  sun.target.position.set(x, 0, z); sun.position.set(x + SUN_DIR.x * 110, SUN_DIR.y * 110, z + SUN_DIR.z * 110);
  sun.target.updateMatrixWorld();
  // High and Ultra redraw shadows every frame: alternating heavy and light frames feels choppy even at a high FPS
  // (on Mac the shadow map is redrawn every other frame on every preset: halves the most expensive pass for a barely visible difference)
  renderer.shadowMap.needsUpdate = quality.level === 'superultra' || (!IS_MAC && (quality.level === 'high' || quality.level === 'ultra')) || (shadowTick = !shadowTick) || moved;
}
// jump pad rings drift upward and fade, the core pulses
export function updatePads(t) {
  for (const p of padAnims) {
    for (const r of p.rings) { const k = (t * .7 + r.ph) % 1; r.m.position.y = .2 + k * 2.2; r.m.scale.setScalar(1 - k * .35); r.m.material.opacity = (1 - k) * .8 * Math.min(1, k * 6); }
    p.disc.material.color.setRGB(.31, .82, .77).multiplyScalar(1.8 + Math.sin(t * 5) * .6);
  }
}
// Point lights stay in the scene all the time (intensity 0 when idle): adding and removing lights makes every material recompile, which stutters.
const lightPool = [0, 1].map(() => { const l = new THREE.PointLight(0xffa040, 0, 20, 2); scene.add(l); return { l, t: 0, max: 1, peak: 0 }; });
export function flashLight(p, color, intensity, dist, life) {
  const s = lightPool.reduce((a, b) => (a.t <= b.t ? a : b));
  s.l.position.copy(p); s.l.color.set(color); s.l.distance = dist; s.peak = intensity; s.t = s.max = life; s.l.intensity = intensity;
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); applyPR(); }); // also catches moving the window to a screen with a different pixel density

// ---------- world / map ----------
// Colliders are axis-aligned boxes from y0 (usually the ground) up to h. Floating ones are roofs, bridges and lintels.
export const world = { def: null, size: 55, colliders: [], solids: [], nav: null, floor: null, pads: [] };
let mapGroup = null;
const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2d42, transparent: true, opacity: .3 });
// outlines fade out between 45 m and 110 m from the camera
edgeMat.onBeforeCompile = s => {
  s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying float vEdgeD;").replace("#include <project_vertex>", "#include <project_vertex>\nvEdgeD = -mvPosition.z;");
  s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vEdgeD;").replace(/#include <(opaque|output)_fragment>/, m => "diffuseColor.a *= 1.0 - smoothstep( 45.0, 110.0, vEdgeD );\n" + m);
};

function specs(def) {
  let seed = 7; for (const ch of def.id) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483646; // hash the whole id so every map lays out differently
  const B = makeBuilder(seed + 1), S = def.size, h = def.wallH, c = def.theme.wall;
  B.box(0, -S - 1, S * 2 + 4, 2, h, c); B.box(0, S + 1, S * 2 + 4, 2, h, c);
  B.box(-S - 1, 0, 2, S * 2, h, c); B.box(S + 1, 0, 2, S * 2, h, c);
  def.build(B);
  return B;
}
// Box UVs scaled to real size so texture detail is the same on a crate and a skyscraper (1 tile = 2m).
function sizeUVs(geo, w, h, d) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 2, uv.getY(i) * dims[f][1] / 2); }
}
// Pick a surface from the box's shape: tall walls get bricks, low wide slabs concrete, crate-sized boxes planks.
function surfaceFor(b, hh, theme) {
  const vol = b.w * b.d * hh;
  if (theme === 'yard' && hh > 2 && hh < 3.2 && Math.max(b.w, b.d) > 5) return 'metal';  // shipping containers
  if (hh > 2.4 && Math.min(b.w, b.d) < 1.2) return theme === 'garden' || theme === 'frost' ? 'plaster' : 'brick';
  if (hh < 1.4 && vol < 4) return 'planks';
  if (hh < .8 || (b.y0 || 0) > 2) return 'concrete';
  return 'plaster';
}
// Soft dark rings on the ground around every grounded box, all merged into one mesh: cheap ambient occlusion.
function contactShadows(boxes) {
  const pos = [], col = [], idx = []; let v = 0;
  for (const b of boxes) {
    if ((b.y0 || 0) > .05 || b.h < .3) continue;
    const m = Math.min(1.1, .35 + b.h * .18), dark = Math.min(.42, .16 + b.h * .05);
    const xs = [b.x - b.w / 2 - m, b.x - b.w / 2 + .05, b.x + b.w / 2 - .05, b.x + b.w / 2 + m];
    const zs = [b.z - b.d / 2 - m, b.z - b.d / 2 + .05, b.z + b.d / 2 - .05, b.z + b.d / 2 + m];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { pos.push(xs[i], .015, zs[j]); col.push(0, 0, 0, (i === 0 || i === 3 || j === 0 || j === 3) ? 0 : dark); }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { if (i === 1 && j === 1) continue; const a = v + j * 4 + i; idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5); }
    v += 16;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  m.renderOrder = 1; m.raycast = () => {};
  return m;
}
// ---------- geometry merging ----------
// Big maps have thousands of boxes; drawing each as its own mesh would crawl. Boxes are merged per material
// into chunks (so off-screen chunks are skipped), and all outlines go into one line mesh per chunk.
const CHUNK = 80, NIGHT_BG = 0x010103, NIGHT_R = 46, blockChunks = [];
function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) idx[io++] = a[k] + vo; }
    else for (let k = 0; k < c; k++) idx[io++] = k + vo;
    vo += c; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1)); out.computeBoundingSphere();
  return out;
}
// the 12 edges of an axis-aligned box as line segment pairs
function boxEdges(arr, x0, y0, z0, x1, y1, z1) {
  const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) arr.push(...c[a], ...c[b]);
}

// ---------- spatial grid for colliders ----------
// Collision, line of sight and bullets only look at colliders in nearby 8m cells instead of all of them.
const GC = 8; let grid = new Map(), stampN = 1;
const gkey = (i, j) => (i + 4096) * 8192 + (j + 4096);
function gridAdd(c) {
  for (let i = Math.floor(c.minX / GC); i <= Math.floor(c.maxX / GC); i++) for (let j = Math.floor(c.minZ / GC); j <= Math.floor(c.maxZ / GC); j++) {
    const k = gkey(i, j); let b = grid.get(k); if (!b) grid.set(k, b = []); b.push(c);
  }
}
// all colliders overlapping a rectangle, each once
function near(minX, minZ, maxX, maxZ, out) {
  out.length = 0; const s = ++stampN;
  for (let i = Math.floor(minX / GC); i <= Math.floor(maxX / GC); i++) for (let j = Math.floor(minZ / GC); j <= Math.floor(maxZ / GC); j++) {
    const b = grid.get(gkey(i, j)); if (!b) continue;
    for (const c of b) if (c._s !== s) { c._s = s; out.push(c); }
  }
  return out;
}
export function collidersNear(x, z, r) { return near(x - r, z - r, x + r, z + r, []); }

// ---------- jump pads: a raised launch pad with glowing rings that rise ----------
const padAnims = [];
function buildPad(p, group) {
  const g = new THREE.Group(); g.position.set(p.x, 0, p.z);
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x3d405b, roughness: .35, metalness: .6, clearcoat: .6 });
  const rim = new THREE.MeshPhysicalMaterial({ color: 0xf2cc8f, roughness: .4, metalness: .2, clearcoat: .8 });
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4fd1c5).multiplyScalar(2.4) });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 1.25, p.r * 1.4, .14, 6), metal); base.position.y = .07; base.receiveShadow = base.castShadow = true;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 1.12, p.r * 1.12, .16, 6, 1, true), rim); ring.position.y = .08;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(p.r * .85, 6), glow); disc.rotation.x = -Math.PI / 2; disc.position.y = .145;
  const grate = new THREE.Mesh(new THREE.RingGeometry(p.r * .3, p.r * .6, 6), metal); grate.rotation.x = -Math.PI / 2; grate.position.y = .15;
  g.add(base, ring, disc, grate);
  // four corner lights
  for (let i = 0; i < 6; i += 2) { const a = i / 6 * Math.PI * 2 + Math.PI / 6, l = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), glow); l.position.set(Math.cos(a) * p.r * 1.2, .17, Math.sin(a) * p.r * 1.2); g.add(l); }
  // rising rings (animated)
  const rings = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(p.r * .75, .03, 6, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4fd1c5).multiplyScalar(2), transparent: true, depthWrite: false })); m.rotation.x = Math.PI / 2; m.rotation.z = Math.PI / 6; g.add(m); return { m, ph: i / 3 }; });
  g.traverse(o => { if (o.isMesh) o.raycast = () => {}; });
  group.add(g); padAnims.push({ rings, disc });
}

export function loadMap(def) {
  if (mapGroup) { scene.remove(mapGroup); mapGroup.traverse(o => { o.geometry?.dispose(); }); }
  mapGroup = new THREE.Group(); scene.add(mapGroup);
  world.def = def; world.size = def.size; world.colliders.length = 0; world.solids.length = 0; grid = new Map(); padAnims.length = 0;
  const t = def.theme, S = def.size, rawTheme = def.id.split('-')[0], themeId = ({ market: 'city', works: 'yard' })[rawTheme] || rawTheme; // new themes reuse a close ground texture
  const CH = CHUNK; blockChunks.length = 0;
  scene.background = new THREE.Color(t.bg); setSky(t.bg); scene.fog = new THREE.Fog(t.bg, t.fog[0], t.fog[1]);
  // the sun's shadow box follows the player (see followShadow) instead of stretching over the whole map
  Object.assign(sun.shadow.camera, { left: -SHADOW_R, right: SHADOW_R, top: SHADOW_R, bottom: -SHADOW_R, near: 1, far: 220 }); sun.shadow.camera.updateProjectionMatrix();
  applyShadowSize();
  setClouds(cloudList.length, cloudMesh.castShadow); // spread the clouds over the new map
  // ground: a painted texture per theme, 8m per tile
  const gTex = ground(THREE, themeId).clone(); gTex.needsUpdate = true; gTex.repeat.set((S * 2 + 10) / 8, (S * 2 + 10) / 8);
  const floor = world.floor = new THREE.Mesh(new THREE.PlaneGeometry(S * 2 + 10, S * 2 + 10), new THREE.MeshStandardMaterial({ color: t.floor, map: gTex, roughness: .95 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; mapGroup.add(floor);
  const B = specs(def), mats = {}, SURF = surfaces(THREE);
  const mat = (c, kind = 'plaster') => {
    const k = c + kind;
    return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, map: SURF[kind], roughness: kind === 'metal' ? .5 : kind === 'planks' ? .75 : .88, metalness: kind === 'metal' ? .25 : 0 }));
  };
  const leaf = c => mats['leaf' + c] || (mats['leaf' + c] = new THREE.MeshStandardMaterial({ color: c, map: SURF.concrete, roughness: .9, flatShading: true }));
  const buckets = new Map(), edges = new Map();
  const put = (m, geo, x, z, shadow = true) => { const k = m.uuid + '|' + Math.floor(x / CH) + "," + Math.floor(z / CH) + (shadow ? '' : '|n'); let b = buckets.get(k); if (!b) buckets.set(k, b = { m, list: [], shadow }); b.list.push(geo); };
  // blocks that touch often share a face exactly (flush walls, roofs at the same height), and the two faces flicker
  // through each other. Each block is drawn a few millimetres bigger by a different amount, so one face always wins.
  // Only the look changes: collisions use the real size.
  let zi = 0; const zpad = () => .002 + (zi++ * 7) % 6 * .0018;
  for (const b of B.boxes) {
    const y0 = b.y0 || 0, hh = b.h - y0;
    const e = zpad(), geo = new THREE.BoxGeometry(b.w + e * 2, hh + e, b.d + e * 2); sizeUVs(geo, b.w, hh, b.d); geo.translate(b.x, y0 + hh / 2 + e / 2, b.z);
    put(mat(b.color, surfaceFor(b, hh, themeId)), geo, b.x, b.z);
    if (b.w * b.d > 1.5 || hh > 1.5) { const k = Math.floor(b.x / CHUNK) + ',' + Math.floor(b.z / CHUNK); let e = edges.get(k); if (!e) edges.set(k, e = []); boxEdges(e, b.x - b.w / 2, y0, b.z - b.d / 2, b.x + b.w / 2, b.h, b.z + b.d / 2); }
    const c = { minX: b.x - b.w / 2, maxX: b.x + b.w / 2, minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2, h: b.h, y0, _s: 0,
      box: new THREE.Box3(new THREE.Vector3(b.x - b.w / 2, y0, b.z - b.d / 2), new THREE.Vector3(b.x + b.w / 2, b.h, b.z + b.d / 2)) };
    world.colliders.push(c); gridAdd(c);
  }
  for (const d of B.decorList) {
    const geo = d.kind === 'ball' ? new THREE.IcosahedronGeometry(.5, 2) : d.kind === 'cyl' ? new THREE.CylinderGeometry(.5, .5, 1, 28) : new THREE.BoxGeometry(1, 1, 1);
    const e = zpad(); geo.scale(d.w + e * 2, d.h + e * 2, d.d + e * 2); geo.translate(d.x, d.y, d.z);
    put(d.kind === 'ball' ? leaf(d.color) : mat(d.color, d.kind === 'cyl' ? 'metal' : 'plaster'), geo, d.x, d.z, d.shadow);
  }
  for (const b of buckets.values()) { const m = new THREE.Mesh(mergeGeos(b.list), b.m); m.castShadow = b.shadow; m.receiveShadow = true; m.raycast = () => {}; mapGroup.add(m); blockChunks.push(m); }
  // outlines: one line mesh per chunk, only drawn near you (far away, thousands of 1-pixel lines blur into stripes)
  edgeChunks.length = 0;
  for (const e of edges.values()) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(e, 3)); g.computeBoundingSphere(); const l = new THREE.LineSegments(g, edgeMat); l.raycast = () => {}; mapGroup.add(l); edgeChunks.push(l); }
  mapGroup.add(contactShadows(B.boxes));
  // the map never moves: work out its matrices once instead of every frame (jump pads, added after, still animate)
  mapGroup.updateMatrixWorld(true); mapGroup.matrixAutoUpdate = false; for (const o of mapGroup.children) o.matrixAutoUpdate = false;
  world.pads = B.pads;
  for (const p of B.pads) buildPad(p, mapGroup);
  // bots walk under anything that starts above head height
  // huge maps use a coarser path grid so it stays light on memory
  world.nav = new Nav(S, world.colliders.filter(c => c.y0 < 2.3), S > 200 ? 1.5 : 1);
  setNight(false);
  clearFx();
}

// ---------- night waves ----------
// Some waves are pitch black: no sun, no sky, no fill or bounce light. Your Tac Light and a tiny glow around you are the only light,
// and only blocks near you are drawn. Night vision goggles light the whole map up in green instead.
const selfGlow = new THREE.PointLight(0xbfcaff, 0, 2.5, 2); scene.add(selfGlow);
export function setNight(on, nvg = false) {
  const def = world.def, t = def?.theme; if (!t) return;
  world.night = on && !nvg; world.nvg = on && nvg;
  const bg = !on ? t.bg : nvg ? 0x0a3a16 : NIGHT_BG, far = (def.size || 100) * 3;
  scene.background = new THREE.Color(bg); setSky(bg, on);
  scene.fog = !on ? new THREE.Fog(t.bg, t.fog[0], t.fog[1]) : nvg ? new THREE.Fog(bg, far * .6, far) : new THREE.Fog(bg, 0, NIGHT_R);
  hemi.color.set(on && nvg ? 0x9dffa8 : 0xfff6e6); hemi.groundColor.set(on && nvg ? 0x1f6b2c : 0xc9b79c);
  hemi.intensity = !on ? 1.15 : nvg ? 1.6 : 0; sun.intensity = on ? 0 : 2.5; sun.castShadow = !on && quality.shadow > 0; motes.visible = !on; cloudMesh.visible = !on;
  fill.intensity = on ? 0 : .45; scene.environmentIntensity = on && !nvg ? 0 : .45; selfGlow.intensity = on && !nvg ? 1.2 : 0;
  camera.far = on && !nvg ? NIGHT_R + 6 : 700; camera.updateProjectionMatrix();
  for (const m of blockChunks) m.visible = true;
  if (!on) weatherLook(); // rain and snow keep their grey (or white) skies after a night wave
}
export function followGlow(p) { if (selfGlow.intensity) selfGlow.position.copy(p); }
// ---------- collision ----------
const _nr = [], _ng = [], _nc = [], _nb = [];
// Push a circle out of walls. Boxes entirely above headY (you're walking under them) or below the step height are ignored.
export function resolveCircle(p, rad, feetY, stepUp = 0, headY = feetY + 1.8) {
  let hit = null;
  for (const b of near(p.x - rad - .1, p.z - rad - .1, p.x + rad + .1, p.z + rad + .1, _nr)) {
    if (b.h - feetY <= stepUp || feetY >= b.h - .05 || headY <= b.y0) continue;
    const cx = clamp(p.x, b.minX, b.maxX), cz = clamp(p.z, b.minZ, b.maxZ);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= rad * rad) continue;
    hit = b;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * rad; p.z = cz + dz / d * rad; }
    else {
      const l = p.x - b.minX, r = b.maxX - p.x, t = p.z - b.minZ, bb = b.maxZ - p.z, m = Math.min(l, r, t, bb);
      if (m === l) p.x = b.minX - rad; else if (m === r) p.x = b.maxX + rad; else if (m === t) p.z = b.minZ - rad; else p.z = b.maxZ + rad;
    }
  }
  return hit;
}
export function groundAt(x, z, rad, feetY, stepUp = .36) {
  let g = 0; const m = rad * .7;
  for (const b of near(x - m, z - m, x + m, z + m, _ng)) if (x > b.minX - m && x < b.maxX + m && z > b.minZ - m && z < b.maxZ + m && feetY >= b.h - stepUp) g = Math.max(g, b.h);
  return g;
}
// Lowest underside of anything above your feet (so jumping under a roof bumps your head).
export function ceilingAt(x, z, rad, feetY) {
  let c = Infinity; const m = rad * .6;
  for (const b of near(x - m, z - m, x + m, z + m, _nc)) if (b.y0 > feetY + .2 && x > b.minX - m && x < b.maxX + m && z > b.minZ - m && z < b.maxZ + m) c = Math.min(c, b.y0);
  return c;
}
const _ray = new THREE.Ray(), _hit = new THREE.Vector3(), _losD = new THREE.Vector3();
// Walk along a ray in 8m steps, testing only the colliders in the cells it passes. Returns { c, d } of the first box hit or null.
function march(a, dir, maxD, stopEarly) {
  _ray.origin.copy(a); _ray.direction.copy(dir).normalize();
  const dx = _ray.direction.x, dz = _ray.direction.z, s = ++stampN;
  let best = null, bd = maxD;
  for (let t = 0; t < maxD; t += GC) {
    const t1 = Math.min(maxD, t + GC), x0 = a.x + dx * t, z0 = a.z + dz * t, x1 = a.x + dx * t1, z1 = a.z + dz * t1;
    const i0 = Math.floor((Math.min(x0, x1) - .5) / GC), i1 = Math.floor((Math.max(x0, x1) + .5) / GC), j0 = Math.floor((Math.min(z0, z1) - .5) / GC), j1 = Math.floor((Math.max(z0, z1) + .5) / GC);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const bk = grid.get(gkey(i, j)); if (!bk) continue;
      for (const c of bk) {
        if (c._s === s) continue; c._s = s;
        if (_ray.intersectBox(c.box, _hit)) { const d = a.distanceTo(_hit); if (d < bd && d > .01) { bd = d; best = c; if (stopEarly) return { c, d }; } }
      }
    }
    if (best && bd <= t1) break;  // nothing further along can be closer
  }
  return best ? { c: best, d: bd } : null;
}
export function lineOfSight(a, b) {
  const dist = a.distanceTo(b); if (dist < .01) return true;
  return !march(a, _losD.subVectors(b, a), dist - .2, true);
}
// First wall (or ground) hit along a ray within maxD: { point, normal, d } or null.
export function rayWall(a, dir, maxD) {
  const r = march(a, dir, maxD, false), nd = dir.clone().normalize();
  const gt = nd.y < 0 ? -a.y / nd.y : Infinity;
  if (gt < maxD && (!r || gt < r.d)) return { point: a.clone().addScaledVector(nd, gt), normal: new THREE.Vector3(0, 1, 0), d: gt };
  if (!r) return null;
  const p = a.clone().addScaledVector(nd, r.d), c = r.c, e = .02, n = new THREE.Vector3();
  if (Math.abs(p.x - c.minX) < e) n.set(-1, 0, 0); else if (Math.abs(p.x - c.maxX) < e) n.set(1, 0, 0);
  else if (Math.abs(p.z - c.minZ) < e) n.set(0, 0, -1); else if (Math.abs(p.z - c.maxZ) < e) n.set(0, 0, 1);
  else if (Math.abs(p.y - c.h) < e) n.set(0, 1, 0); else n.set(0, -1, 0);
  return { point: p, normal: n, d: r.d };
}
export function boxAt(p, m = 0) {
  for (const c of near(p.x - m, p.z - m, p.x + m, p.z + m, _nb)) if (p.x > c.minX - m && p.x < c.maxX + m && p.z > c.minZ - m && p.z < c.maxZ + m && p.y < c.h && p.y >= c.y0) return c;
  return undefined;
}
export function insideSolid(p, m = 0) { return !!boxAt(p, m); }
export function openPoint() {
  const nav = world.nav, n = nav.n;
  for (let i = 0; i < 400; i++) { const k = Math.floor(Math.random() * n * n); if (!nav.blocked[k]) { const c = nav.centre(k); return new THREE.Vector3(c.x, 0, c.z); } }
  return new THREE.Vector3(0, 0, 0);
}

// ---------- effects ----------
// Particles (blood drops, sparks, gore chunks, shell casings), splats and bullet holes are all drawn with instanced meshes:
// thousands of them cost a handful of draw calls, and nothing is created or thrown away while you play.
export const fxSettings = { blood: 'red', gore: 'extreme', lite: 1 };
const V = THREE.Vector3, UP = new V(0, 1, 0), _o = new THREE.Object3D(), _c = new THREE.Color(), _e = new THREE.Euler(), _p = new V();
const fx = [], emitters = [];
function addFx(obj, life, extra = {}) { scene.add(obj); fx.push({ obj, life, max: life, ...extra }); }
function soft(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const smokeTex = soft(64, (x, s) => { const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s); });
// splatter shapes: a blob with droplets thrown out to the side; the last one is a long drip
const splatTex = [0, 1, 2].map(v => soft(128, (x, s) => {
  x.fillStyle = '#fff'; let seed = v * 97 + 5; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9; i++) { const a = r() * 7, d = r() * 18; x.beginPath(); x.arc(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, 10 + r() * 16, 0, 7); x.fill(); }
  for (let i = 0; i < 26; i++) { const a = r() * 7, d = 26 + r() * 34, rr = 1 + r() * 5; x.beginPath(); x.arc(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, rr, 0, 7); x.fill(); }
  for (let i = 0; i < 6; i++) { const a = r() * 7; x.beginPath(); x.ellipse(s / 2 + Math.cos(a) * 30, s / 2 + Math.sin(a) * 30, 14, 3, a, 0, 7); x.fill(); }
}));
const dripTex = soft(64, (x, s) => { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(s / 2, s * .3, s * .3, s * .22, 0, 0, 7); x.fill(); for (let i = 0; i < 4; i++) { const cx = s * (.3 + i * .14), w = 2 + (i % 2) * 2; x.fillRect(cx - w / 2, s * .3, w, s * (.35 + (i * 37 % 5) / 10)); x.beginPath(); x.arc(cx, s * (.65 + (i * 37 % 5) / 10), w * .9, 0, 7); x.fill(); } });
const BLOOD = { red: [0x7a1414, 0x9b1d1d, 0x5c0d0d, 0xb32222], oil: [0x1d1f2b, 0x2b2d42, 0x2e2639] };
export function bloodColor(base) { const m = fxSettings.blood; if (m === 'paint') return base; const p = BLOOD[m] || BLOOD.red; return p[Math.floor(Math.random() * p.length)]; }
const extreme = () => fxSettings.gore !== 'normal';
// how much blood: Bloodbath doubles it, Over the top gets a bit extra, Potato quality cuts it down to stay fast
const gmul = () => (fxSettings.gore === 'bath' ? 2.2 : fxSettings.gore === 'extreme' ? 1.3 : 1) * fxSettings.lite;

// --- instanced particle pools ---
function ipool(geo, mat, max, shadow = false) {
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0; mesh.frustumCulled = false; mesh.raycast = () => {}; mesh.castShadow = shadow; scene.add(mesh);
  return { mesh, max, list: [] };
}
const P_DROP = ipool(new THREE.IcosahedronGeometry(.035, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), 4200);
const P_SPARK = ipool(new THREE.BoxGeometry(.07, .07, .07), new THREE.MeshBasicMaterial({ color: 0xffffff }), 700);
const P_GIB = ipool(new THREE.DodecahedronGeometry(.1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .32, metalness: .05 }), 800, true);
const P_SHELL = ipool(new THREE.CylinderGeometry(.006, .006, .03, 8).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .8, roughness: .25 }), 120);
const POOLS = [P_DROP, P_SPARK, P_GIB, P_SHELL];
// o: { p, v, col (hex or Color), s, life, g, kind: 'drop'|'spark'|'gib'|'shell', spin }
function emit(ps, o) {
  o.max = o.life; o.rx = o.rx || 0; o.ry = o.ry || 0; o.rz = o.rz || 0;
  o.c = o.col instanceof THREE.Color ? o.col : new THREE.Color(o.col);
  if (ps.list.length >= ps.max) ps.list[Math.floor(Math.random() * ps.max)] = o; else ps.list.push(o);
}
function updatePool(ps, dt) {
  const L = ps.list, m = ps.mesh;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i]; q.life -= dt;
    if (q.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
    if (!q.rest) {
      q.v.y -= q.g * dt; _p.copy(q.p); q.p.addScaledVector(q.v, dt);
      if (q.spin) { q.rx += q.spin * dt; q.rz += q.spin * .7 * dt; }
      if (q.kind === 'drop') {
        if (q.p.y < .02) { if (Math.random() < .35) splat(new V(q.p.x, .011, q.p.z), UP, q.s * rand(.07, .18), q.c.getHex()); L[i] = L[L.length - 1]; L.pop(); continue; }
        if ((q.n = (q.n || 0) + 1) % 2 === 0 && insideSolid(q.p)) {
          // hit a wall: find which face and leave a splat there
          const w = rayWall(_p, q.v, q.v.length() * dt * 3 + .2);
          if (w && Math.random() < .6) splat(w.point, w.normal, q.s * rand(.1, .26), q.c.getHex());
          L[i] = L[L.length - 1]; L.pop(); continue;
        }
      } else if (q.p.y < q.r) {
        // gibs, casings and sparks bounce, then settle
        q.p.y = q.r; q.v.y *= -.38; q.v.x *= .55; q.v.z *= .55; q.spin *= .5;
        if (q.kind === 'shell' && q.tink && Math.abs(q.v.y) > .3) { q.tink = false; SND.casing(); }
        if (q.kind === 'gib' && !q.smear) { q.smear = true; splat(new V(q.p.x, .012, q.p.z), UP, rand(.25, .5) * q.s, bloodColor(q.base)); }
        if (Math.abs(q.v.y) < .5 && q.v.x * q.v.x + q.v.z * q.v.z < .3) q.rest = true;
      } else if (q.kind === 'gib') {
        if (insideSolid(q.p)) { q.p.copy(_p); q.v.x *= -.35; q.v.z *= -.35; }
        // flying chunks spray a trail of drops
        if (q.trail && Math.random() < dt * 30) emit(P_DROP, { p: q.p.clone(), v: q.v.clone().multiplyScalar(.2).add(new V(rand(-.5, .5), rand(0, .6), rand(-.5, .5))), col: bloodColor(q.base), s: rand(.5, 1), life: 1.4, g: 16, kind: 'drop' });
      }
    }
    const fade = q.kind === 'spark' ? q.life / q.max : Math.min(1, q.life * 2);
    _o.position.copy(q.p); _o.rotation.set(q.rx, q.ry, q.rz); _o.scale.setScalar(q.s * fade);
    if (q.sx) _o.scale.set(q.s * q.sx * fade, q.s * q.sy * fade, q.s * q.sz * fade);
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); m.instanceColor.setXYZ(i, q.c.r, q.c.g, q.c.b);
  }
  m.count = L.length; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
}

// --- instanced splats, bullet holes ---
function flatPool(map, max, op, offs) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, map, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: offs, polygonOffsetUnits: offs });
  const ps = ipool(new THREE.PlaneGeometry(1, 1), mat, max); ps.next = 0; return ps;
}
const SPLATS = splatTex.map(t => flatPool(t, 1000, .93, -3)), DRIPS = flatPool(dripTex, 450, .93, -3);
const HOLES = flatPool(soft(32, (x, s) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(s / 2, s / 2, s * .42, 0, 7); x.fill(); }), 250, .8, -2);
const growing = [];
let splatN = 0;
function place(ps, p, n, sx, sy, rot, col) {
  const i = ps.next % ps.max; ps.next++; ps.mesh.count = Math.min(ps.next, ps.max);
  _o.position.copy(p).addScaledVector(n, .012 + (splatN++ % 200) * .00004); _o.lookAt(_p.copy(_o.position).add(n)); _o.rotateZ(rot); _o.scale.set(sx, sy, 1);
  _o.updateMatrix(); ps.mesh.setMatrixAt(i, _o.matrix); _c.set(col); ps.mesh.instanceColor.setXYZ(i, _c.r, _c.g, _c.b);
  ps.mesh.instanceMatrix.needsUpdate = true; ps.mesh.instanceColor.needsUpdate = true;
  return i;
}
export function decal(p, n) { place(HOLES, p, n, .12, .12, 0, 0x2b2d42); }
// a flat splat stuck to a wall or the floor; grow = seconds to spread out (pools)
export function splat(p, n, size, col, grow = 0) {
  if (fxSettings.blood === 'off') return;
  const ps = SPLATS[Math.floor(Math.random() * 3)], rot = rand(0, 6.28);
  const i = place(ps, p, n, grow ? size * .15 : size, grow ? size * .15 : size, rot, col);
  if (grow) growing.push({ ps, i, p: p.clone(), n: n.clone(), size, grow, rot, col, t: 0, gen: ps.next });
  // on walls, extreme gore runs down in drips
  if (extreme() && Math.abs(n.y) < .3 && size > .25 && Math.random() < .7) {
    const d = size * rand(.5, 1.1);
    place(DRIPS, _p.copy(p).add(new V(0, -d * .45, 0)), n, size * rand(.35, .6), d * 1.4, 0, col);
  }
}
const tracerGeo = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true), sphereGeo = new THREE.SphereGeometry(1, 20, 14), ringGeo = new THREE.RingGeometry(.8, 1, 32);
const tracerPool = [];
export function tracer(a, b, color = 0xffc46b, life = .06) {
  // a thin glowing streak (HDR-bright so it blooms); the meshes are reused
  const len = a.distanceTo(b); if (len < .05) return;
  let t = tracerPool.find(x => !x.busy);
  if (!t) { if (tracerPool.length >= 40) t = tracerPool[0]; else { t = { m: new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })) }; t.m.raycast = () => {}; tracerPool.push(t); scene.add(t.m); } }
  t.busy = true; t.life = t.max = life; t.m.visible = true; t.m.material.color.set(color).multiplyScalar(3.2); t.m.material.opacity = 1;
  t.m.position.copy(a).add(b).multiplyScalar(.5); t.m.quaternion.setFromUnitVectors(UP, _p.copy(b).sub(a).normalize()); t.m.scale.set(.011, len, .011);
}
export function beam(a, b, color, r = .05, life = .5) {
  const len = a.distanceTo(b), m = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), transparent: true, depthWrite: false }));
  m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize()); m.scale.set(r, len, r);
  addFx(m, life, { grow: r, len });
}
export function sparks(p, color, n = 6, speed = 4) {
  const c = new THREE.Color(color).multiplyScalar(2.4);
  for (let i = 0; i < n; i++) emit(P_SPARK, { p: p.clone(), v: new V(rand(-speed, speed), rand(1, speed * 1.5), rand(-speed, speed)), col: c, s: rand(.4, 1), life: .4, g: 18, kind: 'spark', r: .03, spin: rand(5, 12) });
}
const smokePool = [];
function puff(p, size, life, col = 0xe8e2d6, op = .7, grow = rand(2.5, 4), rise = 1) {
  let s = smokePool.find(x => x.life <= 0);
  if (!s) { if (smokePool.length >= 70) s = smokePool.reduce((a, b) => (a.life < b.life ? a : b)); else { s = { o: new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false })), life: 0 }; s.o.raycast = () => {}; smokePool.push(s); scene.add(s.o); } }
  s.o.visible = true; s.o.material.color.set(col); s.o.position.copy(p); s.max = s.life = life;
  s.vel = new V(rand(-.3, .3), rand(.3, .8) * rise, rand(-.3, .3)); s.base = size; s.puff = size * grow; s.op = op;
}
export function smoke(p, n = 1, size = .25, life = .9) { for (let i = 0; i < n; i++) puff(p, size, life * rand(.8, 1.2)); }
const mist = (p, col, size, life = .35, op = .8) => puff(p, size, life, col, op, 4, .3);
export function shell(pos, vel, color = 0xd4a73a) {
  emit(P_SHELL, { p: pos.clone(), v: vel.clone(), col: color, s: 1, life: 1.6, g: 14, kind: 'shell', r: .02, spin: rand(8, 16), rx: rand(0, 3), ry: rand(0, 3), tink: true });
}
// Spray of droplets along dir; they leave splats where they land. Big hits paint the wall behind.
export function blood(p, dir, n, base = 0x9b1d1d) {
  const mode = fxSettings.blood;
  if (mode === 'off') { sparks(p, base, Math.min(n, 5), 3); return; }
  const X = extreme(), d = dir.clone().normalize(), count = Math.round(n * (X ? 2.6 : 1) * gmul());
  for (let i = 0; i < count; i++) {
    const sp = rand(1.5, X ? 9 : 6), v = d.clone().multiplyScalar(sp).add(new V(rand(-1.8, 1.8), rand(.2, X ? 3.6 : 2.6), rand(-1.8, 1.8)));
    if (i % 4 === 0) v.multiplyScalar(-.45); // some splashes back toward you
    emit(P_DROP, { p: p.clone(), v, col: bloodColor(base), s: rand(.6, X ? 2.2 : 1.5), life: 1.6, g: 16, kind: 'drop' });
  }
  mist(p.clone(), bloodColor(base), .25 + (X ? .15 : 0), .4, .8);
  // the wall behind gets painted
  const w = rayWall(p, d, X ? 5 : 3.5);
  if (w) splat(w.point, w.normal, rand(.35, .7) * Math.min(X ? 2.4 : 1.6, .6 + n / 12) * (fxSettings.gore === 'bath' ? 1.4 : 1), bloodColor(base));
  if (fxSettings.gore === 'bath' && fxSettings.lite === 1 && n > 4) { const f = rayWall(p, new V(rand(-.4, .4), -1, rand(-.4, .4)).normalize(), 3); if (f) splat(f.point, f.normal, rand(.3, .6), bloodColor(base)); }
}
export function pool(p, size, base) { splat(new V(p.x, .012, p.z), UP, size * (fxSettings.gore === 'bath' ? 2.3 : extreme() ? 1.7 : 1), bloodColor(base), 1.6); }
// Chunks that fly, bounce, smear the ground and drip as they go.
export function gibs(p, dir, n, base, force = 5, partCol) {
  if (fxSettings.blood === 'off') return;
  n = Math.max(1, Math.round(n * gmul()));
  for (let i = 0; i < n; i++) {
    const v = dir.clone().multiplyScalar(force * rand(.3, 1.1)).add(new V(rand(-4, 4), rand(2.5, 8), rand(-4, 4)));
    const s = rand(.6, 1.7), meat = Math.random() < .75;
    emit(P_GIB, { p: p.clone().add(new V(rand(-.2, .2), rand(-.3, .3), rand(-.2, .2))), v, col: meat ? bloodColor(base) : (partCol ?? base), base, s, sx: rand(.7, 1.4), sy: rand(.6, 1.2), sz: rand(.7, 1.4),
      life: rand(5, 7), g: 18, kind: "gib", r: .08 * s, spin: rand(6, 14), rx: rand(0, 6), trail: Math.random() < .8 });
  }
}
// A jet of blood that keeps spraying for dur seconds, following obj if given (a headless body part, for example).
export function fountain(p, base, dur = 1.2, obj = null, rate = 120) {
  if (fxSettings.blood === 'off' || !extreme()) return;
  emitters.push({ p: p.clone(), obj, base, t: dur, rate, acc: 0 });
}
// The big over-the-top death burst.
export function goreBurst(p, dir, base, power = 1, partCol) {
  if (fxSettings.blood === 'off') return;
  const X = extreme(), d = dir.clone().setY(0).normalize();
  const n = Math.max(1, Math.round((X ? 90 : 30) * power * gmul()));
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), out = new V(Math.cos(a), 0, Math.sin(a));
    const v = out.multiplyScalar(rand(1, X ? 9 : 5)).addScaledVector(d, rand(0, 6) * power).add(new V(0, rand(1, X ? 9 : 5), 0));
    emit(P_DROP, { p: p.clone(), v, col: bloodColor(base), s: rand(.8, X ? 2.8 : 1.6), life: 2, g: 16, kind: 'drop' });
  }
  gibs(p, d, Math.round((X ? 14 : 4) * power), base, 6 * power, partCol);
  for (let i = 0; i < (X ? 3 : 1); i++) mist(p.clone().add(new V(rand(-.3, .3), rand(-.2, .4), rand(-.3, .3))), bloodColor(base), .5 + power * .3, .6, .85);
  // paint every nearby wall
  for (let i = 0; i < Math.round((X ? 7 : 2) * (fxSettings.gore === 'bath' ? 1.7 : 1) * fxSettings.lite + .4); i++) {
    const a = rand(0, Math.PI * 2), rd = new V(Math.cos(a), rand(-.6, .3), Math.sin(a)).addScaledVector(d, .8).normalize();
    const w = rayWall(p, rd, X ? 7 : 4);
    if (w) splat(w.point, w.normal, rand(.6, 1.4) * (X ? 1.4 : 1) * Math.max(.6, 1 - w.d / 9), bloodColor(base));
  }
}
export function explosionFx(p, radius) {
  const ball = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb347).multiplyScalar(3), transparent: true, depthWrite: false }));
  ball.position.copy(p); addFx(ball, .45, { boom: radius });
  const core = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1c0).multiplyScalar(6), transparent: true, depthWrite: false }));
  core.position.copy(p); addFx(core, .2, { boom: radius * .55 });
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x2b2d42, transparent: true, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, .05, p.z); addFx(ring, .6, { boom: radius * 1.3 });
  flashLight(p, 0xffa040, 60, radius * 5, .25);
  sparks(p, 0xff8a3d, 18, 9); sparks(p, 0x2b2d42, 10, 6); smoke(p, 6, 1.2, 2.2);
  splat(new V(p.x, .013, p.z), UP, radius * .7, 0x2b2d42);
}
export function updateFx(dt) {
  for (const s of lightPool) if (s.t > 0) { s.t -= dt; s.l.intensity = s.t > 0 ? s.peak * (s.t / s.max) : 0; }
  for (let i = growing.length - 1; i >= 0; i--) {
    const g = growing[i]; g.t += dt;
    if (g.ps.next - g.gen >= g.ps.max) { growing.splice(i, 1); continue; } // its slot was reused
    const k = g.size * (.15 + .85 * Math.min(1, g.t / g.grow) ** .5);
    _o.position.copy(g.p).addScaledVector(g.n, .012); _o.lookAt(_p.copy(_o.position).add(g.n)); _o.rotateZ(g.rot); _o.scale.set(k, k, 1); _o.updateMatrix();
    g.ps.mesh.setMatrixAt(g.i, _o.matrix); g.ps.mesh.instanceMatrix.needsUpdate = true;
    if (g.t >= g.grow) growing.splice(i, 1);
  }
  for (let i = emitters.length - 1; i >= 0; i--) {
    const e = emitters[i]; e.t -= dt; if (e.obj) e.p.copy(e.obj.position);
    e.acc += dt * e.rate * Math.min(1, e.t * 1.5) * gmul();
    while (e.acc > 1) { e.acc--; emit(P_DROP, { p: e.p.clone(), v: new V(rand(-1.2, 1.2), rand(4, 8.5), rand(-1.2, 1.2)), col: bloodColor(e.base), s: rand(.7, 1.8), life: 2, g: 16, kind: 'drop' }); }
    if (e.t <= 0) emitters.splice(i, 1);
  }
  for (const ps of POOLS) updatePool(ps, dt);
  for (const t of tracerPool) if (t.busy) { t.life -= dt; t.m.material.opacity = Math.max(0, t.life / t.max); if (t.life <= 0) { t.busy = false; t.m.visible = false; } }
  for (const s of smokePool) if (s.life > 0) {
    s.life -= dt; const k = Math.max(0, s.life / s.max);
    s.vel.y += .2 * dt; s.o.position.addScaledVector(s.vel, dt); s.o.scale.setScalar(s.base + (1 - k) * s.puff); s.o.material.opacity = s.op * k;
    if (s.life <= 0) s.o.visible = false;
  }
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i], o = f.obj; f.life -= dt; const t = clamp(f.life / f.max, 0, 1);
    if (f.boom) o.scale.setScalar(.3 + (1 - t) * f.boom);
    if (f.grow) o.scale.set(f.grow * (1 + (1 - t) * 2), f.len, f.grow * (1 + (1 - t) * 2));
    o.material.opacity = t;
    if (f.life <= 0) { scene.remove(o); o.material.dispose(); fx.splice(i, 1); }
  }
}
export function clearFx() {
  fx.forEach(f => scene.remove(f.obj)); fx.length = 0; emitters.length = 0; growing.length = 0;
  for (const ps of POOLS) { ps.list.length = 0; ps.mesh.count = 0; }
  for (const ps of [...SPLATS, DRIPS, HOLES]) { ps.next = 0; ps.mesh.count = 0; }
  for (const t of tracerPool) { t.busy = false; t.m.visible = false; }
  for (const s of smokePool) { s.life = 0; s.o.visible = false; }
}

// ---------- atmosphere: gradient sky dome and drifting dust ----------
const skyGeo = new THREE.SphereGeometry(300, 32, 16);
const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
export function setSky(bg, night = false) {
  const base = new THREE.Color(bg), top = night ? base.clone() : base.clone().lerp(new THREE.Color(0x9cc5d6), .45), horizon = base.clone(); // horizon matches the fog so distant ground blends in
  const pos = skyGeo.attributes.position, cols = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { const h = pos.getY(i) / 300; c.copy(h > 0 ? horizon.clone().lerp(top, Math.min(1, h * 1.6)) : horizon.clone().lerp(base, Math.min(1, -h * 4))); cols.set([c.r, c.g, c.b], i * 3); }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
}
const MOTES = 260, moteGeo = new THREE.BufferGeometry(), moteArr = new Float32Array(MOTES * 3);
for (let i = 0; i < MOTES; i++) moteArr.set([rand(-20, 20), rand(0, 8), rand(-20, 20)], i * 3);
moteGeo.setAttribute('position', new THREE.BufferAttribute(moteArr, 3));
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xfffaf0, size: .05, transparent: true, opacity: .55, depthWrite: false }));
motes.frustumCulled = false; scene.add(motes);
let atmosT = 0;
export function updateAtmos(dt) {
  atmosT += dt; sky.position.copy(camera.position); driftClouds(dt); updateWeather(dt);
  if (!motes.visible || fxSettings.lite < .5) return;  // Potato and night skip the drifting dust
  const p = camera.position;
  for (let i = 0; i < MOTES; i++) {
    let x = moteArr[i * 3] + Math.sin(atmosT * .3 + i) * dt * .25, y = moteArr[i * 3 + 1] + dt * .08, z = moteArr[i * 3 + 2] + Math.cos(atmosT * .25 + i * 1.3) * dt * .25;
    // keep every mote within 20m of the camera so the cloud always surrounds you
    if (x - p.x > 20) x -= 40; else if (x - p.x < -20) x += 40;
    if (z - p.z > 20) z -= 40; else if (z - p.z < -20) z += 40;
    if (y > p.y + 8) y -= 10;
    moteArr[i * 3] = x; moteArr[i * 3 + 1] = y; moteArr[i * 3 + 2] = z;
  }
  moteGeo.attributes.position.needsUpdate = true;
}
// ---------- clouds: soft puffy pastel clouds drifting high over the tower ----------
// How many depends on the graphics preset (none on Potato). One draw call for all of them. Super Ultra clouds cast
// moving shadows on the ground.
const CLOUD_N = { potato: 0, low: 8, medium: 14, high: 22, ultra: 32, superultra: 48 }, PUFFS = 9;
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffeef2, emissiveIntensity: .45, fog: false });
const cloudMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), cloudMat, 48 * PUFFS);
cloudMesh.count = 0; cloudMesh.frustumCulled = false; scene.add(cloudMesh);
let cloudList = [];
const _cm = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _cp = new THREE.Vector3(), _cs = new THREE.Vector3();
function cloudSpan() { return (world.size || 100) + 160; }
export function setClouds(n, shadows = false) {
  const span = cloudSpan(); cloudList = [];
  for (let i = 0; i < n; i++) {
    const len = rand(14, 34), puffs = [];
    for (let k = 0; k < PUFFS; k++) {
      const f = k / (PUFFS - 1) - .5, big = 1 - Math.abs(f) * 1.2; // fattest in the middle
      puffs.push({ x: f * len + rand(-2, 2), y: rand(-1, 2.5) * big, z: rand(-4, 4), r: rand(4, 7) * Math.max(.45, big) });
    }
    cloudList.push({ x: rand(-span, span), y: rand(58, 88), z: rand(-span, span), puffs, flat: rand(.45, .6), spd: rand(.7, 1.3) });
  }
  cloudMesh.count = n * PUFFS; cloudMesh.castShadow = !!shadows; placeClouds();
}
function placeClouds() {
  let i = 0; _cq.identity();
  for (const c of cloudList) for (const u of c.puffs) {
    _cm.compose(_cp.set(c.x + u.x, c.y + u.y, c.z + u.z), _cq, _cs.set(u.r, u.r * c.flat, u.r)); cloudMesh.setMatrixAt(i++, _cm);
  }
  cloudMesh.instanceMatrix.needsUpdate = true;
}
// a gentle wind; clouds that drift off one side come back on the other
function driftClouds(dt) {
  if (!cloudList.length || !cloudMesh.visible) return;
  const span = cloudSpan();
  const wk = 1 + (wx.wind || 0) / 3; // windy weather blows the clouds along faster
  for (const c of cloudList) { c.x += dt * 1.6 * c.spd * wk; c.z += dt * .5 * c.spd * wk; if (c.x > span) c.x -= span * 2; if (c.z > span) c.z -= span * 2; }
  placeClouds();
}
const cloudCount = level => CLOUD_N[level] ?? ((QUALITY[level] || {}).post ? 18 : 6);
// ---------- weather: rain, thunderstorms, snow, blizzards, thick fog and sandstorms ----------
// The look lives here: rain, snow or blowing sand around the camera, greyer (or whiter, or sandier) skies and clouds,
// closer fog, a layer of mist drifting along the ground, lightning bolts and flashes.
// What weather does to the fight (slower running, slippery snow, lightning, gusts) is in the game file.
export const WEATHER = {
  clear: { id: 'clear', name: 'Clear', icon: '☀' },
  rain: { id: 'rain', name: 'Rain', icon: '🌧', fog: .62, tint: 0x8d9bb3, mix: .45, light: .8, drops: 1, wind: 3, mist: .18, mistCol: 0xdfe6f0, cloud: 0xb7c0d0 },
  storm: { id: 'storm', name: 'Thunderstorm', icon: '⛈', fog: .45, tint: 0x5d6684, mix: .62, light: .58, drops: 1.5, wind: 7, mist: .26, mistCol: 0xc3cbdb, cloud: 0x737c95 },
  snow: { id: 'snow', name: 'Snow', icon: '❄', fog: .55, tint: 0xe9eef7, mix: .55, light: .95, snow: true, flakes: 1, wind: 1.2, mist: .14, mistCol: 0xffffff, cloud: 0xf2f5fa },
  blizzard: { id: 'blizzard', name: 'Blizzard', icon: '🌨', fog: .22, tint: 0xeef2f8, mix: .78, light: .85, snow: true, flakes: 2.4, wind: 11, mist: .45, mistCol: 0xffffff, cloud: 0xe4e9f1, exp: .028 },
  fog: { id: 'fog', name: 'Thick Fog', icon: '🌫', fog: .2, tint: 0xe6e3e8, mix: .72, light: .82, wind: .6, mist: .6, mistCol: 0xf4f1f4, cloud: 0xe8e6ea, exp: .034 },
  sand: { id: 'sand', name: 'Sandstorm', icon: '🏜', fog: .26, tint: 0xd9b47c, mix: .7, light: .78, sand: true, drops: 1.4, wind: 16, mist: .4, mistCol: 0xe6c690, cloud: 0xd6b382, exp: .026 },
};
const DROPS = { potato: 0, low: 700, medium: 1400, high: 2400, ultra: 3600, superultra: 7000 };
let wx = WEATHER.clear, precip = null, pArr = null, pN = 0, flashT = 0, roofs = null, roofI = 0;
const BOX = 26, TOP = 22;
const flakeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
// rain is short slanted lines, sand is fast near-sideways streaks, snow is soft round flakes; all live in a box that follows the camera
function buildPrecip() {
  if (precip) { scene.remove(precip); precip.geometry.dispose(); precip.material.dispose(); precip = null; }
  const base = DROPS[quality.level] ?? ((QUALITY[quality.level] || {}).post ? 1800 : 600);
  pN = Math.round(base * (wx.snow ? .8 * wx.flakes : wx.drops || 0)); if (!pN || wx.id === 'clear') return;
  const g = new THREE.BufferGeometry(), per = wx.snow ? 1 : 2; pArr = new Float32Array(pN * per * 3);
  for (let i = 0; i < pN; i++) { const x = rand(-BOX, BOX), y = rand(0, TOP), z = rand(-BOX, BOX); for (let k = 0; k < per; k++) pArr.set([x, y, z], (i * per + k) * 3); }
  g.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
  roofs = new Float32Array(pN).fill(-1e9); // the underside of any roof above each drop, so rain stops at roofs
  precip = wx.snow
    ? new THREE.Points(g, new THREE.PointsMaterial({ map: flakeTex, size: wx.id === 'blizzard' ? .13 : .16, transparent: true, opacity: .95, depthWrite: false, color: 0xffffff }))
    : new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: wx.sand ? 0xe9cf9a : wx.id === 'storm' ? 0xaab6cc : 0xc5d2e6, transparent: true, opacity: wx.sand ? .4 : .5, depthWrite: false }));
  precip.frustumCulled = false; scene.add(precip);
}
// lowest roof (block underside) above a point, or -1e9 when it's open sky
function roofOver(x, z) { if (!world.def) return -1e9; const c = ceilingAt(x, z, .05, -.5); return c === Infinity || c < .3 ? -1e9 : c; }
// is this spot (or the player) under cover? used for muffled rain and no drops on the lens
export const underCover = (x, z, y) => { const c = ceilingAt(x, z, .3, y); return c !== Infinity && c < y + 30; };
// splashes: little rings popping up on whatever the rain hits (ground and roofs), all in one draw call.
// Additive blending, so fading their colour to black fades them out.
const SPL = 80, splash = new THREE.InstancedMesh(new THREE.RingGeometry(.55, 1, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }), SPL);
splash.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(SPL * 3), 3); splash.frustumCulled = false; splash.count = 0; scene.add(splash);
const spl = [], _sm = new THREE.Matrix4(), _sq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), _sp = new THREE.Vector3(), _ss = new THREE.Vector3(), _sc = new THREE.Color();
let splashN = 0, splashAcc = 0;
function updateSplashes(dt) {
  const rate = !wx.drops || wx.sand || world.night || fxSettings.lite < .5 ? 0 : wx.id === 'storm' ? 70 : 40;
  splashAcc += rate * dt;
  while (splashAcc >= 1) {
    splashAcc--; const c = camera.position, a = Math.random() * Math.PI * 2, r = 1.5 + Math.sqrt(Math.random()) * 13, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
    const y = groundAt(x, z, .05, c.y + 25, 60); if (y > c.y + 8 || y === -Infinity) continue;
    const s = spl.length < SPL ? (spl.push({}), spl[spl.length - 1]) : spl[splashN++ % SPL];
    s.x = x; s.y = y + .03; s.z = z; s.t = 0; s.life = rand(.25, .4); s.size = rand(.08, .16);
  }
  let n = 0;
  for (const s of spl) {
    if (s.t >= s.life) continue; s.t += dt; const k = Math.min(1, s.t / s.life), b = (1 - k) * .55;
    _sm.compose(_sp.set(s.x, s.y, s.z), _sq, _ss.setScalar(s.size + k * .25)); splash.setMatrixAt(n, _sm); splash.setColorAt(n, _sc.setRGB(b, b, b * 1.05)); n++;
  }
  splash.count = n; if (n) { splash.instanceMatrix.needsUpdate = true; splash.instanceColor.needsUpdate = true; }
}
// rain makes everything wet: surfaces get darker and much shinier (they pick up the sky's reflection). Dry again after.
function wetWorld(on) {
  scene.traverse(o => {
    if (!o.isMesh || o === splash || o.userData.ui) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || !m.isMeshStandardMaterial || m === cloudMat) continue;
      if (m.userData.dryR === undefined) { m.userData.dryR = m.roughness; m.userData.dryC = m.color.getHex(); }
      if (on) { if (!m.userData.wet) { m.roughness = Math.max(.08, m.userData.dryR * .38); m.color.setHex(m.userData.dryC).multiplyScalar(.8); m.userData.wet = true; } }
      else if (m.userData.wet) { m.roughness = m.userData.dryR; m.color.setHex(m.userData.dryC); m.userData.wet = false; }
    }
  });
}
// ground mist: a few huge soft sheets of cloud just above the floor, sliding with the wind
const mistTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 70; i++) { const px = Math.random() * 256, py = Math.random() * 256, r = 20 + Math.random() * 60, g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g;
    for (const [ox, oy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) { x.save(); x.translate(ox, oy); x.fillRect(px - r, py - r, r * 2, r * 2); x.restore(); } } // drawn wrapped so it tiles
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
})();
const groundMist = new THREE.Group(); scene.add(groundMist); groundMist.visible = false;
[.35, 1.1, 2.1].forEach((y, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ map: i ? mistTex.clone() : mistTex, transparent: true, depthWrite: false, opacity: 0, color: 0xffffff }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 4; m.userData.k = 1 - i * .25; if (i) { m.material.map.wrapS = m.material.map.wrapT = THREE.RepeatWrapping; m.material.map.repeat.set(2 + i, 2 + i); } groundMist.add(m); });
export function setWeather(id) {
  wx = WEATHER[id] || WEATHER.clear; world.weather = wx.id; buildPrecip();
  wetWorld(!!wx.drops && !wx.sand); splashN = 0;
  groundMist.visible = !!wx.mist && fxSettings.lite >= .5; groundMist.children.forEach(m => { m.material.opacity = (wx.mist || 0) * m.userData.k; m.material.color.set(wx.mistCol || 0xffffff); });
  if (world.def && !world.night && !world.nvg) weatherLook();
}
// darker, greyer (or whiter, or sandier) sky and clouds and much closer fog
function weatherLook() {
  const t = world.def?.theme; if (!t) return;
  cloudMat.color.set(wx.cloud || 0xffffff); cloudMat.emissive.set(wx.cloud ? new THREE.Color(wx.cloud).multiplyScalar(.85) : 0xffeef2);
  if (wx.id === 'clear') { hemi.intensity = 1.15; sun.intensity = 2.5; fill.intensity = .45; return; }
  const bg = new THREE.Color(t.bg).lerp(new THREE.Color(wx.tint), wx.mix);
  scene.background = bg.clone(); setSky(bg.getHex());
  // thick fog, blizzards and sandstorms use a denser curve: near things are clear, then it closes in fast
  scene.fog = wx.exp ? new THREE.FogExp2(bg.getHex(), wx.exp) : new THREE.Fog(bg.getHex(), t.fog[0] * wx.fog, t.fog[1] * wx.fog);
  hemi.intensity = 1.15 * (wx.snow ? 1.08 : wx.light); sun.intensity = 2.5 * wx.light * (wx.snow ? .7 : .6); fill.intensity = .45 * wx.light;
}
// how far you can make anything out (used by the game for the edge of what's drawn)
export const weatherView = () => wx.exp ? 2.3 / wx.exp : 1e9;
// a lightning bolt from the clouds to p: a jagged glowing line with a branch, a blinding flash and the sky lighting up
const bolts = [];
export function lightningBolt(p) {
  const pts = [], top = new THREE.Vector3(p.x + rand(-8, 8), 90, p.z + rand(-8, 8));
  for (let i = 0; i <= 14; i++) { const k = i / 14; pts.push(new THREE.Vector3(lerpN(top.x, p.x, k) + (i && i < 14 ? rand(-2.2, 2.2) : 0), lerpN(top.y, p.y, k), lerpN(top.z, p.z, k) + (i && i < 14 ? rand(-2.2, 2.2) : 0))); }
  const br = [pts[6].clone()]; for (let i = 1; i <= 5; i++) br.push(br[i - 1].clone().add(new THREE.Vector3(rand(-3, 3), -rand(4, 7), rand(-3, 3))));
  const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(0xe6efff).multiplyScalar(9), transparent: true, depthWrite: false, fog: false });
  const g = new THREE.Group(); g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat), new THREE.Line(new THREE.BufferGeometry().setFromPoints(br), mat));
  // a thicker glow around the main bolt (lines are always 1 pixel wide, so a thin tube does the glow)
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .18, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbcd0ff).multiplyScalar(5), transparent: true, opacity: .8, depthWrite: false, fog: false }));
  g.add(tube); g.traverse(o => o.frustumCulled = false); scene.add(g);
  bolts.push({ g, t: .22 }); flashLight(p.clone().setY(p.y + 4), 0xdfe8ff, 260, 90, .3); skyFlash(1);
}
const lerpN = (a, b, k) => a + (b - a) * k;
// the whole sky and every surface lights up for a moment (also used on its own for far-off lightning)
export function skyFlash(k = .6) { flashT = Math.max(flashT, k); }
export const windSpeed = () => wx.wind || 0;
function updateWeather(dt) {
  updateSplashes(dt);
  for (let i = bolts.length - 1; i >= 0; i--) { const b = bolts[i]; b.t -= dt; b.g.visible = b.t > .12 || Math.random() < .6; // flicker
    if (b.t <= 0) { scene.remove(b.g); b.g.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); bolts.splice(i, 1); } }
  if (flashT > 0) {
    flashT = Math.max(0, flashT - dt * 3.2);
    const base = world.night ? 0 : wx.id === 'clear' ? 1.15 : 1.15 * wx.light;
    hemi.intensity = base + flashT * 3.5;
    if (!world.night && !world.nvg) scene.environmentIntensity = .45 + flashT * 1.5;
  }
  const c = camera.position, t = performance.now() / 1000, wind = wx.wind || 0;
  if (groundMist.visible) {
    groundMist.position.set(Math.round(c.x / 8) * 8, 0, Math.round(c.z / 8) * 8);
    groundMist.children.forEach((m, i) => { const o = m.material.map.offset; o.x = (t * (wind * .004 + .003) * (1 + i * .4)) % 1; o.y = (t * .002 * (i + 1)) % 1; });
  }
  if (!precip) return;
  // re-check a slice of the drops each frame for roofs overhead (the box of drops moves with you)
  const ox = c.x, oy = c.y - 6, oz = c.z, per = wx.snow ? 3 : 6, slice = Math.ceil(pN / 40);
  for (let s = 0; s < slice; s++) { roofI = (roofI + 1) % pN; const j = roofI * per; roofs[roofI] = roofOver(pArr[j] + ox, pArr[j + 2] + oz); }
  precip.position.set(c.x, c.y - 6, c.z);
  const a = pArr, n = pN;
  if (wx.snow) {
    const fall = wx.id === 'blizzard' ? 3.6 : 2.2;
    for (let i = 0; i < n; i++) {
      const j = i * 3; a[j] += (Math.sin(t * .8 + i) * .6 + wind) * dt; a[j + 1] -= fall * dt * (.7 + (i % 7) * .07); a[j + 2] += (Math.cos(t * .6 + i * 1.7) * .5 + wind * .3) * dt;
      if (a[j + 1] < 0 || a[j + 1] + oy < roofs[i]) { a[j + 1] = TOP; a[j] = rand(-BOX, BOX); a[j + 2] = rand(-BOX, BOX); roofs[i] = roofOver(a[j] + ox, a[j + 2] + oz); }
      if (a[j] > BOX) a[j] -= BOX * 2; if (a[j + 2] > BOX) a[j + 2] -= BOX * 2;
    }
  } else {
    // rain falls fast with a little slant; sand mostly blows sideways and only drifts down
    const fall = wx.sand ? 2.5 : 26, len = wx.sand ? .35 : wx.id === 'storm' ? .9 : .65, streak = wx.sand ? .06 : .03;
    for (let i = 0; i < n; i++) {
      const j = i * 6; let y = a[j + 1] - fall * dt * (wx.sand ? .5 + (i % 5) * .25 : 1), x = a[j] + wind * dt * (wx.sand ? .8 + (i % 3) * .2 : 1);
      if (y < 0 || y + oy < roofs[i]) { y = TOP; x = rand(-BOX, BOX); a[j + 2] = a[j + 5] = rand(-BOX, BOX); roofs[i] = roofOver(x + ox, a[j + 2] + oz); }
      if (x > BOX) { x -= BOX * 2; a[j + 2] = a[j + 5] = rand(-BOX, BOX); }
      a[j] = x; a[j + 1] = y; a[j + 3] = x - wind * streak; a[j + 4] = y + (wx.sand ? len * .25 : len);
    }
  }
  precip.geometry.attributes.position.needsUpdate = true;
}
// a free spot within r metres of p (used for local patrols on huge maps)
export function openPointNear(p, r) {
  const nav = world.nav;
  for (let i = 0; i < 60; i++) { const x = p.x + rand(-r, r), z = p.z + rand(-r, r); if (Math.abs(x) < world.size - 2 && Math.abs(z) < world.size - 2 && nav.free(x, z)) return new THREE.Vector3(x, 0, z); }
  return openPoint();
}
// one blood drop (trails behind flying robot parts)
export function drip(p, base, v) {
  if (fxSettings.blood === 'off') return;
  emit(P_DROP, { p: p.clone(), v: v ? v.clone() : new V(rand(-.4, .4), rand(-.2, .4), rand(-.4, .4)), col: bloodColor(base), s: rand(.5, 1.2), life: 1.5, g: 16, kind: 'drop' });
}
// Show building outlines only within ~110 m (they fade with distance before that); called every frame.
const edgeChunks = [];
export function updateEdges(eye) {
  const far = world.night ? NIGHT_R : (QUALITY[quality.level] || QUALITY.high).edges || 110;
  for (const l of edgeChunks) { const c = l.geometry.boundingSphere.center, r = l.geometry.boundingSphere.radius, dx = c.x - eye.x, dz = c.z - eye.z; l.visible = Math.hypot(dx, dz) - r < far; }
  // night maps: only the blocks within the torch radius are drawn
  if (world.night) for (const m of blockChunks) { const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const s = g.boundingSphere; m.visible = Math.hypot(s.center.x - eye.x, s.center.z - eye.z) - s.radius < NIGHT_R + 4; }
}
