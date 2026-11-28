import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEmail, checkName, isPlaceholder, saveSig, progressSig } from '../account_v0.99.1.js';

test('real email addresses are accepted', () => {
  for (const e of ['name@example.com', '  Name.Surname+game@mail.example.co.uk ']) assert.equal(checkEmail(e), '', e);
});

test('bad and placeholder email addresses are refused', () => {
  for (const e of ['', 'name', 'name@', '@example.com', 'name@example', 'a b@example.com', 'a@b@example.com', 'player@players.pastelsiege.game', 'Player@Players.PastelSiege.Game'])
    assert.notEqual(checkEmail(e), '', e);
});

test('only the old made-up addresses count as placeholders', () => {
  assert.equal(isPlaceholder('player@players.pastelsiege.game'), true);
  assert.equal(isPlaceholder('player@example.com'), false);
  assert.equal(isPlaceholder(undefined), false);
});

test('usernames keep their rules', () => {
  assert.equal(checkName('pastel_7'), '');
  assert.notEqual(checkName('name@example.com'), '');
});

const save = (progress, extra = {}) => ({ pastelSiegeProgress9: JSON.stringify({ d: progress, s: 'x' }), ...extra });

test('save fingerprints ignore the order things are stored in', () => {
  assert.equal(saveSig({ a: '1', b: '2' }), saveSig({ b: '2', a: '1' }));
  assert.notEqual(saveSig({ a: '1' }), saveSig({ a: '2' }));
  assert.equal(progressSig(save({ pxp: 5, kills: 2 })), progressSig(save({ kills: 2, pxp: 5 })));
});

test('settings, backups and daily quests are not a difference in progress', () => {
  const a = save({ pxp: 5, dq: { day: 'mon' } }, { pastelSiegeSettings12: '{"fov":80}', psAC: '1' });
  const b = save({ pxp: 5, dq: { day: 'tue' } }, { pastelSiegeSettings12: '{"fov":100}', 'pastelSiegeProgress9~': 'zzz' });
  assert.equal(progressSig(a), progressSig(b));
});

test('real progress and saved runs are a difference', () => {
  assert.notEqual(progressSig(save({ pxp: 5 })), progressSig(save({ pxp: 6 })));
  assert.notEqual(progressSig(save({ pxp: 5 })), progressSig(save({ pxp: 5 }, { pastelSiegeRun1: '{"d":{"floorN":3}}' })));
});
