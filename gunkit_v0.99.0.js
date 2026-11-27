// Building blocks for first-person guns: soft-edged side profiles, lathed tubes, rails, iron sights and optics.
import { normalFrom } from './textures_v0.99.0.js';
// Gun space: -z is forward (muzzle), +y up, x across. Profiles are given as [z, y] points.

export function makeEnv(THREE, renderer) {
  const s = new THREE.Scene(), geo = new THREE.SphereGeometry(10, 32, 16), pos = geo.attributes.position, cols = [];
  const top = new THREE.Color(1, .98, .94), mid = new THREE.Color(.86, .8, .72), low = new THREE.Color(.32, .28, .25), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 10; if (y > 0) c.copy(mid).lerp(top, y); else c.copy(mid).lerp(low, -y); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (x, y, z, w, h, col) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  panel(0, 8, 2, 9, 4, 0xffffff); panel(-7, 3, -4, 3, 6, 0xfff1dc); panel(7, 2, 5, 2, 5, 0xbfe0ee); panel(3, -2, -8, 6, 1.2, 0xffe2c4);
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(s, .04).texture; pm.dispose();
  return tex;
}

// Small procedural textures: wood grain, grip stipple and brushed metal. Made once and shared.
const TEX = {};
function canvasTex(THREE, key, size, draw, repeat, srgb = true) {
  if (TEX[key]) return TEX[key];
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return (TEX[key] = t);
}
function textures(THREE) {
  const wood = canvasTex(THREE, 'wood', 256, (x, N) => {
    x.fillStyle = '#c08a5c'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * N, a = 2 + Math.random() * 5, f = .01 + Math.random() * .02, ph = Math.random() * 6;
      x.strokeStyle = `rgba(${70 + Math.random() * 40},${35 + Math.random() * 20},${15},${.15 + Math.random() * .3})`; x.lineWidth = .6 + Math.random() * 2.2;
      x.beginPath(); for (let u = 0; u <= N; u += 4) { const yy = y + Math.sin(u * f + ph) * a; u ? x.lineTo(u, yy) : x.moveTo(u, yy); } x.stroke();
    }
    for (let i = 0; i < 6; i++) { const cx = Math.random() * N, cy = Math.random() * N, g = x.createRadialGradient(cx, cy, 0, cx, cy, 10); g.addColorStop(0, 'rgba(60,30,12,.5)'); g.addColorStop(1, 'rgba(60,30,12,0)'); x.fillStyle = g; x.fillRect(cx - 10, cy - 10, 20, 20); }
  }, 5);
  const stipple = canvasTex(THREE, 'stipple', 128, (x, N) => {
    const img = x.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { const v = 150 + Math.random() * 105; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    x.putImageData(img, 0, 0);
  }, 40, false);
  const brushed = canvasTex(THREE, 'brushed', 256, (x, N) => {
    x.fillStyle = '#808080'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 900; i++) { const y = Math.random() * N, v = Math.floor(90 + Math.random() * 100); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * N, y, 20 + Math.random() * 120, 1); }
  }, 6, false);
  // handling marks: soft smudges and wear that vary how shiny a painted surface is
  const grime = canvasTex(THREE, 'grime', 256, (x, N) => {
    x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 140; i++) { const cx = Math.random() * N, cy = Math.random() * N, r = 6 + Math.random() * 30, v = Math.random() < .5 ? 40 : 200, g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${v},${v},${v},${.1 + Math.random() * .18})`); g.addColorStop(1, `rgba(${v},${v},${v},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
    for (let i = 0; i < 400; i++) { const v = 150 + Math.random() * 100; x.fillStyle = `rgba(${v},${v},${v},.25)`; x.fillRect(Math.random() * N, Math.random() * N, 1 + Math.random() * 6, 1); }
  }, 3, false);
  return { wood, stipple, brushed, grime };
}

