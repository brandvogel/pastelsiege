// Movement abilities. Every run starts with Dash, Ground Slam and Double Jump at level 1; Grapple and Glider are bought in
// the shop. Upgrades (in the shop) make each one stronger.
export const ABILITIES = [
  { id: 'dash', name: 'Dash', icon: '»', key: 'F', price: 0, up: [1500, 3000, 5000, 8000],
    cd: [2.6, 2.2, 1.8, 1.5, 1.2], charges: [1, 2, 2, 3, 3], speed: [14, 15, 16, 17, 18],
    desc: 'A quick burst in the direction you\'re moving. Works in the air too.',
    fx: (a, l) => `${a.charges[l - 1] > 1 ? `${a.charges[l - 1]} charges · ` : ''}${a.cd[l - 1]} s cooldown` },
  { id: 'grapple', name: 'Grapple Hook', icon: '⚓', key: 'H', alt: 'middle mouse', price: 2800, up: [2500, 4000, 6000, 9000],
    range: [24, 32, 40, 50, 62], cd: [9, 7, 5.5, 4, 2.8], pull: [17, 20, 23, 26, 30],
    desc: 'Fire a hook at a wall or roof and get yanked to it. Jump while reeling to fling yourself off.',
    fx: (a, l) => `${a.range[l - 1]} m reach · ${a.cd[l - 1]} s cooldown` },
  { id: 'djump', name: 'Double Jump', icon: '⇈', key: 'Space', price: 2400, up: [4000, 7000],
    jumps: [1, 1, 2], power: [5.5, 7, 7.5],
    desc: 'Jump again in mid-air. Level 3 gives you a triple jump.',
    fx: (a, l) => `${a.jumps[l - 1]} extra jump${a.jumps[l - 1] > 1 ? 's' : ''} · ${a.power[l - 1] >= 7 ? 'full' : 'short'} height` },
  { id: 'slam', name: 'Ground Slam', icon: '⤓', key: 'C', alt: 'in the air', price: 3200, up: [2800, 4500, 7000, 10000],
    dmg: [40, 70, 110, 160, 230], radius: [3, 4, 5, 6, 7.5], cd: [4, 3.2, 2.5, 1.8, 1.2],
    desc: 'Press C in the air to smash down. Damage grows with how far you fall.',
    fx: (a, l) => `${a.dmg[l - 1]}+ dmg · ${a.radius[l - 1]} m · ${a.cd[l - 1]} s cooldown` },
  { id: 'glide', name: 'Glider', icon: '🪂', key: 'Space', alt: 'hold, falling', price: 1800, up: [2500, 4500],
    fall: [4, 2.8, 1.8], steer: [1, 1.6, 2.4],
    desc: 'Hold jump while falling to drift down slowly and cross the map from rooftops.',
    fx: (a, l) => `falls at ${a.fall[l - 1]} m/s · ${['some', 'good', 'great'][l - 1]} steering` },
];
export const abById = id => ABILITIES.find(a => a.id === id);
export const abMax = a => a.up.length + 1;
export const abNextPrice = (a, l) => l === 0 ? a.price : l < abMax(a) ? a.up[l - 1] : null;
// stat of ability `id` at the player's level (level 0 = not owned → null)
export const AB = (lv, id, k) => { const l = lv[id] || 0; return l ? abById(id)[k][l - 1] : null; };
