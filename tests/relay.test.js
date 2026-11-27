import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// The relay has its own packages (relay/package.json). Skip these tests until `npm install` has run in relay/.
let relay, WebSocket, skip = false;
try { relay = await import('../relay/server.js'); ({ WebSocket } = await import('../relay/node_modules/ws/wrapper.mjs')); }
catch { skip = 'run npm install in relay/ to test the relay'; }

let srv, url;
before(async () => { if (skip) return; srv = await relay.startRelay(0); url = `ws://127.0.0.1:${srv.port}`; });
after(() => srv?.close());

// a player: connects as the game's page would, and collects what the relay sends back
const player = (origin = 'https://www.pastelsiege.com') => new Promise((res, rej) => {
  const ws = new WebSocket(url, { origin }), got = [], waiters = [];
  ws.on('message', b => { const m = JSON.parse(b); got.push(m); waiters.splice(0).forEach(w => w()); });
  ws.on('close', () => { ws.closed = true; waiters.splice(0).forEach(w => w()); });
  ws.say = m => ws.send(JSON.stringify(m));
  // wait until a message matching f arrives (or the connection closes)
  ws.next = f => new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timed out: ' + JSON.stringify(got))), 2000);
    const check = () => { const i = got.findIndex(f); if (i >= 0) { clearTimeout(t); ok(got.splice(i, 1)[0]); } else if (ws.closed) { clearTimeout(t); ok(null); } else waiters.push(check); }; check(); });
  ws.on('open', () => res(ws)); ws.on('error', rej);
});

test('only the game\'s own pages may connect', { skip }, async () => {
  assert.ok(relay.originOk('https://www.pastelsiege.com'));
  assert.ok(relay.originOk('https://pastel-siege-git-main.vercel.app'));
  assert.ok(!relay.originOk('https://pastelsiege.com.evil.example'));
  assert.ok(!relay.originOk(''));
  await assert.rejects(player('https://evil.example'));
});

test('a friend joins, and messages pass both ways', { skip }, async () => {
  const host = await player(); host.say({ r: 'host', code: 'pink42' });
  assert.deepEqual(await host.next(m => m.r), { r: 'ok' });
  const again = await player(); again.say({ r: 'host', code: 'pink42' });
  assert.deepEqual(await again.next(m => m.r), { r: 'taken' }); again.close();

  const f = await player(); f.say({ r: 'join', code: 'pink42' });
  assert.deepEqual(await f.next(m => m.r), { r: 'ok' });
  const { id } = await host.next(m => m.r === 'conn');
  f.say({ r: 'd', d: { t: 'hello', name: 'Nova' } });
  assert.deepEqual(await host.next(m => m.r === 'from'), { r: 'from', id, d: { t: 'hello', name: 'Nova' } });
  host.say({ r: 'to', id, d: { t: 'roster' } });
  assert.deepEqual(await f.next(m => m.r === 'd'), { r: 'd', d: { t: 'roster' } });

  f.close();
  assert.deepEqual(await host.next(m => m.r === 'left'), { r: 'left', id });
  host.close();
});

test('wrong codes, full games, kicks and the host leaving', { skip }, async () => {
  const lost = await player(); lost.say({ r: 'join', code: 'nope99' });
  assert.deepEqual(await lost.next(m => m.r), { r: 'none' }); lost.close();

  const host = await player(); host.say({ r: 'host', code: 'mint7' }); await host.next(m => m.r === 'ok');
  const friends = [];
  for (let i = 0; i < 4; i++) { const f = await player(); f.say({ r: 'join', code: 'mint7' }); await f.next(m => m.r === 'ok'); friends.push(f); }
  const fifth = await player(); fifth.say({ r: 'join', code: 'mint7' });
  assert.deepEqual(await fifth.next(m => m.r), { r: 'full' }); fifth.close();

  const { id } = await host.next(m => m.r === 'conn');
  host.say({ r: 'kick', id });
  assert.equal(await friends[0].next(() => false), null, 'the kicked friend is disconnected');

  host.close();
  for (const f of friends.slice(1)) assert.deepEqual(await f.next(m => m.r === 'closed'), { r: 'closed' });
});

test('junk is ignored and floods are cut off', { skip }, async () => {
  const p = await player(); p.send('not json'); p.say({ r: 'host', code: 'x' }); // too short a code
  assert.equal(await p.next(() => false), null, 'a bad code closes the connection');
  const q = await player(); q.say({ r: 'host', code: 'sage5' }); await q.next(m => m.r === 'ok');
  for (let i = 0; i < 200; i++) q.say({ r: 'to', id: 1, d: i });
  assert.equal(await q.next(() => false), null);
});
