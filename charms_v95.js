// Gun charms: little trinkets that hang off the side of your gun on a short chain and swing as you move, aim and shoot.
// Bought once, yours forever, and you pick one per gun.
export const CHARMS = [
  { id: 'none', name: 'No charm', icon: '∅', price: 0 },
  { id: 'duck', name: 'Rubber Duck', icon: '🦆', price: 300 },
  { id: 'dice', name: 'Lucky Die', icon: '🎲', price: 300 },
  { id: 'heart', name: 'Candy Heart', icon: '❤', price: 400 },
  { id: 'star', name: 'Gold Star', icon: '⭐', price: 400 },
  { id: 'cherry', name: 'Cherries', icon: '🍒', price: 500 },
  { id: 'donut', name: 'Sprinkle Donut', icon: '🍩', price: 600 },
  { id: 'eightball', name: '8-Ball', icon: '🎱', price: 600 },
  { id: 'cactus', name: 'Tiny Cactus', icon: '🌵', price: 700 },
  { id: 'ghost', name: 'Boo', icon: '👻', price: 800 },
  { id: 'skull', name: 'Bone Head', icon: '💀', price: 900 },
  { id: 'botling', name: 'Botling', icon: '🤖', price: 1200 },
  { id: 'crown', name: 'Crown', icon: '👑', price: 2000 },
  { id: 'goldbar', name: 'Gold Bar', icon: '🪙', price: 2500 },
];
export const charmById = id => CHARMS.find(c => c.id === id) || CHARMS[0];

// Builds the charm: an anchor (on the gun) > swing group (rotates) > ring, chain and the trinket hanging below.
export function buildCharm(THREE, id) {
  if (!id || id === 'none') return null;
  const anchor = new THREE.Group(), swing = new THREE.Group(); anchor.add(swing);
  const gloss = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .25, metalness: .05, clearcoat: 1, clearcoatRoughness: .12 });
  const metal = (c = 0xd4a73a) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .2, metalness: 1 });
  const add = (geo, m, x = 0, y = 0, z = 0, p = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; };
  const S = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h), B = (x, y, z) => new THREE.BoxGeometry(x, y, z);
  // ring and chain
  const chainM = metal(0xb3b9c3);
  add(new THREE.TorusGeometry(.004, .0011, 6, 14), chainM, 0, 0, 0, swing).rotation.y = Math.PI / 2;
  for (let i = 0; i < 3; i++) { const l = add(new THREE.TorusGeometry(.0032, .001, 5, 10), chainM, 0, -.006 - i * .0058, 0, swing); l.rotation.y = i % 2 ? 0 : Math.PI / 2; }
  const body = new THREE.Group(); body.position.y = -.03; swing.add(body);
  const s = .012;  // overall size
  const ink = gloss(0x2b2d42), white = gloss(0xfffaf0);
  if (id === 'duck') {
    const y = gloss(0xffd23f); add(S(s), y); add(S(s * .66), y, 0, s * .95, -s * .3); add(new THREE.ConeGeometry(s * .3, s * .5, 10).rotateX(Math.PI / 2), gloss(0xff8c42), 0, s * .85, -s * 1.05);
    add(S(s * .12), ink, s * .4, s * 1.1, -s * .7); add(S(s * .12), ink, -s * .4, s * 1.1, -s * .7);
  } else if (id === 'dice') {
    add(B(s * 1.6, s * 1.6, s * 1.6), white).rotation.set(.5, .6, .2);
    [[s * .81, 0, 0], [s * .81, s * .4, s * .4], [s * .81, -s * .4, -s * .4]].forEach(([x, y, z]) => add(S(s * .17), ink, x, y, z, body.children.at(-1)));
  } else if (id === 'heart') {
    const r = gloss(0xff4f7a); add(S(s * .62), r, -s * .42, s * .25, 0); add(S(s * .62), r, s * .42, s * .25, 0);
    add(new THREE.ConeGeometry(s * .95, s * 1.3, 4).rotateZ(Math.PI), r, 0, -s * .55, 0).rotation.y = Math.PI / 4;
  } else if (id === 'star') {
    const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? s * .5 : s * 1.15; i ? sh.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: s * .4, bevelEnabled: true, bevelThickness: s * .15, bevelSize: s * .12, bevelSegments: 2 }); g.translate(0, 0, -s * .2); g.rotateY(Math.PI / 2);
    add(g, metal(0xffd23f));
  } else if (id === 'cherry') {
    const r = gloss(0xd6233f); add(S(s * .6), r, -s * .5, -s * .3, 0); add(S(s * .6), r, s * .5, -s * .45, 0);
    const st = gloss(0x5f8a3b); add(new THREE.CylinderGeometry(s * .08, s * .08, s * 1.4, 6), st, -s * .25, s * .5, 0).rotation.z = -.45; add(new THREE.CylinderGeometry(s * .08, s * .08, s * 1.5, 6), st, s * .25, s * .45, 0).rotation.z = .4;
  } else if (id === 'donut') {
    add(new THREE.TorusGeometry(s * .75, s * .38, 12, 24).rotateY(Math.PI / 2), gloss(0xe6b07a));
    const ic = add(new THREE.TorusGeometry(s * .75, s * .3, 10, 24, Math.PI * 1.6).rotateY(Math.PI / 2), gloss(0xff7eb6)); ic.position.x = s * .12;
    [0xfffaf0, 0x4fd1c5, 0xffe14d, 0x7dd3ff].forEach((c, i) => { const a = i * 1.4; add(B(s * .08, s * .08, s * .28), gloss(c), s * .45, Math.sin(a) * s * .75, Math.cos(a) * s * .75).rotation.x = a; });
  } else if (id === 'eightball') {
    add(S(s * 1.05, 20, 16), ink); add(new THREE.CircleGeometry(s * .45, 18).rotateY(Math.PI / 2), white, s * 1.06, s * .1, 0);
    add(new THREE.TorusGeometry(s * .14, s * .05, 6, 14).rotateY(Math.PI / 2), ink, s * 1.07, s * .2, 0); add(new THREE.TorusGeometry(s * .17, s * .05, 6, 14).rotateY(Math.PI / 2), ink, s * 1.07, -s * .05, 0);
  } else if (id === 'cactus') {
    const gr = gloss(0x5fa36a); add(new THREE.CapsuleGeometry(s * .35, s * 1.1, 4, 10), gr, 0, s * .2, 0);
    add(new THREE.CapsuleGeometry(s * .22, s * .5, 4, 8), gr, 0, s * .35, -s * .5).rotation.x = .3; add(new THREE.CapsuleGeometry(s * .22, s * .4, 4, 8), gr, 0, s * .1, s * .48).rotation.x = -.3;
    add(new THREE.CylinderGeometry(s * .55, s * .42, s * .6, 14), gloss(0xe07a5f), 0, -s * .7, 0); add(S(s * .18), gloss(0xff7eb6), 0, s * 1.05, 0);
  } else if (id === 'ghost') {
    const w = gloss(0xf4f1ff); add(S(s * .8, 18, 14), w, 0, s * .2, 0); add(new THREE.CylinderGeometry(s * .8, s * .9, s * .9, 18, 1, true), w, 0, -s * .3, 0);
    add(S(s * .14), ink, s * .7, s * .35, -s * .25); add(S(s * .14), ink, s * .7, s * .35, s * .25); add(S(s * .18), ink, s * .72, 0, 0).scale.set(.5, 1.2, 1);
  } else if (id === 'skull') {
    const bone = gloss(0xf1ead8); add(S(s * .85, 18, 14), bone, 0, s * .15, 0); add(B(s * .9, s * .55, s * 1.1), bone, s * .15, -s * .45, 0);
    add(S(s * .25), ink, s * .7, s * .2, -s * .32); add(S(s * .25), ink, s * .7, s * .2, s * .32); add(new THREE.ConeGeometry(s * .12, s * .22, 3).rotateZ(Math.PI), ink, s * .82, -s * .12, 0);
  } else if (id === 'botling') {
    add(B(s * 1.5, s * 1.25, s * 1.5), gloss(0xe07a5f)); add(B(s * .3, s * .5, s * 1.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4fd1c5).multiplyScalar(2.4) }), s * .7, s * .1, 0);
    add(new THREE.CylinderGeometry(s * .05, s * .05, s * .6, 6), metal(0xb3b9c3), 0, s * .9, 0); add(S(s * .16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3b30).multiplyScalar(2) }), 0, s * 1.25, 0);
  } else if (id === 'crown') {
    const g = metal(0xffc93c); add(new THREE.CylinderGeometry(s * .85, s * .85, s * .6, 20, 1, true), g, 0, -s * .2, 0);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(new THREE.ConeGeometry(s * .25, s * .6, 4), g, Math.cos(a) * s * .75, s * .35, Math.sin(a) * s * .75); add(S(s * .12), gloss([0xff3b6b, 0x4fd1c5, 0x7dff8a, 0x5b8fd6, 0xff4fd8][i]), Math.cos(a) * s * .86, -s * .15, Math.sin(a) * s * .86); }
  } else if (id === 'goldbar') {
    const sh = new THREE.Shape([[-1.2, -.5], [1.2, -.5], [.9, .5], [-.9, .5]].map(([x, y]) => new THREE.Vector2(x * s, y * s)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: s * .9, bevelEnabled: true, bevelThickness: s * .1, bevelSize: s * .08, bevelSegments: 2 }); g.translate(0, 0, -s * .45); g.rotateY(Math.PI / 2);
    add(g, metal(0xffc93c));
  }
  body.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { anchor, swing, ax: 0, az: 0, vx: 0, vz: 0, prev: null, pv: null, lag: 0 };
}

