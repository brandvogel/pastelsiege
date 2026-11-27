import { WEAPONS, CATS, GEAR, drawSilhouette, PIP_TIERS, ttk } from './weapons_v0.99.0.js';
export { ttk }; // the weapon card uses it, and weapons_v0.99.0 keeps it testable without the 3D imports
import { ATTACH, SLOT_NAMES, compatible, slotsFor, describe, attById, computeWeapon, LASER_COLS, LASER_LV } from './attachments_v0.99.0.js';
import { SKINS, TIER_COL, PERKS, MAX_LEVEL, levelOf, prog, skinUnlocked, drawSwatch, skinById } from './skins_v0.99.0.js';
import { SUPPORT } from './helpers_v0.99.0.js';
import { ABILITIES } from './abilities_v0.99.0.js';
import { CHARMS } from './charms_v0.99.0.js';
import { keyLabel } from './controls_v0.99.0.js';

// The buy menu. Left: sections. Middle: a list of everything in the section. Right: a big detail panel for the
// selected item, compared against what you're carrying now, with one big buy button.
const pct = v => Math.round(Math.max(.04, Math.min(1, v)) * 100);
// headline stats, each 0..1
const STAT = [
  ['Damage', w => w.projectile ? Math.min(1, w.projectile.dmg / 160) : (w.dmg * w.pellets) / 180],
  ['Fire rate', w => w.rpm / 1200],
  ['Accuracy', w => 1 - w.ads / .02],
  ['Control', w => 1 - w.recoilV / .1],
  ['Range', w => w.projectile ? .5 : w.range / 90],
  ['Mobility', w => (w.mobility - .55) / .5],
];
// Extra rows shown in the gunsmith, where small changes matter.
export function fineStats(w) {
  return [
    ['Vertical recoil', w.recoilV, .12, -1], ['Sideways recoil', w.recoilH, .03, -1], ['Hip-fire spread', w.hip, .12, -1], ['Aimed spread', w.ads, .015, -1],
    ['Consistency', w.bloom, .04, -1], ['Aim speed', w.adsSpeed, 10, 1], ['Scope sway', w.sway, 1.6, -1], ['Reload', w.emptyReload, 7, -1],
    ['Range', w.range, 200, 1], ['Mobility', w.mobility, 1.15, 1],
  ];
}
const modeName = m => ({ auto: 'Auto', semi: 'Semi', burst: 'Burst', bolt: 'Bolt', pump: 'Pump', lever: 'Lever' }[m]);
// icons from the set at the top of index.html
const ic = n => `<svg class="ic"><use href="#i-${n}"/></svg>`;
const ICON = Object.fromEntries(Object.entries({ Locker: 'locker', Melee: 'melee', Pistol: 'pistol', SMG: 'smg', Shotgun: 'shotgun', Rifle: 'rifle', Marksman: 'marksman', Sniper: 'sniper', LMG: 'lmg', Special: 'special', Gear: 'gearkit', Support: 'support', Abilities: 'bolt', Upgrade: 'up', Gunsmith: 'wrench' }).map(([k, v]) => [k, ic(v)]));
// Run locker: every gun you have this run (in your hands or swapped out), at the top so swapping back is one click
const SECTIONS = [['Weapons', ['Locker', ...CATS]], ['Equipment', ['Gear', 'Support', 'Abilities']], ['Workshop', ['Upgrade', 'Gunsmith']]];
const LABEL = { Locker: 'Run locker', Upgrade: 'Sidearm Workshop', Gear: 'Gear', Support: 'Support', Special: 'Special' };
const money = n => '$' + Math.round(n).toLocaleString();
const scopeName = s => s === 'iron' ? 'Iron sights' : s === 'dot' ? 'Red dot' : s === 'holo' ? 'Holo' : `${s} scope`;
function lvlBadge(id) {
  const L = levelOf(prog.xp[id] || 0), f = L.need ? L.into / L.need : 1;
  return `<div class="lvl"><b>LV ${L.level}</b><i><u style="width:${Math.round(f * 100)}%"></u></i></div>`;
}
function buyBtn(price, owned, cash, label = 'BUY', attr = '') {
  if (owned) return `<button class="bigbuy owned" disabled>${owned}</button>`;
  const ok = cash >= price;
  return `<button class="bigbuy" ${attr} ${ok ? '' : 'disabled'}>${ok ? `${label} <b>${price ? money(price) : 'FREE'}</b>` : `NEED ${money(price)} <small>${money(price - cash)} short</small>`}</button>`;
}
// stat bars with a ghost bar for the gun you're carrying (green = better, red = worse)
export function compareBars(w, vs) {
  return STAT.map(([k, f]) => {
    const v = f(w), b = vs ? f(vs) : null, d = b == null ? 0 : v - b;
    return `<div class="cb"><span>${k}</span><i>${b != null ? `<b class="ghost" style="width:${pct(b)}%"></b>` : ''}<b class="${d > .02 ? 'up' : d < -.02 ? 'down' : ''}" style="width:${pct(v)}%"></b></i><em class="${d > .02 ? 'up' : d < -.02 ? 'down' : ''}">${b == null || Math.abs(d) <= .02 ? '' : (d > 0 ? '▲' : '▼')}</em></div>`;
  }).join('');
}

