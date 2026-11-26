// Accounts: sign in with a username and password, and keep your save online. Supabase stores the accounts (passwords
// are hashed, nobody can read them) and the saves. The game talks to it with plain fetch calls, no library.
// Supabase needs an email for each account, so a username becomes a made-up address behind the scenes; nobody types one.
// Playing without an account still works exactly as before.
// The key below is the "publishable" one: it's meant to be public. What players can do is decided by the database's
// row-level security rules (you can only read and write your own save, and nobody can make themselves admin).
const BASE = 'https://qembjixloxurcybpivli.supabase.co', KEY = 'sb_publishable_WkZwlljL0X3k_f6hYjvSUA_pAjc8ozO';
const STORE = 'sbPastelAuth', SYNC = 'sbPastelSync'; // not "ps..." names, so they stay out of save exports and cloud saves
export const account = { user: null, name: '', role: '', admin: false, mod: false, tester: false, status: '', syncedAt: 0 };
// Ranks: owner (you) > admin > moderator > bug tester. Who may do what is checked by the database's functions, not by the
// game, so editing the game can't give anyone powers. The game only uses the role to show the right buttons.
export const RANK = { owner: 4, admin: 3, mod: 2, tester: 1 };
export const ROLE_NAME = { owner: 'OWNER', admin: 'ADMIN', mod: 'MOD', tester: 'TESTER' };
export const rank = r => RANK[r] || 0;
function setRole(r) { account.role = RANK[r] ? r : ''; account.admin = rank(r) >= 3; account.mod = rank(r) >= 2; account.tester = r === 'tester'; }
// staff can open the cheat panel in runs: owner, admins and bug testers. Moderators only get the kick button.
export const staff = () => !!account.user && (account.admin || account.tester);

// ---------- usernames ----------
const BAD = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'slut', 'whore', 'dick', 'cock', 'pussy', 'porn', 'rape', 'nazi', 'hitler', 'penis', 'vagina', 'sex'];
export function checkName(n) {
  n = String(n || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,16}$/.test(n)) return 'Usernames are 3 to 16 letters, numbers or _ (no spaces).';
  if (BAD.some(b => n.includes(b))) return 'Pick a different username.';
  return '';
}
const mail = n => `${n}@players.pastelsiege.game`;
// a short fingerprint of a save, to tell if it changed since the last upload
export function sig(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) + ':' + s.length; }

// ---------- talking to Supabase ----------
let sess = null; try { sess = JSON.parse(localStorage.getItem(STORE)); } catch (e) { }
const keep = s => { sess = s; try { s ? localStorage.setItem(STORE, JSON.stringify(s)) : localStorage.removeItem(STORE); } catch (e) { } };
async function call(path, { method = 'GET', body, auth = false, prefer, keepalive = false } = {}) {
  const h = { apikey: KEY, 'Content-Type': 'application/json' };
  if (auth) { await fresh(); if (!sess) throw new Error('You were signed out.'); h.Authorization = 'Bearer ' + sess.access_token; }
  if (prefer) h.Prefer = prefer;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined, keepalive });
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
  if (!r.ok) { const e = new Error(j?.msg || j?.message || j?.error_description || `Error ${r.status}`); e.status = r.status; e.code = j?.code || j?.error_code; throw e; }
  return j;
}
const session = (j, old = {}) => ({ ...old, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), uid: j.user?.id || old.uid });
// sign-ins last an hour; swap for a new one a minute before it runs out
async function fresh() {
  if (!sess || sess.expires_at * 1000 - Date.now() > 60000) return;
  try { keep(session(await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } }), sess)); }
  catch (e) { if (e.status === 400 || e.status === 401) { keep(null); clear(); } throw e; }
}
function clear() { account.user = null; account.name = ''; setRole(''); account.status = ''; account.syncedAt = 0; }
// the old setup only had is_admin / is_tester; until the roles script runs, the admin counts as the owner
export const roleOf = p => RANK[p?.role] ? p.role : p?.is_admin ? 'owner' : p?.is_tester ? 'tester' : '';
async function loadProfile() {
  // (role and is_tester only exist once their setup scripts have run; if asking for them fails for any reason, ask
  // with less, so a half-finished setup can never stop the owner from being recognised)
  let rows;
  for (const cols of ['username,is_admin,is_tester,role', 'username,is_admin,is_tester', 'username,is_admin']) {
    try { rows = await call(`/rest/v1/profiles?id=eq.${sess.uid}&select=${cols}`, { auth: true }); break; }
    catch (e) { if (e.status === 401 || cols === 'username,is_admin') throw e; }
  }
  account.user = { id: sess.uid }; account.name = rows?.[0]?.username || sess.name || ''; setRole(roleOf(rows?.[0]));
  keep({ ...sess, name: account.name, role: account.role, admin: undefined, tester: undefined }); // remembered, so a bad connection does not hide your role
}
function nice(e, signup) {
  const m = (e.message || '').toLowerCase();
  if (e instanceof TypeError) return 'Could not reach the account server. Check your internet.';
  if (e.status === 429) return 'Too many tries. Wait a minute and try again.';
  if (signup && (e.code === 'user_already_exists' || m.includes('already registered') || m.includes('database error'))) return 'That username is taken.';
  if (m.includes('invalid login') || e.code === 'invalid_credentials') return 'Wrong username or password.';
  if (m.includes('password')) return 'Passwords need at least 6 characters.';
  return e.message || 'Something went wrong.';
}

