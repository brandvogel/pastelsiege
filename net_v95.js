// Play with friends: one player hosts, up to 4 friends join with a short code. PeerJS (free) introduces the laptops
// to each other; after that they talk directly. The host is the hub: friends send their position to the host, and the
// host passes everyone's on to everyone else. Co-op runs (shared bots, waves and floors) are built on top in the game file.
// Everyone's character look (shirt, pants, visor, hat, back item, name tag) travels with their name.
import { THREE, scene, tracer } from './world_v95.js';

const PEER_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const PREFIX = 'pastelsiege-p1-';            // keeps our codes apart from other games on the same free server
const WORDS = ['PINK', 'MINT', 'PEACH', 'LILAC', 'SKY', 'LEMON', 'CORAL', 'SAGE', 'BERRY', 'CREAM'];
const COLS = [0xff8fab, 0x7bd8b5, 0x8fb8ff, 0xffc86b, 0xc49bff];
const MAX = 5, SEND_HZ = 15;
// Backup relay (a small server, see relay/SETUP.txt): when a direct connection is blocked (school wifi), messages go
// through it instead, over a normal secure web connection. Blank = no relay, direct connections only.
const RELAY_URL = '';

// ---------- character looks ----------
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
  back: [['none', 'Nothing'], ['pack', 'Backpack'], ['jet', 'Jetpack', { lvl: 12 }], ['cape', 'Cape', { lvl: 18 }], ['wings', 'Wings', { lvl: 35 }], ['gwings', 'Golden wings', { leg: 5 }]].map(([id, name, req]) => ({ id, name, req })),
  tag: [['team', 'Team colour', 0], ['white', 'White', 0xffffff], ['gold', 'Gold', 0xffcf5a, { lvl: 25 }], ['rainbow', 'Rainbow', 0xff8fab, { leg: 2 }, 'rainbow']].map(([id, name, hex, req, fx]) => ({ id, name, hex, req, fx })),
};
export const DEFAULT_LOOK = { shirt: 'pink', pants: 'navy', visor: 'white', hat: 'none', back: 'none', tag: 'team' };
const pick = (k, id) => LOOK[k].find(x => x.id === id) || LOOK[k].find(x => x.id === DEFAULT_LOOK[k]);
// keep only known ids (looks arrive from other players)
export const cleanLook = l => Object.fromEntries(Object.keys(DEFAULT_LOOK).map(k => [k, pick(k, l?.[k]).id]));
const lookKey = l => Object.values(cleanLook(l)).join('|');
function paintMat(o, rough = .45) {
  const m = new THREE.MeshStandardMaterial({ color: o.hex, roughness: rough });
  if (o.fx === 'gold') Object.assign(m, { metalness: .85, roughness: .25 });
  if (o.fx === 'chrome') Object.assign(m, { metalness: 1, roughness: .12 });
  if (o.fx === 'glow') { m.emissive.set(0x3a1a8a); m.emissiveIntensity = .9; }
  if (o.fx === 'rainbow') m.userData.rainbow = true;
  return m;
}
// rainbow parts cycle colour; call every frame with the time in seconds
export function tintRainbow(mats, t) { for (const m of mats) { m.color.setHSL((t * .15) % 1, .75, .7); if (m.emissive && m.userData.glowRainbow) m.emissive.setHSL((t * .15) % 1, .9, .5); } }
// the friend robot, dressed in a look. Returns its parts so the caller can animate them.
export function buildAvatar(look) {
  const L = cleanLook(look), S = pick('shirt', L.shirt), P = pick('pants', L.pants), Vz = pick('visor', L.visor);
  const g = new THREE.Group(), body = paintMat(S), pants = paintMat(P, .5);
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: .5, metalness: .3 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: Vz.hex, emissiveIntensity: .9 }); if (Vz.fx === 'rainbow') visor.userData.glowRainbow = true;
  const gold = new THREE.MeshStandardMaterial({ color: 0xffcf5a, metalness: .85, roughness: .25, emissive: 0x6b4a00, emissiveIntensity: .3 });
  const M = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || g).add(m); return m; };
  const torso = new THREE.Group(); g.add(torso);
  // body: chest with a plate and a glowing stripe in your visor colour, shoulder pads, a belt with pouches and a neck
  M(new THREE.CapsuleGeometry(.26, .42, 4, 14), body, 0, 1.08, 0, torso);
  M(new THREE.BoxGeometry(.4, .3, .1), dark, 0, 1.15, -.23, torso);
  M(new THREE.BoxGeometry(.26, .035, .02), visor, 0, 1.21, -.285, torso);
  M(new THREE.CylinderGeometry(.275, .275, .08, 18), dark, 0, .8, 0, torso);
  [-1, 1].forEach(s => { M(new THREE.BoxGeometry(.09, .1, .07), pants, s * .16, .8, -.26, torso); M(new THREE.SphereGeometry(.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), pants, s * .29, 1.3, 0, torso); });
  M(new THREE.CylinderGeometry(.08, .1, .14, 12), dark, 0, 1.4, 0, torso);
  M(new THREE.BoxGeometry(.3, .32, .1), dark, 0, 1.12, .25, torso); // back plate
  // legs: thigh, knee joint, shin, boot (they swing from the hip)
  const legs = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * .14, .72, 0);
    M(new THREE.CapsuleGeometry(.1, .2, 4, 10), pants, 0, -.17, 0, piv); M(new THREE.SphereGeometry(.1, 10, 8), dark, 0, -.36, 0, piv);
    M(new THREE.CapsuleGeometry(.085, .18, 4, 10), pants, 0, -.52, 0, piv); M(new THREE.BoxGeometry(.15, .09, .25), dark, 0, -.675, -.04, piv);
    g.add(piv); return piv;
  });
  const aim = new THREE.Group(); aim.position.y = 1.55; g.add(aim);
  // head: helmet with a wraparound visor, ear pieces
  M(new THREE.SphereGeometry(.22, 20, 14), body, 0, 0, 0, aim);
  M(new THREE.BoxGeometry(.36, .14, .1), dark, 0, .02, -.15, aim);
  M(new THREE.BoxGeometry(.31, .085, .06), visor, 0, .02, -.2, aim);
  [-1, 1].forEach(s => { const e = M(new THREE.CylinderGeometry(.06, .06, .05, 12), dark, s * .22, 0, 0, aim); e.rotation.z = Math.PI / 2; });
  // arms hold the gun and turn with your aim
  const limb = (a, b, r, mat) => { const d = b.clone().sub(a), m = M(new THREE.CapsuleGeometry(r, Math.max(.01, d.length() - r * 2), 4, 8), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, aim); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  [[v(.3, -.24, 0), v(.33, -.45, -.06), v(.22, -.33, -.17)], [v(-.3, -.24, 0), v(-.2, -.44, -.24), v(.17, -.3, -.46)]].forEach(([S, E, H]) => {
    limb(S, E, .075, body); limb(E, H, .065, dark); M(new THREE.SphereGeometry(.08, 10, 8), dark, E.x, E.y, E.z, aim); M(new THREE.SphereGeometry(.058, 10, 8), dark, H.x, H.y, H.z, aim);
  });
  // the gun: receiver, barrel, magazine and a sight
  M(new THREE.BoxGeometry(.08, .1, .42), dark, .22, -.28, -.3, aim);
  const bar = M(new THREE.CylinderGeometry(.018, .018, .22, 8), dark, .22, -.26, -.6, aim); bar.rotation.x = Math.PI / 2;
  M(new THREE.BoxGeometry(.06, .14, .07), pants, .22, -.37, -.28, aim); M(new THREE.BoxGeometry(.03, .04, .08), visor, .22, -.21, -.24, aim);
  // hats sit on the head (they turn with your aim)
  const h = L.hat, hatCol = paintMat(P, .5);
  if (h === 'cap') { M(new THREE.SphereGeometry(.235, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatCol, 0, .04, 0, aim); M(new THREE.BoxGeometry(.3, .03, .2), hatCol, 0, .06, -.24, aim); }
  if (h === 'beanie') { M(new THREE.SphereGeometry(.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatCol, 0, .02, 0, aim); M(new THREE.SphereGeometry(.07, 8, 6), body, 0, .27, 0, aim); }
  if (h === 'phones') { const r = M(new THREE.TorusGeometry(.25, .025, 6, 18, Math.PI), dark, 0, .02, 0, aim); r.rotation.y = Math.PI / 2; [-1, 1].forEach(s => { const c = M(new THREE.CylinderGeometry(.08, .08, .07, 12), hatCol, s * .24, 0, 0, aim); c.rotation.z = Math.PI / 2; }); }
  if (h === 'antenna') { M(new THREE.CylinderGeometry(.012, .012, .3, 6), dark, 0, .35, 0, aim); M(new THREE.SphereGeometry(.05, 10, 8), visor, 0, .52, 0, aim); }
  if (h === 'bunny') [-1, 1].forEach(s => { const e = M(new THREE.CapsuleGeometry(.05, .26, 4, 8), body, s * .1, .36, 0, aim); e.rotation.z = -s * .2; });
  if (h === 'tophat') { M(new THREE.CylinderGeometry(.16, .16, .3, 16), dark, 0, .33, 0, aim); M(new THREE.CylinderGeometry(.28, .28, .025, 18), dark, 0, .19, 0, aim); M(new THREE.CylinderGeometry(.165, .165, .05, 16), body, 0, .23, 0, aim); }
  if (h === 'halo') { const r = M(new THREE.TorusGeometry(.18, .025, 8, 24), new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffd75a, emissiveIntensity: 1.4 }), 0, .4, 0, aim); r.rotation.x = Math.PI / 2; }
  if (h === 'crown') { M(new THREE.CylinderGeometry(.17, .17, .1, 14, 1, true), gold, 0, .22, 0, aim); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; M(new THREE.ConeGeometry(.04, .1, 6), gold, Math.sin(a) * .16, .31, Math.cos(a) * .16, aim); } }
  // back items hang off the torso
  const b = L.back;
  if (b === 'pack') { M(new THREE.BoxGeometry(.4, .45, .2), hatCol, 0, 1.1, .3, torso); M(new THREE.BoxGeometry(.3, .15, .06), body, 0, .95, .42, torso); }
  if (b === 'jet') { [-1, 1].forEach(s => { M(new THREE.CylinderGeometry(.09, .09, .45, 12), new THREE.MeshStandardMaterial({ color: 0xc9d2e3, metalness: .9, roughness: .2 }), s * .12, 1.1, .32, torso); const f = M(new THREE.ConeGeometry(.07, .2, 10), new THREE.MeshBasicMaterial({ color: 0xffb347 }), s * .12, .78, .32, torso); f.rotation.x = Math.PI; }); }
  if (b === 'cape') { const c = M(new THREE.BoxGeometry(.6, .95, .03), hatCol, 0, .9, .34, torso); c.rotation.x = .12; }
  if (b === 'wings' || b === 'gwings') {
    const wm = b === 'gwings' ? gold : new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf2ff, emissiveIntensity: .35, roughness: .6 });
    [-1, 1].forEach(s => { const w = M(new THREE.BoxGeometry(.7, .32, .03), wm, s * .38, 1.25, .32, torso); w.rotation.z = s * .45; w.rotation.y = -s * .35; });
  }
  const rainbow = []; g.traverse(m => { if (m.isMesh) { m.castShadow = true; if (m.material.userData.rainbow || m.material.userData.glowRainbow) rainbow.push(m.material); } });
  return { g, body, torso, legs, aim, rainbow: [...new Set(rainbow)] };
}
const disposeGroup = g => g.traverse(m => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose?.(); } });