// Joins a group's direct, static meshes into one mesh per material: a gun is drawn in about a dozen calls instead of a
// hundred. Moving parts are groups (slide, mag, bolt...) and stay as they are, as do instanced rails and lines.
export function mergeChildren(THREE, parent) {
  const buckets = new Map();
  for (const c of [...parent.children]) {
    if (!c.isMesh || c.isInstancedMesh || c.children.length || c.userData.keep) continue;
    c.updateMatrix(); let g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); g.applyMatrix4(c.matrix);
    const k = c.material.uuid; if (!buckets.has(k)) buckets.set(k, { m: c.material, list: [], src: [] }); const b = buckets.get(k); b.list.push(g); b.src.push(c);
  }
  for (const { m, list, src } of buckets.values()) {
    if (list.length < 2) { list[0].dispose(); continue; }
    const uv = list.every(g => g.attributes.uv), n = list.reduce((a, g) => a + g.attributes.position.count, 0);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uvs = uv ? new Float32Array(n * 2) : null; let o = 0;
    for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (uv) uvs.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeBoundingSphere(); const mesh = new THREE.Mesh(geo, m); mesh.castShadow = src[0].castShadow; mesh.receiveShadow = src[0].receiveShadow; mesh.raycast = src[0].raycast;
    src.forEach(c => parent.remove(c)); parent.add(mesh);
  }
}
// a normal map that keeps its texture's tiling
const nm = (THREE, t, k) => { const n = normalFrom(THREE, t, k); n.repeat.copy(t.repeat); return n; };
export function materials(THREE, m) {
  const T = textures(THREE);
  const P = o => new THREE.MeshPhysicalMaterial(o), woodish = c => [0xb5734a, 0x8a7f72, 0xa0613b].includes(c);
  // surface relief: stippled polymer, brushed metal and raised wood grain, all worked out from the textures above
  const nStip = nm(THREE, T.stipple, 2.2), nBrush = nm(THREE, T.brushed, 1.4), nWood = nm(THREE, T.wood, 1.6), nGrime = nm(THREE, T.grime, .5);
  const wood = P({ color: 0xb07048, map: T.wood, normalMap: nWood, normalScale: new THREE.Vector2(.6, .6), roughness: .45, metalness: 0, clearcoat: .8, clearcoatRoughness: .22 });
  const poly = P({ color: 0x2b2d42, roughness: .8, roughnessMap: T.stipple, normalMap: nStip, normalScale: new THREE.Vector2(.45, .45), metalness: .05, sheen: .3, sheenColor: 0x6b6f8a });
  const painted = c => P({ color: c, roughness: .46, roughnessMap: T.grime, normalMap: nGrime, normalScale: new THREE.Vector2(.25, .25), metalness: .25, clearcoat: .35, clearcoatRoughness: .32 });
  return {
    body: woodish(m.color) ? wood : painted(m.color),
    acc: woodish(m.accent) ? wood : P({ color: m.accent, roughness: .55, roughnessMap: T.stipple, normalMap: nStip, normalScale: new THREE.Vector2(.3, .3), metalness: .15, clearcoat: .2 }),
    wood, metal: P({ color: 0x3a3d47, roughness: .32, roughnessMap: T.brushed, normalMap: nBrush, normalScale: new THREE.Vector2(.2, .2), metalness: .9, anisotropy: .6 }), steel: P({ color: 0xb3b9c3, roughness: .18, roughnessMap: T.brushed, normalMap: nBrush, normalScale: new THREE.Vector2(.15, .15), metalness: 1, anisotropy: .8 }),
    dark: P({ color: 0x22232c, roughness: .46, roughnessMap: T.grime, metalness: .7, clearcoat: .3, clearcoatRoughness: .25 }), poly,
    rubber: P({ color: 0x17181e, roughness: .95, roughnessMap: T.stipple }), brass: P({ color: 0xd4a73a, roughness: .25, metalness: 1 }),
    glass: P({ color: 0x9fd6ec, roughness: .04, metalness: .2, transparent: true, opacity: .28, envMapIntensity: 2.5 }),
    coat: P({ color: 0x6b4fa0, roughness: .04, metalness: .7, transparent: true, opacity: .6, envMapIntensity: 2.5 }),
    smoke: P({ color: 0x3a3f4a, roughness: .1, metalness: .1, transparent: true, opacity: .55 }),
    white: new THREE.MeshBasicMaterial({ color: 0xf4f1e8 }), red: new THREE.MeshBasicMaterial({ color: 0xff2a2a }),
    tritium: new THREE.MeshBasicMaterial({ color: 0x7dff8a }), orange: new THREE.MeshBasicMaterial({ color: 0xff8c42 }),
    glow: P({ color: m.accent, emissive: m.accent, emissiveIntensity: 1.6, roughness: .3 }),
  };
}

