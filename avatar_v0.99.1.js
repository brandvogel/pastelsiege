// Player characters: the armoured spacefighter every player is drawn as (friends in co-op, and you on the Character
// screen). Glossy helmet with a mirror visor, layered armour plates, pauldrons, gauntlets, knee pads, mag boots and a
// life-support pack. Your look paints it: shirt = the armour plates, pants = the under-suit on the legs, visor = the
// visor tint and every glowing strip.
//
// Built from a few hundred small shapes, then merged: every part that never moves on its own is joined into one mesh
// per material on the joint it rides on (hips, each hip, knee and ankle, and the aim group that carries the head, arms
// and gun). A whole character is about 40 draw calls instead of 300.
import { THREE } from './world_v0.99.1.js';

// ---------- looks ----------
// req: { lvl } = player level, { leg } = number of Legendary badges. Fancy finishes: gold, chrome, galaxy (glows), rainbow (cycles).
const PAINT = [
  ['pink', 'Pink', 0xff8fab], ['mint', 'Mint', 0x7bd8b5], ['sky', 'Sky', 0x8fb8ff], ['lemon', 'Lemon', 0xffc86b], ['lilac', 'Lilac', 0xc49bff],
  ['peach', 'Peach', 0xffb38a], ['coral', 'Coral', 0xf28482], ['sage', 'Sage', 0xa3c9a8], ['cream', 'Cream', 0xf4ecd8], ['navy', 'Navy', 0x2b2d42],
  ['gold', 'Gold', 0xffcf5a, { lvl: 20 }, 'gold'], ['chrome', 'Chrome', 0xc9d2e3, { lvl: 30 }, 'chrome'], ['galaxy', 'Galaxy', 0x6a4cff, { leg: 1 }, 'glow'], ['rainbow', 'Rainbow', 0xff8fab, { leg: 3 }, 'rainbow'],
].map(([id, name, hex, req, fx]) => ({ id, name, hex, req, fx }));
export const LOOK = {
  shirt: PAINT, pants: PAINT,
  visor: [['white', 'White', 0xffffff], ['cyan', 'Cyan', 0x7ff6ff], ['pink', 'Pink', 0xff8fd8], ['lime', 'Lime', 0xb6ff6b], ['amber', 'Amber', 0xffb347],
    ['red', 'Red', 0xff3b3b, { lvl: 8 }], ['gold', 'Gold', 0xffd75a, { lvl: 25 }], ['rainbow', 'Rainbow', 0xffffff, { leg: 2 }, 'rainbow']].map(([id, name, hex, req, fx]) => ({ id, name, hex, req, fx })),
  hat: [['none', 'No hat'], ['cap', 'Cap'], ['beanie', 'Beanie'], ['phones', 'Headphones', { lvl: 5 }], ['antenna', 'Antenna', { lvl: 10 }], ['bunny', 'Bunny ears', { lvl: 15 }],
    ['tophat', 'Top hat', { lvl: 22 }], ['halo', 'Halo', { lvl: 30 }], ['crown', 'Crown', { leg: 1 }]].map(([id, name, req]) => ({ id, name, req })),
  back: [['none', 'Life support'], ['pack', 'Backpack'], ['jet', 'Jetpack', { lvl: 12 }], ['cape', 'Cape', { lvl: 18 }], ['wings', 'Wings', { lvl: 35 }], ['gwings', 'Golden wings', { leg: 5 }]].map(([id, name, req]) => ({ id, name, req })),
  tag: [['team', 'Team colour', 0], ['white', 'White', 0xffffff], ['gold', 'Gold', 0xffcf5a, { lvl: 25 }], ['rainbow', 'Rainbow', 0xff8fab, { leg: 2 }, 'rainbow']].map(([id, name, hex, req, fx]) => ({ id, name, hex, req, fx })),
};
export const DEFAULT_LOOK = { shirt: 'pink', pants: 'navy', visor: 'white', hat: 'none', back: 'none', tag: 'team' };
export const pick = (k, id) => LOOK[k].find(x => x.id === id) || LOOK[k].find(x => x.id === DEFAULT_LOOK[k]);
// keep only known ids (looks arrive from other players)
export const cleanLook = l => Object.fromEntries(Object.keys(DEFAULT_LOOK).map(k => [k, pick(k, l?.[k]).id]));
// the colours of a look, for things drawn elsewhere (your own arms in first person)
export function lookColors(look) {
  const L = cleanLook(look), S = pick('shirt', L.shirt), P = pick('pants', L.pants), V = pick('visor', L.visor);
  return { armor: S.hex, armorFx: S.fx || '', suit: P.hex, suitFx: P.fx || '', glow: V.hex, glowFx: V.fx || '' };
}
function paintMat(o, rough = .45, metal = .1) {
  const m = new THREE.MeshStandardMaterial({ color: o.hex, roughness: rough, metalness: metal });
  if (o.fx === 'gold') Object.assign(m, { metalness: .85, roughness: .25 });
  if (o.fx === 'chrome') Object.assign(m, { metalness: 1, roughness: .12 });
  if (o.fx === 'glow') { m.emissive.set(0x3a1a8a); m.emissiveIntensity = .9; }
  if (o.fx === 'rainbow') m.userData.rainbow = true;
  return m;
}
// rainbow parts cycle colour; call every frame with the time in seconds
export function tintRainbow(mats, t) { for (const m of mats) { if (m.userData.rainbow) m.color.setHSL((t * .15) % 1, .75, .7); if (m.emissive && m.userData.glowRainbow) m.emissive.setHSL((t * .15) % 1, .9, .5); } }

