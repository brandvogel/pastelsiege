// Things you can buy that fight for you: orbiting sentry drones, a medic drone, deployable turrets and one-shot strike drones.
import { THREE, scene, camera, world, lineOfSight, groundAt, insideSolid, rand, tracer, sparks, flashLight, SND } from './world_v0.98.0.js';
import { at3 } from './audio_v0.98.0.js';
import { bots } from './bots_v0.98.0.js';
const V3 = THREE.Vector3;

// Every support item has levels. Level 1 is cheap and weak; each upgrade costs more and does more.
// Drones (medic, sentry) stay for the whole run. Turrets, strike drones and scans are charges you use up;
// upgrading them makes every charge stronger.
const r1 = x => (Math.round(x * 10) / 10).toString();
export const SUPPORT = [
  // (Medic Drone, Sentry Drone, Auto-Turret and Strike Drone were removed in v0.46.0; old saves just ignore them)
  { id: 'scan', name: 'Recon Scan', icon: '◎', key: 'K', price: 700, charge: 500, stock: 2, up: [900, 1600, 2600, 4000],
    dur: [6, 10, 15, 22, 30],
    desc: 'Press K to ping every bot on your minimap and through walls.',
    fx: (s, l) => `${s.dur[l - 1]} s of wallhack` },
];
export const supById = id => SUPPORT.find(s => s.id === id);
export const supMax = s => s.up.length + 1;
// what pressing the main button on a card costs right now (null when maxed)
export const supNextPrice = (s, l) => l === 0 ? s.price : l < supMax(s) ? s.up[l - 1] : null;
// ctx: set by the game. damage(bot, dmg, point, dir, name), explode(p, r, dmg, o), player, heal(n)
export const hctx = { damage: () => {}, explode: () => {}, player: null, heal: () => {} };
export const support = { drones: [], turrets: [], strikers: [], stock: {}, lv: {}, scanT: 0 };
const mat = (c, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .45, metalness: .3, ...x });

