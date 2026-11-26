// Weapon catalogue. Angles in radians, times in seconds, spread = cone half-angle.
const BASE = { head: 2, chamber: true, pellets: 1, range: 35, falloff: 80, minMult: 0.65, move: 1, mobility: 1, adsSpeed: 7, draw: 0.55,
  burst: 3, pierce: 0, recover: 1, scope: 'iron', zoom: 60, kick: 0.35, recoilH: 0.006, bloom: 0.008, cycle: 0, shell: 0, emptyReload: 0 };
const W = o => { const w = { ...BASE, ...o }; if (!w.emptyReload) w.emptyReload = w.reload * 1.2; return w; };
const S = (f, f2, noise, dur, type = 'sawtooth') => ({ f, f2, noise, dur, type });

export const WEAPONS = [
  // ---- Pistols (sidearm slot)
  W({ id: 'pip', name: 'Pip-9', cat: 'Pistol', slot: 'secondary', price: 0, dmg: 24, rpm: 400, modes: ['semi'], mag: 15, reserve: 90, reload: 1.3,
    hip: .016, ads: .005, bloom: .01, recoilV: .013, recoilH: .004, zoom: 64, mobility: 1.05, draw: .35, snd: S(600, 120, .35, .08), model: { kind: 'pistol', color: 0x3d405b, accent: 0xf2cc8f } }),
  W({ id: 'buzz', name: 'Buzz MP', cat: 'Pistol', slot: 'secondary', price: 600, dmg: 15, rpm: 950, modes: ['auto', 'semi'], mag: 20, reserve: 120, reload: 1.5,
    hip: .028, ads: .012, bloom: .006, recoilV: .008, recoilH: .007, zoom: 64, range: 15, falloff: 40, minMult: .5, draw: .35, snd: S(700, 160, .3, .06), model: { kind: 'pistol', color: 0xe07a5f, accent: 0x2b2d42, ext: true } }),
  W({ id: 'hawk', name: 'Hawk .50', cat: 'Pistol', slot: 'secondary', price: 800, dmg: 60, head: 2.3, rpm: 170, modes: ['semi'], mag: 7, reserve: 35, reload: 1.7,
    hip: .03, ads: .004, bloom: .04, recoilV: .065, recoilH: .012, kick: 1, zoom: 60, snd: S(260, 40, .8, .22), model: { kind: 'pistol', color: 0xd9d6cf, accent: 0x3d405b, big: true } }),
  W({ id: 'longhorn', name: 'Longhorn Revolver', cat: 'Pistol', slot: 'secondary', price: 950, dmg: 80, rpm: 110, modes: ['semi'], mag: 6, chamber: false, reserve: 36, reload: 2.4, emptyReload: 2.4,
    hip: .02, ads: .002, bloom: .03, recoilV: .07, recoilH: .01, kick: 1.1, zoom: 58, range: 45, snd: S(220, 35, .85, .26), model: { kind: 'revolver', color: 0x8a7f72, accent: 0xb5734a } }),
  // ---- SMGs
  W({ id: 'hornet', name: 'Hornet MP', cat: 'SMG', slot: 'primary', price: 1400, dmg: 20, rpm: 800, modes: ['auto', 'burst', 'semi'], mag: 30, reserve: 150, reload: 1.9,
    hip: .024, ads: .007, bloom: .004, recoilV: .011, recoilH: .006, range: 22, falloff: 50, minMult: .55, mobility: .97, zoom: 58, snd: S(640, 140, .4, .07), model: { kind: 'smg', color: 0x2b2d42, accent: 0xe07a5f } }),
  W({ id: 'wasp', name: 'Wasp V', cat: 'SMG', slot: 'primary', price: 1900, dmg: 17, rpm: 1150, modes: ['auto', 'burst'], mag: 25, reserve: 150, reload: 1.8,
    hip: .022, ads: .007, bloom: .003, recoilV: .007, recoilH: .004, range: 18, falloff: 45, minMult: .5, scope: 'dot', zoom: 56, snd: S(720, 180, .35, .06), model: { kind: 'smg', color: 0x81b29a, accent: 0x2b2d42 } }),
  W({ id: 'bullpup50', name: 'Bullpup 50', cat: 'SMG', slot: 'primary', price: 2300, dmg: 19, rpm: 900, modes: ['auto', 'semi'], mag: 50, reserve: 200, reload: 2.6,
    hip: .024, ads: .007, bloom: .004, recoilV: .010, recoilH: .005, range: 24, falloff: 55, scope: 'holo', zoom: 54, mobility: .95, snd: S(660, 150, .4, .07), model: { kind: 'bullpup', color: 0xf2cc8f, accent: 0x3d405b, mag: 'top' } }),
  // ---- Shotguns
  W({ id: 'thumper', name: 'Thumper Pump', cat: 'Shotgun', slot: 'primary', price: 1200, pellets: 8, dmg: 15, head: 1.5, rpm: 70, modes: ['pump'], cycle: .7, mag: 6, chamber: false, shell: .5, reserve: 36, reload: 3,
    hip: .065, ads: .05, bloom: 0, recoilV: .06, kick: 1.1, range: 8, falloff: 25, minMult: .2, zoom: 62, snd: S(160, 40, 1, .3), model: { kind: 'shotgun', color: 0x3d405b, accent: 0xb5734a } }),
  W({ id: 'twin', name: 'Twin Hammer', cat: 'Shotgun', slot: 'primary', price: 1000, pellets: 10, dmg: 14, head: 1.5, rpm: 400, modes: ['semi'], mag: 2, chamber: false, reserve: 30, reload: 2.1, emptyReload: 2.1,
    hip: .08, ads: .065, bloom: 0, recoilV: .08, kick: 1.2, range: 6, falloff: 20, minMult: .15, zoom: 64, snd: S(140, 35, 1, .32), model: { kind: 'double', color: 0xb5734a, accent: 0x2b2d42 } }),
  W({ id: 'storm', name: 'Storm Auto-12', cat: 'Shotgun', slot: 'primary', price: 2800, pellets: 7, dmg: 12, head: 1.5, rpm: 260, modes: ['auto', 'semi'], mag: 10, reserve: 50, reload: 2.7,
    hip: .07, ads: .055, bloom: .01, recoilV: .04, kick: .9, range: 9, falloff: 26, minMult: .2, scope: 'holo', zoom: 60, mobility: .92, snd: S(170, 45, .95, .24), model: { kind: 'shotgun', color: 0x2b2d42, accent: 0x81b29a, mag: 'drum' } }),
  // ---- Assault rifles
  W({ id: 'kestrel', name: 'Kestrel 47', cat: 'Rifle', slot: 'primary', price: 2700, dmg: 35, head: 2.2, rpm: 600, modes: ['auto', 'semi'], mag: 30, reserve: 120, reload: 2.3,
    hip: .035, ads: .004, bloom: .006, recoilV: .024, recoilH: .010, recover: .9, range: 45, falloff: 110, zoom: 55, mobility: .92, snd: S(300, 60, .7, .14), model: { kind: 'rifle', color: 0x2b2d42, accent: 0xb5734a, mag: 'curved' } }),
  W({ id: 'viper', name: 'Viper M4', cat: 'Rifle', slot: 'primary', price: 3100, dmg: 29, rpm: 760, modes: ['auto', 'burst', 'semi'], mag: 30, reserve: 150, reload: 2.1,
    hip: .03, ads: .003, bloom: .005, recoilV: .017, recoilH: .006, range: 45, falloff: 110, scope: 'dot', zoom: 52, mobility: .94, snd: S(380, 80, .6, .11), model: { kind: 'rifle', color: 0x3d405b, accent: 0x2b2d42 } }),
  W({ id: 'trident', name: 'Trident Burst', cat: 'Rifle', slot: 'primary', price: 2900, dmg: 30, rpm: 950, modes: ['burst', 'semi'], mag: 30, reserve: 150, reload: 2.2,
    hip: .03, ads: .003, bloom: .004, recoilV: .013, recoilH: .004, range: 45, falloff: 100, scope: 'holo', zoom: 52, snd: S(400, 90, .55, .1), model: { kind: 'bullpup', color: 0x81b29a, accent: 0x2b2d42 } }),
  W({ id: 'bruiser', name: 'Bruiser 17', cat: 'Rifle', slot: 'primary', price: 3600, dmg: 44, rpm: 560, modes: ['auto', 'semi'], mag: 20, reserve: 100, reload: 2.4,
    hip: .034, ads: .003, bloom: .007, recoilV: .028, recoilH: .009, range: 55, falloff: 130, minMult: .7, scope: 'holo', zoom: 52, mobility: .9, snd: S(260, 50, .75, .16), model: { kind: 'rifle', color: 0xcfb58a, accent: 0x2b2d42 } }),
  W({ id: 'falcon', name: 'Falcon 3X', cat: 'Rifle', slot: 'primary', price: 3400, dmg: 31, rpm: 680, modes: ['auto', 'semi'], mag: 30, reserve: 150, reload: 2.3,
    hip: .032, ads: .0025, bloom: .005, recoilV: .015, recoilH: .005, range: 55, falloff: 120, scope: '3x', zoom: 24, adsSpeed: 5, snd: S(360, 80, .6, .12), model: { kind: 'bullpup', color: 0x5d8a73, accent: 0x2b2d42 } }),
  // ---- Marksman
  W({ id: 'hawkeye', name: 'Hawkeye DMR', cat: 'Marksman', slot: 'primary', price: 3900, dmg: 58, head: 2.3, rpm: 320, modes: ['semi'], mag: 15, reserve: 60, reload: 2.6,
    hip: .045, ads: .0015, bloom: .02, recoilV: .04, recoilH: .008, kick: .7, range: 70, falloff: 150, minMult: .8, scope: '4x', zoom: 17, mobility: .9, adsSpeed: 5, snd: S(240, 45, .8, .2), model: { kind: 'long', color: 0x3d405b, accent: 0xf2cc8f } }),
  W({ id: 'ranger', name: 'Ranger Lever', cat: 'Marksman', slot: 'primary', price: 2100, dmg: 78, head: 2.2, rpm: 90, modes: ['lever'], cycle: .55, mag: 8, chamber: false, shell: .45, reserve: 48, reload: 4,
    hip: .03, ads: .002, bloom: 0, recoilV: .05, kick: .8, range: 60, falloff: 140, minMult: .75, zoom: 50, snd: S(230, 40, .85, .22), model: { kind: 'long', color: 0xb5734a, accent: 0x2b2d42 } }),
  // ---- Snipers
  W({ id: 'feather', name: 'Featherline SSG', cat: 'Sniper', slot: 'primary', price: 1800, dmg: 88, head: 2.5, rpm: 60, modes: ['bolt'], cycle: 1.0, mag: 10, reserve: 50, reload: 2.4,
    hip: .06, ads: .0008, bloom: 0, recoilV: .05, kick: .8, range: 120, falloff: 250, minMult: .85, scope: '6x', zoom: 12, adsSpeed: 6, snd: S(200, 40, .85, .28), model: { kind: 'sniper', color: 0x81b29a, accent: 0x2b2d42 } }),
  W({ id: 'needle', name: 'Needle AWM', cat: 'Sniper', slot: 'primary', price: 4750, dmg: 125, head: 2.5, rpm: 45, modes: ['bolt'], cycle: 1.3, mag: 5, reserve: 30, reload: 3.2,
    hip: .09, ads: .0004, bloom: 0, recoilV: .09, kick: 1.2, range: 200, falloff: 400, minMult: .9, pierce: 1, scope: '8x', zoom: 8.5, mobility: .82, adsSpeed: 4, draw: .8, snd: S(150, 30, 1, .4), model: { kind: 'sniper', color: 0x3d405b, accent: 0xe07a5f } }),
  W({ id: 'thunder', name: 'Thunder .50', cat: 'Sniper', slot: 'primary', price: 6800, dmg: 170, head: 2.2, rpm: 75, modes: ['semi'], mag: 5, reserve: 25, reload: 3.6,
    hip: .11, ads: .0006, bloom: .03, recoilV: .12, recoilH: .02, kick: 1.5, range: 200, falloff: 400, minMult: .9, pierce: 3, scope: '12x', zoom: 5.5, mobility: .72, adsSpeed: 3.2, draw: 1, snd: S(110, 25, 1, .5), model: { kind: 'sniper', color: 0x2b2d42, accent: 0xf2cc8f, big: true } }),
  // ---- LMGs
  W({ id: 'brick', name: 'Brick M249', cat: 'LMG', slot: 'primary', price: 5200, dmg: 30, rpm: 820, modes: ['auto'], mag: 100, reserve: 200, reload: 5.2,
    hip: .05, ads: .008, bloom: .0035, recoilV: .014, recoilH: .009, recover: .8, range: 45, falloff: 110, scope: 'holo', zoom: 54, mobility: .8, adsSpeed: 4, draw: .9, snd: S(330, 70, .65, .12), model: { kind: 'lmg', color: 0x5f6f52, accent: 0x2b2d42 } }),
  W({ id: 'ripsaw', name: 'Ripsaw 42', cat: 'LMG', slot: 'primary', price: 4600, dmg: 25, rpm: 1200, modes: ['auto'], mag: 75, reserve: 225, reload: 4.6,
    hip: .055, ads: .01, bloom: .004, recoilV: .016, recoilH: .012, recover: .8, range: 40, falloff: 100, zoom: 56, mobility: .82, adsSpeed: 4, draw: .9, snd: S(420, 90, .6, .08), model: { kind: 'lmg', color: 0x3d405b, accent: 0xb5734a, mag: 'drum' } }),
  W({ id: 'goliath', name: 'Goliath Minigun', cat: 'LMG', slot: 'primary', price: 8500, dmg: 19, rpm: 2600, modes: ['auto'], spin: .9, mag: 300, chamber: false, reserve: 600, reload: 6,
    hip: .06, ads: .045, bloom: .001, recoilV: .006, recoilH: .006, recover: .7, range: 35, falloff: 90, zoom: 70, mobility: .62, adsSpeed: 3, draw: 1.2, snd: S(480, 120, .5, .05), model: { kind: 'minigun', color: 0x3d405b, accent: 0xe07a5f } }),
  // ---- Special
  W({ id: 'boomtube', name: 'Boomtube GL', cat: 'Special', slot: 'primary', price: 5500, dmg: 0, rpm: 90, modes: ['semi'], mag: 6, chamber: false, shell: .55, reserve: 18, reload: 4,
    projectile: { speed: 38, gravity: 9, radius: 5.5, dmg: 170 }, hip: .02, ads: .01, bloom: 0, recoilV: .07, kick: 1, zoom: 55, mobility: .85, snd: S(120, 60, .6, .25, 'square'), model: { kind: 'launcher', color: 0xe07a5f, accent: 0x2b2d42 } }),
  W({ id: 'rail', name: 'Rail-X', cat: 'Special', slot: 'primary', price: 9500, dmg: 220, head: 1.5, rpm: 45, modes: ['semi'], mag: 4, reserve: 20, reload: 3,
    pierce: 99, wallPierce: true, hip: .01, ads: .0003, bloom: 0, recoilV: .08, kick: 1.3, range: 300, falloff: 500, minMult: 1, scope: '4x', zoom: 18, mobility: .85, adsSpeed: 4, draw: .9,
    snd: S(1400, 80, .5, .45, 'sine'), model: { kind: 'rail', color: 0xfffaf0, accent: 0x4fd1c5 } }),
  // ======== more guns ========
  // innate: mutations built into the gun (it starts with them)
  // ---- Pistols
  W({ id: 'duke', name: 'Duke 1911', cat: 'Pistol', slot: 'secondary', price: 450, dmg: 38, rpm: 330, modes: ['semi'], mag: 8, reserve: 64, reload: 1.4,
    hip: .018, ads: .004, bloom: .018, recoilV: .03, recoilH: .006, kick: .6, zoom: 62, range: 30, snd: S(420, 70, .6, .14), model: { kind: 'pistol', color: 0xd9d6cf, accent: 0x8a7f72 } }),
  W({ id: 'glint', name: 'Glint P2 Burst', cat: 'Pistol', slot: 'secondary', price: 700, dmg: 22, rpm: 1100, burst: 3, modes: ['burst', 'semi'], mag: 21, reserve: 126, reload: 1.4,
    hip: .02, ads: .006, bloom: .008, recoilV: .012, recoilH: .004, zoom: 62, snd: S(640, 140, .4, .07), model: { kind: 'pistol', color: 0x81b29a, accent: 0xfffaf0 } }),
  W({ id: 'mamba', name: 'Mamba Machine Pistol', cat: 'Pistol', slot: 'secondary', price: 1100, dmg: 13, rpm: 1350, modes: ['auto', 'semi'], mag: 33, reserve: 165, reload: 1.6,
    hip: .03, ads: .014, bloom: .005, recoilV: .007, recoilH: .009, range: 12, falloff: 34, minMult: .45, zoom: 64, draw: .3, snd: S(760, 200, .3, .05), model: { kind: 'pistol', color: 0x2b2d42, accent: 0x7dff8a, ext: true } }),
  W({ id: 'judge', name: 'Judge Shot-Revolver', cat: 'Pistol', slot: 'secondary', price: 1300, pellets: 6, dmg: 13, head: 1.5, rpm: 160, modes: ['semi'], mag: 5, chamber: false, reserve: 30, reload: 2.6, emptyReload: 2.6,
    hip: .06, ads: .05, bloom: 0, recoilV: .07, kick: 1.1, range: 6, falloff: 18, minMult: .2, zoom: 62, snd: S(170, 40, .95, .28), model: { kind: 'revolver', color: 0x3d405b, accent: 0xe07a5f } }),
  W({ id: 'flare', name: 'Sparkler Flare Gun', cat: 'Pistol', slot: 'secondary', price: 1500, dmg: 0, rpm: 70, modes: ['semi'], mag: 1, chamber: false, reserve: 14, reload: 1.3, emptyReload: 1.3,
    projectile: { speed: 45, gravity: 6, radius: 3.6, dmg: 95 }, innate: ['incendiary'], hip: .02, ads: .01, bloom: 0, recoilV: .05, kick: .8, zoom: 62, snd: S(200, 80, .6, .2, 'square'), model: { kind: 'pistol', color: 0xff8c42, accent: 0x2b2d42, big: true } }),
  // ---- SMGs
  W({ id: 'mink', name: 'Mink .45', cat: 'SMG', slot: 'primary', price: 1700, dmg: 26, rpm: 650, modes: ['auto', 'burst', 'semi'], mag: 25, reserve: 125, reload: 2.1,
    hip: .022, ads: .006, bloom: .004, recoilV: .013, recoilH: .005, range: 26, falloff: 55, minMult: .55, zoom: 56, snd: S(520, 110, .5, .09), model: { kind: 'smg', color: 0x8d8676, accent: 0x2b2d42 } }),
  W({ id: 'gnat', name: 'Gnat Micro', cat: 'SMG', slot: 'primary', price: 1500, dmg: 14, rpm: 1400, modes: ['auto'], mag: 32, reserve: 192, reload: 1.6,
    hip: .026, ads: .011, bloom: .003, recoilV: .006, recoilH: .007, range: 14, falloff: 36, minMult: .45, zoom: 58, mobility: 1.04, draw: .3, snd: S(820, 220, .3, .05), model: { kind: 'smg', color: 0xe07a5f, accent: 0xfffaf0 } }),
  W({ id: 'vandal', name: 'Vandal Vector', cat: 'SMG', slot: 'primary', price: 2600, dmg: 21, rpm: 1200, modes: ['auto', 'burst'], mag: 25, reserve: 150, reload: 1.9,
    hip: .022, ads: .006, bloom: .003, recoilV: .006, recoilH: .004, range: 20, falloff: 46, minMult: .5, scope: 'dot', zoom: 56, snd: S(700, 170, .35, .06), model: { kind: 'smg', color: 0xfffaf0, accent: 0x2b2d42 } }),
  W({ id: 'tommy', name: 'Typewriter', cat: 'SMG', slot: 'primary', price: 2400, dmg: 24, rpm: 750, modes: ['auto', 'semi'], mag: 50, reserve: 150, reload: 3,
    hip: .03, ads: .008, bloom: .004, recoilV: .014, recoilH: .008, range: 22, falloff: 50, zoom: 58, mobility: .92, snd: S(420, 90, .55, .1), model: { kind: 'smg', color: 0xb5734a, accent: 0x3d405b } }),
  W({ id: 'hive', name: 'Hive PDW', cat: 'SMG', slot: 'primary', price: 3000, dmg: 18, rpm: 1000, modes: ['auto', 'semi'], mag: 60, reserve: 240, reload: 2.8,
    hip: .022, ads: .007, bloom: .003, recoilV: .008, recoilH: .004, range: 22, falloff: 50, scope: 'holo', zoom: 54, mobility: .97, innate: ['arc'], snd: S(680, 160, .35, .06), model: { kind: 'bullpup', color: 0xffe14d, accent: 0x2b2d42, mag: 'top' } }),
  // ---- Shotguns
  W({ id: 'brute', name: 'Brute Saiga', cat: 'Shotgun', slot: 'primary', price: 2200, pellets: 8, dmg: 13, head: 1.5, rpm: 300, modes: ['semi'], mag: 8, reserve: 48, reload: 2.4,
    hip: .07, ads: .055, bloom: .01, recoilV: .045, kick: 1, range: 8, falloff: 24, minMult: .2, zoom: 60, snd: S(160, 40, 1, .26), model: { kind: 'shotgun', color: 0x3d405b, accent: 0xb5734a } }),
  W({ id: 'slugger', name: 'Slugger', cat: 'Shotgun', slot: 'primary', price: 1700, dmg: 120, head: 1.8, rpm: 75, modes: ['pump'], cycle: .65, mag: 5, chamber: false, shell: .5, reserve: 30, reload: 3,
    hip: .04, ads: .006, bloom: 0, recoilV: .075, kick: 1.3, range: 30, falloff: 70, minMult: .5, zoom: 56, snd: S(140, 30, 1, .34), model: { kind: 'shotgun', color: 0xfffaf0, accent: 0xe07a5f } }),
  W({ id: 'dragon', name: "Dragon's Breath", cat: 'Shotgun', slot: 'primary', price: 3200, pellets: 9, dmg: 11, head: 1.4, rpm: 75, modes: ['pump'], cycle: .65, mag: 6, chamber: false, shell: .5, reserve: 36, reload: 3,
    hip: .07, ads: .055, bloom: 0, recoilV: .06, kick: 1.1, range: 9, falloff: 26, minMult: .2, zoom: 62, innate: ['incendiary'], snd: S(150, 40, 1, .32), model: { kind: 'shotgun', color: 0xd6453d, accent: 0x2b2d42 } }),
  W({ id: 'sawnoff', name: 'Sawn-Off', cat: 'Shotgun', slot: 'secondary', price: 1400, pellets: 12, dmg: 12, head: 1.4, rpm: 500, modes: ['semi'], mag: 2, chamber: false, reserve: 24, reload: 1.8, emptyReload: 1.8,
    hip: .1, ads: .085, bloom: 0, recoilV: .09, kick: 1.3, range: 5, falloff: 14, minMult: .1, zoom: 66, draw: .4, snd: S(130, 30, 1, .34), model: { kind: 'double', color: 0x8a7f72, accent: 0x2b2d42 } }),
  // ---- Assault rifles
  W({ id: 'talon', name: 'Talon H', cat: 'Rifle', slot: 'primary', price: 3800, dmg: 40, rpm: 600, modes: ['auto', 'semi'], mag: 20, reserve: 100, reload: 2.3,
    hip: .033, ads: .003, bloom: .006, recoilV: .024, recoilH: .008, range: 55, falloff: 130, minMult: .7, scope: 'holo', zoom: 52, mobility: .9, snd: S(270, 55, .75, .15), model: { kind: 'rifle', color: 0xcfb58a, accent: 0x2b2d42 } }),
  W({ id: 'grizzly', name: 'Grizzly Bullpup', cat: 'Rifle', slot: 'primary', price: 3300, dmg: 34, rpm: 700, modes: ['auto', 'semi'], mag: 30, reserve: 150, reload: 2.4,
    hip: .03, ads: .003, bloom: .005, recoilV: .019, recoilH: .007, range: 48, falloff: 115, scope: 'dot', zoom: 52, mobility: .93, snd: S(320, 65, .7, .13), model: { kind: 'bullpup', color: 0x5f6f52, accent: 0x2b2d42 } }),
  W({ id: 'liberty', name: 'Liberty M1', cat: 'Rifle', slot: 'primary', price: 2500, dmg: 62, head: 2.2, rpm: 320, modes: ['semi'], mag: 8, chamber: false, reserve: 64, reload: 2.2, emptyReload: 2.2,
    hip: .03, ads: .002, bloom: .015, recoilV: .04, recoilH: .007, kick: .8, range: 60, falloff: 140, minMult: .75, zoom: 52, snd: S(250, 45, .8, .2), model: { kind: 'rifle', color: 0xb5734a, accent: 0x3d405b } }),
  W({ id: 'hammer', name: 'Hammerhead 416', cat: 'Rifle', slot: 'primary', price: 3500, dmg: 31, rpm: 820, modes: ['auto', 'burst', 'semi'], mag: 30, reserve: 150, reload: 2.1,
    hip: .029, ads: .003, bloom: .004, recoilV: .015, recoilH: .005, range: 48, falloff: 115, scope: 'holo', zoom: 52, mobility: .94, snd: S(360, 75, .65, .12), model: { kind: 'rifle', color: 0x2b2d42, accent: 0x81b29a } }),
  W({ id: 'humming', name: 'Hummingbird', cat: 'Rifle', slot: 'primary', price: 3700, dmg: 26, rpm: 1050, modes: ['auto', 'semi'], mag: 35, reserve: 175, reload: 2.2,
    hip: .032, ads: .0035, bloom: .004, recoilV: .012, recoilH: .007, range: 42, falloff: 100, scope: 'dot', zoom: 52, mobility: .95, snd: S(420, 95, .55, .09), model: { kind: 'rifle', color: 0xff4fd8, accent: 0x2b2d42 } }),
  W({ id: 'quad', name: 'Quadra Burst', cat: 'Rifle', slot: 'primary', price: 3400, dmg: 33, rpm: 1100, burst: 4, modes: ['burst'], mag: 32, reserve: 160, reload: 2.2,
    hip: .03, ads: .0028, bloom: .003, recoilV: .012, recoilH: .004, range: 50, falloff: 115, scope: 'holo', zoom: 52, snd: S(390, 85, .6, .1), model: { kind: 'rifle', color: 0x9cc5d6, accent: 0x2b2d42 } }),
  W({ id: 'oracle', name: 'Oracle Smart Rifle', cat: 'Rifle', slot: 'primary', price: 5200, dmg: 30, rpm: 700, modes: ['auto', 'semi'], mag: 30, reserve: 150, reload: 2.3,
    hip: .032, ads: .004, bloom: .005, recoilV: .016, recoilH: .006, range: 50, falloff: 120, scope: 'holo', zoom: 52, innate: ['homing'], snd: S(380, 80, .6, .11), model: { kind: 'bullpup', color: 0xfffaf0, accent: 0x4fd1c5 } }),
  // ---- Marksman
  W({ id: 'sable', name: 'Sable SKS', cat: 'Marksman', slot: 'primary', price: 2600, dmg: 60, head: 2.2, rpm: 380, modes: ['semi'], mag: 10, reserve: 60, reload: 2.4,
    hip: .035, ads: .002, bloom: .016, recoilV: .035, recoilH: .007, kick: .7, range: 65, falloff: 145, minMult: .78, zoom: 50, snd: S(260, 48, .8, .18), model: { kind: 'long', color: 0xb5734a, accent: 0x3d405b } }),
  W({ id: 'warden', name: 'Warden EBR', cat: 'Marksman', slot: 'primary', price: 4400, dmg: 66, head: 2.3, rpm: 360, modes: ['semi'], mag: 20, reserve: 80, reload: 2.7,
    hip: .045, ads: .0014, bloom: .018, recoilV: .042, recoilH: .009, kick: .75, range: 75, falloff: 160, minMult: .8, scope: '4x', zoom: 17, mobility: .88, adsSpeed: 4.8, snd: S(230, 42, .85, .22), model: { kind: 'long', color: 0x5f6f52, accent: 0x2b2d42 } }),
  W({ id: 'whisper', name: 'Whisper VSS', cat: 'Marksman', slot: 'primary', price: 3900, dmg: 40, head: 2.3, rpm: 720, modes: ['auto', 'semi'], mag: 20, reserve: 100, reload: 2.4,
    quiet: true, noFlash: true, hear: 12, hip: .035, ads: .0025, bloom: .006, recoilV: .02, recoilH: .007, range: 45, falloff: 100, scope: '4x', zoom: 18, adsSpeed: 5, snd: S(300, 60, .7, .12), model: { kind: 'long', color: 0x3d405b, accent: 0x8a7f72 } }),
  // ---- Snipers
  W({ id: 'kaiser', name: 'Kaiser 98', cat: 'Sniper', slot: 'primary', price: 2600, dmg: 110, head: 2.5, rpm: 50, modes: ['bolt'], cycle: 1.1, mag: 5, reserve: 35, reload: 2.8,
    hip: .07, ads: .0006, bloom: 0, recoilV: .07, kick: 1, range: 150, falloff: 320, minMult: .88, scope: '4x', zoom: 16, adsSpeed: 5, snd: S(170, 32, .95, .36), model: { kind: 'sniper', color: 0xb5734a, accent: 0x2b2d42 } }),
  W({ id: 'vortex', name: 'Vortex Semi-Auto', cat: 'Sniper', slot: 'primary', price: 5600, dmg: 92, head: 2.4, rpm: 160, modes: ['semi'], mag: 10, reserve: 40, reload: 3,
    hip: .09, ads: .0008, bloom: .02, recoilV: .07, recoilH: .012, kick: 1.1, range: 140, falloff: 300, minMult: .85, scope: '8x', zoom: 8.5, mobility: .8, adsSpeed: 4, snd: S(160, 30, .95, .38), model: { kind: 'sniper', color: 0x9cc5d6, accent: 0x2b2d42 } }),
  W({ id: 'leviathan', name: 'Leviathan 20mm', cat: 'Sniper', slot: 'primary', price: 12000, dmg: 320, head: 2, rpm: 40, modes: ['bolt'], cycle: 1.6, mag: 3, reserve: 15, reload: 4.2,
    hip: .13, ads: .0005, bloom: 0, recoilV: .16, recoilH: .03, kick: 2, range: 250, falloff: 500, minMult: .95, pierce: 6, scope: '12x', zoom: 5.5, mobility: .62, adsSpeed: 2.6, draw: 1.3, snd: S(80, 20, 1, .6), model: { kind: 'sniper', color: 0x3d405b, accent: 0xd4a73a, big: true } }),
  // ---- LMGs
  W({ id: 'saw', name: 'Buzzsaw MG3', cat: 'LMG', slot: 'primary', price: 5800, dmg: 28, rpm: 1150, modes: ['auto'], mag: 100, reserve: 200, reload: 5,
    hip: .055, ads: .009, bloom: .004, recoilV: .015, recoilH: .011, recover: .8, range: 42, falloff: 105, zoom: 56, mobility: .8, adsSpeed: 4, draw: .9, snd: S(400, 85, .6, .08), model: { kind: 'lmg', color: 0x2b2d42, accent: 0xb5734a } }),
  W({ id: 'bear', name: 'Bear PKM', cat: 'LMG', slot: 'primary', price: 6200, dmg: 38, rpm: 700, modes: ['auto'], mag: 100, reserve: 200, reload: 5.4,
    hip: .055, ads: .007, bloom: .004, recoilV: .02, recoilH: .01, recover: .8, range: 50, falloff: 120, scope: 'holo', zoom: 54, mobility: .78, adsSpeed: 3.8, draw: 1, snd: S(280, 55, .75, .14), model: { kind: 'lmg', color: 0x5f6f52, accent: 0xb5734a } }),
  W({ id: 'kodiak', name: 'Kodiak RPK', cat: 'LMG', slot: 'primary', price: 4300, dmg: 33, rpm: 640, modes: ['auto', 'semi'], mag: 75, reserve: 225, reload: 4,
    hip: .048, ads: .006, bloom: .004, recoilV: .02, recoilH: .009, recover: .85, range: 48, falloff: 115, zoom: 55, mobility: .84, adsSpeed: 4.4, snd: S(300, 60, .7, .14), model: { kind: 'lmg', color: 0xb5734a, accent: 0x2b2d42, mag: 'drum' } }),
  // ---- Special
  W({ id: 'popper', name: 'Party Popper', cat: 'Special', slot: 'primary', price: 4200, dmg: 0, rpm: 240, modes: ['semi'], mag: 8, reserve: 32, reload: 3,
    projectile: { speed: 34, gravity: 10, radius: 3.8, dmg: 90 }, innate: ['volatile'], hip: .025, ads: .012, bloom: 0, recoilV: .04, kick: .8, zoom: 56, mobility: .9, snd: S(160, 70, .5, .2, 'square'), model: { kind: 'launcher', color: 0xff4fd8, accent: 0xffe14d } }),
  W({ id: 'arclance', name: 'Arc Lance', cat: 'Special', slot: 'primary', price: 7000, dmg: 70, head: 2, rpm: 260, modes: ['semi'], mag: 12, reserve: 60, reload: 2.6,
    pierce: 3, innate: ['arc', 'cryo'], hip: .015, ads: .001, bloom: .004, recoilV: .03, kick: .7, range: 120, falloff: 250, minMult: .9, scope: 'holo', zoom: 40, mobility: .9, adsSpeed: 5,
    snd: S(1800, 120, .4, .3, 'sine'), model: { kind: 'rail', color: 0x2b2d42, accent: 0x7dd3ff } }),
  // ======== v19 guns ========
  W({ id: 'tick', name: 'Tick Auto', cat: 'Pistol', slot: 'secondary', price: 900, dmg: 18, rpm: 900, modes: ['auto', 'semi'], mag: 18, reserve: 108, reload: 1.5,
    hip: .026, ads: .01, bloom: .006, recoilV: .009, recoilH: .007, range: 16, falloff: 40, minMult: .5, zoom: 64, draw: .3, snd: S(700, 170, .32, .06), model: { kind: 'pistol', color: 0x9cc5d6, accent: 0x2b2d42, ext: true } }),
  W({ id: 'nova', name: 'Nova Bouncer', cat: 'Pistol', slot: 'secondary', price: 1800, dmg: 34, rpm: 360, modes: ['semi'], mag: 12, reserve: 72, reload: 1.5,
    hip: .016, ads: .003, bloom: .012, recoilV: .022, recoilH: .004, zoom: 60, range: 40, innate: ['ricochet'], snd: S(900, 140, .3, .12, 'square'), model: { kind: 'pistol', color: 0xfffaf0, accent: 0x4fd1c5, big: true } }),
  W({ id: 'kitten', name: 'Kitten .45', cat: 'SMG', slot: 'primary', price: 2000, dmg: 30, rpm: 600, modes: ['auto', 'semi'], mag: 25, reserve: 125, reload: 2.2,
    hip: .022, ads: .006, bloom: .004, recoilV: .015, recoilH: .006, range: 28, falloff: 58, minMult: .6, zoom: 56, snd: S(480, 100, .55, .1), model: { kind: 'smg', color: 0xff9ecf, accent: 0x2b2d42 } }),
  W({ id: 'pez', name: 'Pez P90', cat: 'SMG', slot: 'primary', price: 2700, dmg: 19, rpm: 950, modes: ['auto', 'semi'], mag: 50, reserve: 200, reload: 2.5,
    hip: .022, ads: .006, bloom: .003, recoilV: .008, recoilH: .004, range: 22, falloff: 52, scope: 'dot', zoom: 54, mobility: .97, snd: S(690, 160, .35, .06), model: { kind: 'bullpup', color: 0x81b29a, accent: 0xfffaf0, mag: 'top' } }),
  W({ id: 'drumroll', name: 'Drumroll AA-12', cat: 'Shotgun', slot: 'primary', price: 3900, pellets: 7, dmg: 11, head: 1.4, rpm: 330, modes: ['auto'], mag: 20, reserve: 60, reload: 3.4,
    hip: .07, ads: .058, bloom: .012, recoilV: .03, kick: .8, range: 8, falloff: 24, minMult: .2, zoom: 60, mobility: .88, snd: S(165, 42, .95, .22), model: { kind: 'shotgun', color: 0x5f6f52, accent: 0x2b2d42, mag: 'drum' } }),
  W({ id: 'bandit', name: 'Bandit Lever 12', cat: 'Shotgun', slot: 'primary', price: 1900, pellets: 9, dmg: 15, head: 1.5, rpm: 100, modes: ['lever'], cycle: .45, mag: 5, chamber: false, shell: .45, reserve: 35, reload: 2.8,
    hip: .06, ads: .048, bloom: 0, recoilV: .055, kick: 1, range: 9, falloff: 26, minMult: .2, zoom: 60, snd: S(155, 40, 1, .3), model: { kind: 'shotgun', color: 0xb5734a, accent: 0xd4a73a } }),
  W({ id: 'scarab', name: 'Scarab H', cat: 'Rifle', slot: 'primary', price: 4100, dmg: 48, rpm: 580, modes: ['auto', 'semi'], mag: 20, reserve: 100, reload: 2.5,
    hip: .036, ads: .003, bloom: .007, recoilV: .03, recoilH: .01, range: 58, falloff: 135, minMult: .72, scope: 'holo', zoom: 52, mobility: .88, snd: S(250, 48, .8, .17), model: { kind: 'rifle', color: 0xcfb58a, accent: 0x5f6f52 } }),
  W({ id: 'fennec', name: 'Fennec Burst', cat: 'Rifle', slot: 'primary', price: 3200, dmg: 29, rpm: 1100, burst: 3, modes: ['burst', 'semi'], mag: 25, reserve: 125, reload: 2.1,
    hip: .03, ads: .003, bloom: .004, recoilV: .012, recoilH: .004, range: 46, falloff: 105, scope: 'dot', zoom: 52, snd: S(410, 90, .55, .1), model: { kind: 'bullpup', color: 0x3d405b, accent: 0xf2cc8f } }),
  W({ id: 'augur', name: 'Augur 3X', cat: 'Rifle', slot: 'primary', price: 3600, dmg: 30, rpm: 720, modes: ['auto', 'semi'], mag: 30, reserve: 150, reload: 2.3,
    hip: .032, ads: .0025, bloom: .005, recoilV: .015, recoilH: .005, range: 55, falloff: 120, scope: '3x', zoom: 24, adsSpeed: 5, snd: S(370, 80, .6, .12), model: { kind: 'bullpup', color: 0x9cc5d6, accent: 0x2b2d42 } }),
  W({ id: 'longbow', name: 'Longbow Mk14', cat: 'Marksman', slot: 'primary', price: 4800, dmg: 64, head: 2.3, rpm: 420, modes: ['semi'], mag: 20, reserve: 80, reload: 2.6,
    hip: .045, ads: .0014, bloom: .018, recoilV: .04, recoilH: .009, kick: .75, range: 72, falloff: 155, minMult: .8, scope: '4x', zoom: 17, mobility: .87, adsSpeed: 4.8, snd: S(235, 44, .85, .21), model: { kind: 'long', color: 0x2b2d42, accent: 0x81b29a } }),
  W({ id: 'tempest', name: 'Tempest Driller', cat: 'Marksman', slot: 'primary', price: 4500, dmg: 55, head: 2.2, rpm: 400, modes: ['semi'], mag: 15, reserve: 75, reload: 2.5,
    pierce: 1, innate: ['drill'], hip: .04, ads: .0018, bloom: .015, recoilV: .036, recoilH: .008, kick: .7, range: 70, falloff: 150, minMult: .8, scope: '3x', zoom: 24, adsSpeed: 5, snd: S(250, 46, .8, .19), model: { kind: 'long', color: 0xe07a5f, accent: 0x2b2d42 } }),
  W({ id: 'mosquito', name: 'Mosquito .22', cat: 'Sniper', slot: 'primary', price: 1500, dmg: 62, head: 3, rpm: 95, modes: ['bolt'], cycle: .45, mag: 10, reserve: 60, reload: 2,
    hip: .04, ads: .0009, bloom: 0, recoilV: .025, kick: .4, range: 110, falloff: 220, minMult: .8, scope: '6x', zoom: 12, adsSpeed: 7, mobility: 1, draw: .5, snd: S(420, 80, .5, .14), model: { kind: 'sniper', color: 0xffe14d, accent: 0x2b2d42 } }),
  W({ id: 'glacier', name: 'Glacier', cat: 'Sniper', slot: 'primary', price: 6400, dmg: 98, head: 2.4, rpm: 130, modes: ['semi'], mag: 8, reserve: 40, reload: 3,
    innate: ['cryo'], hip: .09, ads: .0008, bloom: .02, recoilV: .07, recoilH: .012, kick: 1.1, range: 150, falloff: 320, minMult: .85, scope: '8x', zoom: 8.5, mobility: .8, adsSpeed: 4, snd: S(180, 34, .9, .36), model: { kind: 'sniper', color: 0xdaf0ff, accent: 0x5b8fd6 } }),
  W({ id: 'hailstorm', name: 'Hailstorm', cat: 'LMG', slot: 'primary', price: 6900, dmg: 27, rpm: 900, modes: ['auto'], mag: 120, reserve: 240, reload: 5.2,
    innate: ['ricochet'], hip: .055, ads: .009, bloom: .004, recoilV: .015, recoilH: .011, recover: .8, range: 44, falloff: 105, scope: 'holo', zoom: 54, mobility: .78, adsSpeed: 3.8, draw: 1, snd: S(360, 75, .65, .1), model: { kind: 'lmg', color: 0x9cc5d6, accent: 0x2b2d42 } }),
  W({ id: 'nailer', name: 'Nail Driver', cat: 'Special', slot: 'primary', price: 5200, dmg: 46, head: 2, rpm: 480, modes: ['semi'], mag: 30, reserve: 120, reload: 2.8,
    pierce: 5, hip: .02, ads: .002, bloom: .006, recoilV: .02, kick: .5, range: 60, falloff: 140, minMult: .8, scope: 'dot', zoom: 50, mobility: .9, snd: S(1100, 200, .4, .1, 'square'), model: { kind: 'rail', color: 0xf2cc8f, accent: 0xff8c42 } }),
  W({ id: 'bertha', name: 'Big Bertha', cat: 'Special', slot: 'primary', price: 8800, dmg: 0, rpm: 30, modes: ['semi'], mag: 1, chamber: false, reserve: 8, reload: 3.2, emptyReload: 3.2,
    projectile: { speed: 30, gravity: 8, radius: 9, dmg: 320 }, hip: .02, ads: .012, bloom: 0, recoilV: .12, kick: 1.6, zoom: 55, mobility: .78, draw: 1, snd: S(90, 30, .8, .4, 'square'), model: { kind: 'launcher', color: 0x5f6f52, accent: 0xd6453d, big: true } }),
  // ---- one-of-a-kind guns: each has a trait no other gun has
  W({ id: 'torchie', name: 'Torchie', cat: 'Special', slot: 'primary', price: 4600, pellets: 3, dmg: 5, head: 1, rpm: 900, modes: ['auto'], mag: 120, chamber: false, reserve: 360, reload: 3.2,
    innate: ['incendiary'], hip: .09, ads: .08, bloom: 0, recoilV: .003, recoilH: .003, kick: .1, range: 7, falloff: 13, minMult: 0, zoom: 70, mobility: .9, snd: S(90, 60, .9, .05, 'square'), model: { kind: 'long', color: 0xff8c42, accent: 0x2b2d42 } }),
  W({ id: 'leech', name: 'Leech MP', cat: 'SMG', slot: 'primary', price: 3300, dmg: 17, rpm: 900, modes: ['auto', 'semi'], mag: 32, reserve: 160, reload: 2,
    lifesteal: .12, hip: .026, ads: .008, bloom: .004, recoilV: .011, recoilH: .006, range: 20, falloff: 45, minMult: .55, mobility: .97, zoom: 58, snd: S(560, 150, .4, .07), model: { kind: 'smg', color: 0x7b2d3b, accent: 0xff9ecf } }),
  W({ id: 'guillotine', name: 'Guillotine', cat: 'Marksman', slot: 'primary', price: 5200, dmg: 62, head: 2, rpm: 260, modes: ['semi'], mag: 10, reserve: 60, reload: 2.6,
    execute: .3, hip: .04, ads: .002, bloom: .02, recoilV: .04, recoilH: .008, kick: .7, range: 70, falloff: 150, minMult: .8, scope: '4x', zoom: 18, adsSpeed: 5, mobility: .9, snd: S(240, 45, .8, .2), model: { kind: 'long', color: 0x2b2d42, accent: 0xd6453d } }),
  W({ id: 'lucky', name: 'Lucky Seven', cat: 'Pistol', slot: 'secondary', price: 1800, dmg: 55, rpm: 140, modes: ['semi'], mag: 7, chamber: false, reserve: 42, reload: 2.3, emptyReload: 2.3,
    crit: .25, critMul: 4, hip: .02, ads: .002, bloom: .03, recoilV: .06, recoilH: .01, kick: 1, zoom: 58, range: 40, snd: S(260, 40, .8, .22), model: { kind: 'revolver', color: 0x3f7a4f, accent: 0xd4a73a } }),
  W({ id: 'skater', name: 'Skater MP', cat: 'SMG', slot: 'primary', price: 2600, dmg: 18, rpm: 950, modes: ['auto', 'burst'], mag: 30, reserve: 150, reload: 1.8,
    airBonus: 1.8, hip: .022, ads: .009, bloom: .004, recoilV: .01, recoilH: .007, range: 18, falloff: 40, minMult: .5, mobility: 1.04, zoom: 60, draw: .4, snd: S(700, 170, .35, .06), model: { kind: 'smg', color: 0x4fd1c5, accent: 0xff4fd8 } }),
  W({ id: 'heatsink', name: 'Heat Sink', cat: 'LMG', slot: 'primary', price: 6200, dmg: 16, rpm: 820, modes: ['auto'], mag: 100, chamber: false, reserve: 300, reload: 4.4,
    ramp: 2.4, rampStep: .03, hip: .05, ads: .012, bloom: .003, recoilV: .012, recoilH: .007, range: 40, falloff: 100, zoom: 56, mobility: .78, adsSpeed: 4, snd: S(360, 90, .6, .08), model: { kind: 'lmg', color: 0x8d99a6, accent: 0xff7a2a } }),
  W({ id: 'bouncer', name: 'Bouncer', cat: 'Shotgun', slot: 'primary', price: 2800, pellets: 8, dmg: 13, head: 1.3, rpm: 80, modes: ['pump'], cycle: .6, mag: 6, chamber: false, shell: .5, reserve: 36, reload: 3,
    knock: 18, hip: .07, ads: .05, bloom: 0, recoilV: .07, kick: 1.3, range: 8, falloff: 22, minMult: .2, zoom: 62, snd: S(130, 35, 1, .3), model: { kind: 'shotgun', color: 0xf2cc8f, accent: 0x2b2d42 } }),
  W({ id: 'firecracker', name: 'Firecracker', cat: 'Special', slot: 'primary', price: 6800, dmg: 0, rpm: 70, modes: ['semi'], mag: 4, chamber: false, shell: .6, reserve: 16, reload: 3.6,
    projectile: { speed: 36, gravity: 9, radius: 4, dmg: 110, cluster: 5 }, hip: .02, ads: .012, bloom: 0, recoilV: .08, kick: 1.2, zoom: 55, mobility: .85, draw: .9, snd: S(110, 50, .6, .3, 'square'), model: { kind: 'launcher', color: 0xd6453d, accent: 0xf2cc8f } }),
  W({ id: 'gemini', name: 'Gemini Twins', cat: 'Pistol', slot: 'secondary', price: 1400, akimbo: true, dmg: 22, rpm: 720, modes: ['semi'], mag: 30, chamber: false, reserve: 150, reload: 2.3, emptyReload: 2.6,
    hip: .026, ads: .016, bloom: .009, recoilV: .011, recoilH: .007, kick: .2, zoom: 72, range: 28, falloff: 60, draw: .7, adsSpeed: 9, snd: S(620, 130, .35, .08), model: { kind: 'pistol', color: 0xc8b6ff, accent: 0x2b2d42, ext: true, left: { color: 0xa8e6cf } } }),
  W({ id: 'finale', name: 'Finale', cat: 'Rifle', slot: 'primary', price: 3600, dmg: 30, rpm: 600, modes: ['auto', 'semi'], mag: 20, reserve: 120, reload: 2.2,
    lastShot: 8, hip: .03, ads: .003, bloom: .005, recoilV: .017, recoilH: .006, range: 45, falloff: 110, scope: 'holo', zoom: 50, mobility: .94, snd: S(340, 75, .6, .12), model: { kind: 'rifle', color: 0xfffaf0, accent: 0xd4a73a } }),
  W({ id: 'phantom', name: 'Phantom', cat: 'Sniper', slot: 'primary', price: 7800, dmg: 115, head: 2.4, rpm: 50, modes: ['bolt'], cycle: 1.2, mag: 5, reserve: 25, reload: 3.4,
    wallPierce: true, pierce: 2, hip: .09, ads: .0004, bloom: 0, recoilV: .09, kick: 1.2, range: 200, falloff: 400, minMult: .9, scope: '8x', zoom: 8.5, mobility: .82, adsSpeed: 4, draw: .8, snd: S(170, 40, .9, .38), model: { kind: 'sniper', color: 0x9cc5d6, accent: 0x3d2b6b } }),
  W({ id: 'sparky', name: 'Sparky', cat: 'Pistol', slot: 'secondary', price: 2200, dmg: 24, rpm: 320, modes: ['semi'], mag: 12, reserve: 72, reload: 1.6,
    innate: ['arc'], hip: .018, ads: .005, bloom: .012, recoilV: .02, recoilH: .005, zoom: 62, range: 30, falloff: 60, draw: .35, snd: S(900, 300, .25, .1, 'square'), model: { kind: 'pistol', color: 0x7dd3ff, accent: 0xf2cc8f } }),
];
// one or two lines of flavour and how to use each gun, shown in the shop next to the numbers
const DESC = {
  torchie: 'A flamethrower. Short range, sets everything in front of you on fire. Hold it down and walk forward.',
  leech: 'An SMG that feeds on damage: every hit heals you a little. Stay close and keep shooting.',
  guillotine: 'Any bot it drops below 30% health dies instantly. Doesn\'t work on bosses.',
  lucky: 'A gambler\'s revolver. One shot in four is a crit for four times the damage.',
  skater: 'Does 80% more damage while you\'re in the air or sliding. Never stop moving.',
  heatsink: 'Starts weak, gets hotter: hold the trigger and its damage climbs to more than double.',
  bouncer: 'A shotgun that throws bots backwards. Great for keeping rushers off you.',
  firecracker: 'Each shell explodes, then bursts into five little bombs that scatter and pop.',
  gemini: 'A pistol in each hand, firing left, right, left, right. Aiming brings both up together: you can\'t use the sights, but the spread tightens.',
  finale: 'The last round in each magazine does eight times the damage. Count your shots.',
  phantom: 'A sniper whose bullets pass straight through walls. If you can spot them, you can hit them.',
  sparky: 'A pistol whose shots jump to nearby bots as lightning.',
  pip: 'Your starting pistol. Dependable and accurate, and you can upgrade it all the way to Pip Prime in the Sidearm Workshop.',
  buzz: 'A pistol that thinks it\'s an SMG. Sprays fast up close, falls off quickly at range.',
  hawk: 'Big .50 hand cannon. Two body shots or one to the head, but it kicks hard.',
  longhorn: 'Six heavy rounds and a slow reload. Every shot counts, and every shot hurts.',
  hornet: 'The all-rounder SMG. Easy recoil, three fire modes, good for learning to track.',
  wasp: 'Very fast fire rate with a red dot. Melts anything inside 15 metres.',
  bullpup50: 'Fifty rounds in a top-loaded mag. You can hold the trigger down for a long time.',
  thumper: 'Classic pump shotgun. One clean shot up close deletes a bot.',
  twin: 'Two barrels, two huge blasts, then reload. Pure close-range panic button.',
  storm: 'Semi-auto shotgun with a drum. Keep firing as fast as you can click.',
  kestrel: 'Hard-hitting AK-style rifle. Strong vertical kick: pull down while you spray.',
  viper: 'Smooth, accurate M4 with a red dot. Easy to control at every range.',
  trident: 'Three-round bursts that land in one tight cluster. Reward for good tracking.',
  bruiser: 'Heavy-calibre rifle. Fewer bullets per mag, more damage per bullet.',
  falcon: 'Bullpup with a 3x scope built in. Made for mid-range lanes.',
  hawkeye: 'Semi-auto marksman rifle with a 4x. Two to the body, one to the head.',
  ranger: 'Cowboy lever-action. Slow to cycle, big damage, iron sights only.',
  feather: 'Light bolt-action sniper. Fast scope-in, and a headshot kills anything small.',
  needle: 'Serious bolt-action sniper. Punches through one bot into the next.',
  thunder: 'Semi-auto .50 anti-materiel rifle. Pierces three targets. Heavy to carry.',
  brick: '100-round belt-fed machine gun. Set up, hold the line, don\'t reload.',
  ripsaw: 'Ridiculous fire rate on a drum. Wild to control, devastating if you can.',
  goliath: 'Minigun. Spins up, then shreds everything in front of it. You move like a fridge.',
  boomtube: 'Six-shot grenade launcher. Lob it over cover. Don\'t fire it at your feet.',
  rail: 'Charged rail that goes through every wall and every bot in a line.',
  duke: 'Old-school 1911. Eight heavy rounds, crisp trigger.',
  glint: 'Burst-fire pistol. Three fast rounds per click.',
  mamba: 'Tiny machine pistol with a huge fire rate. Best as a backup when you\'re cornered.',
  judge: 'A revolver that fires shotgun shells. A sidearm that can win a room fight.',
  flare: 'Fires burning flares that explode and set bots on fire. One shot, then reload.',
  mink: 'Slow, punchy .45 SMG. Better at range than most SMGs.',
  gnat: 'Micro SMG. The fastest thing in the shop to pull out and spray.',
  vandal: 'Kriss-style SMG with almost no recoil. Point and hold.',
  tommy: 'Drum-fed gangster gun. Fifty rounds, satisfying rattle.',
  hive: 'Sixty-round PDW whose bullets jump in electric arcs to nearby bots.',
  brute: 'Mag-fed semi-auto shotgun. Faster to reload than any pump.',
  slugger: 'Fires one solid slug. Shotgun power with rifle range.',
  dragon: 'Pump shotgun loaded with fire. Bots keep burning after you hit them.',
  sawnoff: 'Cut-down double barrel that fits in your sidearm slot. Two point-blank blasts.',
  talon: 'Heavy battle rifle with a holo. Hits like a marksman rifle, fires full auto.',
  grizzly: 'Compact bullpup rifle with a red dot. Good handling, solid damage.',
  liberty: 'WW2 semi-auto. Eight hard shots and that famous ping when it\'s empty.',
  hammer: 'Modern 416 with three fire modes. Does everything well.',
  humming: 'Very fast-firing rifle. Low damage per bullet, very high damage per second.',
  quad: 'Fires four-round bursts. Learn the rhythm and it lands all four.',
  oracle: 'Smart rifle: its bullets curve toward bots.',
  sable: 'SKS marksman carbine. Fast semi-auto follow-ups, iron sights.',
  warden: 'Heavy marksman rifle with a 4x and a bipod. Built for long sightlines.',
  whisper: 'Integrally silenced. Bots can barely hear it and there\'s no muzzle flash.',
  kaiser: 'Classic bolt sniper with a 4x. Cheap, reliable, one-taps heads.',
  vortex: 'Semi-auto sniper. Ten big shots as fast as you can re-aim.',
  leviathan: '20mm cannon on a stock. Goes through six bots. The recoil is a joke.',
  saw: 'Classic MG with a buzzsaw fire rate. Loud, hungry, effective.',
  bear: 'Slower, heavier machine gun. Every bullet hits like a rifle round.',
  kodiak: 'Light machine gun with a drum. Moves almost like a rifle.',
  popper: 'Party cannon. Its grenades set off chain explosions when bots die.',
  arclance: 'Energy rifle. Freezes and chain-shocks everything it pierces.',
  tick: 'Full-auto pocket pistol. Light, fast, and fun to hold down.',
  nova: 'Energy pistol whose bolts bounce off walls into bots you can\'t see.',
  kitten: 'Pink .45 SMG. Hits much harder than it looks.',
  pez: 'Fifty-round bullpup SMG with a dot. Low recoil, huge mag.',
  drumroll: 'Full-auto shotgun with a 20-shell drum. Hold the trigger in a room full of bots.',
  bandit: 'Lever-action shotgun. Flick, boom, flick, boom.',
  scarab: 'Battle rifle with a folding stock. The hardest-hitting full-auto rifle.',
  fennec: 'Bullpup that fires very fast three-round bursts.',
  augur: 'Bullpup with a built-in 3x scope. A mid-range laser.',
  longbow: 'Heavy semi-auto marksman rifle with a 4x. Huge damage per shot.',
  tempest: 'Marksman rifle firing drill rounds that tear through one bot into the next.',
  mosquito: 'Tiny .22 sniper. Weak to the body, deadly to the head, scopes in almost instantly.',
  glacier: 'Semi-auto sniper that freezes what it hits. Slowed bots are easy follow-ups.',
  hailstorm: '120-round machine gun whose bullets ricochet off walls into nearby bots.',
  nailer: 'Industrial nail gun. Every nail goes through five bots.',
  bertha: 'One enormous shell with a nine-metre blast. Then a long reload.',
};
// ---- Secret guns: only from codes, never in the shop or the armory
WEAPONS.push(
  W({ id: 'nuke', name: 'Thermonuclear', cat: 'Secret', secret: true, slot: 'primary', price: 0, dmg: 0, rpm: 30, modes: ['semi'], mag: 1, chamber: false, reserve: 4, reload: 4.5,
    projectile: { speed: 30, gravity: 5, radius: 8, dmg: 300, nuke: true }, hip: .02, ads: .01, bloom: 0, recoilV: .12, kick: 1.6, zoom: 55, mobility: .75, draw: 1.1,
    snd: S(90, 40, .8, .45, 'square'), model: { kind: 'launcher', color: 0xf2cc8f, accent: 0x2b2d42 } }),
  W({ id: 'stillwater', name: 'Stillwater LMG', cat: 'Secret', attCat: 'LMG', perfect: true, secret: true, slot: 'primary', price: 0, dmg: 34, rpm: 900, modes: ['auto'], mag: 200, reserve: 1000, reload: 3,
    hip: .012, ads: .002, bloom: 0, recoilV: 0, recoilH: 0, kick: 0, recover: 1, range: 60, falloff: 140, scope: 'holo', zoom: 56, mobility: .95, adsSpeed: 7, draw: .6,
    snd: S(360, 80, .6, .09), model: { kind: 'lmg', color: 0xff8fab, accent: 0x2b2d42, mag: 'drum' } }),
);
DESC.nuke = 'Calls in a thermonuclear airstrike where the warhead lands. Clears the whole area. One shot per load.';
DESC.stillwater = 'Zero recoil and zero spread: every bullet lands on the crosshair. 200 rounds a mag. Takes LMG attachments.';
// ---- Admin guns: only from the admin panel. Broken on purpose: aimbot rounds (seek), shots through walls (wallPierce),
// chain lightning (zap), exploding pellets (boom), and Smite, which hits every bot on the floor at once.
const ADM = { cat: 'Admin', secret: true, admin: true, price: 0, perfect: true, bloom: 0, recoilH: 0, recover: 1, mobility: 1.1, adsSpeed: 9, draw: .3, minMult: 1, range: 300, falloff: 500 };
WEAPONS.push(
  W({ ...ADM, id: 'lockjaw', name: 'Lockjaw', slot: 'secondary', dmg: 260, rpm: 600, modes: ['semi', 'auto'], mag: 24, reserve: 999, reload: .6, seek: true, wallPierce: true,
    hip: .01, ads: .002, recoilV: .01, kick: .4, zoom: 62, snd: S(880, 120, .4, .1), model: { kind: 'pistol', color: 0xffd34d, accent: 0x2b2d42, ext: true } }),
  W({ ...ADM, id: 'phase', name: 'Phase Rifle', slot: 'primary', dmg: 95, rpm: 900, modes: ['auto', 'semi'], mag: 90, reserve: 999, reload: .8, pierce: 99, wallPierce: true,
    hip: .01, ads: .001, recoilV: 0, kick: .25, scope: 'holo', zoom: 52, snd: S(1200, 300, .3, .08, 'square'), model: { kind: 'rifle', color: 0xb388ff, accent: 0x2b2d42 } }),
  W({ ...ADM, id: 'godslayer', name: 'Godslayer', slot: 'primary', dmg: 5000, head: 1, rpm: 240, modes: ['semi'], mag: 12, reserve: 999, reload: .9, pierce: 99, wallPierce: true,
    hip: .005, ads: .0002, recoilV: .03, kick: .9, scope: '4x', zoom: 20, snd: S(1600, 60, .6, .5, 'sine'), model: { kind: 'rail', color: 0x2b2d42, accent: 0xffd34d } }),
  W({ ...ADM, id: 'stormcaller', name: 'Stormcaller', slot: 'primary', dmg: 70, rpm: 1100, modes: ['auto'], mag: 120, reserve: 999, reload: .8, zap: 6, seek: true,
    hip: .02, ads: .006, recoilV: 0, kick: .2, scope: 'dot', zoom: 56, snd: S(1500, 400, .5, .06, 'square'), model: { kind: 'smg', color: 0x9cc5d6, accent: 0xb388ff } }),
  W({ ...ADM, id: 'boomstick', name: 'Boomstick', slot: 'primary', dmg: 45, pellets: 10, rpm: 240, modes: ['semi', 'auto'], mag: 16, reserve: 999, reload: .9, boom: { r: 4.5, dmg: 160 },
    hip: .07, ads: .05, recoilV: .04, kick: 1, zoom: 60, snd: S(160, 40, .9, .3), model: { kind: 'shotgun', color: 0xff8c42, accent: 0x2b2d42 } }),
  W({ ...ADM, id: 'brrrt', name: 'BRRRT', slot: 'primary', dmg: 60, rpm: 3000, modes: ['auto'], mag: 2000, reserve: 9999, reload: 1, wallPierce: true, pierce: 3,
    hip: .012, ads: .006, recoilV: 0, kick: .1, zoom: 58, snd: S(300, 90, .5, .05), model: { kind: 'minigun', color: 0x8fbf6a, accent: 0x2b2d42 } }),
  W({ ...ADM, id: 'supernova', name: 'Supernova', slot: 'primary', dmg: 0, rpm: 150, modes: ['semi', 'auto'], mag: 12, chamber: false, reserve: 999, reload: .8,
    projectile: { speed: 75, gravity: 0, radius: 9, dmg: 1200, cluster: 8, safe: true }, hip: .01, ads: .005, recoilV: .05, kick: 1, zoom: 55, snd: S(90, 30, .9, .4, 'square'), model: { kind: 'launcher', color: 0xff5fa2, accent: 0xffd34d } }),
  W({ ...ADM, id: 'leechadmin', name: 'Leech', slot: 'primary', dmg: 180, rpm: 700, modes: ['auto', 'semi'], mag: 60, reserve: 999, reload: .7, lifesteal: 1, seek: true,
    hip: .01, ads: .002, recoilV: 0, kick: .3, scope: 'holo', zoom: 52, snd: S(500, 110, .5, .1), model: { kind: 'bullpup', color: 0xd6453d, accent: 0x2b2d42 } }),
  W({ ...ADM, id: 'yeet', name: 'Yeet Cannon', slot: 'primary', dmg: 90, pellets: 8, rpm: 200, modes: ['semi'], mag: 10, reserve: 999, reload: .8, knock: 80, pierce: 5,
    hip: .06, ads: .04, recoilV: .08, kick: 1.4, zoom: 60, snd: S(120, 30, .9, .35), model: { kind: 'double', color: 0x4fd1c5, accent: 0xffd34d } }),
  W({ ...ADM, id: 'smite', name: 'Smite', slot: 'primary', dmg: 1500, rpm: 60, modes: ['semi'], mag: 6, reserve: 999, reload: 1, smite: true,
    hip: .01, ads: .001, recoilV: .05, kick: 1.2, scope: '4x', zoom: 30, snd: S(1800, 50, .7, .6, 'sine'), model: { kind: 'sniper', color: 0xfffaf0, accent: 0xffd34d } }),
);
Object.assign(DESC, {
  lockjaw: 'Aimbot pistol: every bullet bends to the nearest head in front of you, through walls.',
  phase: 'Shoots straight through walls and through every bot in a line. Zero recoil.',
  godslayer: '5,000 damage a shot through walls and bots. Kills bosses in a couple of hits.',
  stormcaller: 'Aimbot SMG. Every hit arcs lightning into 6 more bots.',
  boomstick: 'Shotgun whose pellets explode where they land. Never hurts you.',
  brrrt: '3,000 rounds a minute, 2,000 a belt, through walls.',
  supernova: 'Fast, straight rockets that burst into 8 bomblets. Never hurts you.',
  leech: 'Aimbot rifle. Every point of damage heals you.',
  yeet: 'Sends bots flying across the room.',
  smite: 'Every shot strikes every bot on the floor with lightning from the sky. Walls do not matter.',
});
// ---- Melee (own slot, key 3). Every run starts with the Pocket Knife. reach = metres, arc = how wide the swing is
// (radians either side of the crosshair), cleave = how many bots one swing can hit, back = damage multiplier from behind,
// lunge = how far you leap at the bot you're swinging at, knock = how hard it sends them flying, heal = HP back per hit.
const MEL = { cat: 'Melee', slot: 'melee', melee: true, modes: ['melee'], scope: 'blade', mag: 1, chamber: false, reserve: 0, reload: 1, hip: 0, ads: 0, bloom: 0, recoilV: 0, recoilH: 0,
  kick: 0, zoom: 70, adsSpeed: 0, mobility: 1.12, head: 1.5, range: 4, falloff: 4, minMult: 1, snd: S(400, 200, .5, .1) };
