// First-person gun animations: reloads, draws, idle fidgets and the little touches in between.
// Reloads are keyframed per kind of gun, against the reload's progress (0 to 1), so they always fit the reload time
// the gun has in the game. Each key can move the gun, put the left hand somewhere (the arm rig bends the elbow to
// follow), carry the magazine, and work the slide, charging handle, bolt, pump or cylinder. Keys can also fire events
// (sounds, the empty mag falling out and landing on the floor, spent casings) as the reload passes them.
//
// Gun space: -z toward the muzzle, +y up, +x to the right. Gun moves are [x, y, z, pitch, yaw, roll], added on top of
// the normal pose; a negative roll turns the bottom of the gun toward your left hand.
import { THREE } from './world_v0.99.1.js';
import { mergeChildren } from './gunkit_v0.99.1.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const FIELDS = { g: 6, h: 3, hr: 3, mo: 3, mr: 3, mh: 1, mv: 1, slide: 1, charge: 1, boltU: 1, boltB: 1, cyl: 1, shell: 1 };

// ---------- which reload a gun gets ----------
export function family(view, w) {
  if (!view || view.ak || view.oneHand) return null;
  if (w.shell) return 'shell';
  if (view.cyl) return 'revolver';
  if (w.model.kind === 'double') return 'break';
  if (!view.magG) return null;                               // launchers, railguns, miniguns: the simple dip
  if (view.pistol) return 'pistol';
  if (view.magUp) return 'top';                              // magazine lies on top (P90 style)
  if (view.mag && view.grip && view.mag.z > view.grip.z + .02) return 'bullpup';
  if (view.bolt) return 'bolt';
  return 'rifle';
}

// ---------- anchor points on the gun (worked out once when the gun is equipped) ----------
export function prepare(view, w) {
  const A = {}, rest = view.leftRig ? view.leftRig.rest.clone() : (view.leftHand || V(0, 0, 0)).clone();
  A.rest = rest;
  if (view.magG) {
    view.group.updateMatrixWorld(true); const bx = new THREE.Box3().setFromObject(view.magG);
    if (!bx.isEmpty()) { view.magMid = bx.getCenter(V(0, 0, 0)); A.magBot = V(view.magMid.x, view.magUp ? bx.max.y : bx.min.y, view.magMid.z); }
  }
  A.magBot ||= (view.mag || rest).clone();
  const dn = view.magUp ? 1 : -1;
  A.under = A.magBot.clone().add(V(-.01, dn * .075, .014));
  const gz = view.grip ? view.grip.z : 0, top = view.top ?? .04, back = view.back ?? .1;
  A.pouch = V(-.25, -.37, gz + .14);
  A.shellPouch = V(-.16, -.32, (view.mag ? view.mag.z : gz) + .12);
  A.port = view.mag ? view.mag.clone().add(V(-.004, -.018, 0)) : rest.clone();
  A.cyl = view.mag ? view.mag.clone().add(V(-.02, 0, 0)) : rest.clone();
  A.slide = V(0, top - .004, (view.pistol ? view.back : back) - .016);
  A.charge = view.chargeP ? view.chargeP.clone() : view.pistol ? A.slide.clone() : V(-.01, top + .01, back - .03);
  A.bolt = view.boltP ? view.boltP.clone() : V(.05, (view.boreY ?? 0) - .01, back - .05);
  // AR-style rifles (charging handle at the very back, out of view) slap the bolt catch beside the mag well instead
  A.catch = view.chargeP && view.chargeP.x === 0 && !view.pistol ? V(-.042, (view.boreY ?? 0) - .012, (view.magMid ? view.magMid.z : gz) - .035) : null;
  view.A = A; view.fam = family(view, w); view.keys = {};
  return A;
}

// ---------- reload style by gun level ----------
// The higher your player level, the slicker your reloads get on every gun (and a bit faster on top of the gun's level perks):
//  0 (lv 1-4)   careful: pull the mag, fetch a new one, push it in
//  1 (lv 5-9)   practised: the same moves, smoother and quicker
//  2 (lv 10-14) pro: the new mag twirls in your fingers on the way in; pistols drop the slide with the thumb
//  3 (lv 15-19) slick: a wrist flick throws the old mag out, the new one flips end over end into the well
//  4 (lv 20)    movie: flick the old mag away, toss the new one up spinning, and catch it in the gun
export const reloadTier = lvl => lvl >= 20 ? 4 : lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0;
export const RELOAD_SPEED = [1, .94, .88, .83, .78]; // reload time multiplier per style
const TAU = Math.PI * 2;
// ---------- keyframes ----------
// a key is [time, { field: value }]; missing fields carry on from the key before. Events: { ev: 'name' }.
const arr = v => v.isVector3 ? [v.x, v.y, v.z] : v;
const at = (v, dx = 0, dy = 0, dz = 0) => Array.isArray(v) ? [v[0] + dx, v[1] + dy, v[2] + dz] : [v.x + dx, v.y + dy, v.z + dz];
const rel = (a, b, k = 1, d = [0, 0, 0]) => [(a[0] - b[0]) * k + d[0], (a[1] - b[1]) * k + d[1], (a[2] - b[2]) * k + d[2]]; // gun-space offset of point a from point b
function fill(keys, base) {
  let prev = { ...base };
  return keys.map(([t, k]) => { const o = { ...prev }; for (const f in k) if (f !== 'ev') o[f] = arr(k[f]); prev = o; return [t, o, k.ev]; });
}
const G0 = [0, 0, 0, 0, 0, 0];
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const add = (a, b) => a.map((v, i) => v + b[i]);

