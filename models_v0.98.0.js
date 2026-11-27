// First-person gun models. Each returns anchor points (grip, fore hand, mag well, sight line) so hands and attachments line up.
import { kit, materials, frontPost, rearSight, redDot, holo, acog, scope, birdcage, slantBrake, arms } from './gunkit_v0.98.0.js';
import { applySkin } from './skins_v0.98.0.js';
import { pistol, revolver, minigun, launcher, railgun, doubleBarrel } from './models2_v0.98.0.js';
export { makeEnv } from './gunkit_v0.98.0.js';

// L receiver length, H height, B barrel, up upper style, hg handguard, st stock, mg magazine, mz muzzle device, irons [front, rear]
const S = {
  kestrel: { L: .4, H: .085, B: .3, up: 'ak', hg: 'wood', st: 'wood', mg: 'ak', mz: 'slant', irons: ['hood', 'notch'] },
  viper: { L: .38, H: .08, B: .3, up: 'ar', hg: 'mlok', st: 'ar', mg: 'stanag', mz: 'cage', rail: 1 },
  bruiser: { L: .42, H: .09, B: .3, up: 'ar', hg: 'quad', st: 'ar', mg: 'stanag', mz: 'cage', rail: 1 },
  hawkeye: { L: .42, H: .085, B: .44, up: 'ar', hg: 'mlok', st: 'thumb', mg: 'stanag', mz: 'cage', rail: 1 },
  ranger: { L: .24, H: .07, B: .5, up: 'lever', hg: 'wood', st: 'wood', mg: 'tube', mz: 'none', irons: ['hood', 'notch'] },
  feather: { L: .34, H: .07, B: .5, up: 'bolt', hg: 'stockfore', st: 'wood', mg: 'small', mz: 'crown', rail: 1 },
  needle: { L: .36, H: .075, B: .56, up: 'bolt', hg: 'stockfore', st: 'thumb', mg: 'small', mz: 'crown', rail: 1, fluted: 1 },
  thunder: { L: .42, H: .09, B: .6, up: 'bolt', hg: 'quad', st: 'thumb', mg: 'small', mz: 'brake', rail: 1, fluted: 1, bipod: 1 },
  hornet: { L: .28, H: .075, B: .1, up: 'smg', hg: 'tube', st: 'fold', mg: 'smg', mz: 'none', irons: ['hood', 'aperture'] },
  wasp: { L: .3, H: .09, B: .1, up: 'smg', hg: 'quad', st: 'fold', mg: 'smg', mz: 'cage', rail: 1 },
  thumper: { L: .24, H: .08, B: .46, up: 'pump', hg: 'pump', st: 'wood', mg: 'tube', mz: 'none', irons: ['bead', null] },
  storm: { L: .32, H: .09, B: .4, up: 'ar', hg: 'quad', st: 'ar', mg: 'drum', mz: 'none', rail: 1 },
  brick: { L: .46, H: .12, B: .38, up: 'lmg', hg: 'quad', st: 'lmg', mg: 'box', mz: 'cage', rail: 1, bipod: 1 },
  ripsaw: { L: .44, H: .11, B: .4, up: 'lmg', hg: 'jacket', st: 'wood', mg: 'drum', mz: 'cage', irons: ['hood', 'notch'] },
  bullpup50: { bull: 'p90' }, trident: { bull: 'famas' }, falcon: { bull: 'aug' },
  mink: { L: .3, H: .085, B: .12, up: 'smg', hg: 'quad', st: 'ar', mg: 'stanag', mz: 'none', rail: 1 },
  gnat: { L: .24, H: .075, B: .07, up: 'smg', hg: 'tube', st: 'fold', mg: 'smg', mz: 'none', irons: ['hood', 'aperture'] },
  vandal: { L: .3, H: .1, B: .1, up: 'smg', hg: 'quad', st: 'ar', mg: 'smg', mz: 'cage', rail: 1 },
  tommy: { L: .32, H: .08, B: .16, up: 'smg', hg: 'wood', st: 'wood', mg: 'drum', mz: 'none', irons: ['hood', 'notch'] },
  hive: { bull: 'p90' }, grizzly: { bull: 'aug' }, oracle: { bull: 'famas' },
  brute: { L: .34, H: .09, B: .34, up: 'ak', hg: 'quad', st: 'ar', mg: 'ak', mz: 'slant', rail: 1 },
  slugger: { L: .24, H: .08, B: .5, up: 'pump', hg: 'pump', st: 'thumb', mg: 'tube', mz: 'crown', irons: ['bead', null] },
  dragon: { L: .24, H: .08, B: .44, up: 'pump', hg: 'pump', st: 'ar', mg: 'tube', mz: 'brake', irons: ['bead', null] },
  talon: { L: .42, H: .092, B: .32, up: 'ar', hg: 'mlok', st: 'thumb', mg: 'stanag', mz: 'brake', rail: 1 },
  liberty: { L: .3, H: .075, B: .46, up: 'ak', hg: 'wood', st: 'wood', mg: 'small', mz: 'none', irons: ['hood', 'aperture'] },
  hammer: { L: .4, H: .085, B: .28, up: 'ar', hg: 'quad', st: 'ar', mg: 'stanag', mz: 'slant', rail: 1 },
  humming: { L: .36, H: .08, B: .26, up: 'ar', hg: 'mlok', st: 'fold', mg: 'stanag', mz: 'cage', rail: 1 },
  quad: { L: .38, H: .085, B: .3, up: 'ar', hg: 'mlok', st: 'thumb', mg: 'stanag', mz: 'brake', rail: 1 },
  sable: { L: .3, H: .075, B: .5, up: 'ak', hg: 'wood', st: 'wood', mg: 'small', mz: 'crown', irons: ['hood', 'notch'] },
  warden: { L: .44, H: .09, B: .46, up: 'ar', hg: 'quad', st: 'thumb', mg: 'stanag', mz: 'brake', rail: 1, bipod: 1 },
  whisper: { L: .32, H: .08, B: .34, up: 'ak', hg: 'jacket', st: 'thumb', mg: 'small', mz: 'none', rail: 1 },
  kaiser: { L: .32, H: .07, B: .56, up: 'bolt', hg: 'stockfore', st: 'wood', mg: 'small', mz: 'crown', rail: 1 },
  vortex: { L: .42, H: .09, B: .5, up: 'ar', hg: 'mlok', st: 'thumb', mg: 'stanag', mz: 'brake', rail: 1, fluted: 1 },
  leviathan: { L: .5, H: .11, B: .7, up: 'bolt', hg: 'quad', st: 'thumb', mg: 'box', mz: 'brake', rail: 1, fluted: 1, bipod: 1 },
  saw: { L: .46, H: .11, B: .42, up: 'lmg', hg: 'jacket', st: 'wood', mg: 'box', mz: 'cage', irons: ['hood', 'notch'] },
  bear: { L: .46, H: .11, B: .4, up: 'lmg', hg: 'wood', st: 'wood', mg: 'box', mz: 'slant', rail: 1, bipod: 1 },
  kodiak: { L: .4, H: .09, B: .4, up: 'ak', hg: 'wood', st: 'wood', mg: 'drum', mz: 'slant', irons: ['hood', 'notch'], bipod: 1 },
  kitten: { L: .3, H: .09, B: .12, up: 'smg', hg: 'quad', st: 'fold', mg: 'stanag', mz: 'none', rail: 1 },
  pez: { bull: 'p90' }, fennec: { bull: 'famas' }, augur: { bull: 'aug' },
  drumroll: { L: .34, H: .1, B: .32, up: 'ar', hg: 'quad', st: 'ar', mg: 'drum', mz: 'brake', irons: ['bead', null] },
  bandit: { L: .26, H: .08, B: .42, up: 'lever', hg: 'wood', st: 'wood', mg: 'tube', mz: 'none', irons: ['bead', null] },
  scarab: { L: .42, H: .095, B: .3, up: 'ar', hg: 'quad', st: 'fold', mg: 'stanag', mz: 'brake', rail: 1 },
  longbow: { L: .44, H: .09, B: .48, up: 'ar', hg: 'mlok', st: 'thumb', mg: 'stanag', mz: 'brake', rail: 1 },
  tempest: { L: .4, H: .085, B: .44, up: 'ak', hg: 'mlok', st: 'thumb', mg: 'small', mz: 'slant', rail: 1 },
  mosquito: { L: .3, H: .065, B: .46, up: 'bolt', hg: 'stockfore', st: 'thumb', mg: 'small', mz: 'crown', rail: 1 },
  glacier: { L: .42, H: .09, B: .5, up: 'ar', hg: 'quad', st: 'thumb', mg: 'stanag', mz: 'brake', rail: 1, fluted: 1 },
  hailstorm: { L: .46, H: .115, B: .4, up: 'lmg', hg: 'quad', st: 'lmg', mg: 'box', mz: 'cage', rail: 1, bipod: 1 },
  torchie: { L: .36, H: .11, B: .2, up: 'lmg', hg: 'jacket', st: 'fold', mg: 'drum', mz: 'cage' },
  leech: { L: .3, H: .09, B: .12, up: 'smg', hg: 'quad', st: 'fold', mg: 'smg', mz: 'cage', rail: 1 },
  guillotine: { L: .4, H: .09, B: .44, up: 'ar', hg: 'mlok', st: 'thumb', mg: 'small', mz: 'brake', rail: 1 },
  skater: { L: .26, H: .085, B: .08, up: 'smg', hg: 'tube', st: 'fold', mg: 'smg', mz: 'none', rail: 1 },
  heatsink: { L: .46, H: .12, B: .36, up: 'lmg', hg: 'quad', st: 'lmg', mg: 'box', mz: 'cage', rail: 1, bipod: 1, fluted: 1 },
  bouncer: { L: .24, H: .09, B: .34, up: 'pump', hg: 'pump', st: 'ar', mg: 'tube', mz: 'brake', irons: ['bead', null] },
  finale: { L: .38, H: .085, B: .32, up: 'ar', hg: 'quad', st: 'ar', mg: 'stanag', mz: 'crown', rail: 1 },
  phantom: { L: .38, H: .075, B: .58, up: 'bolt', hg: 'stockfore', st: 'thumb', mg: 'small', mz: 'crown', rail: 1, fluted: 1 },
};

