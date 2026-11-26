// Gun attachments. mul multiplies a stat, add adds to it, set replaces it. wt is weight in kg (heavier = slower to move and aim).
const ALL = ['Pistol', 'SMG', 'Shotgun', 'Rifle', 'Marksman', 'Sniper', 'LMG', 'Special'];
const GUNS = ['Pistol', 'SMG', 'Shotgun', 'Rifle', 'Marksman', 'Sniper', 'LMG'];
const LONG = ['SMG', 'Shotgun', 'Rifle', 'Marksman', 'Sniper', 'LMG'];
export const SLOTS = ['optic', 'muzzle', 'barrel', 'under', 'mag', 'stock', 'grip', 'ammo'];
export const SLOT_NAMES = { optic: 'Optic', muzzle: 'Muzzle', barrel: 'Barrel', under: 'Underbarrel', mag: 'Magazine', stock: 'Stock', grip: 'Rear Grip', ammo: 'Ammo' };

export const ATTACH = [
  // optics
  { id: 'dot', slot: 'optic', name: 'Red Dot', price: 200, wt: .1, cats: ALL, set: { scope: 'dot', zoom: 52 }, mul: { adsSpeed: .98 } },
  { id: 'holo', slot: 'optic', name: 'Holographic', price: 300, wt: .2, cats: ALL, set: { scope: 'holo', zoom: 50 }, mul: { adsSpeed: .96, ads: .95 } },
  { id: 'acog', slot: 'optic', name: '3x Combat Scope', price: 500, wt: .4, cats: ['SMG', 'Rifle', 'Marksman', 'Sniper', 'LMG'], set: { scope: '3x', zoom: 24 }, mul: { adsSpeed: .82, ads: .85 } },
  { id: 'scope4', slot: 'optic', name: '4x Marksman Scope', price: 700, wt: .5, cats: ['Rifle', 'Marksman', 'Sniper', 'LMG'], set: { scope: '4x', zoom: 17 }, mul: { adsSpeed: .76, ads: .75 } },
  { id: 'scope8', slot: 'optic', name: '8x Sniper Scope', price: 900, wt: .7, cats: ['Marksman', 'Sniper'], set: { scope: '8x', zoom: 8.5 }, mul: { adsSpeed: .68, ads: .5 } },
  { id: 'scope12', slot: 'optic', name: '12x Long-Range Scope', price: 1200, wt: .9, cats: ['Sniper'], set: { scope: '12x', zoom: 5.5 }, mul: { adsSpeed: .6, ads: .4, sway: 1.15 } },
  // muzzle
  { id: 'suppressor', slot: 'muzzle', name: 'Suppressor', price: 600, wt: .35, cats: GUNS, set: { quiet: true, noFlash: true, hear: 14 }, mul: { recoilV: .92, range: .9, falloff: .9 } },
  { id: 'comp', slot: 'muzzle', name: 'Compensator', price: 400, wt: .15, cats: ['Pistol', 'SMG', 'Rifle', 'Marksman', 'LMG'], mul: { recoilV: .78, recoilH: 1.15, hip: 1.05 } },
  { id: 'brake', slot: 'muzzle', name: 'Muzzle Brake', price: 450, wt: .2, cats: ['Rifle', 'Marksman', 'Sniper', 'LMG'], set: { hear: 60 }, mul: { recoilV: .85, recoilH: .9, kick: .65 } },
  { id: 'flashhider', slot: 'muzzle', name: 'Flash Hider', price: 250, wt: .1, cats: ['Pistol', 'SMG', 'Rifle', 'Marksman', 'Sniper', 'LMG'], set: { noFlash: true }, mul: { recoilH: .8 } },
  { id: 'choke', slot: 'muzzle', name: 'Full Choke', price: 350, wt: .1, cats: ['Shotgun'], mul: { hip: .65, ads: .6, range: 1.35, falloff: 1.3 } },
  // barrel
  { id: 'longbarrel', slot: 'barrel', name: 'Long Barrel', price: 700, wt: .6, cats: LONG, mul: { range: 1.35, falloff: 1.3, ads: .85, recoilV: .95 } },
  { id: 'shortbarrel', slot: 'barrel', name: 'Short Barrel', price: 500, wt: -.3, cats: LONG, mul: { range: .78, falloff: .8, hip: .85, adsSpeed: 1.12, recoilV: 1.08 } },
  { id: 'match', slot: 'barrel', name: 'Match-Grade Barrel', price: 900, wt: .5, cats: ['Pistol', 'SMG', 'Rifle', 'Marksman', 'Sniper', 'LMG'], mul: { bloom: .55, ads: .75, hip: .95 } },
  // underbarrel
  { id: 'vgrip', slot: 'under', name: 'Vertical Grip', price: 350, wt: .2, cats: LONG, mul: { recoilV: .84, adsSpeed: .96 } },
  { id: 'agrip', slot: 'under', name: 'Angled Grip', price: 350, wt: .15, cats: LONG, mul: { adsSpeed: 1.18, recoilH: .85 } },
  { id: 'bipod', slot: 'under', name: 'Bipod', price: 450, wt: .5, cats: ['Rifle', 'Marksman', 'Sniper', 'LMG'], set: { bipod: true }, mul: { adsSpeed: .95 } },
  { id: 'laser', slot: 'under', name: 'Laser Sight', price: 300, wt: .1, cats: GUNS, set: { laser: true }, mul: { hip: .65 } },
  // magazine
  { id: 'extmag', slot: 'mag', name: 'Extended Mag', price: 500, wt: .35, cats: GUNS, mul: { mag: 1.5, reload: 1.1, emptyReload: 1.1 } },
  { id: 'drum', slot: 'mag', name: 'Drum Mag', price: 900, wt: .9, cats: ['SMG', 'Rifle', 'LMG', 'Shotgun'], mul: { mag: 2.2, reload: 1.35, emptyReload: 1.35, adsSpeed: .9 } },
  { id: 'fastmag', slot: 'mag', name: 'Fast Mag', price: 400, wt: .05, cats: GUNS, mul: { reload: .72, emptyReload: .72, shell: .72 } },
  // stock
  { id: 'heavystock', slot: 'stock', name: 'Heavy Stock', price: 400, wt: .5, cats: LONG, mul: { recoilV: .85, recoilH: .82, sway: .7 } },
  { id: 'lightstock', slot: 'stock', name: 'Skeleton Stock', price: 350, wt: -.3, cats: LONG, mul: { adsSpeed: 1.12, recoilV: 1.1 }, add: { mobility: .03 } },
  { id: 'nostock', slot: 'stock', name: 'No Stock', price: 200, wt: -.7, cats: ['SMG', 'Shotgun', 'Rifle'], mul: { adsSpeed: 1.25, recoilV: 1.28, recoilH: 1.2, hip: .9, sway: 1.3 } },
  { id: 'cheek', slot: 'stock', name: 'Cheek Riser', price: 300, wt: .1, cats: ['Rifle', 'Marksman', 'Sniper', 'LMG'], mul: { sway: .6, ads: .9 } },
  // ammo
  { id: 'fmj', slot: 'ammo', name: 'FMJ Rounds', price: 450, wt: 0, cats: GUNS, mul: { dmg: .95 }, add: { pierce: 1 } },
  { id: 'hollow', slot: 'ammo', name: 'Hollow Points', price: 400, wt: 0, cats: GUNS, mul: { dmg: 1.15, head: .88, range: .85 } },
  { id: 'matchammo', slot: 'ammo', name: 'Match Ammo', price: 500, wt: 0, cats: ['Pistol', 'SMG', 'Rifle', 'Marksman', 'Sniper', 'LMG'], mul: { bloom: .7, ads: .88, recoilV: .95 } },
  { id: 'ap', slot: 'ammo', name: 'Armour-Piercing', price: 550, wt: 0, cats: GUNS, set: { apHead: true }, mul: { dmg: .97 } },
  // ======== more attachments ========
  // optics
  { id: 'reflex', slot: 'optic', name: 'Mini Reflex', price: 150, wt: .05, cats: ALL, set: { scope: 'dot', zoom: 56 }, mul: { adsSpeed: 1.04 } },
  { id: 'prism', slot: 'optic', name: '2x Prism', price: 400, wt: .3, cats: ['SMG', 'Rifle', 'Marksman', 'LMG', 'Shotgun'], set: { scope: '3x', zoom: 34 }, mul: { adsSpeed: .9, ads: .9 } },
  { id: 'scope6', slot: 'optic', name: '6x Hunter Scope', price: 800, wt: .6, cats: ['Rifle', 'Marksman', 'Sniper'], set: { scope: '6x', zoom: 12 }, mul: { adsSpeed: .72, ads: .6 } },
  // muzzle
  { id: 'monolith', slot: 'muzzle', name: 'Monolith Suppressor', price: 900, wt: .55, cats: GUNS, set: { quiet: true, noFlash: true, hear: 10 }, mul: { recoilV: .84, adsSpeed: .9, range: 1.05, falloff: 1.05 } },
  { id: 'tankbrake', slot: 'muzzle', name: 'Tank Brake', price: 600, wt: .3, cats: ['Rifle', 'Marksman', 'Sniper', 'LMG', 'Shotgun'], set: { hear: 60 }, mul: { recoilV: .76, recoilH: .8, kick: .5, adsSpeed: .95 } },
  { id: 'duckbill', slot: 'muzzle', name: 'Duckbill Choke', price: 450, wt: .1, cats: ['Shotgun'], mul: { hip: .8, ads: .7, range: 1.15 } },
  { id: 'ported', slot: 'muzzle', name: 'Ported Compensator', price: 350, wt: .1, cats: ['Pistol', 'SMG'], mul: { recoilV: .7, kick: .7, recoilH: 1.05 } },
  // barrel
  { id: 'heavybarrel', slot: 'barrel', name: 'Heavy Barrel', price: 1000, wt: .8, cats: GUNS, mul: { dmg: 1.1, range: 1.2, falloff: 1.2, recoilV: .92, adsSpeed: .88 } },
  { id: 'fluted', slot: 'barrel', name: 'Fluted Barrel', price: 800, wt: -.25, cats: LONG, mul: { adsSpeed: 1.1, bloom: .85 }, add: { mobility: .02 } },
  { id: 'rapid', slot: 'barrel', name: 'Rapid-Fire Barrel', price: 1100, wt: .2, cats: ['SMG', 'Rifle', 'LMG', 'Pistol'], mul: { rpm: 1.15, recoilV: 1.1, bloom: 1.2 } },
  { id: 'snub', slot: 'barrel', name: 'Snub Barrel', price: 300, wt: -.2, cats: ['Pistol'], mul: { range: .8, hip: .75, adsSpeed: 1.15, draw: .7 } },
  // underbarrel
  { id: 'stubby', slot: 'under', name: 'Stubby Grip', price: 300, wt: .1, cats: LONG, mul: { hip: .82, recoilV: .93 } },
  { id: 'handstop', slot: 'under', name: 'Handstop', price: 300, wt: .05, cats: LONG, mul: { recoilH: .78, adsSpeed: 1.06 } },
  { id: 'flashlight', slot: 'under', name: 'Tac Light', price: 250, wt: .1, cats: GUNS, set: { torch: true }, mul: { hip: .88 } },
  // magazine
  { id: 'jungle', slot: 'mag', name: 'Jungle Mags', price: 750, wt: .5, cats: ['SMG', 'Rifle', 'Marksman', 'LMG'], mul: { mag: 1.25, reload: .62, emptyReload: .62 } },
  { id: 'speedloader', slot: 'mag', name: 'Speed Loader', price: 450, wt: 0, cats: ['Pistol', 'Shotgun', 'Sniper', 'Marksman'], mul: { reload: .6, emptyReload: .6, shell: .55 } },
  { id: 'bigmag', slot: 'mag', name: 'Banana Mag', price: 650, wt: .5, cats: GUNS, mul: { mag: 1.8, reload: 1.2, emptyReload: 1.2, adsSpeed: .94 } },
  // stock
  { id: 'tacstock', slot: 'stock', name: 'Tactical Stock', price: 450, wt: .15, cats: LONG, mul: { recoilV: .92, adsSpeed: 1.05 } },
  { id: 'recoilpad', slot: 'stock', name: 'Recoil Pad', price: 350, wt: .1, cats: LONG, mul: { kick: .45, recoilV: .93 } },
  { id: 'brace', slot: 'stock', name: 'Pistol Brace', price: 400, wt: .25, cats: ['Pistol'], mul: { recoilV: .75, recoilH: .75, sway: .7, adsSpeed: .95 } },
  // rear grip
  { id: 'griptape', slot: 'grip', name: 'Grip Tape', price: 200, wt: 0, cats: GUNS, mul: { adsSpeed: 1.06, recoilH: .92 } },
  { id: 'rubbergrip', slot: 'grip', name: 'Rubber Grip', price: 250, wt: .05, cats: GUNS, mul: { recoilV: .94, draw: .85 } },
  { id: 'quickgrip', slot: 'grip', name: 'Quickdraw Grip', price: 300, wt: -.05, cats: GUNS, mul: { draw: .6, adsSpeed: 1.1, recoilV: 1.05 } },
  // special ammo: each one gives the gun a built-in mutation
  { id: 'incendiary', slot: 'ammo', name: 'Dragonfire Rounds', price: 1200, wt: 0, cats: GUNS, mut: 'incendiary', mul: { dmg: .92 } },
  { id: 'cryoammo', slot: 'ammo', name: 'Cryo Rounds', price: 1000, wt: 0, cats: GUNS, mut: 'cryo', mul: { dmg: .95 } },
  { id: 'shockammo', slot: 'ammo', name: 'Shock Rounds', price: 1300, wt: 0, cats: GUNS, mut: 'arc', mul: { dmg: .9 } },
  { id: 'explosive', slot: 'ammo', name: 'Explosive Tips', price: 1600, wt: 0, cats: GUNS, mut: 'volatile', mul: { dmg: .9, range: .9 } },
  { id: 'ricoammo', slot: 'ammo', name: 'Bouncy Rounds', price: 1100, wt: 0, cats: GUNS, mut: 'ricochet', mul: { dmg: .95 } },
  { id: 'vampammo', slot: 'ammo', name: 'Leech Rounds', price: 1400, wt: 0, cats: GUNS, mut: 'vampire', mul: { dmg: .93 } },
];
export const attById = id => ATTACH.find(a => a.id === id);