// ---------- signing in and out ----------
export async function signUp(name, pass) {
  const bad = checkName(name); if (bad) throw new Error(bad);
  name = name.trim().toLowerCase();
  if (String(pass || '').length < 6) throw new Error('Passwords need at least 6 characters.');
  let j;
  try {
    const taken = await call(`/rest/v1/profiles?username=eq.${name}&select=id`);
    if (taken?.length) throw new Error('That username is taken.');
    j = await call('/auth/v1/signup', { method: 'POST', body: { email: mail(name), password: pass, data: { username: name } } });
  } catch (e) { throw new Error(e.status || e instanceof TypeError ? nice(e, true) : e.message); }
  if (!j?.access_token) throw new Error('Your account was made, but it\'s waiting for an email confirmation. Turn off "Confirm email" in Supabase (Authentication > Sign In / Providers > Email), then sign in.');
  keep(session(j)); await loadProfile(); return account;
}
export async function signIn(name, pass) {
  name = String(name || '').trim().toLowerCase();
  if (!name || !pass) throw new Error('Type your username and password.');
  try { keep(session(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: mail(name), password: pass } }))); await loadProfile(); return account; }
  catch (e) { keep(null); clear(); throw new Error(nice(e)); }
}
export async function signOut() {
  try { if (sess) await call('/auth/v1/logout', { method: 'POST', auth: true }); } catch (e) { }
  keep(null); clear(); try { localStorage.removeItem(SYNC); } catch (e) { }
}
// on page load: pick up where you left off. Offline, you stay signed in with your saved name and sync later.
export async function resume() {
  if (!sess) return false;
  try { await fresh(); if (!sess) return false; await loadProfile(); return true; }
  catch (e) { if (!sess) return false; account.user = { id: sess.uid }; account.name = sess.name || ''; setRole(sess.role || (sess.admin ? 'owner' : sess.tester ? 'tester' : '')); account.status = 'offline'; return true; }
}

// ---------- online saves ----------
export async function cloudGet() { const r = await call(`/rest/v1/saves?user_id=eq.${sess.uid}&select=data,updated_at`, { auth: true }); return r?.[0]?.data || null; }
export async function cloudPut(data, keepalive = false) {
  await call('/rest/v1/saves?on_conflict=user_id', { method: 'POST', auth: true, keepalive, prefer: 'resolution=merge-duplicates,return=minimal', body: { user_id: sess.uid, data, updated_at: new Date().toISOString() } });
}
// what this computer last swapped with the account: { uid, at, sig }
export const syncInfo = () => { try { return JSON.parse(localStorage.getItem(SYNC)) || {}; } catch (e) { return {}; } };
export const setSync = o => { try { localStorage.setItem(SYNC, JSON.stringify(o)); } catch (e) { } };

// ---------- friends ----------
// Friend requests live in the "friends" table: a asked b, and b accepting makes it a friendship. Who's online comes
// from "last seen", which the game updates about every 45 seconds while you have it open (with your co-op code if
// you're hosting, so friends can join in one click). Only your accepted friends can see when you were last on.
export const friendList = () => call('/rest/v1/rpc/my_friends', { method: 'POST', auth: true, body: {} }).then(r => r || []);
// ping answers with the time you're kicked until (or nothing). Before the roles script it answers nothing at all.
export const ping = code => call('/rest/v1/rpc/ping', { method: 'POST', auth: true, body: { code: code || null } });
export async function addFriend(name) {
  name = String(name || '').trim().toLowerCase();
  if (!name) throw new Error('Type their username.');
  if (name === account.name) throw new Error('That\'s you!');
  let rows;
  try { rows = await call(`/rest/v1/profiles?username=eq.${encodeURIComponent(name)}&select=id,username`); }
  catch (e) { throw new Error(nice(e)); }
  const them = rows?.[0]; if (!them) throw new Error(`Nobody called "${name}" yet.`);
  const list = await friendList(), had = list.find(f => f.id === them.id);
  if (had?.accepted) throw new Error(`You're already friends with ${them.username}.`);
  if (had && !had.incoming) throw new Error(`You already asked ${them.username}. Waiting for them to accept.`);
  if (had && had.incoming) { await acceptFriend(them.id); return `You and ${them.username} are friends now!`; } // they asked you first
  try { await call('/rest/v1/friends', { method: 'POST', auth: true, prefer: 'return=minimal', body: { a: sess.uid, b: them.id } }); }
  catch (e) { throw new Error(e.status === 409 ? `You already asked ${them.username}.` : nice(e)); }
  return `Friend request sent to ${them.username}.`;
}
export const acceptFriend = id => call(`/rest/v1/friends?a=eq.${id}&b=eq.${sess.uid}`, { method: 'PATCH', auth: true, prefer: 'return=minimal', body: { accepted: true } });
export const removeFriend = id => call(`/rest/v1/friends?or=(and(a.eq.${id},b.eq.${sess.uid}),and(a.eq.${sess.uid},b.eq.${id}))`, { method: 'DELETE', auth: true, prefer: 'return=minimal' });