function build(view, fam, empty, tier = 0) {
  const A = view.A, R = A.rest, base = { g: G0, h: arr(R), hr: [0, 0, 0], mo: [0, 0, 0], mr: [0, 0, 0], mh: 0, mv: 1, slide: 0, charge: 0, boltU: 0, boltB: 0, cyl: 0, shell: 0 };
  const B = A.magBot, U = A.under, P = A.pouch, dn = view.magUp ? 1 : -1;
  // gun tilts: rolled so the mag well faces your left hand and turned a little toward you
  const TILT = { rifle: [-.075, .085, .05, .3, .42, -.62], bullpup: [-.06, .1, .05, .45, .4, -.5], top: [-.07, .06, .05, .18, .38, .5], bolt: [-.07, .08, .05, .24, .38, -.55],
    pistol: [-.11, .13, .07, .38, .55, -.48], shell: [-.07, .08, .05, .26, .26, -.68], revolver: [-.05, .06, .06, .12, .36, .7], break: [-.1, .14, .03, -.42, .32, -.22] };
  const T = TILT[fam] || TILT.rifle, Th = mix(G0, T, .85);
  const slap = add(T, [0, .014, 0, .07, 0, .03]), seat = arr(B), stage = arr(U);
  const grab = [.35, 0, -.25], hold = [.2, .2, -.35];        // hand turns: cupping the mag base, carrying it
  const drop = { ev: 'drop', mv: 0, mh: 0, mo: [0, 0, 0], mr: [0, 0, 0] };
  if (fam === 'rifle' || fam === 'bullpup' || fam === 'top' || fam === 'bolt') {
    const pull = at(U, 0, dn * .1, .02), C = A.charge;
    const tailAt = o => tail.map(([t, k]) => [t + o, k]);
    const tail = fam === 'bolt'
      // bolt guns: lift the bolt, pull it back, push it home, turn it down
      ? [[.7, { h: at(A.bolt, 0, .01, .02), g: add(T, [-.03, .05, -.06, -.15, -.3, .4]), hr: [0, 0, .4] }], [.75, { boltU: 1 }], [.81, { boltB: 1, h: at(A.bolt, 0, .022, .09) }],
         [.87, { boltB: 0, h: at(A.bolt, 0, .022, .02), ev: 'rack' }], [.91, { boltU: 0, h: at(A.bolt, 0, .005, .02) }]]
      : A.catch ? [[.7, { h: at(A.catch, -.03, -.012, .02), hr: [0, .3, .6] }], [.76, { h: at(A.catch, .004, 0, 0), g: add(T, [.004, .012, 0, .05, 0, -.07]), ev: 'rack' }], [.81, { h: at(A.catch, -.035, -.015, .02), g: T }]]
      // charging handle: reach over, pull it back, let it snap forward
      : [[.7, { h: at(C, 0, .012, -.01), g: add(Th, [0, -.01, 0, -.06, 0, .3]), hr: [-.3, 0, .5] }], [.79, { h: at(C, 0, .016, .075), charge: 1 }],
         [.82, { charge: 0, h: at(C, -.01, .03, .1), g: add(Th, [0, .006, .01, -.02, 0, .32]), ev: 'rack' }]];
    if (!empty) return fill([
      [0, {}], [.1, { g: Th, h: at(B, 0, -dn * .006, 0), hr: grab }], [.15, { g: T, ev: 'release' }],
      [.3, { h: pull, mh: 1, hr: hold }], [.42, { h: arr(P), mh: 1, ev: 'pouch' }], [.46, { mv: 0 }], [.5, { mv: 1 }],
      ...(tier >= 2 ? [[.58, { h: at(U, -.05, dn * .05, .03), mr: [0, Math.PI, .2] }]] : []), // pro: a twirl on the way in
      [.66, { h: stage, hr: grab, mr: [.15, tier >= 2 ? TAU : 0, 0] }], [.74, { h: seat, mr: [0, tier >= 2 ? TAU : 0, 0], ev: 'magIn' }], [.76, { g: slap, mh: 0 }],
      [.79, { g: T, h: at(B, 0, dn * .012, 0), ev: 'tap' }], [.93, { g: mix(G0, T, .2), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }],
    ], base);
    const jerk = add(T, [.035, -dn * .02, 0, 0, .15, -.4]), flick = { ...drop, ev: 'flick' };
    if (tier >= 4) { // movie: flick the old one away, toss the new mag up spinning, roll the gun under it and catch
      const low = at(U, -.03, dn * .05, .02), Bv = arr(B), fly = rel(low, Bv);
      return fill([
        [0, {}], [.05, { g: Th, h: at(R, -.02, -.03, .04) }], [.08, { g: jerk, ev: 'release', mo: [0, dn * .03, 0] }], [.1, flick], [.13, { g: T }],
        [.22, { h: arr(P), hr: hold, ev: 'pouch' }], [.25, { mv: 1, mh: 1 }],
        [.31, { h: low, hr: grab }], [.33, { mh: 0, mo: fly, ev: 'toss', h: at(low, -.02, -dn * .04, 0), hr: [-.4, 0, .3] }],
        [.42, { mo: rel(low, Bv, .5, [-.11, -dn * .17, .02]), mr: [Math.PI, .4, 0], g: add(T, [-.03, .03, 0, -.1, .1, -.55]), h: at(B, -.08, dn * .02, .03) }],
        [.5, { mo: [-.045, dn * .07, .01], mr: [TAU * .92, 0, 0], g: add(T, [-.02, .02, 0, -.05, .05, -.4]) }],
        [.54, { mo: [0, 0, 0], mr: [TAU, 0, 0], ev: 'magIn', g: slap, h: at(B, 0, dn * .012, 0), hr: grab }], [.57, { g: T }],
        ...tailAt(-.13), [.93, { g: mix(G0, T, .15), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }],
      ], base);
    }
    if (tier >= 3) // slick: wrist flick throws the old mag, the new one flips end over end into the well
      return fill([
        [0, {}], [.06, { g: Th, h: at(R, -.02, -.03, .04) }], [.09, { g: jerk, ev: 'release', mo: [0, dn * .035, 0] }], [.11, flick], [.14, { g: T }],
        [.27, { h: arr(P), hr: hold, ev: 'pouch' }], [.31, { mv: 1, mh: 1 }],
        [.4, { h: at(U, -.06, dn * .06, .04), mr: [Math.PI, 0, 0] }], [.47, { h: stage, hr: grab, mr: [TAU, 0, 0] }], [.55, { h: seat, ev: 'magIn' }], [.57, { g: slap, mh: 0 }], [.6, { g: T }],
        ...tailAt(-.1), [.94, { g: mix(G0, T, .15), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }],
      ], base);
    return fill([
      [0, {}], [.07, { g: Th, h: at(R, -.02, -.03, .04) }], [.1, { g: T, ev: 'release', mo: [0, dn * .035, 0] }], [.13, drop],
      [.3, { h: arr(P), hr: hold, ev: 'pouch' }], [.36, { mv: 1, mh: 1 }],
      ...(tier >= 2 ? [[.46, { h: at(U, -.05, dn * .05, .03), mr: [0, Math.PI, .2] }]] : []),
      [.54, { h: stage, hr: grab, mr: [.15, tier >= 2 ? TAU : 0, 0] }], [.63, { h: seat, mr: [0, tier >= 2 ? TAU : 0, 0], ev: 'magIn' }], [.65, { g: slap, mh: 0 }], [.68, { g: T }],
      ...tail, [.95, { g: mix(G0, T, .15), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }],
    ], base);
  }
  if (fam === 'pistol') {
    const S = A.slide;
    if (tier >= 3 && empty) { // flick the empty out; slick flips it in, movie tosses it and catches it; thumb drops the slide
      const jerk = add(T, [.03, .02, 0, 0, .2, -.45]), low = at(U, -.03, dn * .05, .02), Bv = arr(B), movie = tier >= 4;
      const mid = movie
        ? [[.3, { h: low, hr: grab }], [.32, { mh: 0, mo: rel(low, Bv), ev: 'toss', h: at(low, -.02, .03, 0), hr: [-.4, 0, .3] }],
           [.41, { mo: rel(low, Bv, .5, [-.1, .16, .02]), mr: [Math.PI, .3, 0], g: add(T, [-.03, .03, 0, -.1, .1, -.5]), h: at(B, -.07, -.02, .03) }],
           [.49, { mo: [-.04, -.065, .01], mr: [TAU * .92, 0, 0] }], [.53, { mo: [0, 0, 0], mr: [TAU, 0, 0], ev: 'magIn', g: add(T, [0, .02, 0, .14, 0, .05]), h: at(B, 0, -.01, 0), hr: grab }]]
        : [[.38, { h: at(U, -.05, -.05, .03), mr: [Math.PI, 0, 0] }], [.45, { h: stage, hr: grab, mr: [TAU, 0, 0] }], [.52, { h: seat, ev: 'magIn' }], [.54, { g: add(T, [0, .02, 0, .14, 0, .05]), mh: 0 }]];
      return fill([
        [0, { slide: 1 }], [.05, { g: Th, h: at(R, -.03, -.02, .03) }], [.08, { g: jerk, ev: 'release', mo: [0, -.04, .004] }], [.1, { ...drop, ev: 'flick' }], [.13, { g: T }],
        [.22, { h: arr(P), hr: hold, ev: 'pouch' }], [.26, { mv: 1, mh: 1 }], ...mid,
        [.6, { g: add(T, [0, .01, 0, .05, 0, 0]), slide: 1 }], [.62, { slide: 0, ev: 'rack', g: add(T, [0, .015, -.01, .12, 0, 0]) }], // thumb on the slide stop: it slams home
        [.78, { g: mix(G0, T, .2), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }],
      ], base);
    }
    const keys = [
      [0, { slide: empty ? 1 : 0 }], [.06, { g: Th, ev: 'release', h: at(R, -.03, -.02, .03) }], [.1, { g: T, mo: [0, -.045, .004], mr: [-.2, 0, 0] }], [.13, drop],
      [.28, { h: arr(P), hr: hold, ev: 'pouch' }], [.34, { mv: 1, mh: 1 }],
      [.52, { h: stage, hr: grab, mr: [.12, 0, 0] }], [.61, { h: seat, mr: [0, 0, 0], ev: 'magIn' }], [.63, { g: add(T, [0, .02, 0, .14, 0, .05]), mh: 0 }], [.66, { g: T }],
    ];
    if (tier >= 2) { keys.splice(6, 0, [.44, { h: at(U, -.05, -.05, .03), mr: [0, Math.PI, .2] }]); keys[7] = [.52, { h: stage, hr: grab, mr: [.12, TAU, 0] }]; keys[8] = [.61, { h: seat, mr: [0, TAU, 0], ev: 'magIn' }]; }
    if (empty && tier >= 2) keys.push([.66, { slide: 1 }], [.68, { slide: 0, ev: 'rack', g: add(T, [0, .015, -.01, .12, 0, 0]) }], [.84, { g: mix(G0, T, .2), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }]); // thumb drops the slide
    else if (empty) keys.push([.71, { h: at(S, 0, .02, -.01), hr: [-.5, 0, .6], g: add(Th, [.03, .01, -.09, -.05, .2, .25]) }], [.79, { h: at(S, 0, .02, .05), slide: 1 }],
      [.81, { slide: 0, h: at(S, -.01, .035, .08), ev: 'rack' }], [.94, { g: mix(G0, T, .15), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }]);
    else keys.push([.8, { g: mix(G0, T, .3), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }]);
    return fill(keys, base);
  }
  if (fam === 'shell') { // one shell: down to the shell pouch, up to the loading port, thumbed in
    const O = A.port, SP = A.shellPouch;
    return fill([
      [0, { g: T, h: at(O, -.01, -.03, .01), hr: grab }], [.32, { h: arr(SP), shell: 1, hr: hold }], [.6, { h: at(O, -.004, -.045, .02), hr: grab }],
      [.86, { h: at(O, 0, -.006, -.02), g: add(T, [0, .006, 0, .03, 0, 0]) }], [.9, { shell: 0 }], [1, { h: at(O, -.01, -.03, .01), g: T }],
    ], { ...base, g: T, h: at(O, -.01, -.03, .01) });
  }
  if (fam === 'revolver') { // swing the cylinder out, muzzle up to dump the brass, speedloader in, flick it shut
    const C = A.cyl, up = add(T, [0, .04, .02, .95, .1, .2]);
    return fill([
      [0, {}], [.1, { g: Th, h: at(C, -.02, -.01, .01), cyl: .6 }], [.14, { g: T, cyl: 1, ev: 'cylOut' }], [.22, { g: up }], [.24, { ev: 'eject' }],
      [.32, { g: T }], [.46, { h: arr(P), hr: hold, ev: 'pouch' }], [.62, { h: at(C, -.05, 0, .01), hr: grab }],
      [.72, { h: at(C, -.025, 0, .005), ev: 'magIn' }], [.8, { cyl: 0, g: add(T, [0, 0, 0, 0, 0, -.5]), ev: 'rack' }], [.84, { g: T }],
      [.95, { g: mix(G0, T, .2), h: arr(R), hr: [0, 0, 0] }], [1, { g: G0 }],
    ], base);
  }
  if (fam === 'break') { // open the action, the spent shells pop out, two fresh ones in, snap it shut
    const O = A.port;
    return fill([
      [0, {}], [.12, { g: T, h: at(R, 0, .01, 0) }], [.18, { ev: 'eject' }],
      [.4, { h: arr(A.shellPouch), shell: 1, hr: hold, ev: 'pouch' }], [.62, { h: at(O, 0, .03, .02), hr: grab }], [.7, { h: at(O, 0, .012, -.01), shell: 0, ev: 'magIn' }],
      [.8, { h: at(R, 0, .02, 0), hr: [0, 0, 0] }], [.84, { g: add(G0, [0, .012, 0, .16, 0, 0]), ev: 'rack' }], [.9, { g: G0, h: arr(R) }], [1, {}],
    ], base);
  }
  return null;
}

