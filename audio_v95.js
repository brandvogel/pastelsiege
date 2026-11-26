// Synthesised sound. Gunshots are layered (crack + body + low thump + action click) and sent through a small room reverb.
export const clampA = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
let A = null, master, comp, verb, verbIn, noise, pink, tail, tailIn;
export const audioSettings = { volume: .8, spatial: 'hrtf' };
export function ac() {
  if (A) return A;
  A = new (window.AudioContext || window.webkitAudioContext)();
  comp = A.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = .002; comp.release.value = .18;
  master = A.createGain(); master.gain.value = audioSettings.volume; master.connect(comp); comp.connect(A.destination);
  // room reverb from a decaying noise impulse
  const len = A.sampleRate * 1.6, ir = A.createBuffer(2, len, A.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  verb = A.createConvolver(); verb.buffer = ir; verbIn = A.createGain(); verbIn.gain.value = .5; verbIn.connect(verb);
  const vOut = A.createGain(); vOut.gain.value = .35; verb.connect(vOut); vOut.connect(master);
  // big outdoor tail: 3.4 s, darker, with early reflections, so gunshots roll off into the distance
  const tl = Math.floor(A.sampleRate * 3.4), tir = A.createBuffer(2, tl, A.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = tir.getChannelData(ch); let lp = 0; for (let i = 0; i < tl; i++) { const k = i / tl; lp += ((Math.random() * 2 - 1) - lp) * (.35 - k * .3); d[i] = lp * Math.pow(1 - k, 2.4) * (i < A.sampleRate * .02 ? i / (A.sampleRate * .02) : 1); }
    for (const e of [.07, .13, .21, .34]) { const j = Math.floor(e * A.sampleRate + ch * 90); for (let q = 0; q < 600; q++) d[j + q] += (Math.random() * 2 - 1) * .5 * (1 - q / 600) * (1 - e); } }
  tail = A.createConvolver(); tail.buffer = tir; tailIn = A.createGain(); tailIn.gain.value = .6; tailIn.connect(tail);
  const tOut = A.createGain(); tOut.gain.value = .55; tail.connect(tOut); tOut.connect(master);
  noise = A.createBuffer(1, A.sampleRate * 2, A.sampleRate);
  const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  pink = A.createBuffer(1, A.sampleRate * 2, A.sampleRate);
  const p = pink.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < p.length; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0527; p[i] = (b0 + b1 + b2 + w * .1848) * .2; }
  if (ambWant !== "clear") setTimeout(() => { const w = ambWant; ambWant = ""; setAmbience(w); }); // weather chosen before the first click
  return A;
}
export function setVolume(v) { audioSettings.volume = v; if (master) master.gain.value = v; }

// ---------- 3D sound ----------
// Sounds played inside at3(position, fn) come from that spot in the world: an HRTF panner places them around
// your head (left/right, front/back, above/below) and fades them with distance. Behind a wall they're also muffled.
let cur3 = null, curOcc = false, curIn = null;
export function at3(p, fn, occluded = false) {
  if (!p) return fn();
  cur3 = p; curOcc = occluded; curIn = null;
  try { fn(); } finally { cur3 = null; curOcc = false; curIn = null; }
}
export function setListener(cam) {
  if (!A) return;
  const L = A.listener, e = cam.matrixWorld.elements, fx = -e[8], fy = -e[9], fz = -e[10], ux = e[4], uy = e[5], uz = e[6], p = cam.position;
  if (L.positionX) { const t = A.currentTime; L.positionX.setTargetAtTime(p.x, t, .02); L.positionY.setTargetAtTime(p.y, t, .02); L.positionZ.setTargetAtTime(p.z, t, .02);
    L.forwardX.setTargetAtTime(fx, t, .02); L.forwardY.setTargetAtTime(fy, t, .02); L.forwardZ.setTargetAtTime(fz, t, .02); L.upX.setTargetAtTime(ux, t, .02); L.upY.setTargetAtTime(uy, t, .02); L.upZ.setTargetAtTime(uz, t, .02); }
  else { L.setPosition(p.x, p.y, p.z); L.setOrientation(fx, fy, fz, ux, uy, uz); }
}
function panner3(p) {
  const n = A.createPanner(); n.panningModel = audioSettings.spatial === 'speakers' ? 'equalpower' : 'HRTF'; n.distanceModel = 'inverse'; n.refDistance = 10; n.rolloffFactor = .85; n.maxDistance = 400;
  if (n.positionX) { n.positionX.value = p.x; n.positionY.value = p.y ?? 1.4; n.positionZ.value = p.z; } else n.setPosition(p.x, p.y ?? 1.4, p.z);
  return n;
}