const BASE_WT = { Pistol: 1.1, SMG: 2.6, Shotgun: 3.4, Rifle: 3.6, Marksman: 4.3, Sniper: 5.8, LMG: 8, Special: 6, Secret: 5, Admin: 2, Melee: .6 };
export function compatible(a, base) {
  if (!a.cats.includes(base.attCat || base.cat)) return false; // attCat: secret guns take the attachments of the type they are
  if (base.id === 'goliath') return a.slot === 'ammo' || ['dot', 'holo'].includes(a.id);
  if (base.id === 'boomtube') return ['dot', 'holo'].includes(a.id);
  if (base.id === 'rail' || base.id === 'arclance') return a.slot === 'optic';
  if (base.projectile) return ['dot', 'holo', 'reflex'].includes(a.id) || a.slot === 'grip';
  if (a.id === 'brace' && base.model.kind !== 'pistol') return false;
  if ((a.id === 'snub' || a.id === 'ported') && base.slot === 'primary' && base.cat === 'Pistol') return false;
  if (a.mut && base.innate?.includes(a.mut)) return false;
  if ((base.id === 'twin' || base.id === 'sawnoff') && a.slot === 'mag' && a.id !== 'speedloader') return false;
  if (a.id === 'drum' && base.shell) return false;
  if (a.id === 'nostock' && base.model.kind === 'bullpup') return false;
  return true;
}
export function slotsFor(base) { return SLOTS.filter(s => ATTACH.some(a => a.slot === s && compatible(a, base))); }