// ---------- shapes ----------
const V2 = (x, y) => new THREE.Vector2(x, y), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// organic limb: lathed profile with rounded ends, a muscle swell near the top and a taper toward the next joint
function limbGeo(r, l, bulge = .14, taper = .8, seg = 18) {
  const h = l + r * 1.7, pts = [], N = 16, capH = r * .95;
  for (let i = 0; i <= N; i++) {
    const t = i / N, e = Math.min(t, 1 - t) * h;
    let rad = r * (taper + (1 - taper) * t + bulge * Math.sin(Math.PI * Math.pow(t, 1.35)));
    if (e < capH) rad *= Math.sqrt(Math.max(0, 1 - Math.pow(1 - e / capH, 2)));
    pts.push(V2(Math.max(rad, .0005), -h / 2 + t * h));
  }
  return new THREE.LatheGeometry(pts, seg);
}
const cyl = (rt, rb, h, s = 14) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r, a, b) => new THREE.SphereGeometry(r, a ?? (r < .04 ? 10 : 18), b ?? (r < .04 ? 7 : 12));
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const tor = (r, t, rs = 6, ts = 20, arc) => new THREE.TorusGeometry(r, t, rs, ts, arc);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 3, 8);
const tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V3(...p))), 12, r, 6, false);

// ---------- merging ----------
// Joins every mesh under a joint (down to the next joint) into one mesh per material. Joints are the groups that animate.
function bake(joint, isJoint) {
  joint.updateMatrixWorld(true);
  const inv = joint.matrixWorld.clone().invert(), buckets = new Map(), rel = new THREE.Matrix4();
  const walk = node => {
    for (const ch of [...node.children]) {
      if (isJoint(ch)) { bake(ch, isJoint); continue; }
      if (ch.isMesh && !ch.userData.keep) {
        let geo = ch.geometry.index ? ch.geometry.toNonIndexed() : ch.geometry.clone();
        geo.applyMatrix4(rel.multiplyMatrices(inv, ch.matrixWorld));
        const key = ch.material.uuid; if (!buckets.has(key)) buckets.set(key, { mat: ch.material, geos: [], shadow: ch.castShadow });
        buckets.get(key).geos.push(geo); ch.geometry.dispose();
      }
      walk(ch);
      if (!ch.children.length || ch.children.every(c => !isJoint(c) && !hasJoint(c))) node.remove(ch);
    }
  };
  const hasJoint = n => n.children.some(c => isJoint(c) || hasJoint(c));
  walk(joint);
  for (const { mat, geos, shadow } of buckets.values()) {
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
    for (const g of geos) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; joint.add(m);
  }
}