WEAPONS.push(
  W({ ...MEL, id: 'knife', name: 'Pocket Knife', price: 0, dmg: 55, rpm: 150, reach: 2.4, arc: .5, cleave: 1, back: 3, lunge: 0, draw: .25,
    model: { kind: 'melee', style: 'knife', color: 0xb3b9c3, accent: 0x2b2d42 } }),
  W({ ...MEL, id: 'machete', name: 'Machete', price: 600, dmg: 80, rpm: 110, reach: 2.8, arc: .75, cleave: 3, back: 2, draw: .3,
    model: { kind: 'melee', style: 'machete', color: 0xb3b9c3, accent: 0xb5734a } }),
  W({ ...MEL, id: 'claws', name: 'Cat Claws', price: 1100, dmg: 34, rpm: 330, reach: 2.2, arc: .6, cleave: 2, back: 2, heal: 3, mobility: 1.2, draw: .2,
    model: { kind: 'melee', style: 'claws', color: 0xf4a6c6, accent: 0x2b2d42 } }),
  W({ ...MEL, id: 'slugbat', name: 'Slugger Bat', price: 900, dmg: 75, rpm: 95, reach: 3, arc: .8, cleave: 3, back: 1.5, knock: 22, draw: .35, two: true,
    model: { kind: 'melee', style: 'bat', color: 0xcfb58a, accent: 0x2b2d42 } }),
  W({ ...MEL, id: 'sledge', name: 'Sledgehammer', price: 1500, dmg: 210, rpm: 45, reach: 3, arc: .6, cleave: 4, back: 1.5, knock: 35, slam: true, mobility: .95, draw: .5, two: true,
    model: { kind: 'melee', style: 'sledge', color: 0x3a3d47, accent: 0xb5734a } }),
  W({ ...MEL, id: 'katana', name: 'Katana', price: 2200, dmg: 125, rpm: 115, reach: 3.3, arc: .7, cleave: 4, back: 2.5, lunge: 7, draw: .35, two: true,
    model: { kind: 'melee', style: 'katana', color: 0xe9ecf2, accent: 0xd6453d } }),
  W({ ...MEL, id: 'scythe', name: 'Pastel Scythe', price: 3200, dmg: 150, rpm: 75, reach: 4, arc: 1.1, cleave: 7, back: 2, heal: 6, lunge: 4, draw: .45, two: true,
    model: { kind: 'melee', style: 'scythe', color: 0xb388ff, accent: 0x2b2d42 } }),
);
Object.assign(DESC, {
  knife: 'Free in every run. Quick stabs, and triple damage from behind.',
  machete: 'Wide chop that hits up to 3 bots at once.',
  claws: 'Very fast swipes that heal you 3 HP every hit. You move faster with them out.',
  slugbat: 'Knocks bots flying across the room. Hits up to 3.',
  sledge: 'Slow, but 210 damage, hits up to 4 and slams them into the floor.',
  katana: 'Lunges you 7 m at whatever you swing at. Huge damage from behind.',
  scythe: 'Huge reach and a wide sweep that hits up to 7 bots. Heals 6 HP a hit.',
});
for (const w of WEAPONS) w.desc = DESC[w.id] || '';
export const byId = id => WEAPONS.find(w => w.id === id);
// time to kill a 100 HP bot with body shots (and how many it takes); TTK-test style
export function ttk(w) {
  if (w.projectile) return { text: 'Explosive', sub: `${w.projectile.dmg} blast damage` };
  const per = w.dmg * (w.pellets || 1), shots = Math.max(1, Math.ceil(100 / per)), t = (shots - 1) * 60 / w.rpm;
  const headShots = Math.max(1, Math.ceil(100 / (per * (w.head || 2))));
  return { text: shots === 1 ? 'One shot' : `${Math.round(t * 1000)} ms`, sub: `${shots} body shot${shots > 1 ? 's' : ''} · ${headShots === 1 ? 'headshots one-tap' : `${headShots} headshots`}` };
}
export const CATS = ['Melee', 'Pistol', 'SMG', 'Shotgun', 'Rifle', 'Marksman', 'Sniper', 'LMG', 'Special'];