export function computeWeapon(base, att = {}) {
  const w = { sway: 1, hear: 40, ...base, att: { ...att }, attMuts: [], wt: base.id === 'goliath' ? 15 : base.id === 'leviathan' ? 14 : BASE_WT[base.cat] };
  let extra = 0;
  for (const s of SLOTS) {
    const a = attById(att[s]); if (!a) continue;
    if (a.set) Object.assign(w, a.set);
    if (a.mul) for (const k in a.mul) w[k] = (w[k] || 0) * a.mul[k];
    if (a.add) for (const k in a.add) w[k] = (w[k] || 0) + a.add[k];
    extra += a.wt; if (a.mut) w.attMuts.push(a.mut);
  }
  w.mag = Math.max(1, Math.round(w.mag));
  w.wt = Math.round((w.wt + extra) * 100) / 100;
  w.mobility = Math.max(.5, Math.min(1.15, w.mobility - extra * .025));
  w.adsSpeed *= 1 - extra * .04;
  w.falloff = Math.max(w.falloff, w.range + 5);
  return w;
}

// Plain-language effect list for the gunsmith. good = helps the player.
const LABEL = { recoilV: ['Vertical recoil', -1], recoilH: ['Sideways recoil', -1], hip: ['Hip-fire spread', -1], ads: ['Aimed spread', -1], bloom: ['Shot-to-shot bloom', -1],
  range: ['Effective range', 1], adsSpeed: ['Aim speed', 1], rpm: ['Fire rate', 1], draw: ['Draw time', -1], reload: ['Reload time', -1], mag: ['Magazine size', 1], sway: ['Scope sway', -1],
  dmg: ['Damage', 1], head: ['Headshot bonus', 1], kick: ['Visual kick', -1], shell: null, emptyReload: null, falloff: null };
