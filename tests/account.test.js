import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEmail, checkName, isPlaceholder } from '../account_v96.js';

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
