import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTIONS, setBinds, bindIn, rebind, keyLabel } from '../controls_v0.98.0.js';
import { XH_PRESETS, crosshairCode, parseCrosshair } from '../crosshair_v0.98.0.js';
import { MODS, ACH, doorOffers, upgCost, upgSpent, upgPoints, paintGoal, mulberry } from '../run_v0.98.0.js';
import { MUTATIONS, MV } from '../mutations_v0.98.0.js';
import { ABILITIES } from '../abilities_v0.98.0.js';
import { CHARMS } from '../charms_v0.98.0.js';

test('control actions and default keys are unique', () => {
  const ids = ACTIONS.map(a => a[0]);
  const keys = ACTIONS.map(a => a[3]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(keys).size, keys.length);
  for (const [, label, , def] of ACTIONS) {
    assert.ok(label && def, 'every action has a label and a default key');
  }
});

test('bindings translate real keys to game codes', () => {
  setBinds({});
  assert.equal(bindIn('KeyW'), 'KeyW');
  assert.equal(bindIn('Mouse0'), 'Mouse0');
  setBinds({ jump: 'KeyZ' });
  assert.equal(bindIn('KeyZ'), 'Space', 'the custom key reaches the jump action');
  assert.equal(bindIn('Space'), null, 'the old default is now unbound');
});

test('rebinding a used key swaps the two actions', () => {
  const binds = rebind({}, 'jump', 'KeyW');
  assert.equal(binds.jump, 'KeyW');
  assert.equal(binds.fwd, 'Space');
  setBinds(binds);
  assert.equal(bindIn('KeyW'), 'Space');
  assert.equal(bindIn('Space'), 'KeyW');
  assert.equal(keyLabel('jump'), 'W');
});

test('a cleared binding stays cleared', () => {
  setBinds({ jump: '' });
  assert.equal(bindIn('Space'), null);
  assert.equal(keyLabel('jump'), '—');
  setBinds({});
});

test('crosshair presets survive the share-code round trip', () => {
  for (const [name, cfg] of Object.entries(XH_PRESETS)) {
    const back = parseCrosshair(crosshairCode(cfg));
    assert.ok(back, `${name} parses`);
    for (const key of Object.keys(cfg)) assert.deepEqual(back[key], cfg[key], `${name}.${key}`);
  }
  assert.equal(parseCrosshair('not-a-code'), null);
  assert.equal(parseCrosshair('PS1-cross-zzzzzz-7-2-4-1101-100'), null);
});

test('crosshair values are clamped to sane limits', () => {
  const c = parseCrosshair('PS1-cross-fffaf0-999-999-999-1111-0');
  assert.equal(c.size, 20);
  assert.equal(c.thick, 6);
  assert.equal(c.gap, 20);
  assert.equal(c.opacity, .1);
});

test('elevator doors are always three different modifiers', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const offers = doorOffers(mulberry(seed));
    assert.equal(offers.length, 3);
    assert.equal(new Set(offers.map(m => m.id)).size, 3);
  }
  assert.deepEqual(doorOffers(mulberry(3)).map(m => m.id), doorOffers(mulberry(3)).map(m => m.id));
  assert.equal(new Set(MODS.map(m => m.id)).size, MODS.length);
});

test('upgrade point costs add up to 30 for a maxed track', () => {
  let total = 0;
  for (let l = 0; l < 10; l++) total += upgCost(l);
  assert.equal(total, 30);
  assert.equal(upgSpent({ hp: 10 }), 30);
  assert.equal(upgSpent({}), 0);
  assert.equal(upgPoints(1, {}), 0);
  assert.equal(upgSpent({ hp: 5 }), 9, '1 + 1 + 2 + 2 + 3');
  assert.equal(upgPoints(11, { hp: 5 }), 1, 'level 11 minus the 9 points spent in five HP levels');
});

test('achievements have unique ids and the legendary goal matches the list', () => {
  const ids = ACH.map(a => a[0]);
  assert.equal(new Set(ids).size, ids.length);
  const legendary = ACH.filter(a => a[5] === 'L');
  const legend = ACH.find(a => a[0] === 'legend');
  assert.equal(legend[4], legendary.length - 1, 'legend requires every other legendary badge');
});

test('paint goals rise with the floor and with each fill', () => {
  for (let floor = 1; floor <= 40; floor++) {
    assert.ok(paintGoal(floor, 0) < paintGoal(floor + 1, 0));
    for (let fills = 0; fills < 8; fills++) assert.ok(paintGoal(floor, fills) < paintGoal(floor, fills + 1));
  }
});

test('mutations and abilities are well formed', () => {
  const mutIds = MUTATIONS.map(m => m.id);
  assert.equal(new Set(mutIds).size, mutIds.length);
  for (const m of MUTATIONS) {
    assert.equal(m.v.length, 3, `${m.id} has three levels`);
    assert.ok(Number.isFinite(MV(m.id, 1)));
    assert.ok(Number.isFinite(MV(m.id, 2)));
    assert.ok(Number.isFinite(MV(m.id, 3)));
  }
  const abIds = ABILITIES.map(a => a.id);
  assert.equal(new Set(abIds).size, abIds.length);
  for (const a of ABILITIES) assert.ok(a.name && a.price >= 0);
  const charmIds = CHARMS.map(c => c.id);
  assert.equal(new Set(charmIds).size, charmIds.length);
  assert.equal(CHARMS[0].id, 'none', 'the default charm is first');
});
