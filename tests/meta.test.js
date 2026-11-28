import test from 'node:test';
import assert from 'node:assert/strict';

import { todayKey, yesterdayKey } from '../run_v0.99.1.js';
import { xpNeed, levelInfo, levelPerks, ensureDaily, questById, markPlayed, questTick, recordRun, nextReward } from '../meta_v0.99.1.js';

test('level info round-trips with the XP table', () => {
  let xp = 0;
  for (let lvl = 1; lvl <= 50; lvl++) {
    const info = levelInfo(xp);
    assert.equal(info.lvl, lvl);
    assert.equal(info.into, 0);
    assert.equal(info.need, xpNeed(lvl));
    xp += xpNeed(lvl);
    assert.equal(levelInfo(xp).lvl, lvl + 1);
  }
  assert.equal(levelInfo(0).lvl, 1);
  assert.equal(levelInfo(-5).lvl, 1, 'negative XP cannot fall below level 1');
});

test('level perks switch on at the advertised levels', () => {
  assert.equal(levelPerks(1).cash, 0);
  assert.equal(levelPerks(2).cash, 50);
  assert.equal(levelPerks(5).nades, 1);
  assert.equal(levelPerks(8).armor, 25);
  assert.equal(levelPerks(12).freeMut, true);
  assert.equal(levelPerks(15).nades, 2);
  assert.equal(levelPerks(20).armor, 50);
  assert.equal(levelPerks(25).spell, true);
  assert.equal(levelPerks(99).cash, 2500, 'starting cash is capped');
  assert.deepEqual(nextReward(1), [2, '+$50 starting cash every run (and +$50 more each level)']);
});

test('daily quests are three different objectives and stay put for the day', () => {
  const prog = {};
  assert.equal(ensureDaily(prog), true);
  const ids = prog.dq.quests.map(q => q.id);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 3);
  const stats = ids.map(id => questById(id).stat);
  assert.equal(new Set(stats).size, 3, 'no two quests count the same stat');
  assert.equal(ensureDaily(prog), false, 'the same day keeps the same quests');
  assert.deepEqual(prog.dq.quests.map(q => q.id), ids);
});

test('today two players get the same quests', () => {
  const a = {}, b = {};
  ensureDaily(a); ensureDaily(b);
  assert.deepEqual(a.dq.quests.map(q => q.id), b.dq.quests.map(q => q.id));
});

test('yesterday is a calendar day back, including month and leap-year edges', () => {
  assert.equal(todayKey(new Date(2024, 0, 1)), '2024-1-1');
  assert.equal(yesterdayKey(new Date(2024, 0, 1)), '2023-12-31');
  assert.equal(yesterdayKey(new Date(2024, 2, 1)), '2024-2-29', '2024 is a leap year');
  assert.equal(yesterdayKey(new Date(2023, 2, 1)), '2023-2-28');
});

test('a streak carries over from the previous calendar day', () => {
  const prog = { dq: { day: todayKey(), quests: [], streak: 4, lastPlay: yesterdayKey(), claimed: false } };
  assert.equal(markPlayed(prog), 500, 'day 5 pays 500 XP');
  assert.equal(prog.dq.streak, 5);
});

test('the daily streak only counts once per day', () => {
  const prog = {};
  assert.equal(markPlayed(prog), 100);
  assert.equal(markPlayed(prog), 0);
  assert.equal(prog.dq.lastPlay, todayKey());
});

test('a missed day resets the streak', () => {
  const prog = {
    dq: {
      day: '2000-1-1',
      quests: [],
      streak: 9,
      lastPlay: '2000-1-1',
      claimed: false,
    },
  };
  ensureDaily(prog);
  assert.equal(prog.dq.streak, 0);
  assert.notEqual(prog.dq.day, '2000-1-1');
});

test('quest progress accumulates, caps at the goal and fires once', () => {
  const prog = { dq: { day: todayKey(), quests: [{ id: 'k60', n: 0, done: false }], streak: 0 } };
  assert.deepEqual(questTick(prog, 'kills', 59), []);
  assert.equal(prog.dq.quests[0].n, 59);
  const done = questTick(prog, 'kills', 5);
  assert.equal(done.length, 1);
  assert.equal(done[0].id, 'k60');
  assert.equal(prog.dq.quests[0].n, 60);
  assert.equal(prog.dq.quests[0].done, true);
  assert.deepEqual(questTick(prog, 'kills', 5), [], 'a finished quest never fires again');
});

test('max-style quests take the highest value, not the total', () => {
  const prog = { dq: { day: todayKey(), quests: [{ id: 'f6', n: 0, done: false }], streak: 0 } };
  questTick(prog, 'floor', 3, true);
  questTick(prog, 'floor', 2, true);
  assert.equal(prog.dq.quests[0].n, 3);
});

test('the personal board keeps the ten best runs, highest first', () => {
  const prog = {};
  for (let i = 0; i < 12; i++) recordRun(prog, { score: i * 100, floor: i });
  assert.equal(prog.board.length, 10);
  for (let i = 1; i < prog.board.length; i++) assert.ok(prog.board[i - 1].score >= prog.board[i].score);
  assert.equal(prog.board[0].score, 1100);
});