export const net = { on: false, host: false, code: '', id: '', name: '', col: COLS[0], look: { ...DEFAULT_LOOK }, status: '', peers: new Map(), onGo: null, onChange: null, onMsg: null, onJoin: null };
let peer = null, hostConn = null, sendT = 0;
const V3 = THREE.Vector3;

const changed = () => { try { net.onChange?.(); } catch (e) { } };
const setStatus = s => { net.status = s; changed(); };
const clean = s => String(s || 'Player').replace(/[<>&"]/g, '').slice(0, 14) || 'Player';
// your look changed: tell everyone (friends tell the host, and the host passes it on in the player list)
export function setLook(l) { net.look = cleanLook(l); if (!net.on) return; if (net.host) roster(); else send(hostConn, { t: 'look', look: net.look }); }

function loadLib() {
  if (window.Peer) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = PEER_URL; s.onload = () => res();
    s.onerror = () => rej(new Error('Could not load the multiplayer library. Check you are online, and play on your own website (it does not work in the preview).'));
    document.head.appendChild(s);
  });
}
const errText = e => ({
  'peer-unavailable': 'No game with that code. Check the code, and that the host is still on the Friends screen.',
  'unavailable-id': 'That code is taken, trying another…',
  'network': 'Lost the connection to the matchmaking server.',
  'browser-incompatible': 'This browser can not do multiplayer. Try Chrome, Edge or Safari.',
  'server-error': 'The free matchmaking server is busy. Try again in a minute.',
}[e?.type] || e?.message || 'Something went wrong.');

