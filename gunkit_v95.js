// Building blocks for first-person guns: soft-edged side profiles, lathed tubes, rails, iron sights and optics.
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
  return { wood, stipple, brushed };
}

export function materials(THREE, m) {
  const T = textures(THREE);
  const P = o => new THREE.MeshPhysicalMaterial(o), woodish = c => [0xb5734a, 0x8a7f72, 0xa0613b].includes(c);
  const wood = P({ color: 0xb07048, map: T.wood, roughness: .45, metalness: 0, clearcoat: .8, clearcoatRoughness: .22 });
  const poly = P({ color: 0x2b2d42, roughness: .8, roughnessMap: T.stipple, metalness: .05, sheen: .3, sheenColor: 0x6b6f8a });
  return {
    body: woodish(m.color) ? wood : P({ color: m.color, roughness: .4, metalness: .3, clearcoat: .45, clearcoatRoughness: .3 }),
    acc: woodish(m.accent) ? wood : P({ color: m.accent, roughness: .55, roughnessMap: T.stipple, metalness: .15, clearcoat: .2 }),
    wood, metal: P({ color: 0x3a3d47, roughness: .32, roughnessMap: T.brushed, metalness: .9, anisotropy: .6 }), steel: P({ color: 0xb3b9c3, roughness: .18, roughnessMap: T.brushed, metalness: 1, anisotropy: .8 }),
    dark: P({ color: 0x22232c, roughness: .46, metalness: .7, clearcoat: .2 }), poly,
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

// ---------- gloved arms ----------
export function arms(THREE, K, view) {
  const glove = new THREE.MeshPhysicalMaterial({ color: 0x3a3c52, roughness: .85, sheen: .5, sheenColor: 0x9cc5d6 });
  const knuckle = new THREE.MeshPhysicalMaterial({ color: 0x2b2d42, roughness: .7 });
  const sleeve = new THREE.MeshPhysicalMaterial({ color: 0x5f6f52, roughness: .95, sheen: .6, sheenColor: 0xcfd8b5 });
  const cuff = new THREE.MeshPhysicalMaterial({ color: 0xcfb58a, roughness: .9 });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const limb = (a, b, r, mat, r2 = r * 1.15) => {
    const len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, len, 16), mat);
    m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); view.group.add(m); return m;
  };
  const capsule = (a, b, r, mat) => { limb(a, b, r, mat, r); K.sphere(r, a.x, a.y, a.z, mat); K.sphere(r, b.x, b.y, b.z, mat); };
  // fingers wrap round the grip: four capsules curling from the knuckles
  const hand = (p, dir, curlSide) => {
    const palm = new THREE.Mesh(new THREE.BoxGeometry(.034, .07, .05), glove); palm.position.copy(p).add(V(curlSide * .016, 0, .012)); view.group.add(palm);
    K.rbox(.036, .06, .012, p.x + curlSide * .016, p.y, p.z + .036, knuckle, .004);
    for (let i = 0; i < 4; i++) { const fy = p.y + .024 - i * .017, a = V(p.x + curlSide * .018, fy, p.z - .012), b = V(p.x - curlSide * .012, fy - .002, p.z - .024 * dir); capsule(a, b, .0072, glove); }
    capsule(V(p.x + curlSide * .022, p.y + .028, p.z + .012), V(p.x - curlSide * .006, p.y + .038, p.z - .014), .0078, glove); // thumb
  };
  // two-bone arms: forearm + upper arm with a real elbow, so long guns and bullpups don't stretch one straight tube
  const FORE = .27, UPPER = .31;
  const reach = (wr, sh, pole, cuffX) => {
    let s = sh.clone(); const max = FORE + UPPER - .015;
    if (s.distanceTo(wr) > max) s = wr.clone().add(s.sub(wr).setLength(max));      // shoulder leans in for far grips
    const d = Math.max(.05, s.distanceTo(wr)), u = s.clone().sub(wr).divideScalar(d);
    const x = (FORE * FORE - UPPER * UPPER + d * d) / (2 * d), h = Math.sqrt(Math.max(0, FORE * FORE - x * x));
    const side = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
    const elbow = wr.clone().addScaledVector(u, x).addScaledVector(side, h);
    limb(wr, elbow, .036, sleeve, .031); K.sphere(.037, elbow.x, elbow.y, elbow.z, sleeve); limb(elbow, s, .045, sleeve, .038);
    K.lathe([[.03, wr.z - .02], [.034, wr.z], [.034, wr.z + .028], [.031, wr.z + .03]], cuff, wr.x + cuffX, wr.y + .008, 16);
  };
  // the left hand and arm are their own group so reloads can move them (to the mag pouch and back)
  const start = view.group.children.length;
  const rg = view.grip.clone().add(V(.004, -.012, .006));
  hand(rg, 1, 1);
  reach(rg.clone().add(V(.03, -.045, .075)), V(.2, -.34, .52), V(1, -1.1, .15), -.005);
  if (view.oneHand) { view.leftArm = K.capture(() => { }); view.leftHand = view.grip.clone(); } // one-handed melee: the left arm stays out of view
  else if (view.ak) { // dual pistols: the left hand holds its own gun, a mirror of the right
    view.leftArm = K.capture(() => { const lg = view.ak.gripL.clone().add(V(-.004, -.012, .006)); hand(lg, 1, -1); view.leftHand = lg;
    reach(lg.clone().add(V(-.03, -.045, .075)), V(lg.x - .2, -.34, .52), V(-1, -1.1, .15), .005); });
  } else if (view.pistol) {
    view.leftArm = K.capture(() => { const lg = view.grip.clone().add(V(-.028, -.02, .004)); hand(lg, 1, -1); view.leftHand = lg;
    reach(lg.clone().add(V(-.035, -.045, .07)), V(-.22, -.34, .5), V(-1, -1.1, .1), .005); });
  } else {
    view.leftArm = K.capture(() => { const lf = view.fore.clone().add(V(-.006, -.028, 0)); hand(lf, -1, -1); view.leftHand = lf;
    reach(lf.clone().add(V(-.045, -.055, .05)), V(-.26, -.34, .46), V(-1, -1.3, -.1), .005); });
  }
  // and both arms together, so the detailed inspect can hide them while you turn the gun
  const all = new THREE.Group(); view.group.children.slice(start).forEach(c => all.add(c)); view.group.add(all); view.armsG = all;
}
