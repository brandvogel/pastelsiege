// Run-level systems: elevator doors (floor modifiers), playable characters, achievements, the Daily Tower and the paint meter.

// ---------- elevator doors ----------
// After every floor you pick one of three doors. Each one bends the rules for the next floor and pays out differently.
// cash = multiplier on everything you earn that floor.
export const MODS = [
  { id: 'calm', name: 'Quiet Floor', icon: '☁', col: '#9cc5d6', twist: 'No twist. Just a normal floor.', cash: 1 },
  { id: 'moon', name: 'Moon Floor', icon: '☾', col: '#c8b6ff', twist: 'Low gravity: you jump about twice as high and float.', cash: 1.2 },
  { id: 'hard', name: 'Hardened', icon: '⛨', col: '#5b7fa6', twist: 'Bots have +70% health.', cash: 2 },
  { id: 'chain', name: 'Chain Reaction', icon: '✹', col: '#ff8c42', twist: 'Every bot explodes when it dies. That includes near you.', cash: 1.6 },
  { id: 'glass', name: 'Glass Cannon', icon: '◇', col: '#7dd3ff', twist: 'Every bot dies in one hit. You take triple damage.', cash: 1.8 },
  { id: 'swarm', name: 'Swarm', icon: '⁂', col: '#81b29a', twist: 'Twice as many bots, half the health each.', cash: 1.4 },
  { id: 'alley', name: 'Sniper Alley', icon: '⊕', col: '#f2cc8f', twist: 'Most bots are snipers. Watch for red lasers.', cash: 1.6 },
  { id: 'sweat', name: 'Sweat Lobby', icon: '☠', col: '#ff2a6b', twist: 'Bots play at full Sweat skill for this floor.', cash: 3 },
  { id: 'blood', name: 'Bloodbath', icon: '♥', col: '#d6453d', twist: 'Kills heal you 6 HP, but you get no healing between waves.', cash: 1.3 },
  { id: 'over', name: 'Overdrive', icon: '⚡', col: '#ffe14d', twist: 'You and every bot move 35% faster.', cash: 1.3 },
  { id: 'gene', name: 'Mutagen', icon: '✦', col: '#e07a5f', twist: 'Your guns get a free mutation pick each. Less cash.', cash: .8 },
  { id: 'heads', name: 'Big Heads', icon: '◉', col: '#fffaf0', twist: 'Bot heads are huge. Headshots are easy. Less cash.', cash: .8 },
  { id: 'paint', name: 'Paint Party', icon: '🎨', col: '#ff9ecf', twist: 'Paint fills twice as fast, and every fill pays double.', cash: 1.1 },
];
export const modById = id => MODS.find(m => m.id === id) || MODS[0];
// three different doors. The rng lets the Daily Tower give everyone the same doors.
export function doorOffers(rng = Math.random) {
  const pool = MODS.slice(1), out = [];
  while (out.length < 3) { const m = pool.splice(Math.floor(rng() * pool.length), 1)[0]; out.push(m); }
  if (rng() < .35) out[Math.floor(rng() * 3)] = MODS[0];
  return out;
}

// ---------- the character ----------
// There's one climber. You make them stronger with upgrade points: one for every player level you reach.
export const CHARS = [
  { id: 'rookie', name: 'Rookie', col: '#e07a5f', perk: 'Upgrade max health and speed with points from player levels.', unlock: null },
];
export const charById = () => CHARS[0];
export const charUnlocked = () => true;
export const PERK = { rookie: {} };
// Upgrades: each track has 10 levels. Level n costs ceil(n / 2) points (1, 1, 2, 2, 3, 3, 4, 4, 5, 5 = 30 to max one track).
export const UPGRADES = [
  { id: 'hp', name: 'Max Health', icon: '♥', col: '#e07a5f', max: 10, per: 10, text: l => `${100 + l * 10} max HP` },
  { id: 'spd', name: 'Speed', icon: '»', col: '#4fd1c5', max: 10, per: .03, text: l => `+${l * 3}% move speed` },
];
export const upgCost = lvl => Math.ceil((lvl + 1) / 2);            // points to go from lvl to lvl + 1
export const upgSpent = u => UPGRADES.reduce((s, U) => { let t = 0; for (let l = 0; l < (u[U.id] || 0); l++) t += upgCost(l); return s + t; }, 0);
export const upgPoints = (playerLevel, u) => Math.max(0, playerLevel - 1 - upgSpent(u)); // level 1 = 0 points

