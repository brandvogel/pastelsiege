// Accounts: sign in with an email and password, and keep your save online. Supabase stores the accounts (passwords
// are hashed, nobody can read them) and the saves. The game talks to it with plain fetch calls, no library.
// Each account has a real, confirmed email. The username is the public name; other players never see the email.
// Supabase must have "Confirm email" turned on, or addresses would be accepted without being checked.
// Playing without an account still works exactly as before.
// The key below is the "publishable" one: it's meant to be public. What players can do is decided by the database's
// row-level security rules (you can only read and write your own save, and nobody can make themselves admin).
const BASE = 'https://qembjixloxurcybpivli.supabase.co', KEY = 'sb_publishable_WkZwlljL0X3k_f6hYjvSUA_pAjc8ozO';
const STORE = 'sbPastelAuth', SYNC = 'sbPastelSync', PEND = 'sbPastelPending'; // not "ps..." names, so they stay out of save exports and cloud saves
export const account = { user: null, name: '', email: '', newEmail: '', needsEmail: false, role: '', admin: false, mod: false, tester: false, status: '', syncedAt: 0 };
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

// ---------- emails ----------
// Accounts made before emails were asked for have a placeholder address, <username>@players.pastelsiege.game, that
// can't receive anything. Those players sign in with their username one last time and then have to add a real email.
// Once no account uses a placeholder any more, everything that mentions OLD_DOMAIN can be deleted.
const OLD_DOMAIN = '@players.pastelsiege.game';
export const isPlaceholder = e => String(e || '').toLowerCase().endsWith(OLD_DOMAIN);
const cleanEmail = e => String(e || '').trim().toLowerCase();
export function checkEmail(e) {
  e = cleanEmail(e);
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || isPlaceholder(e)) return 'Type a real email address, like name@example.com.';
  return '';
}
// a short fingerprint of a save, to tell if it changed since the last upload
export function sig(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) + ':' + s.length; }
// the same things in a different order must give the same fingerprint (the browser and the database reorder them)
const ordered = v => Array.isArray(v) ? v.map(ordered) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordered(v[k])])) : v;
export const saveSig = data => sig(JSON.stringify(ordered(data)));
// A fingerprint of just your progress and saved run. Settings, backups and the daily quest list are left out: they
// differ between computers (or change just by opening the game) and aren't worth asking about.
export function progressSig(data) {
  const read = k => { try { const r = JSON.parse(data[k] || 'null'); return r?.d || r; } catch (e) { return data[k]; } };
  const { dq, ...progress } = read('pastelSiegeProgress9') || {};
  return saveSig({ progress, run: read('pastelSiegeRun1') });
}

// ---------- talking to Supabase ----------
let sess = null; try { sess = JSON.parse(localStorage.getItem(STORE)); } catch (e) { }
const keep = s => { sess = s; try { s ? localStorage.setItem(STORE, JSON.stringify(s)) : localStorage.removeItem(STORE); } catch (e) { } };
const stored = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch (e) { return null; } };
// another tab (like the one an email link opens) may have renewed this sign-in: take its newer tokens
const adopt = () => { const s = stored(); if (s && sess && s.uid === sess.uid && s.refresh_token !== sess.refresh_token) { sess = s; return true; } return false; };
async function call(path, { method = 'GET', body, auth = false, token, prefer, keepalive = false } = {}) {
  const h = { apikey: KEY, 'Content-Type': 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  if (auth) { await fresh(); if (!sess) throw new Error('You were signed out.'); h.Authorization = 'Bearer ' + sess.access_token; }
  if (prefer) h.Prefer = prefer;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined, keepalive });
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
  if (!r.ok) { const e = new Error(j?.msg || j?.message || j?.error_description || `Error ${r.status}`); e.status = r.status; e.code = j?.code || j?.error_code; throw e; }
  return j;
}
const session = (j, old = {}) => ({ ...old, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), uid: j.user?.id || old.uid, email: j.user?.email || old.email });
// sign-ins last an hour; swap for a new one a minute before it runs out
// (several requests can find it expired at once: they all wait for the same swap, as a used refresh token may be refused)
let refreshing = null;
function fresh() {
  adopt();
  if (!sess || sess.expires_at * 1000 - Date.now() > 60000) return;
  return refreshing ||= swapToken().finally(() => { refreshing = null; });
}
async function swapToken() {
  try { keep(session(await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } }), sess)); }
  catch (e) {
    if (e.status === 400 || e.status === 401) { if (adopt()) return; keep(null); clear(); }
    throw e;
  }
}
function clear() { account.user = null; account.name = ''; setEmail(); setRole(''); account.status = ''; account.syncedAt = 0; }
function setEmail(email = '', newEmail = '') { account.email = email; account.newEmail = newEmail; account.needsEmail = isPlaceholder(email); }
// asks the server which email the account has now, and whether a new one is waiting to be confirmed
export async function refreshUser() {
  const u = await call('/auth/v1/user', { auth: true });
  if (!sess) return;
  setEmail(u.email, u.new_email); adopt(); keep({ ...sess, email: u.email });
}
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
  adopt(); keep({ ...sess, name: account.name, role: account.role, admin: undefined, tester: undefined }); // remembered, so a bad connection does not hide your role
  setEmail(sess.email);
  try { await refreshUser(); } catch (e) { if (!sess) throw e; }
}
function nice(e, signup) {
  const m = (e.message || '').toLowerCase();
  if (e instanceof TypeError) return 'Could not reach the account server. Check your internet.';
  if (e.status === 429) return 'Too many tries. Wait a minute and try again.';
  if (e.code === 'email_exists' || m.includes('email address has already been registered')) return 'Another account already uses that email.';
  if (e.code === 'email_address_invalid') return 'That email address was refused. Check it, or use a different one.';
  if (e.code === 'email_address_not_authorized' || m.includes('error sending')) return 'The game could not send the email. Try again later.';
  if (signup && (e.code === 'user_already_exists' || m.includes('already registered') || m.includes('database error'))) return 'That username is taken.';
  if (m.includes('invalid login') || e.code === 'invalid_credentials') return 'Wrong email or password.';
  if (m.includes('password')) return 'Passwords need at least 6 characters.';
  return e.message || 'Something went wrong.';
}