export function describe(a) {
  const out = [];
  if (a.set?.scope) out.push({ t: a.set.scope === 'dot' || a.set.scope === 'holo' ? 'Clean sight picture' : `${a.set.scope} magnification`, g: 1 });
  for (const k in a.mul || {}) { const l = LABEL[k]; if (!l) continue; const p = Math.round((a.mul[k] - 1) * 100); if (!p) continue; out.push({ t: `${l[0]} ${p > 0 ? '+' : '−'}${Math.abs(p)}%`, g: Math.sign(p) === l[1] }); }
  if (a.add?.mobility) out.push({ t: `Move speed +${Math.round(a.add.mobility * 100)}%`, g: true });
  if (a.add?.pierce) out.push({ t: 'Bullets pass through +1 bot', g: true });
  if (a.set?.quiet) out.push({ t: `Silenced: bots hear shots from ${a.set.hear ?? 14}m, not 40m`, g: true });
  else if (a.set?.noFlash) out.push({ t: 'No muzzle flash', g: true });
  if (a.set?.hear > 40) out.push({ t: `Louder: bots hear shots from ${a.set.hear}m`, g: false });
  if (a.set?.bipod) out.push({ t: 'Halves recoil while crouched', g: true });
  if (a.set?.laser) out.push({ t: 'Visible laser for hip-fire', g: true });
  if (a.set?.apHead) out.push({ t: 'Ignores Heavy helmets', g: true });
  if (a.set?.torch) out.push({ t: 'Bright light on your gun', g: true });
  if (a.mut) out.push({ t: `Built-in mutation: ${({ incendiary: 'sets bots on fire', cryo: 'slows bots', arc: 'hits zap nearby bots', volatile: 'kills explode', ricochet: 'wall hits bounce into bots', vampire: 'kills heal you' })[a.mut]}`, g: true });
  if (a.wt) out.push({ t: `${a.wt > 0 ? '+' : '−'}${Math.abs(a.wt)} kg weight`, g: a.wt < 0 });
  return out;
}