// ---------- bug testers (only the admin can change who's a tester; the database checks that, not the game) ----------
export const testerList = () => call('/rest/v1/profiles?is_tester=eq.true&select=username&order=username', { auth: true }).then(r => (r || []).map(x => x.username));
// every account, newest first, for the admin page. ready = false means the tester setup script hasn't been run yet
export async function playerList() {
  // admin_players() also says who's online and who's hosting (with their co-op code); only the admin may call it
  try { return { ready: true, live: true, rows: (await call('/rest/v1/rpc/admin_players', { method: 'POST', auth: true, body: {} })) || [] }; } catch (e) { }
  const q = '/rest/v1/profiles?order=created_at.desc&limit=1000&select=username,is_admin,created_at';
  try { return { ready: true, live: false, rows: (await call(q + ',is_tester', { auth: true })) || [] }; }
  catch (e) { return { ready: false, live: false, rows: ((await call(q, { auth: true })) || []).map(r => ({ ...r, is_tester: false })) }; }
}
export async function setTester(name, on) {
  name = String(name || '').trim().toLowerCase(); if (!name) throw new Error('Type their username.');
  try { await call('/rest/v1/rpc/set_tester', { method: 'POST', auth: true, body: { name, on_: !!on } }); }
  catch (e) { throw new Error(e.message?.includes('not allowed') ? 'Only the admin can do that.' : e.message?.includes('no player') ? `Nobody called "${name}".` : nice(e)); }
}

// ---------- roles and kicking (the roles setup script makes these; the database checks your rank every time) ----------
// owners can hand out admin, moderator and tester; admins can hand out moderator and tester; nobody can touch someone
// at their own rank or above
const staffErr = (e, name) => {
  const m = e.message || '';
  if (e.status === 404 || e.code === 'PGRST202') return 'Run the new setup script on the ADMIN page first.';
  if (m.includes('not allowed')) return 'Your rank can\'t do that to them.';
  if (m.includes('no player')) return `Nobody called "${name}".`;
  return nice(e);
};
export async function giveRole(name, role) {
  try { await call('/rest/v1/rpc/set_role', { method: 'POST', auth: true, body: { name, role_: role || '' } }); }
  catch (e) { throw new Error(staffErr(e, name)); }
}
// kicks them out of their game (and any co-op game) and stops them playing for a while. minutes 0 lets them back in.
export async function kick(name, minutes) {
  try { await call('/rest/v1/rpc/kick', { method: 'POST', auth: true, body: { name, minutes } }); }
  catch (e) { throw new Error(staffErr(e, name)); }
}

// ---------- the global leaderboard (signed-in players only) ----------
// A finished run goes up through submit_score, which checks the numbers look possible and that you aren't sending
// lots at once. Players can't write to the scores table directly. top_scores gives each player's best run.
export const submitScore = s => call('/rest/v1/rpc/submit_score', { method: 'POST', auth: true, keepalive: true, body: { score_: s.score, floor_: s.floor, kills_: s.kills, secs_: s.secs, mode_: s.mode } });
export async function topScores(mode) {
  try { return { ready: true, rows: (await call('/rest/v1/rpc/top_scores', { method: 'POST', auth: true, body: { mode_: mode || 'all' } })) || [] }; }
  catch (e) { if (e.status === 404 || e.code === 'PGRST202' || e.code === '42P01') return { ready: false, rows: [] }; throw new Error(nice(e)); }
}
export async function clearScores(name) {
  try { await call('/rest/v1/rpc/clear_scores', { method: 'POST', auth: true, body: { name } }); }
  catch (e) { throw new Error(staffErr(e, name)); }
}

// ---------- chat mutes (moderators and up) ----------
// muted players can still play, but the co-op host won't pass their chat messages on
export async function mute(name, minutes) {
  try { await call('/rest/v1/rpc/mute', { method: 'POST', auth: true, body: { name, minutes } }); }
  catch (e) { throw new Error(staffErr(e, name)); }
}
// when each of these players is muted until (anyone can ask, so a host who isn't signed in can still check)
export async function muteInfo(names) {
  names = names.map(n => String(n || '').toLowerCase()).filter(n => /^[a-z0-9_]{3,16}$/.test(n)); if (!names.length) return [];
  return (await call(`/rest/v1/profiles?username=in.(${names.join(',')})&select=username,muted_until`)) || [];
}
