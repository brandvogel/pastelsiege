import test from 'node:test';
import assert from 'node:assert/strict';

import { generateMap, makeBuilder } from '../mapgen_v0.99.2.js';

const build = def => {
  const b = makeBuilder(def.seed);
  def.build(b);
  return b;
};

test('the same floor + seed always makes the same map', () => {
  const a = generateMap(7, 123456), b = generateMap(7, 123456);
  assert.equal(a.id, b.id);
  assert.equal(a.size, b.size);
  assert.equal(a.sizeId, b.sizeId);
  assert.deepEqual(build(a).boxes, build(b).boxes);
});

test('generated boxes and pads contain only finite, positive sizes', () => {
  for (let floor = 1; floor <= 25; floor++) {
    for (let seed = 1; seed <= 25; seed++) {
      const def = generateMap(floor, seed * 7919);
      const b = build(def);
      assert.ok(Number.isFinite(def.size) && def.size > 0);
      assert.ok(b.boxes.length > 0, `floor ${floor}/${seed} has geometry`);
      for (const box of b.boxes) {
        for (const k of ['x', 'z', 'w', 'd', 'h', 'y0']) assert.ok(Number.isFinite(box[k]), `floor ${floor}/${seed}: ${k}`);
        assert.ok(box.w > 0 && box.d > 0 && box.h > box.y0, `floor ${floor}/${seed}: box has volume`);
      }
      for (const pad of b.pads) {
        assert.ok(Number.isFinite(pad.x) && Number.isFinite(pad.z) && pad.r > 0, `floor ${floor}/${seed}: pad is valid`);
      }
    }
  }
});

test('the spawn pad is never inside a staircase or prop', () => {
  // Regression: on a few seeds a staircase reached into the spawn point.
  for (let floor = 1; floor <= 60; floor++) {
    for (let seed = 1; seed <= 60; seed++) {
      const def = generateMap(floor, seed * 7919);
      const b = build(def);
      const [x, z] = def.spawn;
      assert.ok(b.free(x, z, 1.4, 1.4, .35), `floor ${floor}, seed ${def.seed}: spawn is clear`);
      assert.ok(Math.abs(x) < def.size && Math.abs(z) < def.size, `floor ${floor}, seed ${def.seed}: spawn is inside the arena`);
    }
  }
});