// ---------- backup relay ----------
// The relay looks like one more way to connect: a relay friend is an object with the same open / send / close / on()
// as a direct PeerJS connection, so everything above and below treats them the same.
let relay = null; const rconns = new Map();
function relayOpen(onMsg) {
  return new Promise((res, rej) => {
    if (!RELAY_URL) return rej(new Error('no relay'));
    let ws; try { ws = new WebSocket(RELAY_URL); } catch (e) { return rej(e); }
    const t = setTimeout(() => { try { ws.close(); } catch (e) { } rej(new Error('relay timeout')); }, 8000);
    ws.onopen = () => { clearTimeout(t); res(ws); };
    ws.onerror = () => { clearTimeout(t); rej(new Error('relay unreachable')); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m && typeof m === 'object') onMsg(m); };
  });
}
const rsend = m => { try { if (relay?.readyState === 1) relay.send(JSON.stringify(m)); } catch (e) { } };
function fakeConn(peerId, sendFn, closeFn) {
  const h = {}, c = { peer: peerId, open: true, relay: true, send: sendFn, close: () => { if (!c.open) return; c.open = false; closeFn(); }, on: (ev, fn) => { h[ev] = fn; }, fire: (ev, x) => h[ev]?.(x) };
  return c;
}
// host side: keep a room open on the relay under the same code, so blocked friends can still get in
async function relayHost(code, key, name) {
  try {
    relay = await relayOpen(m => {
      if (m.r === 'ok') { if (!net.on) Object.assign(net, { on: true, host: true, code, col: COLS[0] }); setStatus(`Hosting. Tell your friends the code ${code}`); }
      else if (m.r === 'taken' && !net.on) host(name);
      else if (m.r === 'conn') {
        const c = fakeConn('r' + m.id, d => rsend({ r: 'to', id: m.id, d }), () => rsend({ r: 'kick', id: m.id }));
        rconns.set(m.id, c); if (net.peers.size >= MAX - 1) { c.send({ t: 'full' }); setTimeout(() => c.close(), 400); }
      }
      else if (m.r === 'from') { const c = rconns.get(m.id); if (c) onData(m.d, c); }
      else if (m.r === 'left') { const c = rconns.get(m.id); if (c) { c.open = false; rconns.delete(m.id); drop(c.peer); } }
    });
    relay.onclose = () => { relay = null; for (const c of rconns.values()) { c.open = false; drop(c.peer); } rconns.clear(); };
    rsend({ r: 'host', code: key });
  } catch (e) { relay = null; }
}
// friend side: used when the direct connection doesn't work. Returns true if it got in.
async function relayJoin(code, key) {
  return new Promise(async res => {
    let done = false; const finish = v => { if (!done) { done = true; res(v); } };
    try {
      relay = await relayOpen(m => {
        if (m.r === 'ok') {
          try { peer?.destroy(); } catch (e) { } peer = null;
          const c = hostConn = fakeConn('host', d => rsend({ r: 'd', d }), () => { try { relay?.close(); } catch (e) { } });
          Object.assign(net, { on: true, host: false, code: String(code).toUpperCase() }); send(c, { t: 'hello', name: net.name, look: net.look });
          setStatus(`Joined ${net.code} (through the relay). Waiting for the host to start…`); finish(true);
        }
        else if (m.r === 'none' || m.r === 'full') { try { relay?.close(); } catch (e) { } finish(m.r); }
        else if (m.r === 'd' && hostConn?.relay) onData(m.d, hostConn);
        else if (m.r === 'closed' && net.on) { leave(true, true); setStatus('The host left the game.'); }
      });
      relay.onclose = () => { relay = null; if (net.on && hostConn?.relay) { leave(true, true); setStatus('Lost the connection to the game.'); } finish(false); };
      rsend({ r: 'join', code: key });
      setTimeout(() => finish(false), 8000);
    } catch (e) { relay = null; finish(false); }
  });
}