const isW = t => t === 'Locker' || CATS.includes(t);
// which control each gear card's key hint refers to, so it shows your own keybind
const KEY_ACT = { scan: 'scan', dash: 'dash', grapple: 'grapple', djump: 'jump', slam: 'crouch', glide: 'jump' };
export class Shop {
  constructor(root, api) { this.root = root; this.api = api; this.tab = 'Rifle'; this.gs = 'primary'; this.gsTab = 'parts'; this.pick = {}; }
  open() { this.opened = false; this.lastCash = null; this.render(); this.opened = true; this.root.classList.add('on'); }
  // keyboard: ↑/↓ (or W/S) move through the list, ←/→ (or A/D) switch section, Enter buys the selected weapon
  key(code) {
    const tabs = SECTIONS.flatMap(s => s[1]), a = this.api;
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(code)) { const i = tabs.indexOf(this.tab), d = code === 'ArrowLeft' || code === 'KeyA' ? -1 : 1; this.tab = tabs[(i + d + tabs.length) % tabs.length]; a.ui?.(); this.render(); return true; }
    if (!isW(this.tab)) return false;
    const list = this.list(), i = list.findIndex(w => w.id === this.pick[this.tab]);
    if (!list.length) return false;
    if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(code)) {
      const d = code === 'ArrowUp' || code === 'KeyW' ? -1 : 1; this.pick[this.tab] = list[Math.max(0, Math.min(list.length - 1, i + d))].id; a.ui?.(); this.render();
      this.root.querySelector('.wrow.sel')?.scrollIntoView({ block: 'nearest' }); return true;
    }
    if (code === 'Enter') { const w = list[i]; if (w && !a.equipped(w.id)) { a.buyWeapon(w.id); this.render(); } return true; }
    return false;
  }
  close() { this.root.classList.remove('on'); }
  // the guns on a weapons page: the run locker shows what you're carrying first, then what's swapped out
  list(tab = this.tab) {
    const a = this.api;
    if (tab === 'Locker') return WEAPONS.filter(w => a.equipped(w.id) || a.inLocker?.(w.id)).sort((x, y) => (a.equipped(y.id) - a.equipped(x.id)) || (x.slot === y.slot ? 0 : x.slot === 'primary' ? -1 : 1) || x.price - y.price);
    return WEAPONS.filter(w => w.cat === tab).sort((x, y) => x.price - y.price);
  }
  // ---------- weapons ----------
  weaponsTab() {
    const a = this.api, cash = a.cash(), items = a.items(), list = this.list();
    if (!list.length) return '<div class="lockempty"><b>Nothing here yet</b><p>Every gun you buy this run shows up here, so you can swap back to it for free.</p></div>';
    const curId = this.pick[this.tab] && list.some(w => w.id === this.pick[this.tab]) ? this.pick[this.tab] : (list.find(w => a.equipped(w.id)) || list[0]).id;
    this.pick[this.tab] = curId;
    const rows = list.map(w => {
      const eq = a.equipped(w.id), own = a.inLocker?.(w.id), afford = own || cash >= w.price;
      return `<button class="wrow${w.id === curId ? ' sel' : ''}${eq ? ' eq' : ''}${afford || eq ? '' : ' poor'}" data-pick="${w.id}">
        <canvas width="150" height="46" data-sil="${w.id}"></canvas>
        <div class="wr-mid"><b>${w.name}</b><span>${w.modes.map(modeName).join(' / ')} · ${w.mag} rds${w.innate ? ' · <em>✦ built-in mutation</em>' : ''}</span></div>
        <div class="wr-right">${eq ? '<span class="eqtag">EQUIPPED</span>' : own ? '<span class="eqtag own">OWNED</span>' : `<span class="price">${w.price ? money(w.price) : 'FREE'}</span>`}${lvlBadge(w.id)}</div></button>`;
    }).join('');
    const w = WEAPONS.find(x => x.id === curId), eq = a.equipped(w.id), own = a.inLocker?.(w.id), mine = items[w.slot], vs = mine && mine.base.id !== w.id ? mine.w : null, T = ttk(w);
    const tags = [w.slot === 'secondary' ? 'Sidearm' : 'Primary', w.modes.map(modeName).join('/'), `${w.mag} rds`, scopeName(w.scope)]
      .concat(w.pellets > 1 ? [`${w.pellets} pellets`] : [], w.pierce ? [w.wallPierce ? 'Pierces walls' : `Pierces ${w.pierce}`] : [], w.projectile ? ['Explosive'] : [], w.spin ? ['Spin-up'] : [], w.quiet ? ['Silenced'] : []);
    const nums = [['Damage', w.projectile ? w.projectile.dmg : w.pellets > 1 ? `${Math.round(w.dmg)}×${w.pellets}` : Math.round(w.dmg)], ['RPM', Math.round(w.rpm)], ['Mag', w.mag], ['Reload', `${w.reload.toFixed(1)} s`], ['Range', w.projectile ? '—' : `${Math.round(w.range)} m`]];
    const detail = `<aside class="detail">
      <div class="dhero"><canvas width="520" height="150" data-sil="${w.id}" class="big"></canvas><div class="dlvl">${lvlBadge(w.id)}</div></div>
      <div class="dname"><span class="dcat">${ICON[w.cat] || ICON.Special} ${w.cat}</span><h3>${w.name}</h3></div>
      ${w.desc ? `<p class="ddesc">${w.desc}</p>` : ""}
      <div class="tags">${tags.map(t => `<span>${t}</span>`).join('')}${w.innate ? w.innate.map(id => `<span class="innate">✦ ${id}</span>`).join('') : ''}</div>
      <div class="ttk"><div><small>TIME TO KILL · 100 HP</small><b>${T.text}</b></div><span>${T.sub}</span></div>
      <div class="nums">${nums.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
      <div class="cbars">${compareBars(w, vs)}</div>
      <p class="dnote">${vs ? `Faint bars: your <b>${vs.name}</b>. It goes to your locker, so you can swap back for free.` : eq ? 'You\'re carrying this one.' : `Goes in your ${w.slot === 'secondary' ? 'sidearm' : 'primary'} slot.`}</p>
      ${own && !eq ? buyBtn(0, '', cash, 'EQUIP · OWNED', `data-buy="${w.id}"`) : buyBtn(w.price, eq ? 'EQUIPPED ✓' : '', cash, 'BUY', `data-buy="${w.id}"`)}
    </aside>`;
    return `<div class="split"><div class="wlist">${rows}</div>${detail}</div>`;
  }
  // ---------- gear, drones & abilities ----------
  cardsTab(list, kind) {
    const a = this.api, cash = a.cash();
    if (kind === 'gear') return `<div class="gcards">${list.map(g => {
      const s = a.gearStatus(g.id), icon = { armor: '⛨', medkit: '✚', frag: '●', ammo: '▤', nvg: '◉' }[g.id];
      return `<div class="gcard${s.full ? ' full' : ''}"><div class="gc-icon">${icon}</div><div class="gc-body"><b>${g.name}</b><p>${g.desc}</p>
        <div class="gc-stat">${s.text}${g.key ? ` · key <kbd>${g.key}</kbd>` : ''}</div></div>
        ${buyBtn(g.price, s.full ? 'FULL' : '', cash, 'BUY', `data-gear="${g.id}"`)}</div>`;
    }).join('')}</div>`;
    const isAb = kind === 'ability', max = g => g.up.length + 1;
    return `<div class="gcards lv">${list.map(g => {
      const l = isAb ? a.abLevel(g.id) : a.supLevel(g.id), m = max(g), price = l === 0 ? g.price : l < m ? g.up[l - 1] : null;
      const pips = `<div class="lpips">${Array.from({ length: m }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>`;
      const now = l ? g.fx(g, l) : 'Not owned', next = price != null ? g.fx(g, l + 1) : null;
      const stock = !isAb && g.charge && l ? `<div class="gc-stock">Charges <b>${a.supStock(g.id)} / ${g.stock}</b>
        ${a.supStock(g.id) < g.stock ? `<button class="mini${cash >= g.charge ? '' : ' poor'}" data-charge="${g.id}">+1 · ${money(g.charge)}</button>` : '<em>full</em>'}</div>` : '';
      const label = l === 0 ? 'BUY' : `UPGRADE → ${['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][l + 1]}`;
      return `<div class="gcard${price == null ? ' full' : ''}"><div class="gc-icon">${g.icon}</div><div class="gc-body"><b>${g.name} ${l ? `<sup>LV ${l}</sup>` : ''}</b>${pips}<p>${g.desc}</p>
        <div class="gc-stat"><span class="now">${now}</span>${next ? `<span class="nx">→ ${next}</span>` : ''}${g.key ? ` · <kbd>${KEY_ACT[g.id] ? keyLabel(KEY_ACT[g.id]) : g.key}</kbd>${g.alt ? ` <small>${g.alt}</small>` : ''}` : ''}</div>${stock}</div>
        ${price == null ? buyBtn(0, 'MAXED', cash) : buyBtn(price, '', cash, label, `${isAb ? 'data-ab' : 'data-sup'}="${g.id}"`)}</div>`;
    }).join('')}</div><p class="dnote">${isAb ? 'Abilities stay for the whole run. Dash comes free; upgrade it for shorter cooldowns and a second charge.' : 'Scans are charges you use up: upgrades make every charge stronger.'}</p>`;
  }
  // ---------- sidearm workshop ----------
  upgradeTab() {
    const a = this.api, cash = a.cash(), t = a.pipTier(), next = PIP_TIERS[t + 1], carrying = a.items().secondary?.base.id === 'pip';
    const steps = PIP_TIERS.map((T, i) => `<div class="ustep${i < t ? ' done' : i === t ? ' cur' : ''}${T.gold ? ' gold' : ''}"><i>${i <= t ? '✓' : i + 1}</i><b>${T.name.replace('Pip-9 ', '')}</b><small>${i ? money(T.price) : 'stock'}</small></div>`).join('<s></s>');
    const now = a.pipPreview(t), nx = next ? a.pipPreview(t + 1) : null;
    const row = (k, f, fmt) => `<div class="urow"><span>${k}</span><b>${fmt(f(now))}</b>${nx ? `<em class="${f(nx) !== f(now) ? 'chg' : ''}">→ ${fmt(f(nx))}</em>` : ''}</div>`;
    return `<div class="upg">
      <div class="uhead"><canvas width="520" height="150" data-sil="pip" class="big${t >= 5 ? ' goldsil' : ''}"></canvas>
        <div><div class="eyebrow">Your starting gun</div><h3>${PIP_TIERS[t].name}</h3><p class="dnote">Upgrade the Pip-9 step by step during a run. Each Mk makes it hit harder, hold more and fire faster; Mk III adds burst, Mk IV full auto.</p>
        ${carrying ? '' : '<p class="warn">You\'re not carrying the Pip-9 right now. Upgrades still apply whenever you pick it back up (it\'s free in Pistols).</p>'}</div></div>
      <div class="usteps">${steps}</div>
      <div class="ugrid"><div class="ustats">${row('Damage', w => Math.round(w.dmg), x => x)}${row('Fire rate', w => Math.round(w.rpm), x => `${x} rpm`)}${row('Magazine', w => w.mag, x => x)}${row('Modes', w => w.modes.map(modeName).join(' / '), x => x)}${row('Recoil', w => Math.round(w.recoilV * 1000), x => x)}${row('Reload', w => w.emptyReload.toFixed(2), x => `${x} s`)}</div>
        <div class="unext">${next ? `<div class="eyebrow">Next</div><h4>${next.name}</h4><p>${next.blurb}</p>${buyBtn(next.price, '', cash, 'UPGRADE', 'data-upg')}` : '<h4>Fully upgraded</h4><p>Pip Prime. It doesn\'t get better than this.</p>'}</div></div></div>`;
  }
  // ---------- gunsmith ----------
  gunsmith() {
    const a = this.api, items = a.items(), cash = a.cash();
    if (!items[this.gs]) this.gs = items.primary ? 'primary' : 'secondary';
    const it = items[this.gs];
    const pick = ['primary', 'secondary'].map(k => `<button class="pill${k === this.gs ? ' sel' : ''}" data-gs="${k}" ${items[k] ? '' : 'disabled'}><small>${k === 'primary' ? 'PRIMARY' : 'SIDEARM'}</small>${items[k] ? items[k].w.name : 'none'}</button>`).join('');
    if (!it) return `<div class="pills">${pick}</div><p class="dnote">Buy a weapon first.</p>`;
    const base = computeWeapon(it.base, {}), w = it.w, L = levelOf(prog.xp[it.base.id] || 0);
    const rows = fineStats(w).map(([k, v, max, dir], i) => {
      const b = fineStats(base)[i][1], better = dir > 0 ? v > b * 1.005 : v < b * .995, worse = dir > 0 ? v < b * .995 : v > b * 1.005;
      const norm = x => dir > 0 ? x / max : 1 - x / max;
      return `<div class="sb fine"><span>${k}</span><i><b class="ghost" style="width:${pct(norm(b))}%"></b><b class="${better ? 'up' : worse ? 'down' : ''}" style="width:${pct(norm(v))}%"></b></i></div>`;
    }).join('');
    const sub = [['parts', 'Attachments'], ['skins', 'Skins'], ['charms', 'Charms'], ['mastery', `Mastery · Lv ${L.level}`]].map(([k, n]) => `<button class="tab${this.gsTab === k ? ' sel' : ''}" data-gst="${k}">${n}</button>`).join('');
    let body = '';
    if (this.gsTab === 'parts') {
      body = slotsFor(it.base).map(s => {
        const fitted = it.att[s], opts = ATTACH.filter(x => x.slot === s && compatible(x, it.base));
        const cards = opts.map(o => {
          const on = fitted === o.id, mine = !on && a.ownsAttach?.(this.gs, o.id), afford = mine || cash >= o.price;
          const fx = describe(o).map(e => `<li class="${e.g ? 'g' : 'b'}">${e.t}</li>`).join('');
          return `<div class="att${on ? ' on' : ''}${mine ? ' mine' : ''}"><div class="an">${o.name}${mine ? ' <em class="owntag">OWNED</em>' : ''}</div><ul>${fx}</ul>
            ${on ? `<button class="buy ghostbtn" data-rm="${s}">REMOVE</button>` : `<button class="buy${mine ? ' ownbtn' : ''}" data-att="${o.id}" ${afford ? '' : 'disabled'}>${mine ? 'FIT · FREE' : afford ? `FIT ${money(o.price)}` : `NEED ${money(o.price)}`}</button>`}</div>`;
        }).join('');
        return `<div class="slotrow"><div class="sh"><b>${SLOT_NAMES[s]}</b><span>${fitted ? attById(fitted).name : s === 'optic' ? `Stock: ${scopeName(it.base.scope)}` : 'Empty'}</span></div><div class="atts">${cards}</div></div>`;
      }).join('') || '<p class="dnote">This weapon takes no attachments.</p>';
      // laser upgrades: only when a Laser Sight is fitted
      if (it.att.under === 'laser') {
        const lz = a.laserOf(this.gs), lv = lz.lv || 0, nx = LASER_LV[lv + 1], cols = lz.cols || ['red'];
        const sw = LASER_COLS.map(c => { const own = cols.includes(c.id), sel = (lz.col || 'red') === c.id;
          return `<button class="lzc${sel ? ' sel' : ''}${own || cash >= c.price ? '' : ' poor'}" data-lzc="${c.id}" title="${c.name}"><i style="${c.rainbow ? 'background:conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' : `background:#${c.col.toString(16).padStart(6, '0')}`}"></i><span>${c.name}</span><small>${own ? (sel ? 'ON' : 'OWNED') : money(c.price)}</small></button>`; }).join('');
        const pips = LASER_LV.map((L, i) => `<i class="${i <= lv ? 'on' : ''}" title="${L.name}"></i>`).join('');
        body += `<div class="slotrow lzrow"><div class="sh"><b>Laser upgrades</b><span>${LASER_LV[lv].name} · ${LASER_LV[lv].range} m dot · beam ${LASER_LV[lv].beam} m · hip spread −${Math.round((1 - LASER_LV[lv].hip) * 100)}%</span></div>
          <div class="lzlv"><div class="lpips">${pips}</div>${nx ? `<button class="buy" data-lzlv="1" ${cash >= nx.price ? '' : 'disabled'}>${cash >= nx.price ? `UPGRADE → ${nx.name} ${money(nx.price)}` : `NEED ${money(nx.price)}`}</button><small>Next: ${nx.range} m dot · ${nx.beam} m beam · hip spread −${Math.round((1 - nx.hip) * 100)}%</small>` : '<button class="buy" disabled>MAXED</button>'}</div>
          <div class="lzcols">${sw}</div></div>`;
      }
    } else if (this.gsTab === 'charms') {
      const curC = prog.charmOf[it.base.id] || 'none', own = prog.charms || ['none'];
      body = `<div class="skins">` + CHARMS.map(c => {
        const un = own.includes(c.id) || !c.price, on = curC === c.id, afford = cash >= c.price;
        const btn = on ? `<button class="buy ghostbtn" disabled>EQUIPPED</button>` : un ? `<button class="buy" data-ceq="${c.id}">EQUIP</button>`
          : `<button class="buy" data-charm="${c.id}" ${afford ? '' : 'disabled'}>${afford ? `BUY ${money(c.price)}` : `NEED ${money(c.price)}`}</button>`;
        return `<div class="skin charm${on ? ' on' : ''}${un ? '' : ' locked'}"><div class="cicon">${c.icon}</div><div class="skn"><b>${c.name}</b></div>${btn}</div>`;
      }).join('') + `</div><p class="dnote">Charms hang off the side of your gun and swing as you move. Bought charms are yours forever; pick one per gun.</p>`;
    } else if (this.gsTab === 'skins') {
      const curSkin = prog.skinOf[it.base.id] || 'factory';
      // cheapest first, mastery skins (earned by levelling) at the end
      const sorted = SKINS.filter(s => !s.level).sort((a, b) => (a.price || 0) - (b.price || 0)).concat(SKINS.filter(s => s.level));
      body = `<div class="skins">` + sorted.map(s => {
        const un = skinUnlocked(s, it.base.id), on = curSkin === s.id, afford = cash >= (s.price || 0);
        const btn = on ? `<button class="buy ghostbtn" disabled>EQUIPPED</button>`
          : un ? `<button class="buy" data-equip="${s.id}">EQUIP</button>`
          : s.level ? `<button class="buy" disabled>REACH LV ${s.level}</button>`
          : `<button class="buy" data-skin="${s.id}" ${afford ? '' : 'disabled'}>${afford ? `BUY ${money(s.price)}` : `NEED ${money(s.price)}`}</button>`;
        return `<div class="skin${on ? ' on' : ''}${un ? '' : ' locked'}"><canvas width="160" height="70" data-swatch="${s.id}"></canvas>
          <div class="skn"><b>${s.name}</b><span class="tier" style="--t:${TIER_COL[s.tier]}">${s.tier}</span></div>${btn}</div>`;
      }).join('') + `</div><p class="dnote">Bought skins are yours forever and fit every gun, cheapest first. Mastery skins unlock by levelling that gun.</p>`;
    } else {
      body = `<div class="mastery"><div class="mhead"><div class="bigl">LV ${L.level}<small>/ ${MAX_LEVEL}</small></div><div style="flex:1"><div class="xpbar"><u style="width:${L.need ? Math.round(L.into / L.need * 100) : 100}%"></u></div>
        <div class="gnote">${L.need ? `${L.into.toLocaleString()} / ${L.need.toLocaleString()} XP to level ${L.level + 1} · 100 XP per kill, +50 headshots` : 'Max level reached'}</div></div></div>
        <div class="perks">${PERKS.map(([l, txt]) => `<div class="perk${l <= L.level ? ' got' : ''}"><b>${l}</b><span>${txt}</span><i>${l <= L.level ? '✓' : '🔒'}</i></div>`).join('')}</div></div>`;
    }
    const skin = skinById(prog.skinOf[it.base.id] || 'factory');
    return `<div class="pills">${pick}</div>
      <div class="gsgrid"><div class="gsstats"><canvas width="260" height="80" data-sil="${it.base.id}"></canvas>
        <div class="wname">${w.name}</div>${lvlBadge(it.base.id)}
        <div class="tags"><span>${w.wt} kg</span><span>${w.mag} rds</span><span>${scopeName(w.scope)}</span><span>Skin: ${skin.name}</span>${w.quiet ? '<span>Silenced</span>' : ''}${w.bipod ? '<span>Bipod</span>' : ''}</div>
        <div class="bars">${rows}</div><p class="gnote">Faint bar = stock gun. Green = better, red = worse. Weight slows movement and aiming.</p></div>
      <div class="gsslots"><div class="tabs gstabs">${sub}</div>${body}</div></div>`;
  }
  render() {
    const a = this.api, cash = a.cash(), items = a.items(), keepScroll = this.root.querySelector('.wlist')?.scrollTop || 0, keepMain = this.root.querySelector('.s2main')?.scrollTop || 0;
    const count = c => c === 'Locker' ? this.list('Locker').length : WEAPONS.filter(w => w.cat === c).length;
    const nav = SECTIONS.map(([h, list]) => `<h6>${h}</h6>` + list.map(c => `<button class="nav${c === this.tab ? ' sel' : ''}" data-tab="${c}"><i>${ICON[c]}</i><span>${LABEL[c] || c}</span>${isW(c) ? `<small>${count(c)}</small>` : c === 'Upgrade' ? `<small class="mk">Mk ${a.pipTier() + 1}</small>` : ''}</button>`).join('')).join('');
    const main = isW(this.tab) ? this.weaponsTab() : this.tab === 'Gear' ? this.cardsTab(GEAR, 'gear') : this.tab === 'Support' ? this.cardsTab(SUPPORT, 'support') : this.tab === 'Abilities' ? this.cardsTab(ABILITIES, 'ability') : this.tab === 'Upgrade' ? this.upgradeTab() : this.gunsmith();
    const load = ['primary', 'secondary'].map(k => { const it = items[k]; return `<div class="lchip${it ? '' : ' empty'}"><small>${k === 'primary' ? 'PRIMARY' : 'SIDEARM'}</small>${it ? `<canvas width="120" height="34" data-sil="${it.base.id}"></canvas><b>${it.w.name}</b>` : '<b>—</b>'}</div>`; }).join('');
    const spent = this.lastCash != null && cash < this.lastCash; this.lastCash = cash;
    this.root.innerHTML = `<div class="shopcard s2${this.opened ? " still" : ""}">
      <header class="s2head"><div class="st"><div class="eyebrow">Armoury · Floor ${a.floor()}</div><h2>Buy menu</h2></div>
        <div class="loadout">${load}</div>
        <div class="cash${spent ? " spent" : ""}"><small>CASH</small>${money(cash)}</div><button class="x" data-close><span class="gol">${ic('close')}CLOSE</span> <kbd>${keyLabel('shop')}</kbd></button></header>
      <div class="s2body"><nav class="s2nav">${nav}
        <div class="codewrap"><div class="codebox"><input id="shopCode" placeholder="Code" maxlength="20" autocomplete="off"><button data-redeem>OK</button></div><div class="codemsg">${this.msg || ''}</div></div></nav>
        <main class="s2main">${main}</main></div>
      <footer class="s2foot"><span>↑ ↓ pick · ← → section · Enter or double-click to buy · ${keyLabel('shop')} close</span><span>Buying a gun swaps it in with full ammo · the game is paused while you shop</span></footer></div>`;
    // real 3D renders of the guns (same models as in your hands); the flat drawing shows until the render is ready
    this.root.querySelectorAll('canvas[data-sil]').forEach(c => { const wd = c.dataset.sil === 'pip' && c.classList.contains('goldsil') ? { ...WEAPONS.find(w => w.id === 'pip'), model: { kind: 'pistol', color: 0xd4a73a, accent: 0xfff1c0 } } : WEAPONS.find(w => w.id === c.dataset.sil); if (!wd) return; if (a.thumb) a.thumb(c, wd); else drawSilhouette(c, wd); });
    this.root.querySelectorAll('canvas[data-swatch]').forEach(c => drawSwatch(c, SKINS.find(s => s.id === c.dataset.swatch)));
    const wl = this.root.querySelector('.wlist'); if (wl) wl.scrollTop = keepScroll; const mn = this.root.querySelector('.s2main'); if (mn) mn.scrollTop = keepMain;
    const on = (sel, fn, sound = true) => this.root.querySelectorAll(sel).forEach(b => b.onclick = () => { fn(b); if (sound) a.ui?.(); this.render(); });
    on('[data-tab]', b => { this.tab = b.dataset.tab; });
    on('[data-pick]', b => { this.pick[this.tab] = b.dataset.pick; });
    this.root.querySelectorAll('[data-pick]').forEach(b => b.ondblclick = () => { const w = WEAPONS.find(x => x.id === b.dataset.pick); if (!a.equipped(w.id) && (a.inLocker?.(w.id) || a.cash() >= w.price)) { a.buyWeapon(w.id); this.render(); } });
    on('[data-gs]', b => { this.gs = b.dataset.gs; });
    on('[data-gst]', b => { this.gsTab = b.dataset.gst; });
    on('[data-buy]', b => a.buyWeapon(b.dataset.buy), false);
    on('[data-gear]', b => a.buyGear(b.dataset.gear), false);
    on('[data-sup]', b => a.buySupport(b.dataset.sup), false);
    on('[data-ab]', b => a.buyAbility(b.dataset.ab), false);
    on('[data-charge]', b => a.buyCharge(b.dataset.charge), false);
    on('[data-upg]', () => a.buyPipTier(), false);
    on('[data-att]', b => a.buyAttach(this.gs, b.dataset.att), false);
    on('[data-rm]', b => a.removeAttach(this.gs, b.dataset.rm));
    on('[data-lzc]', b => a.buyLaserCol(this.gs, b.dataset.lzc), false);
    on('[data-lzlv]', () => a.buyLaserLv(this.gs), false);
    on('[data-skin]', b => a.buySkin(this.gs, b.dataset.skin), false);
    on('[data-equip]', b => a.equipSkin(this.gs, b.dataset.equip));
    on('[data-charm]', b => a.buyCharm(this.gs, b.dataset.charm), false);
    on('[data-ceq]', b => a.equipCharm(this.gs, b.dataset.ceq), false);
    this.root.querySelector('[data-close]').onclick = () => a.close();
    const code = this.root.querySelector('#shopCode'), redeem = () => { this.msg = a.redeem(code.value); this.render(); };
    this.root.querySelector('[data-redeem]').onclick = redeem; code.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') redeem(); };
  }
}