// ---------- the pose for this frame ----------
const OUT = { g: [0, 0, 0, 0, 0, 0], h: V(0, 0, 0), hr: [0, 0, 0], mo: [0, 0, 0], mr: [0, 0, 0], mh: 0, mv: 1, slide: 0, charge: 0, boltU: 0, boltB: 0, cyl: 0, shell: 0 };
// rp: reload progress 0..1 (or -1 when not reloading). Returns OUT (filled in) or null when this gun has no keyframed
// reload; events crossed since the last call are pushed into evs.
export function reloadPose(view, it, rp, evs) {
  const fam = view.fam; if (!fam || rp < 0) { view.lastRp = -1; return null; }
  const tier = it.rlTier || 0, key = fam + (it.shellMode ? 's' : it.wasEmpty ? 'e' : 't') + tier;
  const keys = view.keys[key] || (view.keys[key] = build(view, fam, !!it.wasEmpty && !it.shellMode, tier));
  if (!keys) return null;
  const prev = view.lastRp ?? -1, wrapped = rp < prev - .5; // shell reloads start over for every shell
  for (const [t, , ev] of keys) if (ev && ((t > prev && t <= rp) || (wrapped && (t > prev || t <= rp)))) evs.push(ev);
  view.lastRp = rp;
  return sample(keys, rp);
}
function sample(keys, rp) {
  let i = 0; while (i < keys.length - 2 && keys[i + 1][0] < rp) i++;
  const [t0, a] = keys[i], [t1, b] = keys[Math.min(i + 1, keys.length - 1)], u = t1 > t0 ? smooth((rp - t0) / (t1 - t0)) : 1;
  for (const f in FIELDS) {
    const x = a[f], y = b[f];
    if (FIELDS[f] === 1) OUT[f] = x + (y - x) * u;
    else if (f === 'h') OUT.h.set(x[0] + (y[0] - x[0]) * u, x[1] + (y[1] - x[1]) * u, x[2] + (y[2] - x[2]) * u);
    else for (let k = 0; k < FIELDS[f]; k++) OUT[f][k] = x[k] + (y[k] - x[k]) * u;
  }
  // magazine visibility and carrying snap at their keys rather than fading
  OUT.mv = u >= 1 ? b.mv : a.mv;
  return OUT;
}