// ---------- hosting ----------
export async function host(name) {
  leave(true); setStatus('Starting…');
  const code = WORDS[Math.floor(Math.random() * WORDS.length)] + '-' + (10 + Math.floor(Math.random() * 90)), key = code.replace('-', '').toLowerCase();
  net.name = clean(name); net.id = PREFIX + key;
  relayHost(code, key, name); // the relay room opens alongside the direct one (if there is a relay)
  try { await loadLib(); } catch (e) { if (!RELAY_URL) setStatus(e.message); return; } // blocked library: the relay alone can still host
  peer = new window.Peer(PREFIX + key);
  peer.on('open', id => { Object.assign(net, { on: true, host: true, code, id, col: COLS[0] }); setStatus(`Hosting. Tell your friends the code ${code}`); });
  peer.on('connection', c => {
    c.on('open', () => { if (net.peers.size >= MAX - 1) { c.send({ t: 'full' }); setTimeout(() => c.close(), 400); } });
    c.on('data', d => onData(d, c));
    c.on('close', () => drop(c.peer)); c.on('error', () => drop(c.peer));
  });
  peer.on('error', e => { if (e.type === 'unavailable-id') return host(name); if (relay && net.on) return; setStatus(errText(e)); if (!net.on && !relay) leave(true); });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { } });
}
function roster() {
  const list = [{ id: net.id, name: net.name, col: net.col, look: net.look }, ...[...net.peers.values()].map(p => ({ id: p.id, name: p.name, col: p.col, look: p.look }))];
  for (const p of net.peers.values()) send(p.conn, { t: 'roster', list });
  changed();
}
function drop(id) {
  const p = net.peers.get(id); if (!p) return;
  removeAvatar(p); net.peers.delete(id);
  if (net.host) { roster(); setStatus(`${p.name} left. Code ${net.code}`); }
}

