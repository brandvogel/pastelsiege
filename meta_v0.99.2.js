// Things that keep you coming back: a player level that carries across runs, three daily quests with a streak,
// and a personal leaderboard of your best runs. Everything lives in the saved progress object (prog).
import { todayKey, yesterdayKey } from './run_v0.99.2.js';

// ---- player level ----
export const xpNeed = l => 400 + l * 200;                 // XP to go from level l to l + 1
export function levelInfo(xp = 0) {
  let l = 1, left = xp; while (left >= xpNeed(l)) { left -= xpNeed(l); l++; }
  return { lvl: l, into: left, need: xpNeed(l) };
}
// what each level gives you at the start of every run
export function levelPerks(l) {
  return {
    cash: Math.min(50 * (l - 1), 2500),                    // +$50 starting cash per level (up to +$2,500)
    nades: (l >= 5 ? 1 : 0) + (l >= 15 ? 1 : 0),           // extra frag grenades
    armor: l >= 20 ? 50 : l >= 8 ? 25 : 0,                 // starting armour
    freeMut: l >= 12,                                     // a free mutation on your first gun
    spell: l >= 25,                                       // start the run with a random spell mutation on your sidearm
  };
}
export const LEVEL_REWARDS = [
  [2, '+$50 starting cash every run (and +$50 more each level)'],
  [5, 'Start every run with an extra frag grenade'],
  [8, 'Start every run with 25 armour'],
  [12, 'A free mutation at the start of every run'],
  [15, 'A third frag grenade'],
  [20, 'Start with 50 armour'],
  [25, 'Start every run with a spell mutation (Fireball, Meteor...) on your sidearm'],
];
export const nextReward = l => LEVEL_REWARDS.find(([at]) => at > l);
// XP for things you do (stat names match the lifetime stats the game already counts)
export const XP_FOR = { kills: 6, heads: 4, wardens: 120, titans: 400, paints: 60, spellsGot: 80, doors: 25 };
export const xpForFloor = f => 40 + f * 15;               // each new floor you reach in a run

// ---- daily quests ----
// [id, text, stat, goal, xp, cash] · cash is paid straight into your current run if you finish it mid-run
const QUESTS = [
  ['k60', 'Get 60 kills', 'kills', 60, 250, 400],
  ['k150', 'Get 150 kills', 'kills', 150, 500, 800],
  ['h25', 'Land 25 headshots', 'heads', 25, 300, 500],
  ['h60', 'Land 60 headshots', 'heads', 60, 550, 900],
  ['f6', 'Reach floor 6 in one run', 'floor', 6, 350, 600],
  ['f11', 'Reach floor 11 in one run', 'floor', 11, 700, 1200],
  ['w2', 'Kill 2 Wardens', 'wardens', 2, 400, 700],
  ['t1', 'Kill a Titan', 'titans', 1, 800, 1500],
  ['p3', 'Fill the paint meter 3 times', 'paints', 3, 350, 600],
  ['s15', 'Set off 15 spell mutations', 'spells', 15, 350, 500],
  ['d6', 'Go through 6 elevator doors', 'doors', 6, 300, 500],
  ['g10', 'Grapple 10 times', 'grapples', 10, 250, 400],
  ['e8k', 'Earn $8,000 in total', 'earned', 8000, 400, 0],
  ['st10', 'Get a 10-kill streak', 'streak', 10, 450, 700],
];
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// call on every menu visit: rolls over to new quests at midnight and keeps the streak going
export function ensureDaily(prog) {
  const day = todayKey(); let fresh = false;
  if (!prog.dq || prog.dq.day !== day) {
    let h = hash(day); const pool = QUESTS.slice(), list = [];
    while (list.length < 3) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; const q = pool.splice(h % pool.length, 1)[0]; if (!list.some(x => x[2] === q[2])) list.push(q); }
    const last = prog.dq?.lastPlay;
    prog.dq = { day, quests: list.map(q => ({ id: q[0], n: 0, done: false })), streak: prog.dq?.streak || 0, lastPlay: last, claimed: false };
    if (last && last !== day && last !== yesterdayKey()) prog.dq.streak = 0; // missed a day
    fresh = true;
  }
  return fresh;
}
export const questById = id => { const q = QUESTS.find(x => x[0] === id); return q && { id: q[0], text: q[1], stat: q[2], goal: q[3], xp: q[4], cash: q[5] }; };
// the streak counts once per day, the first time you start a run that day
export function markPlayed(prog) {
  ensureDaily(prog); const d = prog.dq; if (d.lastPlay === todayKey()) return 0;
  d.streak = d.lastPlay === yesterdayKey() ? d.streak + 1 : 1; d.lastPlay = todayKey();
  return streakXp(d.streak);
}
export const streakXp = s => 100 * Math.min(s, 7);           // day 1: 100 XP ... day 7+: 700 XP
// feed a stat change into today's quests; returns the quests that just finished
export function questTick(prog, stat, v, isMax) {
  if (!prog.dq) return [];
  const out = [];
  for (const q of prog.dq.quests) {
    const def = questById(q.id); if (!def || q.done || def.stat !== stat) continue;
    q.n = isMax ? Math.max(q.n, v) : q.n + v;
    if (q.n >= def.goal) { q.n = def.goal; q.done = true; out.push(def); }
  }
  return out;
}

// ---- personal leaderboard: your 10 best runs ----
export function recordRun(prog, run) {
  prog.board = (prog.board || []).concat([run]).sort((a, b) => b.score - a.score).slice(0, 10);
  return prog.board.indexOf(run); // 0 = new personal best, -1 = didn't make the board
}
