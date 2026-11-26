// Custom crosshair: drawn as an SVG from the player's settings. The arms spread with your real weapon spread.
export const XH_STYLES = [['cross', 'Cross'], ['t', 'T-shape'], ['circle', 'Circle'], ['box', 'Box'], ['chevron', 'Chevron'], ['dot', 'Dot only']];
export const XH_COLORS = ['#fffaf0', '#4fd1c5', '#7dff8a', '#f2cc8f', '#ffe14d', '#e07a5f', '#ff4fd8', '#ff3b30', '#5b8fd6', '#2b2d42'];
export const XH_DEFAULT = { style: 'cross', color: '#fffaf0', size: 7, thick: 2, gap: 4, outline: true, dot: true, dynamic: true, opacity: 1, enemyRed: true };
export const XH_PRESETS = {
  Classic: { ...XH_DEFAULT },
  Pro: { style: 'cross', color: '#7dff8a', size: 5, thick: 1.5, gap: 3, outline: true, dot: false, dynamic: false, opacity: 1, enemyRed: false },
  Tactical: { style: 't', color: '#4fd1c5', size: 8, thick: 2, gap: 5, outline: true, dot: true, dynamic: true, opacity: .95, enemyRed: true },
  Ring: { style: 'circle', color: '#f2cc8f', size: 6, thick: 1.5, gap: 8, outline: true, dot: true, dynamic: true, opacity: .95, enemyRed: true },
  Chevron: { style: 'chevron', color: '#ff4fd8', size: 7, thick: 2, gap: 2, outline: true, dot: false, dynamic: false, opacity: 1, enemyRed: true },
  Bold: { style: 'cross', color: '#ffe14d', size: 10, thick: 3.5, gap: 6, outline: true, dot: true, dynamic: true, opacity: 1, enemyRed: true },
  Minimal: { style: 'dot', color: '#fffaf0', size: 4, thick: 2, gap: 0, outline: true, dot: true, dynamic: false, opacity: .9, enemyRed: true },
};
const INK = '#2b2d42';

export function crosshairSVG(c) {
  const t = c.thick, L = c.size, g = c.gap, ow = c.outline ? Math.max(1.2, t * .7) : 0;
  const rectArm = (cls, x, y, w, h) => `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(t, L) * .3}" class="cf"${ow ? ` stroke="${INK}" stroke-width="${ow}" paint-order="stroke"` : ''}/></g>`;
  let s = '';
  if (c.style === 'cross' || c.style === 't') {
    if (c.style === 'cross') s += rectArm('up', -t / 2, -g - L, t, L);
    s += rectArm('dn', -t / 2, g, t, L) + rectArm('lf', -g - L, -t / 2, L, t) + rectArm('rt', g, -t / 2, L, t);
  } else if (c.style === 'circle' || c.style === 'box') {
    const r = g + L / 2, shape = (extra) => c.style === 'circle' ? `<circle r="${r}" fill="none" vector-effect="non-scaling-stroke" ${extra}/>` : `<rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" rx="${t * .6}" fill="none" vector-effect="non-scaling-stroke" ${extra}/>`;
    s += `<g class="ring">${ow ? shape(`stroke="${INK}" stroke-width="${t + ow * 2}"`) : ''}${shape(`class="cs" stroke-width="${t}"`)}</g>`;
  } else if (c.style === 'chevron') {
    const pts = `${-L},${L * .85 + g} 0,${g} ${L},${L * .85 + g}`;
    if (ow) s += `<polyline points="${pts}" fill="none" stroke="${INK}" stroke-width="${t + ow * 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<polyline points="${pts}" fill="none" class="cs" stroke-width="${t}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (c.dot || c.style === 'dot') {
    const r = c.style === 'dot' ? Math.max(1.5, L * .35) : Math.max(1, t * .65);
    s += `<circle r="${r}" class="cf"${ow ? ` stroke="${INK}" stroke-width="${ow}" paint-order="stroke"` : ''}/>`;
  }
  return `<svg viewBox="-60 -60 120 120" width="120" height="120" style="--xc:${c.color};opacity:${c.opacity}">${s}</svg>`;
}
// Build into an element and keep references to the moving parts.
export function mountCrosshair(el, c) {
  el.innerHTML = crosshairSVG(c);
  el._xh = { c, up: el.querySelector('.up'), dn: el.querySelector('.dn'), lf: el.querySelector('.lf'), rt: el.querySelector('.rt'), ring: el.querySelector('.ring'), last: -1 };
}
// extra = how many pixels the spread pushes the arms out
export function spreadCrosshair(el, extra) {
  const x = el._xh; if (!x) return;
  const e = x.c.dynamic ? Math.round(extra * 2) / 2 : 0; if (e === x.last) return; x.last = e;
  x.up?.setAttribute('transform', `translate(0,${-e})`); x.dn?.setAttribute('transform', `translate(0,${e})`);
  x.lf?.setAttribute('transform', `translate(${-e},0)`); x.rt?.setAttribute('transform', `translate(${e},0)`);
  if (x.ring) { const r = x.c.gap + x.c.size / 2; x.ring.setAttribute('transform', `scale(${(r + e) / r})`); }
}
// Short shareable code, e.g. PS1-cross-fffaf0-7-2-4-1101-100
export function crosshairCode(c) {
  return ['PS1', c.style, c.color.replace('#', ''), c.size, c.thick, c.gap, [c.outline, c.dot, c.dynamic, c.enemyRed].map(b => b ? 1 : 0).join(''), Math.round(c.opacity * 100)].join('-');
}
export function parseCrosshair(code) {
  const p = String(code || '').trim().split('-');
  if (p.length !== 8 || p[0] !== 'PS1' || !XH_STYLES.some(s => s[0] === p[1]) || !/^[0-9a-fA-F]{6}$/.test(p[2])) return null;
  const n = (v, a, b) => Math.max(a, Math.min(b, parseFloat(v) || 0)), f = p[6].padEnd(4, '0');
  return { style: p[1], color: '#' + p[2].toLowerCase(), size: n(p[3], 1, 20), thick: n(p[4], .5, 6), gap: n(p[5], 0, 20), outline: f[0] === '1', dot: f[1] === '1', dynamic: f[2] === '1', enemyRed: f[3] === '1', opacity: n(p[7], 10, 100) / 100 };
}