// Adds 3D parts to the first-person gun model, placed using the model's anchor points.
export function decorateGun(THREE, view, w) {
  const g = view.group, a = w.att || {}, mz = view.muzzleZ, by = view.boreY ?? .02, f = view.fore, mg = view.mag, bk = view.back;
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .5, metalness: .25 });
  const ink = mat(0x2b2d42), tan = mat(0xcfb58a), brass = mat(0xd4a73a), metal = new THREE.MeshStandardMaterial({ color: 0x3a3c50, roughness: .3, metalness: .8 });
  const box = (sx, sy, sz, x, y, z, m, rx = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.rotation.x = rx; g.add(b); return b; };
  const cyl = (r, len, x, y, z, m, seg = 16) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); g.add(c); return c; };
  if (a.barrel === 'longbarrel') { cyl(.016, .12, 0, by, mz - .06, metal); view.muzzleZ -= .12; }
  else if (a.barrel === 'match') { cyl(.019, .06, 0, by, mz + .03, brass); }
  const m0 = view.muzzleZ;
  if (a.muzzle === 'suppressor') { cyl(.028, .2, 0, by, m0 - .1, ink, 20); cyl(.03, .02, 0, by, m0 - .19, metal, 20); view.muzzleZ = m0 - .2; }
  else if (a.muzzle === 'comp' || a.muzzle === 'brake') { box(.045, .04, .07, 0, by, m0 - .035, a.muzzle === 'brake' ? tan : ink); for (let i = 0; i < 3; i++) box(.047, .006, .008, 0, by + .02, m0 - .015 - i * .02, metal); view.muzzleZ = m0 - .07; }
  else if (a.muzzle === 'flashhider') { cyl(.022, .07, 0, by, m0 - .035, ink, 6); view.muzzleZ = m0 - .07; }
  else if (a.muzzle === 'choke') { cyl(.026, .05, 0, by, m0 - .025, brass); view.muzzleZ = m0 - .05; }
  if (a.under === 'vgrip') { box(.03, .1, .035, 0, f.y - .06, f.z - .03, ink); view.fore = f.clone().add(new THREE.Vector3(0, -.07, -.03)); }
  else if (a.under === 'agrip') { box(.03, .05, .09, 0, f.y - .035, f.z - .02, ink, .6); view.fore = f.clone().add(new THREE.Vector3(0, -.04, -.02)); }
  else if (a.under === 'bipod') { box(.03, .03, .03, 0, f.y - .01, f.z - .12, metal); box(.01, .01, .18, -.018, f.y - .025, f.z - .03, ink); box(.01, .01, .18, .018, f.y - .025, f.z - .03, ink); }
  else if (a.under === 'laser') {
    box(.026, .026, .07, .042, f.y + .02, f.z - .05, ink);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.042, f.y + .02, f.z - .085), new THREE.Vector3(.042, f.y + .02, f.z - 2.5)]), new THREE.LineBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: .5 }));
    line.frustumCulled = false; g.add(line); view.laser = line;
  }
  if (a.mag === 'extmag') box(.034, .09, .05, mg.x, mg.y - .1, mg.z + .01, ink, .15);
  else if (a.mag === 'drum') { const d = cyl(.07, .06, mg.x, mg.y - .04, mg.z, ink, 20); d.rotation.set(0, 0, Math.PI / 2); }
  else if (a.mag === 'fastmag') { box(.04, .025, .06, mg.x, mg.y - .07, mg.z, mat(0xe07a5f)); box(.042, .008, .03, mg.x, mg.y - .02, mg.z + .03, metal); }
  if (view.pistol) return;
  if (a.stock === 'heavystock') { box(.06, .1, .2, 0, -.02, bk - .08, tan); box(.064, .11, .02, 0, -.022, bk + .02, ink); }
  else if (a.stock === 'lightstock') { box(.014, .014, .24, 0, .02, bk - .1, metal); box(.014, .014, .24, 0, -.05, bk - .1, metal); box(.03, .09, .015, 0, -.015, bk + .02, ink); }
  else if (a.stock === 'cheek') box(.044, .024, .14, 0, .05, bk - .1, mat(0x81b29a));
}