// Muzzle flash: three crossed star planes plus a hot core, drawn additively.
export function muzzleFlash(THREE) {
  const tex = canvasTex(THREE, 'flash', 128, (x, N) => {
    const c = N / 2, g = x.createRadialGradient(c, c, 0, c, c, c); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(.25, 'rgba(255,200,90,.9)'); g.addColorStop(1, 'rgba(255,120,30,0)');
    x.fillStyle = g; x.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? c * .28 : c * (.75 + Math.random() * .25); x.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
    x.closePath(); x.fill();
  }, 1);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(.16, .16), m); g.add(front);
  [0, Math.PI / 2].forEach(r => { const s = new THREE.Mesh(new THREE.PlaneGeometry(.09, .3), m); s.rotation.set(Math.PI / 2, 0, r); s.position.z = -.12; g.add(s); });
  g.userData.front = front;
  return g;
}

export function kit(THREE, g) {
  const dbl = new Map();
  const two = mat => { if (!dbl.has(mat)) { const c = mat.clone(); c.side = THREE.DoubleSide; dbl.set(mat, c); } return dbl.get(mat); };
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  // polygon with rounded corners
  const shape = (pts, r = 0, S = THREE.Shape) => {
    const s = new S(), n = pts.length;
    if (!r) { s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; }
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], rr = Array.isArray(r) ? r[i] : r;
      const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const k1 = Math.min(rr, da / 2) / da, k2 = Math.min(rr, db / 2) / db;
      const p1 = [p[0] + (a[0] - p[0]) * k1, p[1] + (a[1] - p[1]) * k1], p2 = [p[0] + (b[0] - p[0]) * k2, p[1] + (b[1] - p[1]) * k2];
      if (i === 0) s.moveTo(p1[0], p1[1]); else s.lineTo(p1[0], p1[1]);
      s.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
    }
    s.closePath(); return s;
  };
  const rect = (z0, y0, z1, y1) => [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];
  const hole = (pts, r = 0) => shape(pts, r, THREE.Path);
  const circle = (cz, cy, r) => { const p = new THREE.Path(); p.absarc(cz, cy, r, 0, Math.PI * 2, true); return p; };
  // side profile in (z, y), extruded across x with a soft bevel
  const side = (pts, thick, mat, o = {}) => {
    const bev = o.bevel ?? Math.min(.003, thick * .2), s = shape(pts, o.r ?? .004);
    (o.holes || []).forEach(h => s.holes.push(h));
    const depth = Math.max(thick - 2 * bev, .0005);
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 2, curveSegments: 8 });
    geo.rotateY(-Math.PI / 2); geo.translate(depth / 2 + (o.x || 0), 0, 0);
    return add(geo, mat);
  };
  // shape in (x, y) facing the shooter, extruded along z
  const plate = (s, thick, mat, z, o = {}) => {
    const bev = o.bevel ?? 0, geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 16 });
    geo.translate(0, 0, -thick / 2); return add(geo, mat, 0, 0, z);
  };
  // profile of [radius, z] spun around the z axis
  const lathe = (prof, mat, x = 0, y = 0, seg = 28) => { const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), seg); geo.rotateX(Math.PI / 2); return add(geo, two(mat), x, y, 0); };
  const box = (sx, sy, sz, x, y, z, mat) => add(new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z);
  const rbox = (sx, sy, sz, x, y, z, mat, r = .003) => side(rect(z - sz / 2, y - sy / 2, z + sz / 2, y + sy / 2), sx, mat, { x, r, bevel: Math.min(.002, sx * .2) });
  const cyl = (r, len, x, y, z, mat, seg = 18, axis = 'z', r2 = r) => {
    const geo = new THREE.CylinderGeometry(r2, r, len, seg); if (axis === 'z') geo.rotateX(Math.PI / 2); else if (axis === 'x') geo.rotateZ(Math.PI / 2);
    return add(geo, mat, x, y, z);
  };
  const sphere = (r, x, y, z, mat) => add(new THREE.SphereGeometry(r, 12, 10), mat, x, y, z);
  const torus = (R, t, x, y, z, mat, arc = Math.PI * 2, axis = 'z') => { const geo = new THREE.TorusGeometry(R, t, 8, 28, arc); if (axis === 'y') geo.rotateX(Math.PI / 2); if (axis === 'x') geo.rotateY(Math.PI / 2); return add(geo, mat, x, y, z); };
  // picatinny rail: base plus a row of teeth
  const rail = (z0, z1, y, mat, x = 0, w = .021, dir = 1) => {
    const len = z1 - z0; box(w * .8, .006, len, x, y + dir * .003, (z0 + z1) / 2, mat);
    const n = Math.max(2, Math.floor(len / .01)), tooth = new THREE.BoxGeometry(w, .0045, .0052), im = new THREE.InstancedMesh(tooth, mat, n), o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { o.position.set(x, y + dir * .0075, z0 + .005 + i * (len - .01) / Math.max(1, n - 1)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    g.add(im); return im;
  };
  const pin = (x, y, z, r, mat, len = .036) => cyl(r, len, x, y, z, mat, 10, 'x');
  // Everything built inside fn goes into its own group (a moving part: slide, magazine, bolt...).
  const capture = (fn, into) => {
    const start = g.children.length; fn();
    const grp = into || new THREE.Group(); g.children.slice(start).forEach(c => grp.add(c));
    if (!into) g.add(grp); return grp;
  };
  // a screw head with a slot
  const screw = (x, y, z, r, mat, axis = 'x') => { cyl(r, .002, x, y, z, mat, 12, axis); const s = box(axis === 'x' ? .0022 : r * 1.6, axis === 'x' ? r * 1.6 : .0022, axis === 'z' ? .0022 : .0005, x + (axis === 'x' ? Math.sign(x || 1) * .001 : 0), y, z, mat); s.rotation[axis === 'x' ? 'x' : 'z'] = .7; };
  return { add, shape, hole, circle, rect, side, plate, lathe, box, rbox, cyl, sphere, torus, rail, pin, two, capture, screw, g };
}

// ---------- iron sights ----------
// Front post: base from baseY up to sightY, with protective ears or a hood.
export function frontPost(K, M, z, baseY, sightY, style = 'ar') {
  const h = sightY - baseY;
  if (style === 'bead') { K.sphere(.0035, 0, sightY - .0035, z, M.brass); return; }
  if (style === 'pistol') { K.rbox(.004, h + .002, .006, 0, baseY + h / 2, z, M.dark, .001); K.cyl(.0016, .002, 0, sightY - .003, z + .0035, M.tritium, 10); return; }
  // A-frame / block base
  K.side([[z + .018, baseY], [z - .016, baseY], [z - .007, baseY + h * .55], [z + .007, baseY + h * .55]], .02, M.dark, { r: .002 });
  K.box(.0032, h * .5 + .002, .0032, 0, baseY + h * .75, z, M.dark);
  if (style === 'hood') K.torus(.0095, .0016, 0, baseY + h * .6, z, M.dark, Math.PI);
  else { K.side(K.rect(z - .006, baseY + h * .5, z + .006, sightY + .004), .0025, M.dark, { x: -.0085, r: .002, bevel: 0 }); K.side(K.rect(z - .006, baseY + h * .5, z + .006, sightY + .004), .0025, M.dark, { x: .0085, r: .002, bevel: 0 }); }
}
// Rear sight: a ghost-ring aperture or a U notch, centred on sightY.
export function rearSight(K, M, THREE, z, baseY, sightY, style = 'aperture') {
  if (style === 'aperture') {
    K.rbox(.026, .008, .026, 0, baseY + .004, z, M.dark, .002);
    const s = K.shape([[-.0115, baseY + .006], [.0115, baseY + .006], [.0115, sightY + .006], [.007, sightY + .0105], [-.007, sightY + .0105], [-.0115, sightY + .006]], .002);
    s.holes.push(K.circle(0, sightY, .0042));
    K.plate(s, .004, M.dark, z - .004);
    [-1, 1].forEach(sx => K.side(K.rect(z - .01, baseY + .004, z + .01, sightY + .008), .003, M.dark, { x: sx * .0145, r: .003, bevel: 0 }));
  } else {
    const w = style === 'pistol' ? .022 : .026, nw = .0055, top = sightY + .006;
    const s = K.shape([[-w / 2, baseY], [w / 2, baseY], [w / 2, top], [nw / 2, top], [nw / 2, sightY], [-nw / 2, sightY], [-nw / 2, top], [-w / 2, top]], 0);
    K.plate(s, style === 'pistol' ? .008 : .005, M.dark, z);
    if (style === 'pistol') [-1, 1].forEach(sx => K.cyl(.0014, .002, sx * .0065, sightY + .001, z + .0045, M.tritium, 10));
  }
}

// ---------- optics ----------  each returns { sightY, rearZ }
export function redDot(K, M, z, railY) {
  const y = railY + .032;
  K.rbox(.024, .012, .05, 0, railY + .012, z, M.dark, .003);                                  // mount
  K.side([[z + .016, railY + .016], [z - .016, railY + .016], [z - .012, y - .012], [z + .012, y - .012]], .012, M.dark, { r: .003 });
  K.lathe([[.0158, z - .032], [.0195, z - .028], [.0195, z + .026], [.017, z + .031], [.0158, z + .032]], M.dark, 0, y);
  K.torus(.0198, .0022, 0, y, z - .012, M.metal); K.torus(.0198, .0022, 0, y, z + .012, M.metal);
  K.cyl(.0075, .012, .022, y, z + .004, M.metal, 14, 'x'); K.cyl(.0062, .01, 0, y + .022, z - .006, M.metal, 14, 'y');
  K.cyl(.0157, .0012, 0, y, z - .03, M.coat, 24); K.cyl(.0157, .0012, 0, y, z + .03, M.glass, 24);
  K.sphere(.0011, 0, y, z - .025, M.red);
  return { sightY: y, rearZ: z + .032 };
}
export function holo(K, M, THREE, z, railY) {
  const y = railY + .03;
  K.rbox(.036, .016, .09, 0, railY + .009, z, M.dark, .004);                                  // body
  const hood = K.shape([[-.019, railY + .014], [.019, railY + .014], [.019, y + .016], [.012, y + .021], [-.012, y + .021], [-.019, y + .016]], .004);
  hood.holes.push(K.hole([[-.0145, y - .012], [.0145, y - .012], [.0145, y + .014], [-.0145, y + .014]], .003));
  K.plate(hood, .05, M.dark, z - .012, { bevel: .0015 });
  K.cyl(.006, .022, .022, railY + .012, z + .02, M.metal, 14, 'x');
  [-.008, 0, .008].forEach(x => K.box(.005, .004, .004, x, railY + .016, z + .045, M.rubber));
  K.add(new THREE.PlaneGeometry(.029, .026), M.glass, 0, y + .001, z - .02);
  K.torus(.0055, .0006, 0, y, z - .021, M.red); K.sphere(.0008, 0, y, z - .021, M.red);
  return { sightY: y, rearZ: z + .045 };
}
export function acog(K, M, z, railY) {
  const y = railY + .03, len = .12, zf = z - len / 2, zb = z + len / 2;
  K.side([[zf + .02, railY + .006], [zb - .01, railY + .006], [zb - .006, y + .004], [zb - .02, y + .022], [zf + .035, y + .022], [zf + .02, y + .01]], .042, M.dark, { r: .006 });
  K.lathe([[.012, zf + .02], [.021, zf + .012], [.024, zf], [.021, zf - .004]], M.dark, 0, y);
  K.cyl(.0215, .0012, 0, y, zf - .003, M.coat, 24);
  K.lathe([[.012, zb - .01], [.017, zb], [.017, zb + .018], [.015, zb + .02]], M.dark, 0, y);
  K.cyl(.0145, .0012, 0, y, zb + .019, M.glass, 24);
  K.cyl(.003, len * .6, 0, y + .025, z - .005, M.tritium, 10); // fibre optic
  K.cyl(.007, .014, .025, y, z, M.metal, 14, 'x'); K.cyl(.007, .014, 0, y + .026, z + .018, M.metal, 14, 'y');
  return { sightY: y, rearZ: zb + .02 };
}
export function scope(K, M, z, railY, mag) {
  const rObj = { 4: .023, 6: .026, 8: .029, 12: .032 }[mag] || .024, len = .2 + mag * .006, zf = z - len / 2, zb = z + len / 2;
  const y = railY + Math.max(.03, rObj + .008);
  K.lathe([[rObj - .004, zf], [rObj, zf + .005], [rObj, zf + .04], [.0155, zf + .075], [.0155, zb - .065], [.0195, zb - .04], [.0205, zb - .006], [.018, zb]], M.dark, 0, y, 32);
  K.cyl(rObj - .0035, .0012, 0, y, zf + .002, M.coat, 32);
  K.cyl(.0165, .0012, 0, y, zb - .002, M.glass, 32);
  // magnification ring with grip ridges
  K.cyl(.0212, .018, 0, y, zb - .05, M.rubber, 28); for (let i = 0; i < 4; i++) K.torus(.0214, .0011, 0, y, zb - .057 + i * .0045, M.metal);
  // turrets: elevation (top), windage (right), parallax (left)
  const tur = (axis, sx, sy, r) => { K.cyl(r * .8, .012, sx * .022, y + sy * .022, z, M.dark, 18, axis); K.cyl(r, .012, sx * .03, y + sy * .03, z, M.metal, 24, axis); if (axis === 'y') for (let i = 0; i < 3; i++) K.torus(r + .0006, .0008, 0, y + .026 + i * .004, z, M.dark, Math.PI * 2, 'y'); };
  tur('y', 0, 1, .0105); tur('x', 1, 0, .0095); if (mag >= 8) tur('x', -1, 0, .013);
  // rings and mount
  [-1, 1].forEach(s => { const rz = z + s * len * .2; K.torus(.0172, .0032, 0, y, rz, M.metal); K.rbox(.022, y - railY - .012, .02, 0, (y + railY) / 2 - .006, rz, M.metal, .002); K.pin(.019, y - .016, rz, .0025, M.steel, .006); });
  return { sightY: y, rearZ: zb };
}

// ---------- muzzle devices ----------
export function birdcage(K, M, z, y) { K.lathe([[.0095, z], [.0115, z - .004], [.0115, z - .042], [.0105, z - .046]], M.dark, 0, y, 20); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; K.box(.002, .009, .028, Math.cos(a) * .011, y + Math.sin(a) * .011, z - .026, M.rubber).rotation.z = a; } return z - .046; }
export function slantBrake(K, M, z, y) { K.lathe([[.01, z], [.012, z - .006], [.012, z - .03], [.009, z - .036]], M.dark, 0, y, 18); K.box(.016, .004, .02, 0, y + .011, z - .02, M.rubber); return z - .036; }