export function buildGun(THREE, w, skin) {
  const g = new THREE.Group(), K = kit(THREE, g), M = materials(THREE, w.model), o = { group: g, spinner: null };
  applySkin(THREE, M, skin);
  const kind = w.model.kind;
  if (kind === 'melee') meleeModel(THREE, K, M, w, o);
  else if (kind === 'pistol') pistol(THREE, K, M, w, o);
  else if (kind === 'revolver') revolver(THREE, K, M, w, o);
  else if (kind === 'minigun') minigun(THREE, K, M, w, o);
  else if (kind === 'launcher') launcher(THREE, K, M, w, o);
  else if (kind === 'rail') railgun(THREE, K, M, w, o);
  else if (kind === 'double') doubleBarrel(THREE, K, M, w, o);
  else if (S[w.id]?.bull) bullpup(THREE, K, M, w, o, S[w.id].bull);
  else longGun(THREE, K, M, w, o, S[w.id] || S.viper);
  o.K = K; o.M = M;
  return o;
}

// Mounts whichever optic the weapon uses on a rail at railY, returns the sight line.
function mountOptic(THREE, K, M, w, z, railY) {
  const sc = w.scope;
  if (sc === 'dot') return redDot(K, M, z, railY);
  if (sc === 'holo') return holo(K, M, THREE, z, railY);
  if (sc === '3x') return acog(K, M, z, railY);
  return scope(K, M, z + .01, railY, parseInt(sc) || 4);
}