// One output chain: gain -> optional filter -> pan (stereo or 3D) -> master (+ reverb send)
function chain(o = {}) {
  const t = A.currentTime, g = A.createGain(), p3 = o.at || cur3;
  let node = g;
  if (o.lp || o.hp || o.bp) { const f = A.createBiquadFilter(); f.type = o.bp ? 'bandpass' : o.hp ? 'highpass' : 'lowpass'; f.frequency.value = o.bp || o.hp || o.lp; f.Q.value = o.q ?? (o.bp ? 1 : .7); node.connect(f); node = f; }
  let out = node;
  if (p3 && A.createPanner) {
    // every layer of one sound shares a single 3D panner (and wall muffle): HRTF is costly, so this keeps busy fights cheap
    if (!curIn || o.at) { const pn = panner3(p3); pn.connect(master); curIn = pn; if (curOcc) { const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 750; f.connect(pn); curIn = f; } }
    node.connect(curIn); out = null;
  }
  else if (A.createStereoPanner && o.pan) { const p = A.createStereoPanner(); p.pan.value = clampA(o.pan, -1, 1); node.connect(p); out = p; }
  if (out) out.connect(o.bus || master);
  // the reverb send is taken before the 3D panner, so distant fights still fill the room
  if (o.verb) { const s = A.createGain(); s.gain.value = o.verb * (p3 ? .6 : 1); node.connect(s); s.connect(verbIn); }
  if (o.tail) { const s = A.createGain(); s.gain.value = o.tail; node.connect(s); s.connect(tailIn); }
  return { g, t };
}
function tone({ f = 440, f2 = f, type = 'sine', dur = .1, vol = .1, attack = .002, delay = 0, ...o }) {
  if (!A) ac(); const { g, t: t0 } = chain(o), t = t0 + delay;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  const osc = A.createOscillator(); osc.type = type; osc.frequency.setValueAtTime(f, t); osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 20), t + dur);
  osc.connect(g); osc.start(t); osc.stop(t + dur + .02);
}
function hiss({ dur = .1, vol = .1, attack = .001, delay = 0, rate = 1, sweep = 0, colour = 'white', ...o }) {
  if (!A) ac(); const { g, t: t0 } = chain(o), t = t0 + delay;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  const s = A.createBufferSource(); s.buffer = colour === 'pink' ? pink : noise; s.playbackRate.value = rate * rnd(.92, 1.08);
  if (sweep) s.playbackRate.exponentialRampToValueAtTime(Math.max(.05, rate * sweep), t + dur);
  s.connect(g); s.start(t, Math.random() * 1.2); s.stop(t + dur + .02);
}
export function sfx(o) { tone(o); if (o.noise) hiss({ ...o, vol: (o.vol || .1) * o.noise * 1.4 }); }

