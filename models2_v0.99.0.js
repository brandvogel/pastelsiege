// Handguns and special weapons, built from the parts kit.
import { frontPost, rearSight, redDot, holo } from './gunkit_v0.99.0.js';
const V = (THREE, x, y, z) => new THREE.Vector3(x, y, z);

export function pistol(THREE, K, M, w, o) {
  const m = w.model, big = !!m.big, back = .1, L = big ? .23 : .19, front = back - L, sh = big ? .05 : .042, sw = big ? .032 : .027;
  const sy0 = .006, top = sy0 + sh;
  // slide with rounded nose, cocking serrations and ejection port
  o.slide = K.capture(() => {
  K.side([[back, sy0], [front + .004, sy0], [front, sy0 + .01], [front, top - .006], [front + .01, top], [back - .006, top], [back, top - .008]], sw, M.body, { r: .003 });
  for (let i = 0; i < 7; i++) [-1, 1].forEach(s => K.box(.001, sh * .7, .0028, s * (sw / 2 + .0002), sy0 + sh * .5, back - .012 - i * .0062, M.dark));
  for (let i = 0; i < 4; i++) [-1, 1].forEach(s => K.box(.001, sh * .55, .0025, s * (sw / 2 + .0002), sy0 + sh * .5, front + .02 + i * .006, M.dark));
  K.rbox(.002, sh * .45, .04, sw / 2 + .0005, sy0 + sh * .62, back - L * .42, M.dark, .002);
  K.rbox(.012, .012, .03, .009, sy0 + sh * .62, back - L * .42, M.steel, .002);      // barrel hood visible through port
  K.lathe([[.0055, front - .001], [.0085, front + .001], [.0085, front + .01]], M.steel, 0, sy0 + sh * .45, 18);
  if (big) K.rail(front + .03, back - .05, top - .002, M.dark, 0, .018);
  });
  // frame: dust cover with accessory rail, trigger guard, beaver tail
  const fy = sy0 + .002;
  K.side([[back + .006, fy], [front + .01, fy], [front + .01, fy - .016], [front + .06, fy - .018], [back - .055, fy - .016], [back - .02, fy - .02], [back + .01, fy - .01]], sw - .002, M.poly, { r: .004 });
  K.rail(front + .014, front + .06, fy - .016, M.poly, 0, .018, -1);
  K.side([[back - .1, fy - .014], [back - .052, fy - .014], [back - .055, fy - .04], [back - .075, fy - .046], [back - .1, fy - .042], [back - .106, fy - .03]], .012, M.poly, { holes: [K.hole([[back - .097, fy - .019], [back - .061, fy - .019], [back - .063, fy - .036], [back - .077, fy - .04], [back - .095, fy - .037]], .005)], r: .006 });
  K.side([[back - .074, fy - .014], [back - .068, fy - .014], [back - .07, fy - .03], [back - .078, fy - .036], [back - .077, fy - .028]], .005, M.steel, { r: .002 });
  // grip with texture panel and magazine base
  const gp = [[back + .008, fy - .006], [back - .052, fy - .012], [back - .06, fy - .04], [back - .07, fy - .11], [back - .064, fy - .118], [back - .012, fy - .118], [back - .004, fy - .11], [back + .012, fy - .03]];
  K.side(gp, sw + .002, M.poly, { r: .008 });
  [-1, 1].forEach(s => K.side([[back - .006, fy - .03], [back - .05, fy - .03], [back - .058, fy - .1], [back - .012, fy - .1]], .002, M.acc, { x: s * (sw / 2 + .0015), r: .006, bevel: 0 }));
  o.magG = K.capture(() => {
  K.rbox(sw + .004, .008, .05, 0, fy - .121, back - .038, M.dark, .003);
  if (m.ext) { K.rbox(.024, .07, .036, 0, fy - .16, back - .042, M.dark, .004); K.rbox(.028, .008, .04, 0, fy - .196, back - .042, M.acc); }
  });
  if (big) K.side([[back + .004, top - .012], [back + .016, top - .004], [back + .018, top - .016], [back + .004, top - .026]], .01, M.steel, { r: .003 }); // hammer
  K.pin(0, fy - .008, back - .03, .0022, M.steel, sw + .004); K.pin(0, fy - .008, front + .05, .0022, M.steel, sw + .004);
  o.boreY = sy0 + sh * .45; o.muzzleZ = front - .002; o.top = top; o.back = back;
  o.grip = V(THREE, 0, fy - .065, back - .03); o.fore = o.grip.clone(); o.mag = V(THREE, 0, fy - .12, back - .04); o.pistol = true;
  o.port = V(THREE, sw / 2 + .002, sy0 + sh * .62, back - L * .42);
  K.capture(() => {
  if (w.scope === 'dot' || w.scope === 'holo') { const r = redDot(K, M, back - .05, top - .006); o.sightY = r.sightY; o.rearZ = r.rearZ; }
  else { o.sightY = top + .0065; rearSight(K, M, THREE, back - .01, top - .001, o.sightY, 'pistol'); frontPost(K, M, front + .012, top - .001, o.sightY, 'pistol'); o.rearZ = back - .006; }
  }, o.slide);
}