// Pendulum swing, driven by how the gun moves on screen plus mouse look.
const _p = { x: 0, y: 0, z: 0 };
export function updateCharm(c, dt, lagX, kick) {
  if (!c || dt <= 0) return;
  const wp = c.anchor.getWorldPosition(c._w || (c._w = c.anchor.position.clone()));
  _p.x = wp.x; _p.y = wp.y; _p.z = wp.z;
  if (!c.prev) { c.prev = { ..._p }; c.pv = { x: 0, y: 0, z: 0 }; }
  const v = { x: (_p.x - c.prev.x) / dt, y: (_p.y - c.prev.y) / dt, z: (_p.z - c.prev.z) / dt };
  const a = { x: (v.x - c.pv.x) / dt, y: (v.y - c.pv.y) / dt, z: (v.z - c.pv.z) / dt };
  c.prev = { ..._p }; c.pv = v;
  const dLag = (lagX - c.lag) / dt; c.lag = lagX;
  const lim = x => Math.max(-60, Math.min(60, x));
  // spring back to hanging straight, damped; pushed the opposite way the gun accelerates
  c.vz += (-c.az * 90 - c.vz * 4.5 + lim(a.x) * 1.4 + dLag * 9) * dt;
  c.vx += (-c.ax * 90 - c.vx * 4.5 - lim(a.z) * 1.4 + kick * 30 * dt) * dt;
  c.az = Math.max(-1.3, Math.min(1.3, c.az + c.vz * dt)); c.ax = Math.max(-1.3, Math.min(1.3, c.ax + c.vx * dt));
  c.swing.rotation.set(c.ax, 0, c.az);
}
