import test from 'node:test';
import assert from 'node:assert/strict';

import { WEAPONS, byId, PIP_TIERS, applyPipTier, ttk } from '../weapons_v95.js';
import { ATTACH, SLOTS, attById, compatible, computeWeapon, describe } from '../attachments_v95.js';

test('weapon ids are unique', () => {
  const ids = WEAPONS.map(w => w.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes, [], `duplicate weapon ids: ${dupes.join(', ')}`);
});

test('every weapon has valid core stats', () => {
  for (const w of WEAPONS) {
    assert.ok(w.name && w.cat, `${w.id} has a name and category`);
    assert.ok(Number.isFinite(w.dmg), `${w.id} damage is finite`);
    assert.ok(w.rpm > 0, `${w.id} fire rate is positive`);
    assert.ok(w.mag > 0 && Number.isInteger(w.mag), `${w.id} magazine is a positive integer`);
    assert.ok(w.reload > 0, `${w.id} reload time is positive`);
  }
});

test('admin guns keep working next to normal guns with the same name', () => {
  // The admin Leech used to share its id with the normal Leech MP, so both buttons handed over the SMG.
  assert.equal(byId('leech').name, 'Leech MP');
  assert.equal(byId('leechadmin').name, 'Leech');
  assert.equal(byId('leechadmin').admin, true);
});

test('Pip tiers improve the sidearm and stay finite', () => {
  const base = byId('pip');
  const max = applyPipTier(base, PIP_TIERS.length - 1);
  assert.ok(max.dmg > base.dmg);
  assert.ok(max.mag >= base.mag);
  assert.equal(max.pipTier, PIP_TIERS.length - 1);
  assert.equal(max.pierce, 1);
  for (const k of ['dmg', 'rpm', 'mag', 'reload', 'reserve', 'ads', 'hip', 'range']) {
    assert.ok(Number.isFinite(max[k]), `${k} stays finite`);
  }
});

test('attachment ids are unique and every slot is known', () => {
  const ids = ATTACH.map(a => a.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const a of ATTACH) {
    assert.ok(SLOTS.includes(a.slot), `${a.id} is in a real slot`);
    assert.ok(a.cats.length > 0, `${a.id} fits at least one category`);
    assert.ok(Number.isFinite(a.price) && a.price >= 0);
  }
});

test('every compatible weapon + attachment produces valid numbers', () => {
  for (const w of WEAPONS) {
    for (const a of ATTACH) {
      if (!compatible(a, w)) continue;
      const c = computeWeapon(w, { [a.slot]: a.id });
      for (const k of ['dmg', 'rpm', 'mag', 'reload', 'range', 'falloff', 'mobility', 'adsSpeed', 'wt']) {
        assert.ok(Number.isFinite(c[k]), `${w.id} + ${a.id}: ${k} is finite`);
      }
      assert.ok(Number.isInteger(c.mag) && c.mag >= 1, `${w.id} + ${a.id}: magazine is at least 1`);
      assert.ok(c.wt > 0, `${w.id} + ${a.id}: weight is positive`);
      assert.ok(c.mobility >= .5 && c.mobility <= 1.15, `${w.id} + ${a.id}: mobility is clamped`);
      assert.ok(c.falloff >= c.range + 5, `${w.id} + ${a.id}: falloff is past the range`);
    }
  }
});

test('describe() reports the real silencing distance', () => {
  const monolith = describe(attById('monolith')).map(x => x.t).join(' | ');
  assert.match(monolith, /10m/);
  assert.doesNotMatch(monolith, /14m/);
});

test('TTK card tells the truth about headshots', () => {
  // The card used to say "headshots one-tap" for every gun, even the Pip-9 (24 body / 48 head damage).
  const pip = ttk(byId('pip'));
  assert.match(pip.sub, /5 body shots/);
  assert.match(pip.sub, /3 headshots/);
  assert.doesNotMatch(pip.sub, /one-tap/);

  for (const w of WEAPONS) {
    if (w.projectile) continue;
    const per = w.dmg * (w.pellets || 1), need = Math.ceil(100 / (per * (w.head || 2)));
    const card = ttk(w).sub;
    if (need === 1) assert.match(card, /one-tap/, `${w.id} really can one-tap`);
    else assert.match(card, new RegExp(`${need} headshots`), `${w.id} needs ${need} headshots`);
  }
});