function droneMesh(kind) {
  const g = new THREE.Group(), body = mat(kind === 'medic' ? 0xfffaf0 : 0x81b29a), dark = mat(0x2b2d42, { metalness: .6 });
  const light = new THREE.MeshBasicMaterial({ color: kind === 'medic' ? 0x7dff8a : 0x4fd1c5 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), body); core.scale.y = .7; g.add(core);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), light); eye.position.z = -.14; g.add(eye);
  const rotors = [];
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4, arm = new THREE.Mesh(new THREE.BoxGeometry(.26, .025, .03), dark);
    arm.position.set(Math.cos(a) * .17, .02, Math.sin(a) * .17); arm.rotation.y = -a; g.add(arm);
    const duct = new THREE.Mesh(new THREE.TorusGeometry(.08, .014, 6, 18), dark); duct.rotation.x = Math.PI / 2; duct.position.set(Math.cos(a) * .3, .03, Math.sin(a) * .3); g.add(duct);
    const r = new THREE.Mesh(new THREE.BoxGeometry(.14, .004, .02), new THREE.MeshBasicMaterial({ color: 0xfffaf0, transparent: true, opacity: .7 })); r.position.copy(duct.position); g.add(r); rotors.push(r);
  }
  if (kind === 'medic') { const red = new THREE.MeshBasicMaterial({ color: 0xd6453d }); const a = new THREE.Mesh(new THREE.BoxGeometry(.12, .02, .04), red), b = new THREE.Mesh(new THREE.BoxGeometry(.04, .02, .12), red); a.position.y = b.position.y = .12; g.add(a, b); }
  else { const gun = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .2), dark); gun.position.set(0, -.1, -.08); g.add(gun); }
  g.userData.rotors = rotors; g.userData.light = light;
  return g;
}
function turretMesh() {
  const g = new THREE.Group(), dark = mat(0x2b2d42, { metalness: .6 }), body = mat(0xf2cc8f), accent = mat(0xe07a5f);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, leg = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .7, 8), dark); leg.position.set(Math.cos(a) * .22, .3, Math.sin(a) * .22); leg.rotation.set(Math.sin(a) * .45, 0, -Math.cos(a) * .45); g.add(leg); }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .18, 16), body); base.position.y = .64; g.add(base);
  const head = new THREE.Group(); head.position.y = .82; g.add(head);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(.32, .2, .34), body); head.add(hb);
  [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .45, 10), dark); b.rotation.x = Math.PI / 2; b.position.set(s * .07, 0, -.35); head.add(b); });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .03, 14), new THREE.MeshBasicMaterial({ color: 0x4fd1c5 })); lens.rotation.x = Math.PI / 2; lens.position.set(0, .05, -.18); head.add(lens);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.33, .04, .35), accent); stripe.position.y = -.07; head.add(stripe);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .56, 32), new THREE.MeshBasicMaterial({ color: 0x4fd1c5, transparent: true, opacity: .6, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; g.add(ring);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.head = head; g.userData.lens = lens; g.userData.ring = ring;
  return g;
}

export const slv = id => supById(id) ? support.lv[id] || 0 : 0;
const at = (id, k) => { const s = supById(id), l = Math.max(1, slv(id)); return s[k][l - 1]; };
// make the drones flying around match the levels you own
function syncDrones() {
  const want = { medidrone: slv('medidrone') ? 1 : 0, sentry: slv('sentry') ? at('sentry', 'n') : 0 };
  for (const kind of ['medidrone', 'sentry']) {
    let have = support.drones.filter(d => d.kind === kind).length;
    while (have < want[kind]) { const g = droneMesh(kind === 'medidrone' ? 'medic' : 'sentry'); g.position.copy(camera.position); scene.add(g); support.drones.push({ kind, g, cd: 0, phase: support.drones.length * Math.PI, target: null }); have++; }
  }
}
// main button: buy level 1 (charge items come with one charge), then upgrade
export function buySupport(id) {
  const s = supById(id), l = slv(id); if (!s || l >= supMax(s)) return false;
  support.lv[id] = l + 1;
  if (l === 0 && s.charge) support.stock[id] = (support.stock[id] || 0) + 1;
  syncDrones(); return true;
}
export function buyCharge(id) { const s = supById(id); if (!s?.charge || !slv(id) || owned(id) >= s.stock) return false; support.stock[id] = owned(id) + 1; return true; }
export function owned(id) { return supById(id) ? support.stock[id] || 0 : 0; }
export function setSupport(lv = {}, stock = {}, scanT = 0) { support.lv = { ...lv }; support.stock = { ...stock }; support.scanT = scanT; syncDrones(); }
export function useScan() {
  if (owned('scan') <= 0 || support.scanT > 0) return false;
  support.stock.scan--; support.scanT = at('scan', 'dur'); SND.scan(); return true;
}
export function deployTurret() {
  if (owned('turret') <= 0) return false;
  const fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion); fwd.y = 0; fwd.normalize();
  const pl = hctx.player.pos; let spot = null;
  for (let d = 2.2; d >= .9; d -= .3) { const p = new V3(pl.x + fwd.x * d, pl.y, pl.z + fwd.z * d); if (!insideSolid(new V3(p.x, pl.y + .5, p.z), .3)) { spot = p; break; } }
  if (!spot) return false;
  spot.y = groundAt(spot.x, spot.z, .2, pl.y + .3, .5);
  const g = turretMesh(); g.position.copy(spot); g.rotation.y = hctx.player.yaw; scene.add(g);
  const life = at('turret', 'life'); support.turrets.push({ g, life, max: life, dmg: at('turret', 'dmg'), rate: at('turret', 'cd'), cd: 0, yaw: hctx.player.yaw, t: 0 }); support.stock.turret--; SND.deploy();
  return true;
}
export function launchStriker() {
  if (owned('striker') <= 0) return false;
  const g = droneMesh('sentry'); g.scale.setScalar(.8); g.position.copy(camera.position).add(new V3(0, .3, 0)); scene.add(g);
  const fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion);
  support.strikers.push({ g, vel: fwd.multiplyScalar(10).add(new V3(0, 3, 0)), t: 0, target: null, dmg: at('striker', 'dmg'), rad: at('striker', 'radius') }); support.stock.striker--; SND.deploy();
  return true;
}
const visibleBot = (from, range) => {
  let best = null, bd = range;
  for (const b of bots) if (b.alive) { const c = b.center(), d = c.distanceTo(from); if (d < bd && lineOfSight(from, c)) { bd = d; best = b; } }
  return best;
};
// hitscan from a helper; aims at the chest with a little spread
function shoot(from, bot, dmg, name, col) {
  const c = bot.center().add(new V3(rand(-.2, .2), rand(-.2, .3), rand(-.2, .2)));
  const dir = c.clone().sub(from).normalize();
  tracer(from, c, col, .07); flashLight(from, col, 6, 5, .05);
  hctx.damage(bot, dmg, c, dir, name);
}