function longGun(THREE, K, M, w, o, c) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const { L, H, B } = c, back = .1, front = back - L, top = H / 2, bot = -H / 2, Wd = c.up === 'lmg' ? .066 : .056, bore = H * .12;
  const classic = ['lever', 'pump', 'bolt'].includes(c.up) && c.st === 'wood';
  // ---- receiver ----
  if (c.up === 'ar' || c.up === 'lmg') {
    K.side([[back, bore - .012], [front, bore - .012], [front, top - .004], [front + .006, top], [back - .006, top], [back, top - .006]], Wd, M.body, { r: .004 });
    K.side([[back - .004, bore - .012], [front + .05, bore - .012], [front + .058, bot - .022], [front + .14, bot - .024], [front + .16, bot - .004], [back - .07, bot], [back - .02, bot + .004], [back, bot + .012]], Wd - .004, c.up === 'lmg' ? M.body : M.poly, { r: .005 });
    K.rbox(.002, H * .28, L * .2, Wd / 2 + .001, bore + .006, back - L * .4, M.dark, .002);                      // ejection port door
    K.cyl(.007, .02, Wd / 2 + .006, bore + .01, back - .05, M.dark, 14, 'x');                                     // forward assist
    K.side([[back + .02, top - .012], [back - .01, top - .012], [back - .012, top - .004], [back + .02, top - .002]], .03, M.dark, { r: .003 }); // charging handle
    K.pin(0, bot + .012, back - .08, .0025, M.steel, Wd + .002); K.pin(0, bot + .012, front + .04, .0025, M.steel, Wd + .002);
    K.side([[back - .11, bot + .016], [back - .118, bot + .016], [back - .116, bot + .026], [back - .108, bot + .026]], .003, M.steel, { x: -Wd / 2 - .001, r: .001, bevel: 0 }); // selector
    if (c.up === 'lmg') { K.side([[back - .02, top], [front + .04, top], [front + .04, top + .02], [back - .04, top + .022]], Wd + .004, M.dark, { r: .006 }); } // feed cover (no carry handle: it sat right in front of the sights)
  } else if (c.up === 'ak') {
    K.side([[back, bot + .01], [front, bot + .01], [front, top - .01], [front + .02, top - .004], [back - .02, top - .004], [back, top - .016]], Wd, M.dark, { r: .004 });
    K.lathe([[.002, back - .005], [.026, back - .012], [.027, front + .06], [.02, front + .03]], M.dark, 0, top - .028, 24);   // ribbed dust cover
    for (let i = 0; i < 4; i++) K.torus(.0265, .0012, 0, top - .028, back - .06 - i * .04, M.metal, Math.PI);
    K.side([[back - .08, bore + .002], [back - .2, bore + .002], [back - .2, bore + .012], [back - .08, bore + .012]], .003, M.steel, { x: Wd / 2 + .002, r: .002, bevel: 0 });
    K.cyl(.006, .014, Wd / 2 + .008, bore + .006, back - .085, M.steel, 12, 'x');
    K.side([[back - .02, bot + .02], [back - .15, bot + .03], [back - .16, bot + .04], [back - .02, bot + .035]], .003, M.steel, { x: Wd / 2 + .003, r: .003, bevel: 0 });  // selector lever
  } else if (c.up === 'bolt') {
    K.lathe([[.012, back + .01], [.022, back], [.022, front + .02], [.02, front]], M.body, 0, bore, 28);
    o.bolt = K.capture(() => {
      const bz = back - .06; K.cyl(.0045, .045, .03, bore - .004, bz, M.steel, 12, 'x').rotation.y = -.4; K.sphere(.009, .055, bore - .012, bz + .01, M.steel);
      K.lathe([[.0175, back + .01], [.019, back + .03], [.012, back + .045]], M.steel, 0, bore, 20);              // bolt shroud
    });
    pivot(o.bolt, 0, bore, 0);
  } else if (c.up === 'lever' || c.up === 'pump') {
    K.side([[back, bot + .01], [front, bot + .012], [front, top - .008], [front + .02, top], [back - .03, top], [back, top - .015]], Wd - .006, M.body, { r: .006 });
    K.rbox(.002, H * .4, L * .35, (Wd - .006) / 2 + .001, bore, back - L * .5, M.dark, .004);
    if (c.up === 'lever') { const lz = back - .05; K.side([[lz + .03, bot + .01], [lz - .08, bot + .01], [lz - .08, bot - .04], [lz - .05, bot - .055], [lz + .02, bot - .05], [lz + .035, bot - .02]], .01, M.steel, { holes: [K.hole([[lz - .002, bot - .006], [lz - .07, bot - .006], [lz - .07, bot - .035], [lz - .05, bot - .045], [lz - .005, bot - .04]], .008)], r: .008 }); }
    else K.rbox(.004, .008, .03, Wd / 2, bore - .01, back - .06, M.steel, .002);
  } else if (c.up === 'smg') {
    K.lathe([[.018, back + .006], [.021, back], [.021, front + .02], [.019, front]], M.body, 0, top - .02, 24);        // cocking tube
    K.side([[back, top - .02], [front, top - .02], [front, bot + .01], [front + .05, bot - .012], [back - .02, bot - .012], [back, bot + .01]], Wd - .006, M.body, { r: .006 });
    K.side([[front + .02, top - .01], [front - .02, top - .016], [front - .02, top - .026], [front + .02, top - .026]], .012, M.dark, { x: -.012, r: .003 }); // cocking handle
  }
  // ---- barrel ----
  const bz0 = front, bz1 = front - B, br = c.up === 'bolt' ? .0135 : .0115;
  K.lathe([[br + .003, bz0 + .01], [br + .003, bz0 - .02], [br, bz0 - .03], [br * .85, bz1 + .03], [br * .85, bz1]], M.metal, 0, bore, 22);
  if (c.fluted) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; K.box(.002, .002, B * .55, Math.cos(a) * br * .86, bore + Math.sin(a) * br * .86, bz1 + B * .45, M.dark).rotation.z = a; }
  let muzzle = bz1;
  if (c.mz === 'cage') muzzle = birdcage(K, M, bz1 + .004, bore);
  else if (c.mz === 'slant') muzzle = slantBrake(K, M, bz1 + .004, bore);
  else if (c.mz === 'brake') { K.side(K.rect(bz1 - .07, bore - .018, bz1 + .004, bore + .018), .04, M.dark, { holes: [0, 1, 2].map(i => K.hole(K.rect(bz1 - .015 - i * .02, bore - .011, bz1 - .004 - i * .02, bore + .011), .002)), r: .006 }); muzzle = bz1 - .07; }
  else if (c.mz === 'crown') { K.lathe([[br * .5, bz1 - .002], [br * .9, bz1 + .002]], M.steel, 0, bore, 18); }
  o.muzzleZ = muzzle; o.boreY = bore;
  // ---- handguard ----
  const hz0 = front - .005, hlen = c.hg === 'jacket' ? B * .8 : Math.min(B * .72, .3), hz1 = hz0 - hlen, hzc = (hz0 + hz1) / 2;
  let foreY = bot + .006, foreZ = hzc;
  if (c.hg === 'mlok' || c.hg === 'quad') {
    const ht = top - .004, hb = bot + (c.hg === 'quad' ? .004 : .01), holes = [];
    if (c.hg === 'mlok') for (let i = 0; i < Math.floor(hlen / .04); i++) [bore - .014, bore + .016].forEach(yy => holes.push(K.hole(K.rect(hz0 - .024 - i * .04, yy - .005, hz0 - .006 - i * .04, yy + .005), .004)));
    else for (let i = 0; i < Math.floor(hlen / .03); i++) holes.push(K.hole(K.rect(hz0 - .02 - i * .03, bore - .006, hz0 - .008 - i * .03, bore + .006), .003));
    K.side(K.rect(hz1, hb, hz0, ht), Wd + .01, M.acc, { holes, r: .008 });
    K.rail(hz1 + .004, hz0 - .004, hb, M.dark, 0, .02, -1);
    foreY = hb - .004;
    if (c.hg === 'quad') [-1, 1].forEach(s => K.rbox(.006, .016, hlen - .02, s * (Wd / 2 + .008), bore, hzc, M.dark, .002));
  } else if (c.hg === 'wood') {
    K.side([[hz0, bore - .008], [hz1 + .01, bore - .006], [hz1, bore - .014], [hz1 + .01, bot - .004], [hz0 - .04, bot - .008], [hz0 - .09, bot - .002], [hz0 - .14, bot - .008], [hz0, bot - .006]], Wd + .006, M.acc, { r: .008 });
    if (c.up === 'ak') { K.cyl(.0105, hlen * .9, 0, bore + .026, hzc + .01, M.dark, 16); K.side([[hz0, bore + .014], [hz1 + .03, bore + .016], [hz1 + .03, bore + .04], [hz0, bore + .038]], .03, M.acc, { r: .01 }); }
    foreY = bot - .01;
  } else if (c.hg === 'tube') { K.lathe([[.025, hz0], [.03, hz0 - .01], [.031, hz1 + .02], [.026, hz1 + .006], [.016, hz1]], M.poly, 0, bore - .004, 24); for (let i = 0; i < 6; i++) K.torus(.0305, .0016, 0, bore - .004, hz0 - .03 - i * .02, M.rubber); foreY = bore - .034; }
  else if (c.hg === 'pump') {
    K.lathe([[.012, front + .01], [.012, bz1 + .03]], M.metal, 0, bore - .026, 18);                                // tube magazine
    const pz = front - .1;
    o.pump = K.capture(() => { K.lathe([[.02, pz + .06], [.025, pz + .055], [.026, pz - .055], [.02, pz - .06]], M.acc, 0, bore - .026, 24); for (let i = 0; i < 7; i++) K.torus(.0262, .0018, 0, bore - .026, pz - .045 + i * .015, M.dark); });
    foreY = bore - .05; foreZ = pz;
  } else if (c.hg === 'stockfore') { K.side([[front + .04, bot + .004], [front - .02, bot + .006], [bz1 + B * .55, bore - .006], [bz1 + B * .5, bore - .018], [front - .04, bot - .028], [front + .04, bot - .03]], .046, c.st === 'wood' ? M.wood : M.poly, { r: .012 }); foreY = bot - .03; foreZ = front - .04; }
  else if (c.hg === 'jacket') { const holes = []; for (let i = 0; i < 7; i++) holes.push(K.circle(hz0 - .03 - i * .04, bore, .007)); K.side(K.rect(hz1, bore - .019, hz0, bore + .019), .038, M.dark, { holes, r: .016 }); K.side([[front + .05, bot], [front - .05, bot], [front - .05, bot - .03], [front + .05, bot - .03]], .03, M.wood, { r: .01 }); foreY = bot - .03; foreZ = front - .02; }
  if (c.mg === 'tube' && c.up === 'lever') K.lathe([[.009, front + .01], [.009, bz1 + .04], [.007, bz1 + .035]], M.metal, 0, bore - .02, 16);
  if (c.bipod) [-1, 1].forEach(s => { K.rbox(.008, .008, .2, s * .016, foreY - .006, hz0 - .12, M.dark, .002); K.rbox(.014, .006, .016, s * .016, foreY - .008, hz0 - .225, M.rubber, .002); });
  // ---- grip & trigger ----
  const gz = classic ? back + .03 : back - .1, gy = bot + (c.up === 'ar' || c.up === 'lmg' ? .002 : .008);
  if (!classic) {
    K.side([[gz - .018, gy], [gz + .02, gy], [gz + .036, gy - .045], [gz + .05, gy - .1], [gz + .044, gy - .112], [gz + .014, gy - .108], [gz + .006, gy - .085], [gz - .002, gy - .066], [gz + .002, gy - .05], [gz - .012, gy - .03]], .032, c.up === 'ak' ? M.wood : M.poly, { r: .007 });
    [-1, 1].forEach(s => { for (let i = 0; i < 5; i++) K.box(.001, .003, .022, s * .0165, gy - .045 - i * .012, gz + .022 + i * .004, M.rubber); });
  }
  const tz = classic ? back + .005 : gz - .03;
  K.side([[tz + .02, gy], [tz - .04, gy], [tz - .04, gy - .008], [tz - .028, gy - .03], [tz + .012, gy - .03], [tz + .02, gy - .018]], .012, c.up === 'ar' ? M.poly : M.steel, { holes: [K.hole([[tz + .014, gy - .004], [tz - .033, gy - .004], [tz - .024, gy - .025], [tz + .008, gy - .025]], .004)], r: .006 });
  K.side([[tz - .004, gy], [tz + .002, gy], [tz, gy - .016], [tz - .008, gy - .022], [tz - .007, gy - .013]], .005, M.steel, { r: .002 });
  // ---- magazine ----
  const mz = c.up === 'ak' ? front + .1 : c.up === 'bolt' ? back - .12 : front + .1, my = c.up === 'ar' || c.up === 'lmg' ? bot - .02 : bot + .01;
  o.magG = K.capture(() => {
  if (c.mg === 'stanag') { K.side([[mz - .026, my + .02], [mz + .026, my + .02], [mz + .032, my - .07], [mz + .044, my - .13], [mz - .006, my - .136], [mz - .018, my - .074]], .024, M.dark, { r: .004 }); K.rbox(.028, .008, .056, 0, my - .136, mz + .02, M.poly, .003); [-1, 1].forEach(s => K.side([[mz - .014, my - .01], [mz + .018, my - .01], [mz + .024, my - .09], [mz - .006, my - .092]], .001, M.metal, { x: s * .0125, r: .004, bevel: 0 })); }
  else if (c.mg === 'ak') { K.side([[mz - .03, my + .01], [mz + .026, my + .01], [mz + .052, my - .07], [mz + .09, my - .135], [mz + .052, my - .16], [mz + .014, my - .095], [mz - .012, my - .04]], .028, M.acc, { r: .006 }); [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) K.box(.002, .004, .036, s * .0145, my - .03 - i * .035, mz + .012 + i * .02, M.dark).rotation.x = -.5; }); }
  else if (c.mg === 'smg') K.side([[mz - .02, my + .01], [mz + .02, my + .01], [mz + .03, my - .08], [mz + .05, my - .15], [mz + .016, my - .156], [mz - .008, my - .085]], .022, M.dark, { r: .005 });
  else if (c.mg === 'drum') { K.cyl(.064, .03, 0, my - .07, mz, M.dark, 32, 'x'); K.cyl(.05, .034, 0, my - .07, mz, M.metal, 32, 'x'); K.rbox(.026, .05, .04, 0, my - .015, mz, M.dark, .004); }
  else if (c.mg === 'small') K.rbox(.03, .045, .07, 0, my - .015, mz, M.dark, .004);
  else if (c.mg === 'box') { K.rbox(.08, .12, .13, -.012, my - .07, mz, M.acc, .008); K.rbox(.082, .02, .06, -.012, my - .02, mz, M.dark, .004); for (let i = 0; i < 6; i++) K.rbox(.02, .008, .008, -.05 + i * .006, my - .005 + i * .006, mz - .04, M.brass, .002); }
  });
  // small details: mag release button and bolt catch
  if (c.up === "ar" || c.up === "lmg") { K.cyl(.0045, .004, Wd / 2 + .002, bot - .004, mz + .04, M.steel, 12, "x"); K.side([[mz - .03, bore - .01], [mz - .05, bore - .01], [mz - .05, bore - .02], [mz - .03, bore - .022]], .003, M.dark, { x: -Wd / 2 - .001, r: .002, bevel: 0 }); }
  // ---- stock ----
  let bk = back;
  if (c.st === 'ar' || c.st === 'lmg') {
    const sy = bore - .004, sl = c.st === 'lmg' ? .24 : .22;
    K.lathe([[.016, back], [.016, back + sl * .9], [.012, back + sl * .92]], M.dark, 0, sy, 22);
    K.side([[back + .06, sy + .022], [back + sl, sy + .026], [back + sl + .008, sy + .018], [back + sl + .008, sy - .085], [back + sl - .02, sy - .09], [back + .13, sy - .038], [back + .06, sy - .024]], .04, M.poly, { holes: [K.hole([[back + .1, sy - .022], [back + sl - .03, sy - .022], [back + sl - .03, sy - .06], [back + .14, sy - .034]], .008)], r: .008 });
    K.rbox(.044, .118, .016, 0, sy - .032, back + sl + .014, M.rubber, .006); bk = back + sl + .022;
  } else if (c.st === 'wood') {
    K.side([[back, top - .01], [back + .06, bore - .004], [back + .28, bore + .006], [back + .3, bore], [back + .3, bot - .085], [back + .27, bot - .094], [back + .1, bot - .04], [back + .05, bot - .055], [back + .02, bot - .06], [back - .01, bot + .006]], .044, M.wood, { r: .012 });
    K.rbox(.046, .11, .018, 0, bot - .03, back + .306, M.rubber, .006); bk = back + .315;
  } else if (c.st === 'thumb') {
    K.side([[back, top], [back + .06, top - .004], [back + .3, top + .006], [back + .32, top - .004], [back + .32, bot - .1], [back + .26, bot - .11], [back + .1, bot - .055], [back + .04, bot - .1], [back - .02, bot - .1], [back - .03, bot]], .046, M.poly,
      { holes: [K.hole([[back + .04, bot + .002], [back + .1, bot], [back + .11, bot - .035], [back + .06, bot - .055]], .01)], r: .012 });
    K.rbox(.04, .016, .12, 0, top + .012, back + .22, M.acc, .006); K.cyl(.006, .052, 0, top + .004, back + .2, M.steel, 12, 'x');
    K.rbox(.048, .13, .018, 0, bot - .035, back + .326, M.rubber, .006); bk = back + .335;
  } else if (c.st === 'fold') {
    [-1, 1].forEach(s => K.cyl(.005, .19, s * .022, bore - .014, back + .095, M.steel, 10)); K.side([[back + .185, bore - .004], [back + .205, bore - .004], [back + .205, bore - .08], [back + .185, bore - .08]], .05, M.rubber, { r: .008 }); bk = back + .205;
  }
  if (classic) o.grip = V(0, bot - .05, back + .045); else o.grip = V(0, gy - .055, gz + .02);
  o.fore = V(0, foreY, foreZ); o.mag = V(0, my, mz); o.back = bk; o.top = top;
  // ---- sights ----
  const wantRail = c.rail || w.scope !== 'iron' || (c.irons && c.irons[1] === 'aperture' && c.up === 'ar');
  let railY = top;
  if (wantRail && !c.rail) { const ry = c.up === 'lmg' ? .019 : .004; K.rbox(.026, .01, L * .55, 0, top + ry, back - L * .42, M.dark, .003); railY = top + ry + .005; } // LMGs: on top of the feed cover
  if (c.rail) { const lift = c.up === 'lmg' ? .022 : 0; K.rail(front + .01, back - .004, top + lift, M.dark); if (c.hg === 'mlok' || c.hg === 'quad') K.rail(hz1 + .006, hz0, top - .004, M.dark); railY = top + lift + .009; } // LMGs: the rail runs along the top of the feed cover
  if (w.scope !== 'iron') { const r = mountOptic(THREE, K, M, w, back - L * .42, railY); o.sightY = r.sightY; o.rearZ = r.rearZ; return; }
  const [fs, rs] = c.irons || ['ar', 'aperture'];
  if (fs === 'bead') { o.sightY = bore + .022; K.side([[front, bore + .014], [bz1 + .01, bore + .014], [bz1 + .01, bore + .018], [front, bore + .018]], .008, M.dark, { r: .002 }); frontPost(K, M, bz1 + .012, bore + .018, o.sightY, 'bead'); o.rearZ = back - .02; return; }
  o.sightY = Math.max(railY, bore + br + .006) + .024;
  const fz = c.hg === 'mlok' || c.hg === 'quad' ? hz1 + .016 : bz1 + .04;
  frontPost(K, M, fz, fz < hz1 ? bore + br * .85 : (c.hg === 'mlok' || c.hg === 'quad' ? railY : bore + br), o.sightY, fs);
  const rz = c.up === 'ak' ? front + .03 : c.up === 'lever' || c.up === 'pump' ? front - .06 : back - .03;
  const rBase = c.up === 'ak' ? top - .002 : c.up === 'lever' ? bore + br : railY;
  rearSight(K, M, THREE, rz, rBase, o.sightY, rs || 'aperture');
  o.rearZ = rz + .004;
}