// ---------- arms ----------
// Your own arms, dressed like your character (Character screen): armour gauntlets in your shirt colour over a cream
// suit, dark gloves with armoured knuckles, a glowing vent and wrist computer in your visor colour.
// Each arm is a two-bone rig (upper arm + forearm with a real elbow). The right hand stays on the grip; the left one
// is solved every frame (view.leftRig.solve), so during reloads it really reaches for the pouch, the mag and the
// charging handle and the elbow bends to follow.
export function arms(THREE, K, view, look = {}) {
  const P = o => new THREE.MeshPhysicalMaterial(o);
  const armor = P({ color: look.armor ?? 0xff8fab, roughness: .32, metalness: .12, clearcoat: .6, clearcoatRoughness: .22 });
  if (look.armorFx === 'gold') Object.assign(armor, { metalness: .9, roughness: .22 }); if (look.armorFx === 'chrome') Object.assign(armor, { metalness: 1, roughness: .1 });
  if (look.armorFx === 'glow') { armor.emissive.set(0x3a1a8a); armor.emissiveIntensity = .9; }
  const suit = P({ color: 0xf3efe4, roughness: .7, sheen: .5, sheenColor: 0xffffff });
  const glove = P({ color: 0x2b2f36, roughness: .6, metalness: .25, sheen: .35, sheenColor: 0x8a93a8 });
  const frame = P({ color: 0x2b2f36, roughness: .4, metalness: .55 });
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(look.glow ?? 0xffffff).multiplyScalar(2.2) });
  if (look.armorFx === 'rainbow') armor.userData.rainbow = true; if (look.glowFx === 'rainbow') glow.userData.rainbowBasic = true;
  view.armMats = [armor, glow];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; };
  const FORE = .27, UPPER = .31;
  // forearm: built hanging along -y from the elbow to the wrist; +z is the face you look at, s = 1 left arm, -1 right
  const forearm = (s, big) => {
    const f = new THREE.Group(), F = FORE;
    mesh(new THREE.CylinderGeometry(.037, .031, F, 16), suit, f, 0, -F / 2);
    mesh(new THREE.CylinderGeometry(.045, .039, .16, 8), armor, f, 0, -F + .095, 0, 0, Math.PI / 8);
    mesh(new THREE.TorusGeometry(.044, .0045, 6, 8), frame, f, 0, -F + .175, 0, Math.PI / 2, 0, Math.PI / 8);
    mesh(new THREE.TorusGeometry(.0385, .0045, 6, 8), frame, f, 0, -F + .016, 0, Math.PI / 2, 0, Math.PI / 8);
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(.004, .006, .022), frame, f, s * .043, -F + .13 - i * .014, 0);
    mesh(new THREE.BoxGeometry(.003, .045, .016), glow, f, s * .0425, -F + .075, 0);
    const dw = big ? .046 : .03, dl = big ? .06 : .036;
    mesh(new THREE.BoxGeometry(dw, dl, .012), frame, f, 0, -F + .09, .041); mesh(new THREE.BoxGeometry(dw - .008, dl - .01, .004), glow, f, 0, -F + .09, .048);
    if (big) [-.012, 0, .012].forEach(x => mesh(new THREE.CylinderGeometry(.0035, .0035, .005, 10), armor, f, x, -F + .09 - dl / 2 - .007, .046, Math.PI / 2));
    mesh(new THREE.SphereGeometry(.038, 16, 12), frame, f); mesh(new THREE.SphereGeometry(.04, 16, 12), armor, f, 0, .004, -.022).scale.set(.95, .95, .6);
    mesh(new THREE.TorusGeometry(.032, .006, 6, 18), frame, f, 0, -F + .002, 0, Math.PI / 2);
    return f;
  };
  const upperArm = s => {
    const u = new THREE.Group(), L = UPPER;
    mesh(new THREE.CylinderGeometry(.047, .04, L, 16), suit, u, 0, -L / 2);
    mesh(new THREE.BoxGeometry(.018, .13, .05), armor, u, s * .042, -L * .55, 0);
    [-.1, -.24].forEach(y => mesh(new THREE.TorusGeometry(.046, .006, 6, 20), frame, u, 0, y, 0, Math.PI / 2));
    return u;
  };
  // hand: palm, armoured back plate and knuckles, four curled fingers with tip caps and a thumb, round a grip at p
  const capsule = (a, b, r, mat, parent) => { const len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 8), mat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); parent.add(m); return m; };
  const hand = (dir, c) => {
    const h = new THREE.Group();
    mesh(new THREE.BoxGeometry(.034, .07, .05), glove, h, c * .016, 0, .012);
    mesh(new THREE.BoxGeometry(.008, .064, .044), armor, h, c * .034, 0, .012);           // back-of-hand plate
    for (let i = 0; i < 4; i++) {
      const fy = .024 - i * .017, a = V(c * .018, fy, -.012), b = V(-c * .012, fy - .002, -.024 * dir);
      capsule(a, b, .0074, glove, h); mesh(new THREE.BoxGeometry(.012, .011, .012), armor, h, c * .024, fy, -.01);   // knuckle armour
      mesh(new THREE.SphereGeometry(.0078, 8, 6), frame, h, b.x, b.y, b.z);
    }
    capsule(V(c * .022, .028, .012), V(-c * .006, .038, -.014), .008, glove, h); // thumb
    return h;
  };
  // a rig: hand at the grip point, wrist a fixed step from it, elbow solved between the shoulder and the wrist
  const rig = (handPt, wristOff, shoulder, pole, s, dir, big) => {
    const g = new THREE.Group(), hd = hand(dir, -s), up = upperArm(s), fo = forearm(s, big); [hd, up, fo].forEach(x => mergeChildren(THREE, x)); g.add(hd, up, fo); view.group.add(g);
    const tmp = { y: V(0, 0, 0), z: V(0, 0, 0), x: V(0, 0, 0), m: new THREE.Matrix4(), hint: V(0, 1, .6).normalize(), w: V(0, 0, 0), sh: V(0, 0, 0) };
    const orient = (obj, a, b) => {
      tmp.y.copy(a).sub(b).normalize(); tmp.z.copy(tmp.hint).addScaledVector(tmp.y, -tmp.hint.dot(tmp.y)).normalize(); tmp.x.crossVectors(tmp.y, tmp.z);
      obj.position.copy(a); obj.quaternion.setFromRotationMatrix(tmp.m.makeBasis(tmp.x, tmp.y, tmp.z));
    };
    const R = { group: g, hand: hd, rest: handPt.clone(), elbow: V(0, 0, 0), solve(H, q) {
      hd.position.copy(H); if (q) hd.quaternion.copy(q); else hd.quaternion.identity();
      const W = tmp.w.copy(wristOff).applyQuaternion(hd.quaternion).add(H);
      const S = tmp.sh.copy(shoulder), max = FORE + UPPER - .015;
      if (S.distanceTo(W) > max) S.sub(W).setLength(max).add(W);                           // shoulder leans in for far reaches
      const d = Math.max(.05, S.distanceTo(W)), u = S.clone().sub(W).divideScalar(d);
      const x = (FORE * FORE - UPPER * UPPER + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, FORE * FORE - x * x));
      const side = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
      const E = R.elbow.copy(W).addScaledVector(u, x).addScaledVector(side, hh);
      orient(up, S, E); orient(fo, E, W);
    } };
    R.solve(handPt); return R;
  };
  const start = view.group.children.length;
  const rg = view.grip.clone().add(V(.004, -.012, .006));
  view.rightRig = rig(rg, V(.03, -.045, .075), V(.2, -.34, .52), V(1, -1.1, .15), -1, 1, false);
  if (view.oneHand) { view.leftArm = new THREE.Group(); view.group.add(view.leftArm); view.leftHand = view.grip.clone(); view.leftRig = null; } // one-handed melee: the left arm stays out of view
  else {
    let lp, wo, sh, pole, dir = 1;
    if (view.ak) { lp = view.ak.gripL.clone().add(V(-.004, -.012, .006)); wo = V(-.03, -.045, .075); sh = V(lp.x - .2, -.34, .52); pole = V(-1, -1.1, .15); } // dual pistols: a mirror of the right
    else if (view.pistol) { lp = view.grip.clone().add(V(-.028, -.02, .004)); wo = V(-.035, -.045, .07); sh = V(-.22, -.34, .5); pole = V(-1, -1.1, .1); }
    else { lp = view.fore.clone().add(V(-.006, -.028, 0)); wo = V(-.045, -.055, .05); sh = V(-.26, -.34, .46); pole = V(-1, -1.3, -.1); dir = -1; }
    view.leftRig = rig(lp, wo, sh, pole, 1, dir, true); view.leftArm = view.leftRig.group; view.leftHand = lp;
  }
  // and both arms together, so the detailed inspect can hide them while you turn the gun
  const all = new THREE.Group(); view.group.children.slice(start).forEach(c => all.add(c)); view.group.add(all); view.armsG = all;
}