export const GEAR = [
  { id: 'armor', name: 'Kevlar Vest', price: 650, desc: '100 armour. Halves incoming damage until it breaks.' },
  { id: 'medkit', name: 'Medkit', price: 400, desc: 'Heal 50 HP instantly.' },
  { id: 'frag', name: 'Frag Grenade', price: 300, desc: 'Throw with G. Cooks for 2.5s, 6m blast. Carry up to 4.' },
  { id: 'ammo', name: 'Ammo Crate', price: 250, desc: 'Refill reserve ammo for both weapons.' },
  { id: 'nvg', name: 'Night Vision Goggles', price: 5000, desc: 'See the whole map on night waves, all in green. Yours for the whole run.' },
];

// ---------- 3D models ----------
const KIND = {
  pistol: { L: .24, H: .12, B: .05, stock: 0 }, revolver: { L: .2, H: .12, B: .16, stock: 0 },
  smg: { L: .36, H: .12, B: .12, stock: .22 }, bullpup: { L: .6, H: .14, B: .14, stock: 0 },
  rifle: { L: .5, H: .12, B: .3, stock: .26 }, long: { L: .6, H: .12, B: .45, stock: .3 },
  sniper: { L: .62, H: .13, B: .55, stock: .3 }, shotgun: { L: .42, H: .13, B: .42, stock: .28 },
  double: { L: .3, H: .12, B: .5, stock: .3 }, lmg: { L: .6, H: .16, B: .4, stock: .26 },
  melee: { L: .12, H: .04, B: .6, stock: 0 }, minigun: { L: .5, H: .2, B: .5, stock: 0 }, launcher: { L: .5, H: .16, B: .25, stock: .2 }, rail: { L: .7, H: .14, B: .3, stock: .22 },
};
export function buildGun(THREE, w) {
  const m = w.model, k = KIND[m.kind], g = new THREE.Group(), big = m.big ? 1.2 : 1;
  const mat = (c, e) => new THREE.MeshStandardMaterial({ color: c, roughness: .5, metalness: .15, emissive: e || 0, emissiveIntensity: e ? 1.4 : 0 });
  const body = mat(m.color), acc = mat(m.accent), ink = mat(0x2b2d42);
  const box = (sx, sy, sz, x, y, z, mt, rx = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mt); b.position.set(x, y, z); b.rotation.x = rx; g.add(b); return b; };
  const cyl = (r, len, x, y, z, mt, seg = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mt); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); g.add(c); return c; };
  const L = k.L * big, H = k.H * big, back = .1, front = back - L, Wd = (m.kind === 'minigun' ? .16 : .075) * big;
  let spinner = null, muzzleZ = front - k.B, sightY = H / 2 + .03;

  if (m.kind === 'minigun') {
    box(.16, .18, .3, 0, 0, 0, body); box(.06, .14, .1, 0, .14, .02, acc); box(.05, .16, .06, 0, -.15, .05, ink, .3);
    spinner = new THREE.Group(); spinner.position.z = -.15;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .55, 8), ink); c.rotation.x = Math.PI / 2; c.position.set(Math.cos(a) * .05, Math.sin(a) * .05, -.27); spinner.add(c); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.07, .015, 6, 16), acc); ring.position.z = -.45; spinner.add(ring);
    g.add(spinner); g.position.y = -.05; muzzleZ = -.7; sightY = .2;
    return { group: g, muzzleZ, sightY, spinner };
  }
  box(Wd, H, L, 0, 0, back - L / 2, body); // receiver
  if (m.kind === 'launcher') { cyl(.06, k.B + L * .7, 0, .03, front + L * .2 - k.B / 2, acc); muzzleZ = front - k.B * .7; }
  else if (m.kind === 'double') { cyl(.022, k.B, -.022, .02, front - k.B / 2, ink); cyl(.022, k.B, .022, .02, front - k.B / 2, ink); }
  else if (m.kind === 'rail') {
    box(.03, .03, k.B + .2, -.035, .02, front - k.B / 2 + .1, ink); box(.03, .03, k.B + .2, .035, .02, front - k.B / 2 + .1, ink);
    const glow = mat(m.accent, m.accent); box(.012, .02, L * .8, 0, H / 2 + .005, back - L / 2, glow); box(.02, .02, k.B, 0, .02, front - k.B / 2, glow);
  } else cyl(.02 * big, k.B, 0, H * .2, front - k.B / 2, ink);
  if (m.kind === 'revolver') cyl(.05, .07, 0, .005, front + .05, acc, 6);
  if (['rifle', 'long', 'sniper', 'lmg', 'smg'].includes(m.kind)) box(Wd + .015, H * .75, L * .35, 0, -.005, front + L * .17, acc); // handguard
  if (m.kind === 'shotgun') { cyl(.018, k.B * .85, 0, -H * .3, front - k.B * .4, ink); box(.06, .06, .14, 0, -H * .3, front - .08, acc); }
  if (m.kind === 'pistol') box(Wd + .006, .04, L, 0, H / 2 - .01, back - L / 2, acc);
  if (k.stock) box(.06, H * .85, k.stock, 0, -.02, back + k.stock / 2, m.kind === 'sniper' || m.kind === 'long' ? acc : body);
  box(.06, .16, .07, 0, -H / 2 - .07, m.kind === 'bullpup' ? front + .14 : (m.kind === 'pistol' || m.kind === 'revolver') ? back - .07 : back - .1, ink, .25); // grip
  // magazine
  const mz = m.kind === 'bullpup' ? back - .08 : front + L * .4, mk = m.mag || (m.kind === 'lmg' ? 'boxbig' : ['rifle'].includes(m.kind) ? 'box' : 'box');
  if (m.kind === 'pistol') { if (m.ext) box(.05, .12, .05, 0, -H / 2 - .2, back - .08, ink); }
  else if (['shotgun', 'double', 'revolver', 'launcher', 'rail'].includes(m.kind) && !m.mag) { }
  else if (mk === 'top') box(.07, .04, L * .55, 0, H / 2 + .02, back - L * .5, ink);
  else if (mk === 'drum') cyl(.07, .06, 0, -H / 2 - .07, mz, ink, 16).rotation.set(0, 0, Math.PI / 2);
  else if (mk === 'curved') box(.05, .2, .07, 0, -H / 2 - .09, mz, ink, .35);
  else if (mk === 'boxbig') box(.09, .14, .14, .02, -H / 2 - .07, mz, acc);
  else box(.05, .17, .07, 0, -H / 2 - .08, mz, ink, .12);
  if (m.kind === 'lmg') { box(.012, .18, .012, -.04, -.12, front + .04, ink, -.4); box(.012, .18, .012, .04, -.12, front + .04, ink, -.4); }
  // sights
  const sc = w.scope, top = H / 2;
  if (sc === 'iron') { box(.012, .03, .012, 0, top + .015, front + .02, ink); box(.04, .025, .012, 0, top + .012, back - .03, ink); sightY = top + .025; }
  else if (sc === 'dot') { box(.035, .035, .06, 0, top + .02, back - L * .45, ink); const d = new THREE.Mesh(new THREE.SphereGeometry(.0035), new THREE.MeshBasicMaterial({ color: 0xff2a2a })); d.position.set(0, top + .045, back - L * .45 - .02); g.add(d); box(.04, .006, .05, 0, top + .062, back - L * .45, ink); sightY = top + .045; }
  else if (sc === 'holo') {
    const z0 = back - L * .5; box(.05, .01, .07, 0, top + .005, z0, ink); box(.006, .05, .006, -.025, top + .03, z0 - .03, ink); box(.006, .05, .006, .025, top + .03, z0 - .03, ink); box(.056, .006, .006, 0, top + .057, z0 - .03, ink);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.008, .0012, 6, 20), new THREE.MeshBasicMaterial({ color: 0xff3b30 })); ring.position.set(0, top + .03, z0 - .03); g.add(ring); sightY = top + .03;
  } else { // magnified scope tube
    const z0 = back - L * .45, len = .22 + (parseInt(sc) || 4) * .008; cyl(.03, len, 0, top + .055, z0, ink, 14); cyl(.038, .04, 0, top + .055, z0 - len / 2, ink, 14); cyl(.036, .04, 0, top + .055, z0 + len / 2, ink, 14);
    box(.02, .03, .02, 0, top + .015, z0 - .05, ink); box(.02, .03, .02, 0, top + .015, z0 + .05, ink); sightY = top + .055;
  }
  return { group: g, muzzleZ, sightY, spinner };
}