// ---------- flourishes: the first draw of a gun, and idle fidgets ----------
// draw: rack it (charging handle, slide, bolt, pump), check the mag, spin the cylinder or snap the action shut.
// wrist: raise your left arm and glance at the wrist computer. mag: tug the magazine to check it's seated.
export const FLOURISH = { draw: .85, wrist: 2.4, mag: 1.6, ins0: 5.4, ins1: 4.6, ins2: 4.2 };
function flourishKeys(view, kind) {
  const A = view.A, R = A.rest, fam = view.fam, base = { g: G0, h: arr(R), hr: [0, 0, 0], mo: [0, 0, 0], mr: [0, 0, 0], mh: 0, mv: 1, slide: 0, charge: 0, boltU: 0, boltB: 0, cyl: 0, shell: 0 };
  if (kind.startsWith('ins')) return inspectKeys(view, +kind.slice(3), base);
  if (kind === 'wrist') return fill([[0, {}], [.18, { h: [R.x - .1, R.y + .1, R.z + .2], hr: [-.9, .7, .5], g: [.015, -.02, 0, -.08, -.12, .1] }], [.3, { h: [R.x - .14, R.y + .15, R.z + .26] }],
    [.75, { h: [R.x - .135, R.y + .16, R.z + .25] }], [.9, { h: arr(R), hr: [0, 0, 0], g: G0 }], [1, {}]], base);
  if (kind === 'mag') {
    if (!view.magG || !A.magBot) return null;
    return fill([[0, {}], [.18, { h: arr(A.magBot), hr: [.35, 0, -.25], g: [-.07, .08, .05, .26, .38, -.55] }], [.3, { mo: [0, -.012, 0] }], [.4, { mo: [0, 0, 0], ev: 'tap' }],
      [.52, { mo: [0, -.008, 0] }], [.6, { mo: [0, 0, 0], ev: 'tap' }], [.85, { h: arr(R), hr: [0, 0, 0], g: G0 }], [1, {}]], base);
  }
  // draw
  if (fam === 'pistol') return fill([[0, {}], [.25, { h: at(A.slide, 0, .02, -.01), hr: [-.5, 0, .6], g: [-.04, .05, -.06, .15, .3, -.15] }], [.5, { h: at(A.slide, 0, .02, .05), slide: 1 }],
    [.55, { slide: 0, h: at(A.slide, -.01, .035, .08), ev: 'rack' }], [.9, { h: arr(R), hr: [0, 0, 0], g: G0 }], [1, {}]], base);
  if (fam === 'bolt') return fill([[0, {}], [.2, { h: at(A.bolt, 0, .01, .02), g: [-.04, .05, -.06, -.1, -.3, .3], hr: [0, 0, .4] }], [.32, { boltU: 1 }], [.48, { boltB: 1, h: at(A.bolt, 0, .022, .09) }],
    [.62, { boltB: 0, h: at(A.bolt, 0, .022, .02), ev: 'rack' }], [.72, { boltU: 0 }], [.95, { h: arr(R), hr: [0, 0, 0], g: G0 }], [1, {}]], base);
  if (fam === 'revolver') return fill([[0, {}], [.2, { g: [-.02, .03, .02, .05, .15, .5], ev: 'spin' }], [.75, { g: [-.02, .03, .02, .05, .15, .5] }], [.85, { g: [0, 0, 0, 0, 0, -.1], ev: 'rack' }], [1, { g: G0 }]], base);
  if (fam === 'break') return fill([[0, {}], [.3, { g: [0, -.02, .03, -.35, .1, 0] }], [.45, { g: [0, .01, 0, .12, 0, 0], ev: 'rack' }], [.7, { g: G0 }], [1, {}]], base);
  if (fam === 'shell') return fill([[0, {}], [.1, { ev: 'pump' }], [1, {}]], base);
  if (A.catch && view.magG) return fill([[0, {}], [.2, { h: arr(A.magBot), hr: [.35, 0, -.25], g: [-.06, .07, .04, .22, .32, -.5] }], [.32, { mo: [0, -.01, 0] }], [.42, { mo: [0, 0, 0], ev: 'tap' }],
    [.55, { h: at(A.catch, -.03, -.012, .02), hr: [0, .3, .6] }], [.64, { h: at(A.catch, .004, 0, 0), ev: 'rack', g: [-.026, .04, .02, .16, .2, -.36] }], [.9, { h: arr(R), hr: [0, 0, 0], g: G0 }], [1, {}]], base);
  if (view.chargeP) { const C = A.charge; return fill([[0, {}], [.25, { h: at(C, 0, .012, -.01), hr: [-.3, 0, .5], g: [-.03, .04, -.02, .1, .15, .25] }], [.5, { h: at(C, 0, .016, .075), charge: 1 }],
    [.56, { charge: 0, h: at(C, -.01, .03, .1), ev: 'rack' }], [.9, { h: arr(R), hr: [0, 0, 0], g: G0 }], [1, {}]], base); }
  return null;
}
// u: 0..1 through the flourish. Returns the same pose as reloadPose, or null.
// ---------- inspects: hold the inspect key ----------
// Three per gun, picked in turn, each a few seconds of handling it the way people do with a real one:
//  0  the full check: run your hand along it, turn it to see both sides, press-check the chamber (pull the charging
//     handle, slide or bolt back a little and look), half-drop the mag to see the rounds, slap it home
//  1  the showcase: raise it to look over the sights, roll it to see underneath, tilt it toward the light, tap the side
//  2  the roll: cant it hard one way, then the other, a quick look down the barrel side, and a confident settle
// Revolvers swing the cylinder out and spin it; break-actions crack open to show the chambers; bolt guns work the bolt.
function inspectKeys(view, n, base) {
  const A = view.A, R = A.rest, fam = view.fam, dn = view.magUp ? 1 : -1, B = A.magBot, rest = { h: arr(R), hr: [0, 0, 0] };
  const pistol = fam === 'pistol', k = pistol ? 1.25 : 1; // pistols are smaller, so they move a bit further
  const side = (y, x = -.1) => [x * k, .07, .07, .1, y, y > 0 ? -.1 : .35];
  const grabMag = { h: arr(B), hr: [.35, 0, -.25] }, well = [-.07 * k, .08, .05, .26, .38 * k, -.55];
  if (n === 0) {
    const keys = [[0, {}], [.06, { g: side(.45), h: at(R, 0, .004, -.05), hr: [0, 0, -.2] }], [.16, { g: side(1.05, -.14), h: at(R, 0, .006, .05), ev: 'tap' }], // turn it, hand sliding back along it
      [.27, { g: side(1.15, -.15), h: at(R, 0, .004, -.04) }], [.36, { g: side(-.4, -.08), ...rest }]];                            // and over to the other side
    // press-check: the chamber opens a little, you look, it closes
    if (pistol) keys.push([.43, { h: at(A.slide, 0, .02, -.005), hr: [-.5, 0, .6], g: [-.06, .06, .06, .2, -.3, .4] }], [.5, { slide: .45, h: at(A.slide, 0, .02, .03) }], [.6, { slide: .45, g: [-.07, .07, .07, .25, -.45, .55] }], [.64, { slide: 0, ev: 'tap', h: at(A.slide, 0, .025, .01) }]);
    else if (fam === 'bolt') keys.push([.43, { h: at(A.bolt, 0, .01, .02), hr: [0, 0, .4], g: [-.05, .06, -.04, -.1, -.35, .35] }], [.48, { boltU: 1 }], [.54, { boltB: .45, h: at(A.bolt, 0, .02, .05) }], [.61, { boltB: .45 }], [.65, { boltB: 0, h: at(A.bolt, 0, .02, .02), ev: 'tap' }], [.68, { boltU: 0 }]);
    else if (fam === 'revolver') keys.push([.42, { g: [-.03, .05, .03, .1, .3, .55], cyl: 1, ev: 'cylOut', h: at(A.cyl, -.03, -.01, .01) }], [.48, { ev: 'spin' }], [.62, { cyl: 1 }], [.68, { cyl: 0, g: [0, .01, 0, 0, .1, -.4], ev: 'rack' }]);
    else if (fam === 'break') keys.push([.44, { g: [0, -.02, .04, -.42, .12, 0] }], [.6, { g: [-.03, -.01, .05, -.38, .45, .1] }], [.66, { g: [0, .012, 0, .14, 0, 0], ev: 'rack' }]);
    else if (fam === 'shell') keys.push([.44, { g: [-.04, .05, .04, .12, -.35, .45], ev: 'pump' }], [.62, { g: [-.05, .06, .05, .18, -.45, .6] }]);
    else keys.push([.43, { h: at(A.charge, 0, .012, -.01), hr: [-.3, 0, .5], g: [-.07, .07, .05, .12, -.38, .5] }], [.5, { charge: .4, h: at(A.charge, 0, .014, .03) }], [.6, { charge: .4, g: [-.08, .08, .06, .16, -.5, .62] }], [.64, { charge: 0, ev: 'tap' }]);
    // half-drop the mag, check the rounds, slap it home
    if (view.magG && fam !== 'revolver' && fam !== 'break' && fam !== 'shell') keys.push([.72, { g: well, ...grabMag }], [.76, { ev: 'release', mo: [0, dn * .045, 0], h: at(B, 0, dn * .045, 0) }],
      [.82, { mo: [0, dn * .045, 0], mr: [0, 0, .25], g: add(well, [0, .01, .01, .08, .1, 0]) }], [.87, { mo: [0, 0, 0], mr: [0, 0, 0], h: arr(B), ev: 'magIn', g: add(well, [0, .012, 0, .06, 0, .03]) }]);
    keys.push([.95, { g: G0, ...rest }], [1, {}]);
    return fill(keys, base);
  }
  if (n === 1) return fill([
    [0, {}], [.12, { g: [-.03 * k, .12, .14, .55, .15, -.05] }],                         // up to your eye: look along the sights
    [.28, { g: [-.06 * k, .09, .12, .3, .5 * k, 1.5] }],                                   // roll it over: the underside
    [.42, { g: [-.06 * k, .07, .1, .1, .7 * k, 2.4] }], [.5, { g: [-.06 * k, .07, .1, .1, .7 * k, 2.4], h: at(R, -.01, -.02, .02), ev: 'tap' }],
    [.62, { g: [-.1 * k, .06, .08, -.15, -.65, -.25], h: at(R, -.02, .03, .06), hr: [-.4, 0, .5] }], // muzzle down, right side to you; a tap on the side
    [.68, { h: at(R, -.03, .04, .02), ev: 'tap' }], [.74, { h: at(R, -.02, .03, .06) }],
    [.84, { g: [-.02, .05, .05, .15, .25, -.9], ...rest }],                              // tilt it toward the light
    [.95, { g: G0 }], [1, {}]], base);
  // n === 2: the roll
  return fill([
    [0, {}], [.1, { g: [-.05 * k, .05, .04, .05, .2, -1.25] }], [.22, { g: [-.06 * k, .06, .05, .08, .3, -1.35], ev: 'tap' }],
    [.36, { g: [-.04 * k, .06, .06, .12, -.2, .95] }], [.48, { g: [-.05 * k, .07, .07, .15, -.3, 1.05] }],
    [.6, { g: [-.08 * k, .09, .1, .4, .9 * k, .2], h: at(R, 0, .004, -.04) }],                // muzzle toward you a little: look down the side
    [.74, { g: [-.08 * k, .09, .1, .42, .95 * k, .25], h: at(R, 0, .006, .04) }],
    [.86, { g: [0, -.02, 0, -.12, 0, 0], ...rest }], [.92, { g: [0, .008, 0, .04, 0, 0], ev: 'tap' }], [1, { g: G0 }]], base);
}
export function flourishPose(view, kind, u, evs) {
  if (!view.A || !view.fam) return null;
  const k = 'f' + kind, keys = k in view.keys ? view.keys[k] : (view.keys[k] = flourishKeys(view, kind));
  if (!keys) return null;
  const prev = view.lastFl ?? -1;
  for (const [t, , ev] of keys) if (ev && t > prev && t <= u) evs.push(ev);
  view.lastFl = u;
  return sample(keys, u);
}

