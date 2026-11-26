// Weapon mutations: during a run, every gun evolves as you rack up kills with it.
// At each milestone you pick one of three offers: a new mutation (level I) or a level up of one you already have.
// Each mutation has 3 levels and starts out mild; level III is the strong version.
// v[] holds the numbers for levels I, II and III.
export const MUTATIONS = [
  { id: 'homing', name: 'Seeker Rounds', icon: '◎', col: '#ff4fd8', v: [.02, .035, .055], pull: [.35, .55, .75],
    d: l => l === 1 ? 'Shots bend slightly toward a body close to your aim.' : `Shots bend toward a head within ${['', '', 'a small', 'a wider'][l]} circle around your aim.` },
  { id: 'ricochet', name: 'Ricochet', icon: '↯', col: '#4fd1c5', v: [.3, .5, .75], dm: [.4, .55, .7],
    d: l => `${pct(MV('ricochet', l))} chance wall hits bounce into the nearest bot for ${pct(MV('ricochet', l, 'dm'))} damage.` },
  { id: 'volatile', name: 'Volatile', icon: '✹', col: '#ff8c42', v: [.3, .6, 1], dm: [40, 55, 75], r: [3, 3.8, 4.5],
    d: l => `${pct(MV('volatile', l))} chance a kill explodes for ${MV('volatile', l, 'dm')} damage in ${MV('volatile', l, 'r')} m.` },
  { id: 'arc', name: 'Arc Current', icon: 'ϟ', col: '#7dd3ff', v: [1, 2, 3], dm: [.2, .28, .38], r: [5, 7, 9],
    d: l => `Hits zap ${MV('arc', l)} nearby bot${l > 1 ? 's' : ''} (within ${MV('arc', l, 'r')} m) for ${pct(MV('arc', l, 'dm'))} damage.` },
  { id: 'vampire', name: 'Vampire', icon: '♥', col: '#d6453d', v: [3, 5, 8], dm: [6, 10, 15],
    d: l => `Kills heal ${MV('vampire', l)} HP. Headshot kills heal ${MV('vampire', l, 'dm')}.` },
  { id: 'incendiary', name: 'Incendiary', icon: '♨', col: '#ff6b3d', v: [.2, .3, .45],
    d: l => `Hits set bots on fire for ${pct(MV('incendiary', l))} of the hit as burn over 3 s.` },
  { id: 'cryo', name: 'Cryo', icon: '❄', col: '#9cc5d6', v: [.25, .4, .55], dm: [1.5, 2, 2.5],
    d: l => `Hits slow bots by ${pct(MV('cryo', l))} for ${MV('cryo', l, 'dm')} s.` },
  { id: 'split', name: 'Splitter', icon: '⑂', col: '#f2cc8f', v: [.15, .25, .35],
    d: l => `${pct(MV('split', l))} chance each shot fires a bonus bullet.` },
  { id: 'hollow', name: 'Hollow Point', icon: '●', col: '#e07a5f', v: [.1, .18, .25],
    d: l => `+${pct(MV('hollow', l))} damage. Kills get messier.` },
  { id: 'overclock', name: 'Overclock', icon: '»', col: '#ffe14d', v: [.08, .14, .2],
    d: l => `+${pct(MV('overclock', l))} fire rate.` },
  { id: 'bottomless', name: 'Bottomless', icon: '∞', col: '#81b29a', v: [.08, .14, .2],
    d: l => `${pct(MV('bottomless', l))} chance a shot costs no ammo.` },
  { id: 'drill', name: 'Drill Tip', icon: '➤', col: '#8d8676', v: [1, 1, 2], dm: [.75, .9, .9],
    d: l => `Bullets punch through ${MV('drill', l)} extra bot${MV('drill', l) > 1 ? 's' : ''}${l > 1 ? ', losing less damage' : ''}.` },
  { id: 'bloodthirst', name: 'Bloodthirst', icon: '▲', col: '#b32222', v: [.03, .045, .06], dm: [.3, .45, .6],
    d: l => `Each kill this wave adds +${pct(MV('bloodthirst', l))} damage, up to +${pct(MV('bloodthirst', l, 'dm'))}.` },
  { id: 'drum', name: 'Drum Feed', icon: '▤', col: '#5b8fd6', v: [.15, .28, .4],
    d: l => `+${pct(MV('drum', l))} magazine size.` },
  { id: 'quick', name: 'Quick Hands', icon: '↻', col: '#7dff8a', v: [.12, .24, .35],
    d: l => `Reloads ${pct(MV('quick', l))} faster.` },
  // spell mutations: they cast themselves when the trigger happens (cd = seconds before the same gun can cast it again)
  { id: 'fireball', name: 'Fireball', icon: '🔥', col: '#ff8c42', spell: true, v: [.1, .14, .2], dm: [45, 65, 90], r: [2.6, 3.1, 3.6], cd: [2.5, 2, 1.5],
    d: l => `${pct(MV('fireball', l))} chance a hit hurls a fireball at the bot: ${MV('fireball', l, 'dm')} damage in ${MV('fireball', l, 'r')} m and sets them on fire.` },
  { id: 'thunder', name: 'Thunderstrike', icon: '⚡', col: '#ffe14d', spell: true, v: [9, 7, 5], dm: [40, 55, 75], r: [2, 3, 5],
    d: l => `Every ${MV('thunder', l)}th hit calls lightning on the bot for ${MV('thunder', l, 'dm')} damage, jumping to ${MV('thunder', l, 'r')} more.` },
  { id: 'meteor', name: 'Meteor Call', icon: '☄', col: '#d6453d', spell: true, v: [.15, .22, .32], dm: [80, 115, 160], r: [3.5, 4.2, 5], cd: [4, 3, 2],
    d: l => `${pct(MV('meteor', l))} chance a kill drops a meteor on the nearest other bot: ${MV('meteor', l, 'dm')} damage in ${MV('meteor', l, 'r')} m.` },
  { id: 'nova', name: 'Frost Nova', icon: '✳', col: '#9cc5d6', spell: true, v: [.25, .4, .6], dm: [1.5, 2.2, 3], r: [4.5, 5.5, 7],
    d: l => `${pct(MV('nova', l))} chance a kill freezes every bot within ${MV('nova', l, 'r')} m for ${MV('nova', l, 'dm')} s.` },
  { id: 'blackhole', name: 'Black Hole', icon: '🌀', col: '#8a6cff', spell: true, v: [.35, .55, .8], dm: [40, 60, 90], r: [6, 7.5, 9], cd: [6, 5, 4],
    d: l => `${pct(MV('blackhole', l))} chance a headshot kill opens a black hole that pulls bots in for 2 s, then pops for ${MV('blackhole', l, 'dm')} damage.` },
];
export const MAX_MLV = 3;
const pct = x => Math.round(x * 100) + '%';
export const ROMAN = ['', 'I', 'II', 'III'];
export const mutById = id => MUTATIONS.find(m => m.id === id);
// value of a mutation's stat at a level (k = which list: v, dm, r, pull)
export function MV(id, lvl, k = 'v') { const m = mutById(id); if (!m || !lvl) return 0; const a = m[k]; return a[Math.min(lvl, a.length) - 1]; }
export const mutDesc = (id, lvl) => mutById(id)?.d(lvl) || '';
// kills with that gun (this run) needed for each pick
export const MUT_STEPS = [10, 24, 40, 60, 85, 115, 150, 190, 235, 285, 340, 400, 470, 550, 640];
export const nextStep = mk => MUT_STEPS.find(s => s > mk) ?? null;