// Side-view silhouette for the shop
export function drawSilhouette(cv, w) {
  const c = cv.getContext('2d'), m = w.model, k = KIND[m.kind], s = cv.width / 1.35, big = m.big ? 1.2 : 1;
  c.clearRect(0, 0, cv.width, cv.height);
  const total = k.L + k.B + (k.stock || 0), ox = (cv.width - total * s * big) / 2, oy = cv.height * .5;
  const R = (x, y, wd, h, col, rot = 0) => { c.save(); c.translate(ox + x * s * big, oy + y * s * big); c.rotate(rot); c.fillStyle = col; c.fillRect(0, 0, wd * s * big, h * s * big); c.restore(); };
  const hex = n => '#' + n.toString(16).padStart(6, '0'), body = hex(m.color), acc = hex(m.accent), ink = '#2b2d42';
  const B = k.B, L = k.L, H = k.H;
  if (m.kind === 'minigun') { for (let i = 0; i < 3; i++) R(0, -.06 + i * .04, .55, .02, ink); R(.5, -.09, .32, .2, body); R(.62, .1, .06, .14, ink, -.3); return; }
  if (m.kind === 'melee') { const st = m.style, bl = st === 'katana' ? .75 : st === 'scythe' ? .9 : st === 'machete' ? .5 : st === 'knife' ? .3 : .55; // blade or head, then the handle
    if (st === 'bat') { R(.05, -.05, .7, .1, body); R(.75, -.025, .25, .05, acc); return; }
    if (st === 'sledge') { R(.05, -.12, .16, .24, body); R(.21, -.02, .7, .04, acc); return; }
    if (st === 'scythe') { R(.05, -.16, .06, .36, body, -.5); R(.08, -.02, .85, .035, acc); return; }
    if (st === 'claws') { for (let i = 0; i < 3; i++) R(.1, -.07 + i * .05, .35, .02, body, -.15); R(.45, -.08, .2, .16, acc); return; }
    R(.05, -.04, bl, .07, body); R(.05 + bl, -.07, .03, .14, ink); R(.08 + bl, -.03, st === 'katana' ? .3 : .2, .06, acc); return; }
  R(0, -H * .3, B, m.kind === 'launcher' ? .12 : .035, m.kind === 'rail' ? '#4fd1c5' : ink);
  R(B, -H / 2, L, H, body);
  if (k.stock) R(B + L, -H * .4, k.stock, H * .85, acc);
  R(B + L * (m.kind === 'bullpup' ? .25 : .8), H / 2, .06, .15, ink, -.25);
  if (!['shotgun', 'double', 'revolver', 'launcher', 'rail', 'pistol'].includes(m.kind) || m.mag) R(B + L * (m.kind === 'bullpup' ? .75 : .45), H / 2, .06, m.kind === 'lmg' ? .14 : .17, ink, m.mag === 'curved' ? -.3 : -.1);
  if (w.scope.match(/\d/)) R(B + L * .3, -H / 2 - .07, .26, .06, ink);
  else if (w.scope !== 'iron') R(B + L * .45, -H / 2 - .045, .07, .045, ink);
}