// ---------- achievements ----------
// [id, name, how, stat, goal]. Lifetime stats live in prog.life; run stats are checked with `r.`.
export const ACH = [
  ['first', 'First Blood', 'Get your first kill', 'kills', 1],
  ['k100', 'Scrap Collector', 'Get 100 kills', 'kills', 100],
  ['k1000', 'Recycling Plant', 'Get 1,000 kills', 'kills', 1000],
  ['k5000', 'Extinction Event', 'Get 5,000 kills', 'kills', 5000],
  ['h100', 'Pop Pop', 'Land 100 headshots', 'heads', 100],
  ['h1000', 'Head Hunter', 'Land 1,000 headshots', 'heads', 1000],
  ['f5', 'Stairwell', 'Reach floor 5', 'floor', 5],
  ['f10', 'Titan Slayer', 'Beat a Titan', 'titans', 1],
  ['f20', 'Penthouse', 'Reach floor 20', 'floor', 20],
  ['f30', 'Above the Clouds', 'Reach floor 30', 'floor', 30],
  ['warden', 'Jailbreak', 'Kill a Warden', 'wardens', 1],
  ['w25', 'Warden Collector', 'Kill 25 Wardens', 'wardens', 25],
  ['sweat', 'They Learned', 'Make the bots reach Sweat tier', 'sweat', 1],
  ['paint', 'Interior Decorator', 'Paint the tower', 'paints', 1],
  ['paint10', 'Masterpiece', 'Paint the tower 10 times', 'paints', 10],
  ['mut', 'Evolution', 'Max a mutation to level III', 'maxmut', 1],
  ['rich', 'Loaded', 'Earn $150,000 in total', 'earned', 150000],
  ['mil', 'Millionaire', 'Earn $1,000,000 in total', 'earned', 1000000],
  ['doors', 'Door Enthusiast', 'Walk through 25 elevator doors', 'doors', 25],
  ['glass', 'Fragile', 'Clear a Glass Cannon floor', 'glass', 1],
  ['sweatfl', 'Sweatshop', 'Clear a Sweat Lobby floor', 'sweatfl', 1],
  ['grap', 'Spider-Bot', 'Grapple 100 times', 'grapples', 100],
  ['slam', 'Meteor', 'Kill 3 bots with one Ground Slam', 'slam3', 1],
  ['streak', 'Untouchable', 'Get a 25 kill streak', 'streak', 25],
  ['prime', 'Pip Prime', 'Fully upgrade the Pip-9', 'pipmax', 1],
  ['train', 'Graduate', 'Finish training', 'trained', 1],
  ['daily', 'Daily Climber', 'Play a Daily Tower', 'dailies', 1],
  // Legendary: the 6th field marks them. Meant to take weeks of play or real skill.
  ['f50', 'Stratosphere', 'Reach floor 50', 'floor', 50, 'L'],
  ['k25000', 'Total Recall', 'Get 25,000 kills', 'kills', 25000, 'L'],
  ['h5000', 'Surgeon', 'Land 5,000 headshots', 'heads', 5000, 'L'],
  ['s100', 'Ghost', 'Get a 100 kill streak without getting hit', 'streak', 100, 'L'],
  ['t25', 'Titan Tamer', 'Kill 25 Titans', 'titans', 25, 'L'],
  ['chain12', 'Decimator', 'Get 12 kills in one chain (under 1.8 s between each)', 'chain', 12, 'L'],
  ['long150', 'Across the Map', 'Kill a bot from 150 m away (no explosions)', 'longest', 150, 'L'],
  ['flawless', 'Not a Scratch', 'Clear floor 15 or higher without taking any damage', 'flawless', 1, 'L'],
  ['sidearm', 'Sidearm Supremacy', 'Reach floor 15 without ever owning a primary', 'pistolfl', 15, 'L'],
  ['mad', 'Mad Scientist', 'Get 4 mutations to level III on one gun', 'mut3n', 4, 'L'],
  ['glass10', 'Porcelain', 'Clear 10 Glass Cannon floors', 'glass', 10, 'L'],
  ['day30', 'Devoted', 'Play 30 days in a row', 'daystreak', 30, 'L'],
  ['lvl50', 'Living Legend', 'Reach player level 50', 'plevel', 50, 'L'],
  ['legend', 'Pastel Legend', 'Unlock every other Legendary badge', 'legends', 13, 'L'],
];

// ---------- daily tower ----------
// Same maps and doors for everyone on the same day (by local date).
const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export const todayKey = (d = new Date()) => dayKey(d);
// A calendar day back, not "24 hours back": on the day after a clock change the two are not the same,
// which used to break the daily streak once a year.
export const yesterdayKey = (d = new Date()) => { const y = new Date(d); y.setDate(y.getDate() - 1); return dayKey(y); };
export const dailySeed = () => { let h = 2166136261; for (const c of 'pastel' + todayKey()) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- paint the tower ----------
// Gore counts. Fill the meter on a floor to get a payout, a free mutation and a short frenzy.
export const paintGoal = (fl, fills) => Math.round((45 + fl * 4) * Math.pow(1.6, fills));