export function revolver(THREE, K, M, w, o) {
  const back = .1, fy = 0, B = .15, cz = back - .07, front = back - .12;
  K.side([[back + .004, fy - .012], [back - .03, fy - .014], [front, fy - .012], [front, fy + .03], [cz - .03, fy + .04], [back - .015, fy + .04], [back + .006, fy + .028]], .026, M.steel, { r: .005 });
  o.cyl = K.capture(() => {
  K.lathe([[.026, cz - .028], [.031, cz - .024], [.031, cz + .024], [.026, cz + .028]], M.steel, 0, fy + .012, 24);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; K.rbox(.006, .006, .04, Math.cos(a) * .029, fy + .012 + Math.sin(a) * .029, cz, M.dark, .002); }
  });
  o.cyl.children.forEach(c => c.position.y -= fy + .012); o.cyl.position.y = fy + .012;
  // barrel with full-length underlug and vent rib
  K.cyl(.011, B, 0, fy + .02, front - B / 2, M.steel, 20); K.side([[front, fy + .006], [front - B, fy + .006], [front - B, fy + .012], [front, fy + .012]], .016, M.steel, { r: .003 });
  K.side([[front, fy + .03], [front - B, fy + .03], [front - B, fy + .036], [front, fy + .036]], .008, M.steel, { r: .002 });
  K.lathe([[.006, front - B - .001], [.0105, front - B + .002]], M.dark, 0, fy + .02, 16);
  K.side([[back + .004, fy + .034], [back + .022, fy + .046], [back + .026, fy + .036], [back + .01, fy + .024]], .01, M.dark, { r: .003 }); // hammer
  K.side([[back - .06, fy - .012], [back - .03, fy - .012], [back - .03, fy - .034], [back - .05, fy - .042], [back - .062, fy - .032]], .01, M.steel, { holes: [K.hole([[back - .057, fy - .016], [back - .035, fy - .016], [back - .036, fy - .03], [back - .05, fy - .036], [back - .057, fy - .029]], .004)], r: .006 });
  K.side([[back + .006, fy - .008], [back - .03, fy - .014], [back - .04, fy - .05], [back - .036, fy - .1], [back - .026, fy - .108], [back + .022, fy - .104], [back + .028, fy - .09], [back + .014, fy - .03]], .032, M.wood, { r: .01 });
  K.pin(.0165, fy - .05, back - .004, .004, M.brass, .002); K.pin(-.0165, fy - .05, back - .004, .004, M.brass, .002);
  o.boreY = fy + .02; o.muzzleZ = front - B; o.top = fy + .04; o.back = back;
  o.grip = V(THREE, 0, fy - .06, back - .006); o.fore = o.grip.clone(); o.mag = V(THREE, 0, fy, cz); o.pistol = true;
  if (w.scope === 'dot' || w.scope === 'holo') { K.rail(cz - .02, back - .01, fy + .04, M.dark, 0, .018); const r = redDot(K, M, cz + .01, fy + .046); o.sightY = r.sightY; o.rearZ = r.rearZ; }
  else { o.sightY = fy + .051; rearSight(K, M, THREE, back - .012, fy + .04, o.sightY, 'notch'); K.side([[front - B + .004, fy + .036], [front - B + .02, fy + .036], [front - B + .012, o.sightY]], .004, M.orange, { r: .001, bevel: 0 }); o.rearZ = back - .01; }
}