// ---------- guns ----------
// Every shot is built from layers, like a real gun recording:
//   transient click → supersonic crack (stereo) → mid "punch" body → sub-bass boom you feel → mechanical action
//   → a long outdoor tail that rolls away, plus a slap-back echo off far walls.
// Each weapon class gets its own character; s = weapon snd {f, f2, noise, dur}; o = { quiet, cat, id, ads, last }
const GUN_CHAR = {
  Pistol:   { crack: .8, body: .9, sub: .7, tail: .55, mech: .9, bright: 1.15, width: .35 },
  SMG:      { crack: .7, body: .8, sub: .55, tail: .45, mech: 1, bright: 1.2, width: .3 },
  Rifle:    { crack: 1, body: 1, sub: .95, tail: .85, mech: .7, bright: 1, width: .45 },
  Marksman: { crack: 1.1, body: 1.05, sub: 1.05, tail: 1, mech: .6, bright: .95, width: .5 },
  Sniper:   { crack: 1.3, body: 1.1, sub: 1.4, tail: 1.35, mech: .2, bright: .9, width: .6 },
  Shotgun:  { crack: .55, body: 1.25, sub: 1.35, tail: 1.05, mech: .3, bright: .75, width: .55 },
  LMG:      { crack: .95, body: 1.05, sub: 1.05, tail: .9, mech: .8, bright: .95, width: .5 },
  Special:  { crack: .7, body: 1, sub: 1.1, tail: .9, mech: .4, bright: .9, width: .4 },
};
let lastGun = 0, gunRun = 0;
function gun(s, o = {}) {
  ac(); const C = GUN_CHAR[o.cat] || GUN_CHAR.Rifle, now = A.currentTime;
  // in long sprays the tail builds up; space the expensive layers so the mix stays clean
  gunRun = now - lastGun < .2 ? Math.min(gunRun + 1, 30) : 0; const dense = now - lastGun < .07; lastGun = now;
  const big = s.dur > .25, heavy = s.f < 200, v = .6, w = C.width, side = () => rnd(-w, w);
  if (o.id === 'rail' || o.id === 'arclance') {
    tone({ f: 2400, f2: 90, type: 'sawtooth', dur: .5, vol: .1, lp: 5000, verb: .5, tail: .4 }); tone({ f: 140, f2: 28, type: 'sine', dur: .7, vol: .38 });
    hiss({ dur: .7, vol: .14, bp: 3200, q: 2, sweep: .3, verb: .6, tail: .5 }); tone({ f: 5200, f2: 4800, type: 'sine', dur: .25, vol: .03, delay: .05 });
    tone({ f: 60, f2: 30, type: 'sine', dur: .9, vol: .25, delay: .02 }); hiss({ dur: .05, vol: .25, hp: 3000, pan: side() });
    return;
  }
  if (o.id === 'boomtube' || o.id === 'popper' || o.id === 'flare') {
    tone({ f: 120, f2: 45, type: 'sine', dur: .35, vol: .38 }); hiss({ dur: .3, vol: .2, lp: 1100, verb: .3, tail: .35 }); tone({ f: 900, f2: 400, type: 'square', dur: .03, vol: .03 });
    hiss({ dur: .45, vol: .08, bp: 1600, q: 1.5, sweep: 2.2, delay: .03 }); // the round whooshing away
    return;
  }
  if (o.quiet) { // suppressed: a heavy cough, the action and a little air, no crack
    hiss({ dur: .11, vol: .16, lp: 1400, colour: 'pink', tail: .12 }); tone({ f: s.f * .5, f2: 55, type: 'sine', dur: .12, vol: .2 });
    tone({ f: 2600, f2: 2200, type: 'square', dur: .012, vol: .03, delay: .01, hp: 1500 }); tone({ f: 1100, f2: 700, type: 'triangle', dur: .03, vol: .04, delay: .03 });
    hiss({ dur: .06, vol: .05, bp: 4500, q: 1, delay: .005 });
    return;
  }
  // 0. hard transient: the first millisecond "tick" that makes it sound snappy
  tone({ f: 4200 * C.bright, f2: 900, type: 'square', dur: .008, vol: v * .18, hp: 1200 });
  // 1. supersonic crack, split left/right for width
  const cd = (big ? .07 : .04) * (o.cat === 'Shotgun' ? 1.2 : 1);
  hiss({ dur: cd, vol: v * .55 * C.crack, hp: 2400 * C.bright, pan: -w, verb: .12 });
  hiss({ dur: cd * 1.15, vol: v * .5 * C.crack, hp: 2000 * C.bright, pan: w, verb: .12 });
  // 2. punchy mid body: what makes it sound "full"
  hiss({ dur: s.dur * 1.3, vol: v * .8 * s.noise * C.body, bp: clampA(s.f * 2.4, 280, 2400), q: .6, colour: 'pink', verb: .4, tail: .35 * C.tail, pan: side() * .5 });
  tone({ f: clampA(s.f * 1.4, 160, 900) * rnd(.97, 1.03), f2: 70, type: 'triangle', dur: .06 + s.dur * .3, vol: v * .32 * C.body, lp: 2500 });
  if (!dense) hiss({ dur: s.dur * 2.4, vol: v * .38 * s.noise * C.body, lp: 750, colour: 'pink', verb: .55 });
  // 3. sub-bass boom with a pitch drop (the chest hit) + a short distorted punch
  const subF = (heavy ? 95 : 130) * rnd(.95, 1.05);
  tone({ f: subF, f2: 28, type: 'sine', dur: .16 + s.dur * .6, vol: v * .85 * C.sub });
  tone({ f: subF * 2, f2: 50, type: 'sawtooth', dur: .05 + s.dur * .15, vol: v * .12 * C.sub, lp: 500 });
  // 4. the action: bolt carrier slam, brass flick
  if (C.mech > .25) {
    tone({ f: 3200 * rnd(.9, 1.1), f2: 2400, type: 'square', dur: .012, vol: .035 * C.mech, delay: .016, hp: 1800, pan: .3 });
    tone({ f: 1400 * rnd(.9, 1.1), f2: 900, type: 'triangle', dur: .025, vol: .04 * C.mech, delay: .028, pan: .25 });
  }
  // 5. outdoor tail: the shot rolling off into the distance (fed to the long reverb), thinned in sprays
  const tk = C.tail * (dense ? .45 : 1) * (o.ads ? 1.1 : 1);
  hiss({ dur: .5 + s.dur * 2.5 * C.tail, vol: v * .22 * tk, lp: 1100, colour: 'pink', tail: 1.1 * tk, attack: .01, pan: side() });
  if (!dense || o.last) {
    // slap-back off far walls, left then right
    hiss({ dur: s.dur * 1.6, vol: v * .13 * s.noise * C.tail, lp: 1600, delay: .1 + Math.random() * .05, colour: 'pink', pan: -.6, tail: .3 });
    hiss({ dur: s.dur * 1.8, vol: v * .09 * s.noise * C.tail, lp: 1100, delay: .19 + Math.random() * .07, colour: 'pink', pan: .6, tail: .3 });
    tone({ f: 70, f2: 30, type: 'sine', dur: .5 * C.tail, vol: v * .18 * C.sub, delay: .12, attack: .03 }); // distant rumble
  }
  // 6. last round in the mag: a hollow "ping" so you know you're empty
  if (o.last) tone({ f: 2900, f2: 2850, type: 'sine', dur: .25, vol: .05, delay: .05, verb: .3 });
}
// Enemy blasters: an electric zap with a noisy tail, muffled and quieter with distance.
function bot(pan, dist, kind) {
  if (cur3) dist *= .35;  // the 3D panner already fades it; keep only the muffling
  ac(); const far = clampA(1 - dist / 90, .12, 1), lp = 600 + 5000 * far * far;
  const base = kind === 'heavy' ? 420 : kind === 'boss' ? 300 : kind === 'shotgun' ? 520 : 900;
  tone({ f: base * rnd(.95, 1.05), f2: base * .3, type: 'square', dur: .1, vol: .05 * far, pan, lp, verb: .25 });
  hiss({ dur: .12, vol: .07 * far, pan, lp: lp * .6, colour: 'pink', verb: .35 });
}
function boom(dist = 0) {
  if (cur3) dist *= .4;
  ac(); const far = clampA(1 - dist / 120, .2, 1);
  tone({ f: 75, f2: 22, type: 'sine', dur: 1.3, vol: .55 * far });
  tone({ f: 160, f2: 40, type: 'triangle', dur: .5, vol: .25 * far });
  hiss({ dur: 1.4, vol: .4 * far, lp: 900 * far + 200, colour: 'pink', verb: .8 });
  hiss({ dur: .12, vol: .35 * far, hp: 1500 });
  for (let i = 0; i < 4; i++) hiss({ dur: .08, vol: .06 * far, bp: 2000 + Math.random() * 3000, delay: .25 + Math.random() * .6 });  // debris
}