// ---------- joining ----------
// Try the direct connection first; if it fails or takes more than 6 seconds, try the relay.
export async function join(code, name) {
  leave(true);
  const key = String(code || '').replace(/[^a-z0-9]/gi, '').toLowerCase(); if (!key) return setStatus('Type the code your friend gave you.');
  setStatus('Connecting…'); net.name = clean(name);
  let fellBack = false;
  const viaRelay = async why => {
    if (fellBack || net.on) return; fellBack = true;
    if (!RELAY_URL) { setStatus(why); return leave(true, true); }
    setStatus('Direct connection blocked, trying the relay…');
    const r = await relayJoin(code, key); if (r === true) return;
    leave(true, true); setStatus(r === 'full' ? 'That game is full (5 players max).' : r === 'none' ? errText({ type: 'peer-unavailable' }) : 'Could not reach the host, directly or through the relay.');
  };
  try { await loadLib(); } catch (e) { return viaRelay(e.message); }
  peer = new window.Peer();
  const slow = setTimeout(() => viaRelay('Could not reach the host. Their Wi-Fi (or yours) might block direct connections.'), RELAY_URL ? 6000 : 12000);
  peer.on('open', myId => {
    if (fellBack) return; net.id = myId;
    const c = hostConn = peer.connect(PREFIX + key);
    c.on('open', () => { if (fellBack) return c.close(); clearTimeout(slow); Object.assign(net, { on: true, host: false, code: String(code).toUpperCase() }); send(c, { t: 'hello', name: net.name, look: net.look }); setStatus(`Joined ${net.code}. Waiting for the host to start…`); });
    c.on('data', d => onData(d, c));
    c.on('close', () => { if (net.on && hostConn === c) { leave(true, true); setStatus('The host left the game.'); } });
  });
  peer.on('error', e => { if (net.on) return; clearTimeout(slow); viaRelay(errText(e)); });
}