// ---------- laser upgrades ----------
// Once a Laser Sight is fitted you can buy new beam colours and range levels for that gun (they stay with it for the run).
// range = how far the dot reaches, beam = how long the visible beam is, hip = hip-fire spread multiplier.
export const LASER_COLS = [
  { id: 'red', name: 'Red', col: 0xff2a2a, price: 0 },
  { id: 'green', name: 'Green', col: 0x3dff6a, price: 300 },
  { id: 'blue', name: 'Blue', col: 0x3d8bff, price: 300 },
  { id: 'pink', name: 'Pink', col: 0xff5fd2, price: 400 },
  { id: 'gold', name: 'Gold', col: 0xffc83d, price: 600 },
  { id: 'violet', name: 'Violet', col: 0xa25bff, price: 600 },
  { id: 'white', name: 'White', col: 0xf4f6ff, price: 800 },
  { id: 'rainbow', name: 'Rainbow', col: 0xff2a2a, price: 1500, rainbow: true },
];
export const LASER_LV = [
  { name: 'Stock', range: 30, beam: 2.5, hip: 1, price: 0 },
  { name: 'Focused', range: 60, beam: 7, hip: .93, price: 600 },
  { name: 'Long-range', range: 100, beam: 16, hip: .86, price: 1300 },
  { name: 'Military', range: 160, beam: 40, hip: .78, price: 2500 },
];
export const laserCol = id => LASER_COLS.find(c => c.id === id) || LASER_COLS[0];