export function updateSupport(dt, t) {
  const pl = hctx.player;
  if (support.scanT > 0) support.scanT -= dt;
  support.drones.forEach((d, i) => {
    // orbit just above and behind your shoulder
    d.phase += dt * .8;
    const ang = pl.yaw + Math.PI * .75 + Math.sin(d.phase) * .4 + i * 1.6, r = 1.3;
    const target = new V3(pl.pos.x + Math.sin(ang) * r, pl.pos.y + pl.eyeH + .5 + Math.sin(t * 2 + i) * .1, pl.pos.z + Math.cos(ang) * r);
    d.g.position.lerp(target, 1 - Math.exp(-dt * 5));
    d.g.userData.rotors.forEach((r, k) => r.rotation.y += dt * 50 * (k % 2 ? 1 : -1));
    if (d.kind === 'medidrone') {
      d.g.rotation.y += dt;
      if (pl.hp < (pl.maxHp || 100) && pl.hp > 0) { hctx.heal(at('medidrone', 'hps') * dt); d.cd -= dt; if (d.cd <= 0) { d.cd = .6; sparks(camera.position.clone().add(new V3(rand(-.4, .4), -.6, rand(-.4, .4))), 0x7dff8a, 1, 1); } }
      return;
    }
    d.cd -= dt;
    if (d.cd <= 0) {
      d.cd = .1;
      d.target = visibleBot(d.g.position, at('sentry', 'range'));
      if (d.target) { d.cd = at('sentry', 'cd'); shoot(d.g.position.clone(), d.target, at('sentry', 'dmg'), 'Sentry', 0x4fd1c5); at3(d.g.position, () => SND.drone()); }
    }
    if (d.target && d.target.alive) { d.g.lookAt(d.target.center()); d.g.rotateY(Math.PI); } else d.g.rotation.set(0, pl.yaw, 0);
  });
  for (let i = support.turrets.length - 1; i >= 0; i--) {
    const tu = support.turrets[i], head = tu.g.userData.head; tu.life -= dt; tu.cd -= dt; tu.t += dt;
    const from = tu.g.position.clone().add(new V3(0, .85, 0)), tgt = visibleBot(from, 35);
    if (tgt) {
      const c = tgt.center(), want = Math.atan2(-(c.x - from.x), -(c.z - from.z));
      let d = want - tu.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      tu.yaw += d * Math.min(1, dt * 8);
      if (tu.cd <= 0 && Math.abs(d) < .2) { tu.cd = tu.rate; shoot(from.clone().add(new V3(-Math.sin(tu.yaw) * .5, 0, -Math.cos(tu.yaw) * .5)), tgt, tu.dmg, 'Turret', 0xf2cc8f); at3(from, () => SND.turret()); }
    } else tu.yaw += dt * .6;
    head.rotation.y = tu.yaw - tu.g.rotation.y;
    tu.g.userData.ring.material.opacity = .25 + .4 * (tu.life / tu.max);
    if (tu.life < 5) tu.g.userData.lens.visible = Math.sin(tu.t * 20) > 0;
    if (tu.life <= 0) { sparks(from, 0xf2cc8f, 10, 3); scene.remove(tu.g); support.turrets.splice(i, 1); }
  }
  for (let i = support.strikers.length - 1; i >= 0; i--) {
    const s = support.strikers[i]; s.t += dt;
    s.g.userData.rotors.forEach(r => r.rotation.y += dt * 60);
    if (!s.target || !s.target.alive) s.target = visibleBot(s.g.position, 70) || bots.filter(b => b.alive).sort((a, b) => a.pos.distanceTo(s.g.position) - b.pos.distanceTo(s.g.position))[0] || null;
    if (s.target && s.t > .35) { const want = s.target.center().sub(s.g.position).normalize().multiplyScalar(18); s.vel.lerp(want, Math.min(1, dt * 3)); }
    else s.vel.y -= dt * 2;
    s.g.position.addScaledVector(s.vel, dt); s.g.lookAt(s.g.position.clone().add(s.vel));
    if (Math.random() < .5) sparks(s.g.position, 0xffb347, 1, 1);
    const hitBot = s.target && s.target.alive && s.g.position.distanceTo(s.target.center()) < 1.1;
    if (hitBot || s.t > 9 || s.g.position.y < .2 || (s.t > .4 && insideSolid(s.g.position))) {
      hctx.explode(s.g.position.clone(), s.rad, s.dmg, { strike: true }); scene.remove(s.g); support.strikers.splice(i, 1);
    }
  }
}
// new floor: turrets and strikers in flight are lost, drones come with you
export function floorChange() {
  support.turrets.forEach(t => scene.remove(t.g)); support.turrets.length = 0;
  support.strikers.forEach(s => scene.remove(s.g)); support.strikers.length = 0;
  support.drones.forEach(d => d.g.position.copy(camera.position));
}
export function clearSupport() {
  floorChange(); support.drones.forEach(d => scene.remove(d.g)); support.drones.length = 0;
  support.stock = {}; support.lv = {}; support.scanT = 0;
}
void world;