// ---------- messages ----------
function send(c, d) { try { if (c?.open) c.send(d); } catch (e) { } }
function toAll(d, except) { for (const p of net.peers.values()) if (p.id !== except) send(p.conn, d); }
function onData(d, c) {
  if (!d || typeof d !== 'object') return;
  if (net.host) {
    const id = c.peer;
    if (d.t === 'hello') {
      if (net.peers.size >= MAX - 1) return;
      const used = new Set([net.col, ...[...net.peers.values()].map(p => p.col)]), col = COLS.find(x => !used.has(x)) ?? COLS[1];
      net.peers.set(id, { id, name: clean(d.name), col, look: cleanLook(d.look), conn: c, st: null });
      send(c, { t: 'welcome', col, id }); roster(); setStatus(`${clean(d.name)} joined! Code ${net.code}`);
      try { net.onJoin?.(id, clean(d.name)); } catch (e) { console.warn('co-op join', e); }
      return;
    }
    const p = net.peers.get(id); if (!p) return;
    d.id = id;
    if (d.t === 'st') { if (!Array.isArray(d.p) || d.p.length !== 3 || !d.p.every(Number.isFinite)) return; d.hp = Math.max(0, Math.min(300, +d.hp || 0)); d.mh = Math.max(1, Math.min(300, +d.mh || 100)); p.st = d; p.seen = performance.now(); toAll(d, id); } // junk positions from a modded game are dropped
    else if (d.t === 'shot') { showShot(d); toAll(d, id); }
    else if (d.t === 'look') { p.look = cleanLook(d.look); roster(); }
    else if (d.t === 'chat') { const now = performance.now(); if (now - (p.chatT || 0) < 800) return; p.chatT = now; hostChat(id, p.name, p.col, d.x, p.conn); } // at most one message a second each
    else { try { net.onMsg?.(d, id); } catch (e) { console.warn('co-op', e); } }
  } else {
    if (d.t === 'welcome') { net.col = d.col; if (typeof d.id === 'string') net.id = d.id; }
    else if (d.t === 'roster') {
      const keep = new Set(d.list.map(x => x.id));
      for (const [id, p] of net.peers) if (!keep.has(id)) { removeAvatar(p); net.peers.delete(id); }
      for (const x of d.list) if (x.id !== net.id) { const p = net.peers.get(x.id), look = cleanLook(x.look); if (p) { p.name = clean(x.name); p.col = x.col; p.look = look; } else net.peers.set(x.id, { id: x.id, name: clean(x.name), col: x.col, look, st: null }); }
      changed();
    }
    else if (d.t === 'st') { const p = net.peers.get(d.id); if (p) { p.st = d; p.seen = performance.now(); } }
    else if (d.t === 'shot') showShot(d);
    else if (d.t === 'go') { try { net.onGo?.(d.mode); } catch (e) { } }
    else if (d.t === 'full') { leave(true, true); setStatus('That game is full (5 players max).'); }
    else if (d.t === 'chat') { const x = cleanChat(d.x); if (x) try { net.onChat?.({ id: d.id, n: clean(d.n), c: d.c, x }); } catch (e) { } }
    else if (d.t === 'chatno') { try { net.onChat?.({ sys: true, x: 'You are muted, so your message was not sent.' }); } catch (e) { } }
    else { try { net.onMsg?.(d, null); } catch (e) { console.warn('co-op', e); } }
  }
}
// host only: everyone starts the same mode at once
export function go(mode) { if (net.on && net.host) toAll({ t: 'go', mode }); }
// co-op game messages: the host talks to everyone (or one friend), friends talk to the host
export function toFriends(d) { if (net.on && net.host) toAll(d); }
export function toFriend(id, d) { const p = net.peers.get(id); if (p) send(p.conn, d); }
export function toHost(d) { if (net.on && !net.host) send(hostConn, d); }
export const isGuest = () => net.on && !net.host, isHost = () => net.on && net.host;