export const SND = {
  gun,
  bot: (pan, dist, kind) => bot(pan, dist, kind),
  snipe: (pan, dist = 30) => { ac(); if (cur3) dist *= .4; const far = clampA(1 - dist / 140, .2, 1); hiss({ dur: .05, vol: .4 * far, hp: 2500, pan }); tone({ f: 130, f2: 30, type: 'sine', dur: .4, vol: .3 * far, pan }); hiss({ dur: .9, vol: .2 * far, lp: 1200, colour: 'pink', pan, verb: .9 }); },
  hit: () => { tone({ f: 220, f2: 90, type: 'sine', dur: .07, vol: .14 }); hiss({ dur: .05, vol: .08, lp: 900 }); tone({ f: 1500, f2: 1300, type: 'triangle', dur: .03, vol: .035 }); },
  head: () => { tone({ f: 2400, f2: 2300, type: 'sine', dur: .28, vol: .09 }); tone({ f: 3650, f2: 3600, type: 'sine', dur: .2, vol: .05 }); tone({ f: 200, f2: 80, type: 'sine', dur: .08, vol: .14 }); },
  kill: () => { tone({ f: 120, f2: 50, type: 'sine', dur: .14, vol: .22 }); tone({ f: 880, type: 'triangle', dur: .14, vol: .07, delay: .04 }); tone({ f: 1320, type: 'triangle', dur: .22, vol: .06, delay: .1 }); },
  shatter: () => { for (let i = 0; i < 6; i++) tone({ f: rnd(1800, 5200), f2: rnd(1200, 3000), type: 'triangle', dur: rnd(.05, .14), vol: .03, delay: i * rnd(.02, .07) }); hiss({ dur: .25, vol: .08, bp: 2500, q: .6 }); },
  splat: () => { hiss({ dur: .12, vol: .1, lp: 700, colour: 'pink' }); tone({ f: 160, f2: 60, type: 'sine', dur: .1, vol: .08 }); },
  cash: () => { tone({ f: 1568, type: 'sine', dur: .09, vol: .05 }); tone({ f: 2093, type: 'sine', dur: .14, vol: .05, delay: .06 }); },
  hurt: () => { tone({ f: 120, f2: 55, type: 'sine', dur: .2, vol: .3 }); hiss({ dur: .14, vol: .12, lp: 600, colour: 'pink' }); },
  heartbeat: () => { tone({ f: 60, f2: 40, type: 'sine', dur: .14, vol: .25 }); tone({ f: 55, f2: 38, type: 'sine', dur: .16, vol: .18, delay: .2 }); },
  click: () => tone({ f: 2600, f2: 2000, type: 'square', dur: .018, vol: .03, hp: 1200 }),
  magOut: () => { tone({ f: 1900, f2: 1500, type: 'square', dur: .02, vol: .03, hp: 900 }); hiss({ dur: .12, vol: .05, bp: 1800, sweep: .6, delay: .02 }); },
  magIn: () => { hiss({ dur: .06, vol: .06, bp: 1400 }); tone({ f: 900, f2: 600, type: 'square', dur: .03, vol: .05, delay: .05, lp: 3000 }); tone({ f: 2600, f2: 2400, type: 'square', dur: .015, vol: .04, delay: .09, hp: 1500 }); },
  mag: () => SND.magIn(),
  chargeH: () => { hiss({ dur: .07, vol: .06, bp: 2200, sweep: .5 }); tone({ f: 1200, f2: 800, type: 'square', dur: .025, vol: .05, delay: .09, lp: 4000 }); },
  bolt: () => { hiss({ dur: .07, vol: .06, bp: 1800 }); tone({ f: 700, f2: 500, type: 'square', dur: .03, vol: .05, lp: 3000 }); hiss({ dur: .07, vol: .06, bp: 2400, delay: .26 }); tone({ f: 900, f2: 600, type: 'square', dur: .03, vol: .06, delay: .3, lp: 3000 }); },
  pump: () => { hiss({ dur: .08, vol: .08, bp: 1200 }); tone({ f: 400, f2: 300, type: 'square', dur: .03, vol: .05, lp: 2000 }); hiss({ dur: .07, vol: .08, bp: 1500, delay: .17 }); tone({ f: 500, f2: 350, type: 'square', dur: .03, vol: .06, delay: .18, lp: 2000 }); },
  shellIn: () => { hiss({ dur: .05, vol: .05, bp: 1600 }); tone({ f: 700, f2: 500, type: 'triangle', dur: .03, vol: .04, delay: .02 }); },
  dry: () => tone({ f: 1800, f2: 1600, type: 'square', dur: .012, vol: .04, hp: 1000 }),
  casing: () => { const f = rnd(3800, 6200); tone({ f, f2: f * .97, type: 'sine', dur: .09, vol: .012 }); tone({ f: f * 1.5, type: 'sine', dur: .05, vol: .006, delay: .06 }); },
  boom: d => boom(d),
  thunder: d => thunder(d),
  step: (soft = 1) => stepSound(soft),
  land: (h = 1) => { tone({ f: 100, f2: 40, type: 'sine', dur: .12, vol: .14 * h }); hiss({ dur: .1, vol: .08 * h, lp: 500, colour: 'pink' }); },
  jump: () => hiss({ dur: .12, vol: .03, bp: 900, sweep: 1.6 }),
  slide: () => { hiss({ dur: .55, vol: .07, lp: 900, sweep: .5, colour: 'pink' }); hiss({ dur: .4, vol: .025, bp: 3000, sweep: .6 }); },
  dash: () => { hiss({ dur: .25, vol: .1, bp: 600, q: 1.5, sweep: 3 }); tone({ f: 180, f2: 420, type: 'sine', dur: .18, vol: .06 }); },
  wallrun: () => hiss({ dur: .12, vol: .03, bp: 1400, q: 1.2 }),
  mantle: () => { hiss({ dur: .2, vol: .05, lp: 800, colour: 'pink' }); tone({ f: 140, f2: 90, type: 'sine', dur: .1, vol: .07, delay: .18 }); },
  pickup: () => { tone({ f: 660, f2: 990, type: 'triangle', dur: .1, vol: .07 }); tone({ f: 1320, type: 'triangle', dur: .14, vol: .05, delay: .07 }); },
  buy: () => { tone({ f: 1046, type: 'triangle', dur: .1, vol: .07 }); tone({ f: 1568, type: 'triangle', dur: .18, vol: .06, delay: .07 }); hiss({ dur: .05, vol: .03, hp: 4000 }); },
  deny: () => { tone({ f: 220, f2: 180, type: 'square', dur: .12, vol: .04, lp: 1200 }); },
  ui: () => tone({ f: 1800, f2: 1600, type: 'sine', dur: .03, vol: .025 }),
  spin: () => { tone({ f: 120, f2: 520, type: 'sawtooth', dur: .5, vol: .03, lp: 1400 }); hiss({ dur: .5, vol: .02, bp: 2000, sweep: 2 }); },
  pad: () => { tone({ f: 200, f2: 900, type: 'triangle', dur: .3, vol: .1 }); hiss({ dur: .3, vol: .06, bp: 800, sweep: 3 }); },
  code: () => [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'triangle', dur: .2, vol: .08, delay: i * .09 })),
  levelUp: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, type: 'triangle', dur: .3, vol: .07, delay: i * .07, verb: .3 })); hiss({ dur: .6, vol: .02, hp: 5000, delay: .3 }); },
  medal: () => { tone({ f: 1175, type: 'triangle', dur: .16, vol: .06 }); tone({ f: 1760, type: 'triangle', dur: .22, vol: .05, delay: .08 }); },
  wave: () => { tone({ f: 220, f2: 220, type: 'sawtooth', dur: .8, vol: .05, lp: 900, verb: .5 }); tone({ f: 330, type: 'sawtooth', dur: .8, vol: .04, lp: 900, delay: .1, verb: .5 }); tone({ f: 55, f2: 45, type: 'sine', dur: 1.2, vol: .2 }); },
  boss: () => { [110, 104, 98].forEach((f, i) => tone({ f, type: 'sawtooth', dur: .5, vol: .08, lp: 600, delay: i * .4, verb: .6 })); },
  drone: () => { tone({ f: 1400, f2: 700, type: 'square', dur: .05, vol: .03, lp: 3500 }); hiss({ dur: .05, vol: .04, hp: 2000 }); },
  turret: () => { tone({ f: 600, f2: 250, type: 'square', dur: .06, vol: .04, lp: 2500 }); hiss({ dur: .08, vol: .07, bp: 1500, colour: 'pink' }); },
  heal: () => { tone({ f: 520, f2: 780, type: 'sine', dur: .3, vol: .04 }); },
  deploy: () => { tone({ f: 300, f2: 600, type: 'square', dur: .12, vol: .04, lp: 2000 }); tone({ f: 900, type: 'triangle', dur: .15, vol: .05, delay: .12 }); },
  scan: () => { tone({ f: 400, f2: 1600, type: 'sine', dur: .9, vol: .05, verb: .5 }); },
  fuse: () => tone({ f: 2400, type: 'square', dur: .03, vol: .03 }),
  whoosh: () => { hiss({ dur: .35, vol: .05, bp: 900, q: 1.2, sweep: 2.5, colour: "pink" }); },
  // Phantom / Stalker teleport: a rising shimmer while it charges, then a pop where it vanishes and a thump where it lands
  blinkCharge: () => { tone({ f: 300, f2: 1400, type: 'sine', dur: .4, vol: .05, verb: .4 }); tone({ f: 306, f2: 1420, type: 'triangle', dur: .4, vol: .025 }); },
  blinkOut: () => { tone({ f: 1800, f2: 300, type: 'sine', dur: .18, vol: .08 }); hiss({ dur: .2, vol: .06, bp: 2200, q: 1.5, sweep: .3 }); },
  blinkIn: () => { tone({ f: 160, f2: 60, type: 'sine', dur: .22, vol: .16 }); tone({ f: 900, f2: 1300, type: 'triangle', dur: .15, vol: .04 }); hiss({ dur: .3, vol: .05, bp: 700, colour: 'pink', verb: .6 }); },
  inspect: () => { hiss({ dur: .2, vol: .03, bp: 700, q: .8, colour: "pink" }); tone({ f: 1800, f2: 1500, type: "triangle", dur: .02, vol: .025, delay: .05 }); },
  boltBack: () => { tone({ f: 900, f2: 500, type: "square", dur: .03, vol: .05, lp: 3000 }); hiss({ dur: .08, vol: .06, bp: 2500, q: 2, sweep: .6, delay: .01 }); return true; },
  boltFwd: () => { tone({ f: 1500, f2: 700, type: "square", dur: .025, vol: .07, lp: 4000 }); tone({ f: 220, f2: 120, type: "sine", dur: .05, vol: .08 }); hiss({ dur: .04, vol: .05, hp: 3000 }); return true; },
  botStep: (heavy = 0) => { hiss({ dur: .06, vol: .05 + heavy * .04, lp: 500 + Math.random() * 300, colour: "pink" }); tone({ f: heavy ? 60 : 85, f2: 40, type: "sine", dur: .06, vol: .05 + heavy * .05 }); },
  servo: () => { tone({ f: 420, f2: 520, type: "sawtooth", dur: .18, vol: .012, lp: 1200 }); },
  whizz: pan => { hiss({ dur: .2, vol: .06, bp: 2600, q: 3, sweep: .45, pan }); },
};