export function minigun(THREE, K, M, w, o) {
  K.rbox(.13, .13, .3, 0, 0, 0, M.body, .02); K.rbox(.08, .06, .17, 0, .095, .02, M.acc, .01);
  K.side([[-.08, .1], [.04, .1], [.04, .16], [.02, .17], [-.06, .17], [-.08, .16]], .012, M.dark, { holes: [K.hole([[-.065, .11], [.025, .11], [.025, .155], [-.065, .155]], .006)], r: .006 });
  K.side([[.08, -.06], [.11, -.06], [.13, -.17], [.1, -.18], [.08, -.12]], .036, M.rubber, { r: .01 });
  K.side([[-.1, -.06], [-.07, -.06], [-.08, -.14], [-.11, -.14]], .032, M.rubber, { r: .008 });
  const sp = new THREE.Group(); sp.position.z = -.15;
  const ring = r => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .022, 24), M.dark); m.geometry.rotateX(Math.PI / 2); return m; };
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .56, 12), M.steel); c.geometry.rotateX(Math.PI / 2); c.position.set(Math.cos(a) * .04, Math.sin(a) * .04, -.28); sp.add(c); }
  [-.1, -.32, -.54].forEach(z => { const r = ring(.058); r.position.z = z; sp.add(r); });
  K.add(new THREE.CylinderGeometry(.03, .03, .58, 16).rotateX(Math.PI / 2), M.dark, 0, 0, -.43);
  o.group.add(sp); o.spinner = sp;
  for (let i = 0; i < 8; i++) K.rbox(.026, .018, .012, .07 + i * .006, -.05 - i * .022, .04, M.brass, .003);
  o.muzzleZ = -.72; o.boreY = 0; o.top = .17; o.back = .15; o.sightY = .19; o.rearZ = .1;
  o.grip = V(THREE, 0, -.12, .1); o.fore = V(THREE, 0, -.1, -.09); o.mag = V(THREE, .1, -.1, .05);
  o.group.position.y = -.04;
  if (w.scope === 'dot' || w.scope === 'holo') { K.rail(-.04, .08, .065, M.dark); const r = (w.scope === 'dot' ? redDot : (a, b, c, d) => holo(a, b, THREE, c, d))(K, M, .02, .072); o.sightY = r.sightY; o.rearZ = r.rearZ; }
}

export function launcher(THREE, K, M, w, o) {
  const back = .1;
  K.lathe([[.045, -.5], [.052, -.49], [.052, -.36], [.048, -.35], [.048, -.12], [.052, -.11], [.052, -.05], [.045, -.04]], M.acc, 0, .02, 28);
  K.cyl(.04, .002, 0, .02, -.499, M.rubber, 24);
  const drum = K.lathe([[.06, -.06], [.07, -.05], [.07, .06], [.06, .07]], M.dark, 0, -.015, 6); drum.rotation.z = Math.PI / 6;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; K.cyl(.017, .002, Math.cos(a) * .045, -.015 + Math.sin(a) * .045, .071, M.brass, 14); }
  K.side([[.07, -.06], [back + .02, -.06], [back + .03, -.03], [back + .2, -.02], [back + .2, -.1], [back + .17, -.11], [back + .02, -.09], [.07, -.08]], .04, M.poly, { r: .008 });
  K.side([[back - .02, -.08], [back - .05, -.08], [back - .06, -.17], [back - .03, -.18], [back - .01, -.16]], .032, M.poly, { r: .008 });
  K.side([[-.2, -.04], [-.23, -.04], [-.24, -.13], [-.21, -.135], [-.2, -.1]], .03, M.poly, { r: .008 });
  K.rail(-.3, -.08, .072, M.dark);
  K.side([[-.42, .07], [-.38, .07], [-.38, .1], [-.42, .09]], .004, M.dark, { r: .002 });   // ladder sight leaf
  o.muzzleZ = -.5; o.boreY = .02; o.top = .072; o.back = back + .2;
  o.grip = V(THREE, 0, -.12, back - .035); o.fore = V(THREE, 0, -.08, -.215); o.mag = V(THREE, 0, -.05, 0);
  if (w.scope === 'dot' || w.scope === 'holo') { const r = (w.scope === 'dot' ? redDot : (a, b, c, d) => holo(a, b, THREE, c, d))(K, M, -.14, .072); o.sightY = r.sightY; o.rearZ = r.rearZ; }
  else { o.sightY = .1; rearSight(K, M, THREE, -.08, .072, o.sightY, 'aperture'); frontPost(K, M, -.44, .072, o.sightY, 'ar'); o.rearZ = -.076; }
}