// ---------- email links ----------
// the page the links in our emails bring people back to (it has to be on Supabase's list of allowed redirect URLs)
const back = () => typeof location !== 'undefined' && location.protocol.startsWith('http') ? '?redirect_to=' + encodeURIComponent(location.origin + location.pathname) : '';
// false while Supabase's "Confirm email" is off: it would then accept any address without checking it
export async function confirmsEmail() { return (await call('/auth/v1/settings'))?.mailer_autoconfirm === false; }
const pending = () => { try { return localStorage.getItem(PEND) || ''; } catch (e) { return ''; } };
const setPending = e => { try { e ? localStorage.setItem(PEND, e) : localStorage.removeItem(PEND); } catch (x) { } };
// Opening a link from one of our emails lands here with the result after the # in the address. Returns null for a
// normal visit. It only signs you in if this browser asked for the email, or is already signed in to that account,
// so a link somebody else sends you can't quietly put you into their account.
export async function finishLink() {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.hash.slice(1)), token = q.get('access_token'), error = q.get('error_description') || q.get('error'), message = q.get('message');
  if (!token && !error && !message) return null;
  history.replaceState(null, '', location.pathname + location.search); // keep the tokens out of the address bar and history
  if (error) return { error };
  if (!token) return { message };
  try {
    const u = await call('/auth/v1/user', { token });
    if (u.id !== sess?.uid && !(pending() && u.email === pending())) return { signedIn: false, email: u.email };
    keep(session({ access_token: token, refresh_token: q.get('refresh_token'), expires_at: +q.get('expires_at') || 0, expires_in: +q.get('expires_in') || 0, user: u }, u.id === sess?.uid ? sess : {}));
    setPending('');
    return { signedIn: true, email: u.email };
  } catch (e) { return { error: nice(e) }; }
}

// ---------- signing in and out ----------
// Makes the account and sends the confirmation email. You can sign in once the link in it has been opened.
export async function signUp(name, email, pass) {
  const bad = checkName(name) || checkEmail(email); if (bad) throw new Error(bad);
  name = name.trim().toLowerCase(); email = cleanEmail(email);
  if (String(pass || '').length < 6) throw new Error('Passwords need at least 6 characters.');
  try {
    if (!await confirmsEmail()) throw new Error('New accounts are paused while email confirmation is being set up. Try again later.');
    const taken = await call(`/rest/v1/profiles?username=eq.${name}&select=id`);
    if (taken?.length) throw new Error('That username is taken.');
    await call('/auth/v1/signup' + back(), { method: 'POST', body: { email, password: pass, data: { username: name } } });
  } catch (e) { throw new Error(e.status || e instanceof TypeError ? nice(e, true) : e.message); }
  setPending(email);
  return email;
}
export async function resendSignUp(email) {
  try { await call('/auth/v1/resend' + back(), { method: 'POST', body: { type: 'signup', email: cleanEmail(email) } }); }
  catch (e) { throw new Error(nice(e)); }
}
// "who" is an email. Accounts that haven't added one yet type their username instead.
export async function signIn(who, pass) {
  who = cleanEmail(who);
  if (!who || !pass) throw new Error('Type your email and password.');
  const byName = !who.includes('@');
  if (byName && !/^[a-z0-9_]{3,16}$/.test(who)) throw new Error('Type your email address.');
  try { keep(session(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: byName ? who + OLD_DOMAIN : who, password: pass } }))); await loadProfile(); setPending(''); return account; }
  catch (e) {
    keep(null); clear();
    const wrong = e.code === 'invalid_credentials' || /invalid login/i.test(e.message);
    const waiting = e.code === 'email_not_confirmed';
    const err = new Error(wrong && byName ? 'Wrong username or password. If your account has an email, sign in with that instead.' : waiting && byName ? 'This account was never finished. Create a new one with your email and a different username.' : waiting ? 'Confirm your email first: open the link we sent you.' : nice(e));
    err.unconfirmed = waiting && !byName; // an unfinished account with a made-up address has nowhere to send a link
    throw err;
  }
}
// Sends a confirmation link to the new address. The account keeps its old one until the link is opened.
export async function changeEmail(email) {
  const bad = checkEmail(email); if (bad) throw new Error(bad);
  email = cleanEmail(email);
  try {
    if (!await confirmsEmail()) throw new Error('Adding an email isn\'t switched on yet. Try again later.');
    await call('/auth/v1/user' + back(), { method: 'PUT', auth: true, body: { email } });
    await refreshUser();
  } catch (e) { throw new Error(e.status || e instanceof TypeError ? nice(e) : e.message); }
}
export async function signOut() {
  try { if (sess) await call('/auth/v1/logout', { method: 'POST', auth: true }); } catch (e) { }
  keep(null); clear(); // the sync record stays, so signing back in doesn't ask which save to keep
}
// on page load: pick up where you left off. Offline, you stay signed in with your saved name and sync later.
export async function resume() {
  if (!sess) return false;
  try { await fresh(); if (!sess) return false; await loadProfile(); return true; }
  catch (e) { if (!sess) return false; account.user = { id: sess.uid }; account.name = sess.name || ''; setEmail(sess.email); setRole(sess.role || (sess.admin ? 'owner' : sess.tester ? 'tester' : '')); account.status = 'offline'; return true; }
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