// ---------- music ----------
// A looping pastel synth score made on the fly. Layers fade in with intensity:
// 0 calm (pads + soft keys), 1 patrol (+ hats, light kick, bass), 2 combat (+ full drums, arpeggio), 3 boss (+ lead, heavier).
const CHORDS = [ // two four-bar progressions, MIDI notes
  [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],   // Fmaj7 Em7 Dm7 Cmaj7
  [[50, 53, 57, 60], [55, 59, 62, 65], [52, 55, 59, 62], [57, 60, 64, 67]],   // Dm7 G7 Em7 Am7
];
const BOSS = [[45, 48, 52, 55], [41, 45, 48, 52], [43, 46, 50, 53], [40, 44, 47, 50]]; // Am F Gm E: darker
// Each floor plays one of these songs (two four-bar progressions + tempo). The menu has its own theme with a melody.
const SONGS = [
  { bpm: 108, p: CHORDS },
  { bpm: 116, p: [[[45, 48, 52, 55], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]], [[45, 48, 52, 55], [50, 53, 57, 60], [52, 56, 59, 62], [52, 56, 59, 62]]] },   // Am F C G / Am Dm E E
  { bpm: 100, p: [[[48, 52, 55, 59], [45, 48, 52, 55], [53, 57, 60, 64], [55, 59, 62, 65]], [[52, 55, 59, 62], [45, 48, 52, 55], [50, 53, 57, 60], [55, 59, 62, 65]]] },  // C Am F G / Em Am Dm G
  { bpm: 122, p: [[[50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 58], [45, 49, 52, 55]], [[50, 53, 57, 60], [43, 46, 50, 53], [46, 50, 53, 57], [45, 49, 52, 55]]] },  // Dm Bb C A / Dm Gm Bb A
  { bpm: 112, p: [[[52, 55, 59, 62], [48, 52, 55, 59], [55, 59, 62, 66], [50, 54, 57, 60]], [[52, 55, 59, 62], [47, 50, 54, 57], [48, 52, 55, 59], [50, 54, 57, 60]]] },  // Em C G D / Em Bm C D
];
const MENU = { bpm: 92, p: [[[53, 57, 60, 64], [48, 52, 55, 59], [50, 53, 57, 60], [55, 59, 62, 65]], [[53, 57, 60, 64], [52, 55, 59, 62], [45, 48, 52, 55], [55, 59, 62, 65]]] };
// menu melody: [16th-step, chord-tone index, octave up] per bar, a little hook that repeats with the changes
const HOOK = [[0, 3, 1], [3, 2, 1], [6, 1, 1], [8, 2, 1], [10, 3, 1], [12, 0, 2], [14, 3, 1]];
let song = SONGS[0];
const MENU_ON = { pad: 1, keys: 1, arp: 1, lead: 1, bass: 1, hat: 0, kick: 0, snare: 0 };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
export const music = { level: 0, want: 0, vol: .55, on: false };
let mBus, layers, step = 0, nextT = 0, timer = null, prog = 0;
function musicInit() {
  ac(); if (mBus) return;
  mBus = A.createGain(); mBus.gain.value = music.vol * .5; mBus.connect(master);
  layers = ['pad', 'keys', 'hat', 'kick', 'bass', 'snare', 'arp', 'lead'].reduce((o, k) => { const g = A.createGain(); g.gain.value = 0; g.connect(mBus); o[k] = g; return o; }, {});
}
const LAYER_LEVEL = { pad: 0, keys: 0, hat: 1, kick: 1, bass: 1, snare: 2, arp: 2, lead: 3 };
function setLayers() {
  const t = A.currentTime;
  for (const k in layers) { const on = music.level < 0 ? MENU_ON[k] : music.level >= LAYER_LEVEL[k] ? 1 : 0, g = layers[k].gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(on * ({ pad: .5, keys: .55, hat: .5, kick: .9, bass: .7, snare: .6, arp: .45, lead: .4 })[k], t + 2.5); }
}
function schedule(at, s) {
  const bar = Math.floor(s / 16) % 4, i = s % 16, boss = music.level >= 3;
  const menu = music.level < 0, S = menu ? MENU : song, L = layers;
  const chord = boss ? BOSS[bar] : S.p[prog % 2][bar], d = at - A.currentTime, beat = 60 / (boss ? 124 : S.bpm) / 4;
  if (menu) for (const [st, ci, oc] of HOOK) if (st === i && !(bar === 3 && st > 10)) { const m = chord[ci] + 12 * oc; tone({ f: hz(m), type: 'triangle', dur: beat * 2.6, vol: .05, attack: .01, delay: d, lp: 3800, bus: L.lead, verb: .55 }); tone({ f: hz(m) * 2, type: 'sine', dur: beat * 1.2, vol: .015, delay: d, bus: L.lead, verb: .4 }); }
  if (i === 0) {          // new bar: pad chord, swells in
    chord.forEach((m, k) => { tone({ f: hz(m), type: 'triangle', dur: beat * 16, vol: .05, attack: .5, delay: d, lp: 1800, bus: L.pad }); tone({ f: hz(m) * 1.004, type: 'sawtooth', dur: beat * 16, vol: .012, attack: .7, delay: d, lp: 1100, bus: L.pad, verb: .4 }); void k; });
    if (bar === 3 && s % 64 === 48) prog++;
  }
  if (i % 4 === 2 || (i === 8 && bar % 2)) { const m = chord[(i / 2 + bar) % 4] + 12; tone({ f: hz(m), type: 'sine', dur: .5, vol: .06, delay: d, bus: L.keys, verb: .5 }); tone({ f: hz(m) * 2, type: 'sine', dur: .25, vol: .012, delay: d, bus: L.keys }); }
  if (i % 2 === 0) hiss({ dur: i % 4 === 2 ? .06 : .025, vol: i % 4 === 2 ? .05 : .03, hp: 7000, delay: d, bus: L.hat });
  if (i === 0 || i === 8 || (boss && (i === 4 || i === 12)) || (i === 10 && bar === 3)) tone({ f: 140, f2: 42, type: 'sine', dur: .28, vol: .5, delay: d, bus: L.kick });
  if (i === 4 || i === 12) { hiss({ dur: .14, vol: .16, bp: 1900, q: .8, delay: d, colour: 'pink', bus: L.snare, verb: .3 }); tone({ f: 210, f2: 160, type: 'triangle', dur: .08, vol: .1, delay: d, bus: L.snare }); }
  if ([0, 3, 6, 10, 12, 14].includes(i)) { const root = chord[0] - 12 - (i === 14 ? -7 : 0); tone({ f: hz(root), type: boss ? 'sawtooth' : 'square', dur: beat * 1.8, vol: .07, delay: d, lp: boss ? 700 : 520, bus: L.bass }); tone({ f: hz(root) / 2, type: 'sine', dur: beat * 2, vol: .12, delay: d, bus: L.bass }); }
  { const order = [0, 1, 2, 3, 2, 1], m = chord[order[i % 6]] + 24; tone({ f: hz(m), type: 'triangle', dur: beat * 1.4, vol: .035, delay: d, lp: 3200, bus: L.arp, verb: .25 }); }
  if (boss && i % 8 === 0) { const m = chord[(bar + i / 8) % 4] + 24; tone({ f: hz(m), f2: hz(m) * .995, type: 'sawtooth', dur: beat * 7, vol: .03, attack: .03, delay: d, lp: 2400, bus: L.lead, verb: .5 }); }
  return beat;
}
function tick() {
  if (!A || !music.on) return;
  if (music.want !== music.level) { music.level = music.want; setLayers(); }
  if (nextT < A.currentTime) nextT = A.currentTime + .05;
  while (nextT < A.currentTime + .15) { nextT += schedule(nextT, step); step++; }
}
export function musicStart() { musicInit(); if (music.on) return; music.on = true; nextT = A.currentTime + .1; setLayers(); timer = setInterval(tick, 30); }
export function musicLevel(n) { music.want = n; }
export function musicSong(n) { const s = SONGS[(n - 1) % SONGS.length]; if (s !== song) { song = s; prog = 0; } }
export function setMusicVolume(v) { music.vol = v; if (mBus) mBus.gain.setTargetAtTime(v * .5, A.currentTime, .1); }