function bullpup(THREE, K, M, w, o, style) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), back = .2, front = -.38, top = .05, bot = -.05, bore = .006;
  if (style === 'p90') {
    K.side([[back, .03], [back - .02, top], [front + .06, top], [front, .02], [front, -.03], [front + .05, -.07], [front + .14, -.07], [front + .17, -.13], [front + .24, -.13], [back - .1, -.06], [back - .04, -.1], [back, -.1]], .062, M.body,
      { holes: [K.hole([[front + .18, -.06], [front + .23, -.06], [front + .23, -.11], [front + .19, -.11]], .012), K.hole([[back - .1, -.04], [back - .04, -.04], [back - .05, -.08], [back - .09, -.07]], .014)], r: .02 });
    o.magUp = true; o.magG = K.capture(() => { K.rbox(.05, .03, .34, 0, top + .016, -.05, M.smoke, .012);
    for (let i = 0; i < 14; i++) K.cyl(.004, .02, (i % 2 ? .008 : -.008), top + .016, -.2 + i * .022, M.brass, 8, 'x'); });
    K.rbox(.064, .012, .04, 0, top + .036, front + .1, M.dark, .004);
    o.grip = V(0, -.09, front + .21); o.fore = V(0, -.09, front + .1); o.mag = V(0, top, -.05);
  } else if (style === 'famas') {
    K.side([[back, .03], [back - .02, top], [front + .04, top], [front, .02], [front, -.03], [front + .1, -.05], [back - .06, -.05], [back - .02, -.12], [back, -.12]], .058, M.body, { r: .014 });
    K.side([[front + .05, top], [back - .07, top], [back - .09, top + .05], [front + .07, top + .05]], .03, M.body, { holes: [K.hole([[front + .09, top + .008], [back - .11, top + .008], [back - .12, top + .036], [front + .1, top + .036]], .01)], r: .01 });
    [-1, 1].forEach(s => K.side([[front + .02, .02], [front + .22, .01], [front + .22, -.02], [front + .02, -.01]], .002, M.dark, { x: s * .03, r: .006, bevel: 0 }));
    K.side([[front + .16, -.05], [front + .2, -.05], [front + .22, -.15], [front + .18, -.155], [front + .16, -.12]], .032, M.poly, { r: .008 });
    o.magG = K.capture(() => K.side([[back - .12, -.05], [back - .07, -.05], [back - .07, -.17], [back - .11, -.17]], .024, M.dark, { r: .004 }));
    o.grip = V(0, -.1, front + .2); o.fore = V(0, -.04, front + .06); o.mag = V(0, -.05, back - .09);
  } else {
    K.side([[back, .025], [back - .03, top - .01], [front + .05, top - .005], [front, .015], [front, -.025], [front + .07, -.05], [back - .05, -.055], [back - .02, -.11], [back, -.11]], .06, M.body, { r: .02 });
    K.side([[front + .06, -.05], [front + .2, -.05], [front + .22, -.13], [front + .2, -.15], [front + .17, -.13], [front + .13, -.15], [front + .06, -.14], [front + .04, -.1]], .03, M.body, { holes: [K.hole([[front + .085, -.06], [front + .185, -.06], [front + .175, -.12], [front + .1, -.125]], .01)], r: .01 });
    o.magG = K.capture(() => K.side([[back - .12, -.05], [back - .07, -.05], [back - .06, -.16], [back - .1, -.165]], .024, M.smoke, { r: .004 }));
    K.rbox(.004, .03, .06, .032, 0, back - .08, M.dark, .002);
    o.grip = V(0, -.1, front + .2); o.fore = V(0, -.1, front + .09); o.mag = V(0, -.05, back - .09);
  }
  const B = .14; K.lathe([[.012, front + .01], [.0105, front - B]], M.metal, 0, bore, 20); const mz = birdcage(K, M, front - B + .004, bore);
  K.rbox(.064, .12, .016, 0, -.04, back + .008, M.rubber, .008);
  K.side([[front + .17, -.05], [front + .23, -.05], [front + .23, -.06], [front + .2, -.08], [front + .175, -.075]], .012, M.poly, { holes: [K.hole([[front + .178, -.053], [front + .222, -.053], [front + .2, -.072]], .003)], r: .004 });
  o.muzzleZ = mz; o.boreY = bore; o.top = top; o.back = back + .016;
  const railY = style === 'famas' ? top + .05 : top + (style === 'p90' ? .032 : 0);
  if (style !== 'p90') K.rail(front + .08, back - .08, railY, M.dark);
  if (w.scope !== 'iron') { const r = mountOptic(THREE, K, M, w, style === 'p90' ? front + .1 : -.06, railY + (style === 'p90' ? .012 : .009)); o.sightY = r.sightY; o.rearZ = r.rearZ; }
  else { o.sightY = railY + .033; rearSight(K, M, THREE, back - .1, railY + .009, o.sightY, 'aperture'); frontPost(K, M, front + .09, railY + .009, o.sightY, 'ar'); o.rearZ = back - .096; }
}