// ml = { id: level } (all mutations on the gun, built-in ones included). Stat mutations change the weapon's numbers.
export function applyMuts(w, ml = {}) {
  const o = { ...w, ml: { ...ml }, muts: Object.keys(ml) };
  o.dmg *= 1 + MV('hollow', ml.hollow);
  o.rpm *= 1 + MV('overclock', ml.overclock);
  if (ml.drum) o.mag = Math.ceil(o.mag * (1 + MV('drum', ml.drum)));
  if (ml.quick) { const k = 1 - MV('quick', ml.quick); o.reload *= k; o.emptyReload *= k; if (o.shell) o.shell *= k; }
  if (ml.drill) o.pierce = (o.pierce || 0) + MV('drill', ml.drill);
  return o;
}
// three random offers: new mutations at level I, or level ups of ones the gun has (projectile launchers skip bullet-only ones)
export function offers(ml, projectile, n = 3) {
  const pool = [];
  for (const m of MUTATIONS) {
    if (projectile && ['ricochet', 'homing', 'drill', 'split'].includes(m.id)) continue;
    const cur = ml[m.id] || 0;
    if (cur >= MAX_MLV) continue;
    pool.push({ m, lvl: cur + 1, w: cur ? 1.6 : 1 });   // level ups show up a bit more often
  }
  const out = [];
  while (out.length < n && pool.length) {
    const tot = pool.reduce((s, p) => s + p.w, 0); let x = Math.random() * tot, i = 0;
    for (; i < pool.length - 1; i++) { x -= pool[i].w; if (x <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
