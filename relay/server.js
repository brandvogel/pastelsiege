// Pastel Siege backup relay.
// Players normally connect straight to each other. When a network blocks that (school Wi-Fi), the game talks through
// this server instead, over a WebSocket. Behind a Cloudflare Tunnel it is reached as wss://relay.pastelsiege.com, which
// to the network looks like any secure website. It only passes messages along; the host's game still runs everything.
//
// Messages (JSON), matching the relay part of net_v*.js:
//   host  → { r:'host', code }        ← { r:'ok' } or { r:'taken' }
//   host  ← { r:'conn', id }          a friend joined          host → { r:'to', id, d }   send to that friend
//   host  ← { r:'from', id, d }       a friend sent something  host → { r:'kick', id }    disconnect that friend
//   host  ← { r:'left', id }          a friend left
//   friend → { r:'join', code }       ← { r:'ok' }, { r:'none' } (no such game) or { r:'full' }
//   friend → { r:'d', d }             to the host              ← { r:'d', d }  from the host
//   friend ← { r:'closed' }           the host left
import { WebSocketServer } from 'ws';
import { createServer } from 'node:http';

const PORT = +process.env.PORT || 8080;
// pages allowed to use the relay (the browser sends this as Origin; other websites are turned away)
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://pastelsiege.com,https://www.pastelsiege.com').split(',').map(s => s.trim()).filter(Boolean);
const ALLOW_PREVIEWS = process.env.ALLOW_PREVIEWS !== '0'; // Vercel preview links and localhost, for testing
const MAX_FRIENDS = 4, MAX_ROOMS = +process.env.MAX_ROOMS || 200, MAX_BYTES = 64 * 1024, MAX_PER_SEC = 120;
const CODE = /^[a-z0-9]{2,12}$/;

export function originOk(o) {
  if (!o) return false;
  if (ORIGINS.includes(o)) return true;
  if (!ALLOW_PREVIEWS) return false;
  try { const u = new URL(o); return /\.vercel\.app$/.test(u.hostname) || u.hostname === 'localhost' || u.hostname === '127.0.0.1'; } catch { return false; }
}

export function startRelay(port = PORT) {
  const rooms = new Map(); // code → { host: ws, friends: Map(id → ws), next: 1 }
  const http = createServer((req, res) => { // a plain web visit (or Cloudflare's health check) gets a short answer
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
    res.end(`Pastel Siege relay. ${rooms.size} game${rooms.size === 1 ? '' : 's'} open.\n`);
  });
  const wss = new WebSocketServer({ server: http, maxPayload: MAX_BYTES, verifyClient: ({ origin }) => originOk(origin) });
  const send = (ws, m) => { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); };

  wss.on('connection', ws => {
    ws.alive = true; ws.on('pong', () => { ws.alive = true; });
    let role = null, room = null, id = 0, count = 0, second = 0;
    ws.on('message', (raw, binary) => {
      // a flood (a broken or hostile page) is cut off; the game sends about 15 messages a second
      const now = Math.floor(Date.now() / 1000); if (now !== second) { second = now; count = 0; }
      if (++count > MAX_PER_SEC || binary) return ws.close(1008, 'too much');
      let m; try { m = JSON.parse(raw.toString()); } catch { return; }
      if (!m || typeof m !== 'object') return;
      if (!role) {
        const code = String(m.code || '');
        if (!CODE.test(code)) return ws.close(1008, 'bad code');
        if (m.r === 'host') {
          if (rooms.has(code)) return send(ws, { r: 'taken' });
          if (rooms.size >= MAX_ROOMS) return ws.close(1013, 'busy');
          role = 'host'; room = { code, host: ws, friends: new Map(), next: 1 }; rooms.set(code, room);
          return send(ws, { r: 'ok' });
        }
        if (m.r === 'join') {
          const r = rooms.get(code);
          if (!r) return send(ws, { r: 'none' });
          if (r.friends.size >= MAX_FRIENDS) return send(ws, { r: 'full' });
          role = 'friend'; room = r; id = r.next++; r.friends.set(id, ws);
          send(ws, { r: 'ok' }); return send(r.host, { r: 'conn', id });
        }
        return;
      }
      if (role === 'host') {
        const f = room.friends.get(m.id);
        if (m.r === 'to' && f) send(f, { r: 'd', d: m.d });
        else if (m.r === 'kick' && f) { room.friends.delete(m.id); f.close(1000, 'kicked'); }
      } else if (role === 'friend' && m.r === 'd') send(room.host, { r: 'from', id, d: m.d });
    });
    ws.on('close', () => {
      if (role === 'host' && rooms.get(room.code) === room) {
        rooms.delete(room.code);
        for (const f of room.friends.values()) { send(f, { r: 'closed' }); f.close(1000, 'host left'); }
      } else if (role === 'friend' && room.friends.get(id) === ws) {
        room.friends.delete(id); send(room.host, { r: 'left', id });
      }
    });
  });
  // drop connections that went silent (a closed laptop lid), so their games don't stay open forever
  const beat = setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 30000);
  wss.on('close', () => clearInterval(beat));
  return new Promise(res => http.listen(port, () => res({ http, wss, rooms, port: http.address().port, close: () => { clearInterval(beat); for (const c of wss.clients) c.terminate(); wss.close(); http.close(); } })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startRelay().then(s => console.log(`Pastel Siege relay on port ${s.port}. Allowed pages: ${ORIGINS.join(', ')}${ALLOW_PREVIEWS ? ', Vercel previews, localhost' : ''}`));
}
