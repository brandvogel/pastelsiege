import test from 'node:test';
import assert from 'node:assert/strict';

// skins_v0.99.2.js reads localStorage as soon as it loads (to build `prog`), so install a fake one first.
const store = new Map();
globalThis.localStorage = {
  get length() { return store.size; },
  key: i => [...store.keys()][i] ?? null,
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
};

const { sealSave, openSave, dropSave, tamper } = await import('../skins_v0.99.2.js');

const KEY = 'testSave';
const reset = () => { store.clear(); tamper.keys.length = 0; };
const raw = k => JSON.parse(store.get(k));

test('sealSave -> openSave round-trips the object', () => {
  reset();
  const data = { pxp: 1234, skins: ['factory', 'gold'], xp: { pip: 99 }, nested: { ok: true } };
  sealSave(KEY, data);
  assert.deepEqual(openSave(KEY), data);
  assert.ok(store.has(KEY + '~'), 'a scrambled backup copy is written');
  assert.equal(store.get('psSeal'), '1');
});

test('a tampered main save is replaced by the backup', () => {
  reset();
  const data = { pxp: 500, skins: ['factory'] };
  sealSave(KEY, data);
  const bad = raw(KEY);
  bad.d.pxp = 999999;
  bad.s = 'not-the-real-checksum';
  store.set(KEY, JSON.stringify(bad));

  assert.deepEqual(openSave(KEY), data);
  assert.deepEqual(raw(KEY).d, data, 'the good copy was written back');
});

test('a deleted main save is restored from the backup', () => {
  reset();
  const data = { pxp: 42 };
  sealSave(KEY, data);
  store.delete(KEY);
  assert.deepEqual(openSave(KEY), data);
});

test('a legacy (pre-checksum) save is migrated, not wiped', () => {
  // Regression: the `if (...) return raw;` line used to be swallowed by a trailing // comment.
  reset();
  const old = { pxp: 777, skins: ['factory', 'chrome'], bestFloor: 12 };
  store.set(KEY, JSON.stringify(old));

  assert.deepEqual(openSave(KEY), old);
  assert.deepEqual(tamper.keys, [], 'an honest upgrade is not flagged as tampering');
});

test('a plain save is rejected once this browser has had a sealed save', () => {
  reset();
  store.set(KEY, JSON.stringify({ pxp: 1 }));
  store.set('psSeal', '1');

  assert.equal(openSave(KEY), null);
  assert.deepEqual(tamper.keys, [KEY]);
  assert.equal(store.has(KEY), false, 'the unprotected copy is removed');
});

test('garbage in storage is treated as no save', () => {
  reset();
  store.set(KEY, '{not json');
  assert.equal(openSave(KEY), null);
  dropSave(KEY);
  assert.equal(store.has(KEY), false);
});