export function railgun(THREE, K, M, w, o) {
  const back = .1, L = .62, front = back - L;
  K.side([[back, -.04], [front + .1, -.04], [front, -.02], [front, .045], [front + .14, .06], [back - .02, .06], [back, .04]], .07, M.body, { r: .012 });
  [-1, 1].forEach(s => { K.rbox(.012, .02, .5, s * .035, .0, front - .15, M.metal, .004); K.rbox(.004, .008, .45, s * .042, .0, front - .14, M.glow, .002); });
  for (let i = 0; i < 6; i++) K.torus(.042, .006, 0, 0, front - .03 - i * .07, M.glow);
  K.cyl(.006, .55, 0, 0, front - .15, M.glow, 10);
  [-1, 1].forEach(s => K.side([[back - .1, .0], [back - .34, .0], [back - .34, .03], [back - .1, .03]], .004, M.glow, { x: s * .036, r: .004, bevel: 0 }));
  K.side([[back - .05, -.04], [back - .08, -.04], [back - .1, -.14], [back - .07, -.15], [back - .04, -.12]], .036, M.poly, { r: .008 });
  K.side([[back, .03], [back + .22, .02], [back + .24, .0], [back + .24, -.09], [back + .2, -.1], [back + .05, -.05], [back, -.04]], .045, M.body, { holes: [K.hole([[back + .05, -.005], [back + .17, -.005], [back + .17, -.05], [back + .07, -.045]], .012)], r: .012 });
  K.rbox(.05, .09, .016, 0, -.035, back + .245, M.rubber, .006);
  K.rbox(.04, .06, .1, 0, -.07, back - .25, M.glow, .006);
  K.rail(front + .14, back - .04, .06, M.dark);
  o.muzzleZ = front - .3; o.boreY = 0; o.top = .06; o.back = back + .25;
  o.grip = V(THREE, 0, -.09, back - .075); o.fore = V(THREE, 0, -.045, front + .12); o.mag = V(THREE, 0, -.07, back - .25);
  o.sightY = .09; o.rearZ = back - .04;
}

export function doubleBarrel(THREE, K, M, w, o) {
  // the Sawn-Off is the same gun cut down: short barrels, short forend, a pistol grip instead of a stock
  const short = w.id === 'sawnoff', back = .1, B = short ? .24 : .5, front = back - .2, FL = short ? .13 : .2;
  [-1, 1].forEach(s => K.lathe([[.0155, front], [.0165, front - .01], [.015, front - B + .02], [.0158, front - B]], M.steel, s * .0175, .012, 24));
  K.side([[front, .03], [front - B, .03], [front - B, .034], [front, .034]], .012, M.steel, { r: .002 });
  K.side([[back, -.03], [front, -.03], [front, .028], [back - .02, .03], [back, .02]], .048, M.steel, { r: .006 });
  [-1, 1].forEach(s => { K.side([[back - .03, -.02], [front + .03, -.02], [front + .03, .015], [back - .03, .015]], .001, M.brass, { x: s * .0245, r: .006, bevel: 0 }); });
  K.side([[front - .02, -.015], [front - FL, -.01], [front - FL - .02, .0], [front - FL, -.035], [front - .02, -.04]], .05, M.wood, { r: .01 });
  K.side([[back + .004, .028], [back + .03, .04], [back + .035, .032], [back + .012, .02]], .01, M.steel, { r: .003 });
  if (short) {
    K.side([[back, .02], [back + .05, .0], [back + .08, -.03], [back + .07, -.12], [back + .035, -.125], [back + .02, -.06], [back, -.03]], .04, M.wood, { r: .012 });
    K.lathe([[.008, front - B - .002], [.017, front - B + .004]], M.dark, -.0175, .012, 16); K.lathe([[.008, front - B - .002], [.017, front - B + .004]], M.dark, .0175, .012, 16);
  } else {
    K.side([[back, .02], [back + .08, -.01], [back + .3, .02], [back + .32, .01], [back + .32, -.1], [back + .28, -.11], [back + .1, -.06], [back + .03, -.07], [back, -.03]], .044, M.wood, { r: .012 });
    K.rbox(.046, .11, .018, 0, -.045, back + .325, M.rubber, .006);
  }
  K.side([[back - .01, -.03], [back - .07, -.03], [back - .07, -.05], [back - .03, -.06]], .01, M.steel, { holes: [K.hole([[back - .02, -.034], [back - .064, -.034], [back - .064, -.046], [back - .032, -.052]], .003)], r: .004 });
  o.muzzleZ = front - B; o.boreY = .012; o.top = .034; o.back = back + (short ? .08 : .33);
  o.grip = short ? V(THREE, 0, -.07, back + .045) : V(THREE, 0, -.06, back + .06); o.fore = V(THREE, 0, -.04, front - FL * .55); o.mag = V(THREE, 0, -.03, back - .05);
  o.sightY = .034 + .007; K.sphere(.0035, 0, .0375, front - B + .006, M.brass); o.rearZ = back;
}