// Attachments, placed using the model's anchor points.
export function decorateGun(THREE, view, w) {
  // newer parts reuse the look of a similar older part
  const AL = { monolith: "suppressor", tankbrake: "brake", duckbill: "choke", ported: "comp", heavybarrel: "longbarrel", fluted: "match", rapid: "match", stubby: "vgrip", handstop: "agrip", jungle: "extmag", bigmag: "extmag", tacstock: "heavystock", recoilpad: "cheek", brace: "lightstock" };
  const a = {}; for (const k in w.att || {}) a[k] = AL[w.att[k]] || w.att[k];
  const K = view.K, M = view.M, by = view.boreY, f = view.fore, mg = view.mag, bk = view.back ?? .1;
  if (a.barrel === 'longbarrel') { K.lathe([[.0095, view.muzzleZ + .01], [.0095, view.muzzleZ - .12]], M.metal, 0, by, 18); view.muzzleZ -= .12; }
  else if (a.barrel === 'match') K.lathe([[.012, view.muzzleZ + .05], [.0125, view.muzzleZ + .04], [.0125, view.muzzleZ + .01]], M.brass, 0, by, 18);
  const m0 = view.muzzleZ;
  if (a.muzzle === 'suppressor') {
    K.lathe([[.012, m0 + .004], [.022, m0 - .004], [.025, m0 - .016], [.025, m0 - .19], [.022, m0 - .2], [.008, m0 - .202]], M.dark, 0, by, 28);
    for (let i = 0; i < 6; i++) K.torus(.0252, .0009, 0, by, m0 - .03 - i * .004, M.metal);
    K.cyl(.006, .002, 0, by, m0 - .2015, M.rubber, 16); view.muzzleZ = m0 - .2;
  } else if (a.muzzle === 'comp') { K.lathe([[.012, m0], [.013, m0 - .06], [.011, m0 - .065]], M.dark, 0, by, 20); for (let i = 0; i < 3; i++) K.cyl(.0035, .004, 0, by + .012, m0 - .014 - i * .016, M.rubber, 10, 'y'); view.muzzleZ = m0 - .065; }
  else if (a.muzzle === 'brake') { K.side(K.rect(m0 - .075, by - .016, m0, by + .016), .036, M.dark, { holes: [0, 1, 2].map(i => K.hole(K.rect(m0 - .02 - i * .02, by - .01, m0 - .008 - i * .02, by + .01), .002)), r: .006 }); view.muzzleZ = m0 - .075; }
  else if (a.muzzle === 'flashhider') { K.lathe([[.009, m0], [.0115, m0 - .006], [.0115, m0 - .05]], M.dark, 0, by, 20); for (let i = 0; i < 4; i++) { const ang = i / 4 * Math.PI * 2; K.box(.003, .003, .032, Math.cos(ang) * .0118, by + Math.sin(ang) * .0118, m0 - .032, M.rubber); } view.muzzleZ = m0 - .05; }
  else if (a.muzzle === 'choke') { K.lathe([[.016, m0 + .005], [.017, m0], [.017, m0 - .04], [.015, m0 - .045]], M.brass, 0, by, 20); for (let i = 0; i < 6; i++) K.torus(.0172, .0008, 0, by, m0 - .006 - i * .006, M.dark); view.muzzleZ = m0 - .045; }
  if (a.under === 'vgrip') { K.side([[f.z + .012, f.y], [f.z - .024, f.y], [f.z - .026, f.y - .03], [f.z - .022, f.y - .05], [f.z - .026, f.y - .075], [f.z - .02, f.y - .1], [f.z + .01, f.y - .1], [f.z + .014, f.y - .02]], .028, M.poly, { r: .008 }); view.fore = f.clone().add(new THREE.Vector3(0, -.06, -.008)); }
  else if (a.under === 'agrip') { K.side([[f.z + .03, f.y], [f.z - .05, f.y], [f.z - .045, f.y - .012], [f.z + .01, f.y - .05], [f.z + .03, f.y - .045]], .03, M.poly, { r: .01 }); view.fore = f.clone().add(new THREE.Vector3(0, -.035, -.01)); }
  else if (a.under === 'bipod') { K.rbox(.03, .022, .03, 0, f.y - .008, f.z - .08, M.metal, .004); [-1, 1].forEach(s => { K.rbox(.008, .008, .2, s * .016, f.y - .02, f.z + .02, M.dark, .002); K.rbox(.014, .007, .016, s * .016, f.y - .022, f.z + .12, M.rubber, .002); }); }
  else if (a.under === 'laser') {
    const lz = f.z - .03, ly = view.pistol ? f.y + .05 : f.y - .016;
    K.rbox(.024, .022, .06, view.pistol ? 0 : .002, ly, lz, M.dark, .004); K.cyl(.006, .003, 0, ly, lz - .031, M.red, 12); K.rbox(.008, .006, .01, .012, ly + .008, lz + .02, M.orange, .002);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, ly, lz - .032), new THREE.Vector3(0, ly, lz - 2.5)]), new THREE.LineBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: .5 }));
    line.frustumCulled = false; view.group.add(line); view.laser = line; view.laserFrom = new THREE.Vector3(0, ly, lz - .032);
  }
  else if (a.under === "flashlight") {
    const lz = f.z - .03, ly = view.pistol ? f.y + .05 : f.y - .018;
    K.lathe([[.012, lz + .04], [.013, lz - .02], [.017, lz - .035], [.017, lz - .045]], M.dark, 0, ly, 20);
    const lens = K.cyl(.014, .003, 0, ly, lz - .046, M.white, 20); lens.material = lens.material.clone(); lens.material.color.setRGB(3, 3, 2.6); view.torchFrom = new THREE.Vector3(0, ly, lz - .05);
  }
  const magParts = () => {
  if (a.mag === 'extmag') K.side([[mg.z - .014, mg.y - .1], [mg.z + .04, mg.y - .1], [mg.z + .05, mg.y - .17], [mg.z - .002, mg.y - .174]], .026, M.dark, { r: .005 });
  else if (a.mag === 'drum') { K.cyl(.058, .028, -.016, mg.y - .07, mg.z + .01, M.dark, 32, 'x'); K.cyl(.058, .028, .016, mg.y - .07, mg.z + .01, M.dark, 32, 'x'); K.cyl(.02, .07, 0, mg.y - .07, mg.z + .01, M.metal, 16, 'x'); }
  else if (a.mag === 'fastmag') { K.rbox(.03, .016, .05, 0, mg.y - .1, mg.z + .02, M.orange, .004); K.rbox(.032, .03, .006, 0, mg.y - .05, mg.z + .03, M.metal, .002); }
  };
  if (view.magG) K.capture(magParts, view.magG); else magParts();
  if (view.pistol && a.stock === 'lightstock') { K.cyl(.005, .16, 0, by - .02, bk + .07, M.steel, 10); K.rbox(.036, .07, .012, 0, by - .04, bk + .15, M.rubber, .005); }
  if (view.pistol) return;
  const sy = view.boreY - .004;
  if (a.stock === "heavystock") { K.side([[bk - .14, sy + .03], [bk + .02, sy + .03], [bk + .03, sy + .02], [bk + .03, sy - .1], [bk + .01, sy - .11], [bk - .1, sy - .05], [bk - .14, sy - .03]], .05, M.acc, { r: .012 }); K.rbox(.052, .14, .02, 0, sy - .04, bk + .04, M.rubber, .006); }
  else if (a.stock === 'lightstock') { K.cyl(.006, .2, 0, sy + .016, bk - .07, M.steel, 10); K.cyl(.006, .22, 0, sy - .06, bk - .08, M.steel, 10); K.rbox(.04, .1, .014, 0, sy - .02, bk + .03, M.rubber, .005); }
  else if (a.stock === 'cheek') K.rbox(.04, .022, .13, 0, sy + .04, bk - .09, M.acc, .009);
}