// ---------- sidearm workshop: your starting Pip-9 can be upgraded during a run, all the way to a monster ----------
// Each tier changes the gun's numbers (and from Mk III on, adds fire modes). Upgrades last for the run.
export const PIP_TIERS = [
  { name: 'Pip-9', price: 0, blurb: 'Factory stock.' },
  { name: 'Pip-9 Mk II', price: 450, blurb: '+20% damage, 18-round mag.', mul: { dmg: 1.2 }, set: { mag: 18 } },
  { name: 'Pip-9 Mk III', price: 1000, blurb: 'Adds 3-round burst. 20% less recoil.', mul: { dmg: 1.25, recoilV: .8, recoilH: .8 }, set: { mag: 21, modes: ['semi', 'burst'], burst: 3 } },
  { name: 'Pip-9 Mk IV', price: 1900, blurb: 'Full auto. Faster fire, 24-round mag.', mul: { dmg: 1.35, recoilV: .75, recoilH: .75 }, set: { mag: 24, rpm: 620, modes: ['auto', 'burst', 'semi'] } },
  { name: 'Pip-9 Mk V', price: 3300, blurb: 'Hits harder, 30-round mag, tighter aim. Headshots ignore Heavy helmets.', mul: { dmg: 1.55, recoilV: .7, recoilH: .7, ads: .7, hip: .8 }, set: { mag: 30, rpm: 760, modes: ['auto', 'burst', 'semi'], apHead: true } },
  { name: 'Pip Prime', price: 5600, blurb: 'The final form. Pierces 1 bot, 36-round mag, 30% faster reloads, gold finish.', mul: { dmg: 1.8, recoilV: .6, recoilH: .6, ads: .6, hip: .7, reload: .7, emptyReload: .7, range: 1.4, falloff: 1.4 }, set: { mag: 36, rpm: 900, modes: ['auto', 'burst', 'semi'], apHead: true, pierce: 1 }, gold: true },
];
// apply tiers on top of a computed weapon (stat multipliers stack from tier 1 up to the current tier's numbers)
export function applyPipTier(w, tier) {
  if (!tier) return w;
  const T = PIP_TIERS[Math.min(tier, PIP_TIERS.length - 1)], o = { ...w, name: T.name, pipTier: tier };
  for (const k in T.mul || {}) o[k] *= T.mul[k];
  for (const k in T.set || {}) o[k] = k === 'mag' ? Math.max(o.mag, Math.round(T.set.mag * (w.mag / 15))) : T.set[k];
  o.reserve = Math.max(o.reserve, o.mag * 6);
  if (T.gold) o.model = { ...o.model, color: 0xd4a73a, accent: 0xfff1c0 };
  return o;
}