// ---------- spent magazines on the floor ----------
// The empty mag is copied into the world where it left the gun, falls, bounces and lies there for a while.
export const droppedMags = [];
export function dropMag(scene, src, pos, quat, vel, maxKeep = 14) {
  const g = new THREE.Group();
  src.updateMatrixWorld(true); const inv = src.matrixWorld.clone().invert(), m = new THREE.Matrix4();
  src.traverse(o => { if (!o.isMesh) return; const c = new THREE.Mesh(o.geometry, o.material); m.multiplyMatrices(inv, o.matrixWorld); c.applyMatrix4(m); c.castShadow = true; c.receiveShadow = true; g.add(c); });
  // centre the copy on its own middle so it tumbles about it
  const bx = new THREE.Box3().setFromObject(g), mid = bx.getCenter(V(0, 0, 0)); g.children.forEach(c => c.position.sub(mid));
  const size = bx.getSize(V(0, 0, 0)); mergeChildren(THREE, g);
  g.position.copy(pos); g.quaternion.copy(quat); scene.add(g);
  droppedMags.push({ g, v: vel.clone(), spin: V((Math.random() - .5) * 6, (Math.random() - .5) * 4, (Math.random() - .5) * 8), t: 0, rest: false, r: Math.max(.012, Math.min(size.x, size.y, size.z) / 2), life: 40 });
  while (droppedMags.length > maxKeep) { const d = droppedMags.shift(); scene.remove(d.g); }
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _up = V(0, 1, 0), _ax = V(0, 0, 0);
// floorAt(x, z, y) gives the height of the floor under a point; solid(p) says if a point is inside a wall.
export function updateMags(dt, scene, floorAt, solid, onLand) {
  for (let i = droppedMags.length - 1; i >= 0; i--) {
    const d = droppedMags[i], g = d.g; d.t += dt;
    if (!d.rest) {
      d.v.y -= 9.8 * dt; const ox = g.position.x, oz = g.position.z; g.position.addScaledVector(d.v, dt);
      if (solid(g.position)) { g.position.x = ox; g.position.z = oz; d.v.x *= -.3; d.v.z *= -.3; }
      _e.set(d.spin.x * dt, d.spin.y * dt, d.spin.z * dt); g.quaternion.multiply(_q.setFromEuler(_e));
      const fl = floorAt(g.position.x, g.position.z, g.position.y + .05) + d.r;
      if (g.position.y < fl) {
        g.position.y = fl; const hit = Math.abs(d.v.y);
        if (hit > 1.2) onLand?.(g.position, hit);
        d.v.y = hit * .25; d.v.x *= .5; d.v.z *= .5; d.spin.multiplyScalar(.4);
        if (hit < 1) {
          // settle flat: turn the mag's longest side to lie along the floor
          d.rest = true; d.v.set(0, 0, 0);
          _ax.set(0, 1, 0).applyQuaternion(g.quaternion); _q.setFromUnitVectors(_ax, V(_ax.x, 0, _ax.z).normalize().lengthSq() ? V(_ax.x, 0, _ax.z).normalize() : V(1, 0, 0)); g.quaternion.premultiply(_q);
        }
      }
    }
    if (d.t > d.life) { scene.remove(g); droppedMags.splice(i, 1); }
  }
}
export function clearMags(scene) { for (const d of droppedMags) scene.remove(d.g); droppedMags.length = 0; }

// ---------- the round your hand carries on shell-by-shell reloads ----------
export function makeHandShell(THREE, shotgun) {
  const g = new THREE.Group(), brass = new THREE.MeshStandardMaterial({ color: 0xd4a73a, metalness: .9, roughness: .25 });
  if (shotgun) {
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(.0105, .0105, .052, 16), new THREE.MeshStandardMaterial({ color: 0xd6453d, roughness: .45 }));
    const head = new THREE.Mesh(new THREE.CylinderGeometry(.0112, .0112, .014, 16), brass); head.position.y = -.026;
    g.add(hull, head);
  } else {
    const c = new THREE.Mesh(new THREE.LatheGeometry([[.0001, 0], [.0062, 0], [.0062, .004], [.0058, .005], [.006, .036], [.0042, .042], [.0036, .05]].map(([r, y]) => new THREE.Vector2(r, y)), 14), brass);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.0034, .014, 12), new THREE.MeshStandardMaterial({ color: 0xb06a3b, metalness: .8, roughness: .3 })); tip.position.y = .057;
    c.position.y = -.03; tip.position.y -= .03; g.add(c, tip);
  }
  g.rotation.set(0, 0, Math.PI / 2); g.position.set(-.004, .006, -.02); // pinched between thumb and fingers, lying across the hand
  return g;
}