// ---------- the fighter ----------
// Everything is built facing +z with the feet at y = 0 (1 unit = 1 m, about 1.9 m tall), inside wrappers turned to face
// -z (the way the game's yaw points) and scaled to the player's size.
const SCALE = .9, UPPER = .32, FORE = .31;
// opt.noBake: keep every part separate (for checking the model)
export function buildAvatar(look, opt = {}) {
  const L = cleanLook(look), Sh = pick('shirt', L.shirt), Pa = pick('pants', L.pants), Vz = pick('visor', L.visor);
  const M = {
    armor: paintMat(Sh, .35, .15), legs: paintMat(Pa, .55, .05),
    suit: new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: .6 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: .45, metalness: .5 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0xf6f2e8, roughness: .14, metalness: .12, envMapIntensity: 1.3 }),
    // a gold mirror, tinted toward your visor colour
    visor: new THREE.MeshStandardMaterial({ color: new THREE.Color(0xd9a21b).lerp(new THREE.Color(Vz.hex), Vz.hex === 0xffffff ? 0 : .45), roughness: .04, metalness: .95, emissive: Vz.hex, emissiveIntensity: .08, envMapIntensity: 1.7 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x111111, emissive: Vz.hex, emissiveIntensity: 1.6, roughness: .3 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xffcf5a, metalness: .85, roughness: .25, emissive: 0x6b4a00, emissiveIntensity: .3 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a13b, roughness: .3, metalness: .7 }),
  };
  if (Vz.fx === 'rainbow') { M.glow.userData.glowRainbow = true; M.visor.userData.glowRainbow = true; }
  const part = (geo, mat, parent, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scl); m.castShadow = true; parent.add(m); return m;
  };
  const group = (parent, pos = [0, 0, 0], rot = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g); return g; };
  const joints = new Set(), joint = g => (joints.add(g), g);

  const g = new THREE.Group();
  const inner = group(g, [0, 0, 0], [0, Math.PI, 0]); inner.scale.setScalar(SCALE);
  // ---- hips: pelvis, belt, torso and pack ride here (moves down when crouching) ----
  const hips = joint(group(inner, [0, 1, 0]));
  part(sph(.12), M.legs, hips, [0, 0, 0], [0, 0, 0], [1.55, .92, 1.05]);
  part(tor(.2, .035, 6, 24), M.armor, hips, [0, .09, 0], [Math.PI / 2, 0, 0], [1, .72, 1]);
  part(box(.1, .08, .04), M.frame, hips, [0, .09, .155]); part(box(.06, .025, .012), M.glow, hips, [0, .09, .178]);
  part(box(.07, .16, .1), M.frame, hips, [.22, -.02, .02], [0, 0, .12]); part(box(.074, .02, .104), M.armor, hips, [.223, -.05, .02], [0, 0, .12]);
  part(cyl(.07, .04, .12, 6), M.armor, hips, [0, -.05, .11], [.15, 0, 0], [1, 1, .45]); part(box(.02, .06, .008), M.glow, hips, [0, -.045, .134], [.15, 0, 0]);
  [[-.17, .08, .75], [-.2, -.03, 1.45]].forEach(([x, z, ry]) => { part(box(.075, .07, .04), M.frame, hips, [x, .075, z], [0, ry, 0]); part(box(.079, .022, .044), M.armor, hips, [x, .1, z], [0, ry, 0]); });
  // torso: lathed chest-to-waist profile, stitched seams, side panels, spine channel
  part(new THREE.LatheGeometry([[.001, -.25], [.12, -.24], [.158, -.2], [.165, -.12], [.172, -.04], [.19, .05], [.205, .12], [.207, .18], [.195, .23], [.16, .27], [.11, .295], [.001, .3]].map(([r, y]) => V2(r, y)), 24), M.suit, hips, [0, .32, 0], [0, 0, 0], [1.18, 1, .82]);
  for (const [r, y] of [[.207, .47], [.19, .37], [.168, .24]]) part(tor(r, .0045, 4, 36), M.frame, hips, [0, y, 0], [Math.PI / 2, 0, 0], [1.18, .82, 1]);
  for (const s of [-1, 1]) part(limbGeo(.05, .2, .08, .9, 12), M.suit, hips, [.2 * s, .31, 0], [0, 0, .06 * s], [.55, 1, 1.2]);
  part(limbGeo(.03, .32, .05, .9, 10), M.frame, hips, [0, .33, -.15], [0, 0, 0], [1, 1, .5]);
  // chest armour with a glowing core, vents, harness and rebreather hoses
  part(box(.4, .26, .07), M.armor, hips, [0, .38, .15], [-.08, 0, 0]);
  part(box(.42, .022, .078), M.frame, hips, [0, .505, .14], [-.08, 0, 0]); part(box(.006, .2, .074), M.frame, hips, [0, .36, .155], [-.08, 0, 0]);
  part(cyl(.065, .065, .03, 16), M.frame, hips, [0, .38, .19], [Math.PI / 2 - .08, 0, 0]); part(cyl(.045, .045, .035, 16), M.glow, hips, [0, .38, .195], [Math.PI / 2 - .08, 0, 0]);
  part(tor(.055, .006, 4, 6), M.armor, hips, [0, .38, .21], [-.08, 0, Math.PI / 6]);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) part(box(.06, .008, .01), M.glow, hips, [.13 * s, .34 - i * .025, .188 - i * .002], [-.08, 0, 0]);
    part(box(.034, .34, .016), M.frame, hips, [.165 * s, .36, .19], [-.1, 0, -.1 * s]); part(box(.044, .03, .022), M.armor, hips, [.165 * s, .27, .2], [-.1, 0, -.1 * s]);
    part(tube([[.09 * s, .62, .13], [.13 * s, .57, .18], [.15 * s, .5, .2], [.165 * s, .45, .2]], .012), M.frame, hips);
  }
  part(box(.26, .05, .05), M.frame, hips, [0, .22, .16]); part(box(.24, .05, .05), M.frame, hips, [0, .16, .155]); part(box(.22, .04, .045), M.frame, hips, [0, .115, .148]);
  part(box(.012, .12, .006), M.glow, hips, [0, .18, .185]);
  part(tor(.19, .016, 6, 32), M.frame, hips, [0, .13, 0], [Math.PI / 2, 0, 0], [1.08, .78, 1]);
  part(cyl(.15, .2, .06, 16), M.frame, hips, [0, .53, 0]); part(tor(.125, .032, 6, 20), M.frame, hips, [0, .56, 0], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) part(tor(.185, .018, 5, 24, Math.PI), M.frame, hips, [.165 * s, .44, -.01], [0, Math.PI / 2, 0]); // shoulder straps
  // back: the life-support pack, or whatever you picked
  const b = L.back, hatCol = paintMat(Pa, .5);
  if (b === 'none' || b === 'jet') {
    part(box(.36, .44, .16), M.frame, hips, [0, .33, -.24]); part(box(.3, .34, .03), M.armor, hips, [0, .35, -.33]);
    part(box(.2, .04, .02), M.glow, hips, [0, .46, -.35]); part(box(.16, .05, .1), M.armor, hips, [0, .575, -.24]);
    for (const s of [-1, 1]) { part(box(.008, .18, .05), M.frame, hips, [.183 * s, .33, -.24]); part(box(.004, .13, .025), M.glow, hips, [.188 * s, .31, -.24]); part(tor(.04, .008, 5, 12, Math.PI), M.frame, hips, [.183 * s, .48, -.24], [0, Math.PI / 2, 0]); }
  }
  if (b === 'pack') { part(box(.42, .48, .22), hatCol, hips, [0, .33, -.29]); part(box(.34, .16, .07), M.armor, hips, [0, .19, -.42]); part(box(.3, .025, .03), M.glow, hips, [0, .45, -.405]); for (const s of [-1, 1]) part(box(.035, .4, .04), M.frame, hips, [.15 * s, .35, -.41]); }
  if (b === 'jet') for (const s of [-1, 1]) {
    const chrome = new THREE.MeshStandardMaterial({ color: 0xc9d2e3, metalness: .9, roughness: .2 });
    part(cyl(.08, .08, .42, 16), chrome, hips, [.13 * s, .32, -.4]); part(cyl(.085, .085, .05, 16), M.armor, hips, [.13 * s, .52, -.4]);
    part(cyl(.05, .075, .08, 14), M.frame, hips, [.13 * s, .07, -.4]);
    part(new THREE.ConeGeometry(.06, .22, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb347).multiplyScalar(2.2) }), hips, [.13 * s, -.08, -.4], [Math.PI, 0, 0]).castShadow = false;
  }
  if (b === 'cape') { part(new THREE.CylinderGeometry(.2, .3, .85, 12, 1, true, Math.PI * .62, Math.PI * .76), Object.assign(hatCol.clone(), { side: THREE.DoubleSide }), hips, [0, .08, -.06], [-.08, 0, 0]); part(box(.44, .04, .05), M.armor, hips, [0, .5, -.19]); }
  if (b === 'wings' || b === 'gwings') {
    const wm = b === 'gwings' ? M.gold : new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf2ff, emissiveIntensity: .35, roughness: .6 });
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) part(box(.62 - k * .14, .1, .025), wm, hips, [s * (.34 - k * .03), .42 - k * .1, -.3], [0, s * .35, s * (.5 - k * .15)]);
  }
  // ---- legs: hip, knee and ankle joints (they swing when walking and fold when crouching) ----
  const legs = [], knees = [], ankles = [];
  for (const s of [1, -1]) {
    const hip = joint(group(hips, [.115 * s, -.04, 0]));
    part(tor(.093, .014, 5, 20), M.frame, hip, [0, -.04, 0], [Math.PI / 2, 0, 0]);
    part(limbGeo(.088, .3, .14, .88), M.legs, hip, [0, -.235, 0]);
    part(box(.12, .16, .05), M.armor, hip, [0, -.2, .08]); part(box(.06, .008, .006), M.glow, hip, [0, -.15, .106]);
    part(tor(.091, .011, 5, 20), M.frame, hip, [0, -.1, 0], [Math.PI / 2, 0, 0]); part(tor(.088, .011, 5, 20), M.frame, hip, [0, -.33, 0], [Math.PI / 2, 0, 0]);
    part(box(.035, .15, .17), M.armor, hip, [.1 * s, -.06, .01], [0, 0, .14 * s]); part(box(.039, .02, .174), M.frame, hip, [.11 * s, -.13, .01], [0, 0, .14 * s]);
    if (s > 0) { part(box(.04, .1, .09), M.frame, hip, [.1, -.26, 0]); part(box(.044, .03, .094), M.armor, hip, [.101, -.215, 0]); }
    else { part(box(.03, .16, .04), M.frame, hip, [-.098, -.25, .01], [0, 0, -.05]); part(cyl(.012, .014, .06, 8), M.armor, hip, [-.1, -.145, .01]); }
    const knee = joint(group(hip, [0, -.45, 0]));
    part(sph(.084), M.legs, knee, [0, -.005, -.004]); part(sph(.075), M.armor, knee, [0, 0, .045], [0, 0, 0], [1, 1, .8]);
    for (const [i, y] of [-.05, -.078, -.106].entries()) part(tor(.079 - i * .002, .011, 5, 18), M.legs, knee, [0, y, 0], [Math.PI / 2, 0, 0]);
    part(box(.085, .08, .025), M.armor, knee, [0, .005, .1]); part(box(.05, .008, .006), M.glow, knee, [0, .005, .114]);
    for (const k of [-1, 1]) part(cyl(.03, .03, .02, 12), M.frame, knee, [.082 * k, 0, 0], [0, 0, Math.PI / 2]);
    part(limbGeo(.075, .28, .14, .8), M.legs, knee, [0, -.2, 0]);
    part(box(.09, .24, .035), M.armor, knee, [0, -.2, .07]); part(box(.014, .2, .012), M.frame, knee, [0, -.2, .092]);
    part(box(.07, .12, .03), M.frame, knee, [0, -.15, -.075]);
    part(cyl(.09, .085, .1, 14), M.armor, knee, [0, -.38, 0]); part(tor(.085, .011, 5, 20), M.frame, knee, [0, -.33, 0], [Math.PI / 2, 0, 0]);
    const ankle = joint(group(knee, [0, -.45, 0]));
    part(box(.164, .12, .3), M.frame, ankle, [0, 0, .05]); part(box(.176, .064, .07), M.armor, ankle, [0, -.027, .19]);
    part(box(.182, .03, .322), M.frame, ankle, [0, -.072, .051]); part(box(.19, .008, .312), M.glow, ankle, [0, -.071, .051]);
    part(box(.172, .018, .04), M.armor, ankle, [0, .064, .075]); part(box(.146, .086, .05), M.armor, ankle, [0, -.012, -.113]);
    part(sph(.074), M.frame, ankle, [0, .035, -.01]); part(cyl(.079, .086, .13, 14), M.frame, ankle, [0, .085, -.012]);
    part(box(.118, .15, .032), M.armor, ankle, [0, .062, -.098], [-.12, 0, 0]); part(box(.05, .008, .006), M.glow, ankle, [0, .09, -.117], [-.12, 0, 0]);
    legs.push(hip); knees.push(knee); ankles.push(ankle);
  }

  // ---- aim: head, arms and gun turn up and down with where you look ----
  const aim = joint(new THREE.Group()); g.add(aim);
  const ai = group(aim, [0, 0, 0], [0, Math.PI, 0]); ai.scale.setScalar(SCALE); // aim pivot = the shoulder line
  const head = group(ai, [0, .28, 0], [.05, 0, 0]);
  const VPH = Math.PI / 2 - 1.05, VPL = 2.1;
  part(new THREE.SphereGeometry(.2, 32, 22), M.helmet, head);
  part(new THREE.SphereGeometry(.204, 24, 10, VPH, VPL, 1.12, .62), M.visor, head);
  part(new THREE.SphereGeometry(.209, 14, 1, VPH - .04, VPL + .08, 1.06, .07), M.frame, head);
  part(new THREE.SphereGeometry(.209, 14, 1, VPH - .04, VPL + .08, 1.73, .07), M.frame, head);
  for (const s of [-1, 1]) part(box(.014, .15, .03), M.frame, head, [.176 * s, .03, .1], [0, 1.05 * s, 0]);
  part(tor(.2, .018, 4, 8, Math.PI * .6), M.armor, head, [0, 0, 0], [0, Math.PI / 2, 0]);
  part(box(.17, .024, .05), M.armor, head, [0, .104, .172], [-.5, 0, 0]); part(box(.09, .006, .006), M.glow, head, [0, .099, .198], [-.5, 0, 0]);
  part(tor(.201, .012, 5, 36), M.frame, head, [0, -.06, 0], [Math.PI / 2, 0, 0]);
  part(box(.17, .05, .07), M.frame, head, [0, -.135, .12], [.35, 0, 0]); part(box(.06, .02, .074), M.armor, head, [0, -.112, .13], [.35, 0, 0]);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) part(box(.008, .03, .012), M.glow, head, [(.05 + i * .014) * s, -.13, .155], [.35, 0, 0]);
    part(box(.03, .11, .12), M.armor, head, [.175 * s, -.07, .06], [0, .35 * s, .12 * s]);
    part(box(.024, .05, .1), M.frame, head, [.13 * s, -.15, .08], [.2, .6 * s, .3 * s]);
    part(cyl(.06, .06, .06, 14), M.frame, head, [.2 * s, 0, 0], [0, 0, Math.PI / 2]);
  }
  part(cyl(.03, .03, .07, 12), M.glow, head, [-.205, 0, 0], [0, 0, Math.PI / 2]);
  part(box(.01, .01, .19), M.frame, head, [-.19, -.07, .09], [.3, -.25, 0]); part(box(.024, .018, .03), M.armor, head, [-.15, -.12, .185], [.3, -.25, 0]);
  part(cyl(.025, .03, .07, 12), M.frame, head, [-.19, .08, .06], [Math.PI / 2, 0, 0]); part(cyl(.02, .02, .01, 12), M.glow, head, [-.19, .08, .097], [Math.PI / 2, 0, 0]);
  part(box(.02, .02, .06), M.frame, head, [-.19, .05, .03]);
  if (L.hat === 'none') { part(cyl(.008, .008, .24, 6), M.frame, head, [.2, .14, -.02]); part(sph(.022), M.armor, head, [.2, .27, -.02]); part(cyl(.02, .026, .03, 10), M.frame, head, [.195, .03, -.02]); }
  [[.07, .2, .07, .05], [0, .215, .08, .06], [-.075, .2, .07, .05]].forEach(([z, y, h, l], i) => part(box(.028, h, l), M.armor, head, [0, y, z], [-.35 * (1 - i), 0, 0]));
  part(box(.006, .012, .2), M.glow, head, [0, .246, 0]);
  part(box(.13, .1, .06), M.frame, head, [0, -.02, -.19], [-.2, 0, 0]); part(box(.08, .012, .008), M.glow, head, [0, 0, -.222], [-.2, 0, 0]);
  part(box(.2, .05, .08), M.armor, head, [0, -.13, -.14], [.6, 0, 0]);
  // hats sit on the helmet
  const h = L.hat, HR = .205;
  if (h === 'cap') { part(new THREE.SphereGeometry(HR + .012, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), hatCol, head, [0, .03, 0]); part(box(.27, .022, .17), hatCol, head, [0, .05, .25], [.12, 0, 0]); part(sph(.022), M.armor, head, [0, .245, 0]); }
  if (h === 'beanie') { part(new THREE.SphereGeometry(HR + .015, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), hatCol, head, [0, .02, 0]); part(tor(HR + .01, .028, 6, 28), hatCol, head, [0, .04, 0], [Math.PI / 2, 0, 0]); part(sph(.06), M.armor, head, [0, .26, 0]); }
  if (h === 'phones') { part(tor(.235, .022, 6, 20, Math.PI), M.frame, head, [0, .02, 0], [0, Math.PI / 2, 0]); for (const s of [-1, 1]) { part(cyl(.085, .085, .07, 16), hatCol, head, [s * .235, 0, 0], [0, 0, Math.PI / 2]); part(cyl(.05, .05, .072, 14), M.glow, head, [s * .24, 0, 0], [0, 0, Math.PI / 2]); } }
  if (h === 'antenna') { part(cyl(.011, .011, .32, 6), M.frame, head, [0, .34, 0]); part(sph(.05), M.glow, head, [0, .52, 0]); part(cyl(.035, .045, .04, 10), M.armor, head, [0, .2, 0]); }
  if (h === 'bunny') for (const s of [-1, 1]) { part(cap(.045, .24), hatCol, head, [s * .09, .34, 0], [0, 0, -s * .2]); part(cap(.022, .17, 3, 6), M.armor, head, [s * .09, .35, .025], [0, 0, -s * .2]); }
  if (h === 'tophat') { part(cyl(.15, .15, .28, 18), M.frame, head, [0, .32, 0]); part(cyl(.26, .26, .022, 20), M.frame, head, [0, .185, 0]); part(cyl(.153, .153, .045, 18), hatCol, head, [0, .22, 0]); }
  if (h === 'halo') part(tor(.17, .022, 8, 28), new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffd75a, emissiveIntensity: 1.6 }), head, [0, .38, 0], [Math.PI / 2, 0, 0]).castShadow = false;
  if (h === 'crown') { part(new THREE.CylinderGeometry(.16, .16, .09, 16, 1, true), M.gold, head, [0, .2, 0]); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; part(new THREE.ConeGeometry(.035, .1, 6), M.gold, head, [Math.sin(a) * .15, .29, Math.cos(a) * .15]); part(sph(.016), M.glow, head, [Math.sin(a) * .162, .2, Math.cos(a) * .162]); } }

  // ---- gun: a compact armoured rifle, stock in the right shoulder ----
  const gun = group(ai, [-.11, -.06, .2]); // gun space: +z toward the muzzle, grip at the origin
  part(box(.034, .11, .045), M.frame, gun, [0, -.06, -.01], [-.2, 0, 0]); part(box(.036, .07, .03), M.armor, gun, [0, -.065, -.015], [-.2, 0, 0]);
  part(box(.06, .095, .36), M.frame, gun, [0, .02, .1]); part(box(.064, .04, .14), M.armor, gun, [0, .025, .04]);
  part(box(.056, .07, .24), M.armor, gun, [0, .025, .4]); for (let i = 0; i < 4; i++) part(box(.06, .012, .03), M.glow, gun, [0, .025, .32 + i * .055]);
  part(cyl(.016, .018, .22, 10), M.frame, gun, [0, .025, .63], [Math.PI / 2, 0, 0]); part(box(.04, .04, .05), M.frame, gun, [0, .025, .75]);
  part(box(.05, .08, .14), M.armor, gun, [0, .01, -.14]); part(box(.056, .11, .03), M.frame, gun, [0, 0, -.215]);
  part(cyl(.024, .024, .18, 14), M.frame, gun, [0, .11, .12], [Math.PI / 2, 0, 0]); part(cyl(.03, .024, .04, 14), M.frame, gun, [0, .11, .23], [Math.PI / 2, 0, 0]);
  part(cyl(.024, .024, .006, 14), M.glow, gun, [0, .11, .252], [Math.PI / 2, 0, 0]); for (const z of [.06, .18]) part(box(.02, .03, .02), M.armor, gun, [0, .08, z]);
  part(box(.03, .16, .044), M.frame, gun, [0, -.1, .19], [.22, 0, 0]); part(box(.036, .014, .05), M.armor, gun, [0, -.18, .207], [.22, 0, 0]);
  part(box(.004, .1, .03), M.glow, gun, [.017, -.09, .19], [.22, 0, 0]);

  // ---- arms: two-bone arms reaching to the grip and the handguard ----
  // Each is built hanging along -y (like the legs) and then turned so the hand lands on its target.
  const armBuild = (s, target, pole, big) => {
    const sh = group(ai, [.29 * s, 0, 0]);
    part(tor(.074, .013, 5, 20), M.frame, sh, [0, -.045, 0], [Math.PI / 2, 0, 0]); part(sph(.06), M.suit, sh, [-.025 * s, -.07, 0], [0, 0, 0], [.8, 1.1, 1]);
    part(sph(.118), M.armor, sh, [.02 * s, .03, 0], [0, 0, 0], [1.05, .7, 1.08]); part(sph(.11), M.armor, sh, [.035 * s, -.02, 0], [0, 0, .25 * s], [.95, .42, 1]);
    part(sph(.1), M.frame, sh, [.05 * s, -.06, 0], [0, 0, .35 * s], [.85, .35, .92]); part(tor(.11, .009, 5, 24), M.frame, sh, [.02 * s, 0, 0], [Math.PI / 2, 0, 0], [1.05, 1.08, 1]);
    part(limbGeo(.066, .2), M.suit, sh, [0, -.17, 0]); part(box(.03, .15, .09), M.armor, sh, [.058 * s, -.18, 0], [0, 0, .05 * s]);
    part(tor(.069, .011, 5, 20), M.frame, sh, [0, -.12, 0], [Math.PI / 2, 0, 0]); part(tor(.067, .011, 5, 20), M.frame, sh, [0, -.25, 0], [Math.PI / 2, 0, 0]);
    const el = group(sh, [0, -UPPER, 0]);
    part(sph(.07), M.frame, el); part(sph(.07), M.armor, el, [0, .005, -.045], [0, 0, 0], [.95, .95, .6]);
    for (const [i, y] of [-.035, -.06].entries()) part(tor(.061 - i * .002, .0095, 5, 18), M.suit, el, [0, y, 0], [Math.PI / 2, 0, 0]);
    part(limbGeo(.058, .18), M.suit, el, [0, -.15, 0]);
    part(cyl(.079, .067, .17, 8), M.armor, el, [0, -.195, 0], [0, Math.PI / 8, 0]);
    part(tor(.078, .009, 5, 8), M.frame, el, [0, -.115, 0], [Math.PI / 2, 0, Math.PI / 8]); part(tor(.067, .009, 5, 8), M.frame, el, [0, -.275, 0], [Math.PI / 2, 0, Math.PI / 8]);
    part(box(.004, .07, .035), M.glow, el, [.073 * s, -.183, 0]);
    const dw = big ? .075 : .05, dl = big ? .1 : .06;
    part(box(dw, dl, .022), M.frame, el, [0, -.195, .077]); part(box(dw - .014, dl - .016, .006), M.glow, el, [0, -.195, .09]);
    part(tor(.052, .01, 5, 18), M.frame, el, [0, -.288, 0], [Math.PI / 2, 0, 0]);
    const wr = group(el, [0, -FORE, 0]);
    part(box(.042, .09, .088), M.frame, wr, [0, -.045, 0]); part(box(.014, .07, .08), M.armor, wr, [.026 * s, -.042, 0]);
    part(cyl(.058, .052, .03, 10), M.frame, wr, [0, .005, 0], [0, 0, 0], [.8, 1, 1.05]);
    for (let i = 0; i < 4; i++) { const z = .033 - i * .0217; part(box(.024, .016, .019), M.armor, wr, [.008 * s, -.088, z]); part(cap(.0112, .05), M.frame, wr, [-.012 * s, -.11, z], [0, 0, -1.1 * s]); }
    part(cap(.0125, .04), M.frame, wr, [-.016 * s, -.05, .05], [-.6, 0, -.5 * s]);
    // solve: elbow position from the two bone lengths, bending toward the pole
    const S = sh.position.clone(), d0 = target.clone().sub(S), d = Math.min(d0.length(), UPPER + FORE - .002), u = d0.normalize();
    const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d), hgt = Math.sqrt(Math.max(0, UPPER * UPPER - a * a));
    const pp = pole.clone().addScaledVector(u, -pole.dot(u)).normalize(), E = S.clone().addScaledVector(u, a).addScaledVector(pp, hgt), H = S.clone().addScaledVector(u, d);
    const up = E.clone().sub(S).normalize(), fo = H.clone().sub(E).normalize();
    const y = up.clone().negate(), z = fo.clone().addScaledVector(y, -fo.dot(y)).normalize(), x = new THREE.Vector3().crossVectors(y, z);
    sh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    el.rotation.x = -Math.acos(THREE.MathUtils.clamp(up.dot(fo), -1, 1));
    wr.rotation.x = .25;
  };
  armBuild(-1, V3(-.11, -.13, .19), V3(-1, -.45, -.35), false); // right hand on the grip
  armBuild(1, V3(-.09, -.07, .49), V3(.35, -1, 0), true);         // left hand under the handguard

  // ---- merge, shadows, rainbow list ----
  g.updateMatrixWorld(true);
  if (!opt.noBake) { bake(inner, n => joints.has(n)); bake(aim, n => joints.has(n) && n !== aim); }
  const rainbow = new Set(); g.traverse(m => { if (m.isMesh) { m.castShadow = m.castShadow !== false; const mt = m.material; if (mt.userData.rainbow || mt.userData.glowRainbow) rainbow.add(mt); } });
  const A = { g, body: M.armor, torso: hips, legs, knees, ankles, aim, rainbow: [...rainbow], walk: 0 };
  // walk: phase in radians, amt 0..1 how much they're moving, crouch 0..1
  A.pose = (walk, amt = 0, crouch = 0) => {
    const k0 = crouch * .95, drop = 2 * .45 * (1 - Math.cos(k0)), f = walk, sn = Math.sin(f), cs = Math.cos(f);
    const stride = .5 * amt, knee = .95 * amt, lean = .05 * amt + .18 * crouch;
    const leg = (i, sgn) => {
      const hip = -k0 + sgn * stride * sn - .05 * amt, kn = 2 * k0 + .08 * amt + knee * Math.max(0, sgn * cs);
      legs[i].rotation.set(hip, 0, 0); knees[i].rotation.set(kn, 0, 0); ankles[i].rotation.set(-(lean + hip + kn) * .9, 0, 0);
    };
    leg(0, 1); leg(1, -1);
    hips.position.y = 1 - drop - .025 * amt * Math.abs(Math.cos(f)); hips.rotation.x = lean;
    aim.position.y = (hips.position.y + .46) * SCALE;
  };
  A.pose(0, 0, 0);
  return A;
}