// all weather sound goes through one filter: under a roof it's muffled and quieter, like hearing rain from indoors
let ambBus = null, ambLp = null, stepSurf = '';
function bus() {
  if (!ambBus) { ambLp = A.createBiquadFilter(); ambLp.type = 'lowpass'; ambLp.frequency.value = 18000; ambBus = A.createGain(); ambLp.connect(ambBus); ambBus.connect(master); }
  return ambLp;
}
// k: 0 = out in the open, 1 = fully under cover
export function ambienceCover(k) {
  if (!A || !ambLp) return; const t = A.currentTime;
  ambLp.frequency.setTargetAtTime(18000 * Math.pow(900 / 18000, k), t, .25); ambBus.gain.setTargetAtTime(1 - .45 * k, t, .25);
}
// footsteps change with the weather: '' (normal), 'wet' (splashy), 'snow' (crunchy) or 'sand' (soft and gritty)
export function setStepSurface(s) { stepSurf = s || ''; }
function stepSound(soft) {
  if (stepSurf === 'wet') {
    hiss({ dur: .09, vol: .05 * soft, bp: 1800 + Math.random() * 900, q: 1.4 });
    tone({ f: rnd(500, 800), f2: rnd(900, 1400), type: 'sine', dur: .05, vol: .018 * soft, delay: .02 }); // a little "plip"
    tone({ f: 80, f2: 45, type: 'sine', dur: .05, vol: .03 * soft });
  } else if (stepSurf === 'snow') {
    for (let i = 0; i < 4; i++) hiss({ dur: .025, vol: .04 * soft, bp: rnd(1200, 3000), q: 2, delay: i * .022 }); // crunch: tiny grains breaking
    tone({ f: 70, f2: 40, type: 'sine', dur: .06, vol: .03 * soft });
  } else if (stepSurf === 'sand') {
    hiss({ dur: .12, vol: .035 * soft, hp: 2500, attack: .03 });
    tone({ f: 70, f2: 45, type: 'sine', dur: .05, vol: .025 * soft });
  } else { hiss({ dur: .07, vol: .045 * soft, lp: 600 + Math.random() * 300, colour: 'pink' }); tone({ f: 90, f2: 50, type: 'sine', dur: .05, vol: .04 * soft }); }
}
// ---------- weather ambience ----------
// Each weather is a few looping noise layers (rain hiss, patter, low rumble, wind howl) with slow wobbles in volume
// and pitch so they never sound like a loop, plus random one-shots (big drops, gusts). They all fade in and out.
let amb = null, ambWant = 'clear', ambQuiet = 1, ambTimer = 0;
const AMB = {
  rain:     { hiss: .085, hissLp: 5200, hissHp: 500, patter: .05, rumble: 0,   wind: .015, windF: 380, drops: 6 },
  storm:    { hiss: .14,  hissLp: 4200, hissHp: 300, patter: .08, rumble: .09, wind: .05,  windF: 320, drops: 9 },
  snow:     { hiss: 0,    patter: 0, rumble: 0, wind: .045, windF: 520, gust: .06 },
  blizzard: { hiss: .03,  hissLp: 2400, hissHp: 700, patter: 0, rumble: .03, wind: .13, windF: 440, gust: .16 },
  fog:      { hiss: 0,    patter: 0, rumble: .02, wind: .022, windF: 260, drone: .035 },
  sand:     { hiss: .09,  hissLp: 7000, hissHp: 1800, patter: 0, rumble: .04, wind: .11, windF: 700, gust: .14 },
};
function loopSrc(buf, rate = 1) { const s = A.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.start(0, Math.random() * 1.5); return s; }
function lfo(param, rate, depth) { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); return o; }
function buildAmb(cfg) {
  const out = A.createGain(); out.gain.value = 0; out.connect(bus());
  const nodes = [], add = n => (nodes.push(n), n);
  const layer = (buf, vol, setup, rate = 1) => { if (!vol) return null; const s = add(loopSrc(buf, rate)), g = add(A.createGain()); g.gain.value = vol; let n = s; for (const f of setup) { n.connect(f); n = f; add(f); } n.connect(g); g.connect(out); return { s, g }; };
  const filt = (type, f, q = .7) => { const b = A.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  // the steady hiss of rain (or sand)
  const h = layer(noise, cfg.hiss, [filt('highpass', cfg.hissHp || 500), filt('lowpass', cfg.hissLp || 5000)]);
  if (h) add(lfo(h.g.gain, .07, cfg.hiss * .25));
  // patter: brighter, faster wobble, like drops hitting roofs and puddles
  const pt = layer(noise, cfg.patter, [filt('bandpass', 2600, 1.2)], 1.3); if (pt) add(lfo(pt.g.gain, 1.7, cfg.patter * .45));
  // rumble: far-off thunder and the roar of a big storm
  const r = layer(pink, cfg.rumble, [filt('lowpass', 140)], .5); if (r) add(lfo(r.g.gain, .05, cfg.rumble * .6));
  // wind: a howl that rises and falls in pitch
  if (cfg.wind) { const bp = filt('bandpass', cfg.windF, 3.5), w = layer(pink, cfg.wind, [bp]); add(lfo(bp.frequency, .09, cfg.windF * .45)); add(lfo(w.g.gain, .13, cfg.wind * .55)); }
  // fog: a low, uneasy drone
  if (cfg.drone) for (const f of [55, 82.5]) { const o = add(A.createOscillator()), g = add(A.createGain()); o.type = 'sine'; o.frequency.value = f; g.gain.value = cfg.drone; o.connect(g); g.connect(out); o.start(); add(lfo(g.gain, .04 + f / 4000, cfg.drone * .7)); }
  return { out, nodes, cfg };
}
function stopAmb(a, fade = 1.5) {
  if (!a) return; const t = A.currentTime; a.out.gain.cancelScheduledValues(t); a.out.gain.setTargetAtTime(0, t, fade / 3);
  setTimeout(() => { for (const n of a.nodes) { try { n.stop?.(); } catch (e) { } try { n.disconnect(); } catch (e) { } } try { a.out.disconnect(); } catch (e) { } }, fade * 1000 + 300);
}
// id: clear, rain, storm, snow, blizzard, fog or sand
export function setAmbience(id) {
  ambWant = id; if (!A) return;
  if (amb && amb.id === id) return;
  stopAmb(amb); amb = null;
  const cfg = AMB[id]; if (!cfg) return;
  amb = buildAmb(cfg); amb.id = id; amb.out.gain.setTargetAtTime(ambQuiet, A.currentTime, .8);
}
// quieter in menus (k = 0..1)
export function ambienceLevel(k) { ambQuiet = k; if (amb && A) amb.out.gain.setTargetAtTime(k, A.currentTime, .4); }
// random one-shots: heavy drops on the rain, gusts in the wind
export function ambienceTick(dt) {
  if (!amb || !A || ambQuiet < .05) return;
  const c = amb.cfg; ambTimer -= dt; if (ambTimer > 0) return;
  ambTimer = rnd(.05, .25);
  if (c.drops && Math.random() < c.drops * .05) { const f = rnd(1800, 4200); tone({ f, f2: f * .6, type: 'sine', dur: .04, vol: .012 * ambQuiet, pan: rnd(-.8, .8) }); }
  if (c.gust && Math.random() < .025) hiss({ dur: rnd(1.5, 3), vol: c.gust * ambQuiet, bp: rnd(300, 700), q: 2, sweep: rnd(1.3, 2), attack: .8, colour: 'pink', pan: rnd(-.7, .7) });
}
// thunder: a sharp crack when it's close, then a long rolling rumble; the further away, the later and softer
function thunder(dist = 60) {
  ac(); const far = clampA(1 - dist / 160, .15, 1), delay = Math.min(2.5, dist / 120);
  if (dist < 40) { hiss({ dur: .25, vol: .5 * far, hp: 1200, delay }); hiss({ dur: .6, vol: .35 * far, bp: 700, sweep: .4, delay: delay + .02 }); }
  tone({ f: 60, f2: 28, type: 'sine', dur: 2.2, vol: .4 * far, delay: delay + .05 });
  for (let i = 0; i < 4; i++) hiss({ dur: rnd(1.4, 2.6), vol: rnd(.2, .35) * far, lp: 260 + far * 300, colour: 'pink', attack: rnd(.1, .4), delay: delay + .1 + i * rnd(.35, .7), tail: .5 });
}
// the sound card's clock in seconds (anti-cheat compares it with the browser's clock to catch speed hacks)
export const audioClock = () => A && A.state === 'running' ? A.currentTime : null;