// ---------- chat ----------
// Messages go through the host like everything else. The host drops messages from anyone a moderator has muted
// (net.isMuted asks the database), then sends the rest to everyone, including back to whoever wrote it.
const cleanChat = x => String(x ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
async function hostChat(id, name, col, x, conn) {
  x = cleanChat(x); if (!x) return;
  let muted = false; try { muted = !!(await net.isMuted?.(name)); } catch (e) { }
  if (muted) { if (conn) send(conn, { t: 'chatno' }); return; }
  const m = { t: 'chat', id, n: name, c: col, x };
  toAll(m); try { net.onChat?.(m); } catch (e) { }
}
export function chat(x) {
  x = cleanChat(x); if (!x || !net.on) return;
  if (net.host) hostChat(net.id, net.name, net.col, x); else send(hostConn, { t: 'chat', x });
}

export function leave(quiet = false, keepStatus = false) {
  for (const p of net.peers.values()) removeAvatar(p);
  net.peers.clear(); net.on = false; net.host = false; net.code = '';
  try { hostConn?.close(); } catch (e) { } try { peer?.destroy(); } catch (e) { } try { relay?.close(); } catch (e) { } relay = null; rconns.clear();
  peer = hostConn = null;
  if (!keepStatus) net.status = quiet ? '' : 'Left the game.';
  changed();
}
// the other players as the host last heard them (for the bots to target)
export const peerStates = () => [...net.peers.values()].filter(p => p.st && performance.now() - (p.seen || 0) < 3000).map(p => ({ id: p.id, name: p.name, col: p.col, st: p.st }));
export const players = () => [{ id: net.id, name: net.name, col: net.col, look: net.look, me: true }, ...[...net.peers.values()].map(p => ({ id: p.id, name: p.name, col: p.col, look: p.look }))];

// ---------- every frame ----------
// me: { map, x, y, z, yaw, pitch, crouch, hp } (map is null when you're not in a game)
export function tick(dt, me) {
  if (!net.on) return;
  if ((sendT += dt) >= 1 / SEND_HZ) {
    sendT = 0;
    const d = { t: 'st', id: net.id, map: me.map, p: [+me.x.toFixed(2), +me.y.toFixed(2), +me.z.toFixed(2)], yaw: +me.yaw.toFixed(3), pitch: +me.pitch.toFixed(3), c: +me.crouch.toFixed(2), hp: Math.round(me.hp), mh: Math.round(me.maxHp || 100), dn: me.down ? 1 : 0, rv: me.rv ? +me.rv.toFixed(2) : 0, ts: Math.round(performance.now()) };
    if (net.host) toAll(d); else send(hostConn, d);
  }
  const now = performance.now();
  for (const p of net.peers.values()) {
    const s = p.st, show = s && me.map && s.map === me.map && now - (p.seen || 0) < 3000;
    if (!show) { if (p.av) { p.av.g.visible = false; p.av.rev.visible = false; } continue; }
    if (p.av && p.av.key !== lookKey(p.look)) removeAvatar(p); // they changed their look
    const a = p.av || (p.av = makeAvatar(p));
    if (a.col !== p.col) { a.col = p.col; setTag(a, p.name); }
    if (a.name !== p.name) setTag(a, p.name);
    a.target.set(s.p[0], s.p[1], s.p[2]);
    if (!a.g.visible) { a.g.position.copy(a.target); a.g.visible = true; }
    // smooth between the 15 updates a second
    const prev = a.g.position.clone(); a.g.position.lerp(a.target, Math.min(1, dt * 12));
    const moved = prev.distanceTo(a.g.position) / Math.max(dt, 1e-3);
    a.yaw = lerpAngle(a.yaw, s.yaw, Math.min(1, dt * 14)); a.g.rotation.y = a.yaw;
    a.aim.rotation.x = THREE.MathUtils.lerp(a.aim.rotation.x, s.pitch, Math.min(1, dt * 14));
    a.g.scale.setScalar(s.dn || s.hp <= 0 ? .6 : 1); a.g.rotation.z = s.dn ? 1.3 : 0; // knocked over while they are down
    const cr = 1 - .3 * (s.c || 0); a.torso.scale.y = cr; a.aim.position.y = 1.5 * cr + .05;
    a.walk += dt * Math.min(moved, 8) * 1.6; const sw = Math.sin(a.walk) * Math.min(1, moved / 3) * .6;
    a.legs[0].rotation.x = sw; a.legs[1].rotation.x = -sw;
    if (a.rainbow.length) tintRainbow(a.rainbow, now / 1000);
    // downed friends: a pulsing REVIVE marker you can see through walls, filling up while someone revives them
    a.rev.visible = !!s.dn;
    if (s.dn) { const rv = Math.round((s.rv || 0) * 20) / 20; if (rv !== a.rv) drawRevive(a, rv); a.rev.position.set(a.g.position.x, a.g.position.y + 1.3 + Math.sin(now / 250) * .08, a.g.position.z); a.rev.scale.setScalar(.75 + Math.sin(now / 180) * .05); }
  }
}
export function shot(a, b, map) {
  if (!net.on) return;
  const d = { t: 'shot', id: net.id, map, a: [a.x, a.y, a.z].map(v => +v.toFixed(2)), b: [b.x, b.y, b.z].map(v => +v.toFixed(2)) };
  if (net.host) toAll(d); else send(hostConn, d);
}
let curMap = null;
export function setMap(m) { curMap = m; }
const shotPoint = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
function showShot(d) {
  if (typeof d.map !== 'string' || !d.map || d.map !== curMap) return;
  if (!shotPoint(d.a) || !shotPoint(d.b)) return; // junk from a modded game must not reach the renderer
  const p = net.peers.get(d.id);
  tracer(new V3(...d.a), new V3(...d.b), p?.col ?? 0xffc46b, .06);
}

// ---------- the friend robot ----------
const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
function makeAvatar(p) {
  const A = buildAvatar(p.look), { g } = A;
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true })); tag.position.y = 2.15; tag.renderOrder = 20; g.add(tag);
  // the revive marker lives outside the robot so it stays upright while they lie on the floor
  const rev = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true })); rev.renderOrder = 21; rev.visible = false;
  scene.add(g, rev);
  const a = { ...A, tag, rev, rv: -1, target: new V3(), yaw: 0, walk: 0, col: p.col, name: null, key: lookKey(p.look), tagId: cleanLook(p.look).tag };
  setTag(a, p.name); return a;
}
// name above the head; it shows through walls so you can always find each other
function setTag(a, name) {
  a.name = name;
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.font = '800 30px system-ui, sans-serif'; const w = Math.min(240, x.measureText(name).width + 30);
  x.fillStyle = 'rgba(43,45,66,.85)'; x.beginPath(); x.roundRect((256 - w) / 2, 10, w, 44, 14); x.fill();
  const T = pick('tag', a.tagId);
  if (T.fx === 'rainbow') { const gr = x.createLinearGradient(128 - w / 2, 0, 128 + w / 2, 0); ['#ff8fab', '#ffc86b', '#b6ff6b', '#7ff6ff', '#c49bff'].forEach((s, i) => gr.addColorStop(i / 4, s)); x.fillStyle = gr; }
  else x.fillStyle = '#' + (T.hex || a.col).toString(16).padStart(6, '0');
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, 128, 33);
  a.tag.material.map?.dispose(); a.tag.material.map = new THREE.CanvasTexture(c); a.tag.material.map.colorSpace = THREE.SRGBColorSpace; a.tag.material.needsUpdate = true;
  a.tag.scale.set(1.2, .3, 1);
}
// green cross with a ring that fills as a friend revives them
function drawRevive(a, rv) {
  a.rv = rv;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = 'rgba(43,45,66,.8)'; x.beginPath(); x.arc(64, 54, 40, 0, 7); x.fill();
  x.lineWidth = 8; x.strokeStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(64, 54, 40, 0, 7); x.stroke();
  if (rv > 0) { x.strokeStyle = '#7bd8b5'; x.beginPath(); x.arc(64, 54, 40, -Math.PI / 2, -Math.PI / 2 + rv * Math.PI * 2); x.stroke(); }
  x.fillStyle = '#7bd8b5'; x.fillRect(56, 32, 16, 44); x.fillRect(42, 46, 44, 16);
  x.font = '900 20px system-ui, sans-serif'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText(rv > 0 ? `${Math.round(rv * 100)}%` : 'REVIVE', 64, 122);
  a.rev.material.map?.dispose(); a.rev.material.map = new THREE.CanvasTexture(c); a.rev.material.map.colorSpace = THREE.SRGBColorSpace; a.rev.material.needsUpdate = true;
}
function removeAvatar(p) {
  if (!p.av) return;
  scene.remove(p.av.g, p.av.rev); disposeGroup(p.av.g); p.av.tag.material.map?.dispose(); p.av.rev.material.map?.dispose(); p.av = null;
}