export function addArms(THREE, view) { arms(THREE, view.K, view); }

// Move a group's origin to (x, y, z) without moving its parts, so it rotates about that point.
function pivot(grp, x, y, z) {
  const p = new grp.position.constructor(x, y, z);
  grp.children.forEach(c => c.position.sub(p)); grp.position.add(p);
}

// ---------- melee weapons ----------
// Built standing up along +y (handle at the bottom, blade or head on top), then tipped forward so the hand holds the handle
// like a pistol grip and the blade points ahead. Two-handed ones stand more upright with the left hand further up the handle.
function meleeModel(THREE, K0, M, w, o) {
  const st = w.model.style, two = !!w.two, inner = new THREE.Group(), K = kit(THREE, inner), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const blade = (pts, t = .004, mat = M.steel) => K.side(pts, t, mat, { r: .002, bevel: .0012 });
  if (st === 'knife') {
    K.cyl(.013, .1, 0, -.005, 0, M.acc, 16, 'y', .015); K.box(.034, .008, .03, 0, .05, 0, M.dark);
    blade([[.011, .054], [.012, .16], [0, .215], [-.013, .175], [-.012, .054]]);
    K.box(.0012, .1, .002, 0, .11, .011, M.dark); // spine line
  } else if (st === 'machete') {
    K.cyl(.014, .12, 0, -.01, 0, M.acc, 16, 'y', .016); K.box(.04, .008, .034, 0, .054, 0, M.dark);
    blade([[.015, .058], [.018, .3], [.006, .37], [-.024, .345], [-.03, .2], [-.018, .058]]);
  } else if (st === 'claws') {
    K.cyl(.014, .09, 0, -.005, 0, M.dark, 14, 'y'); K.rbox(.07, .018, .04, 0, .052, 0, M.acc, .006);
    for (const x of [-.022, 0, .022]) K.side([[.005, .06], [.005, .2], [-.008, .245], [-.006, .06]], .004, M.body, { x, r: .002, bevel: .001 });
  } else if (st === 'bat') {
    K.cyl(.015, .58, 0, .23, 0, M.body, 20, 'y', .036); K.sphere(.021, 0, -.065, 0, M.body);
    K.cyl(.0165, .13, 0, -.005, 0, M.acc, 16, 'y', .018);
  } else if (st === 'sledge') {
    K.cyl(.014, .56, 0, .22, 0, M.acc, 16, 'y'); K.cyl(.016, .1, 0, -.02, 0, M.rubber, 14, 'y');
    K.rbox(.07, .075, .17, 0, .52, 0, M.body, .008); K.cyl(.04, .012, 0, .52, .09, M.steel, 18, 'z'); K.cyl(.04, .012, 0, .52, -.09, M.steel, 18, 'z');
  } else if (st === 'katana') {
    K.cyl(.014, .22, 0, .04, 0, M.acc, 16, 'y'); for (let i = 0; i < 5; i++) K.torus(.0145, .002, 0, -.04 + i * .04, 0, M.dark, Math.PI * 2, 'y');
    K.cyl(.036, .008, 0, .155, 0, M.dark, 20, 'y'); K.cyl(.017, .02, 0, .17, 0, M.brass, 14, 'y');
    blade([[.009, .18], [.013, .55], [.008, .8], [-.004, .86], [-.011, .78], [-.01, .18]], .005);
  } else { // scythe
    K.cyl(.013, .95, 0, .41, 0, M.acc, 14, 'y'); K.cyl(.02, .03, 0, .87, 0, M.dark, 14, 'y');
    blade([[.01, .86], [-.06, .9], [-.22, .9], [-.42, .8], [-.26, .84], [-.08, .84], [.0, .82]], .006, M.body);
  }
  const grip = V(0, -.065, .07);
  inner.position.copy(grip); inner.rotation.set(two ? -.55 : -1.1, .12, two ? .2 : .1); inner.updateMatrix(); o.innerBase = inner.rotation.clone();
  o.group.add(inner); o.inner = inner;
  o.grip = grip.clone(); o.fore = V(0, st === 'katana' ? .1 : .14, 0).applyMatrix4(inner.matrix); o.mag = grip.clone();
  o.pistol = !two; o.oneHand = !two; o.melee = true;
  o.boreY = 0; o.muzzleZ = -.3; o.top = .02; o.back = .1; o.sightY = .03; o.rearZ = .05;
}
