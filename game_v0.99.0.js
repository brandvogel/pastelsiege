import { uiFont, THREE, renderer, scene, camera, world, loadMap, resolveCircle, groundAt, ceilingAt, lineOfSight, boxAt, insideSolid, openPoint, clamp, rand,
  tracer, beam, sparks, shell, decal, smoke, explosionFx, flashLight, updateFx, updateAtmos, fxSettings, SND, ac, setQuality, SUN_DIR, setWeather, lightningBolt, skyFlash, WEATHER, underCover, rayWall, collidersNear, followShadow, updatePads, updateEdges, setNight, followGlow, setResScale, getResScale, setResPct, renderPct, QUALITY, quality, IS_MAC, RETINA, APPLE_SI, CHIP, goreBurst, gibs, splat, bloodColor } from './world_v0.99.0.js';
import { setVolume, musicStart, musicLevel, musicSong, setMusicVolume, at3, setListener, audioSettings, setAmbience, ambienceLevel, ambienceTick, ambienceCover, setStepSurface, audioClock } from './audio_v0.99.0.js';
import { makePost } from './post_v0.99.0.js';
import { XH_STYLES, XH_COLORS, XH_DEFAULT, XH_PRESETS, mountCrosshair, spreadCrosshair, crosshairSVG, crosshairCode, parseCrosshair } from './crosshair_v0.99.0.js';
import { generateMap } from './mapgen_v0.99.0.js';
import { byId, WEAPONS, drawSilhouette, PIP_TIERS, applyPipTier } from './weapons_v0.99.0.js';
import { buildGun, addArms, decorateGun, makeEnv } from './models_v0.99.0.js';
import { muzzleFlash, mergeChildren } from './gunkit_v0.99.0.js';
import { prepare as vmPrepare, reloadPose, flourishPose, FLOURISH, dropMag, updateMags, clearMags, makeHandShell } from './vmanim_v0.99.0.js';
import { Bot, bots, ctx, guardProps, updateShots, clearBots, updateDebris, updateLOD, TYPES, SPAWN_EXTRA, mates, botByNid, ghostBolt, puppetStep, laserOf as botLaser } from './bots_v0.99.0.js';
import { Shop, compareBars, fineStats, ttk } from './shop_v0.99.0.js';
import { computeWeapon, attById, SLOT_NAMES, LASER_COLS, LASER_LV, laserCol } from './attachments_v0.99.0.js';
import { SKINS, skinById, prog, saveProg, sealSave, openSave, dropSave, tamper, levelOf, gunLevel, applyLevel, xpForLevel, MAX_LEVEL, TIER_COL } from './skins_v0.99.0.js';
import { CHARMS, charmById, buildCharm, updateCharm } from './charms_v0.99.0.js';
prog.charms = prog.charms || ['none']; prog.charmOf = prog.charmOf || {};
import { SUPPORT, support, hctx, buySupport, buyCharge, setSupport, useScan, slv, supById, supNextPrice, owned, deployTurret, launchStriker, updateSupport, floorChange, clearSupport } from './helpers_v0.99.0.js';
import { ABILITIES, abById, abNextPrice, abMax, AB } from './abilities_v0.99.0.js';
import { MUTATIONS, mutById, MUT_STEPS, nextStep, applyMuts, offers, MV, mutDesc, ROMAN, MAX_MLV } from './mutations_v0.99.0.js';
import { levelInfo, levelPerks, LEVEL_REWARDS, nextReward, XP_FOR, xpForFloor, ensureDaily, questById, markPlayed, streakXp, questTick, recordRun } from './meta_v0.99.0.js';
import { ACTIONS, NOBIND, setBinds, bindIn, rebind, keyLabel } from './controls_v0.99.0.js';
import { PLATFORM, allowed, enforce, sdkInit, sdkLoaded, playState, midAd, happy, audioGate, adBusy } from './platform_v0.99.0.js';
import * as NET from './net_v0.99.0.js';
import { account, staff, saveSig, progressSig, signIn, signUp, resendSignUp, changeEmail, refreshUser, confirmsEmail, finishLink, signOut, resume as resumeAccount, cloudGet, cloudPut, syncInfo, setSync, friendList, ping, addFriend, acceptFriend, removeFriend, testerList, setTester, playerList, giveRole, kick as kickPlayer, mute as mutePlayer, muteInfo, submitScore, topScores, clearScores, rank, ROLE_NAME, roleOf } from './account_v0.99.0.js';
import { MODS, modById, doorOffers, CHARS, charById, charUnlocked, PERK, UPGRADES, upgCost, upgPoints, ACH, todayKey, dailySeed, mulberry, paintGoal } from './run_v0.99.0.js';

const $ = id => document.getElementById(id);
const V3 = THREE.Vector3, lerp = THREE.MathUtils.lerp;
const DIFF = { easy: { acc: .55, dmg: .6, react: 1.5, cash: 1.25 }, normal: { acc: .8, dmg: 1, react: 1, cash: 1 }, hard: { acc: 1, dmg: 1.35, react: .65, cash: .9 } };
const MAX_NADES = 4;
let diff = DIFF.normal, mapDef = null, state = 'menu';
let wave = 0, score = 0, breakT = 0, runTime = 0, godmode = false, stragglerT = 0, cheatRun = false;
const cheats = { slow: false, bouncy: false, confetti: false }; // code toggles (reset every run)
// admin panel switches (the ` key in a run). Only staff can open the panel: you and your bug testers. A run where any of
// them is used doesn't give XP, badges or leaderboard spots.
const ADM_OFF = { god: false, fly: false, ammo: false, auto: false, aim: false, onehit: false, speed: 1, freeze: false, ghost: false, esp: false, steady: false, nocd: false, jump: false, aura: false, rapid: false, slow: false };
const adm = { ...ADM_OFF };
const admOn = () => Object.keys(ADM_OFF).some(k => adm[k] !== ADM_OFF[k]);
let frozenDrawn = false; // solo menus show one still frame (see the end of frame())
const stats = { kills: 0, fired: 0, hit: 0, heads: 0, earned: 0, bestStreak: 0 };
const runXP = {};

// version shown at the bottom of Settings, taken from this file's name (game_v0.99.0.js -> v0.97.0) so it can't go out of date
const GAME_VERSION = (import.meta.url.match(/_(v\d+\.\d+\.\d+)\.js/) || [, 'dev'])[1];
// ---------- settings (saved) ----------
const SET_KEY = 'pastelSiegeSettings12';
const SET_DEFAULT = { font: 'futura', sens: 1, adsSens: 1, fov: 80, vol: .8, music: .55, blood: 'red', dmgNums: true, shake: true, fps: false,
  quality: 'high', rt: 'auto', rtRefl: true, sunRays: true, mblur: 'off', bloom: true, grain: true, vignette: true, hud: 1, hitmarkers: true, hmColor: '#fffaf0', spatial: 'hrtf', gore: 'extreme', autoRes: true, res: 'auto', sharpen: .35, wobble: 1, fpsCap: '0', padSens: 1, invertY: false, toggleAds: false, crouchHold: false, bob: 1, hurtFx: 1, minimap: true, killfeed: true, toasts: true, xh: { ...XH_DEFAULT } };
const settings = (() => {
  let s = null; try { s = JSON.parse(localStorage.getItem(SET_KEY)); } catch (e) { }
  const out = Object.assign({}, SET_DEFAULT, s || {}); enforce(out); // game sites limit gore
  // edited settings can't go past what the sliders allow (a huge field of view sees around corners)
  const lim = (k, a, b) => { out[k] = Math.min(b, Math.max(a, Number.isFinite(+out[k]) ? +out[k] : SET_DEFAULT[k])); };
  lim('fov', 65, 110); lim('sens', .2, 3); lim('adsSens', .3, 1.5); lim('padSens', .3, 2.5); lim('hud', .75, 1.25);
  // first launch on a low-memory machine: start on Potato (or Low) so it runs; it can be changed in Settings
  // "Uncapped" used to be the default but it draws frames out of step with the screen; move old saves to Monitor once
  if (s && !s.fpsMig && s.fpsCap === 'uncapped') out.fpsCap = '0'; out.fpsMig = 1;
  // first launch on a Mac (Safari doesn't report memory): M-chip Macs start on High, Intel Macs on Medium
  if (!s && IS_MAC) out.quality = APPLE_SI ? 'high' : 'medium';
  else if (!s && navigator.deviceMemory) out.quality = navigator.deviceMemory <= 2 ? 'potato' : navigator.deviceMemory <= 4 ? 'low' : out.quality; out.xh = Object.assign({}, XH_DEFAULT, (s && s.xh) || {}); return out;
})();
const post = makePost(THREE, renderer, IS_MAC && RETINA);
if (IS_MAC) document.documentElement.classList.add("mac");
renderer.info.autoReset = false; let drawCalls = 0;
let lastQuality = null;
// a Custom preset made by the graphics test (Settings > Graphics)
if (settings.customQ && typeof settings.customQ === "object") QUALITY.custom = settings.customQ; else if (settings.quality === "custom") settings.quality = "high";
// Font picker (Settings > HUD): Futura is built into Macs only, so on Windows and Chromebooks the game fell back to a
// plain font. The others load from Google Fonts the first time they're shown, so they look the same on every computer.
const FONT_FALLBACK = '"Futura","Avenir Next","Trebuchet MS",sans-serif';
const FONTS = [['futura', 'Futura', null], ['fredoka', 'Fredoka', 'Fredoka:wght@500;600;700'], ['lilita', 'Lilita One', 'Lilita+One'], ['baloo', 'Baloo 2', 'Baloo+2:wght@600;700;800'],
  ['titan', 'Titan One', 'Titan+One'], ['bungee', 'Bungee', 'Bungee'], ['russo', 'Russo One', 'Russo+One'], ['nunito', 'Nunito', 'Nunito:wght@700;800;900'], ['luckiest', 'Luckiest Guy', 'Luckiest+Guy']];
const fontsLoaded = new Set();
const fontFam = f => f[2] ? `"${f[1]}", ${FONT_FALLBACK}` : `"Futura","Avenir Next Condensed","Avenir Next","Trebuchet MS",sans-serif`;
function loadFont(f) {
  if (!f?.[2] || fontsLoaded.has(f[0])) return; fontsLoaded.add(f[0]);
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${f[2]}&display=swap`; document.head.appendChild(l);
}
function applyFont() {
  const f = FONTS.find(x => x[0] === settings.font) || FONTS[0]; loadFont(f);
  document.documentElement.style.setProperty('--display', fontFam(f));
}
function applySettings() {
  frozenDrawn = false; // redraw the frozen world with the new settings
  applyFont();
  if (!settings.binds || typeof settings.binds !== 'object') settings.binds = {}; setBinds(settings.binds); refreshKeyHints();
  fxSettings.blood = settings.blood; fxSettings.gore = settings.gore; setVolume(settings.vol); setMusicVolume(settings.music); audioSettings.spatial = settings.spatial;
  $('fps').style.display = settings.fps ? 'block' : 'none';
  if (settings.quality !== lastQuality) {
    lastQuality = settings.quality; const q = setQuality(settings.quality);
    post.enabled = q.post; if (post.samples !== q.samples) post.setSamples(q.samples);
    post.sunDir = SUN_DIR;
  }
  // ray tracing: the preset decides (on at Max for Super Ultra) unless you pick a level; it needs post effects (Medium and up)
  const Q = QUALITY[settings.quality] || QUALITY.high, rtMode = settings.rt === 'auto' || !settings.rt ? (Q.hq ? 'max' : 'off') : settings.rt;
  post.rt = post.enabled ? ({ off: 0, perf: 1, quality: 2, max: 3 })[rtMode] ?? 0 : 0;
  post.refl = settings.rtRefl !== false; post.rays = settings.sunRays !== false; post.mblur = post.enabled ? ({ low: 1, high: 2 })[settings.mblur] || 0 : 0;
  setResPct(settings.res === 'auto' ? 0 : settings.res); post.uniforms.sharp.value = +settings.sharpen || 0;
  post.bloomOn = settings.bloom && post.enabled && (QUALITY[settings.quality] || {}).bloom !== false;
  post.uniforms.grain.value = settings.grain ? .018 : 0; post.uniforms.vig.value = settings.vignette ? .28 : 0;
  document.documentElement.style.setProperty('--hud', settings.hud);
  document.documentElement.style.setProperty('--hm', settings.hmColor);
  mountCrosshair($('crosshair'), settings.xh);
  $('hud').classList.toggle('nomm', !settings.minimap); $('hud').classList.toggle('nokf', !settings.killfeed); document.body.classList.toggle('notoast', !settings.toasts);
  try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (e) { }
}
applySettings();

// ---------- player ----------
const player = { pos: new V3(), vel: new V3(), yaw: 0, pitch: 0, hp: 100, maxHp: 100, spdMul: 1, armor: 0, onGround: true, crouch: 0, crouchOn: false, eyeH: 1.7, camOff: 0,
  cash: 800, nades: 1, slots: { primary: null, secondary: null, melee: null }, locker: {}, cur: 'secondary', prev: 'primary', switchT: 0, adsT: 0, breath: 4, exhale: 0,
  recoilDebt: 0, yawDebt: 0, bloom: 0, sinceShot: 9, sprayN: 0, burstLeft: 0, semiReady: true, spin: 0, kick: 0, shake: 0, sprinting: false, sprintRecover: 0,
  lagX: 0, lagY: 0, bob: 0, cooking: false, cookT: 0, lean: 0, slideT: 0, slideCd: 0, slideQ: false,
  dashT: 0, dashCd: 0, dashQ: false, jumpQ: false, wallT: 0, wallSide: 0, lastWall: 0, wallBudget: 1.4, mantle: null, roll: 0, fovKick: 0,
  ab: { dash: 1, slam: 1, djump: 1 }, dashCh: 1, grap: null, grapCd: 0, grapQ: false, slamCd: 0, slamming: false, jumpsLeft: 0, airPress: false, gliding: false,
  streak: 0, inspectT: 0, stepT: 0, landDip: 0 };
// cash, health, armour and grenades can only be changed by the game itself (see "memory editing" in the bots file)
guardProps(player, ["cash", "hp", "maxHp", "armor", "nades"], () => cheatFlag("memory editing"));
ctx.player = player; ctx.playing = () => state === "playing"; ctx.hurt = (d, src, head) => { hurt(d, src, false); if (head && state === "playing") { medalHead(); } }; ctx.diff = diff;
// a bot headshot on you: a sharp ring, a white flash and a big kick
function medalHead() { SND.head(); player.pitch += .03; player.shake += .4; const f = $("headflash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }
ctx.explode = (p, r, d, o) => explode(p, r, d, o);
ctx.whizz = s => at3(s.mesh.position.clone(), () => SND.whizz(0));
hctx.player = player;
hctx.damage = (bot, dmg, point, dir, name) => damageBot(bot, dmg, false, point, name, dir, { helper: true });
hctx.explode = (p, r, d, o) => explode(p, r, d, o);
hctx.heal = n => { player.hp = Math.min(player.maxHp, player.hp + n); };
const keys = {}; let trigger = false, adsHeld = false;

// Each owned gun keeps its base stats plus fitted attachments and its level perks; `w` is the combined result used everywhere.
// The gun's final stats: attachments, mastery level, sidearm upgrades (Pip-9 only), then mutations.
// Mutation levels: built-in ones (from the gun) start at II, special ammo at I; picks during the run can raise either.
function computeW(base, att, picked = {}) {
  let w0 = applyLevel(computeWeapon(base, att), gunLevel(base.id));
  if (base.id === 'pip') w0 = applyPipTier(w0, player.pipTier || 0);
  const ml = {};
  for (const id of base.innate || []) ml[id] = Math.max(ml[id] || 0, 2);
  for (const id of w0.attMuts) ml[id] = Math.max(ml[id] || 0, 1);
  for (const id in picked) ml[id] = Math.max(ml[id] || 0, picked[id]);
  return applyMuts(w0, ml);
}
// mk = kills with this gun this run, pend = mutations waiting to be picked, thirst = Bloodthirst bonus this wave
const inst = id => { const base = byId(id), w = computeW(base, {}, {}); return { base, att: {}, ml: {}, mk: 0, pend: 0, thirst: 0, w, mag: w.mag, reserve: w.reserve, mode: 0, reloadT: 0, reloadTotal: 0, shellMode: false, cycleT: 0, fireCd: 0 }; };
function refit(it) {
  const oldMag = it.w.mag;
  it.w = computeW(it.base, it.att, it.ml);
  if (it.w.mag !== oldMag) { const back = Math.max(0, it.mag - it.w.mag); it.mag = Math.min(it.mag, it.w.mag); it.reserve += back; }
  it.mode = Math.min(it.mode, it.w.modes.length - 1); it.reloadT = 0; it.shellMode = false;
  if (it === cur()) equipView();
}
const cur = () => player.slots[player.cur];
const skinFor = id => skinById(prog.skinOf[id] || 'factory');

// view model: drawn in its own scene on top of the world, so it never clips into walls and keeps a steady size when you zoom
let view = null;
const gunScene = new THREE.Scene(), gunCam = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, .01, 10);
gunScene.add(gunCam, new THREE.HemisphereLight(0xfff6e6, 0x8f8270, 1.1)); gunScene.environment = makeEnv(THREE, renderer); gunScene.environmentIntensity = .95;
const gunSun = new THREE.DirectionalLight(0xfff1dc, 2.4); gunSun.position.set(1.5, 3, 1); gunScene.add(gunSun);
const gunRim = new THREE.DirectionalLight(0x9cc5d6, 1.1); gunRim.position.set(-2, 1, -2); gunScene.add(gunRim);
const gunFlash = new THREE.PointLight(0xffc46b, 0, 1.2, 2); gunFlash.position.set(0, 0, -.6); gunCam.add(gunFlash);
renderer.autoClear = false;
addEventListener('resize', () => { gunCam.aspect = innerWidth / innerHeight; gunCam.updateProjectionMatrix(); compassW = 0; frozenDrawn = false; });
const laserDot = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a2a).multiplyScalar(4) })); laserDot.visible = false; scene.add(laserDot);
// gun-space point -> world point
// The gun is drawn by its own camera (fixed 54° view) on top of the world, which uses your FOV setting plus the sprint
// and slide FOV kick. To put muzzle flashes, tracers and shells where the gun *looks* like it is, a point on the gun is
// moved to the same spot on screen in the world camera (same depth, scaled by the difference in view width).
const gunToWorld = p => { const k = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.tan(THREE.MathUtils.degToRad(gunCam.fov / 2)); p.x *= k; p.y *= k; return camera.localToWorld(p); };
const toWorld = v => { view.group.updateMatrixWorld(true); return gunToWorld(view.group.localToWorld(v)); };
const shown = { p: new V3(), q: new THREE.Quaternion(), ok: false };
const HIP = new V3(.2, -.19, -.4), HIP_PISTOL = new V3(.17, -.16, -.4), AKX = -.34; // AKX: how far left the second of two pistols sits
// Dual pistols: a second copy of the gun goes in the left hand. Each gun sits in its own pivot at its grip, so it can kick,
// twirl and roll on its own while the hands stay put.
function makeAkimbo(v, w, skin) {
  const wrap = (kids, grip, x) => { const P = new THREE.Group(), I = new THREE.Group(); P.position.set(grip.x + x, grip.y, grip.z); I.position.set(-grip.x, -grip.y, -grip.z); kids.forEach(c => I.add(c)); P.add(I); v.group.add(P); return [P, I]; };
  const [R, IR] = wrap([...v.group.children], v.grip, 0);
  const lw = { ...w, model: { ...w.model, ...(w.model.left || {}) } }, o2 = buildGun(THREE, lw, skin); decorateGun(THREE, o2, lw);
  if (o2.laser) o2.group.remove(o2.laser); // one laser is plenty
  const [L, IL] = wrap([...o2.group.children], o2.grip, AKX);
  v.ak = { R, L, inner: [IR, IL], slide: [v.slide, o2.slide], mag: [v.magG, o2.magG], gripL: o2.grip.clone().setX(o2.grip.x + AKX), kick: [0, 0], sz: [0, 0], next: 0, flash: [] };
  v.magG = null; v.slide = null; // the one-gun reload and slide code leaves them alone; poseAkimbo moves both guns
}
// a point on one of the two pistols (0 = right, 1 = left), in world space
const akPt = (side, p) => { view.group.updateMatrixWorld(true); return gunToWorld(view.ak.inner[side].localToWorld(p)); };
function equipView() {
  if (view) gunCam.remove(view.group);
  view = buildGun(THREE, cur().w, skinFor(cur().base.id));
  decorateGun(THREE, view, cur().w);
  if (cur().w.akimbo) makeAkimbo(view, cur().w, skinFor(cur().base.id));
  addArms(THREE, view, NET.lookColors(prog.look)); // your arms wear your character's colours
  // reload animation: where the mag sits, and how far the left hand moves to hold it by the base
  if (view.magG) { view.group.updateMatrixWorld(true); const bx = new THREE.Box3().setFromObject(view.magG);
    if (!bx.isEmpty()) { view.magMid = bx.getCenter(new V3()); if (view.leftHand) view.handToMag = new V3(view.magMid.x, view.magUp ? bx.max.y : bx.min.y, view.magMid.z).sub(view.leftHand); } }
  // keyframed reloads: anchor points on this gun (mag well, pouch, charging handle...), and the round your hand carries
  vmPrepare(view, cur().w); const drawn = player.drawnGuns || (player.drawnGuns = new Set()); view.wantDraw = !drawn.has(cur().base.id); drawn.add(cur().base.id); view.handCur = view.A.rest.clone(); view.raG = [0, 0, 0, 0, 0, 0]; view.hrCur = [0, 0, 0];
  if (view.leftRig && (view.fam === 'shell' || view.fam === 'break')) { view.handShell = makeHandShell(THREE, cur().w.cat === 'Shotgun'); view.handShell.visible = false; view.leftRig.hand.add(view.handShell); }
  view.group.traverse(o => { if (o.isMesh) o.castShadow = false; });
  // static parts: one mesh per material (the moving parts too, inside their own groups)
  for (const g of [view.group, ...(view.ak ? view.ak.inner : []), view.slide, view.magG, view.bolt, view.pump, view.chargeG, view.cyl, view.spinner, ...(view.ak ? [...view.ak.slide, ...view.ak.mag] : [])]) if (g) mergeChildren(THREE, g);
  view.flash = muzzleFlash(THREE); view.flash.visible = false; view.flash.traverse(o => o.material?.color.setRGB(3.2, 2.6, 2)); // HDR-bright so it blooms
  view.flash.position.set(0, view.boreY, view.muzzleZ - .02);
  if (view.ak) { view.ak.inner[0].add(view.flash); const f2 = view.flash.clone(); f2.traverse(o => { if (o.material) o.material = o.material.clone(); }); view.ak.inner[1].add(f2); view.ak.flash = [view.flash, f2]; }
  else view.group.add(view.flash);
  fitLaser(cur());
  view.slideZ = 0; view.cylT = 0; view.insY = 0; view.insZ = 0; view.insR = 0; view.insX = 0;
  // charm hangs off the right side of the receiver
  view.charm = buildCharm(THREE, prog.charmOf[cur().base.id]);
  if (view.charm) { view.charm.anchor.position.set(view.pistol ? .018 : .036, (view.top ?? .03) - .012, (view.back ?? .1) - (view.pistol ? .04 : .1)); view.group.add(view.charm.anchor); }
  // aim-down-sights pose: rear sight lined up with the eye; pistols are held out at arm's length
  const relief = view.pistol ? .42 : magnified(cur().w) ? .1 : .15;
  view.ads = view.ak ? new V3(.16, -.125, -.37) : new V3(0, -view.sightY, -relief - view.rearZ); // two pistols: both come up and in, no sights
  gunCam.add(view.group); lastSlotsKey = ''; renderSlots();
}
function switchTo(slot, instant) {
  if (!player.slots[slot] || (slot === player.cur && !instant)) return;
  if (settings.toggleAds) adsHeld = false; const old = cur(); if (old) { old.reloadT = 0; old.shellMode = false; }
  player.prev = player.cur; player.cur = slot; player.switchT = instant ? .2 : cur().w.draw;
  player.burstLeft = 0; player.spin = 0; player.inspectT = 0; equipView(); SND.magIn();
}
// tilted aim skips the scope: you look past it down the side, so it counts as unmagnified
const magnified = w => /\d/.test(w.scope) && !player.cant;

// ---------- gun renders for the shop, HUD and armory ----------
// A small second renderer draws each gun's real 3D model from the right-hand side, once, and caches the picture.
// Renders are queued and done a few per frame so opening the shop never stutters.
const thumbCache = new Map(), thumbQ = [];
let thumbR = null, thumbScene = null, thumbCam = null;
function thumbSetup() {
  thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  thumbR.setPixelRatio(1); thumbR.setSize(640, 240, false); thumbR.toneMapping = THREE.NeutralToneMapping; thumbR.toneMappingExposure = 1.1;
  thumbScene = new THREE.Scene(); thumbScene.environment = makeEnv(THREE, thumbR); thumbScene.environmentIntensity = .9;
  thumbScene.add(new THREE.HemisphereLight(0xfff6e6, 0x8f8270, 1.2));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(2, 3, 1); thumbScene.add(key);
  const rim = new THREE.DirectionalLight(0x9cc5d6, 1.4); rim.position.set(-1, 1, -3); thumbScene.add(rim);
  thumbCam = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 20);
}
function renderThumb(w) {
  if (!thumbR) thumbSetup();
  const v = buildGun(THREE, w, skinFor(w.id)); decorateGun(THREE, v, w);
  if (v.inner) v.inner.rotation.set(-Math.PI / 2, 0, 0); // melee: lay it flat, blade pointing ahead
  const g = v.group; thumbScene.add(g); g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new V3()), s = box.getSize(new V3());
  // three-quarter view of the right side, muzzle pointing right
  const dir = new V3(1, .28, .22).normalize(); thumbCam.position.copy(c).addScaledVector(dir, 3); thumbCam.lookAt(c);
  const aspect = 640 / 240, halfW = Math.max(s.z * .56, s.y * .6 * aspect, .1) * 1.06;
  Object.assign(thumbCam, { left: -halfW, right: halfW, top: halfW / aspect, bottom: -halfW / aspect }); thumbCam.updateProjectionMatrix();
  thumbR.setClearColor(0, 0); thumbR.clear(); thumbR.render(thumbScene, thumbCam);
  const out = document.createElement('canvas'); out.width = 640; out.height = 240; out.getContext('2d').drawImage(thumbR.domElement, 0, 0);
  thumbScene.remove(g); g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(m => m.dispose()); } });
  return out;
}
const thumbKey = w => `${w.id}|${prog.skinOf[w.id] || 'factory'}|${w.model.color}|${w.scope}`;
function paintThumb(cv, img) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height; x.clearRect(0, 0, W, H);
  // fit the 640×240 render into the canvas, keeping its shape, with a soft shadow under it
  const k = Math.min(W / 640, H / 240), dw = 640 * k, dh = 240 * k, ox = (W - dw) / 2, oy = (H - dh) / 2;
  x.fillStyle = 'rgba(43,45,66,.13)'; x.beginPath(); x.ellipse(W / 2, oy + dh * .9, dw * .36, Math.max(2, dh * .05), 0, 0, 7); x.fill();
  x.drawImage(img, ox, oy, dw, dh);
}
function gunThumb(cv, w) {
  const key = thumbKey(w), img = thumbCache.get(key);
  if (img) return paintThumb(cv, img);
  drawSilhouette(cv, w); cv.dataset.tk = key;
  if (!thumbQ.some(q => q.cv === cv)) thumbQ.push({ cv, w, key });
}
function pumpThumbs() {
  const t0 = performance.now();
  while (thumbQ.length && performance.now() - t0 < (state === 'playing' ? 1 : 10)) {
    const { cv, w, key } = thumbQ.shift();
    let img = thumbCache.get(key);
    if (!img) { try { img = renderThumb(w); thumbCache.set(key, img); } catch (e) { thumbCache.set(key, null); console.warn('gun render', e); continue; } }
    if (img && document.body.contains(cv) && cv.dataset.tk === key) paintThumb(cv, img);
  }
}
// ---------- floors (the tower) ----------
// Every 5 waves you climb to a new floor: a fresh random map that's bigger than the last.
let floorN = 1;
const floorOf = n => Math.floor((n - 1) / 5) + 1;
// Get the graphics card to build the shaders for bosses, Titans and elites while you're on the menu.
// Otherwise the first time one shows up mid-fight the game freezes for a moment (worst on Macs).
let warmedQ = null;
function warmShaders() {
  if (warmedQ === settings.quality) return; warmedQ = settings.quality;
  try {
    const tmp = [new Bot('boss', openPoint()), new Bot('titan', openPoint()), new Bot('grunt', openPoint(), { elite: true })];
    renderer.compile(scene, camera); tmp.forEach(b => b.remove());
  } catch (e) { }
}
function setupMenuScene() {
  clearAll(); mapDef = generateMap(1 + Math.floor(Math.random() * 3)); mapDef.night = false; loadMap(mapDef);
  for (let i = 0; i < 9; i++) bots.push(new Bot(['scout', 'grunt', 'heavy', 'sniper', 'drone', 'shield', 'medic', 'brawler', 'bomber'][i], openPoint()));
  warmShaders();
}
function placePlayer() {
  const [sx, sz] = mapDef.spawn; player.pos.set(sx, 0, sz); player.vel.set(0, 0, 0); player.yaw = 0; player.pitch = 0; player.mantle = null;
  camera.position.set(sx, 1.7, sz); camera.rotation.set(0, 0, 0); camera.updateMatrixWorld();
}
function enterFloor(f) {
  floorN = f;
  clearAll(); mapDef = dailyRun ? generateMap(f, dailySeed() + f * 7919) : generateMap(f); loadMap(mapDef); placePlayer(); floorChange();
  if (coop?.role !== 'guest') applyWeather(rollWeather(f, dailyRun ? mulberry(dailySeed() + f * 31) : Math.random));
  if (coop?.role === "host") NET.toFriends({ t: "cfloor", floor: f, seed: mapDef.seed, mod: floorMod.id, wx: weather });
  if (floorMod.id !== 'blood') player.hp = Math.min(player.maxHp, player.hp + 25);
  paint = 0; paintFills = 0; addPaint(0); life('floor', f, true); player.floorHit = false;
  // Sidearm Supremacy: floors reached without ever having owned a primary this run
  if (player.slots.primary || Object.values(player.locker || {}).some(it => it?.base.slot === 'primary')) player.hadPrimary = true;
  if (!player.hadPrimary && !dailyRun) life('pistolfl', f, true); renderModChip();
  $('mmlabel').textContent = `${mapDef.name.toUpperCase()} · ${mapDef.sizeLabel || ''} · ${mapDef.size * 2}M`;
}
document.querySelectorAll('#diff button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#diff button').forEach(x => x.classList.remove('sel')); b.classList.add("sel"); diffKey = b.dataset.d; diff = ctx.diff = DIFF[diffKey]; SND.ui();
});

// ---------- pickups / grenades ----------
const pickups = [], nades = [];
function dropPickup(p, kind) {
  const col = kind === 'hp' ? 0x81b29a : 0xf2cc8f;
  const m = new THREE.Mesh(kind === 'hp' ? new THREE.OctahedronGeometry(.32) : new THREE.BoxGeometry(.5, .32, .36), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .5 }));
  m.add(new THREE.Mesh(new THREE.TorusGeometry(.5, .04, 6, 20), new THREE.MeshBasicMaterial({ color: 0xfffaf0 })));
  m.position.set(p.x, .8, p.z); scene.add(m); pickups.push({ mesh: m, t: 0, kind });
}
// a proper frag grenade: ridged olive body, fuse cap, safety lever down the side, the pull ring, and a red light that
// blinks faster as the fuse runs out. Built once; every throw is a cheap copy sharing the same shapes.
let fragTpl = null;
function fragModel() {
  if (!fragTpl) {
    const g = new THREE.Group(), olive = new THREE.MeshStandardMaterial({ color: 0x5f6f52, roughness: .6, metalness: .15 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a3d47, roughness: .4, metalness: .7 }), steel = new THREE.MeshStandardMaterial({ color: 0xb3b9c3, roughness: .25, metalness: 1 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), olive); body.scale.set(1, 1.22, 1); g.add(body);
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.075 * Math.cos((i - 1.5) * .42) + .003, .006, 6, 20), olive); r.rotation.x = Math.PI / 2; r.position.y = (i - 1.5) * .038; g.add(r); }
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.078, .005, 5, 16, Math.PI), olive); r.rotation.y = i / 6 * Math.PI; r.scale.y = 1.2; g.add(r); }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.03, .036, .04, 14), dark); cap.position.y = .1; g.add(cap);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, .022, 12), dark); top.position.y = .13; g.add(top);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(.026, .14, .008), steel); lever.position.set(0, .05, .085); lever.rotation.x = -.18; g.add(lever);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.024, .0035, 6, 18), steel); ring.position.set(.045, .115, 0); ring.rotation.y = Math.PI / 2; g.add(ring);
    const led = new THREE.Mesh(new THREE.SphereGeometry(.009, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b30 })); led.position.y = .145; led.name = 'led'; g.add(led);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    fragTpl = g;
  }
  const m = fragTpl.clone(); const led = m.getObjectByName('led'); led.material = led.material.clone(); m.userData.led = led;
  m.rotation.set(rand(0, 6), rand(0, 6), 0); return m;
}
function launch(pos, vel, o) {
  const m = o.impact ? new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: .5 })) : fragModel();
  m.position.copy(pos); scene.add(m); nades.push({ mesh: m, vel, fuse: o.fuse ?? 6, impact: !!o.impact, radius: o.radius, dmg: o.dmg, grav: o.grav ?? 20, wid: o.wid, cluster: o.cluster || 0, nuke: !!o.nuke, safe: !!o.safe });
}
function updateNades(dt) {
  for (let i = nades.length - 1; i >= 0; i--) {
    const g = nades[i], p = g.mesh.position, prev = p.clone();
    g.vel.y -= g.grav * dt; p.addScaledVector(g.vel, dt); g.fuse -= dt;
    const spinK = Math.min(1, Math.hypot(g.vel.x, g.vel.y, g.vel.z) / 6); g.mesh.rotation.x += dt * 9 * spinK; g.mesh.rotation.z += dt * 4 * spinK;
    const led = g.mesh.userData.led; if (led) { const on = Math.sin(performance.now() / (g.fuse < 1 ? 45 : 140)) > 0; led.material.color.setRGB(on ? 4 : .25, on ? .6 : .05, on ? .4 : .05); }
    if (g.impact && Math.random() < .6) smoke(prev, 1, .12, .5);
    let hit = false;
    if (p.y < .12) { p.y = .12; hit = Math.abs(g.vel.y) > 1.5; g.vel.y = -g.vel.y * .4; g.vel.x *= .7; g.vel.z *= .7; }
    const b = boxAt(p);
    if (b) {
      hit = true;
      if (prev.y >= b.h) { p.y = b.h + .12; g.vel.y = -g.vel.y * .4; g.vel.x *= .7; g.vel.z *= .7; }
      else if (prev.y < b.y0) { p.y = b.y0 - .12; g.vel.y = -Math.abs(g.vel.y) * .4; }
      else if (prev.x <= b.minX || prev.x >= b.maxX) { p.x = prev.x; g.vel.x *= -.45; }
      else { p.z = prev.z; g.vel.z *= -.45; }
    }
    if (g.impact) for (const bt of bots) if (bt.alive && Math.hypot(bt.pos.x - p.x, bt.pos.z - p.z) < .7 && p.y < 2.2 * bt.t.scale) hit = true;
    if (hit && !g.impact && g.vel.length() > 2) SND.click();
    if ((g.impact && hit) || g.fuse <= 0) {
      if (g.nuke) nukeStrike(p.clone(), g.wid); else explode(p.clone(), g.radius, g.dmg, { wid: g.wid, safe: g.safe }); scene.remove(g.mesh); nades.splice(i, 1);
      // cluster rounds burst into bomblets that scatter and pop a moment later
      for (let c = 0; c < g.cluster; c++) launch(p.clone().setY(p.y + .4), new V3(rand(-6, 6), rand(5, 9), rand(-6, 6)), { fuse: rand(.5, .9), radius: g.radius * .55, dmg: g.dmg * .35, grav: 20, wid: g.wid, safe: g.safe });
    }
  }
}
// ---------- Thermonuclear: the warhead marks the spot, 1 second later a carpet of bombs, one enormous blast and a mushroom cloud ----------
// Your own nuke never hurts you (or friends), it just shakes the whole tower.
const strikes = [], mushrooms = [];
const PUFF_GEO = new THREE.IcosahedronGeometry(1, 1);
function nukeStrike(p, wid) {
  const mark = new THREE.Mesh(new THREE.RingGeometry(26, 28, 48), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }));
  mark.rotation.x = -Math.PI / 2; mark.position.set(p.x, .08, p.z); scene.add(mark);
  strikes.push({ p: p.clone().setY(Math.max(p.y, .3)), wid, t: 1, carpet: 0, done: false, mark });
  banner('☢ THERMONUCLEAR STRIKE', 'DETONATION IN 1 SECOND'); SND.boss?.();
  for (const b of bots) if (b.alive) b.noise?.(p, 3, 1);
}
// the cloud: ~170 glowing puffs in one draw call. The stem rises, the cap rolls over itself and spreads, the base skirt
// rushes outwards along the ground; colours cool from white-hot to orange to pastel pink-grey, then it all fades.
function makeMushroom(p) {
  const N = 170, mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false });
  const mesh = new THREE.InstancedMesh(PUFF_GEO, mat, N); mesh.frustumCulled = false; mesh.renderOrder = 5;
  const puffs = [];
  for (let i = 0; i < N; i++) {
    const role = i < 55 ? 'stem' : i < 135 ? 'cap' : 'skirt';
    puffs.push({ role, a: Math.random() * Math.PI * 2, b: Math.random() * Math.PI * 2, h: Math.random(), r: Math.random(), s: rand(.75, 1.3), spin: rand(.6, 1.4) });
  }
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  scene.add(mesh);
  const wave = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1c0).multiplyScalar(3), transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  wave.rotation.x = -Math.PI / 2; wave.position.set(p.x, .15, p.z); scene.add(wave);
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6d8).multiplyScalar(8), transparent: true, depthWrite: false, fog: false }));
  core.position.set(p.x, 3, p.z); scene.add(core);
  mushrooms.push({ p: p.clone().setY(0), mesh, puffs, wave, core, t: 0 });
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s3 = new V3(), _v3 = new V3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const HOT = new THREE.Color(0xfff6d8), ORANGE = new THREE.Color(0xff8a3d), ASH = new THREE.Color(0xd9a6b8), SMOKE = new THREE.Color(0x9c8c9c);
function updateMushrooms(dt) {
  for (let i = mushrooms.length - 1; i >= 0; i--) {
    const M = mushrooms[i]; M.t += dt; const t = M.t;
    const rise = 1 - Math.pow(1 - Math.min(1, t / 3), 3), H = 6 + 40 * rise, R = 5 + 15 * rise;
    // colour: white-hot for half a second, orange by 1.5 s, pastel pink by 4 s, smoky grey after
    if (t < .5) _c.copy(HOT); else if (t < 1.6) _c.copy(HOT).lerp(ORANGE, (t - .5) / 1.1); else if (t < 4.5) _c.copy(ORANGE).lerp(ASH, (t - 1.6) / 2.9); else _c.copy(ASH).lerp(SMOKE, Math.min(1, (t - 4.5) / 4));
    const glow = t < 2 ? 4 - t * 1.4 : 1.2; // brighter than white so it blooms
    const fade = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 3);
    M.mesh.material.opacity = .92 * fade;
    M.puffs.forEach((u, k) => {
      let x, y, z, sc;
      if (u.role === 'stem') {
        const yy = u.h * H, wob = 1.6 + (1 - u.h) * 1.4 + rise * 1.5; // a bit wider at the bottom
        x = Math.cos(u.a + t * .3 * u.spin) * wob * u.r; z = Math.sin(u.a + t * .3 * u.spin) * wob * u.r; y = yy; sc = (2.2 + rise * 2.2) * u.s;
      } else if (u.role === 'cap') {
        // a torus that rolls: each puff goes round the tube (b) while the whole ring spreads
        const tube = 4 + rise * 6, roll = u.b + t * 1.1 * u.spin, ringR = R * (.55 + .45 * u.r);
        const rr = ringR + Math.cos(roll) * tube * .6;
        x = Math.cos(u.a) * rr; z = Math.sin(u.a) * rr; y = H + Math.sin(roll) * tube * .55 + 2; sc = (3 + rise * 3.6) * u.s;
      } else {
        // the base surge: a ring of dust racing outwards
        const out = 6 + Math.min(1, t / 1.6) * 34 * (.7 + .3 * u.r);
        x = Math.cos(u.a) * out; z = Math.sin(u.a) * out; y = 1 + u.h * 3; sc = (2.4 + Math.min(1, t / 2) * 3.5) * u.s * (t > 5 ? Math.max(.2, 1 - (t - 5) / 6) : 1);
      }
      _q.setFromAxisAngle(_v3.set(0, 1, 0), u.a + t * .2);
      _m4.compose(_s3.set(M.p.x + x, M.p.y + y, M.p.z + z), _q, _v3.setScalar(Math.max(.01, sc)));
      M.mesh.setMatrixAt(k, _m4);
      // the cap's underside and the stem's core stay hotter for longer
      const heat = u.role === 'stem' ? 1.25 - u.h * .4 : u.role === 'cap' ? 1 : .8;
      M.mesh.setColorAt(k, _c2.setRGB(_c.r * glow * heat, _c.g * glow * heat, _c.b * glow * heat));
    });
    M.mesh.instanceMatrix.needsUpdate = true; M.mesh.instanceColor.needsUpdate = true;
    // shockwave ring along the ground and the white-hot core
    const wk = Math.min(1, t / .9); M.wave.scale.setScalar(2 + wk * 70); M.wave.material.opacity = (1 - wk) * .9; M.wave.visible = wk < 1;
    const ck = Math.min(1, t / .8); M.core.scale.setScalar(4 + ck * 14); M.core.material.opacity = (1 - ck); M.core.visible = ck < 1;
    if (t < 1.2 && Math.random() < .5) flashLight(_v3.set(M.p.x, H * .6, M.p.z), 0xffb347, 120 * (1 - t / 1.2), 160, .2);
    if (t > 11) { scene.remove(M.mesh, M.wave, M.core); M.mesh.dispose(); M.mesh.material.dispose(); M.wave.geometry.dispose(); M.wave.material.dispose(); M.core.geometry.dispose(); M.core.material.dispose(); mushrooms.splice(i, 1); }
  }
}
function updateStrikes(dt) {
  updateMushrooms(dt);
  for (let i = strikes.length - 1; i >= 0; i--) {
    const s = strikes[i]; s.t -= dt;
    if (s.t > 0) { s.mark.material.opacity = .35 + .45 * Math.abs(Math.sin(s.t * 14)); s.mark.scale.setScalar(.7 + .3 * s.t); continue; }
    // the carpet: 12 bombs in a quarter of a second across a 30 m circle
    while (s.carpet < 12 && -s.t >= s.carpet * .02) {
      const a = Math.random() * Math.PI * 2, r = 6 + Math.sqrt(Math.random()) * 24;
      explode(new V3(s.p.x + Math.cos(a) * r, .4, s.p.z + Math.sin(a) * r), 10, 700, { wid: s.wid, safe: true, name: 'Thermonuclear' }); s.carpet++;
    }
    if (!s.done && s.carpet >= 12) {
      s.done = true; scene.remove(s.mark); s.mark.geometry.dispose(); s.mark.material.dispose();
      explode(s.p, 38, 4000, { wid: s.wid, safe: true, name: 'Thermonuclear' }); makeMushroom(s.p);
      player.shake += 4.5; const fb = $('flashbang'); fb.style.transition = 'none'; fb.style.opacity = 1;
      setTimeout(() => { fb.style.transition = 'opacity 1.4s'; fb.style.opacity = 0; setTimeout(() => fb.style.transition = '', 1500); }, 120);
      banner('☢ DETONATION', 'NOTHING SURVIVED THAT'); strikes.splice(i, 1);
    }
  }
}
function clearStrikes() {
  for (const s of strikes) { scene.remove(s.mark); s.mark.geometry.dispose(); s.mark.material.dispose(); } strikes.length = 0;
  for (const M of mushrooms) { scene.remove(M.mesh, M.wave, M.core); M.mesh.dispose(); } mushrooms.length = 0;
}
// ---------- weather: what it does to the fight ----------
// From floor 2, about 2 floors in 5 have weather (never Titan or Rampage floors):
//  Rain: you run 8% slower, and bots can't see as far through it.
//  Thunderstorm: 12% slower, bots see even less, gusts of wind, and lightning strikes the ground every few seconds.
//    A glowing ring marks where it will land; it hits bots and you alike (bots it kills count as yours).
//  Snow: slides go much further and the ground is slippery, bots move 12% slower.
//  Blizzard: snow but far worse: you can barely see, 15% slower, very slippery, strong gusts shove you sideways.
//  Thick Fog: bots can only see you up close (and you can't see them far off either). Perfect for sneaking.
//  Sandstorm: everyone's aim gets worse (your spread +25%, bots hit less), 10% slower, gusts.
let weather = 'clear', zapT = 6, rumbleT = 4, gustT = 9, gust = 0, ambK = -1;
const zaps = [];
const WX_FX = {
  rain: { move: .92, sight: .8 }, storm: { move: .88, sight: .68, gust: 3 }, snow: { move: .97, botSpeed: .88, slip: true },
  blizzard: { move: .85, botSpeed: .8, sight: .5, slip: true, gust: 6.5 }, fog: { sight: .42 }, sand: { move: .9, sight: .55, botAcc: .72, spread: 1.25, gust: 7 },
};
const WX_TEXT = {
  rain: 'RAIN · YOU MOVE 8% SLOWER · BOTS CAN\'T SEE AS FAR', storm: 'THUNDERSTORM · LIGHTNING HITS WHERE THE GROUND GLOWS · 12% SLOWER',
  snow: 'SNOW · SLIDES GO MUCH FURTHER · SLIPPERY GROUND · BOTS ARE SLOWER', blizzard: 'BLIZZARD · YOU CAN BARELY SEE · VERY SLIPPERY · GUSTS PUSH YOU AROUND',
  fog: 'THICK FOG · BOTS ONLY SEE YOU UP CLOSE · NEITHER CAN YOU', sand: 'SANDSTORM · EVERYONE\'S AIM IS WORSE · GUSTS · 10% SLOWER',
};
const wxMove = () => WX_FX[weather]?.move || 1, slippery = () => !!WX_FX[weather]?.slip;
function rollWeather(fl, rnd = Math.random) {
  if (fl < 2 || training || isTitanFloor(fl) || isRampage(fl)) return 'clear';
  const r = rnd(); return r < .1 ? 'rain' : r < .18 ? 'storm' : r < .25 ? 'snow' : r < .29 ? 'blizzard' : r < .36 ? 'fog' : r < .41 ? 'sand' : 'clear';
}
function applyWeather(id, quiet) {
  weather = WEATHER[id] ? id : 'clear'; setWeather(weather); zapT = rand(4, 7); rumbleT = rand(2, 5); gustT = rand(5, 9); gust = 0; clearZaps();
  const wet = weather === 'rain' || weather === 'storm'; post.rtUniforms.ssrStr.value = wet ? 1.1 : .4; post.setGloss(wet ? .08 : .3); // ray-traced reflections: wet ground turns mirror-like in the rain
  setAmbience(weather); renderWxChip();
  if (!quiet && weather !== 'clear') setTimeout(() => { if (state === 'playing' && weather === id) banner(`${WEATHER[id].icon} ${WEATHER[id].name.toUpperCase()}`, WX_TEXT[id]); }, 2400);
}
// every frame: weather sounds follow the game (quieter in menus), and gusts of wind push you
function updateWeatherFx(dt) {
  const k = state === 'playing' ? 1 : state === 'menu' ? 0 : .4; if (k !== ambK) { ambK = k; ambienceLevel(k); }
  ambienceTick(dt);
  const G = WX_FX[weather]?.gust; if (!G || state !== 'playing') return;
  if (gust > 0) {
    gust -= dt; const f = Math.sin(Math.min(1, gust / 2.5) * Math.PI) * G; // builds up, then dies down
    if (!player.grap && !player.mantle) { player.vel.x += f * dt * (player.onGround ? 1 : 1.6); player.vel.z += f * .3 * dt; }
  } else if ((gustT -= dt) <= 0) { gustT = rand(7, 13); gust = 2.5; SND.whoosh?.(); }
}
function renderWxChip() {
  const el = $('wxchip'); if (!el) return; const W = WEATHER[weather];
  el.classList.toggle('on', weather !== 'clear'); el.dataset.wx = weather; el.innerHTML = `<i>${W.icon}</i><b>${W.name}</b>`; el.title = WX_TEXT[weather] || '';
}
// lightning: pick a spot (usually near a bot, sometimes near you), glow for a moment, then strike
function updateStorm(dt) {
  if ((rumbleT -= dt) <= 0) { rumbleT = rand(3, 7); skyFlash(rand(.25, .5)); SND.thunder(rand(90, 150)); } // far-off lightning
  for (let i = zaps.length - 1; i >= 0; i--) {
    const z = zaps[i]; z.t -= dt;
    z.ring.material.opacity = .4 + .5 * Math.abs(Math.sin(z.t * 18)); z.ring.scale.setScalar(1 + (1 - z.t / .9) * .3);
    if (z.t <= 0) { strike(z.p, z.remote); scene.remove(z.ring); z.ring.geometry.dispose(); z.ring.material.dispose(); zaps.splice(i, 1); }
  }
  if (coop?.role === 'guest' || (zapT -= dt) > 0) return;
  zapT = rand(4, 8);
  const alive = bots.filter(b => b.alive && !b.puppet), nearYou = !alive.length || Math.random() < .3;
  const c = nearYou ? player.pos : alive[Math.floor(Math.random() * alive.length)].pos, a = Math.random() * Math.PI * 2, r = nearYou ? rand(4, 12) : rand(0, 3);
  const S = world.size - 2, p = new V3(clamp(c.x + Math.cos(a) * r, -S, S), 0, clamp(c.z + Math.sin(a) * r, -S, S));
  zapAt(p, false);
  if (coop?.role === 'host') NET.toFriends({ t: 'zap', x: +p.x.toFixed(2), z: +p.z.toFixed(2) });
}
function zapAt(p, remote) {
  p.y = groundAt(p.x, p.z, .3, 50, 60);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.5, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xcfe0ff).multiplyScalar(2.5), transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, p.y + .06, p.z); scene.add(ring);
  zaps.push({ p, ring, t: .9, remote }); SND.click();
}
function strike(p, remote) {
  const dd = p.distanceTo(camera.position); lightningBolt(p); SND.thunder(dd); lightningFlash(dd);
  // friends' games only show the bolt and hurt their own player; the host's game hits the bots
  explode(p.clone().setY(p.y + .3), 4.5, 170, { name: 'Lightning', noBots: remote });
  smoke(p.clone().setY(p.y + .2), 6, .8, 1.5); sparks(p.clone().setY(p.y + .3), 0xdfe8ff, 22, 9);
}
function clearZaps() { for (const z of zaps) { scene.remove(z.ring); z.ring.geometry.dispose(); z.ring.material.dispose(); } zaps.length = 0; }
// ---------- immersion: what weather does to your screen, your ears and your breath ----------
// Rain: drops land on the "lens", sit there and run down with little trails (more when you look up, none under a roof).
// Snow and blizzards: frost creeps in from the edges the longer you're out in it; you see your breath.
// Sandstorm: a sandy haze at the edges. Lightning close by: a blinding white flash. Gusts tilt the camera a little.
const lens = $('wxlens'), lx = lens.getContext('2d'), lensDrops = [];
let lensT = 0, coverK = 0, coverOn = false, breathT = 2, frostK = 0, gustRoll = 0, lastSurf = '';
function lensSize() { const k = .5; if (lens.width !== Math.round(innerWidth * k)) { lens.width = Math.round(innerWidth * k); lens.height = Math.round(innerHeight * k); } }
function updateImmersion(dt) {
  const W = weather, playing = state === 'playing' && !player.down, open = !coverOn;
  // under a roof: muffled weather, dry lens, normal footsteps
  if ((lensT += dt) > .2) { lensT = 0; coverOn = W !== 'clear' && underCover(player.pos.x, player.pos.z, player.pos.y); }
  coverK += ((coverOn ? 1 : 0) - coverK) * Math.min(1, dt * 3); ambienceCover(coverK);
  const surf = coverOn || W === 'clear' || W === 'fog' ? '' : W === 'rain' || W === 'storm' ? 'wet' : W === 'sand' ? 'sand' : 'snow';
  if (surf !== lastSurf) { lastSurf = surf; setStepSurface(surf); }
  // frost and sand haze
  frostK += (((W === 'snow' ? .55 : W === 'blizzard' ? 1 : 0) * (open && playing ? 1 : .3)) - frostK) * Math.min(1, dt * .25);
  $('wxfrost').style.opacity = frostK.toFixed(2); $('wxsand').style.opacity = W === 'sand' && open && playing ? 1 : 0;
  // breath in the cold
  if ((W === 'snow' || W === 'blizzard') && playing && (breathT -= dt) <= 0) {
    breathT = player.sprinting ? 1.1 : rand(2.2, 3.2);
    const f = new V3(-Math.sin(player.yaw), -.15, -Math.cos(player.yaw)); smoke(camera.position.clone().addScaledVector(f, .5).add(new V3(0, -.12, 0)), 1, .09, 1.2);
  }
  // gusts lean the camera a touch
  gustRoll += ((gust > 0 && WX_FX[W]?.gust ? -Math.sin(Math.min(1, gust / 2.5) * Math.PI) * .018 * WX_FX[W].gust / 5 : 0) - gustRoll) * Math.min(1, dt * 4);
  // raindrops on the lens (Potato skips this)
  const rainy = (W === 'rain' || W === 'storm') && open && playing && fxSettings.lite >= .5;
  if (!rainy && !lensDrops.length) { if (lens.dataset.on) { lx.clearRect(0, 0, lens.width, lens.height); delete lens.dataset.on; } return; }
  lensSize(); lens.dataset.on = 1;
  const up = clamp(.4 + player.pitch * 1.2, .1, 1.6); // looking up = more drops in your face
  if (rainy) { const rate = (W === 'storm' ? 14 : 7) * up; if (Math.random() < rate * dt) lensDrops.push({ x: Math.random(), y: Math.random() * .85, r: rand(2, 6.5), age: 0, slide: Math.random() < .55 ? rand(.6, 2) : 99, vy: 0, trail: [] }); }
  const w = lens.width, h = lens.height; lx.clearRect(0, 0, w, h);
  for (let i = lensDrops.length - 1; i >= 0; i--) {
    const d = lensDrops[i]; d.age += dt;
    if (d.age > d.slide) { d.vy = Math.min(d.vy + dt * .25, .35); d.y += d.vy * dt; d.x += Math.sin(d.age * 3 + i) * .0006; if (Math.random() < .5) d.trail.push([d.x, d.y]); if (d.trail.length > 18) d.trail.shift(); }
    const fade = rainy ? 1 : Math.max(0, 1 - (d.age - (d.dry ??= d.age)) / 1.2); // dries off once you're out of the rain
    if (d.y > 1.05 || fade <= 0 || d.age > 9) { lensDrops.splice(i, 1); continue; }
    const px = d.x * w, py = d.y * h, r = d.r * (w / 960 + .4);
    for (const [tx, ty] of d.trail) { lx.fillStyle = `rgba(225,235,250,${.12 * fade})`; lx.beginPath(); lx.arc(tx * w, ty * h, r * .35, 0, 7); lx.fill(); }
    // a drop: darker rim, bright highlight at the top-left, like a tiny lens
    const g = lx.createRadialGradient(px - r * .3, py - r * .35, r * .1, px, py, r);
    g.addColorStop(0, `rgba(255,255,255,${.75 * fade})`); g.addColorStop(.35, `rgba(220,232,250,${.25 * fade})`); g.addColorStop(.85, `rgba(120,140,170,${.28 * fade})`); g.addColorStop(1, 'rgba(120,140,170,0)');
    lx.fillStyle = g; lx.beginPath(); lx.ellipse(px, py, r, r * 1.12, 0, 0, 7); lx.fill();
  }
  if (lensDrops.length > 90) lensDrops.splice(0, lensDrops.length - 90);
}
// lightning close to you: a white-blue flash on screen and a jolt
function lightningFlash(dist) {
  if (dist > 60) return; const fb = $('flashbang'), k = clamp(1 - dist / 60, .2, 1);
  fb.style.transition = 'none'; fb.style.background = '#eef3ff'; fb.style.opacity = (.75 * k).toFixed(2);
  setTimeout(() => { fb.style.transition = 'opacity .9s'; fb.style.opacity = 0; setTimeout(() => { fb.style.transition = ''; fb.style.background = ''; }, 950); }, 70);
  player.shake += 1.6 * k;
}
const stopCooking = () => { player.cooking = false; player.cookT = 0; };
function throwNade() {
  if (player.nades <= 0) return;
  player.nades--; player.cooking = false;
  const fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion);
  launch(camera.position.clone().addScaledVector(fwd, .5), fwd.multiplyScalar(17).add(new V3(0, 4, 0)).add(player.vel.clone().setY(0)), { fuse: 2.5 - player.cookT, radius: 6, dmg: 150 });
  player.cookT = 0; SND.jump();
}
function explode(p, radius, dmg, o = {}) {
  explosionFx(p, radius); at3(p, () => SND.boom(p.distanceTo(camera.position)), !lineOfSight(p.clone().setY(Math.max(p.y, .5)), camera.position));
  const src = p.clone().setY(Math.max(p.y, .3) + .2);
  const name = o.name || (o.from ? 'Blast' : o.strike ? 'Strike Drone' : o.wid ? byId(o.wid).name : 'Frag');
  for (const b of bots) if (b.alive && b !== o.from) {
    const c = b.center(), d = c.distanceTo(p);
    if (!o.noBots && d < radius && lineOfSight(src, c)) damageBot(b, dmg * Math.pow(1 - d / radius, .7), false, c, name, c.clone().sub(p).normalize(), { blast: true, helper: !!o.strike, weaponId: o.wid, vol: o.vol, slam: o.slam, ml: o.wid && !o.vol ? cur()?.w.ml : null });
    else if (d < 50) b.noise(p, 3, .5);
  }
  const chest = camera.position.clone(); chest.y -= player.eyeH * .4;
  const pd = chest.distanceTo(p);
  if (!o.strike && !o.safe && pd < radius && lineOfSight(src, chest)) hurt(dmg * .55 * (1 - pd / radius), p, true);
  player.shake += clamp(2.5 - pd / 10, 0, 2.5);
  $('flashbang').style.opacity = clamp(.6 - pd / 30, 0, .6); setTimeout(() => $('flashbang').style.opacity = 0, 80);
}


// ---------- spell mutations: fireball, thunder, meteor, frost nova and black hole cast themselves off hits and kills ----------
const spellFx = [];
const spellReady = {}, thunderN = {}; // per-gun cooldowns ('gun:spell' → run time when ready) and hit counters for Thunderstrike
function spellCD(wid, id, L) { const k = wid + ':' + id; if ((spellReady[k] || 0) > runTime) return false; spellReady[k] = runTime + MV(id, L, 'cd'); return true; }
const glowBall = (r, col) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), new THREE.MeshBasicMaterial({ color: col })); scene.add(m); return m; };
function ringFx(p, radius, col, life = .5) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.copy(p).setY(Math.max(p.y, .06)); scene.add(m);
  spellFx.push({ kind: 'ring', mesh: m, t: life, max: life, radius });
}
// bots a spell can drag around (not bosses or flyers)
const pushable = b => b.alive && !b.t.boss && !b.alt;
function shove(b, dx, dz) { b.pos.x += dx; b.pos.z += dz; resolveCircle(b.pos, .5 * b.t.scale, 0); }
function castFireball(bot, L, wid) {
  const fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion), m = glowBall(.3, 0xff8c42);
  m.position.copy(camera.position).addScaledVector(fwd, .8).add(new V3(0, -.25, 0));
  const vel = bot.center().sub(m.position).normalize().multiplyScalar(38);
  spellFx.push({ kind: 'fire', mesh: m, vel, t: 2.5, R: MV('fireball', L, 'r'), dmg: MV('fireball', L, 'dm'), wid }); SND.boss?.(); life('spells');
}
function thunderStrike(bot, L, wid) {
  const hit = new Set(); let b = bot, from = bot.center().add(new V3(rand(-2, 2), 28, rand(-2, 2)));
  for (let j = 0; b && j <= MV('thunder', L, 'r'); j++) {
    const c = b.center(); beam(from, c, 0xffe14d, j ? .04 : .09, .25); sparks(c, 0xffe14d, 8, 4); flashLight(c, 0xfff2a8, j ? 3 : 6, 9, .15);
    damageBot(b, MV('thunder', L, 'dm') * Math.pow(.85, j), false, c, 'Thunderstrike ⚡', c.clone().sub(from).normalize(), { chain: true, vol: true, weaponId: wid });
    hit.add(b); from = c; let nb = null, nd = 12;
    for (const q of bots) { if (!q.alive || hit.has(q)) continue; const d = q.center().distanceTo(c); if (d < nd) { nd = d; nb = q; } }
    b = nb;
  }
  player.shake += .6; life('spells');
}
function dropMeteor(near, L, wid) {
  let tgt = null, nd = 30;
  for (const b of bots) { if (!b.alive || b.alt) continue; const d = b.pos.distanceTo(near); if (d > 1 && d < nd) { nd = d; tgt = b; } }
  const p = (tgt ? tgt.pos : near).clone(); p.y = groundAt(p.x, p.z, .3, p.y + .3);
  const R = MV('meteor', L, 'r'); ringFx(p, R, 0xd6453d, .85); life('spells');
  const m = glowBall(.8, 0xff5a3a); m.position.copy(p).add(new V3(6, 38, 3));
  spellFx.push({ kind: 'meteor', mesh: m, from: m.position.clone(), to: p, t: .85, max: .85, R, dmg: MV('meteor', L, 'dm'), wid });
}
function frostNova(p, L) {
  const R = MV('nova', L, 'r'), T = MV('nova', L, 'dm');
  for (const b of bots) { if (!b.alive || b.pos.distanceTo(p) > R) continue; b.slowT = b.t.boss ? T * .5 : T; b.slowK = b.t.boss ? .5 : .92; sparks(b.center(), 0x9cc5d6, 6, 3); }
  ringFx(p, R, 0x9cc5d6, .45); flashLight(p.clone().setY(1), 0x9cc5d6, 5, R * 1.5, .3); life('spells');
}
function openBlackHole(p, L, wid) {
  const q = p.clone(); q.y = groundAt(q.x, q.z, .3, q.y + .3) + 1.3;
  const m = glowBall(.55, 0x3d2b6b), halo = new THREE.Mesh(new THREE.TorusGeometry(1, .11, 8, 32), new THREE.MeshBasicMaterial({ color: 0xc8b6ff })); m.add(halo);
  m.position.copy(q); spellFx.push({ kind: 'vortex', mesh: m, halo, p: q, t: 2, R: MV('blackhole', L, 'r'), dmg: MV('blackhole', L, 'dm'), wid }); life('spells');
}
function updateSpells(dt) {
  if (player.ramp && player.sinceShot > .25) player.ramp = Math.max(0, player.ramp - dt * 1.3); // heat cools off when you stop firing
  for (const b of bots) if (b.knock) { const kn = b.knock; if (b.alive) shove(b, kn.x * dt, kn.z * dt); kn.t -= dt; if (kn.t <= 0) b.knock = null; }
  for (let i = spellFx.length - 1; i >= 0; i--) {
    const f = spellFx[i]; f.t -= dt; let done = f.t <= 0;
    if (f.kind === 'ring') { const s = f.radius * (1 - f.t / f.max * .8); f.mesh.scale.set(s, s, s); f.mesh.material.opacity = .8 * f.t / f.max; }
    else if (f.kind === 'fire') {
      const p = f.mesh.position, prev = p.clone(); p.addScaledVector(f.vel, dt);
      if (Math.random() < .8) sparks(prev, 0xff7a2a, 1, 1);
      let hit = p.y < .2 || !!boxAt(p);
      for (const b of bots) if (b.alive && b.center().distanceTo(p) < 1.1 * b.t.scale) hit = true;
      if (hit || done) {
        explode(p.clone(), f.R, f.dmg, { name: 'Fireball 🔥', safe: true, vol: true, wid: f.wid });
        for (const b of bots) if (b.alive && b.center().distanceTo(p) < f.R) b.burn = { t: 3, dps: f.dmg * .4 / 3, name: 'Fireball', wid: f.wid };
        flashLight(p.clone(), 0xff8c42, 8, f.R * 2, .3); done = true;
      }
    } else if (f.kind === 'meteor') {
      f.mesh.position.lerpVectors(f.to, f.from, Math.max(0, f.t / f.max)); if (Math.random() < .9) smoke(f.mesh.position.clone(), 1, .5, .6);
      if (done) { explode(f.to.clone(), f.R, f.dmg, { name: 'Meteor ☄', safe: true, vol: true, wid: f.wid }); ringFx(f.to, f.R * 1.3, 0xff8c42, .5); player.shake += 1.5; }
    } else if (f.kind === 'vortex') {
      const R = f.R; f.mesh.rotation.y += dt * 6; f.halo.rotation.x += dt * 4; f.mesh.scale.setScalar(1 + Math.sin(runTime * 20) * .08);
      for (const b of bots) { if (!pushable(b)) continue; const v = f.p.clone().sub(b.pos).setY(0), d = v.length(); if (d > R || d < 1.2) continue; v.normalize(); shove(b, v.x * dt * (5 + (R - d)), v.z * dt * (5 + (R - d))); }
      if (Math.random() < dt * 30) sparks(f.p.clone().add(new V3(rand(-R, R) * .5, rand(-.5, .5), rand(-R, R) * .5)), 0xc8b6ff, 1, 2);
      if (done) { explode(f.p.clone(), R * .6, f.dmg, { name: 'Black Hole 🌀', safe: true, vol: true, wid: f.wid }); flashLight(f.p.clone(), 0xc8b6ff, 8, 14, .3); }
    }
    if (done) { if (f.mesh) { scene.remove(f.mesh); f.mesh.geometry?.dispose(); } spellFx.splice(i, 1); }
  }
}
function clearSpellFx() { for (const f of spellFx) if (f.mesh) scene.remove(f.mesh); spellFx.length = 0; for (const k in spellReady) delete spellReady[k]; for (const k in thunderN) delete thunderN[k]; }
// ---------- damage, kills, XP, medals ----------
let shotHits = null;      // while firing: groups every pellet of one shot into one damage number per bot
let chainN = 0, lastKillT = -9, slamKills = 0;
// ---------- run modifiers, characters, achievements, paint ----------
Object.assign(prog, { life: { ...(prog.life || {}) }, ach: { ...(prog.ach || {}) }, best: { ...(prog.best || {}) }, char: 'rookie', upg: { hp: 0, spd: 0, ...(prog.upg || {}) }, daily: { ...(prog.daily || {}) } });
prog.look = NET.cleanLook(prog.look); NET.net.look = prog.look; // your character look (Character screen)
guardProps(prog, ["pxp"], () => cheatFlag("memory editing")); // player XP
ctx.onCheat = what => cheatFlag(what);
// max health and speed from the character upgrades (set at the start of each run)
const upgHp = () => 100 + 10 * (prog.upg.hp || 0), upgSpd = () => 1 + .03 * (prog.upg.spd || 0);
let floorMod = MODS[0], paint = 0, paintFills = 0, frenzyT = 0, dailyRun = false, training = null, runChar = 'rookie';
const perk = () => PERK[runChar] || {};
const isTitanFloor = fl => fl % 10 === 0;
const moveMul = () => (perk().speed || 1) * (player.spdMul || 1) * (floorMod.id === "over" ? 1.35 : 1) * comboMul() * wxMove() * adm.speed;
// movement combos: every move you chain (slides, hops, wall runs, dashes, vaults...) adds to the combo and makes you
// faster, ULTRAKILL style: +16% speed per move, so x5 is +80%, x10 is +160%, and x19 caps at +300% (4x speed). It lasts as long as you keep moving.
// Slow down (under walking pace) for a tenth of a second and it's gone; go 0.6 s without a move and it drains very fast (a full x19 is gone in about 1 s).
const comboMul = () => 1 + Math.min(3, .16 * (player.mc || 0));
function moveCombo(name) {
  if (state !== 'playing') return;
  player.mc = Math.floor(player.mc || 0) + 1; player.mcT = runTime;
  if (player.mc >= 2) { medal(`${name} · MOVE COMBO ×${player.mc} · +${Math.round((comboMul() - 1) * 100)}% SPEED`, '➹', 0, 'lv'); if (player.mc % 5 === 0) SND.levelUp?.(); }
}
function comboTick(dt, hs) {
  if (!player.mc) return;
  player.mcStill = hs < 4.5 && player.onGround && !player.mantle && !player.grap ? (player.mcStill || 0) + dt : 0;
  if (player.mcStill > .1) { if (player.mc >= 4) medal(`MOVE COMBO ENDED · ×${player.mc}`, '➹', 0, 'lv'); player.mc = 0; return; }
  if (runTime - player.mcT > .6) { player.mc = Math.max(0, player.mc - dt * (8 + player.mc * .7)); if (player.mc < 1) player.mc = 0; } // cruising, not comboing: drains fast
}
// ECON: everything you earn in a run is scaled by this. .6 = 40% less than before, so guns and upgrades take real saving up.
const ECON = .6;
const cashMul = () => ECON * floorMod.cash * (perk().cash || 1);
// lifetime stats drive achievements
// player XP and daily quests both feed off the same lifetime stats
let runPXP = 0;
function addPXP(n) {
  if (!n || training || godmode || cheatRun) return;
  const before = levelInfo(prog.pxp).lvl; prog.pxp = (prog.pxp || 0) + n; runPXP += n;
  const after = levelInfo(prog.pxp).lvl;
  if (after > before) life('plevel', after, true);
  if (after > before) { const r = LEVEL_REWARDS.find(([at]) => at === after); toast('LEVEL UP', `Player level ${after} · +1 upgrade point`, r ? r[1] : 'Spend it on health or speed in Character', '★'); saveProg(); }
}
function metaStat(k, v, max) {
  if (XP_FOR[k] && !max) addPXP(XP_FOR[k] * v);
  if (k === 'floor' && max) addPXP(xpForFloor(v));
  for (const q of questTick(prog, k, v, max)) {
    addPXP(q.xp); if (q.cash && state !== 'menu' && state !== 'dead') earn(q.cash, true);
    toast('DAILY QUEST DONE', q.text, `+${q.xp} XP${q.cash ? ` · +$${q.cash.toLocaleString()}` : ''}`, '✔'); saveProg();
  }
}
function life(k, v = 1, max = false) {
  if (training || godmode || cheatRun) return;
  const L = prog.life; L[k] = max ? Math.max(L[k] || 0, v) : (L[k] || 0) + v; checkAch(); metaStat(k, v, max);
}
function checkAch() {
  const L = prog.life; let changed = false;
  L.chars = CHARS.filter(c => charUnlocked(c, L)).length;
  L.legends = ACH.filter(a => a[5] === 'L' && a[0] !== 'legend' && prog.ach[a[0]]).length;
  for (const [id, name, how, k, goal, tier] of ACH) if (!prog.ach[id] && (L[k] || 0) >= goal) {
    prog.ach[id] = Date.now(); changed = true;
    if (tier === 'L') { toast('LEGENDARY BADGE', name, how, '👑'); banner(`👑 ${name.toUpperCase()}`, 'LEGENDARY BADGE UNLOCKED'); SND.boss?.(); if (id !== 'legend') L.legends++; }
    else toast('ACHIEVEMENT UNLOCKED', name, how, '🏆');
  }
  if (!prog.ach.legend && L.legends >= 13) { prog.ach.legend = Date.now(); toast('LEGENDARY BADGE', 'Pastel Legend', 'Unlock every other Legendary badge', '👑'); changed = true; }
  for (const c of CHARS) if (c.unlock && charUnlocked(c, L) && !prog.ach['char:' + c.id]) { prog.ach['char:' + c.id] = Date.now(); toast('NEW CHARACTER', c.name, c.perk, '★'); changed = true; }
  if (changed) saveProg();
}
const toastQ = [];
function toast(top, name, sub, icon) {
  const t = document.createElement('div'); t.className = 'achtoast';
  t.innerHTML = `<i>${icon}</i><div><small>${top}</small><b>${name}</b><span>${sub}</span></div>`;
  toastQ.push(t); if (toastQ.length === 1) nextToast(); SND.levelUp?.();
}
function nextToast() { const t = toastQ[0]; if (!t) return; document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('on')); setTimeout(() => { t.classList.remove('on'); setTimeout(() => { t.remove(); toastQ.shift(); nextToast(); }, 400); }, 3200); }
// paint: gore on the floor fills a meter; filling it pays out
function addPaint(x) {
  if (state !== 'playing' || training) x = 0;
  paint += x * (floorMod.id === 'paint' ? 2 : 1) * (perk().paint || 1);
  const goal = paintGoal(floorN, paintFills);
  if (paint >= goal) {
    paint = 0; paintFills++; frenzyT = 10; life('paints');
    const pay = Math.round(800 * floorN * (floorMod.id === 'paint' ? 2 : 1)); earn(pay);
    const it = cur(); if (it) { it.pend++; lastSlotsKey = ''; }
    banner(paintFills > 1 ? `TOWER PAINTED ×${paintFills}` : 'TOWER PAINTED', `+$${pay} · FREE MUTATION (${keyLabel('mutate')}) · 10 S FRENZY: +50% DAMAGE`); SND.boss(); goreScreen(0xff5fa2, 3);
  }
  const f = clamp(paint / paintGoal(floorN, paintFills), 0, 1), el = $('paintchip');
  if (el) { el.querySelector('u').style.width = `${Math.round(f * 100)}%`; el.querySelector('b').textContent = paintFills ? `×${paintFills}` : `${Math.round(f * 100)}%`; }
}
// damage that is sure to kill, allowing for armour (some bots only take part of every hit)
const lethal = b => (b.hp + 1) / (b.t.dr || 1);
function damageBot(bot, dmg, head, point, weaponName, dir, o = {}) {
  // Titan: armoured everywhere except the glowing core on its chest
  if (bot.t.titan) { dmg *= o.core ? 3 : o.blast ? .5 : head ? 1 : .35; if (o.core) head = true; }
  if (!o.helper) dmg *= (perk().dmg || 1) * (frenzyT > 0 ? 1.5 : 1);
  if ((floorMod.id === 'glass' && !bot.t.boss) || (adm.onehit && !o.helper)) dmg = Math.max(dmg, lethal(bot));
  if (bot.puppet) bot.lastHit = { ...o, name: weaponName }; // co-op friend: remembered so the host's "you got it" credits the right gun
  const died = bot.damage(dmg, { dir, head, point: o.quiet ? null : point, blast: o.blast, force: o.force });
  if (!o.helper && !o.quiet) { hitmark(head, died); head ? SND.head() : SND.hit(); }
  if (o.quiet) { /* burn ticks: no numbers */ }
  else if (shotHits) { const e = shotHits.get(bot) || { dmg: 0, head: false }; e.dmg += dmg; e.head = e.head || head; e.point = point; e.died = died; shotHits.set(bot, e); }
  else dmgNumber(point, dmg, head, died, o.helper);
  if (!o.quiet && !bot.alt) addPaint(Math.min(dmg, 120) / 60);
  if (!died && o.ml && !o.chain) onMutHit(bot, dmg, dir, weaponName, o);
  if (!died && bot.t.titan) titanPhase(bot);
  if (died) onKill(bot, head, weaponName, o);
  return died;
}
// mutation effects when a shot lands (ml = { mutation: level })
function onMutHit(bot, dmg, dir, name, o) {
  const ml = o.ml;
  if (ml.cryo) { bot.slowT = MV('cryo', ml.cryo, 'dm'); bot.slowK = MV('cryo', ml.cryo); sparks(bot.center(), 0x9cc5d6, 4, 2); }
  if (ml.incendiary) bot.burn = { t: 3, dps: dmg * MV('incendiary', ml.incendiary) / 3, name, wid: o.weaponId };
  const wid = o.weaponId;
  if (ml.fireball && Math.random() < MV('fireball', ml.fireball) && spellCD(wid, 'fireball', ml.fireball)) castFireball(bot, ml.fireball, wid);
  if (ml.thunder && (thunderN[wid] = (thunderN[wid] || 0) + 1) >= MV('thunder', ml.thunder) && (spellReady[wid + ':thunder'] || 0) <= runTime) {
    thunderN[wid] = 0; spellReady[wid + ':thunder'] = runTime + .5; thunderStrike(bot, ml.thunder, wid);
  }
  if (ml.arc) {
    let n = 0; const max = MV('arc', ml.arc), r = MV('arc', ml.arc, 'r');
    for (const b of bots) {
      if (n >= max) break; if (b === bot || !b.alive || b.pos.distanceTo(bot.pos) > r) continue;
      n++; const c = b.center(); beam(bot.center(), c, 0x7dd3ff, .03, .2); sparks(c, 0x7dd3ff, 4, 3);
      damageBot(b, dmg * MV('arc', ml.arc, 'dm'), false, c, name + ' ϟ', c.clone().sub(bot.center()).normalize(), { weaponId: o.weaponId, chain: true, ml });
    }
  }
}
function updateBurns(dt) {
  for (const b of bots) if (b.alive && b.burn) {
    const br = b.burn; br.t -= dt;
    if (Math.random() < dt * 14) sparks(b.center().add(new V3(rand(-.3, .3), rand(-.4, .7), rand(-.3, .3))), 0xff7a2a, 1, 1.5);
    if (Math.random() < dt * 4) smoke(b.center(), 1, .22, .6);
    damageBot(b, br.dps * dt, false, null, br.name + ' ♨', null, { weaponId: br.wid, quiet: true, chain: true });
    if (br.t <= 0) b.burn = null;
  }
}
// kills feed the gun's mutation meter and trigger kill mutations
function mutKill(it, head, bot, o) {
  const ml = it.w.ml || {};
  if (ml.vampire) player.hp = Math.min(player.maxHp, player.hp + MV('vampire', ml.vampire, head ? 'dm' : 'v'));
  if (ml.bloodthirst) it.thirst = Math.min(MV('bloodthirst', ml.bloodthirst, 'dm'), it.thirst + MV('bloodthirst', ml.bloodthirst));
  if (ml.volatile && !o.vol && Math.random() < MV('volatile', ml.volatile)) { const c = bot.center(), L = ml.volatile; setTimeout(() => explode(c, MV('volatile', L, 'r'), MV('volatile', L, 'dm'), { wid: it.base.id, safe: true, vol: true, from: bot }), 90); }
  if (!o.vol) {
    const c = bot.center(), wid = it.base.id;
    if (ml.meteor && Math.random() < MV('meteor', ml.meteor) && spellCD(wid, 'meteor', ml.meteor)) dropMeteor(bot.pos.clone(), ml.meteor, wid);
    if (ml.nova && Math.random() < MV('nova', ml.nova)) frostNova(c, ml.nova);
    if (ml.blackhole && head && Math.random() < MV('blackhole', ml.blackhole) && spellCD(wid, 'blackhole', ml.blackhole)) openBlackHole(c, ml.blackhole, wid);
  }
  it.mk++;
  if (MUT_STEPS.includes(it.mk)) { it.pend++; medal(`${it.base.name.toUpperCase()} CAN MUTATE · ${keyLabel('mutate')}`, '✦', 0, 'lv'); SND.levelUp(); lastSlotsKey = ''; }
}
function onKill(bot, head, weaponName, o) {
  stats.kills++; if (head) stats.heads++;
  if (cheats.confetti) { const c = bot.center(); [0xff8fab, 0x7bd8b5, 0x8fb8ff, 0xffc86b, 0xc49bff].forEach(col => sparks(c, col, 10, 8)); }
  const pts = bot.t.pts + (head ? 50 : 0) + wave * 10, cash = Math.round((bot.t.cash + (head ? 100 + (perk().headCash || 0) : 0)) * diff.cash);
  const now = runTime, dist = bot.pos.distanceTo(player.pos);
  chainN = now - lastKillT < 1.8 ? chainN + 1 : 1; lastKillT = now;
  // badges for the kill feed: how this kill happened
  const tags = [], wdef = o.weaponId ? byId(o.weaponId) : null;
  if (o.vol && /[🔥⚡☄🌀]/u.test(weaponName || '')) tags.push(['✦', 'Spell mutation', 'sp']);
  else if (o.chain) tags.push(['ϟ', 'Chain lightning', 'ch']);
  else if (o.blast) tags.push(['✸', 'Explosion', 'bl']);
  if (wdef?.wallPierce && !o.blast && !lineOfSight(camera.position, bot.center())) tags.push(['▦', 'Through a wall', 'wl']);
  if (!o.helper && !o.blast && dist > 45) tags.push(['➶', `Longshot ${Math.round(dist)} m`, 'ls']);
  else if (!o.helper && !o.blast && dist < 3) tags.push(['!', 'Point blank', 'pb']);
  if (!o.helper && !player.onGround && !o.blast) tags.push(['✈', 'In the air', 'air']);
  if (o.helper) tags.push(['⚙', 'Turret or drone', 'hp']);
  score += pts; earn(cash); feed(bot.name, head, cash, weaponName, tags, chainN, bot.t.boss ? 'boss' : bot.elite ? 'elite' : ''); SND.kill();
  multiPop(chainN); if (chainN >= 3) life('chain', chainN, true); if (!o.helper && !o.blast && dist > 100) life('longest', Math.round(dist), true);
  if (o.weaponId && !o.helper) addXP(o.weaponId, 100 + (head ? 50 : 0) + (bot.elite ? 100 : 0) + (bot.t.boss ? 900 : 0));
  const kit = o.weaponId && !o.helper ? [player.slots.primary, player.slots.secondary, player.slots.melee].find(x => x && x.base.id === o.weaponId) : null;
  if (kit) mutKill(kit, head, bot, o);
  if (!o.helper) skillEvent("kill", head);
  // kills up close splash your screen
  if (!bot.alt && settings.blood !== "off" && bot.pos.distanceTo(player.pos) < (settings.gore !== "normal" ? 6 : 3)) goreScreen(bot.t.color, o.blast || head ? 3 : 2);
  // medals
  if (chainN >= 2) medal(['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL'][chainN] || 'RAMPAGE', '×' + chainN, 75 * chainN);
  if (head && !o.helper) medal('HEADSHOT', '◉', 25);
  const d = dist;
  if (!o.helper && !o.blast && d > 45) medal(`LONGSHOT ${Math.round(d)}M`, '➶', 100);
  if (!o.helper && !o.blast && d < 3) medal('POINT BLANK', '!', 50);
  player.streak++; stats.bestStreak = Math.max(stats.bestStreak, player.streak);
  if (player.streak % 5 === 0) medal(`UNTOUCHABLE ×${player.streak}`, '★', 50 * player.streak);
  const r = Math.random();
  if (r < .22 || player.hp < 35 && r < .5) dropPickup(bot.pos, 'hp'); else if (r < .4) dropPickup(bot.pos, 'ammo');
  // characters, floor modifiers, paint, lifetime stats
  prog.best[bot.type] = (prog.best[bot.type] || 0) + 1;
  life('kills'); if (head) life('heads'); life('streak', player.streak, true);
  if (bot.t.titan) { life('titans'); happy(); } else if (bot.t.boss) life('wardens');
  if (o.slam) slamKills++;
  const heal = (perk().killHeal || 0) + (floorMod.id === 'blood' ? 6 : 0); if (heal) player.hp = Math.min(player.maxHp, player.hp + heal);
  if (floorMod.id === 'chain' && !bot.t.kamikaze && !o.vol) { const c = bot.center(); setTimeout(() => explode(c, 4.5, 55, { from: bot, vol: true, name: 'Chain Reaction' }), 110); }
  addPaint(bot.alt ? 1 : 2.5 + (head ? 2 : 0) + (o.blast ? 2 : 0) + (bot.t.boss ? 25 : 0));
  if (bot.t.kamikaze) { const c = bot.center(); setTimeout(() => explode(c, 5, 80, { from: bot }), 120); }
  if (bot.t.boss) { banner(bot.t.titan ? 'TITAN DESTROYED' : 'WARDEN DOWN', `+$${Math.round(cash * cashMul())}`); dropPickup(bot.pos, 'hp'); dropPickup(bot.pos.clone().add(new V3(1.5, 0, 0)), 'ammo'); }
}
function addXP(id, n) {
  const before = levelOf(prog.xp[id] || 0).level;
  prog.xp[id] = (prog.xp[id] || 0) + n; runXP[id] = (runXP[id] || 0) + n;
  const after = levelOf(prog.xp[id]).level;
  if (after > before) {
    SND.levelUp(); medal(`${byId(id).name} LEVEL ${after}`, '▲', 0, 'lv');
    const unlock = SKINS.find(s => s.level === after); if (unlock) medal(`UNLOCKED ${unlock.name.toUpperCase()}`, '✦', 0, 'lv');
    ['primary', 'secondary'].forEach(s => { const it = player.slots[s]; if (it && it.base.id === id) refit(it); });
    saveProg();
  }
}
function medal(text, icon, bonus = 0, cls = '') {
  bonus = Math.round(bonus * ECON);
  const m = document.createElement('div'); m.className = 'md ' + cls;
  m.innerHTML = `<i>${icon}</i>${text}${bonus ? ` <small>+$${bonus}</small>` : ''}`;
  $('medals').prepend(m); setTimeout(() => m.remove(), 2800);
  while ($('medals').children.length > 4) $('medals').lastChild.remove();
  if (bonus) { player.cash += bonus; stats.earned += bonus; }
  SND.medal();
}
function dmgNumber(point, dmg, head, kill, ally) {
  if (!settings.dmgNums || !point) return;
  const v = point.clone().project(camera); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return;
  const d = document.createElement('div'); d.className = 'dn' + (kill ? ' kill' : head ? ' head' : '');
  if (ally) d.style.color = '#4fd1c5';
  d.textContent = Math.max(1, Math.round(dmg)) + (kill ? ' ✕' : '');
  d.style.left = ((v.x + 1) / 2 * innerWidth + rand(-14, 14)) + 'px'; d.style.top = ((1 - v.y) / 2 * innerHeight - 20) + 'px';
  $('dmgnums').appendChild(d); setTimeout(() => d.remove(), 900);
  while ($('dmgnums').children.length > 30) $('dmgnums').firstChild.remove();
}
function earn(n, raw) {
  n = Math.round(raw ? n : n * cashMul()); life('earned', n); // raw = already final (quest and level rewards)
  player.cash += n; stats.earned += n; SND.cash();
  const c = $('cashpop'); c.textContent = `+$${n}`; c.style.transition = 'none'; c.style.opacity = 1; c.style.transform = 'none';
  requestAnimationFrame(() => { c.style.transition = 'opacity .8s .3s, transform 1s'; c.style.opacity = 0; c.style.transform = 'translateY(-24px)'; });
}
function bloodScreen(dmg) {
  const host = $('bloodscreen'), n = dmg > 25 ? 3 : dmg > 10 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div'), size = rand(140, 300), edge = Math.floor(Math.random() * 4);
    s.className = 'bs'; s.style.width = s.style.height = size + 'px';
    const x = edge === 0 ? -size * .4 : edge === 1 ? innerWidth - size * .6 : rand(0, innerWidth - size), y = edge === 2 ? -size * .4 : edge === 3 ? innerHeight - size * .6 : rand(0, innerHeight - size);
    s.style.left = x + 'px'; s.style.top = y + 'px'; host.appendChild(s); setTimeout(() => s.remove(), 1900);
  }
  while (host.children.length > 10) host.firstChild.remove();
}
// big cartoon splats of the bot's blood across your screen that run down and fade
function goreScreen(base, n) {
  const host = $('bloodscreen'), hex = bloodColor(base), rgb = `${hex >> 16 & 255},${hex >> 8 & 255},${hex & 255}`;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div'), size = rand(170, 400); s.className = 'bs gore';
    s.style.cssText = `width:${size}px;height:${size}px;left:${rand(-size * .3, innerWidth - size * .7)}px;top:${rand(-size * .3, innerHeight * .6)}px;--g:${rgb}`;
    host.appendChild(s); setTimeout(() => s.remove(), 2700);
  }
  while (host.children.length > 14) host.firstChild.remove();
}
function hurt(dmg, src, self) {
  if (!liveNow() || godmode || player.down) return;
  dmg *= (perk().dmgTaken || 1) * (floorMod.id === 'glass' ? 3 : 1);
  if (player.armor > 0) { let ab = dmg * .5; ab = Math.min(ab, player.armor); player.armor -= ab; dmg -= ab; }
  player.hp -= dmg; player.floorHit = true; skillEvent("hurt", dmg); SND.hurt(); player.streak = 0; post.uniforms.hurt.value = Math.min(1.2 * settings.hurtFx, post.uniforms.hurt.value + (.35 + dmg / 30) * settings.hurtFx);
  if (dmg > 3) bloodScreen(dmg);
  player.pitch += rand(.006, .014) * Math.min(dmg / 15, 2); player.yaw += rand(-.01, .01); player.shake += dmg / 40;
  $('vignette').style.opacity = clamp(.4 + dmg / 25, 0, 1); setTimeout(() => $('vignette').style.opacity = 0, 180);
  if (!self && src) {
    const a = Math.atan2(src.x - player.pos.x, src.z - player.pos.z), f = Math.atan2(-Math.sin(player.yaw), -Math.cos(player.yaw));
    let rel = a - f; while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
    const dd = $('dmgdir'); dd.style.transform = `rotate(${-rel}rad)`; dd.style.opacity = 1; clearTimeout(hurt.t); hurt.t = setTimeout(() => dd.style.opacity = 0, 600);
  }
  if (training) player.hp = Math.max(player.hp, 15);
  if (player.hp <= 0) { if (coop && (coop.role === 'host' ? mates.some(m => m.alive) : teamUp())) goDown(); else gameOver(); }
}

// ---------- shooting ----------
const raycaster = new THREE.Raycaster(); raycaster.camera = camera;
function findBot(o) { while (o) { if (o.userData.bot) return o.userData.bot; o = o.parent; } return null; }
function spreadNow(w) {
  if (w.perfect || adm.steady) return 0; // Stillwater: every bullet goes exactly where the crosshair is, moving, jumping or not
  const sp = Math.hypot(player.vel.x, player.vel.z);
  let s = lerp(w.hip, w.ads, player.adsT) + player.bloom + (sp / 7) * .025 * w.move * (1 - .6 * player.adsT);
  if (!player.onGround) s += .06;
  s *= 1 - .3 * player.crouch;
  if (player.cant) s *= 1 + .25 * player.adsT; // tilted aim is quicker but a little less precise
  const li = cur(); if (li?.w === w && li.att.under === "laser") s *= 1 - (1 - LASER_LV[li.lz?.lv || 0].hip) * (1 - player.adsT);
  if (w.cat === 'Sniper' && player.adsT < .95) s = Math.max(s, w.hip);
  return s * (WX_FX[weather]?.spread || 1); // sandstorm: harder to aim
}
function startReload() {
  const it = cur(), w = it.w;
  if (it.reloadT > 0 || it.reserve <= 0 || player.switchT > 0) return;
  const cap = w.mag + (w.chamber && it.mag > 0 ? 1 : 0);
  if (it.mag >= cap) { if (player.inspectT <= 0) startInspect(2); return; }
  player.inspectT = 0;
  if (w.shell) { it.shellMode = true; it.reloadT = it.reloadTotal = w.shell + (it.mag === 0 ? .3 : 0); }
  else { it.reloadT = it.reloadTotal = it.mag > 0 ? w.reload : w.emptyReload; it.wasEmpty = it.mag === 0; const keyed = !!view?.fam; it.magInDone = keyed; it.rackDone = keyed; if (!keyed) SND.magOut(); } // keyframed reloads play their own sounds as they go
  player.burstLeft = 0;
}
function finishReload(it) {
  const w = it.w;
  if (it.shellMode) {
    it.mag++; it.reserve--; SND.shellIn();
    if (it.mag < w.mag && it.reserve > 0) it.reloadT = it.reloadTotal = w.shell; else { it.shellMode = false; if (w.cycle) { SND.pump(); if (view?.pump) view.pumpRack = .5; } }
    return;
  }
  const cap = w.mag + (w.chamber && it.mag > 0 ? 1 : 0), take = Math.min(cap - it.mag, it.reserve);
  it.mag += take; it.reserve -= take;
  if (it.wasEmpty && !it.rackDone) SND.chargeH();
}
// ---------- melee ----------
// Swing keyframes: [time 0..1, arm x, y, z, arm turn x (tip up), y (tip left), z (roll), wrist x, y, z]. Every swing
// winds up (to ~20%), strikes fast (the hit lands at 42%), follows through, then settles back.
const K0 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const SWINGS = {
  // right to left: cocked out to the right with the blade turned flat, then swept hard across
  rl: [K0, [.2, .09, .03, .03, .1, -.55, -.35, 0, 0, -1.15], [.46, -.13, -.01, -.09, -.1, .75, .3, -.2, 0, -1.25], [.66, -.17, -.04, -.03, -.2, .85, .4, -.2, 0, -1.1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // left to right: the backhand
  lr: [K0, [.2, -.1, .04, .03, .1, .55, .35, 0, 0, 1.05], [.46, .14, -.02, -.09, -.1, -.7, -.3, -.2, 0, 1.15], [.66, .17, -.05, -.03, -.2, -.8, -.4, -.2, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // overhead: raised high with the tip back over your shoulder, then chopped straight down
  down: [K0, [.22, .02, .12, .06, .95, .05, -.1, .45, 0, 0], [.46, -.01, -.1, -.12, -.75, 0, .05, -.45, 0, 0], [.66, 0, -.14, -.05, -.85, 0, .05, -.4, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // upswing: dropped low and back, then ripped up and forward
  up: [K0, [.22, .03, -.13, .04, -.8, .12, .25, -.45, 0, .2], [.46, -.02, .09, -.11, .85, -.1, -.1, .35, 0, 0], [.66, -.01, .11, -.05, .95, -.05, -.1, .3, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // stab: pulled back with the point straight ahead, then thrust out
  stab: [K0, [.2, .03, -.02, .09, -.12, 0, 0, -.42, 0, 0], [.42, -.03, .01, -.24, .04, .06, 0, -.48, 0, 0], [.62, -.03, .01, -.2, .02, .06, 0, -.46, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
};
// the combo each weapon plays, one swing per click (starts over if you stop swinging for 1.2 s)
const SWING_SEQ = { knife: ['rl', 'lr', 'stab', 'down'], machete: ['rl', 'lr', 'down', 'up'], claws: ['rl', 'lr', 'up', 'stab'], bat: ['rl', 'down', 'lr', 'up'],
  sledge: ['down', 'rl', 'up', 'lr'], katana: ['rl', 'lr', 'down', 'up', 'stab'], scythe: ['rl', 'lr', 'up', 'down'] };
function swingPose(keys, q) {
  let i = 0; while (i < keys.length - 2 && q > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], u = clamp((q - a[0]) / (b[0] - a[0] || 1), 0, 1), s = u * u * (3 - 2 * u);
  const out = []; for (let k = 1; k < 10; k++) out.push(a[k] + (b[k] - a[k]) * s); return out;
}
// Hold fire to keep swinging. A moment into each swing (when the blade is actually moving across) every bot in reach and
// inside the arc in front of you takes the hit, nearest first, up to w.cleave of them. Walls block it, and bots facing
// away take w.back times the damage.
function meleeTargets(w, reach) {
  const eye = camera.position, fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion), out = [];
  for (const b of bots) {
    if (!b.alive) continue;
    const c = b.center(), to = c.clone().sub(eye), d = to.length(), r = reach + .45 * b.t.scale;
    if (d > r) continue;
    const flat = to.clone().setY(0), ff = fwd.clone().setY(0);
    const a = d < 1.1 ? 0 : Math.min(fwd.angleTo(to), flat.lengthSq() > .01 && ff.lengthSq() > .01 ? ff.angleTo(flat) + Math.max(0, Math.abs(to.y) - 1.2) : 9);
    if (a > w.arc + (d < 1.8 ? .4 : 0) || !lineOfSight(eye, c)) continue;
    out.push({ b, c, d, to: to.normalize() });
  }
  return out.sort((x, y) => x.d - y.d).slice(0, w.cleave || 1);
}
function meleeHit(it, w) {
  const hits = meleeTargets(w, w.reach), fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion);
  if (!hits.length) return;
  stats.hit++; player.shake += w.slam ? .7 : .2; SND.hit();
  hits.forEach(({ b, c, to }, i) => {
    const bf = new V3(Math.sin(b.yaw), 0, Math.cos(b.yaw)), toMe = player.pos.clone().sub(b.pos).setY(0).normalize();
    const behind = bf.dot(toMe) < -.35, h = b.eye ? b.eye() : c, head = i === 0 && fwd.angleTo(h.clone().sub(camera.position)) < .14;
    const dmg = w.dmg * (behind ? w.back || 1 : 1) * (head ? w.head : 1) * (i ? .8 : 1);
    if (behind && i === 0) medal('BACKSTAB', '🗡', 0, 'lv');
    damageBot(b, dmg, head, c, w.name, to, { weaponId: w.id, melee: true, force: w.knock ? 4 : 1.5 });
    sparks(c, w.model.style === 'scythe' ? 0xb388ff : 0xfff1c0, 7, 4);
    if (w.knock && pushable(b)) b.knock = { x: to.x * w.knock, z: to.z * w.knock, t: .25 };
    if (w.heal) player.hp = Math.min(player.maxHp, player.hp + w.heal);
  });
  if (w.slam) smoke(player.pos.clone().addScaledVector(fwd.setY(0).normalize(), 2).setY(.2), 5, .6, 1);
}
function meleeTick(it, w, dt) {
  const T = trigger || (adm.auto && aimOnEnemy);
  it.fireCd -= dt;
  if (it.hitT > 0 && (it.hitT -= dt) <= 0) meleeHit(it, w);
  if (!T || it.fireCd > 0 || player.switchT > 0 || player.mantle) return;
  const dur = 60 / w.rpm / (adm.rapid ? 3 : 1);
  const seq = SWING_SEQ[w.model.style] || SWING_SEQ.knife, swingDur = Math.min(w.two ? .7 : .42, dur * .95);
  it.swingN = runTime - (it.lastSwing ?? -9) > 1.2 ? 0 : ((it.swingN ?? -1) + 1) % seq.length; it.lastSwing = runTime;
  it.fireCd = dur; it.hitT = swingDur * .42; player.inspectT = 0; stats.fired++;
  if (view) { view.swingDur = view.swingT = swingDur; view.swingKind = seq[it.swingN]; }
  SND.whoosh();
  // lunge: leap at whatever you're swinging at, if it's a little out of reach
  if (w.lunge) {
    const t = meleeTargets(w, w.reach + w.lunge)[0];
    if (t && t.d > w.reach * .7) { const dir = t.c.clone().sub(player.pos).setY(0).normalize(); player.vel.x = dir.x * (10 + w.lunge * 2.5); player.vel.z = dir.z * (10 + w.lunge * 2.5); if (player.onGround) player.vel.y = Math.max(player.vel.y, 2.5); }
  }
}
function handleFire(dt) {
  const it = cur(), w = it.w;
  if (w.melee) return meleeTick(it, w, dt);
  // admin auto-shoot: pulls the trigger for you while your crosshair is on a bot
  const T = trigger || (adm.auto && aimOnEnemy); if (adm.auto && aimOnEnemy) player.semiReady = true;
  if (!T) player.semiReady = true;
  it.fireCd -= dt;
  if (it.cycleT > 0) { it.cycleT -= dt; if (it.cycleT <= 0 && w.cycle) shell(ejectPos(), ejectVel(w), 0xd4a73a, caseKind(w), player.yaw); }
  if (it.reloadT > 0) {
    if (it.shellMode && T && it.mag > 0 && player.semiReady) { it.reloadT = 0; it.shellMode = false; }
    else {
      it.reloadT -= dt;
      // sounds line up with the reload animation: mag slapped in at 76%, racked at 87% if it was empty
      const rq = 1 - it.reloadT / it.reloadTotal;
      if (!it.shellMode && !it.magInDone && rq > .76) { it.magInDone = true; SND.magIn(); }
      if (!it.shellMode && it.wasEmpty && !it.rackDone && rq > .87) { it.rackDone = true; SND.chargeH(); }
      if (it.reloadT <= 0) finishReload(it); return;
    }
  }
  if (w.spin) {
    const was = player.spin; player.spin = clamp(player.spin + (T && !player.sprinting ? dt / w.spin : -dt / (w.spin * 1.5)), 0, 1);
    if (was === 0 && player.spin > 0) SND.spin();
    if (player.spin < 1) { if (!T) player.semiReady = true; return; }
  }
  if (player.switchT > 0 || player.sprinting || player.sprintRecover > 0 || it.cycleT > 0 || player.mantle) { if (!T) player.semiReady = true; return; }
  const mode = w.modes[it.mode], auto = mode === 'auto';
  const want = player.burstLeft > 0 || (T && (auto || player.semiReady));
  if (!T) player.semiReady = true;
  if (!want || it.fireCd > 0) return;
  if (it.mag <= 0) { player.burstLeft = 0; if (player.semiReady) { SND.dry(); view.dryT = .22; startReload(); } player.semiReady = false; return; }
  if (!auto && player.burstLeft <= 0) player.semiReady = false;
  if (mode === 'burst' && player.burstLeft <= 0) player.burstLeft = w.burst;
  player.inspectT = 0;
  fireShot(it); if (adm.ammo) it.mag = it.w.mag; // admin: infinite ammo
  it.fireCd = 60 / w.rpm / (adm.rapid ? 3 : 1);
  if (mode === 'burst') { player.burstLeft--; if (player.burstLeft <= 0) it.fireCd = Math.max(it.fireCd, .22); }
  if (w.cycle) { it.cycleT = w.cycle; if (mode === 'bolt') SND.bolt(); else if (mode === 'pump') setTimeout(SND.pump, 120); else setTimeout(SND.chargeH, 150); }
}
// Spent cases leave the ejection port: up, to the right and a little back over your shoulder. Pistols and SMGs flick
// them out lighter; big rifles throw them harder. The kind of case follows the gun's class.
function ejectPos(side = 0) { const p = view.port ? view.port.clone() : new V3(.04, view.boreY + .02, view.rearZ - .1); return view.ak ? akPt(side, p) : toWorld(p); }
const caseKind = w => w.cat === 'Shotgun' ? 'hull' : w.cat === 'Pistol' || w.cat === 'SMG' ? 'pistol' : w.cat === 'Sniper' ? 'big' : 'rifle';
function ejectVel(w) {
  const k = w && (w.cat === 'Pistol' || w.cat === 'SMG') ? .8 : w?.cat === 'Sniper' ? 1.2 : 1;
  const r = new V3(1, 0, 0).applyQuaternion(camera.quaternion), back = new V3(0, 0, 1).applyQuaternion(camera.quaternion);
  return r.multiplyScalar(rand(2.2, 3.2) * k).add(new V3(0, rand(1.8, 2.8) * k, 0)).addScaledVector(back, rand(.3, .9)).add(player.vel.clone().multiplyScalar(.85));
}
function fireShot(it) {
  const w = it.w; stats.fired++; player.sinceShot = 0;
  const side = view.ak ? view.ak.next : 0; if (view.ak) view.ak.next ^= 1; // dual pistols take turns: right, left, right...
  if (w.ramp) player.ramp = Math.min(1, (player.ramp || 0) + (w.rampStep || .05)); // heat guns hit harder the longer you hold the trigger
  if (!(Math.random() < MV("bottomless", w.ml.bottomless))) it.mag--;
  const spread = spreadNow(w);
  if (!w.perfect) player.bloom = Math.min(player.bloom + w.bloom, .06);
  camera.updateMatrixWorld();
  // shoot from the view you were looking at when you clicked (the last frame drawn), not where this frame has already
  // moved the camera to: at sprint-jump and combo speeds that gap was enough to miss what was under your crosshair
  const near = shown.ok && shown.p.distanceToSquared(camera.position) < 9, origin = near ? shown.p.clone() : camera.position.clone(), q = near ? shown.q : camera.quaternion;
  const fwd = new V3(0, 0, -1).applyQuaternion(q), right = new V3(1, 0, 0).applyQuaternion(q), up = new V3(0, 1, 0).applyQuaternion(q);
  const muzzle = magnified(w) && player.adsT > .9 ? origin.clone().addScaledVector(up, -.12).addScaledVector(fwd, .4) : (view.ak ? akPt(side, new V3(0, view.boreY, view.muzzleZ)) : toWorld(new V3(0, view.boreY, view.muzzleZ)));
  if (w.smite) smite(w);
  else if (w.projectile) {
    const pr = w.projectile, dir = fwd.clone().addScaledVector(up, .02).normalize();
    launch(origin.clone().addScaledVector(fwd, .6), dir.multiplyScalar(pr.speed), { impact: true, radius: pr.radius, dmg: pr.dmg, grav: pr.gravity, wid: w.id, cluster: pr.cluster, fuse: pr.fuse, nuke: pr.nuke, safe: pr.safe });
  } else {
    let anyHit = false; shotHits = new Map();
    const np = w.pellets + (Math.random() < MV("split", w.ml.split) ? Math.max(1, Math.round(w.pellets * .5)) : 0);
    for (let i = 0; i < np; i++) {
      const a = spread * Math.sqrt(Math.random()), t = Math.random() * Math.PI * 2, ta = Math.tan(a);
      const dir = fwd.clone().addScaledVector(right, Math.cos(t) * ta).addScaledVector(up, Math.sin(t) * ta).normalize();
      if (trace(origin, dir, w, muzzle, i)) anyHit = true;
    }
    const hits = shotHits; shotHits = null; let kills = 0;
    hits.forEach(e => { dmgNumber(e.point, e.dmg, e.head, e.died); if (e.died) kills++; });
    if (kills >= 2) medal('COLLATERAL', '⇶', 150);
    if (anyHit) stats.hit++;
    skillEvent("shot", anyHit);
  }
  // recoil: camera climbs, sideways drift grows through a spray; pulling the mouse down pays it back
  const braced = adm.steady ? 0 : w.bipod && player.crouch > .5 ? .5 : 1;
  const rv = w.recoilV * rand(.85, 1.15) * (1 - .3 * player.crouch) * (1 - .12 * player.adsT) * braced;
  const rh = ((Math.random() * 2 - 1) * w.recoilH + Math.sin(player.sprayN * .45) * w.recoilH * .8 * Math.min(player.sprayN / 6, 1)) * braced;
  player.sprayN++; player.pitch = clamp(player.pitch + rv, -1.5, 1.5); player.recoilDebt += rv; player.yaw += rh; player.yawDebt += rh;
  player.kick = Math.min(player.kick + w.kick * braced, 1.6); player.shake += w.kick * .25 * braced;
  // muzzle flash, light and smoke
  const showFlash = !w.noFlash && !(magnified(w) && player.adsT > .9);
  const fl = view.ak ? view.ak.flash[side] : view.flash;
  fl.visible = showFlash; fl.rotation.z = rand(0, 6.28); fl.scale.setScalar(rand(.8, 1.3) * (w.pellets > 1 || w.kick > 1 ? 1.7 : 1));
  setTimeout(() => { fl.visible = false; }, 45);
  if (!w.quiet) { gunFlash.intensity = 6; flashLight(muzzle, 0xffc46b, 10, 7, .06); }
  if (Math.random() < (w.pellets > 1 ? 1 : .35)) smoke(muzzle, 1, w.pellets > 1 ? .18 : .1, .8);
  // moving parts
  if (view.slide) view.slideZ = .026;
  if (view.ak) { view.ak.sz[side] = .026; view.ak.kick[side] = 1; }
  if (it.mag === 0) view.lastT = .35;
  if (view.cyl) view.cylT += Math.PI / 3;
  if (!w.cycle && !['double', 'revolver', 'launcher', 'minigun'].includes(w.model.kind) || w.model.kind === 'minigun' && Math.random() < .3) shell(ejectPos(side), ejectVel(w), 0xd4a73a, caseKind(w), player.yaw);
  SND.gun(w.snd, { quiet: w.quiet, cat: w.cat, id: w.id, ads: player.adsT > .5, last: it.mag === 0 });
  // gunfire is loud: bots in earshot go to check it out, with a rough guess of where it came from
  for (const b of bots) if (b.alive) { const d = b.pos.distanceTo(player.pos); if (d < w.hear) b.noise(player.pos, 1 + d * .2, w.quiet ? .3 : .55); }
}
function trace(origin, dir, w, muzzle, pellet) {
  const ml = w.ml || {}, thirst = (1 + (cur()?.thirst || 0)) * (rampageOn() ? 1.5 : 1);
  // admin aimbot rounds: the shot goes straight to the nearest head within about 75 degrees of where you look
  // (through walls too if the gun shoots through walls)
  if (w.seek) {
    let best = null, ba = 1.3;
    for (const b of bots) {
      if (!b.alive) continue;
      const h = b.eye(); h.y -= .12 * b.t.scale; const to = h.clone().sub(origin), d = to.length(); if (d > 300 || d < .5) continue;
      const a = dir.angleTo(to); if (a < ba && (w.wallPierce || lineOfSight(origin, h))) { ba = a; best = to.normalize(); }
    }
    if (best) dir = best;
  }
  // Seeker Rounds: level I bends toward bodies only; II and III toward heads, in a wider circle
  if (ml.homing) {
    const L = ml.homing, cone = MV('homing', L), pull = MV('homing', L, 'pull');
    let best = null, ba = cone;
    for (const b of bots) {
      if (!b.alive) continue;
      const to = L === 1 ? b.center().sub(origin) : b.eye().sub(origin); if (L > 1) to.y -= .12 * b.t.scale;
      const d = to.length(); if (d > 150 || d < 1) continue;
      const a = dir.angleTo(to); if (a < ba) { ba = a; best = to.normalize(); }
    }
    if (best) dir = dir.clone().lerp(best, pull).normalize();
  }
  // walls come from the collision boxes (fast on huge maps); only bots are mesh-raycast, and only up to the wall
  const wall = w.wallPierce ? null : rayWall(origin, dir, 320);
  raycaster.set(origin, dir); raycaster.far = wall ? wall.d : 320;
  const botObjs = bots.filter(b => b.alive && b.pos.distanceToSquared(origin) < 330 * 330).map(b => b.group);
  const hits = raycaster.intersectObjects(botObjs, true).filter(h => h.object.isMesh && !h.object.userData.ui);
  let end = wall ? wall.point : origin.clone().addScaledVector(dir, 320), pierced = 0, any = false, stopped = false;
  const seen = new Set(), force = 2 + w.kick * 3 + (ml.hollow ? ml.hollow : 0), keep = ml.drill ? MV('drill', ml.drill, 'dm') : .75;
  for (const h of hits) {
    const bot = findBot(h.object);
    if (!bot || !bot.alive || seen.has(bot)) continue;
    if (h.object.userData.shield && !w.wallPierce) { end = h.point; stopped = true; sparks(h.point, 0x9cc5d6, 4, 3); if (pellet < 2) SND.click(); break; } // riot shield stops bullets
    seen.add(bot); any = true;
    const head = !!h.object.userData.head, limb = !!h.object.userData.limb, d = h.distance;
    const fall = d <= w.range ? 1 : Math.max(w.minMult, 1 - (1 - w.minMult) * (d - w.range) / (w.falloff - w.range));
    let dmg = w.dmg * thirst * fall * Math.pow(keep, pierced) * (head ? w.head * (w.apHead ? 1 : bot.t.head) : limb ? .75 : 1);
    // headshots are one-tap kills on everything except the Warden boss, which takes heavy headshot damage instead
    if (head) dmg = bot.t.boss ? dmg * 2 : Math.max(dmg, bot.hp + 1);
    // special gun traits: crits, momentum, heat ramp, last-round punch and executes
    if (w.crit && Math.random() < w.crit) { dmg *= w.critMul || 3; sparks(h.point, 0xffd34d, 8, 4); if (pellet === 0) medal('CRIT', '✦', 0); }
    if (w.airBonus && (!player.onGround || player.slideT > 0)) dmg *= w.airBonus;
    if (w.ramp) dmg *= 1 + player.ramp * (w.ramp - 1);
    if (w.lastShot && cur()?.mag === 0) dmg *= w.lastShot;
    if (w.execute && !bot.t.boss && bot.hp - dmg * (bot.t.dr || 1) < bot.t.hp * w.execute) { dmg = lethal(bot); sparks(h.point, 0xd6453d, 10, 5); }
    damageBot(bot, dmg, head, h.point, w.name, dir, { weaponId: w.id, force, ml, core: !!h.object.userData.core });
    if (w.lifesteal && floorMod.id !== 'blood') player.hp = Math.min(player.maxHp, player.hp + dmg * w.lifesteal);
    if (w.knock && pushable(bot)) bot.knock = { x: dir.x * w.knock, z: dir.z * w.knock, t: .22 };
    if (w.zap && pellet === 0) zapChain(bot, w, seen);
    if (pierced++ >= w.pierce) { end = h.point; stopped = true; break; }
  }
  if (!stopped && wall) {
    const n = wall.normal; decal(wall.point, n); if (pellet < 3) { sparks(wall.point, 0xb8a888, 3, 3); if (pellet < 1) smoke(wall.point.clone().addScaledVector(n, .05), 1, .12, .6); }
    // Ricochet: the round bounces off the wall into the closest bot it can see
    if (ml.ricochet && pellet < 2 && Math.random() < MV('ricochet', ml.ricochet)) {
      const from = wall.point.clone().addScaledVector(n, .1); let tb = null, td = 18;
      for (const b of bots) if (b.alive && !seen.has(b)) { const dd = b.center().distanceTo(from); if (dd < td && lineOfSight(from, b.center())) { td = dd; tb = b; } }
      if (tb) {
        const c = tb.center(); tracer(from, c, 0x4fd1c5, .14); sparks(from, 0x4fd1c5, 5, 3);
        damageBot(tb, w.dmg * thirst * MV('ricochet', ml.ricochet, 'dm'), false, c, w.name + ' ↯', c.clone().sub(from).normalize(), { weaponId: w.id, force, ml }); any = true;
      }
    }
  }
  if (w.boom && pellet < 3) explode(end.clone(), w.boom.r, w.boom.dmg, { wid: w.id, safe: true });
  if (w.id === 'rail') beam(muzzle, end, 0x4fd1c5, .035, .6);
  else if (pellet < 3) tracer(muzzle, end, w.cat === 'Sniper' ? 0xfff1c0 : 0xffc46b, w.cat === 'Sniper' ? .12 : .05);
  if (pellet === 0 && NET.net.on) NET.shot(muzzle, end, mapDef?.id);
  return any;
}
// Stormcaller: lightning jumps from the bot you hit to the next closest one, w.zap times
function zapChain(bot, w, seen) {
  let from = bot.center();
  for (let j = 0; j < w.zap; j++) {
    let tb = null, td = 14;
    for (const b of bots) if (b.alive && !seen.has(b)) { const d = b.center().distanceTo(from); if (d < td) { td = d; tb = b; } }
    if (!tb) break;
    const c = tb.center(); seen.add(tb); beam(from, c, 0xb388ff, .03, .25); sparks(c, 0xb388ff, 6, 4);
    damageBot(tb, w.dmg * 2, false, c, w.name + ' ϟ', c.clone().sub(from).normalize(), { weaponId: w.id, chain: true }); from = c;
  }
}
// Smite: every bot on the floor gets struck by lightning at once. Bosses take heavy damage, everything else dies.
function smite(w) {
  let n = 0;
  for (const b of [...bots]) {
    if (!b.alive || b.pos.distanceTo(player.pos) > 250) continue;
    const c = b.center(); if (n++ < 14) lightningBolt(b.pos.clone()); sparks(c, 0xfff1c0, 10, 6);
    damageBot(b, b.t.boss ? w.dmg * 3 : lethal(b), true, c, w.name + ' ⚡', new V3(0, -1, 0), { weaponId: w.id, force: 4 });
  }
  SND.thunder(20); lightningFlash(20); player.shake += .6;
  if (n) stats.hit++;
}

// ---------- movement helpers ----------
// A ledge in front you can climb onto (or a low wall to vault). Returns the landing spot or null.
function ledgeAhead(p, fwd, minRise) {
  const ax = p.x + fwd.x * .75, az = p.z + fwd.z * .75; let top = -1;
  for (const b of collidersNear(ax, az, 1)) if (ax > b.minX && ax < b.maxX && az > b.minZ && az < b.maxZ && b.y0 <= p.y + .4 && b.h > p.y + minRise && b.h < p.y + 2.35) top = Math.max(top, b.h);
  if (top < 0 || ceilingAt(p.x, p.z, .3, p.y) < top + 1.6) return null;
  for (const d of [.95, 1.3]) {
    const lx = p.x + fwd.x * d, lz = p.z + fwd.z * d;
    if (insideSolid(new V3(lx, top + .3, lz)) || insideSolid(new V3(lx, top + 1.5, lz))) continue;
    if (ceilingAt(lx, lz, .3, top) < top + 1.3) continue;
    return new V3(lx, top, lz);
  }
  return null;
}
// which side (1 right, -1 left, 0 none) has a wall right next to you at chest height
function wallSide(p, right) {
  for (const s of [1, -1]) if (insideSolid(new V3(p.x + right.x * s * .7, p.y + 1, p.z + right.z * s * .7))) return s;
  return 0;
}
const ease = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
// ---------- grapple hook & ground slam ----------
const rope = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0x2b2d42 }));
rope.geometry.translate(0, .5, 0); rope.geometry.rotateX(Math.PI / 2); rope.visible = false; rope.frustumCulled = false; scene.add(rope);
const hook = new THREE.Mesh(new THREE.OctahedronGeometry(.12), new THREE.MeshStandardMaterial({ color: 0xffe14d, emissive: 0xffe14d, emissiveIntensity: .6 })); hook.visible = false; scene.add(hook);
function setRope(a, b) { rope.position.copy(a); rope.lookAt(b); rope.scale.set(1, 1, a.distanceTo(b)); rope.visible = hook.visible = true; hook.position.copy(b); }
const handPos = () => camera.position.clone().add(new V3(.22, -.22, -.3).applyQuaternion(camera.quaternion));
function fireGrapple() {
  const range = AB(player.ab, 'grapple', 'range');
  if (!range) { banner('NO GRAPPLE HOOK', 'BUY IT IN THE SHOP: EQUIPMENT → ABILITIES'); return SND.deny(); }
  if (player.grapCd > 0 || player.mantle) return SND.deny();
  const dir = new V3(0, 0, -1).applyQuaternion(camera.quaternion), hit = rayWall(camera.position, dir, range);
  if (!hit || hit.d < 2.5 || hit.point.y < .3) { tracer(handPos(), camera.position.clone().addScaledVector(dir, hit ? hit.d : range), 0xfffaf0, .08); return SND.deny(); }
  life('grapples'); player.grap = { p: hit.point.clone().addScaledVector(hit.normal, .05), t: 0, pull: AB(player.ab, 'grapple', 'pull'), stuck: 0 };
  player.slamming = false; player.airPress = true; player.onGround = false; player.vel.y = Math.max(player.vel.y, 3);
  sparks(hit.point, 0xffe14d, 10, 3); SND.deploy(); SND.whoosh();
}
function endGrapple() { player.grap = null; rope.visible = hook.visible = false; player.grapCd = AB(player.ab, 'grapple', 'cd') || 0; }
function updateGrapple(dt) {
  const g = player.grap, p = player.pos; g.t += dt;
  const eye = new V3(p.x, p.y + player.eyeH, p.z), to = g.p.clone().sub(eye), d = to.length();
  to.normalize(); player.vel.lerp(to.multiplyScalar(g.pull), Math.min(1, dt * 6)); player.onGround = false;
  g.stuck = Math.hypot(player.vel.x, player.vel.y, player.vel.z) < 2 ? g.stuck + dt : 0;
  setRope(handPos(), g.p); player.fovKick = Math.max(player.fovKick, 6);
  if (d < 2.2 || g.t > 2.8 || g.stuck > .35) { player.vel.y = Math.max(player.vel.y, 6); endGrapple(); }
}
function trySlam() {
  const p = player.pos;
  if (!AB(player.ab, 'slam', 'dmg') || player.slamCd > 0 || player.onGround || player.slamming) return false;
  if (p.y - groundAt(p.x, p.z, .42, p.y, .5) < 1.5) return false;
  if (player.grap) endGrapple();
  player.slamming = true; player.slamY = p.y; player.vel.set(player.vel.x * .2, -22, player.vel.z * .2); SND.dash(); player.fovKick = 12;
  return true;
}
function landSlam(p) {
  player.slamming = false; player.slamCd = AB(player.ab, 'slam', 'cd'); player.slamBounce = .35; // jump now for a SLAM BOUNCE
  const h = clamp(player.slamY - p.y, 0, 20), dmg = AB(player.ab, 'slam', 'dmg') * (1 + h / 20), r = AB(player.ab, 'slam', 'radius');
  slamKills = 0; explode(new V3(p.x, p.y + .3, p.z), r, dmg, { safe: true, slam: true, name: 'Ground Slam' }); if (slamKills >= 3) { life('slam3'); medal(`METEOR ×${slamKills}`, '⤓', 150); }
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; smoke(new V3(p.x + Math.cos(a) * r * .5, p.y + .2, p.z + Math.sin(a) * r * .5), 1, .5, .7); }
  player.shake += 2.5; player.landDip = .16; moveCombo("GROUND SLAM");
}

// ---------- player update ----------
let mouseDX = 0, mouseDY = 0, swayClock = 0;
function updatePlayer(dt) {
  const it = cur(), w = it.w, p = player.pos;
  const fwd = new V3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)), right = new V3(Math.cos(player.yaw), 0, -Math.sin(player.yaw)), want = new V3();
  const shift = keys.ShiftLeft;
  let sliding = player.slideT > 0;
  if (adm.fly) flyStep(dt, p); // admin: fly (through walls too)
  else if (player.mantle) {
    // scripted climb: rise first, then roll forward onto the ledge
    const m = player.mantle; m.t += dt / m.dur; const k = Math.min(1, m.t);
    if (k < .6) { p.set(m.a.x, lerp(m.a.y, m.b.y + .05, ease(k / .6)), m.a.z); }
    else { const k2 = ease((k - .6) / .4); p.set(lerp(m.a.x, m.b.x, k2), m.b.y + .05, lerp(m.a.z, m.b.z, k2)); }
    player.vel.set(0, 0, 0);
    // a vault taken at a run keeps your speed (and counts as a move)
    if (k >= 1) { const fast = m.fast; player.mantle = null; player.vel.copy(fwd).multiplyScalar(fast ? 9 : 4); player.onGround = false; if (fast) moveCombo('VAULT'); }
  } else {
    // slide: press C while sprinting (or moving fast) for a burst of speed that bleeds off; you stay low and can't steer much.
    // Sliding straight out of a dash is a POWER SLIDE: longer and faster.
    const hs0 = Math.hypot(player.vel.x, player.vel.z), dashed = player.dashT > 0 || (player.sinceDash || 9) < .3;
    comboTick(dt, hs0);
    if (player.slideQ && (player.sprinting || hs0 > 7.5 || dashed) && player.onGround && player.slideCd <= 0 && hs0 > 2) {
      const power = dashed, snowy = slippery(); player.slideT = (power ? 1.15 : .85) * (snowy ? 1.8 : 1); player.slideCd = power ? .6 : 1.1; player.crouchOn = true; // snow: slides last almost twice as long
      const sp = Math.max(hs0, 7); player.slideDir = new V3(player.vel.x, 0, player.vel.z).normalize();
      const k = power ? 1.3 : 1.45, top = Math.min(70, power ? Math.max(sp * k, 17 * comboMul()) : sp * k);
      player.vel.x = player.slideDir.x * top; player.vel.z = player.slideDir.z * top; SND.slide(); player.dashT = 0;
      if (power) { player.fovKick = Math.max(player.fovKick, 8); sparks(new V3(p.x, p.y + .1, p.z), 0xfffaf0, 10, 3); moveCombo('POWER SLIDE'); } else moveCombo('SLIDE');
    }
    player.slideQ = false; player.slideCd -= dt; player.sinceDash = (player.sinceDash || 9) + dt;
    if (player.slamBounce > 0) player.slamBounce -= dt; if (player.slideBuf > 0) player.slideBuf -= dt;
    player.groundT = player.onGround ? (player.groundT || 0) + dt : 0;
    sliding = player.slideT > 0; if (sliding) player.slideT -= dt;
    if (keys.KeyW) want.add(fwd); if (keys.KeyS) want.sub(fwd); if (keys.KeyD) want.add(right); if (keys.KeyA) want.sub(right);
    const wasSprint = player.sprinting;
    player.sprinting = !sliding && shift && keys.KeyW && !adsHeld && player.crouch < .3 && !(w.spin && trigger);
    if (wasSprint && !player.sprinting && !sliding) player.sprintRecover = .2;
    player.sprintRecover -= dt;
    // dash: a quick burst in the direction you're moving, also mid-air. Charges refill one at a time.
    const dashMax = AB(player.ab, 'dash', 'charges') || 0, dashCd = (AB(player.ab, 'dash', 'cd') || 5) * (perk().dashCd || 1);
    if (player.dashQ && player.dashCh > 0) {
      // a dash never slows you down: it goes at least dash speed (more with a combo), or a bit faster than you already are
      const d = want.lengthSq() ? want.clone().normalize() : fwd.clone(), sp = Math.max(AB(player.ab, "dash", "speed") * comboMul(), hs0 + 3);
      player.vel.x = d.x * sp; player.vel.z = d.z * sp; if (!player.onGround) player.vel.y = Math.max(player.vel.y, 2);
      player.dashT = .2; player.dashCh--; if (player.dashCd <= 0) player.dashCd = dashCd; player.slideT = 0; sliding = false; player.fovKick = 10; SND.dash();
      player.sinceDash = 0; moveCombo('DASH');
    } else if (player.dashQ) SND.deny();
    player.dashQ = false; if (player.dashT > 0) player.dashT -= dt;
    if (player.dashCh < dashMax) { player.dashCd -= dt; if (player.dashCd <= 0) { player.dashCh++; player.dashCd = player.dashCh < dashMax ? dashCd : 0; } }
    // grapple: reel toward the hook point; jump to let go with a fling
    if (player.grapQ) { player.grapQ = false; if (player.grap) endGrapple(); else fireGrapple(); }
    if (player.grapCd > 0) player.grapCd -= dt;
    if (player.slamCd > 0) player.slamCd -= dt;
    if (want.lengthSq()) want.normalize().multiplyScalar(7.2 * moveMul() * w.mobility * (player.sprinting ? 1.5 : 1) * (1 - .45 * player.adsT) * (1 - .45 * player.crouch) * (1 - .35 * Math.abs(player.lean)));
    // momentum: going faster than you'd run (out of a slide, dash or hop) and still heading the same way, the extra speed
    // bleeds off gently instead of stopping dead. More steering in the air too.
    const hsNow = Math.hypot(player.vel.x, player.vel.z), wl = want.length();
    const carry = player.onGround && !sliding && wl > 0 && hsNow > wl + .5 && (player.vel.x * want.x + player.vel.z * want.z) > .7 * hsNow * wl;
    const accel = player.dashT > 0 || player.wallT > 0 || player.grap || player.slamming ? 0 : sliding ? (slippery() ? .3 : .9) : player.onGround ? (slippery() ? (carry ? 2.2 : 6) : carry ? 4.5 : 13) : player.gliding ? 3 * AB(player.ab, 'glide', 'steer') : 4.5;
    player.vel.x += (want.x - player.vel.x) * Math.min(1, accel * dt); player.vel.z += (want.z - player.vel.z) * Math.min(1, accel * dt);
    // jump, wall-jump or climb
    // coyote time: you can still jump a moment after running off an edge. Jump buffer: press jump just before you land and
    // it jumps the moment you touch down (that's how bunny hops chain).
    const jp = player.jumpQ; player.jumpQ = false;
    player.coyote = player.onGround ? .12 : Math.max(0, (player.coyote || 0) - dt);
    player.jumpBuf = jp ? .15 : Math.max(0, (player.jumpBuf || 0) - dt);
    let climbed = false;
    // charged jump: crouch, hold jump to wind up (about .8 s to full), let go to launch up to about 3x as high
    if (player.onGround && player.crouch >= .5 && !sliding && keys.Space && !player.mantle) {
      const before = player.jCharge || 0; player.jCharge = Math.min(1, before + dt / .8);
      if (before < 1 && player.jCharge >= 1) SND.click();
    } else if (player.jCharge > 0) {
      if (player.onGround && !keys.Space && player.jCharge > .12) {
        const c = player.jCharge; player.vel.y = 8.4 * (1 + .75 * c); player.onGround = false; player.crouchOn = false; climbed = true;
        if (want.lengthSq()) { player.vel.x *= 1 + .25 * c; player.vel.z *= 1 + .25 * c; }
        SND.jump(); if (c > .6) SND.whoosh(); player.fovKick = Math.max(player.fovKick, 5 * c);
        if (c > .6) moveCombo('SUPER JUMP');
        smoke(new V3(p.x, p.y + .1, p.z), 3 + Math.round(c * 4), .4, .6); sparks(new V3(p.x, p.y + .1, p.z), 0xfffaf0, Math.round(6 + c * 10), 3);
      }
      player.jCharge = 0;
    }
    if ((jp || keys.Space) && keys.KeyW && (jp || !player.onGround) && player.vel.y < 4) {
      const land = ledgeAhead(p, fwd, player.onGround ? .9 : .3);
      if (land) { player.mantle = { a: p.clone(), b: land, t: 0, dur: .3 + (land.y - p.y) * .08, fast: player.sprinting || hsNow > 7 }; player.wallT = 0; climbed = true; SND.mantle(); }
    }
    if (!climbed) {
      const groundJump = (keys.Space || jp || player.jumpBuf > 0) && (player.onGround || player.coyote > 0) && (player.crouch < .5 || sliding);
      if (groundJump && player.slamBounce > 0) {
        // SLAM BOUNCE: jump right as your ground slam lands to spring sky-high
        player.vel.y = 15.5; player.onGround = false; player.slamBounce = 0; player.coyote = player.jumpBuf = 0; SND.jump(); SND.whoosh();
        player.fovKick = Math.max(player.fovKick, 8); sparks(new V3(p.x, p.y + .1, p.z), 0xfffaf0, 14, 5); moveCombo('SLAM BOUNCE');
      } else if (groundJump) {
        player.vel.y = 8.4 * (adm.jump ? 2.6 : 1); player.onGround = false; player.coyote = player.jumpBuf = 0; SND.jump();
        const hs = Math.hypot(player.vel.x, player.vel.z);
        if (sliding) { player.vel.x *= 1.15; player.vel.z *= 1.15; moveCombo('SLIDE HOP'); } // slide-hop keeps your speed
        else if ((player.groundT || 0) < .14 && hs > 6.5) {
          // BUNNY HOP: jump the moment you land and you keep your speed, plus a little more each hop (up to 15 m/s, more with
          // a combo). It keeps a combo alive but doesn't add to it: it's just jumping while you run
          const k = Math.min(15 * comboMul(), hs * 1.05) / hs; player.vel.x *= k; player.vel.z *= k; player.mcT = runTime;
        }
        player.slideT = 0; player.crouchOn = false;
      } else if (jp && player.wallT > 0) {
        // WALL KICK: off the wall, a shove forward, and it gives back one dash charge
        const s = player.wallSide; player.vel.addScaledVector(right, -s * 7.5).addScaledVector(fwd, 2.5); player.vel.y = 8.5; player.lastWall = s; player.wallT = 0; player.wallBudget = Math.max(player.wallBudget, .8); SND.jump();
        if (player.dashCh < dashMax) player.dashCh++; moveCombo('WALL KICK');
      } else if (jp && player.grap) {
        // let go of the grapple with a fling
        player.vel.y = Math.max(player.vel.y, 0) + 7; player.vel.x *= 1.15; player.vel.z *= 1.15; endGrapple(); SND.jump(); player.airPress = true; moveCombo('GRAPPLE FLING');
      } else if (jp && !player.onGround) {
        player.airPress = true;
        if (player.jumpsLeft > 0 && !player.slamming) {
          player.jumpsLeft--; player.vel.y = AB(player.ab, 'djump', 'power') * (adm.jump ? 2 : 1); SND.jump(); SND.whoosh(); moveCombo('DOUBLE JUMP');
          if (want.lengthSq()) { const hs = Math.max(Math.hypot(player.vel.x, player.vel.z), 6); player.vel.x = want.x / want.length() * hs; player.vel.z = want.z / want.length() * hs; }
          sparks(new V3(p.x, p.y + .1, p.z), 0xfffaf0, 8, 2.5); smoke(new V3(p.x, p.y + .1, p.z), 3, .3, .5);
        }
      }
    }
    // wall-run: airborne, holding forward and sprint, next to a wall
    const gBelow = groundAt(p.x, p.z, .42, p.y, .5);
    const side = !player.onGround && keys.KeyW && player.wallBudget > 0 && p.y > gBelow + .5 ? wallSide(p, right) : 0;
    if (side && (player.wallT > 0 || (shift && player.vel.y < 5 && side !== player.lastWall))) {
      if (player.wallT <= 0) { SND.wallrun(); player.vel.y = Math.max(player.vel.y, 2.5); moveCombo('WALL RUN'); }
      player.wallT = .2; player.wallSide = side; player.wallBudget -= dt;
      const hs = Math.max(Math.hypot(player.vel.x, player.vel.z), 8.5); player.vel.x = fwd.x * hs; player.vel.z = fwd.z * hs;
      player.stepT -= dt; if (player.stepT <= 0) { player.stepT = .22; SND.step(.6); }
    } else if (player.wallT > 0) { player.wallT = 0; player.lastWall = player.wallSide; }
    if (player.grap) updateGrapple(dt);
    else player.vel.y -= (player.wallT > 0 ? 5 : player.slamming ? 60 : floorMod.id === 'moon' || cheats.bouncy ? 11 : 25) * dt;
    if (player.wallT > 0) player.vel.y = Math.max(player.vel.y, -1.5);
    // glider: hold jump while falling (after pressing jump in the air)
    const glideFall = AB(player.ab, 'glide', 'fall');
    player.gliding = !!glideFall && !player.onGround && !player.grap && !player.slamming && player.wallT <= 0 && keys.Space && player.airPress && player.vel.y < 0 && p.y > gBelow + 1.2;
    if (player.gliding) { player.vel.y = Math.max(player.vel.y, -glideFall); if ((player.glideSnd = (player.glideSnd || 0) - dt) <= 0) { player.glideSnd = .5; SND.wallrun(); } }
    // at combo speeds one frame can cover more than half a metre, so the move is split into small steps, each checked
    // against walls: otherwise you could zip straight through a thin one
    const stepN = Math.min(16, Math.max(1, Math.ceil(Math.hypot(player.vel.x, player.vel.z) * dt / .22)));
    for (let i = 0; i < stepN; i++) { p.x += player.vel.x * dt / stepN; p.z += player.vel.z * dt / stepN; if (i < stepN - 1) resolveCircle(p, .42, p.y, player.onGround ? .36 : .5, p.y + player.eyeH + .12); }
    p.y += player.vel.y * dt;
  }
  player.crouch += ((player.crouchOn || sliding ? 1 : 0) - player.crouch) * Math.min(1, dt * (sliding ? 16 : 10));
  // can't stand up under a low ceiling
  if (!player.crouchOn && ceilingAt(p.x, p.z, .42, p.y) < p.y + 1.85) player.crouch = Math.max(player.crouch, .9);
  player.eyeH = 1.7 - .6 * player.crouch;
  const S = world.size - .6; p.x = clamp(p.x, -S, S); p.z = clamp(p.z, -S, S);
  const wasGround = player.onGround, fallV = player.vel.y;
  if (!player.mantle && !adm.fly) {
    const headY = p.y + player.eyeH + .12;
    resolveCircle(p, .42, p.y, player.onGround ? .36 : .5, headY);
    const ceil = ceilingAt(p.x, p.z, .42, p.y);
    if (headY > ceil && player.vel.y > 0) { player.vel.y = 0; p.y = Math.min(p.y, ceil - player.eyeH - .12); } // bonk
    const g = groundAt(p.x, p.z, .42, p.y, player.onGround ? .36 : .5);
    if (p.y <= g) {
      if (player.onGround && g - p.y > .02) player.camOff -= g - p.y; // smooth stair steps
      p.y = g; player.vel.y = 0; player.onGround = true;
    } else player.onGround = p.y - g < .02;
    if (player.onGround) { player.wallBudget = 1.4; player.lastWall = 0; player.wallT = 0; player.jumpsLeft = AB(player.ab, 'djump', 'jumps') || 0; player.airPress = false; }
    if (player.onGround && player.slamming) landSlam(p);
    else if (player.onGround && !wasGround && (player.slideBuf > 0 || (keys.KeyC && fallV < -6)) && Math.hypot(player.vel.x, player.vel.z) > 3 && player.slideCd <= 0) {
      // LANDING SLIDE: hold (or tap) crouch as you land and the fall turns into a slide instead of a thud
      const hs = Math.hypot(player.vel.x, player.vel.z), sp = Math.min(19 * comboMul(), Math.max(hs, 7) * 1.25 + Math.min(6, -fallV * .3));
      player.slideDir = new V3(player.vel.x, 0, player.vel.z).normalize(); player.vel.x = player.slideDir.x * sp; player.vel.z = player.slideDir.z * sp;
      player.slideT = slippery() ? 1.6 : .9; player.slideCd = .8; player.crouchOn = true; player.slideBuf = 0; SND.slide(); player.landDip = .05; moveCombo('LANDING SLIDE');
    }
    else if (player.onGround && !wasGround && fallV < -5) { SND.land(Math.min(1, -fallV / 16)); player.landDip = Math.min(.12, -fallV * .006); }
  }
  player.camOff *= Math.exp(-dt * 14); player.landDip *= Math.exp(-dt * 8);
  // jump pads launch you up onto rooftops
  if (player.onGround) for (const pad of world.pads) if (Math.hypot(p.x - pad.x, p.z - pad.z) < pad.r * 1.15 && p.y < .3) {
    // straight up onto the roof, plus a push in the direction you were running
    const hs = Math.hypot(player.vel.x, player.vel.z); if (hs > 2) { const k = Math.min(16, hs * 1.6) / hs; player.vel.x *= k; player.vel.z *= k; }
    player.vel.y = 16; player.onGround = false; SND.pad(); sparks(new V3(pad.x, .2, pad.z), 0x4fd1c5, 14, 6); flashLight(new V3(pad.x, .6, pad.z), 0x4fd1c5, 6, 6, .2); break;
  }
  // lean: Q / E tilt and shift your head sideways to peek, without poking through walls
  const leanT = (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0);
  player.lean += (leanT - player.lean) * Math.min(1, dt * 9);
  let leanOff = player.lean * .42;
  if (leanOff) {
    const sd = right.clone().multiplyScalar(Math.sign(leanOff)), eye = new V3(p.x, p.y + player.eyeH, p.z);
    for (let d = Math.abs(leanOff); d > 0; d -= .05) { if (!insideSolid(eye.clone().addScaledVector(sd, d + .15))) { leanOff = Math.sign(leanOff) * d; break; } if (d <= .05) leanOff = 0; }
  }
  // footsteps: everyone hears sprinting nearby; walking and crouching are quiet
  const hsp = Math.hypot(player.vel.x, player.vel.z);
  if (player.onGround && hsp > 2 && !sliding) {
    player.stepT -= dt;
    if (player.stepT <= 0) {
      player.stepT = player.sprinting ? .3 : player.crouch > .5 ? .6 : .44; SND.step(player.sprinting ? 1 : player.crouch > .5 ? .35 : .65);
      if (player.sprinting) for (const b of bots) if (b.alive && b.pos.distanceTo(p) < 11) b.noise(p, 3, .25);
    }
  }

  // aim down sights / breath
  const canAds = adsHeld && !w.melee && !player.sprinting && player.switchT <= 0 && it.reloadT <= 0 && !player.mantle && !(it.cycleT > 0 && w.modes[it.mode] === 'bolt');
  if (canAds) player.inspectT = 0;
  player.adsT = clamp(player.adsT + (canAds ? 1 : -1) * dt * w.adsSpeed * .7 * (player.cant ? 1.3 : 1), 0, 1);
  const scoped = magnified(w) && player.adsT > .9, moving = hsp > 1;
  const holding = scoped && shift && player.breath > 0 && player.exhale <= 0;
  if (holding) { player.breath -= dt; if (player.breath <= 0) player.exhale = 2.5; } else { player.breath = Math.min(4, player.breath + dt * .8); player.exhale -= dt; }
  swayClock += dt;
  let sx = 0, sy = 0;
  if (scoped) {
    const a = .0055 * (1 - .5 * player.crouch) * (holding ? .12 : 1) * (moving ? 2.5 : 1) * (player.exhale > 0 ? 2 : 1) * (w.zoom < 10 ? 1.3 : 1) * w.sway;
    sx = (Math.sin(swayClock * .9) + .5 * Math.sin(swayClock * 2.1)) * a; sy = (Math.sin(swayClock * 1.3) * .7 + Math.cos(swayClock * .5) * .3) * a;
  }
  player.swayX = sx; player.swayY = sy;
  // recoil recovery & bloom decay
  player.sinceShot += dt;
  if (player.sinceShot > 60 / w.rpm + .06) {
    const r = 1 - Math.exp(-dt * 7 * w.recover), dp = player.recoilDebt * r, dy = player.yawDebt * r;
    player.pitch -= dp; player.recoilDebt -= dp; player.yaw -= dy; player.yawDebt -= dy;
  }
  if (player.sinceShot > .3) player.sprayN = 0;
  if (player.sinceShot > .08) player.bloom *= Math.exp(-dt * 5);
  player.kick *= Math.exp(-dt * 12); player.shake *= Math.exp(-dt * 9);
  const shk = settings.shake ? player.shake : 0, shx = (Math.random() - .5) * shk * .012, shy = (Math.random() - .5) * shk * .012;
  if (adm.aim) aimAssist(dt); // admin: auto-aim
  if (adm.nocd || adm.aura) admTick(dt);
  camera.position.set(p.x, p.y + player.eyeH + player.camOff - player.landDip, p.z).addScaledVector(right, leanOff);
  camera.position.y -= Math.abs(leanOff) * .12;
  const strafe = new V3(player.vel.x, 0, player.vel.z).dot(right) * (player.onGround ? 1 : .5), rollT = -player.lean * .2 - strafe * .0035 * (1 - player.adsT) + (sliding ? .05 : 0) + (player.wallT > 0 ? -player.wallSide * .14 : 0);
  player.roll += (rollT - player.roll) * Math.min(1, dt * 10);
  camera.rotation.set(player.pitch + sy + shy - (player.mantle ? .12 : 0), player.yaw + sx + shx, player.roll + gustRoll);
  player.fovKick *= Math.exp(-dt * 5);
  const sprintFov = (player.sprinting && moving ? 7 : 0) + (sliding ? 9 : 0) + (player.wallT > 0 ? 6 : 0) + player.fovKick + Math.min(14, (comboMul() - 1) * 10) * (1 - player.adsT), targetFov = lerp(settings.fov, player.cant ? Math.max(w.zoom, settings.fov - 14) : w.zoom, player.adsT) + sprintFov;
  camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 14); camera.updateProjectionMatrix();
  $('speed').style.opacity = clamp((hsp - 9) / 8, 0, .9);

  // timers
  if (player.switchT > 0) player.switchT -= dt;
  if (player.inspectT > 0) player.inspectT -= dt;
  if (player.cooking) { player.cookT += dt; if (player.cookT >= 2.5) { player.nades--; player.cooking = false; player.cookT = 0; explode(camera.position.clone(), 6, 150); } }
  handleFire(dt);
  poseView(dt, it, w, hsp, sliding);
}

// ---------- inspecting ----------
// I cycles through four inspects: showcase turn, trick spin, mag check and chamber check. R on a full mag does a mag check.
const INSPECTS = ['showcase', 'spin', 'mag', 'chamber'];
function startInspect(kind) {
  const it = cur(); if (!it || it.reloadT > 0 || player.adsT > .1 || player.switchT > 0 || state !== 'playing') return;
  player.inspectKind = kind ?? ((player.inspectKind ?? -1) + 1) % INSPECTS.length;
  player.inspectT = 2.6; player.insEv = 0;
  const w = it.w, L = levelOf(prog.xp[it.base.id] || 0), skin = skinById(prog.skinOf[it.base.id] || 'factory'), ch = charmById(prog.charmOf[it.base.id]);
  const parts = Object.values(it.att).map(id => attById(id)?.name).filter(Boolean);
  $('inspectCard').innerHTML = `<div class="ic-top"><span class="ic-cat">${w.cat}</span><span class="ic-lv">LV ${L.level}</span></div>
    <b class="ic-name">${w.name}</b>
    <div class="ic-row"><span>Kills this run</span><b>${it.mk}</b></div>
    <div class="ic-row"><span>${INSPECTS[player.inspectKind] === 'mag' ? 'In the mag' : 'Magazine'}</span><b>${it.mag} / ${w.mag} <small>+${it.reserve}</small></b></div>
    <div class="ic-row"><span>Skin</span><b>${skin.name}</b></div>${ch.id !== 'none' ? `<div class="ic-row"><span>Charm</span><b>${ch.icon} ${ch.name}</b></div>` : ''}
    ${w.muts.length ? `<div class="ic-muts">${Object.entries(w.ml).map(([id, l]) => mchip(id, l)).join("")}</div>` : ""}
    ${parts.length ? `<div class="ic-parts">${parts.join(' · ')}</div>` : ''}`;
  SND.inspect?.();
}
// ---------- detailed inspect ----------
// Hold I: the gun comes to the middle of the screen side-on, the mouse turns it any way you like, and a full spec sheet opens.
// Let go of I (or shoot, aim, reload or sprint) to put it away. Tapping I still does the quick inspects above.
let insHold = 0;
const DETAIL_POS = new V3(0, -.01, -.5), MAG_POUCH = new V3(-.06, -.3, .14); // where the left hand goes to grab a fresh mag
const _dq = new THREE.Quaternion(), _de = new THREE.Euler(), _dc = new V3(), _dp = new V3(), _dz = new V3(), _da = new V3(), _dm = new V3(), _db = new V3(), _dy = new V3(), _dr = new V3();
function enterDetail() {
  const it = cur(); if (!it || it.reloadT > 0 || player.adsT > .1 || player.switchT > 0 || state !== 'playing') return;
  player.detail = true; player.inspectT = 0; view.dYaw = 0; view.dPitch = 0; view.dIdle = 0;
  const w = it.w, b = it.base, L = levelOf(prog.xp[b.id] || 0), skin = skinById(prog.skinOf[b.id] || 'factory'), ch = charmById(prog.charmOf[b.id]), T = ttk(w);
  const xpLine = L.need ? `${Math.round(L.into).toLocaleString()} / ${L.need.toLocaleString()} XP to LV ${L.level + 1}` : 'MAX LEVEL';
  const num = (k, v) => `<div><small>${k}</small><b>${v}</b></div>`;
  const fine = fineStats(w).map(([k, v, max, dir]) => { const f = clamp(dir > 0 ? v / max : 1 - v / max, .04, 1); return `<div class="dt-fine"><span>${k}</span><i><b style="width:${Math.round(f * 100)}%"></b></i></div>`; }).join('');
  const slots = Object.entries(it.att).map(([s, id]) => attById(id) ? `<div class="dt-row"><span>${SLOT_NAMES[s] || s}</span><b>${attById(id).name}</b></div>` : '').join('');
  $('inspectDetail').innerHTML = `<div class="dt-top"><span>${w.cat} · ${b.slot === 'secondary' ? 'Sidearm' : b.slot === 'melee' ? 'Melee' : 'Primary'}</span><span class="dt-lv">LV ${L.level}</span></div>
    <h2>${w.name}</h2><div class="dt-xp"><i><b style="width:${L.need ? Math.round(L.into / L.need * 100) : 100}%"></b></i><small>${xpLine}</small></div>
    ${b.desc ? `<p class="dt-desc">${b.desc}</p>` : ''}
    <div class="dt-ttk"><small>TIME TO KILL · 100 HP</small><b>${T.text}</b><span>${T.sub}</span></div>
    <div class="dt-nums">${num('Damage', w.projectile ? w.projectile.dmg : w.pellets > 1 ? `${Math.round(w.dmg)}×${w.pellets}` : Math.round(w.dmg))}${num('Headshot', `×${(w.head || 1).toFixed(1)}`)}${num('RPM', Math.round(w.rpm))}${num('Mag', `${it.mag}/${w.mag}`)}${num('Reserve', it.reserve)}${num('Reload', `${w.reload.toFixed(1)} / ${w.emptyReload.toFixed(1)} s`)}${num('Range', w.projectile ? '—' : `${Math.round(w.range)} m`)}${num('Weight', `${w.wt} kg`)}${num('Modes', w.modes.map(m => m[0].toUpperCase() + m.slice(1)).join(' / '))}</div>
    <div class="dt-h">Overall</div><div class="cbars">${compareBars(w, null)}</div>
    <div class="dt-h">Handling</div>${fine}
    <div class="dt-h">Build</div>${slots || '<div class="dt-row"><span>Attachments</span><b>None</b></div>'}
    <div class="dt-row"><span>Skin</span><b style="color:${TIER_COL[skin.tier] || 'inherit'}">${skin.name} <small>${skin.tier || ''}</small></b></div>
    ${ch.id !== 'none' ? `<div class="dt-row"><span>Charm</span><b>${ch.icon} ${ch.name}</b></div>` : ''}
    <div class="dt-row"><span>Kills this run</span><b>${it.mk}</b></div>
    ${w.muts.length ? `<div class="dt-h">Mutations</div><div class="ic-muts">${Object.entries(w.ml).map(([id, l]) => mchip(id, l)).join('')}</div>` : ''}
    <p class="dt-hint">Move the mouse to turn it · let go of ${keyLabel('inspect')} to put it away</p>`;
  $('inspectDetail').classList.add('on'); $('hud').classList.add('inspecting'); SND.inspect?.(); SND.whoosh();
}
function endDetail() {
  if (!player.detail) return;
  player.detail = false; $('inspectDetail').classList.remove('on'); $('hud').classList.remove('inspecting'); SND.click();
}
// sounds at set moments of each inspect
const INS_SOUNDS = { spin: [[.5, () => SND.whoosh()], [1.25, () => SND.click()]], mag: [[.5, () => SND.magOut()], [1.75, () => SND.magIn()]], chamber: [[.7, () => SND.boltBack?.() || SND.click()], [1.25, () => SND.boltFwd?.() || SND.magIn()]], showcase: [[.2, () => SND.whoosh()]] };
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const bump = (ph, a, b, ramp = .25) => Math.min(smooth((ph - a) / ramp), smooth((b - ph) / ramp));
// Dual pistols. Each gun turns around its own grip:
//  - firing: the gun that fired snaps up and rolls outward, its slide blows back
//  - drawing: both guns spin backwards into your hands, the left one a beat behind
//  - reload: both roll inward, the empty mags fall out, the guns dip down for fresh ones, slap them in, rack the slides if
//    they were empty, then twirl forward to finish
//  - inspect (spin): one twirls forwards and the other backwards
function poseAkimbo(dt, it, sw) {
  const A = view.ak, rp = it.reloadT > 0 ? 1 - it.reloadT / it.reloadTotal : -1, TAU = Math.PI * 2;
  A.kick[0] *= Math.exp(-dt * 13); A.kick[1] *= Math.exp(-dt * 13);
  const draw = [smooth(sw * 1.25 - .25) * TAU, smooth(sw * 1.6) * TAU]; // right spins first, left finishes last
  let roll = 0, dip = 0, drop = -1, seat = 0, slapK = 0, rackK = 0, fin = [0, 0];
  if (rp >= 0) {
    roll = bump(rp, 0, .7, .1); dip = bump(rp, .14, .66, .12);
    if (rp < .36) drop = rp / .36;                                     // old mags slide out and fall
    else if (rp < .74) seat = 1 - smooth((rp - .5) / .24);              // new mags rise into the grips
    slapK = bump(rp, .72, .8, .03);
    if (it.wasEmpty) rackK = bump(rp, .82, .92, .03);
    else fin = [smooth((rp - .8) / .2) * TAU, smooth((rp - .85) / .15) * -TAU];
  }
  for (let s = 0; s < 2; s++) {
    const P = s ? A.L : A.R, sg = s ? -1 : 1, kk = A.kick[s];
    P.rotation.set(kk * .32 + draw[s] + fin[s] + view.insR * sg - dip * 1.1 + slapK * .25, sg * kk * .05, sg * (roll * .75 + kk * .12));
    P.position.y = (s ? A.gripL.y : view.grip.y) - dip * .1 + kk * .008; P.position.z = (s ? A.gripL.z : view.grip.z) + kk * .03;
    // slide: blows back on each shot, locks open on an empty mag, racked by hand after an empty reload
    const sl = A.slide[s];
    if (sl) { A.sz[s] = it.mag === 0 && it.reloadT <= 0 ? .022 : A.sz[s] * Math.exp(-dt * 28); sl.position.z = Math.max(A.sz[s], rackK * .022); }
    const m = A.mag[s];
    if (m) {
      if (drop >= 0) { const f = drop; m.position.set(-sg * .01 * f, -(.06 * f + .5 * f * f), .02 * f); m.rotation.set(-f * 1.6, 0, sg * f * .8); m.visible = f < .9; }
      else { m.position.set(0, -seat * .12, 0); m.rotation.set(seat * .3, 0, 0); m.visible = true; }
    }
  }
}
// ---------- keyframed reload events ----------
const ZERO6 = [0, 0, 0, 0, 0, 0], _wf = new V3(), _hq = new THREE.Quaternion(), _he = new THREE.Euler();
function reloadEvents(evs, it) {
  for (const e of evs) {
    if (e === 'release') SND.magOut();
    else if (e === 'drop') spawnMag();
    else if (e === 'pouch') SND.pouch();
    else if (e === 'magIn') { if (view.fam === 'break') { SND.shellIn(); setTimeout(SND.shellIn, 110); } else SND.magIn(); it.magInDone = true; }
    else if (e === 'tap') SND.tap();
    else if (e === 'rack') { it.rackDone = true; if (view.fam === 'bolt') SND.bolt(); else SND.chargeH(); }
    else if (e === 'cylOut') SND.chargeH();
    else if (e === 'eject') ejectAll();
    else if (e === 'spin') { view.cylT = (view.cyl?.rotation.z || 0) + Math.PI * 4; for (let i = 0; i < 5; i++) setTimeout(SND.tap, i * 60); }
    else if (e === 'pump') { view.pumpRack = .5; SND.pump(); }
  }
}
function startFlourish(kind) { if (!view?.fam) return; view.flKind = kind; view.flT = 0; view.lastFl = -1; }
// the empty mag leaves the gun where it is on screen and falls into the world
const MAG_KEEP = { potato: 3, low: 6, medium: 10, high: 14, ultra: 20, superultra: 30 };
function spawnMag() {
  if (!view?.magG || !view.magMid) return;
  view.group.updateMatrixWorld(true); view.magG.updateMatrix();
  const mid = view.magMid.clone().applyMatrix4(view.magG.matrix), pos = toWorld(mid);
  const q = camera.quaternion.clone().multiply(view.group.quaternion).multiply(view.magG.quaternion);
  const vel = new V3(-.35, -1.1, .1).applyQuaternion(camera.quaternion).add(player.vel.clone().multiplyScalar(.9));
  dropMag(scene, view.magG, pos, q, vel, MAG_KEEP[quality.level] ?? 14);
}
// revolvers dump all six cases; break-action shotguns pop their two hulls
function ejectAll() {
  const at = toWorld((view.mag || new V3()).clone()), n = view.fam === 'revolver' ? 6 : 2, up = new V3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const v = view.fam === 'break' ? new V3(rand(-.4, .4), rand(1.6, 2.4), 0).add(new V3(0, 0, 1.2).applyQuaternion(camera.quaternion)) : new V3(rand(-.3, .3), rand(-.6, -.2), rand(-.3, .3));
    shell(at.clone().addScaledVector(up, rand(-.01, .01)), v.add(player.vel.clone().multiplyScalar(.8)), view.fam === 'break' ? 0xd6453d : 0xd4a73a, view.fam === 'break' ? 'hull' : 'pistol');
  }
}
const magFloor = (x, z, y) => groundAt(x, z, .05, y, .05);
// ---------- view model pose and moving parts ----------
function poseView(dt, it, w, speed, sliding) {
  if (player.onGround && speed > 1) player.bob += dt * speed * (player.sprinting ? 1.25 : 1.5);
  const bobA = (1 - player.adsT * .9) * Math.min(speed / 7, 1.4) * settings.bob;
  const hip = view.pistol ? HIP_PISTOL : HIP, adsPos = view.ads;
  // magazine reloads: the gun tilts so you can see the mag well, the old mag drops out, your left hand fetches a new one
  // from the pouch and slaps it in, then racks it if it was empty. Shell-by-shell reloads keep the simple dip.
  // Guns with a keyframed reload (see vmanim) get it here; the rest (launchers, railguns, miniguns) keep a simple dip.
  const rprog = it.reloadT > 0 ? 1 - it.reloadT / it.reloadTotal : -1, evs = [];
  let RA = view.ak ? null : reloadPose(view, it, rprog, evs);
  // flourishes: the first time you draw each gun in a run, and fidgets when you stand idle (see vmanim FLOURISH)
  const busy = trigger || adsHeld || it.reloadT > 0 || player.sprinting || player.inspectT > 0 || player.detail || state !== 'playing';
  if (player.switchT <= 0 && view.wantDraw && !busy) { view.wantDraw = false; startFlourish('draw'); }
  view.idleT = !busy && speed < .3 && Math.abs(mouseDX) + Math.abs(mouseDY) < 2 && player.switchT <= 0 ? (view.idleT || 0) + dt : 0;
  if (view.idleT > 9 && !view.flKind) { view.idleT = -6; startFlourish(Math.random() < .55 ? 'wrist' : 'mag'); }
  if (view.flKind) {
    if (busy || player.switchT > 0) view.flKind = null;
    else { view.flT += dt; const u = view.flT / FLOURISH[view.flKind]; if (u >= 1) view.flKind = null; else if (!RA) RA = flourishPose(view, view.flKind, u, evs); }
  }
  if (evs.length) reloadEvents(evs, it);
  const rl = it.reloadT > 0 && !RA && !view.ak ? Math.sin(rprog * Math.PI) * (it.shellMode ? .4 : 1) : 0;
  const tilt = 0, slap = 0, rRack = 0;
  // hold-to-inspect: count the hold, then blend into the detailed pose
  if (insHold > 0 && !player.detail && (insHold += dt) > .32) { insHold = 0; enterDetail(); }
  if (player.detail && (trigger || adsHeld || it.reloadT > 0 || player.switchT > 0 || player.sprinting || state !== 'playing')) endDetail();
  view.detT = lerp(view.detT || 0, player.detail ? 1 : 0, Math.min(1, dt * 9));
  const sw = player.switchT > 0 ? player.switchT / Math.max(w.draw, .2) : 0;
  const cyc = it.cycleT > 0 && w.cycle ? Math.sin((1 - it.cycleT / w.cycle) * Math.PI) : 0;
  const mant = player.mantle ? Math.sin(Math.min(1, player.mantle.t) * Math.PI) : 0;
  player.lagX = lerp(player.lagX, clamp(mouseDX * .0009, -.05, .05), Math.min(1, dt * 10)); const mdx = mouseDX; mouseDX = 0;
  const sp = player.sprinting || player.wallT > 0 ? 1 : 0, sl = sliding ? 1 : 0;
  // inspect animations
  const ph = 2.6 - player.inspectT, ins = player.inspectT > 0, env = ins ? Math.min(1, ph / .4, player.inspectT / .4) : 0, kind = INSPECTS[player.inspectKind] || 'showcase';
  let tY = 0, tZ = 0, magPeek = 0, rack = 0; view.insR = 0;
  if (ins) {
    if (kind === 'showcase') { tY = ph < 1.3 ? .9 : -.5; tZ = .35; }
    else if (kind === 'spin') { tY = .45; tZ = .15; view.insR = smooth((ph - .5) / .75) * Math.PI * 2 * (view.pistol ? 2 : 1); }
    else if (kind === 'mag') { tY = .35; tZ = .75; magPeek = bump(ph, .5, 1.75); if (view.cyl) view.cylT = (view.cylBase ?? (view.cylBase = view.cyl.rotation.z)) + smooth((ph - .5) / 1) * Math.PI * 2; }
    else { tY = -.75; tZ = -.25; rack = bump(ph, .7, 1.3, .15); }
    for (const [t, fn] of INS_SOUNDS[kind] || []) if (ph >= t && player.insEv < t) fn();
    player.insEv = ph;
    $('inspectCard').classList.toggle('on', ph > .35 && player.inspectT > .3);
  } else { view.cylBase = null; $('inspectCard').classList.remove('on'); }
  rack = Math.max(rack, rRack);
  view.insY = lerp(view.insY, env * tY, Math.min(1, dt * 8)); view.insZ = lerp(view.insZ, env * tZ, Math.min(1, dt * 8));
  // wobble: the gun hangs on loose springs, so it overshoots and settles. It kicks up when you jump, swings down as you
  // fall, slams down and bounces when you land, leans hard into strafes and drags behind the mouse. Settings > Weapon wobble.
  const wb = view.wob || (view.wob = { y: 0, vy: 0, r: 0, vr: 0, p: 0, vp: 0, w: 0, vw: 0 }), calm = 1 - player.adsT * .7, k = settings.wobble ?? 1;
  const sideV = player.vel.x * Math.cos(player.yaw) - player.vel.z * Math.sin(player.yaw);
  player.lagY = lerp(player.lagY || 0, clamp(mouseDY * .0009, -.05, .05), Math.min(1, dt * 10));
  const spring = (v, vk, target, stiff, damp) => { wb[vk] += (target - wb[v]) * stiff * dt; wb[vk] *= Math.exp(-damp * dt); wb[v] += wb[vk] * dt; };
  const air = !player.onGround && !player.mantle && player.wallT <= 0;
  spring('y', 'vy', air ? clamp(player.vel.y * .011, -.09, .1) : 0, 75, 6.5);
  spring('r', 'vr', clamp(-sideV * .028, -.22, .22), 60, 7);
  spring('p', 'vp', clamp(mouseDY * .004, -.14, .14) + (air ? clamp(player.vel.y * .018, -.16, .18) : 0), 70, 7);
  spring('w', 'vw', clamp(mdx * .004, -.16, .16), 70, 7); mouseDY = 0;
  // take-off and landing kicks (landing scales with how hard you hit the ground)
  if (player.onGround !== view.wasGround) {
    if (player.onGround) { const hit = clamp(-(view.lastVy || 0) / 10, .4, 2); wb.vy -= 1.5 * hit; wb.vp -= 3.2 * hit; wb.vr += (Math.random() - .5) * 1.2 * hit; }
    else if (player.vel.y > 2) { wb.vy += 1.1; wb.vp += 2.6; }
    view.wasGround = player.onGround;
  }
  view.lastVy = player.vel.y;
  // tilted aim (like TTK test): hold the gun on its side while aiming, for a quick, wider sight picture
  view.cantT = lerp(view.cantT || 0, player.cant && player.adsT > .05 && !player.sprinting ? 1 : 0, Math.min(1, dt * 12));
  const cant = smooth(view.cantT) * player.adsT;
  const gp = view.group.position;
  gp.lerpVectors(hip, adsPos, player.adsT);
  gp.x += Math.cos(player.bob) * .012 * bobA - player.lagX * (1 - player.adsT * .8) + sp * -.06 - Math.abs(view.insY) * .08 - tilt * .04 + cant * .034 + (wb.r * .12 - wb.w * .1) * calm * k;
  gp.y += Math.abs(Math.sin(player.bob)) * .016 * bobA - rl * .14 - sw * .3 - sp * .05 + player.kick * .012 * (1 - player.adsT * .6) - mant * .25 - sl * .03 + view.insZ * .08 - player.landDip * .5 + tilt * .03 + slap * .018 + cant * .012 + wb.y * calm * k;
  gp.z += player.kick * .045 * (1 - player.adsT * .5) + tilt * .03;
  // keep the sights level while aiming, so the pistol doesn't tilt across your view
  const steady = 1 - player.adsT * .85;
  view.group.rotation.set((player.kick * .06 - cyc * .15) * steady - rl * .7 - sw * .8 + sp * -.25 - mant * .6 + (view.pistol && !view.ak ? -view.insR : 0) + tilt * .22 + slap * .08 + rRack * .06 + wb.p * calm * k,
    player.lagX * 2 * steady + sp * .5 + view.insY + tilt * .3 + wb.w * calm * k, rl * .35 + sp * .2 + cyc * .25 * steady + view.insZ + sl * .3 + (view.pistol ? 0 : view.insR) - tilt * .55 + cant * .8 + wb.r * calm * k);
  // extra life: slow breathing when you stand still, a swinging run cycle when sprinting, a flinch when you click on an
  // empty gun, the gun swinging away from a dash, and the last bullet of a mag kicking harder
  const tb = performance.now() / 1000, runA = sp * (1 - player.adsT), rb = player.bob;
  view.breath = lerp(view.breath || 0, player.onGround && speed < .5 ? 1 - player.adsT * .8 : 0, Math.min(1, dt * 3));
  view.dryT = Math.max(0, (view.dryT || 0) - dt); const dry = view.dryT > 0 ? Math.sin((1 - view.dryT / .22) * Math.PI) : 0;
  view.lastT = Math.max(0, (view.lastT || 0) - dt); const last = view.lastT > 0 ? Math.sin((1 - view.lastT / .35) * Math.PI) : 0;
  const dash = (player.sinceDash ?? 9) < .3 ? Math.sin(player.sinceDash / .3 * Math.PI) : 0;
  if (player.sinceDash === 0) view.dashDir = Math.sign(sideV) || 0;
  gp.x += Math.sin(rb) * .026 * runA + dash * (view.dashDir || 0) * -.05;
  gp.y += Math.sin(tb * 1.4) * .0025 * view.breath - Math.abs(Math.cos(rb)) * .02 * runA - dash * .025 + last * .012;
  gp.z += dry * .012 + dash * .04 + last * .02;
  const R = view.group.rotation;
  R.x += Math.sin(tb * 1.4 + 1) * .006 * view.breath - dry * .06 - dash * .12 + last * .14 * steady;
  R.y += Math.sin(rb) * .08 * runA;
  R.z += Math.cos(rb) * .11 * runA + Math.sin(tb * .7) * .008 * view.breath + dash * (view.dashDir || 0) * .35;
  // keyframed reload moves, eased so they blend in and out of everything above
  { const ga = view.raG, tg = RA ? RA.g : ZERO6, kk = 1 - Math.exp(-dt * (RA ? 30 : 10)); for (let i = 0; i < 6; i++) ga[i] += (tg[i] - ga[i]) * kk;
    gp.x += ga[0]; gp.y += ga[1]; gp.z += ga[2]; R.x += ga[3]; R.y += ga[4]; R.z += ga[5]; }
  // sprinting with a pistol: held at high ready, muzzle up by your chest
  if (view.pistol && !view.ak) { const s = sp * (1 - player.adsT); gp.x += s * .04; gp.y += s * .07; gp.z += s * .02; R.x += s * .95; R.y -= s * .4; R.z -= s * .15; }
  // fire mode switch: a quick tilt as your thumb works the selector
  if (view.modeT > 0) { view.modeT = Math.max(0, view.modeT - dt); const f = Math.sin((1 - view.modeT / .28) * Math.PI); R.z -= f * .09; R.y += f * .03; gp.y += f * .006; }
  // up against a wall: the gun tucks back and tips up (checked a few times a second)
  if ((view.wallN = (view.wallN || 0) + 1) % 4 === 0) { const d = rayWall(camera.position, _wf.set(0, 0, -1).applyQuaternion(camera.quaternion), 1)?.d ?? 9; view.wallTgt = clamp((.95 - d) / .5, 0, 1) * (1 - player.adsT); }
  view.wallK = lerp(view.wallK || 0, view.wallTgt || 0, Math.min(1, dt * 8)); if (view.wallK > .001) { gp.z += view.wallK * .07; gp.y -= view.wallK * .02; R.x += view.wallK * .55; R.z += view.wallK * .15; }
  // melee swings, played from keyframes (see SWINGS): the arm moves and turns, and the wrist turns the blade, so side
  // slashes go flat across the screen, overheads come down from above, upswings rise from low, and stabs thrust ahead
  if (view.inner) {
    const B = view.innerBase, P = view.swingT > 0 ? swingPose(SWINGS[view.swingKind] || SWINGS.rl, 1 - (view.swingT = Math.max(0, view.swingT - dt)) / view.swingDur) : null;
    if (P) {
      const big = view.oneHand ? 1 : 1.25, wr = view.oneHand ? 1 : .35; // two hands on the handle: the arms do the turning, not the wrist
      gp.x += P[0] * big; gp.y += P[1] * big; gp.z += P[2] * big;
      R.x += P[3] * big; R.y += P[4] * big; R.z += P[5] * big;
      view.inner.rotation.set(B.x + P[6] * wr, B.y + P[7] * wr, B.z + P[8] * wr);
    } else view.inner.rotation.copy(B);
  }
  // detailed inspect: side-on in the middle of the screen, turned by the mouse (and slowly by itself if you leave it)
  if (view.detT > .001) {
    if (player.detail && (view.dIdle = (view.dIdle || 0) + dt) > 1.5) view.dYaw += dt * .45;
    const e = smooth(view.detT), qd = _dq.setFromEuler(_de.set(view.dPitch || 0, Math.PI / 2 + (view.dYaw || 0), 0, 'YXZ'));
    const c = _dc.set(0, view.boreY ?? 0, ((view.muzzleZ ?? -.5) + (view.back ?? .1)) / 2).applyQuaternion(qd);
    view.group.quaternion.slerp(qd, e); gp.lerp(_dp.copy(DETAIL_POS).sub(c), e);
  }
  if (view.armsG) view.armsG.visible = view.detT < .5;
  view.group.visible = !(magnified(w) && player.adsT > .9);
  if (view.spinner) view.spinner.rotation.z += dt * 40 * player.spin;
  // pistol slide blows back and locks open on an empty mag
  if (view.slide) { const locked = it.mag === 0 && it.reloadT <= 0; view.slideZ = locked ? .022 : view.slideZ * Math.exp(-dt * 28); view.slide.position.z = Math.max(view.slideZ, rack * .02, RA ? RA.slide * .022 : 0); }
  if (view.cyl) view.cyl.rotation.z += (view.cylT - view.cyl.rotation.z) * Math.min(1, dt * 18);
  if (view.ak) poseAkimbo(dt, it, sw);
  // left hand: follows the reload keys, rides the pump, otherwise rests on the gun; the arm rig bends the elbow to match
  if (view.leftRig) {
    const tgt = _da.copy(RA ? RA.h : view.A.rest); if (!RA && view.pump && view.fam === 'shell') tgt.z += view.pump.position.z;
    const k = 1 - Math.exp(-dt * (RA ? 26 : 13)), hr = view.hrCur, th = RA ? RA.hr : ZERO6;
    view.handCur.lerp(tgt, k); for (let i = 0; i < 3; i++) hr[i] += (th[i] - hr[i]) * k;
    view.leftRig.solve(view.handCur, _hq.setFromEuler(_he.set(hr[0], hr[1], hr[2])));
    if (view.handShell) view.handShell.visible = !!RA && RA.shell > .5;
  }
  // magazine: rides in the left hand during reloads, otherwise sits in the well (or peeks out on the mag inspect)
  if (view.magG) {
    const dir = view.magUp ? 1 : -1, mp = _dm.set(0, 0, 0); let rx = 0, ry = 0, rz = 0, vis = true;
    if (RA) { mp.fromArray(RA.mo); if (RA.mh > 0) mp.lerp(_db.copy(view.handCur).sub(view.A.magBot), RA.mh); rx = RA.mr[0]; ry = RA.mr[1]; rz = RA.mr[2]; vis = RA.mv > .5; }
    else { const off = magPeek * .45; mp.set(0, dir * off * .2, off * .05); rx = -dir * off * .5; }
    // turn the mag around its own middle, not the gun's grip
    view.magG.rotation.set(rx, ry, rz); const mc = view.magMid || _dz;
    view.magG.position.copy(mp).add(mc).sub(_dr.copy(mc).applyEuler(view.magG.rotation)); view.magG.visible = vis;
  }
  if (view.chargeG) view.chargeG.position.z = (RA ? RA.charge : 0) * .07;
  if (view.cyl) { view.cyl.position.x = -(RA ? RA.cyl : 0) * .034; }
  // bolt: lift, pull back, push forward, lock down
  if (view.bolt) {
    const c = it.cycleT > 0 && w.cycle ? 1 - it.cycleT / w.cycle : 0;
    const up = c <= 0 ? 0 : c < .2 ? c / .2 : c < .8 ? 1 : (1 - c) / .2, back = c < .2 ? 0 : c < .5 ? (c - .2) / .3 : c < .8 ? 1 - (c - .5) / .3 : 0;
    view.bolt.rotation.z = Math.max(up, rack, RA ? RA.boltU : 0) * 1.1; view.bolt.position.z = Math.max(back, rack * .6, RA ? RA.boltB : 0) * .07;
  }
  if (view.pump) { // pumped after every shot, and racked once more after a shell reload
    const c = it.cycleT > 0 && w.cycle ? 1 - it.cycleT / w.cycle : 0; view.pumpRack = Math.max(0, (view.pumpRack || 0) - dt); const pr = view.pumpRack > 0 ? Math.sin((1 - view.pumpRack / .5) * Math.PI) : 0;
    view.pump.position.z = Math.max(c > 0 ? Math.sin(Math.min(1, c * 1.4) * Math.PI) * .075 : 0, (rack + magPeek * .6) * .05, pr * .075); }
  gunFlash.intensity *= Math.exp(-dt * 40);
  view.group.updateMatrixWorld(); updateCharm(view.charm, dt, player.lagX, player.kick);
  if (view.laser) {
    const lz = it.lz || {}, LV = LASER_LV[lz.lv || 0], C = laserCol(lz.col);
    const on = player.adsT < .4 && !player.sprinting && player.switchT <= 0 && view.group.visible && !player.detail;
    view.laser.visible = on || !!player.detail; laserDot.visible = false;
    if (C.rainbow) { _lzc.setHSL((performance.now() / 1600) % 1, 1, .58); view.laser.material.color.copy(_lzc); laserDot.material.color.copy(_lzc).multiplyScalar(4); }
    if (on) {
      const from = toWorld(view.laserFrom.clone()), dir = new V3(0, 0, -1).applyQuaternion(camera.quaternion), R = LV.range;
      raycaster.set(from, dir); raycaster.far = R;
      const wl = rayWall(from, dir, R); raycaster.far = wl ? wl.d : R;
      const hit = raycaster.intersectObjects(bots.filter(b => b.alive).map(b => b.group), true).find(h => h.object.isMesh && !h.object.userData.ui) || wl;
      if (hit) { laserDot.position.copy(hit.point); laserDot.scale.setScalar(.7 + Math.min(1.6, (hit.distance ?? hit.d) / R * 2)); laserDot.visible = true; }
    }
  } else laserDot.visible = false;
}
const _lzc = new THREE.Color();
// laser colour and beam length come from that gun's laser upgrades
function fitLaser(it) {
  if (!view?.laser) return;
  const lz = it.lz || {}, LV = LASER_LV[lz.lv || 0], C = laserCol(lz.col), a = view.laserFrom;
  view.laser.geometry.setFromPoints([a.clone(), a.clone().add(new V3(0, 0, -LV.beam))]);
  view.laser.material.color.set(C.col); view.laser.material.opacity = .42 + (lz.lv || 0) * .08;
  laserDot.material.color.set(C.col).multiplyScalar(4);
}
function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const k = pickups[i]; k.t += dt; k.mesh.rotation.y += dt * 2; k.mesh.position.y = .8 + Math.sin(k.t * 3) * .15;
    const near = Math.hypot(k.mesh.position.x - player.pos.x, k.mesh.position.z - player.pos.z) < 1.4 && Math.abs(k.mesh.position.y - player.pos.y - .8) < 1.5;
    let take = false;
    if (near && k.kind === 'hp' && player.hp < player.maxHp) { player.hp = Math.min(player.maxHp, player.hp + 30); take = true; }
    if (near && k.kind === 'ammo') { ['primary', 'secondary'].forEach(s => { const it = player.slots[s]; if (it) it.reserve = Math.min(it.w.reserve, it.reserve + it.w.mag); }); take = true; }
    if (take) { SND.pickup(); scene.remove(k.mesh); pickups.splice(i, 1); }
    else if (k.t > 30) { scene.remove(k.mesh); pickups.splice(i, 1); }
  }
}

// ---------- waves ----------
// Enemy mix by wave: [type, first wave it appears, weight]
const ROSTER = [['scout', 1, 3], ['grunt', 1, 4], ['brawler', 2, 2], ['drone', 3, 2], ['sniper', 3, 1], ['heavy', 4, 1.5], ['medic', 4, 1], ['bomber', 4, 1.2], ['shield', 6, 1.2]].concat(SPAWN_EXTRA);
// ---------- adaptive bots ----------
// Bots adapt to how you play, both ways. Their skill (0 to 1) drives everything: reaction time, aim, leading your
// movement, aiming for your head, how fast their shots fly, AD-strafe spam, stopping to shoot, crouch-peeking.
// Every 15 seconds the game scores how that stretch went: accuracy, kills per minute and how much damage you took.
// Doing well pushes them up (at the top they play like CS2 sweats); struggling brings them back down. On top of that,
// when you nearly die or go down, they ease off for a while ("mercy") so you can get back on your feet.
// Each floor still sets a gentle minimum, so deep floors never turn into a walkover.
// Floors 3, 6, 9... are Rampage floors: crowds of weak bots, bottomless ammo and +50% damage. Easy, satisfying killing.
const isRampage = fl => fl % 3 === 0 && fl % 10 !== 0;
const SKILL = { easy: { start: 0, cap: .62, rate: .7 }, normal: { start: .06, cap: .9, rate: 1 }, hard: { start: .2, cap: 1, rate: 1.3 } };
const TIERS = [[0, 'Rookie', '#8d8676'], [.14, 'Bronze', '#b5734a'], [.28, 'Silver', '#9aa3ad'], [.42, 'Gold', '#d4a73a'], [.56, 'Platinum', '#4fd1c5'], [.7, 'Diamond', '#5b8fd6'], [.84, 'Elite', '#ff4fd8'], [.95, 'Sweat', '#d6453d']];
const tierOf = s => { let t = TIERS[0]; for (const x of TIERS) if (s >= x[0]) t = x; return t; };
const skill = { target: .06, eff: .06, mercy: 0, tier: 'Rookie', win: null, form: 0 };
const newWin = () => ({ t: 0, shots: 0, hits: 0, kills: 0, heads: 0, dmg: 0 });
const lerpS = (a, b) => a + (b - a) * skill.eff;
function resetSkill(start) { const S = SKILL[diffKey] || SKILL.normal; skill.target = skill.eff = start ?? S.start; skill.mercy = 0; skill.form = 0; skill.win = newWin(); skill.tier = tierOf(skill.eff)[1]; }
const floorMin = (S, fl) => Math.min(S.cap - .2, S.start + (fl - 1) * .025);
// what you do feeds the current 15-second window
function skillEvent(kind, v = 0) {
  if (state !== 'playing' || diff.rampage) return;
  const W = skill.win || (skill.win = newWin());
  if (kind === 'kill') { W.kills++; if (v) W.heads++; }                         // v = headshot
  else if (kind === 'hurt') {                                                    // v = damage taken
    W.dmg += v;
    if (player.hp > 0 && player.hp < player.maxHp * .25) skill.mercy = Math.max(skill.mercy, .12); // nearly dead: ease off
  }
  else if (kind === 'shot') { W.shots++; if (v) W.hits++; }
  else if (kind === 'down') skill.mercy = Math.max(skill.mercy, .25);            // went down or died: ease off a lot
}
// score one window: about +1 for a great stretch, -1 for a rough one
function judgeWindow(W) {
  const min = W.t / 60, acc = W.shots >= 8 ? W.hits / W.shots : .3, kpm = W.kills / min, hurtPm = W.dmg / player.maxHp / min;
  let s = (acc - .3) * 2.2 + (kpm - 4) * .09 + (W.heads / Math.max(1, W.kills) - .25) * .5 - (hurtPm - .7) * .45;
  if (W.kills === 0 && W.shots === 0) s = Math.min(s, 0); // hiding or walking around doesn't count as doing well
  return clamp(s, -1, 1);
}
function updateSkill(dt) {
  const S = SKILL[diffKey] || SKILL.normal, fl = floorN, fighting = state === 'playing' && !diff.rampage && bots.some(b => b.alive);
  if (fighting) {
    skill.target += .00012 * S.rate * dt;                                        // always slowly learning
    const W = skill.win || (skill.win = newWin());
    if ((W.t += dt) >= 15) {
      const sc = judgeWindow(W); skill.form = skill.form * .5 + sc * .5;          // "form" smooths out one lucky or unlucky window
      skill.target += skill.form * (skill.form > 0 ? .022 * S.rate : .03);       // drops a little faster than it climbs
      skill.win = newWin();
    }
  }
  skill.target = clamp(skill.target, floorMin(S, fl), S.cap);
  skill.mercy = Math.max(0, skill.mercy - dt * .008);                            // mercy wears off over about 15-30 seconds
  skill.eff += (skill.target - skill.eff) * Math.min(1, dt * .25);
  const s = diff.rampage ? 0 : floorMod.id === 'sweat' ? 1 : Math.max(0, skill.eff - skill.mercy), base = DIFF[diffKey] || DIFF.normal;
  if (state === 'playing' && skill.eff >= .95) life('sweat', 1, true);
  Object.assign(diff, {
    skill: s,
    react: diff.rampage ? 2.2 : 1.55 - s * 1.3,                  // 1.55× slower → 0.25× (≈0.1 s at max)
    acc: diff.rampage ? .4 : base.acc * (.7 + s * .62),
    dmg: diff.rampage ? base.dmg * .3 : base.dmg * (1 + (fl - 1) * .035),
    lead: s < .25 ? 0 : (s - .25) / .75,                        // how well they lead your movement
    head: s < .4 ? 0 : (s - .4) / .6 * .55,                     // share of shots aimed at your head
    boltSpeed: 1 + s * 1.5,                                     // shots fly up to 2.5× faster
    strafe: s,                                                  // AD spam and strafe speed
    fire: 1.25 - s * .6,                                        // time between shots
  });
  const T = tierOf(s);
  if (state === 'playing' && T[1] !== skill.tier && !diff.rampage) {
    const up = s > TIERS.find(x => x[1] === skill.tier)[0];
    skill.tier = T[1];
    if (up) { banner(`BOTS ADAPTED: ${T[1].toUpperCase()}`, s >= .95 ? 'THEY PLAY LIKE SWEATS NOW. GOOD LUCK.' : 'THEY\'VE BEEN WATCHING HOW YOU PLAY'); SND.boss(); }
    else toast('BOTS EASED OFF', T[1].toUpperCase(), skill.mercy > .05 ? 'They\'re giving you a moment to recover' : 'They\'ve noticed it\'s been a rough fight', '🕊');
  }
  const el = $('skillchip');
  if (el) { el.style.setProperty('--sc', T[2]); el.querySelector('b').textContent = diff.rampage ? 'RAMPAGE' : T[1].toUpperCase(); el.querySelector('u').style.width = `${Math.round((diff.rampage ? 0 : s) * 100)}%`; }
}
function applyHeat(n) {
  const fl = floorOf(n), base = DIFF[diffKey] || DIFF.normal;
  diff = ctx.diff = { ...base, rampage: isRampage(fl) };
  updateSkill(0);
}
const rampageOn = () => state === 'playing' && !!diff.rampage;
function pickType(n) {
  const pool = ROSTER.filter(r => n >= r[1]), total = pool.reduce((s, r) => s + r[2], 0);
  let x = Math.random() * total; for (const r of pool) { x -= r[2]; if (x <= 0) return r[0]; } return 'grunt';
}
// Spawns spread across the whole map: away from you, out of your sight, and away from every other bot this wave.
function spawnPoint(taken = []) {
  const sep = clamp(world.size * .3, 16, 45), far = Math.min(40, world.size * .5);
  let best = null, bestScore = -1;
  for (let tries = 0; tries < 160; tries++) {
    const p = openPoint(), dp = p.distanceTo(player.pos);
    if (dp < far) continue;
    if (tries < 110 && lineOfSight(new V3(p.x, 1.6, p.z), camera.position)) continue;
    let near = Infinity; for (const q of taken) near = Math.min(near, p.distanceTo(q));
    if (near >= sep) { best = p; break; }
    if (near > bestScore) { bestScore = near; best = p; }  // fall back to the most isolated spot found
  }
  best = best || openPoint(); taken.push(best);
  return best;
}
// the current door and weather change how bots look and fight (used for new waves and when a saved run is resumed)
function tuneBot(b) {
  const M = floorMod.id, X = WX_FX[weather];
  if (M === 'over') b.t.speed *= 1.35; if (M === 'heads' && b.head) b.head.scale.multiplyScalar(1.9);
  if (X?.botSpeed) b.t.speed *= X.botSpeed; if (X?.sight) b.t.view *= X.sight; if (X?.botAcc) b.t.acc *= X.botAcc;
  return b;
}
function spawnWave(n) {
  wave = n; breakT = 0;
  for (const s of ["primary", "secondary"]) if (player.slots[s]) player.slots[s].thirst = 0;
  const fl = floorOf(n), newFloor = fl !== floorN;
  if (newFloor) { enterFloor(fl); const fd = $('fade'); fd.classList.remove('go'); void fd.offsetWidth; fd.classList.add('go'); }
  applyHeat(n);
  const R = diff.rampage, wi = n - (fl - 1) * 5, M = floorMod.id, titan = isTitanFloor(fl) && wi === 5;
  const bossWave = n % 5 === 0 && !R;
  // Rampage: lots of weak grunts and rushers, a giant swarm on the last wave
  let count = R ? Math.min(14 + wi * 5 + (wi === 5 ? 15 : 0), 48) : Math.min(4 + n * 2, 16 + fl * 3) - (bossWave ? 4 : 0);
  // tiny arenas get fewer bots (it's a brawl), huge deserts get a few more spread out
  const sizeK = { tiny: .5, small: .7, medium: 1, large: 1.15, huge: 1.3 }[mapDef.sizeId] || 1; count = Math.max(3, Math.round(count * sizeK));
  // ...but small maps make up for it with tougher bots: more HP, more elites, and harder enemy types waves sooner
  const tough = R ? 1 : { tiny: 1.45, small: 1.2 }[mapDef.sizeId] || 1, ahead = Math.round((tough - 1) * 20);
  let hpMul = R ? .5 : (1 + (fl - 1) * .08) * tough;
  if (titan) count = 6;
  if (M === 'swarm') { count = Math.min(count * 2, 60); hpMul *= .5; }
  if (M === 'hard') hpMul *= 1.7;
  // co-op: more players, more and tougher bots
  const team = coop?.role === 'host' ? mates.length : 0; if (team && !titan) { count = Math.min(Math.round(count * (1 + .55 * team)), 60); hpMul *= 1 + .2 * team; }
  const eliteP = R ? 0 : Math.min((n >= 6 ? .04 * (n - 5) + skill.eff * .2 : 0) + (tough - 1) * .5, .6);
  const type = () => R ? (Math.random() < .3 ? 'scout' : Math.random() < .25 ? 'brawler' : 'grunt') : M === 'alley' && Math.random() < .65 ? 'sniper' : titan ? (Math.random() < .5 ? 'drone' : 'grunt') : pickType(n + ahead);
  const taken = []; stragglerT = 0;
  const add = b => { bots.push(tuneBot(b)); return b; };
  for (let i = 0; i < count; i++) add(new Bot(type(), spawnPoint(taken), { elite: Math.random() < eliteP, hpMul }));
  if (titan) { const b = add(new Bot('titan', spawnPoint(taken), { hpMul: 1 + (fl / 10 - 1) * .6 })); b.phase = 1; b.stompT = 6; }
  else if (bossWave) add(new Bot('boss', spawnPoint(taken), { hpMul: (1 + .35 * (n / 5 - 1)) * (1 + (fl - 1) * .08) * (M === 'hard' ? 1.4 : 1) }));
  // bots spawn unaware: they patrol until they see or hear you
  const tag = M !== 'calm' ? ` · ${floorMod.name.toUpperCase()}` : '';
  if (R && newFloor) { banner(`FLOOR ${fl}: RAMPAGE`, `EASY KILLS · BOTTOMLESS AMMO · +50% DAMAGE · ${count} BOTS`); $('hud').classList.add('rampage'); }
  else if (R) banner(wi === 5 ? `WAVE ${n}: THE SWARM` : `RAMPAGE WAVE ${n}`, `${count} BOTS · GO WILD`);
  else if (titan) banner(`WAVE ${n}: THE TITAN`, 'SHOOT THE GLOWING CORE ON ITS CHEST · JUMP OVER ITS STOMPS');
  else if (newFloor) { $('hud').classList.remove('rampage'); banner(isTitanFloor(fl) ? `FLOOR ${fl}: TITAN FLOOR` : `FLOOR ${fl}${tag}`, isRampage(fl - 1) ? `PARTY'S OVER · BOTS: ${skill.tier.toUpperCase()}` : isTitanFloor(fl) ? `SOMETHING HUGE IS WAITING ON WAVE 5 · ${count} BOTS` : mapDef.sizeId === 'tiny' ? `TINY ARENA · NOWHERE TO HIDE · ${count} BOTS` : mapDef.sizeId === 'huge' ? `HUGE DESERT · ${mapDef.size * 2}M ACROSS · BRING A RIFLE` : `${M !== 'calm' ? floorMod.twist.toUpperCase() : mapDef.name.toUpperCase()} · ${count} BOTS`); }
  else banner(bossWave ? `WAVE ${n}: BOSS` : `WAVE ${n}`, bossWave ? 'THE WARDEN IS ON THE FIELD' : `${count} BOTS ON PATROL · SKILL: ${skill.tier.toUpperCase()}${tag}`);
  // night waves: from floor 2, roughly 1 wave in 5 goes pitch black (never rampage or Titan waves)
  nightWave = !R && !titan && fl >= 2 && Math.random() < .2 && !training; applyNight();
  if (nightWave) { const lit = ["primary", "secondary"].some(k => player.slots[k]?.w.torch);
    setTimeout(() => { if (state === "playing" && nightWave) banner("NIGHT WAVE: PITCH BLACK", player.nvg ? `NIGHT VISION: ${keyLabel("nvg")} · OR USE YOUR TAC LIGHT` : lit ? "YOUR TAC LIGHT IS THE ONLY LIGHT" : `YOU CAN'T SEE · BUY A TAC LIGHT ($250) OR NIGHT VISION ($5,000) IN THE SHOP (${keyLabel("shop")})`); }, newFloor ? 2600 : 1400); }
  bossWave || titan ? SND.boss() : SND.wave();
  renderPips(); musicSong(fl);
}
// ---------- the Titan: three phases ----------
function titanPhase(b) {
  if (b.puppet) return; // only the game running the fight calls in backup
  const f = b.hp / b.t.hp, want = f < .33 ? 3 : f < .66 ? 2 : 1;
  if (want <= (b.phase || 1)) return;
  b.phase = want; const taken = [b.pos.clone()];
  if (want === 2) {
    banner('TITAN: PHASE 2', 'IT CALLED FOR BACKUP · IT STOMPS NOW: JUMP!'); b.t.rate *= .7;
    for (let i = 0; i < 5; i++) bots.push(new Bot(i < 3 ? 'drone' : 'bomber', spawnPoint(taken), { hpMul: 1 + floorN * .05 }));
  } else {
    banner('TITAN: PHASE 3', 'ENRAGED · FASTER · STOMPS EVERY FEW SECONDS'); b.t.rate *= .6; b.t.speed *= 1.5;
    for (let i = 0; i < 6; i++) bots.push(new Bot(i < 3 ? 'scout' : i < 5 ? 'bomber' : 'heavy', spawnPoint(taken), { hpMul: 1 + floorN * .05 }));
    b.mats?.[0]?.emissive?.set(0x6b1020);
  }
  SND.boss(); player.shake += 1.5;
}
function updateTitan(dt) {
  for (const b of bots) if (b.alive && b.t.titan && b.phase >= 2) {
    b.stompT = (b.stompT ?? 6) - dt;
    if (b.stompT <= .9 && !b.warned) { b.warned = true; beam(new V3(b.pos.x, 0, b.pos.z), new V3(b.pos.x, 14, b.pos.z), 0xff3b30, 1.2, .9); at3(b.pos, () => SND.boss()); }
    if (b.stompT <= 0) {
      b.warned = false; b.stompT = b.phase >= 3 ? 4.2 : 7;
      const p = new V3(b.pos.x, .2, b.pos.z), R = 13, d = Math.hypot(player.pos.x - p.x, player.pos.z - p.z);
      explosionFx(p, 5); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; smoke(new V3(p.x + Math.cos(a) * 6, .3, p.z + Math.sin(a) * 6), 1, .6, .8); }
      at3(p, () => SND.boom(d)); player.shake += clamp(3 - d / 12, 0, 3);
      // the shockwave rolls along the ground: being in the air dodges it
      if (d < R && player.pos.y - groundAt(player.pos.x, player.pos.z, .42, player.pos.y, .5) < .4) { hurt(38 * (1 - d / R * .5) * diff.dmg, p); player.vel.y = 7; player.vel.x += (player.pos.x - p.x) / Math.max(d, 1) * 9; player.vel.z += (player.pos.z - p.z) / Math.max(d, 1) * 9; }
      for (const m of mates) { const dm = Math.hypot(m.pos.x - p.x, m.pos.z - p.z); if (m.alive && dm < R) m.hurt(38 * (1 - dm / R * .5) * diff.dmg, p, false); } // co-op friends too
    }
  }
}
// ---------- training: a guided first floor ----------
// [what to do, key hint, done check]. Bots only show up at the shooting step, and you can't die here.
const TRAIN = [
  ['Move around', () => `${['fwd', 'left', 'back', 'right'].map(keyLabel).join(' ')} · mouse to look`, t => t.moved > 8],
  ['Jump', () => keyLabel('jump'), () => player.vel.y > 5 && !player.onGround],
  ['Sprint, then slide', () => `hold ${keyLabel('sprint')}, tap ${keyLabel('crouch')}`, () => player.slideT > 0],
  ['Dash', () => `${keyLabel('dash')} (works in the air too)`, () => player.dashT > 0],
  ['Climb onto something', () => `run at a ledge or crate holding ${keyLabel('fwd')} + ${keyLabel('jump')}`, () => !!player.mantle],
  ['Shoot the training bots', () => `${keyLabel('aim')} to aim · ${keyLabel('fire')} to fire · headshots one-tap`, t => t.kills >= 3],
  ['Reload', () => keyLabel('reload'), () => (cur()?.reloadT || 0) > 0],
  ['Throw a frag', () => `${keyLabel('nade')} (hold to cook it)`, () => nades.length > 0],
  ['Open the shop', () => `${keyLabel('shop')}, then ${keyLabel('shop')} again to close it`, t => t.shopped],
];
function startTraining() {
  training = { step: 0, moved: 0, last: player.pos.clone(), kills: 0, shopped: false, doneT: 0, k0: 0 };
  player.cash = 3000; player.nades = 3; wave = 0;
  banner('TRAINING', 'FOLLOW THE CHECKLIST · YOU CAN\'T DIE HERE'); renderTraining();
}
function renderTraining() {
  let el = $('trainbox'); if (!el) { el = document.createElement('div'); el.id = 'trainbox'; $('hud').appendChild(el); }
  if (!training) { el.remove(); return; }
  el.innerHTML = `<div class="tb-h">TRAINING · ${Math.min(training.step, TRAIN.length)}/${TRAIN.length}</div>` + TRAIN.map(([what, how], i) =>
    `<div class="tb-r${i < training.step ? ' done' : i === training.step ? ' cur' : ''}"><i>${i < training.step ? '✓' : i + 1}</i><div><b>${what}</b>${i === training.step ? `<span>${how()}</span>` : ''}</div></div>`).join('');
}
function updateTraining(dt) {
  const t = training; t.moved += player.pos.distanceTo(t.last); t.last.copy(player.pos);
  t.kills = stats.kills - t.k0;
  if (t.step < TRAIN.length && TRAIN[t.step][2](t)) {
    t.step++; SND.code(); renderTraining();
    if (TRAIN[t.step - 1][0].startsWith('Climb')) {   // next up: shooting. Bring in three weak bots in front of you
      t.k0 = stats.kills; const taken = [];
      for (let i = 0; i < 3; i++) { const f = new V3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)), p = player.pos.clone().addScaledVector(f, 16 + i * 4).add(new V3((i - 1) * 5, 0, 0)); taken.push(p); const b = new Bot('grunt', world.nav.free(p.x, p.z) ? p : spawnPoint(taken), { hpMul: .6 }); b.t.dmg *= .3; bots.push(b); }
    }
    if (t.step === TRAIN.length) { banner('TRAINING COMPLETE', 'YOU\'RE READY FOR THE TOWER'); t.doneT = 4; training.fin = true; }
  }
  if (t.fin && (t.doneT -= dt) <= 0) { prog.life.trained = 1; checkAch(); toMenu(); }
}
function renderModChip() {
  const el = $('modchip'); if (!el) return;
  const m = floorMod; el.classList.toggle('on', m.id !== 'calm');
  el.style.setProperty('--c', m.col); el.innerHTML = `<i>${m.icon}</i><b>${m.name}</b><small>${m.cash !== 1 ? `×${m.cash} cash` : ''}</small>`; el.title = m.twist;
}
// ---------- the elevator: pick a door between floors ----------
let doorOpts = [], doorWave = 0, elevPick = i => pickDoor(i), elevN = 0;
function nextWave() {
  const n = wave + 1, fl = floorOf(n);
  if (fl === floorN || training) return spawnWave(n);
  // clearing a floor on a hard modifier counts toward achievements
  if (!player.floorHit && floorN >= 15) life('flawless'); // Not a Scratch
  if (floorMod.id === 'glass') life('glass'); if (floorMod.id === 'sweat') life('sweatfl');
  doorWave = n;
  const special = isTitanFloor(fl) ? { id: 'calm', name: 'Titan Floor', icon: '⚠', col: '#d6453d', twist: 'Something huge waits on wave 5. Its chest core is the weak spot.', cash: 1.5, special: true }
    : isRampage(fl) ? { id: 'calm', name: 'Rampage', icon: '✸', col: '#ff9ecf', twist: 'Weak bots, bottomless ammo, +50% damage. Go wild.', cash: 1, special: true } : null;
  doorOpts = special ? [special] : doorOffers(dailyRun ? mulberry(dailySeed() + fl * 977) : Math.random);
  state = 'elevator'; trigger = adsHeld = false; stopCooking(); document.exitPointerLock?.();
  showDoors(fl, special);
  show('elevator', true); SND.ui(); saveRun();
  midAd(); // natural break between floors: game sites may show an ad here (at most every 3 minutes)
}
function showDoors(fl, special) {
  elevPick = i => pickDoor(i); elevN = doorOpts.length;
  $('elevator').innerHTML = `<div class="card elevcard"><div class="stamp" style="background:var(--navy)">ELEVATOR</div>
    <h2>Floor ${fl}</h2><p class="sub">${special ? 'Only one way up this time.' : 'Pick a door. It changes the rules for the whole next floor, and how much it pays.'}</p>
    <div class="doors">${doorOpts.map((m, i) => `<button class="door" data-i="${i}" style="--c:${m.col}"><div class="dpanel"><i>${m.icon}</i></div>
      <b>${m.name}</b><span>${m.twist}</span><em class="${m.cash > 1 ? 'up' : m.cash < 1 ? 'down' : ''}">${m.cash === 1 ? 'Normal cash' : `×${m.cash} cash`}</em><kbd>${i + 1}</kbd></button>`).join('')}</div>
    <p class="note">${doorOpts.length > 1 ? '1 2 3 or click a door' : 'Enter or click to go up'}</p></div>`;
  $('elevator').querySelectorAll('.door').forEach(b => { b.onmousedown = e => e.stopPropagation(); b.onclick = () => pickDoor(+b.dataset.i); });
}
function pickDoor(i) {
  const m = doorOpts[i]; if (!m || state !== 'elevator' || adBusy()) return;
  floorMod = m.special ? { ...MODS[0], cash: m.cash } : m; life('doors');
  show('elevator', false); state = 'playing'; clock.getDelta(); lock(); SND.code();
  spawnWave(doorWave);
  if (m.id === 'gene') for (const k of ['primary', 'secondary']) { const it = player.slots[k]; if (it) it.pend++; }
  if (m.id === 'gene') { lastSlotsKey = ''; medal(`MUTAGEN: PRESS ${keyLabel('mutate')} TO MUTATE`, '✦', 0, 'lv'); }
  $('hud').dataset.mod = floorMod.id;
}
function banner(t, s) { const b = $('banner'); b.innerHTML = `<div class="t">${t}</div><span class="s">${s}</span>`; b.classList.add('on'); clearTimeout(banner.tm); banner.tm = setTimeout(() => b.classList.remove('on'), 2600); }
// kill feed row. tags = [icon, tooltip, class] badges for how the kill happened; multi = kills in this chain (2+ adds a ×N badge)
function feed(name, hs, cash, weapon, tags = [], multi = 0, cls = '') {
  const d = document.createElement('div'); d.className = 'kf' + (cls ? ' ' + cls : '') + (multi >= 3 ? ' multi' : '');
  d.innerHTML = `<span class="w">${weapon || ''}</span>${hs ? '<span class="hs" title="Headshot">◉</span>' : ''}${tags.map(([i, t, c]) => `<span class="tg ${c || ''}" title="${t}">${i}</span>`).join('')}<em>${name}</em>${multi >= 2 ? `<span class="mx">×${multi}</span>` : ''}<span class="c">+$${cash}</span>`;
  $('killfeed').prepend(d); setTimeout(() => d.remove(), 4000);
  while ($('killfeed').children.length > 6) $('killfeed').lastChild.remove();
}
// big centre pop for 3+ kills in a chain; each new kill in the chain bumps it instead of stacking a new one
const MULTI_NAMES = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL', 'PENTA KILL', 'HEXA KILL'];
function multiPop(n) {
  const el = $('multikill'); if (!el || n < 3) return;
  el.innerHTML = `<div class="t">${n >= MULTI_NAMES.length ? 'RAMPAGE' : 'MULTI KILL'}</div><div class="n">×${n}</div><div class="s">${MULTI_NAMES[n] || `${n} KILLS IN A ROW`}</div>`;
  el.style.setProperty('--mk', Math.min(1 + (n - 3) * .12, 1.6)); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  clearTimeout(multiPop.tm); multiPop.tm = setTimeout(() => el.classList.remove('go'), 1400);
  player.shake += .3 + Math.min(n, 8) * .08;
}
function hitmark(head, kill) { if (!settings.hitmarkers) return; const h = $('hitmarker'); h.className = (kill ? 'kill' : head ? 'head' : '') + ' pop'; h.style.opacity = 1; clearTimeout(hitmark.t); hitmark.t = setTimeout(() => { h.style.opacity = 0; h.classList.remove('pop'); }, kill ? 240 : 110); }

// ---------- HUD ----------
const mm = $('mm').getContext('2d');
let lastSlotsKey = '', lastAbKey = '', lastRoundsKey = '', compassW = 0, lowBeatT = 0;
let aimCheck = 0;
let lastTags = '', lastCE = '';
function renderSlots() {
  const s = player.slots, key = `${player.cur}|${s.melee?.w.id}|${s.primary?.w.id}|${s.secondary?.w.id}|${s.primary ? Object.values(s.primary.w.ml).join("") : ""}|${s.secondary ? Object.values(s.secondary.w.ml).join("") : ""}|${s.primary?.w.name}|${s.secondary?.w.name}|${s.primary?.pend}|${s.secondary?.pend}|${['primary', 'secondary', 'melee', 'mutate', 'shop'].map(keyLabel)}`;
  if (key === lastSlotsKey) return; lastSlotsKey = key;
  $('slots').innerHTML = ['primary', 'secondary', 'melee'].map((k, i) => `<div class="slot${player.cur === k ? ' cur' : ''}"><kbd>${keyLabel(k)}</kbd>${s[k] ? `<canvas width="168" height="52" data-sil="${s[k].w.id}"></canvas>${s[k].w.name}${s[k].w.muts.length ? `<span class="mi">${mutIcons(s[k])}</span>` : ""}${s[k].pend ? `<em class="mp">${keyLabel('mutate')} ✦</em>` : ""}` : `<span style="opacity:.6">empty · press ${keyLabel('shop')}</span>`}</div>`).join('');
  $('slots').querySelectorAll('canvas').forEach(c => gunThumb(c, byId(c.dataset.sil)));
}
// co-op: everyone else's health under your score, and (in drawMinimap) where they are
let lastTeamKey = '';
const hexCol = n => '#' + ((Number(n) || 0xffffff) & 0xffffff).toString(16).padStart(6, '0'), escT = s => String(s || '').replace(/[<>&"']/g, '');
// like escT, but keeps the characters (for sentences with apostrophes in them)
const ic = n => `<svg class="ic"><use href="#i-${n}"/></svg>`; // an icon from the set at the top of index.html
const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderTeam() {
  const el = $('team'); if (!el) return;
  const list = coop && NET.net.on ? NET.peerStates() : [];
  const rows = list.map(p => {
    const s = p.st, mh = s.mh || 100, f = Math.max(0, Math.min(1, s.hp / mh)), here = s.map === mapDef?.id;
    const d = here ? Math.round(Math.hypot(s.p[0] - player.pos.x, s.p[2] - player.pos.z)) : null;
    return { k: `${p.id}${s.hp}${s.dn}${here ? Math.round(d / 5) : 'x'}`, h: `<div class="mate${s.dn ? ' down' : f < .3 ? ' crit' : f < .6 ? ' low' : ''}${here ? '' : ' away'}"><i style="background:${hexCol(p.col)}"></i><b>${escT(p.name)}</b><span>${s.dn ? `DOWN${s.rv ? ` · ${Math.round(s.rv * 100)}%` : ''}` : here ? `${Math.ceil(s.hp)} HP · ${d}m` : 'OTHER FLOOR'}</span><u><s style="width:${s.dn ? 100 : f * 100}%"></s></u></div>` };
  });
  const key = rows.map(r => r.k).join('|'); if (key === lastTeamKey) return; lastTeamKey = key;
  el.innerHTML = rows.map(r => r.h).join('');
}
function renderPips() {
  const wi = wave - (floorN - 1) * 5;
  $('pips').innerHTML = [1, 2, 3, 4, 5].map(i => `<i class="${i < wi || (i === wi && breakT > 0) ? 'done' : i === wi ? 'cur' : ''}${i === 5 ? ' boss' : ''}"></i>`).join('');
  $('floorlbl').textContent = `FLOOR ${floorN} · WAVE ${wi}/5`;
}
function buildCompass() {
  const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  let h = '';
  for (let d = -180; d <= 540; d += 15) { const a = ((d % 360) + 360) % 360, n = names[a]; h += `<span style="left:${(d + 180) * 3}px" class="${n ? 'big' : ''}${a === 0 ? ' n' : ''}">${n || (a % 45 ? '' : a)}</span>`; }
  $('cstrip').innerHTML = h;
}
buildCompass();
function updateCompass() {
  if (!compassW) compassW = $('compass').clientWidth;
  const heading = ((-player.yaw * 180 / Math.PI) % 360 + 360) % 360;
  $('cstrip').style.transform = `translateX(${compassW / 2 - (heading + 180) * 3}px)`;
  let h = '';
  for (const b of bots) if (b.alive && (b.sees || b.revealed || support.scanT > 0)) {
    const brg = Math.atan2(b.pos.x - player.pos.x, -(b.pos.z - player.pos.z)) * 180 / Math.PI;
    let rel = brg - heading; while (rel > 180) rel -= 360; while (rel < -180) rel += 360;
    if (Math.abs(rel) < 75) h += `<i style="left:${compassW / 2 + rel * 3}px;${b.t.boss ? 'width:12px;height:12px;margin-left:-6px;top:1px;' : ''}${b.sees ? '' : 'background:#f2cc8f;'}"></i>`;
  }
  if (h !== lastCE) { lastCE = h; $('cenemies').innerHTML = h; }
}
function renderAbilities() {
  const A = player.ab;
  // [id, key, icon, class, count, cooldown fraction]
  const items = [
    ['dash', keyLabel('dash'), '»', player.dashCh > 0 ? 'ready' : '', AB(A, 'dash', 'charges') > 1 ? player.dashCh : '', player.dashCh > 0 ? 0 : player.dashCd / AB(A, 'dash', 'cd')],
    A.grapple ? ['grap', keyLabel('grapple'), '⚓', player.grapCd <= 0 ? 'ready' : '', '', player.grap ? 1 : Math.max(0, player.grapCd) / AB(A, 'grapple', 'cd')] : null,
    A.slam ? ['slam', keyLabel('crouch'), '⤓', player.slamCd <= 0 ? 'ready' : '', '', Math.max(0, player.slamCd) / AB(A, 'slam', 'cd')] : null,
    A.djump ? ['dj', '', '⇈', player.jumpsLeft > 0 || player.onGround ? 'ready' : '', '', 0] : null,
    ['frag', keyLabel('nade'), '●', player.nades ? '' : 'off', player.nades, 0],
    slv('scan') ? ['scan', keyLabel('scan'), '◎', support.scanT > 0 ? 'live' : owned('scan') ? 'ready' : 'off', support.scanT > 0 ? Math.ceil(support.scanT) : owned('scan'), 0] : null,

  ].filter(Boolean);
  const key = items.map(i => i.slice(0, 5).join(':')).join('|');
  if (key !== lastAbKey) { lastAbKey = key; $('abilities').innerHTML = items.map(([id, k, ic, cls, n]) => `<div class="ab ${cls}">${k ? `<kbd>${k}</kbd>` : ''}${ic}<span class="n">${n}</span><div class="cd" id="cd-${id}"></div></div>`).join(''); }
  for (const i of items) { const cd = $('cd-' + i[0]); if (cd) cd.style.height = clamp(i[5], 0, 1) * 100 + '%'; }
}
function renderRounds(it) {
  const w = it.w, key = `${w.id}|${it.mag}|${w.mag}`;
  if (key === lastRoundsKey) return; lastRoundsKey = key;
  const r = $('rounds');
  if (w.melee) { r.className = ''; r.innerHTML = ''; }
  else if (w.mag <= 40) { r.className = ''; let h = ''; for (let i = 0; i < w.mag; i++) h += `<i class="${i < it.mag ? '' : 'e'}"></i>`; r.innerHTML = h; }
  else { r.className = 'bar'; r.innerHTML = `<b style="width:${it.mag / w.mag * 100}%"></b>`; }
}
const modeName = m => ({ melee: 'MELEE', auto: 'AUTO', semi: 'SEMI', burst: 'BURST', bolt: 'BOLT', pump: 'PUMP', lever: 'LEVER' }[m]);
// Reticles drawn in a -100..100 box, one style per magnification.
let reticleFor = null;
function reticleSVG(sc) {
  const ink = '#14151c', red = '#ff3b30', line = (x1, y1, x2, y2, w, c = ink) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
  if (sc === '3x') { // ACOG-style chevron with bullet-drop ladder
    let s = `<path d="M0 0 L-7 9 L-4.5 9 L0 3.2 L4.5 9 L7 9 Z" fill="${red}"/>` + line(0, 9, 0, 60, .9);
    [18, 28, 38, 48].forEach((y, i) => { s += line(-9 + i * 1.6, y, 9 - i * 1.6, y, .9); s += `<text x="${11 - i * 1.6}" y="${y + 1.6}" font-size="4.5" fill="${ink}" font-family="monospace">${i + 4}</text>`; });
    return s + line(-100, 0, -60, 0, 1.4) + line(60, 0, 100, 0, 1.4);
  }
  if (sc === '4x') // duplex with lit centre dot
    return line(-100, 0, -24, 0, 3.2) + line(24, 0, 100, 0, 3.2) + line(0, 24, 0, 100, 3.2) + line(0, -100, 0, -24, 3.2) + line(-24, 0, 24, 0, .6) + line(0, -24, 0, 24, .6) + `<circle r="1.1" fill="${red}"/>`;
  if (sc === '6x' || sc === '8x') { // mil-dot
    let s = line(-100, 0, -50, 0, 3) + line(50, 0, 100, 0, 3) + line(0, 50, 0, 100, 3) + line(0, -100, 0, -50, 3) + line(-50, 0, 50, 0, .5) + line(0, -50, 0, 50, .5);
    for (let i = -4; i <= 4; i++) if (i) { s += `<circle cx="${i * 10}" r="1.15" fill="${ink}"/><circle cy="${i * 10}" r="1.15" fill="${ink}"/>`; }
    return s;
  }
  // 12x: fine crosshair, hash marks with numbers, open centre
  let s = line(-100, 0, -2.5, 0, .35) + line(2.5, 0, 100, 0, .35) + line(0, -100, 0, -2.5, .35) + line(0, 2.5, 0, 100, .35) + `<circle r=".45" fill="${red}"/>`;
  for (let i = 1; i <= 9; i++) { const len = i % 5 ? 1.8 : 3.6; s += line(i * 8, -len, i * 8, len, .35) + line(-i * 8, -len, -i * 8, len, .35) + line(-len, i * 8, len, i * 8, .35); if (i % 5 === 0) s += `<text x="${i * 8 - 1.6}" y="-5" font-size="3.6" fill="${ink}" font-family="monospace">${i}</text>`; }
  return s + line(-100, 0, -72, 0, 2.6) + line(72, 0, 100, 0, 2.6) + line(0, 72, 0, 100, 2.6);
}
let segs = null;
let lastCash = null;
function updateHUD(dt) {
  const it = cur(), w = it.w;
  $('score').textContent = score.toLocaleString();
  if (player.cash !== lastCash) { const up = lastCash != null && player.cash > lastCash; lastCash = player.cash; $('cash').textContent = '$' + player.cash.toLocaleString(); if (up) { const c = $('cashchip'); c.classList.remove('gain'); void c.offsetWidth; c.classList.add('gain'); } }
  $('enemies').textContent = bots.filter(b => b.alive).length;
  const sc = $('streakchip'); sc.classList.toggle('on', player.streak >= 3); $('streak').textContent = player.streak;
  const boss = bots.find(b => b.alive && b.t.boss), bb = $('bossbar');
  bb.classList.toggle('on', !!boss); if (boss) { bb.firstElementChild.textContent = `THE ${boss.t.name.toUpperCase()}`; const f = Math.max(0, boss.hp / boss.t.hp * 100) + '%'; $('bossfill').style.width = f; $('bosslag').style.width = f; }
  const spotted = bots.filter(b => b.alive && b.sees).length, heard = bots.some(b => b.alive && b.aware > .15);
  $('detect').textContent = spotted ? `SPOTTED BY ${spotted}` : heard ? 'SOMETHING HEARD YOU' : 'UNDETECTED';
  $('detect').className = spotted ? 'hot' : heard ? 'warm' : '';
  // health
  const hp = Math.max(0, Math.ceil(player.hp)); $('hnum').textContent = hp;
  if (!segs) { $('hseg').innerHTML = '<i><b></b></i>'.repeat(10); segs = [...$('hseg').querySelectorAll('b')]; }
  const seg = player.maxHp / 10, hpF = hp / player.maxHp; // 10 segments however big your max health is
  segs.forEach((b, i) => b.style.width = clamp((hp - i * seg) / seg, 0, 1) * 100 + '%');
  $('hseg').className = 'seg' + (hpF <= .3 ? ' low' : hpF <= .6 ? ' mid' : '');
  $('anum').textContent = `Armour ${Math.ceil(player.armor)}`; $('afill').style.width = player.armor + '%';
  $('lowhp').classList.toggle('on', hp > 0 && hp <= 30);
  if (hp > 0 && hp <= 30) { lowBeatT -= dt; if (lowBeatT <= 0) { lowBeatT = 1.1; SND.heartbeat(); } }
  // weapon
  const L = levelOf(prog.xp[w.id] || 0);
  $('wname').textContent = w.name; $('wlvl').textContent = `LV ${L.level}`; $('wxp').firstChild.style.width = (L.need ? L.into / L.need * 100 : 100) + '%';
  const tagsH = `<span>${modeName(w.modes[it.mode])}${w.modes.length > 1 ? ` · ${keyLabel('mode')}` : ''}</span><span>${w.scope === 'iron' ? 'IRONS' : w.scope.toUpperCase()}</span><span>${w.wt} KG</span>` + (w.spin ? `<span>SPIN ${Math.round(player.spin * 100)}%</span>` : ''); if (tagsH !== lastTags) { lastTags = tagsH; $('wtags').innerHTML = tagsH; }
  if (w.melee) { $('mag').textContent = '∞'; $('mag').style.color = ''; $('res').textContent = 'MELEE'; }
  else { $('mag').textContent = it.mag; $('mag').style.color = it.mag <= Math.ceil(w.mag * .2) ? '#d6453d' : ''; $('res').textContent = '/ ' + it.reserve; }
  renderTeam();
  renderRounds(it);
  $('rbar').style.opacity = it.reloadT > 0 ? 1 : 0; if (it.reloadT > 0) $('rfill').style.width = (1 - it.reloadT / it.reloadTotal) * 100 + '%';
  const pr = $('prompt');
  if (it.reloadT > 0) pr.className = '';
  else if (it.mag === 0 && it.reserve === 0) { pr.textContent = `NO AMMO · BUY AMMO (${keyLabel('shop')})`; pr.className = 'on red'; }
  else if (it.mag === 0) { pr.textContent = `RELOAD [${keyLabel('reload')}]`; pr.className = 'on red'; }
  else if (it.mag <= Math.ceil(w.mag * .2) && w.mag > 2) { pr.textContent = 'LOW AMMO'; pr.className = 'on'; }
  else pr.className = '';
  $('breath').style.display = w.zoom < 15 ? 'block' : 'none';
  $('bfill').style.width = (player.exhale > 0 ? 0 : player.breath / 4 * 100) + '%';
  const h = $('hint');
  const pi = pendingItem();
  if (player.down) { h.textContent = player.revT > 0 ? `Reviving… ${Math.round(player.revT / 3 * 100)}%` : 'You are down. A friend has to stand next to you to revive you.'; h.classList.add('on'); }
  else if (pi) { h.textContent = `✦ ${pi.base.name} can mutate! Press ${keyLabel('mutate')} to pick a mutation`; h.classList.add("on"); }
  else if (breakT > 0) { h.textContent = `Next wave in ${Math.ceil(breakT)}s · ${keyLabel('shop')} to shop · ${keyLabel('next')} to start now`; h.classList.add("on"); }
  else if (!player.slots.primary && wave === 1 && runTime < 25) { h.textContent = `You start with $800. Press ${keyLabel('shop')} to buy a primary weapon.`; h.classList.add('on'); }
  else h.classList.remove('on');
  renderSlots(); renderAbilities();
}
// crosshair, scope and compass move every frame even when the rest of the HUD updates less often
let lastJC = -1;
function updateAim() {
  const jc = Math.round((player.jCharge || 0) * 50) / 50;
  if (jc !== lastJC) { lastJC = jc; const el = $("jcharge"); el.classList.toggle("on", jc > 0); el.classList.toggle("full", jc >= 1); el.firstChild.style.width = jc * 100 + "%"; }
  const w = cur().w;
  // custom crosshair: arms spread with the real spread cone; hidden while aiming or sprinting
  const ch = $("crosshair"), spread = spreadNow(w), gap = Math.tan(spread) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * innerHeight / 2;
  spreadCrosshair(ch, Math.max(0, gap - 4) * .9);
  ch.style.opacity = player.adsT > .5 && !w.akimbo || player.sprinting || player.inspectT > 0 || player.detail || w.cat === "Sniper" ? 0 : 1;
  if ((aimCheck = (aimCheck + 1) % 3) === 0) { raycaster.setFromCamera({ x: 0, y: 0 }, camera); const fr = Math.max(40, w.range * 1.5), wl = rayWall(camera.position, raycaster.ray.direction, fr); raycaster.far = wl ? wl.d : fr; const hit = raycaster.intersectObjects(bots.filter(b => b.alive).map(b => b.group), true).find(h => h.object.isMesh && !h.object.userData.ui); aimOnEnemy = !!(hit && findBot(hit.object)); ch.classList.toggle('enemy', settings.xh.enemyRed && aimOnEnemy); }
  const scoped = magnified(w) && player.adsT > .9;
  $('scope').classList.toggle('on', scoped);
  if (scoped) {
    if (reticleFor !== w.scope) { reticleFor = w.scope; $('reticle').innerHTML = reticleSVG(w.scope); }
    // scope shadow: the lens edge drifts against sway and kicks with recoil
    const k = innerHeight / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * .5;
    $('lens').style.transform = `translate(${(-(player.swayX || 0) * k).toFixed(1)}px, ${((player.swayY || 0) * k + player.kick * 18).toFixed(1)}px)`;
  }
  updateCompass();
}
// The map is painted once per floor into a big canvas; the minimap shows a rotating window of it around you,
// and M opens the whole floor.
const mapImg = document.createElement('canvas'); let mapImgFor = null, bigMap = false;
const MAPPX = 1024;
function paintMapImage() {
  mapImgFor = world.def; const S = world.size + 2, k = MAPPX / (S * 2), tx = v => (v + S) * k, c = mapImg.getContext('2d');
  mapImg.width = mapImg.height = MAPPX;
  c.fillStyle = '#efe4cf'; c.fillRect(0, 0, MAPPX, MAPPX);
  c.strokeStyle = 'rgba(61,64,91,.07)'; c.lineWidth = 1;
  for (let v = -S; v <= S; v += 20) { c.beginPath(); c.moveTo(tx(v), 0); c.lineTo(tx(v), MAPPX); c.moveTo(0, tx(v)); c.lineTo(MAPPX, tx(v)); c.stroke(); }
  const cols = world.colliders.slice().sort((a, b) => a.h - b.h);
  for (const cl of cols) { c.fillStyle = cl.y0 > 2 ? 'rgba(61,64,91,.22)' : cl.h > 3 ? '#3d405b' : cl.h > 1.5 ? '#8d8676' : '#bdb3a0'; c.fillRect(tx(cl.minX), tx(cl.minZ), Math.max(1, (cl.maxX - cl.minX) * k), Math.max(1, (cl.maxZ - cl.minZ) * k)); }
  for (const p of world.pads) { c.fillStyle = '#4fd1c5'; c.strokeStyle = '#2b2d42'; c.lineWidth = 1.5; c.beginPath(); c.arc(tx(p.x), tx(p.z), 4, 0, 7); c.fill(); c.stroke(); }
  c.strokeStyle = '#2b2d42'; c.lineWidth = 3; c.strokeRect(tx(-world.size), tx(-world.size), world.size * 2 * k, world.size * 2 * k);
}
function drawMinimap() {
  if (mapImgFor !== world.def) paintMapImage();
  const big = bigMap, Sz = big ? Math.min(innerWidth, innerHeight) * .8 : 180, cv = mm.canvas;
  if (cv.width !== Math.round(Sz)) { cv.width = cv.height = Math.round(Sz); }
  const S = world.size + 2, px = MAPPX / (S * 2);
  // minimap: 110 m across, centred on you and turned so up is where you're facing. Full map: whole floor, north up.
  const view = big ? S * 2 : 110, k = Sz / view, rot = big ? 0 : player.yaw;
  mm.save(); mm.clearRect(0, 0, Sz, Sz);
  mm.beginPath(); if (big) mm.rect(0, 0, Sz, Sz); else mm.arc(Sz / 2, Sz / 2, Sz / 2, 0, 7); mm.clip();
  mm.fillStyle = '#e6d9c0'; mm.fillRect(0, 0, Sz, Sz);
  mm.translate(Sz / 2, Sz / 2); mm.rotate(rot);
  const cx = big ? 0 : player.pos.x, cz = big ? 0 : player.pos.z;
  mm.drawImage(mapImg, (-S - cx) * k, (-S - cz) * k, S * 2 * k, S * 2 * k);
  const P = (x, z) => [(x - cx) * k, (z - cz) * k];
  const dot = (x, z, r, fill, ring) => { const [a, b] = P(x, z); mm.fillStyle = fill; mm.beginPath(); mm.arc(a, b, r, 0, 7); mm.fill(); if (ring) { mm.strokeStyle = ring; mm.lineWidth = 1.5; mm.stroke(); } };
  for (const p of pickups) dot(p.mesh.position.x, p.mesh.position.z, 3, p.kind === 'hp' ? '#81b29a' : '#e8a33d', '#2b2d42');
  for (const t of support.turrets) dot(t.g.position.x, t.g.position.z, 3.5, '#f2cc8f', '#2b2d42');
  const pulse = 1 + Math.sin(performance.now() / 180) * .25;
  for (const b of bots) if (b.alive && (b.sees || b.revealed || support.scanT > 0 || b.pos.distanceTo(player.pos) < 18)) {
    const r = (b.t.boss ? 5 : b.kind === 'heavy' ? 4 : 3) * (big ? 1.3 : 1) * (b.revealed && !b.sees ? pulse : 1);
    dot(b.pos.x, b.pos.z, r, b.t.boss ? '#2b2d42' : b.kind === 'sniper' ? '#e8a33d' : '#d6453d', '#fffaf0');
  }
  // co-op friends: an arrow in their colour pointing where they face (red if they're down), pinned to the edge of the
  // round minimap when they're further away, and named on the full map
  if (coop && NET.net.on) for (const p of NET.peerStates()) {
    const s = p.st; if (s.map !== mapDef?.id) continue;
    let [a, b] = P(s.p[0], s.p[2]); const lim = Sz / 2 - 9, dd = Math.hypot(a, b), edge = !big && dd > lim;
    if (edge) { a *= lim / dd; b *= lim / dd; }
    mm.save(); mm.translate(a, b); mm.rotate(-s.yaw); mm.globalAlpha = edge ? .8 : 1;
    mm.fillStyle = s.dn ? '#d6453d' : hexCol(p.col); mm.strokeStyle = '#2b2d42'; mm.lineWidth = 1.8;
    mm.beginPath(); mm.moveTo(0, -7); mm.lineTo(5, 5.5); mm.lineTo(0, 2.5); mm.lineTo(-5, 5.5); mm.closePath(); mm.fill(); mm.stroke(); mm.restore();
    if (big) { mm.font = `bold 13px ${uiFont()}`; mm.textAlign = 'center'; mm.lineWidth = 3; mm.strokeStyle = '#fffaf0'; mm.strokeText(escT(p.name), a, b - 12); mm.fillStyle = '#2b2d42'; mm.fillText(escT(p.name), a, b - 12); }
  }
  // you
  const [ux, uz] = P(player.pos.x, player.pos.z);
  mm.translate(ux, uz); mm.rotate(-player.yaw);
  mm.fillStyle = 'rgba(242,204,143,.5)'; mm.beginPath(); mm.moveTo(0, 0); mm.arc(0, 0, big ? 40 : 30, -Math.PI / 2 - .6, -Math.PI / 2 + .6); mm.fill();
  mm.fillStyle = '#2b2d42'; mm.strokeStyle = '#fffaf0'; mm.lineWidth = 1.5; mm.beginPath(); mm.moveTo(0, -7); mm.lineTo(5, 6); mm.lineTo(0, 3); mm.lineTo(-5, 6); mm.closePath(); mm.fill(); mm.stroke();
  mm.restore();
  // north marker rides the edge of the round minimap
  mm.fillStyle = '#e07a5f'; mm.font = `bold ${big ? 16 : 11}px ${uiFont()}`; mm.textAlign = 'center'; mm.textBaseline = 'middle';
  if (big) mm.fillText('N', Sz / 2, 14);
  else { const a = -Math.PI / 2 + rot, r = Sz / 2 - 10; mm.fillText('N', Sz / 2 + Math.cos(a) * r, Sz / 2 + Math.sin(a) * r); }
  if (!big) { mm.strokeStyle = 'rgba(43,45,66,.5)'; mm.lineWidth = 2; mm.beginPath(); mm.arc(Sz / 2, Sz / 2, Sz / 2 - 1, 0, 7); mm.stroke(); }
}
// When only a few bots are left, they come looking for you (and show on the map), so you never have to search a huge floor.
function updateStragglers(dt) {
  const alive = bots.filter(b => b.alive);
  if (!alive.length || alive.length > 3) { stragglerT = 0; return; }
  stragglerT += dt;
  if (stragglerT > 18) {
    if (!alive[0].revealed) banner('LAST BOTS', `${alive.length} LEFT · THEY'RE HUNTING YOU`);
    for (const b of alive) { if (!b.revealed || Math.random() < dt / 3) b.noise(player.pos, 5, 1); b.revealed = true; }
  }
}

// ---------- secret codes ----------
// Codes that change the fight turn off XP, badges and quest progress for the rest of that run.
function giveSecret(id) {
  const k = byId(id).slot === 'secondary' ? 'secondary' : 'primary', old = player.slots[k];
  if (old && old.base.id === id) { old.reserve = old.w.reserve; old.mag = old.w.mag; return switchTo(k, true); }
  if (old) player.locker[old.base.id] = old;
  delete player.locker[id]; player.slots[k] = inst(id); switchTo(k, true); lastSlotsKey = '';
}
function redeem(raw) {
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code) return 'Type a code first.';
  const inGame = state !== 'menu' && state !== 'dead';
  if (code === 'THERMONUCLEAR') {
    if (!inGame) return 'Start a run first.';
    giveSecret('nuke'); cheatRun = true; SND.code(); return '☢ Thermonuclear launcher armed. Fire it where you want the airstrike. It will not hurt you.';
  }
  if (code === 'PEACH0RECOIL9X3') {
    if (!inGame) return 'Start a run first.';
    giveSecret('stillwater'); cheatRun = true; SND.code(); return 'Stillwater LMG: zero recoil, 200 rounds a mag.';
  }
  if (code === 'SLOWMO') { cheats.slow = !cheats.slow; if (cheats.slow) cheatRun = true; SND.code(); return cheats.slow ? 'Slow motion ON: the whole game runs at half speed.' : 'Slow motion OFF.'; }
  if (code === 'BOUNCY') { cheats.bouncy = !cheats.bouncy; if (cheats.bouncy) cheatRun = true; SND.code(); return cheats.bouncy ? 'Bouncy ON: low gravity, huge jumps.' : 'Bouncy OFF.'; }
  if (code === 'CONFETTI') { cheats.confetti = !cheats.confetti; SND.code(); return cheats.confetti ? 'Confetti ON: bots pop into pastel confetti.' : 'Confetti OFF.'; }
  return `"${escH(String(raw).trim().toUpperCase())}" isn't a valid code.`;
}
$('pauseRedeem').onclick = () => { $('pauseMsg').textContent = redeem($('pauseCode').value); $('pauseCode').value = ''; };
$('pauseCode').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('pauseRedeem').click(); });
['pauseCode', 'pauseRedeem'].forEach(id => $(id).addEventListener('mousedown', e => e.stopPropagation()));

// ---------- settings UI (shared by the main menu and the pause screen) ----------
let setTab = 'game', setQ = ''; // settings tab and search text
const getS = k => k.startsWith('xh.') ? settings.xh[k.slice(3)] : settings[k];
const putS = (k, v) => { if (k.startsWith('xh.')) settings.xh[k.slice(3)] = v; else settings[k] = v; };
const pctF = v => Math.round(v * 100) + '%', mulF = v => (+v).toFixed(2) + '×', numF = v => (+v).toFixed(1);
const FMT = { sens: mulF, adsSens: mulF, padSens: mulF, bob: pctF, wobble: pctF, hurtFx: pctF, fov: v => v + '°', vol: pctF, music: pctF, hud: pctF, 'xh.size': numF, 'xh.thick': numF, 'xh.gap': numF, 'xh.opacity': pctF };
// ---------- graphics test: builds a Custom preset for this computer ----------
// Runs on the main menu with extra bots on screen (so it's closer to a real fight). First it measures how fast the
// screen refreshes, then starts from the best-looking settings and turns one thing down at a time (the costliest
// first) until frames keep up with the screen. If a 120 Hz screen can only keep up by dropping the glow, it aims for
// a steady 60 instead and keeps the nicer picture.
let bench = null;
const BENCH_TOP = () => ({ pr: Math.min(devicePixelRatio, 2), shadow: IS_MAC ? 2048 : 4096, post: true, bloom: true, samples: 4, lite: 1, lod: 120, botShadow: 60 });
const BENCH_LIGHT = { pr: .6, shadow: 0, post: false, bloom: false, samples: 0, lite: .35, lod: 32, botShadow: 0 };
const BENCH_STEPS = [
  ['less edge smoothing', c => { c.samples = 2; }],
  ['170% resolution', c => { c.pr = Math.min(c.pr, 1.7); }],
  ['lighter shadows', c => { c.shadow = Math.min(c.shadow, 2048); c.botShadow = 40; }],
  ['150% resolution', c => { c.pr = Math.min(c.pr, 1.5); }],
  ['shorter bot detail range', c => { c.lod = 90; }],
  ['135% resolution', c => { c.pr = Math.min(c.pr, 1.35); }],
  ['low shadows', c => { c.shadow = Math.min(c.shadow, 1024); c.botShadow = 28; }],
  ['no edge smoothing', c => { c.samples = 0; }],
  ['120% resolution', c => { c.pr = Math.min(c.pr, 1.2); }],
  ['short bot detail range', c => { c.lod = 70; c.botShadow = 18; }],
  ['105% resolution', c => { c.pr = Math.min(c.pr, 1.05); }],
  ['glow off', c => { c.bloom = false; }],
  ['95% resolution', c => { c.pr = Math.min(c.pr, .95); }],
  ['shadows off', c => { c.shadow = 0; c.botShadow = 0; }],
  ['effects off', c => { Object.assign(c, { post: false, lite: .7, lod: 55, think: 3, hudHz: 30, mm: 3, edges: 70 }); }],
  ['80% resolution', c => { c.pr = Math.min(c.pr, .8); }],
  ['potato mode', c => { Object.assign(c, { pr: Math.min(c.pr, .65), lite: .35, lod: 40, think: 4, hudHz: 20, mm: 5, edges: 40 }); }],
];
const GLOW_OFF_STEP = 11;
function benchApply(cfg, label) {
  QUALITY.custom = cfg; settings.quality = 'custom'; lastQuality = null; applySettings(); setResScale(1);
  bench.t = 0; bench.gaps.length = 0; bench.label = label;
  const n = bench.tests++, total = BENCH_STEPS.length + 2;
  $('benchStep').textContent = label; $('benchBar').style.width = Math.min(96, (n + 1) / total * 100) + '%';
}
function benchStart(host) {
  if (state !== 'menu' || bench) return;
  const saved = { quality: settings.quality, res: settings.res, autoRes: settings.autoRes, fpsCap: settings.fpsCap };
  bench = { saved, host, gaps: [], t: 0, tests: 0, step: -1, phase: 'refresh', target: 1000 / 60, retry: false, cap60: false, cfg: BENCH_TOP(), extra: [] };
  settings.res = 'auto'; settings.autoRes = false; settings.fpsCap = '0'; macCap = 0;
  // extra bots so the test is closer to a real fight
  const kinds = ['grunt', 'heavy', 'scout', 'sniper', 'brawler', 'shield', 'medic'];
  for (let i = 0; i < 14; i++) { const b = new Bot(kinds[i % kinds.length], openPoint()); bots.push(b); bench.extra.push(b); }
  document.body.classList.add('benching'); $('bench').classList.add('on'); SND.ui();
  benchApply({ ...BENCH_LIGHT }, 'Measuring your screen');
}
function benchTick() {
  const B = bench; if (!B) return;
  if (state !== 'menu') return benchEnd(false);
  B.t += lastDt;
  if (B.t < .6) { B.gaps.length = 0; return; } // warm-up: new shaders build and frame times settle
  if (B.t < 2.1 || B.gaps.length < 20) return;
  const g = B.gaps.slice().sort((a, b) => a - b), med = g[g.length >> 1], p90 = g[Math.floor(g.length * .9)];
  if (B.phase === 'refresh') {
    // how fast the screen refreshes (capped at 120 FPS: going higher costs a lot of picture for little feel)
    B.target = Math.max(med, 1000 / 120); B.phase = 'search';
    return benchApply(B.cfg, `Best looks at ${Math.round(1000 / B.target)} FPS`);
  }
  const ok = med <= B.target * 1.08 && p90 <= B.target * 1.2;
  if (ok) return benchFinish();
  // turn the next thing down (skipping steps that wouldn't change anything)
  while (++B.step < BENCH_STEPS.length) {
    const before = JSON.stringify(B.cfg); BENCH_STEPS[B.step][1](B.cfg);
    if (JSON.stringify(B.cfg) !== before) return benchApply(B.cfg, `Trying: ${BENCH_STEPS[B.step][0]}`);
  }
  benchFinish();
}
function benchFinish() {
  const B = bench;
  if (!B.retry && B.target < 13 && B.step >= GLOW_OFF_STEP) {
    // a high refresh screen only kept up by losing the glow: aim for a steady 60 FPS instead
    Object.assign(B, { retry: true, cap60: true, target: 1000 / 60, step: -1, cfg: BENCH_TOP() });
    return benchApply(B.cfg, 'Best looks at a steady 60 FPS');
  }
  benchEnd(true);
}
function benchEnd(ok) {
  const B = bench; if (!B) return; bench = null;
  B.extra.forEach(b => { b.remove(); const i = bots.indexOf(b); if (i >= 0) bots.splice(i, 1); });
  document.body.classList.remove('benching'); $('bench').classList.remove('on');
  Object.assign(settings, B.saved);
  if (ok) {
    settings.customQ = { ...B.cfg, fps: Math.round(1000 / B.target) };
    settings.quality = 'custom'; settings.autoRes = true; if (B.cap60) settings.fpsCap = '60';
  }
  if (settings.customQ) QUALITY.custom = settings.customQ; else delete QUALITY.custom;
  if (settings.quality === 'custom' && !settings.customQ) settings.quality = 'high';
  lastQuality = null; applySettings();
  if (B.host && document.body.contains(B.host)) renderSettings(B.host);
  if (ok) toast('GRAPHICS TEST', 'Custom settings ready', `Built for your ${CHIP || 'computer'} · aims for ${settings.customQ.fps} FPS`, '⚙'); else SND.click();
}
const customNote = () => {
  const c = settings.customQ; if (!c) return '';
  return `Built by the test for this ${CHIP || 'computer'}: ${Math.round(c.pr / devicePixelRatio * 100)}% resolution, ${c.shadow ? (c.shadow >= 2048 ? 'sharp shadows' : 'soft shadows') : 'no shadows'}, ${!c.post ? 'no effects' : c.bloom ? 'glow on' : 'glow off'}, ${c.samples ? `${c.samples}x edge smoothing` : 'no edge smoothing'}. Aims for ${c.fps} FPS.`;
};
$('benchCancel').onclick = () => benchEnd(false);
addEventListener('keydown', e => { if (bench && e.code === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); benchEnd(false); } }, true);
const QUALITY_NOTE = { potato: 'For old or 1 GB laptops. Low resolution, no shadows or effects, simpler bots, less blood, and the HUD, minimap and far bots update less often.', low: 'No post effects or glow, lower resolution, shorter shadow range. HUD and far bots update a bit less often.', medium: 'Glow, colour grading and light anti-aliasing.', high: 'Recommended. Sharp image, smooth edges, detailed bots out to 90 m.', ultra: 'Full resolution, the sharpest shadows and detailed bots out to 120 m. Needs a strong GPU.', superultra: 'For screenshots, not for playing: drawn bigger than your screen, 8K soft shadows, ray tracing at Max (light that bounces colour off walls, soft shadows in every corner, reflections, sun rays), the most ground detail and cloud shadows. Expect a very low frame rate.' };
const HM_COLORS = ['#fffaf0', '#ffe14d', '#4fd1c5', '#ff4fd8', '#ff3b30'];
// Animated preview: the arms breathe in and out so you can see the dynamic spread.
function previewLoop(el) {
  const t0 = performance.now();
  const step = () => { if (!document.body.contains(el)) return; spreadCrosshair(el, (Math.sin((performance.now() - t0) / 500) * .5 + .5) * 10); requestAnimationFrame(step); };
  step();
}
// help screens and hints show the player's own keys
function refreshKeyHints() { document.querySelectorAll('[data-act]').forEach(el => { el.textContent = keyLabel(el.dataset.act); }); $('mmlabel').dataset.key = keyLabel('map'); }
// "press a key" for Settings > Keybinds: grabs the next key or mouse button before the game sees it
function startRebind(btn, host) {
  if (rebinding) return;
  const id = btn.dataset.bind; btn.textContent = 'Press a key…'; btn.classList.add('wait'); SND.ui();
  const done = code => {
    removeEventListener('keydown', onKey, true); removeEventListener('mousedown', onMouse, true);
    setTimeout(() => { rebinding = null; }, 0); // let this click finish before the game listens again
    if (code === '') settings.binds = { ...settings.binds, [id]: '' };
    else if (code) settings.binds = rebind(settings.binds, id, code);
    applySettings(); if (code !== null) SND.code(); renderSettings(host);
  };
  const onKey = e => {
    e.preventDefault(); e.stopPropagation();
    if (e.code === 'Escape') return done(null);
    if (e.code === 'Backspace' || e.code === 'Delete') return done('');
    if (NOBIND.has(e.code)) { SND.deny(); return; }
    done(e.code);
  };
  const onMouse = e => { e.preventDefault(); e.stopPropagation(); done(e.button === 0 && e.target !== btn ? null : 'Mouse' + e.button); }; // left-click elsewhere cancels
  rebinding = id;
  addEventListener('keydown', onKey, true);
  setTimeout(() => addEventListener('mousedown', onMouse, true), 0); // not the click that opened it
}
// ---------- save transfer ----------
// Export: everything the game keeps in this browser, packed into one code (copied) and a .txt file (downloaded).
// Import: paste the code or pick the file, and the page reloads with that save. Used to move to a new site or laptop.
const SAVE_RX = /^(pastelSiege|ps)/;
function exportSave() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SAVE_RX.test(k)) data[k] = localStorage.getItem(k); }
  const code = 'PSAVE1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, at: Date.now(), from: location.host, ver: GAME_VERSION, data }))));
  try { navigator.clipboard.writeText(code); } catch (e) { }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
  a.download = `pastel-siege-save-${new Date().toISOString().slice(0, 10)}.txt`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('SAVE EXPORTED', 'Save code copied + file downloaded', 'On the new site: Settings > Game > Import save', '💾');
}
function readSave(text) {
  const t = String(text || '').trim(); if (!t.startsWith('PSAVE1:')) throw new Error('That is not a Pastel Siege save code.');
  const d = JSON.parse(decodeURIComponent(escape(atob(t.slice(7).replace(/\s+/g, '')))));
  if (!d || d.v !== 1 || typeof d.data !== 'object') throw new Error('That save code is damaged.');
  return d;
}
function applySave(d) {
  if (!confirm(`Load this save${d.from ? ` from ${d.from}` : ''}${d.at ? ` (${new Date(d.at).toLocaleDateString()})` : ''}?\n\nIt REPLACES the progress on this ${IS_MAC ? 'Mac' : 'computer'}. Export first if you want to keep it.`)) return;
  for (const k of Object.keys(localStorage)) if (SAVE_RX.test(k)) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(d.data)) if (SAVE_RX.test(k) && typeof v === 'string') localStorage.setItem(k, v);
  reloading = true; location.reload();
}
function importSave() {
  const box = document.createElement('div'); box.className = 'savebox';
  box.innerHTML = `<div class="savecard"><h3>Import save</h3><p>Paste the save code, or pick the save file you downloaded.</p>
    <textarea id="saveIn" placeholder="PSAVE1:..." spellcheck="false"></textarea>
    <div class="savebtns"><button class="go" id="saveLoad">${ic('upload')}LOAD SAVE</button><label class="go alt">${ic('paste')}PICK FILE<input type="file" id="saveFile" accept=".txt,text/plain" hidden></label><button class="go ghost" id="saveX">${ic('close')}CANCEL</button></div>
    <p class="saveerr" id="saveErr"></p></div>`;
  document.body.appendChild(box);
  const ta = box.querySelector('#saveIn'), err = box.querySelector('#saveErr'), close = () => box.remove();
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown']) box.addEventListener(t, e => e.stopPropagation());
  setTimeout(() => ta.focus(), 50);
  const tryLoad = text => { try { applySave(readSave(text)); } catch (e) { err.textContent = e.message || 'Could not read that save.'; SND.deny(); } };
  box.querySelector('#saveLoad').onclick = () => tryLoad(ta.value);
  box.querySelector('#saveFile').onchange = e => { const f = e.target.files[0]; if (f) f.text().then(t => { ta.value = t.trim(); tryLoad(t); }); };
  box.querySelector('#saveX').onclick = close;
  box.onclick = e => { if (e.target === box) close(); };
}
// ---------- accounts and online saves ----------
// Signed in, your whole save (the same things Export packs up) is kept on your account: it uploads a few seconds after it
// changes, and when you close the tab. Opening the game on another computer pulls down the newest one. You're only asked
// which to keep when this computer and your account have each made different progress.
const saveData = () => { const data = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SAVE_RX.test(k)) data[k] = localStorage.getItem(k); } return data; };
const levelIn = data => { try { const r = JSON.parse(data.pastelSiegeProgress9 || 'null'), p = r?.d || r; return p ? levelInfo(p.pxp || 0).lvl : 1; } catch (e) { return 1; } };
let pushing = false, syncedFor = null; // nothing uploads until this account's save has been compared with this computer's
async function cloudPush(data = saveData(), last = false) {
  if (!account.user || pushing || syncedFor !== account.user.id) return;
  const s = saveSig(data), S = syncInfo(); if (S.uid === account.user.id && S.sig === s) return;
  pushing = true;
  try { const at = Date.now(); await cloudPut({ v: 1, at, ver: GAME_VERSION, data }, last); setSync({ uid: account.user.id, at, sig: s, prog: progressSig(data) }); account.syncedAt = at; account.status = 'synced'; }
  catch (e) { account.status = 'offline'; }
  pushing = false; renderAccount();
}
function cloudLoad(cd) {
  for (const k of Object.keys(localStorage)) if (SAVE_RX.test(k)) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(cd.data)) if (SAVE_RX.test(k) && typeof v === 'string') localStorage.setItem(k, v);
  syncedFor = null; setSync({ uid: account.user.id, at: cd.at, sig: saveSig(cd.data), prog: progressSig(cd.data) }); reloading = true; location.reload();
}
async function cloudSync() {
  if (!account.user || reloading) return;
  let cd; try { cd = await cloudGet(); } catch (e) { account.status = 'offline'; renderAccount(); return; }
  if (!account.user) return;
  const uid = account.user.id, mine = saveData(), S = syncInfo(), same = S.uid === uid, upload = () => { syncedFor = uid; return cloudPush(mine); };
  if (!cd || !cd.data) return upload();                                         // a new account takes this computer's progress
  const here = progressSig(mine), there = progressSig(cd.data), behind = levelIn(mine) < levelIn(cd.data);
  if (here === there) { account.syncedAt = cd.at; account.status = 'synced'; renderAccount(); return upload(); } // same progress: nothing to choose
  if (same && !behind && ((cd.at || 0) <= (S.at || 0) || there === S.prog)) return upload(); // only this computer moved on
  if (same && here === S.prog && state === 'menu') return cloudLoad(cd);        // only the account moved on: take that
  if (!same && levelIn(mine) <= 1 && state === 'menu') return cloudLoad(cd);    // nothing worth keeping here
  if (state === 'menu' && !emailBox) chooseSave(cd, mine);
}
function chooseSave(cd, mine) {
  if ($('useCloud')) return; // already asking
  const box = document.createElement('div'); box.className = 'savebox';
  box.innerHTML = `<div class="savecard"><h3>Which save do you want?</h3><p>Your account and this ${IS_MAC ? 'Mac' : 'computer'} have different progress. The one you do not pick is replaced. (To be safe, you can Export the save on this computer from Settings first.)</p>
    <div class="savebtns"><button class="go tile" id="useCloud"><i>${ic('cloud')}</i><span><b>ACCOUNT SAVE</b><small>Level ${levelIn(cd.data)}${cd.at ? ` · saved ${new Date(cd.at).toLocaleDateString()}` : ''}</small></span></button><button class="go alt tile" id="useHere"><i>${ic('monitor')}</i><span><b>THIS ${IS_MAC ? 'MAC' : 'COMPUTER'}</b><small>Level ${levelIn(mine)}</small></span></button></div></div>`;
  document.body.appendChild(box);
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown']) box.addEventListener(t, e => e.stopPropagation());
  box.querySelector('#useCloud').onclick = () => { SND.ui(); cloudLoad(cd); };
  box.querySelector('#useHere').onclick = () => { SND.ui(); box.remove(); syncedFor = account.user?.id; setSync({}); cloudPush(); };
}
setInterval(() => { if (account.user) syncedFor === account.user.id ? cloudPush() : cloudSync(); }, 20000);
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && account.user) cloudPush(saveData(), true); });
const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 172800 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} days ago`; };
// v0.93.0 setup: ranks (owner / admin / moderator / tester), kicking, and the global leaderboard. Safe to run more than once.
const SETUP_SQL = `-- Pastel Siege setup (v0.95.0): ranks, kicking, chat mutes and the global leaderboard (safe to run again)
alter table public.profiles add column if not exists is_tester boolean not null default false;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists kicked_until timestamptz;
alter table public.profiles add column if not exists muted_until timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('owner','admin','mod','tester'));
  end if;
end $$;
grant select (is_tester, role, muted_until) on public.profiles to anon, authenticated;
update public.profiles set role = 'owner' where is_admin and role is null;
update public.profiles set role = 'tester' where is_tester and role is null;

-- nobody can change their own rank or kick time by editing their profile; only the functions below can
create or replace function public.guard_roles() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and (new.role is distinct from old.role or new.kicked_until is distinct from old.kicked_until
     or new.muted_until is distinct from old.muted_until or new.is_admin is distinct from old.is_admin or new.is_tester is distinct from old.is_tester) then
    raise exception 'not allowed';
  end if;
  return new;
end $$;
drop trigger if exists guard_roles on public.profiles;
create trigger guard_roles before update on public.profiles for each row execute function public.guard_roles();

create or replace function public.rank_of(r text) returns int language sql immutable set search_path = '' as $$
  select case r when 'owner' then 4 when 'admin' then 3 when 'mod' then 2 when 'tester' then 1 else 0 end $$;
create or replace function public.my_rank() returns int language sql stable security definer set search_path = '' as $$
  select coalesce((select public.rank_of(p.role) from public.profiles p where p.id = auth.uid()), 0) $$;
grant execute on function public.my_rank() to authenticated;

-- owners give admin / mod / tester; admins give mod / tester; never to someone at your rank or above
create or replace function public.set_role(name text, role_ text) returns void
language plpgsql security definer set search_path = '' as $$
declare me int := public.my_rank(); them text;
begin
  if role_ = '' then role_ := null; end if;
  if me < 3 then raise exception 'not allowed'; end if;
  select p.role into them from public.profiles p where p.username = lower(name);
  if not found then raise exception 'no player called %', name; end if;
  if public.rank_of(them) >= me or public.rank_of(role_) >= me then raise exception 'not allowed'; end if;
  update public.profiles p set role = role_, is_tester = coalesce(role_ = 'tester', false), is_admin = coalesce(role_ = 'admin', false)
    where p.username = lower(name);
end $$;
grant execute on function public.set_role(text, text) to authenticated;
-- the old tester button, now going through the ranks too
create or replace function public.set_tester(name text, on_ boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.set_role(name, case when on_ then 'tester' else '' end);
end $$;

-- moderators and up: kick someone below you for some minutes (0 lets them back in)
create or replace function public.kick(name text, minutes int default 10) returns void
language plpgsql security definer set search_path = '' as $$
declare me int := public.my_rank(); them text;
begin
  if me < 2 then raise exception 'not allowed'; end if;
  select p.role into them from public.profiles p where p.username = lower(name);
  if not found then raise exception 'no player called %', name; end if;
  if public.rank_of(them) >= me then raise exception 'not allowed'; end if;
  update public.profiles p set room = null,
    kicked_until = case when coalesce(minutes, 0) <= 0 then null else now() + make_interval(mins => least(minutes, 10080)) end
    where p.username = lower(name);
end $$;
grant execute on function public.kick(text, int) to authenticated;

-- moderators and up: mute someone below you in co-op chat for some minutes (0 unmutes)
create or replace function public.mute(name text, minutes int default 10) returns void
language plpgsql security definer set search_path = '' as $$
declare me int := public.my_rank(); them text;
begin
  if me < 2 then raise exception 'not allowed'; end if;
  select p.role into them from public.profiles p where p.username = lower(name);
  if not found then raise exception 'no player called %', name; end if;
  if public.rank_of(them) >= me then raise exception 'not allowed'; end if;
  update public.profiles p set
    muted_until = case when coalesce(minutes, 0) <= 0 then null else now() + make_interval(mins => least(minutes, 10080)) end
    where p.username = lower(name);
end $$;
grant execute on function public.mute(text, int) to authenticated;

-- the online ping now also tells a kicked player how long they're out (and hides their co-op code)
drop function if exists public.ping(text);
create function public.ping(code text default null) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare k timestamptz;
begin
  select p.kicked_until into k from public.profiles p where p.id = auth.uid();
  if k > now() then
    update public.profiles p set last_seen = now(), room = null where p.id = auth.uid();
    return k;
  end if;
  update public.profiles p set last_seen = now(), room = left(code, 12) where p.id = auth.uid();
  return null;
end $$;
grant execute on function public.ping(text) to authenticated;

-- the ADMIN page list: moderators and up (only admins and the owner get co-op codes)
drop function if exists public.admin_players();
create function public.admin_players()
returns table (username text, is_admin boolean, is_tester boolean, role text, created_at timestamptz, last_seen timestamptz, room text, kicked_until timestamptz, muted_until timestamptz)
language plpgsql security definer set search_path = '' as $$
declare me int := public.my_rank();
begin
  if me < 2 then raise exception 'not allowed'; end if;
  return query select p.username, p.is_admin, p.is_tester, p.role, p.created_at, p.last_seen, case when me >= 3 then p.room end, p.kicked_until, p.muted_until
    from public.profiles p order by p.last_seen desc nulls last, p.created_at desc;
end $$;
grant execute on function public.admin_players() to authenticated;

-- the global leaderboard: players can't touch this table, only send finished runs through submit_score
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  score int not null, floor int not null, kills int not null default 0, secs int not null default 0,
  mode text not null default 'normal', created_at timestamptz not null default now());
create index if not exists scores_mode_score on public.scores (mode, score desc);
alter table public.scores enable row level security;
revoke all on public.scores from anon, authenticated;
create or replace function public.submit_score(score_ int, floor_ int, kills_ int, secs_ int, mode_ text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if mode_ not in ('easy', 'normal', 'hard', 'daily') then raise exception 'bad mode'; end if;
  if score_ < 1 or score_ > 100000000 or floor_ < 1 or floor_ > 1000 or kills_ < 0 or secs_ < 0 then raise exception 'bad score'; end if;
  if exists (select 1 from public.scores s where s.user_id = auth.uid() and s.created_at > now() - interval '15 seconds') then raise exception 'slow down'; end if;
  insert into public.scores (user_id, score, floor, kills, secs, mode) values (auth.uid(), score_, floor_, kills_, secs_, mode_);
end $$;
revoke execute on function public.submit_score(int, int, int, int, text) from public, anon;
grant execute on function public.submit_score(int, int, int, int, text) to authenticated;
-- everyone's best run (top 100), only for signed-in players
create or replace function public.top_scores(mode_ text default 'all')
returns table (username text, role text, score int, floor int, kills int, mode text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  return query select t.username, t.role, t.score, t.floor, t.kills, t.mode, t.created_at from (
    select distinct on (s.user_id) p.username, p.role, s.score, s.floor, s.kills, s.mode, s.created_at
      from public.scores s join public.profiles p on p.id = s.user_id
      where mode_ = 'all' or s.mode = mode_
      order by s.user_id, s.score desc) t
    order by t.score desc limit 100;
end $$;
revoke execute on function public.top_scores(text) from public, anon;
grant execute on function public.top_scores(text) to authenticated;
-- an admin or the owner can wipe someone's scores (for obvious cheating)
create or replace function public.clear_scores(name text) returns void
language plpgsql security definer set search_path = '' as $$
declare me int := public.my_rank(); them record;
begin
  if me < 3 then raise exception 'not allowed'; end if;
  select p.id, p.role into them from public.profiles p where p.username = lower(name);
  if not found then raise exception 'no player called %', name; end if;
  if public.rank_of(them.role) >= me and them.id <> auth.uid() then raise exception 'not allowed'; end if;
  delete from public.scores s where s.user_id = them.id;
end $$;
grant execute on function public.clear_scores(text) to authenticated;
notify pgrst, 'reload schema';`;
// the yellow "run this in Supabase" box, used on the ADMIN page and the leaderboard
const sqlBox = title => `<div class="admsql"><b>${title}</b> Open Supabase → SQL Editor → New query, paste this, and press Run (running it again later is fine):<pre>${SETUP_SQL.replace(/</g, '&lt;')}</pre><button class="go alt" data-copy="1">${ic('paste')}COPY SQL</button></div>`;
const wireCopy = (el, done) => el.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => navigator.clipboard?.writeText(SETUP_SQL).then(done));
const roleTag = r => ROLE_NAME[r] ? `<em class="adm r-${r}">${ROLE_NAME[r]}</em>` : '';
// ---------- the global leaderboard (Records page) ----------
// Everyone's best runs. Only signed-in players can see it; finished runs go up when you die, unless you used cheats,
// the admin panel or were in training.
let lb = { tab: 'all', mode: 'all', rows: [], ready: true, err: '', msg: '', busy: false, at: 0, got: '' };
const LB_MODES = [['all', 'ALL'], ['normal', 'NORMAL'], ['hard', 'HARD'], ['easy', 'EASY'], ['daily', 'DAILY']];
async function loadBoard(force) {
  if (!account.user) return renderGlobalBoard();
  if (!force && lb.got === lb.mode && Date.now() - lb.at < 20000) return renderGlobalBoard();
  lb.busy = true; renderGlobalBoard(); const want = lb.mode;
  try { const r = await topScores(want); if (want !== lb.mode) return; lb.rows = r.rows; lb.ready = r.ready; lb.err = ''; lb.at = Date.now(); lb.got = want; }
  catch (e) { lb.err = e.message || 'Could not load the leaderboard.'; }
  lb.busy = false; renderGlobalBoard();
}
function renderGlobalBoard() {
  const el = $('globalBoard'); if (!el) return;
  document.querySelectorAll('#lbTabs [data-lb]').forEach(b => b.classList.toggle('sel', b.dataset.lb === lb.tab));
  $('lbAll').hidden = lb.tab !== 'all'; $('lbMine').hidden = lb.tab !== 'mine';
  if (!account.user) {
    el.innerHTML = `<div class="lbgate"><b>${ic('lock')} Sign in to see the leaderboard</b><span>Everyone's best runs show up here for signed-in players. An account is free and keeps your progress online too.</span><button class="go" id="lbSignIn">${ic('login')}SIGN IN</button></div>`;
    $('lbSignIn').onclick = () => { SND.ui(); openAccount(); }; return;
  }
  if (!lb.ready) {
    el.innerHTML = account.admin ? sqlBox('Turn on the global leaderboard:') + `<p class="palsmsg">${lb.msg}</p>` : '<p class="gnote">The global leaderboard isn\'t switched on yet. Check back soon.</p>';
    wireCopy(el, () => { lb.msg = 'Copied. Paste it into the Supabase SQL Editor and press Run, then open this page again.'; renderGlobalBoard(); }); return;
  }
  const me = lb.rows.findIndex(r => r.username === account.name);
  el.innerHTML = `<div class="lbmodes">${LB_MODES.map(([k, t]) => `<button class="tab${lb.mode === k ? ' sel' : ''}" data-lbm="${k}">${t}</button>`).join('')}<button class="tab" id="lbRe" title="Refresh">${ic('refresh')}</button></div>
    <p class="palsmsg${lb.err ? ' err' : ''}">${lb.err || (lb.busy ? 'Loading...' : me >= 0 ? `You're #${me + 1} of ${lb.rows.length}.` : lb.rows.length ? 'Finish a run without cheats to get on the board.' : '')}</p>
    <div class="board">${lb.rows.length ? lb.rows.map((r, i) => `<div class="brow g${i === 0 ? ' top' : ''}${r.username === account.name ? ' me' : ''}"><div class="rk">${['🥇', '🥈', '🥉'][i] || '#' + (i + 1)}</div>
      <div><b>${escT(r.username)} ${roleTag(r.role)}</b><span>${r.score.toLocaleString()} points · Floor ${r.floor} · ${r.kills} kills</span></div>
      <em>${String(r.mode).toUpperCase()}</em><em>${ago(new Date(r.created_at).getTime())}</em>
      ${account.admin && r.username !== account.name && rank(r.role) < rank(account.role) ? `<button class="x" data-wipe="${escT(r.username)}" title="Delete their scores">${ic('close')}</button>` : '<span></span>'}</div>`).join('')
      : lb.busy ? '' : '<p class="gnote">No runs yet. Be the first on the board!</p>'}</div>`;
  el.querySelectorAll('[data-lbm]').forEach(b => b.onclick = () => { SND.ui(); lb.mode = b.dataset.lbm; loadBoard(); });
  $('lbRe').onclick = () => { SND.ui(); loadBoard(true); };
  el.querySelectorAll('[data-wipe]').forEach(b => b.onclick = async () => {
    const n = b.dataset.wipe; if (!confirm(`Delete all of ${n}'s leaderboard scores? This can't be undone.`)) return;
    try { await clearScores(n); lb.err = ''; } catch (e) { lb.err = e.message; } loadBoard(true);
  });
}
document.querySelectorAll('#lbTabs [data-lb]').forEach(b => b.onclick = () => { SND.ui(); lb.tab = b.dataset.lb; if (lb.tab === 'all') loadBoard(); else renderGlobalBoard(); });
// sends a finished run to the global board
function sendScore() {
  if (!account.user || score <= 0 || cheatRun || training || admOn()) return;
  submitScore({ score: Math.floor(score), floor: floorN, kills: stats.kills, secs: Math.round(runTime), mode: dailyRun ? 'daily' : diffKey }).then(() => { lb.at = 0; }).catch(() => { });
}
// the menu button, and your username in co-op
function renderAccount() {
  const b = $('acctBtn'); if (!b) return;
  b.classList.toggle('in', !!account.user); b.classList.toggle('out', !account.user);
  const nm = account.name || 'Signed in';
  b.title = account.user ? 'Your account' : 'Sign in to keep your progress online';
  b.innerHTML = account.user ? `<span class="av">${escH([...nm][0].toUpperCase())}</span><span class="tx"><b>${escH(nm)}${account.role ? ` <em>${ROLE_NAME[account.role]}</em>` : ''}</b><small${account.status === 'offline' ? ' class="off"' : ''}>${account.status === 'offline' ? 'Offline · will sync later' : account.syncedAt ? `Saved ${ago(account.syncedAt)}` : 'Syncing...'}</small></span>`
    : `<span class="av">${ic('login')}</span><span class="tx"><b>SIGN IN</b><small>Save your progress online</small></span>`;
  const n = $('mpName'); if (n) { if (account.name) n.value = account.name; n.readOnly = !!account.name; n.title = account.name ? 'Your username (sign out to change it)' : ''; }
  const pa = $('pauseAdmin'); if (pa) pa.hidden = !staff();
  const an = $('adminNav'); if (an) { an.hidden = !account.mod; if (!account.mod && an.classList.contains('sel')) document.querySelector('#mnav [data-panel="play"]').click(); }
  lb.at = 0; if ($('panel-board')?.classList.contains('on')) loadBoard(); else renderGlobalBoard();
}
function openAccount(note = '', who = '') {
  if (emailBox) return;
  const box = document.createElement('div'); box.className = 'savebox'; let mode = 'in', busy = false, sent = null; // sent: { email, pass } while a new account waits to be confirmed
  const close = () => box.remove();
  const draw = () => {
    if (account.user) {
      box.innerHTML = `<div class="savecard acctcard"><h3>Signed in as ${escH(account.name)}${account.role ? ` <em class="adm">${ROLE_NAME[account.role]}</em>` : ''}</h3>
        <p>Your progress saves to your account automatically. ${account.status === 'offline' ? 'Right now the account server can\'t be reached, so it will catch up when it can.' : account.syncedAt ? `Last saved online ${ago(account.syncedAt)}.` : ''}</p>
        ${staff() ? `<p class="acnote">Press <kbd>&#96;</kbd> in a run to open the ${account.admin ? "admin" : "tester"} panel.</p>` : account.mod ? `<p class="acnote">You are a moderator: open ADMIN in the menu to kick players.</p>` : ""}
        ${account.admin ? `<h3 class="tsh">Bug testers</h3><p class="acnote">Testers can open the <kbd>&#96;</kbd> panel in their runs too. Type a username to add one.</p>
        <div class="palsadd"><input id="tsName" maxlength="16" placeholder="Their username" spellcheck="false" autocomplete="off"><button class="go" id="tsAdd">${ic('plus')}MAKE TESTER</button></div>
        <p class="palsmsg" id="tsMsg"></p><div class="tslist" id="tsList"></div>` : ""}
        <div class="savebtns"><button class="go" id="acSync">${ic('save')}SAVE NOW</button><button class="go alt" id="acOut">${ic('exit')}SIGN OUT</button><button class="go ghost" id="acX">${ic('close')}CLOSE</button></div><p class="saveerr" id="acErr"></p></div>`;
      box.querySelector('#acSync').onclick = async () => { SND.ui(); setSync({ ...syncInfo(), sig: '' }); await (syncedFor === account.user?.id ? cloudPush() : cloudSync()); draw(); };
      box.querySelector('#acOut').onclick = async () => { SND.ui(); await leaveAccount(); close(); };
      if (account.admin) {
        const inp = box.querySelector('#tsName'), msg = box.querySelector('#tsMsg'), list = box.querySelector('#tsList');
        const show = async () => { try { const L = await testerList(); list.innerHTML = L.length ? L.map(n => `<span>${escH(n)}<button class="x" data-untest="${escH(n)}" title="Remove tester">${ic('close')}</button></span>`).join('') : '<small>No testers yet.</small>'; list.querySelectorAll('[data-untest]').forEach(b => b.onclick = async () => { SND.ui(); try { await setTester(b.dataset.untest, false); msg.textContent = `${b.dataset.untest} is not a tester any more.`; } catch (e) { msg.textContent = e.message; } show(); }); } catch (e) { list.innerHTML = '<small>Run the tester setup script in Supabase first.</small>'; } };
        const add = async () => { SND.ui(); try { await setTester(inp.value, true); msg.textContent = `${inp.value.trim().toLowerCase()} is a tester now.`; inp.value = ''; } catch (e) { msg.textContent = e.message; SND.deny(); } show(); };
        box.querySelector('#tsAdd').onclick = add; inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); }); show();
      }
    } else if (sent) {
      box.innerHTML = `<div class="savecard acctcard"><h3>Check your email</h3>
        <p>Open the confirmation link we sent to <b>${escH(sent.email)}</b>, then sign in. Look in spam too.</p>
        <p class="acnote">No email? If that address already has an account, sign in with it instead.</p>
        <div class="savebtns"><button class="go" id="acDone">${ic('check')}I'VE CONFIRMED IT</button><button class="go alt" id="acAgain">${ic('mail')}SEND AGAIN</button><button class="go ghost" id="acBack">${ic('back')}BACK</button><button class="go ghost" id="acX">${ic('close')}CLOSE</button></div><p class="saveerr" id="acErr"></p></div>`;
      const err = box.querySelector('#acErr');
      box.querySelector('#acDone').onclick = () => run(box.querySelector('#acDone'), () => signIn(sent.email, sent.pass).then(signedIn));
      box.querySelector('#acAgain').onclick = () => run(box.querySelector('#acAgain'), () => resendSignUp(sent.email).then(() => { err.textContent = 'Sent. It can take a minute.'; }));
      box.querySelector('#acBack').onclick = () => { SND.ui(); who = sent.email; sent = null; mode = 'in'; draw(); };
    } else {
      const up = mode === 'up';
      box.innerHTML = `<div class="savecard acctcard"><h3>${up ? 'Create an account' : 'Sign in'}</h3>
        <div class="seg-btn actabs"><button data-m="in" class="${up ? '' : 'sel'}">SIGN IN</button><button data-m="up" class="${up ? 'sel' : ''}">CREATE ACCOUNT</button></div>
        ${note ? `<p>${escH(note)}</p>` : ''}
        ${up ? '<label class="acf">Username<input id="acName" maxlength="16" autocomplete="nickname" spellcheck="false" placeholder="3 to 16 letters, numbers or _"></label>' : ''}
        <label class="acf">${up ? 'Email' : 'Email (or username, if you haven\'t added an email yet)'}<input id="acEmail" type="${up ? 'email' : 'text'}" maxlength="254" autocomplete="${up ? 'email' : 'username'}" autocapitalize="off" spellcheck="false" placeholder="name@example.com" value="${escH(who)}"></label>
        <label class="acf">Password<input id="acPass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'at least 6 characters' : ''}"></label>
        <p class="acnote">${up ? 'We send a link to your email to confirm it. Other players only see your username. There\'s no password reset yet, so pick one you\'ll remember (and don\'t reuse a password from another site). Your progress on this computer comes with you.' : 'Signing in brings your progress with you to any computer.'}</p>
        <div class="savebtns"><button class="go" id="acGo">${up ? `${ic('plus')}CREATE ACCOUNT` : `${ic('login')}SIGN IN`}</button><button class="go ghost" id="acX">PLAY WITHOUT AN ACCOUNT${ic('next')}</button></div><p class="saveerr" id="acErr"></p></div>`;
      box.querySelectorAll('[data-m]').forEach(t => t.onclick = () => { SND.ui(); who = box.querySelector('#acEmail').value; note = ''; mode = t.dataset.m; draw(); });
      const go = () => run(box.querySelector('#acGo'), async () => {
        const email = box.querySelector('#acEmail').value, pass = box.querySelector('#acPass').value;
        if (up) { sent = { email: await signUp(box.querySelector('#acName').value, email, pass), pass }; SND.code(); draw(); return; }
        try { await signIn(email, pass); } catch (e) { if (!e.unconfirmed) throw e; sent = { email: email.trim().toLowerCase(), pass }; draw(); return; }
        signedIn();
      });
      box.querySelector('#acGo').onclick = go;
      box.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
      setTimeout(() => box.querySelector(up ? '#acName' : '#acEmail')?.focus(), 50);
    }
    box.querySelector('#acX').onclick = () => { SND.ui(); close(); };
  };
  // one request at a time, with errors shown under the buttons
  const run = async (btn, job) => {
    if (busy) return; const err = box.querySelector('#acErr'), label = btn.textContent;
    busy = true; btn.textContent = 'ONE MOMENT...'; err.textContent = '';
    try { await job(); } catch (e) { err.textContent = e.message; SND.deny(); }
    btn.textContent = label; busy = false;
  };
  const signedIn = () => { SND.code(); renderAccount(); close(); startAccount(); if (!account.needsEmail) toast('SIGNED IN', `Hi, ${escH(account.name)}!`, 'Your progress now saves online', '👤'); };
  draw(); document.body.appendChild(box);
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown']) box.addEventListener(t, e => e.stopPropagation());
  box.onclick = e => { if (e.target === box) close(); };
}
$('acctBtn').onclick = () => { SND.ui(); openAccount(); };
async function leaveAccount() {
  await cloudPush(); await signOut(); syncedFor = null; Object.assign(adm, ADM_OFF); admApply(); renderAccount(); loadPals(); toast('SIGNED OUT', 'Your progress stays on this computer too', 'Sign in again any time', '👤');
}
function startAccount() { cloudSync(); pingNow(); loadPals(); checkEmailGate(); }
// ---------- everyone with an account needs an email ----------
// An older account with no real email gets a box it can't close (only signing out gets rid of it) until the link
// sent to the new address has been opened. It only appears on the menu, never in the middle of a run.
let emailBox = null, emailWanted = false, emailAsked = 0, emailCheck = 0;
async function checkEmailGate() {
  if (!account.user || !account.needsEmail) { emailWanted = false; return closeEmailGate(); }
  if (!emailWanted) {
    if (Date.now() - emailAsked < 60000) return;
    try { emailWanted = await confirmsEmail(); emailAsked = Date.now(); } catch (e) { return; } // offline: ask again later
  }
  if (emailWanted && !emailBox && state === 'menu' && account.needsEmail) openEmailGate();
}
// true (and shows the box) if you have to add an email before playing
function mustAddEmail() { if (!emailWanted || !account.needsEmail) return false; openEmailGate(); return true; }
function openEmailGate() {
  if (emailBox) return;
  if (NET.net.on) NET.leave(true);
  document.querySelectorAll('.savebox').forEach(b => { if (!b.querySelector('#useCloud')) b.remove(); });
  const box = emailBox = document.createElement('div'); box.className = 'emailbox';
  // nothing behind the box can be clicked or reached with Tab
  const frozen = [...document.body.children].filter(el => !el.inert); frozen.forEach(el => { el.inert = true; });
  box.thaw = () => frozen.forEach(el => { el.inert = false; });
  let busy = false, editing = !account.newEmail;
  const draw = (msg = '') => {
    box.innerHTML = `<div class="savecard acctcard" role="dialog" aria-modal="true"><h3>${editing ? 'Add your email' : 'Confirm your email'}</h3>
      ${editing ? `<p>Hi ${escH(account.name)}! Every account now needs an email. Add yours and confirm it to keep playing on this account. You'll sign in with it from now on.</p>
      <label class="acf">Email<input id="emNew" type="email" maxlength="254" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="name@example.com"></label>
      <p class="acnote">Other players only see your username.</p>
      <div class="savebtns"><button class="go" id="emSend">${ic('mail')}SEND CONFIRMATION</button>${account.newEmail ? `<button class="go alt" id="emBack">${ic('back')}BACK</button>` : ''}<button class="go ghost" id="emOut">${ic('exit')}SIGN OUT</button></div>`
      : `<p>Open the confirmation link we sent to <b>${escH(account.newEmail)}</b>. Look in spam too. This box closes by itself once it's confirmed.</p>
      <div class="savebtns"><button class="go" id="emDone">${ic('check')}I'VE CONFIRMED IT</button><button class="go alt" id="emAgain">${ic('mail')}SEND AGAIN</button><button class="go alt" id="emEdit">${ic('back')}DIFFERENT EMAIL</button><button class="go ghost" id="emOut">${ic('exit')}SIGN OUT</button></div>`}
      <p class="saveerr" id="emErr">${escH(msg)}</p></div>`;
    const on = (id, job) => { const b = box.querySelector(id); if (b) b.onclick = () => run(b, job); };
    const send = async () => { await changeEmail(box.querySelector('#emNew').value); editing = false; draw(); };
    on('#emSend', send);
    on('#emAgain', async () => { await changeEmail(account.newEmail); draw('Sent. It can take a minute.'); });
    on('#emDone', async () => { await pollEmail(); if (emailBox) draw('Not confirmed yet. Open the link in the email first.'); });
    on('#emOut', async () => { await leaveAccount(); emailWanted = false; closeEmailGate(); });
    const flip = (id, to) => { const b = box.querySelector(id); if (b) b.onclick = () => { SND.ui(); editing = to; draw(); }; };
    flip('#emEdit', true); flip('#emBack', false);
    const inp = box.querySelector('#emNew'); if (inp) { inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(box.querySelector('#emSend'), send); }); setTimeout(() => inp.focus(), 50); }
  };
  const run = async (btn, job) => {
    if (busy) return; SND.ui(); const label = btn.textContent;
    busy = true; btn.textContent = 'ONE MOMENT...'; box.querySelector('#emErr').textContent = '';
    try { await job(); } catch (e) { const err = box.querySelector('#emErr'); if (err) err.textContent = e.message; SND.deny(); }
    btn.textContent = label; busy = false;
  };
  draw(); document.body.appendChild(box);
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown']) box.addEventListener(t, e => e.stopPropagation());
  emailCheck = setInterval(() => { if (!document.hidden && !busy) pollEmail().catch(() => { }); }, 5000);
}
// has the link been opened? (maybe in another tab or on a phone)
async function pollEmail() {
  try { await refreshUser(); } catch (e) { if (!account.user) closeEmailGate(); throw e; }
  if (!account.user || account.needsEmail) return;
  emailWanted = false; closeEmailGate(); SND.code(); renderAccount();
  toast('EMAIL CONFIRMED', 'Thanks!', `Sign in with ${escH(account.email)} from now on`, '✓'); cloudSync();
}
function closeEmailGate() {
  if (!account.user) renderAccount(); // signed out while the box was up
  if (!emailBox) return;
  clearInterval(emailCheck); emailBox.thaw(); emailBox.remove(); emailBox = null;
}
setInterval(() => { if (account.needsEmail || emailBox) checkEmailGate(); }, 5000);
addEventListener('online', () => { if (account.user) resumeAccount().then(() => { renderAccount(); checkEmailGate(); }); });
renderAccount(); setInterval(renderAccount, 30000);
// opening a link from one of our emails: say how it went
finishLink().then(async link => {
  const ok = await resumeAccount(); renderAccount(); if (ok) startAccount();
  if (!link) return;
  if (link.error && !ok) openAccount(`That email link didn't work: ${link.error}`);
  else if (link.error) toast('EMAIL LINK', 'That link didn\'t work', escH(link.error), '✉');
  else if (link.message) toast('EMAIL LINK', 'Link accepted', escH(link.message), '✉');
  else if (link.signedIn) { if (!account.needsEmail) toast('EMAIL CONFIRMED', `Welcome, ${escH(account.name)}!`, 'Your progress saves online', '✓'); }
  else if (!ok) openAccount('Email confirmed. Sign in to carry on.', link.email);
  else toast('EMAIL CONFIRMED', 'Thanks!', escH(link.email), '✓');
});
// ---------- admin panel (the ` key in a run; only you and your bug testers can open it) ----------
// Pauses a solo run (in co-op the game keeps going, like the normal pause). Friends in co-op can't open it: it checks
// your role from your account, which only you can change in Supabase. Using anything here means the run won't count.
function flyStep(dt, p) {
  const d = new V3(), f = new V3(0, 0, -1).applyQuaternion(camera.quaternion), r = new V3(1, 0, 0).applyQuaternion(camera.quaternion);
  if (keys.KeyW) d.add(f); if (keys.KeyS) d.sub(f); if (keys.KeyD) d.add(r); if (keys.KeyA) d.sub(r);
  if (keys.Space) d.y += 1; if (keys.KeyC) d.y -= 1;
  if (d.lengthSq()) d.normalize().multiplyScalar(keys.ShiftLeft ? 34 : 16);
  player.vel.lerp(d, Math.min(1, dt * 10)); p.addScaledVector(player.vel, dt); p.y = Math.max(p.y, 0);
  player.onGround = false; player.sprinting = false; player.slideT = 0; player.wallT = 0; player.crouchOn = false;
}
// turn toward the head of the nearest bot you can see, within about 30 degrees of where you're already looking
function aimAssist(dt) {
  const eye = camera.position, f = new V3(0, 0, -1).applyQuaternion(camera.quaternion); let best = null, ba = .55;
  for (const b of bots) {
    if (!b.alive) continue; const h = b.eye(), to = h.clone().sub(eye), d = to.length(); if (d > 140 || d < .5) continue;
    const a = f.angleTo(to); if (a < ba && lineOfSight(eye, h)) { ba = a; best = h; }
  }
  if (!best) return;
  const to = best.clone().sub(eye).normalize(), ty = Math.atan2(-to.x, -to.z), tp = Math.asin(clamp(to.y, -1, 1)), k = Math.min(1, dt * 20);
  player.yaw += Math.atan2(Math.sin(ty - player.yaw), Math.cos(ty - player.yaw)) * k; player.pitch += (tp - player.pitch) * k;
}
const ADM_SW = [['god', 'God mode', 'Nothing can hurt you'], ['fly', 'Fly', 'WASD, Space up, C down, Shift fast. Goes through walls'], ['ammo', 'Infinite ammo', 'Never run out or reload'],
  ['auto', 'Auto-shoot', 'Fires while your crosshair is on a bot'], ['aim', 'Auto-aim', 'Locks onto the nearest bot’s head near your crosshair'], ['onehit', 'One-hit kills', 'Everything dies in one shot'],
  ['esp', 'Wallhack', 'See every bot through walls, with its health'], ['steady', 'No recoil', 'No kick, no spread, on any gun'], ['rapid', 'Rapid fire', 'Every gun fires 3x faster'],
  ['nocd', 'No cooldowns', 'Endless dashes, slams, grapples and double jumps'], ['jump', 'Super jump', 'Jump about 6x higher'], ['aura', 'Kill aura', 'Bots within 9 m drop dead'],
  ['freeze', 'Freeze bots', 'They stop moving and shooting'], ['ghost', 'Invisible', 'Bots can’t see you (they can still hear gunfire)'], ['slow', 'Slow motion', 'The whole game at half speed']];
let admBox = null, admWas = null, admTab = 'cheats', auraT = 0, espCv = null;
function admApply() { godmode = adm.god; ctx.ghost = adm.ghost; if (admOn()) cheatRun = true; }
// switches that need doing every frame
function admTick(dt) {
  if (adm.nocd) { player.dashCh = Math.max(player.dashCh, AB(player.ab, 'dash', 'charges') || 0); player.slamCd = player.grapCd = 0; if (!player.onGround) player.jumpsLeft = Math.max(player.jumpsLeft, 1); }
  if (adm.aura && (auraT -= dt) <= 0) {
    auraT = .15;
    for (const b of [...bots]) if (b.alive && b.pos.distanceTo(player.pos) < 9) {
      const c = b.center(); beam(camera.position.clone().setY(camera.position.y - .4), c, 0xff5fa2, .02, .12);
      damageBot(b, b.t.boss ? 400 : lethal(b), false, c, 'Kill aura', c.clone().sub(player.pos).normalize(), { force: 3 });
    }
  }
}
// Wallhack: a box around every bot drawn on top of the screen, with its name, health and distance
function drawEsp() {
  if (!adm.esp || state !== 'playing') { if (espCv) espCv.style.display = 'none'; return; }
  if (!espCv) { espCv = document.createElement('canvas'); espCv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40'; document.body.appendChild(espCv); }
  const W = innerWidth, H = innerHeight; if (espCv.width !== W || espCv.height !== H) { espCv.width = W; espCv.height = H; }
  espCv.style.display = ''; const g = espCv.getContext('2d'), v = new V3(); g.clearRect(0, 0, W, H); g.lineWidth = 2; g.font = '800 11px ui-monospace, monospace'; g.textAlign = 'center';
  for (const b of bots) {
    if (!b.alive) continue;
    v.copy(b.pos).setY(b.pos.y + 2.05 * b.t.scale).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.3 || Math.abs(v.y) > 1.3) continue;
    const x = (v.x + 1) / 2 * W, top = (1 - v.y) / 2 * H; v.copy(b.pos).project(camera);
    const h = Math.max(10, (1 - v.y) / 2 * H - top), w = h * .5, col = b.t.boss ? '#ffd34d' : b.elite ? '#b388ff' : '#ff5fa2';
    g.strokeStyle = col; g.strokeRect(x - w / 2, top, w, h);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x - w / 2, top - 5, w, 3); g.fillStyle = col; g.fillRect(x - w / 2, top - 5, w * clamp(b.hp / (b.maxHp || b.t.hp), 0, 1), 3);
    g.fillText(`${b.t.name} · ${Math.ceil(b.hp)} · ${Math.round(b.pos.distanceTo(player.pos))}m`, x, top - 9);
  }
}
// the backtick key: on Australian/UK Mac keyboards it sits next to Z and the browser calls it IntlBackslash, not Backquote
const admKey = e => e.code === 'Backquote' || e.code === 'IntlBackslash' || e.key === '`' || e.key === '~';
function closeAdmin() {
  if (!admBox) return; admBox.remove(); admBox = null;
  if (state === 'paused' && admWas === 'playing') { state = 'playing'; clock.getDelta(); lock(); }
}
function openAdmin() {
  if (admBox) return closeAdmin();
  if (!staff()) return;
  admWas = state; if (state === 'playing') { stopCooking(); state = 'paused'; trigger = adsHeld = false; for (const k in keys) keys[k] = false; document.exitPointerLock?.(); }
  admBox = document.createElement('div'); admBox.className = 'savebox admbox';
  const guest = NET.isGuest(), guns = WEAPONS.filter(w => w.admin || w.secret), tabs = [['cheats', 'Cheats'], ['guns', 'Admin guns'], ['world', 'Spawn & world']];
  if (account.admin) tabs.push(['people', 'Testers']);
  const solo = coop ? 'disabled title="Solo runs only"' : '', hostOnly = guest ? 'disabled title="Only the host can spawn bots"' : '';
  const body = () => {
    if (admTab === 'guns') return `<p class="acnote">Click one to put it in your hands. They never show up in the shop or the armory.</p>
      <div class="admgrid">${guns.map(w => `<button class="admsw${cur()?.base.id === w.id ? ' on' : ''}" data-gun="${w.id}"><b>${w.name}</b><span>${w.desc}</span></button>`).join('')}</div>`;
    if (admTab === 'world') return `<div class="savebtns admacts">
        <button class="go" data-act="cash">+ $10,000</button><button class="go alt" data-act="heal">FULL HEAL</button><button class="go alt" data-act="maxab">MAX ALL ABILITIES</button>
        <button class="go alt" data-act="tp">TELEPORT TO CROSSHAIR</button><button class="go alt" data-act="kill">KILL ALL BOTS</button></div>
      <h3 class="tsh">Spawn bots</h3><div class="savebtns admacts">
        <button class="go alt" data-spawn="boss" ${hostOnly}>BOSS</button><button class="go alt" data-spawn="titan" ${hostOnly}>TITAN</button>
        <button class="go alt" data-spawn="horde" ${hostOnly}>HORDE OF 12</button><button class="go alt" data-spawn="elite" ${hostOnly}>5 ELITES</button></div>
      <h3 class="tsh">Floors</h3><div class="palsadd"><input id="admFloor" type="number" min="1" max="200" value="${floorN + 1}"><button class="go" data-act="goto" ${solo}>GO TO FLOOR</button><button class="go alt" data-act="floor" ${solo}>NEXT FLOOR</button></div>`;
    if (admTab === 'people') return `<p class="acnote">Testers get this panel too, but not this tab. You can also manage everyone from the ADMIN page in the menu.</p>
      <div class="palsadd"><input id="tsName" maxlength="16" placeholder="Their username" spellcheck="false" autocomplete="off"><button class="go" id="tsAdd">${ic('plus')}MAKE TESTER</button></div>
      <p class="palsmsg" id="tsMsg"></p><div class="tslist" id="tsList"><small>Loading...</small></div>`;
    return `<div class="admgrid">${ADM_SW.map(([k, n, d]) => `<button class="admsw${adm[k] ? ' on' : ''}" data-sw="${k}"><b>${n}</b><span>${d}</span></button>`).join('')}
        <button class="admsw${adm.speed > 1 ? ' on' : ''}" data-speed><b>Speed ×${adm.speed}</b><span>Click to change (×1 to ×5)</span></button></div>`;
  };
  const draw = () => {
    admBox.innerHTML = `<div class="savecard admcard"><h3>${account.admin ? 'Admin' : 'Tester'} panel <em class="adm">${account.admin ? 'ADMIN' : 'TESTER'}</em></h3>
      <p class="acnote">Press \` or Esc to close. Anything you use here means this run will not give XP, badges or leaderboard spots.${coop ? ' In co-op only you get these, and the game keeps going while this is open.' : ''}</p>
      <div class="admtabs">${tabs.map(([k, n]) => `<button class="${admTab === k ? 'sel' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      ${body()}
      <div class="savebtns admacts"><button class="go ghost" data-act="off">ALL CHEATS OFF</button><button class="go ghost" data-act="close">CLOSE</button></div></div>`;
    admBox.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { admTab = b.dataset.tab; SND.ui(); draw(); });
    admBox.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { adm[b.dataset.sw] = !adm[b.dataset.sw]; admApply(); SND.click(); draw(); });
    admBox.querySelector('[data-speed]')?.addEventListener('click', () => { adm.speed = adm.speed >= 5 ? 1 : adm.speed + 1; admApply(); SND.click(); draw(); });
    admBox.querySelectorAll('[data-gun]').forEach(b => b.onclick = () => { giveSecret(b.dataset.gun); cheatRun = true; SND.code(); toast('ADMIN GUN', byId(b.dataset.gun).name, 'In your hands now', '🛠'); draw(); });
    admBox.querySelectorAll('[data-spawn]').forEach(b => b.onclick = () => {
      if (guest) return; cheatRun = true; SND.ui(); const k = b.dataset.spawn, taken = [];
      const one = (type, o = {}) => { const x = new Bot(type, spawnPoint(taken), o); taken.push(x.pos.clone()); bots.push(x); };
      if (k === 'boss' || k === 'titan') one(k); else if (k === 'elite') for (let i = 0; i < 5; i++) one(['grunt', 'heavy', 'brawler', 'stalker', 'phantom'][i], { elite: true });
      else { const kinds = Object.keys(TYPES).filter(t => !['boss', 'titan', 'hydra'].includes(t) && !TYPES[t].boss); for (let i = 0; i < 12; i++) one(kinds[Math.floor(Math.random() * kinds.length)]); }
      toast('ADMIN', 'Bots spawned', '', '🛠');
    });
    admBox.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      const a = b.dataset.act; SND.ui();
      if (a === 'close') return closeAdmin();
      if (a === 'off') { Object.assign(adm, ADM_OFF); admApply(); return draw(); }
      cheatRun = true;
      if (a === 'cash') { player.cash += 10000; toast('ADMIN', '+$10,000', '', '🛠'); }
      if (a === 'heal') { player.hp = player.maxHp; player.armor = Math.max(player.armor, 100); player.nades = Math.max(player.nades, 4); toast('ADMIN', 'Full health', '', '🛠'); }
      if (a === 'maxab') { for (const x of ABILITIES) player.ab[x.id] = abMax(x); player.dashCh = AB(player.ab, 'dash', 'charges'); lastAbKey = ''; toast('ADMIN', 'Every ability maxed', '', '🛠'); }
      if (a === 'tp') {
        const f = new V3(0, 0, -1).applyQuaternion(camera.quaternion), hit = rayWall(camera.position, f, 300);
        const t = hit ? hit.point.clone().addScaledVector(hit.normal, .6) : camera.position.clone().addScaledVector(f, 60);
        if (hit && hit.normal.y > .5) t.y = hit.point.y + .05; else t.y = Math.max(0, t.y - player.eyeH);
        player.pos.copy(t); player.vel.set(0, 0, 0); closeAdmin(); return;
      }
      if (a === 'kill') { let n = 0; for (const x of [...bots]) if (x.alive) { x.damage(Math.min(lethal(x), 20000), { dir: new V3(0, 1, 0) }); n++; } toast('ADMIN', `${n} bots down`, guest ? 'The host still checks every hit' : '', '🛠'); }
      if ((a === 'floor' || a === 'goto') && !coop) {
        const to = a === 'floor' ? floorN + 1 : clamp(Math.round(+admBox.querySelector('#admFloor').value || 1), 1, 200);
        closeAdmin(); show('pause', false); clearBots(); wave = (to - 1) * 5; breakT = 0; nextWave(); return;
      }
    });
    if (admTab === 'people') {
      const inp = admBox.querySelector('#tsName'), msg = admBox.querySelector('#tsMsg'), list = admBox.querySelector('#tsList');
      const show = async () => { try { const L = await testerList(); if (!admBox) return; list.innerHTML = L.length ? L.map(n => `<span>${escH(n)}<button class="x" data-untest="${escH(n)}" title="Remove tester">${ic('close')}</button></span>`).join('') : '<small>No testers yet.</small>'; list.querySelectorAll('[data-untest]').forEach(b => b.onclick = async () => { SND.ui(); try { await setTester(b.dataset.untest, false); msg.textContent = `${b.dataset.untest} is not a tester any more.`; } catch (e) { msg.textContent = e.message; } show(); }); } catch (e) { list.innerHTML = '<small>Run the tester setup script in Supabase first (see the ADMIN page in the menu).</small>'; } };
      const add = async () => { try { await setTester(inp.value, true); msg.textContent = `${inp.value.trim().toLowerCase()} is a tester now.`; inp.value = ''; SND.code(); } catch (e) { msg.textContent = e.message; SND.deny(); } show(); };
      admBox.querySelector('#tsAdd').onclick = add; inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); }); show();
    }
  };
  draw(); document.body.appendChild(admBox);
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup']) admBox.addEventListener(t, e => { e.stopPropagation(); if (t === 'keydown' && (admKey(e) || e.code === 'Escape')) { e.preventDefault(); closeAdmin(); } });
}
// ---------- the ADMIN page in the menu (moderators and up): every account, ranks, kicking ----------
// What each rank sees: moderators can kick; admins can also join co-op games and hand out moderator / tester;
// the owner can also make admins. The database checks all of it again, so the buttons are only a convenience.
let admPage = { rows: [], ready: true, live: true, setup: true, err: '', msg: '', q: '', mins: 10 };
const KICK_MINS = [[10, '10 min'], [60, '1 hour'], [1440, '1 day'], [10080, '1 week']];
const leftTxt = t => { const m = Math.max(1, Math.ceil((new Date(t).getTime() - Date.now()) / 60000)); return m < 60 ? m + ' min' : m < 2880 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' days'; };
async function loadAdminPage() {
  if (!account.mod) return renderAdminPage();
  try { const r = await playerList(); admPage.rows = r.rows; admPage.ready = r.ready; admPage.live = r.live; admPage.setup = r.live && (!r.rows.length || 'muted_until' in r.rows[0]); admPage.err = ''; }
  catch (e) { admPage.err = 'Could not load the player list. Check your internet and try again.'; }
  renderAdminPage();
}
setInterval(() => { if (state === 'menu' && account.mod && $('panel-admin')?.classList.contains('on')) loadAdminPage(); }, 20000);
function renderAdminPage() {
  const el = $('adminBody'); if (!el) return;
  if (!account.mod) { el.innerHTML = '<p class="gnote">Only staff can see this page.</p>'; return; }
  const P = admPage, q = P.q.toLowerCase(), my = rank(account.role), kicked = r => r.kicked_until && new Date(r.kicked_until).getTime() > Date.now(), muted = r => r.muted_until && new Date(r.muted_until).getTime() > Date.now();
  const nOn = P.rows.filter(online).length, nStaff = P.rows.filter(r => roleOf(r)).length;
  const rows = P.rows.filter(r => !q || r.username.includes(q)).sort((a, b) => (online(b) - online(a)) || (!!(online(b) && b.room) - !!(online(a) && a.room)));
  const note = r => (muted(r) && !kicked(r) ? `🔇 Muted · ${leftTxt(r.muted_until)} left · ` : "") + note0(r), note0 = r => kicked(r) ? `Kicked · ${leftTxt(r.kicked_until)} left`
    : !P.live ? `joined ${ago(new Date(r.created_at).getTime())}` : online(r) ? (r.room ? 'Online · hosting a co-op game' : 'Online · playing solo or in the menu') : r.last_seen ? `Last on ${ago(new Date(r.last_seen).getTime())}` : `joined ${ago(new Date(r.created_at).getTime())}`;
  // the ranks you may give: anything below your own
  const gives = [['', 'Player'], ['tester', 'Tester'], ['mod', 'Moderator'], ['admin', 'Admin']].slice(0, P.setup ? 4 : 2).filter(([k]) => rank(k) < my);
  const below = r => r.username !== account.name && rank(roleOf(r)) < my;
  el.innerHTML = `${P.setup ? '' : account.role === 'owner' ? sqlBox('One step first, for ranks, kicking and the global leaderboard:') : '<p class="gnote">The owner still needs to run the new setup script. Until then some buttons will not work.</p>'}
    <p class="palsmsg${P.err ? ' err' : ''}">${escH(P.err || P.msg)}</p>
    <div class="palsadd admtools"><input id="admQ" maxlength="16" placeholder="Search usernames" spellcheck="false" autocomplete="off" value="${escT(P.q)}">
      <label class="kicklen">Kick / mute for <select id="admMins">${KICK_MINS.map(([m, t]) => `<option value="${m}"${m === P.mins ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      <button class="go alt" id="admRe">${ic('refresh')}REFRESH</button></div>
    <h3>${P.rows.length} players${P.live ? ` · ${nOn} online` : ''} · ${nStaff} staff · you are ${ROLE_NAME[account.role]}</h3>
    <div class="palslist admlist">${rows.length ? rows.map(r => `<div class="pal${P.live && online(r) ? ' on' : ''}${kicked(r) ? ' kicked' : ''}"><i class="dot"></i><b>${escT(r.username)}</b><span>${roleTag(roleOf(r))} ${note(r)}</span>
      <div class="admbtns">${account.admin && P.live && online(r) && r.room && r.username !== account.name ? `<button class="buy" data-join="${escT(r.room)}">JOIN</button>` : ''}
      ${account.admin && below(r) ? `<select data-rank="${escT(r.username)}" title="Rank">${gives.map(([k, t]) => `<option value="${k}"${(roleOf(r) || '') === k ? ' selected' : ''}>${t}</option>`).join('')}</select>` : ''}
      ${below(r) && !kicked(r) ? muted(r) ? `<button class="buy" data-mute="${escT(r.username)}" data-m="0">UNMUTE</button>` : `<button class="x" data-mute="${escT(r.username)}" ${P.setup ? "" : "disabled"}>MUTE</button>` : ""}
      ${below(r) ? kicked(r) ? `<button class="buy" data-kick="${escT(r.username)}" data-m="0">UNKICK</button>` : `<button class="x" data-kick="${escT(r.username)}" ${P.setup ? '' : 'disabled'}>KICK</button>` : ''}</div></div>`).join('') : '<p class="gnote">Nobody matches that.</p>'}</div>
    <p class="gnote">KICK sends them back to the menu within a minute (out of any co-op game too) and stops them starting a run until the time is up. MUTE stops their co-op chat messages getting through.${account.admin ? ' JOIN only works on people hosting a co-op game.' : ''}</p>`;
  const inp = $('admQ');
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown']) inp.addEventListener(t, e => e.stopPropagation());
  inp.addEventListener('input', () => { P.q = inp.value; renderAdminPage(); const i = $('admQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); });
  $('admMins').onchange = e => { P.mins = +e.target.value; };
  $('admRe').onclick = () => { SND.ui(); P.msg = ''; loadAdminPage(); };
  wireCopy(el, () => { P.msg = 'Copied. Paste it into the Supabase SQL Editor and press Run, then press REFRESH here.'; renderAdminPage(); });
  el.querySelectorAll('[data-join]').forEach(b => b.onclick = () => {
    SND.ui(); document.querySelector('#mnav [data-panel="friends"]').click();
    if (NET.net.on) NET.leave(true);
    $('mpJoinCode').value = b.dataset.join; NET.join(b.dataset.join, mpName());
  });
  el.querySelectorAll('[data-rank]').forEach(s => s.onchange = async () => {
    const n = s.dataset.rank, to = s.value;
    try { if (P.setup) await giveRole(n, to); else await setTester(n, to === 'tester'); P.msg = `${n} is ${to ? 'a ' + ({ tester: 'tester', mod: 'moderator', admin: 'admin' })[to] : 'a normal player'} now. It shows up for them next time they sign in or reload.`; P.err = ''; }
    catch (e) { P.err = e.message; P.msg = ''; }
    loadAdminPage();
  });
  el.querySelectorAll('[data-mute]').forEach(b => b.onclick = async () => {
    SND.ui(); const n = b.dataset.mute, m = b.dataset.m === '0' ? 0 : P.mins;
    try { await mutePlayer(n, m); P.msg = m ? `${n} is muted in chat for ${KICK_MINS.find(k => k[0] === m)?.[1] || m + ' min'}.` : `${n} can chat again.`; P.err = ''; } catch (e) { P.err = e.message; P.msg = ''; }
    loadAdminPage();
  });
  el.querySelectorAll('[data-kick]').forEach(b => b.onclick = async () => {
    SND.ui(); const n = b.dataset.kick, m = b.dataset.m === '0' ? 0 : P.mins;
    if (m && !confirm(`Kick ${n} for ${KICK_MINS.find(k => k[0] === m)?.[1] || m + ' min'}?`)) return;
    try { await kickPlayer(n, m); P.msg = m ? `${n} is kicked. They'll be sent to the menu within a minute.` : `${n} can play again.`; P.err = ''; } catch (e) { P.err = e.message; P.msg = ''; }
    loadAdminPage();
  });
}
// ---------- friends ----------
// The Friends page: add people by username, accept requests, see who's online and join their co-op game in one click.
// While you're signed in, the game tells the server you're on about every 45 seconds (plus your co-op code if hosting).
let pals = [], palsErr = '', palsMsg = '';
const ONLINE_MS = 120000, online = f => !!f.last_seen && Date.now() - new Date(f.last_seen).getTime() < ONLINE_MS;
// Being kicked: the ping answers with when you can play again. Until then you're sent to the menu, out of any
// co-op game, and can't start a run. (The database also hides your co-op code while you're kicked.)
let kickedUntil = 0, kickBox = null;
async function pingNow() {
  if (!account.user) return;
  let k; try { k = await ping(NET.net.on && NET.net.host ? NET.net.code : null); } catch (e) { return; }
  const t = typeof k === 'string' ? new Date(k).getTime() : 0;
  if (t > Date.now()) beKicked(t); else if (kickedUntil) unKick();
}
const isKicked = () => kickedUntil > Date.now();
function beKicked(t) {
  kickedUntil = t;
  if (state === 'shop') closeShop();
  if (state !== 'menu') toMenu();
  if (NET.net.on) NET.leave(true);
  showKick();
}
function showKick() {
  if (!kickBox) { kickBox = document.createElement('div'); kickBox.className = 'kickbox'; document.body.appendChild(kickBox); }
  kickBox.innerHTML = `<div class="savecard"><h3>You were kicked</h3><p>A moderator removed you from the game. You can play again in <b>${leftTxt(kickedUntil)}</b>.</p><p class="acnote">If you think this was a mistake, talk to the owner.</p></div>`;
}
function unKick() { kickedUntil = 0; kickBox?.remove(); kickBox = null; toast('WELCOME BACK', 'You can play again', '', '✓'); }
setInterval(() => { if (!kickedUntil) return; if (!isKicked()) return pingNow(); showKick(); if (NET.net.on) NET.leave(true); }, 15000);
setInterval(pingNow, 45000);
async function loadPals() {
  if (!account.user) { pals = []; palsErr = palsMsg = ''; return renderPals(); }
  try { pals = await friendList(); palsErr = ''; } catch (e) { palsErr = 'Could not load your friends. If this keeps happening, the friends setup script may not have been run in Supabase yet.'; }
  renderPals();
}
function renderPals() {
  const el = $('palsBody'), nav = $('palsNav'); if (!el) return;
  const req = pals.filter(f => !f.accepted && f.incoming), sent = pals.filter(f => !f.accepted && !f.incoming);
  const fr = pals.filter(f => f.accepted).sort((a, b) => (online(b) - online(a)) || a.username.localeCompare(b.username));
  if (nav) nav.innerHTML = `<i>${ic('friends')}</i><span>FRIENDS${req.length ? ` <em class="navbadge">${req.length}</em>` : ''}<small>Who is online</small></span>`;
  const mb = $('menuBadge'); if (mb) { mb.hidden = !req.length; mb.textContent = req.length; } // friend requests show on the ☰ button too
  if (!account.user) {
    el.innerHTML = `<div class="palsout"><p>Sign in to add friends and see when they're online.</p><button class="go" id="palsIn">${ic('login')}SIGN IN</button></div>`;
    $('palsIn').onclick = () => { SND.ui(); openAccount(); }; return;
  }
  const row = (f, note, btns) => `<div class="pal${online(f) && f.accepted ? ' on' : ''}"><i class="dot"></i><b>${escH(f.username)}</b><span>${escH(note)}</span>${btns}</div>`;
  el.innerHTML = `<div class="palsadd"><input id="palsName" maxlength="16" placeholder="Their username" spellcheck="false" autocomplete="off"><button class="go" id="palsGo">${ic('plus')}ADD FRIEND</button></div>
    <p class="palsmsg${palsErr ? ' err' : ''}">${escH(palsErr || palsMsg)}</p>
    ${req.length ? `<h3>Friend requests</h3><div class="palslist">${req.map(f => row(f, 'wants to be friends', `<button class="buy" data-acc="${escH(f.id)}">ACCEPT</button><button class="x" data-rm="${escH(f.id)}" title="Decline">${ic('close')}</button>`)).join('')}</div>` : ''}
    <h3>Friends${fr.length ? ` · ${fr.filter(online).length} online` : ''}</h3>
    <div class="palslist">${fr.length ? fr.map(f => row(f, online(f) ? (f.room ? 'Online · hosting a co-op game' : 'Online') : f.last_seen ? `Last on ${ago(new Date(f.last_seen).getTime())}` : 'Not on yet',
      `${online(f) && f.room ? `<button class="buy" data-join="${escH(f.room)}">JOIN</button>` : ''}<button class="x" data-rm="${escH(f.id)}" title="Remove friend">${ic('close')}</button>`)).join('') : '<p class="gnote">No friends yet. Add someone by their username above.</p>'}</div>
    ${sent.length ? `<h3>Waiting for them to accept</h3><div class="palslist">${sent.map(f => row(f, 'request sent', `<button class="x" data-rm="${escH(f.id)}" title="Cancel request">${ic('close')}</button>`)).join('')}</div>` : ''}`;
  const inp = $('palsName');
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown']) inp.addEventListener(t, e => e.stopPropagation());
  const add = async () => { try { palsMsg = await addFriend(inp.value); palsErr = ''; SND.code(); } catch (e) { palsErr = e.message; palsMsg = ''; SND.deny(); } await loadPals(); };
  $('palsGo').onclick = add; inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  el.querySelectorAll('[data-acc]').forEach(b => b.onclick = async () => { SND.ui(); try { await acceptFriend(b.dataset.acc); palsMsg = 'Friend added!'; palsErr = ''; } catch (e) { palsErr = 'Could not accept that. Try again.'; } loadPals(); });
  el.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { SND.ui(); try { await removeFriend(b.dataset.rm); palsMsg = ''; } catch (e) { palsErr = 'Could not remove that. Try again.'; } loadPals(); });
  el.querySelectorAll('[data-join]').forEach(b => b.onclick = () => {
    SND.ui(); document.querySelector('#mnav [data-panel="friends"]').click();
    if (NET.net.on) NET.leave(true);
    $('mpJoinCode').value = b.dataset.join; NET.join(b.dataset.join, mpName());
  });
}
setInterval(() => { if (state === 'menu' && $('panel-pals')?.classList.contains('on')) loadPals(); }, 20000); renderPals();
function renderSettings(host) {
  const range = (k, label, min, max, step) => `<div class="set"><span>${label}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${getS(k)}"><output>${FMT[k](getS(k))}</output></div>`;
  const choice = (k, label, opts) => `<div class="set"><span>${label}</span><div class="seg-btn">${opts.map(([v, n]) => `<button data-k="${k}" data-v="${v}" class="${String(getS(k)) === String(v) ? 'sel' : ''}">${n}</button>`).join('')}</div><span></span></div>`;
  const onoff = (k, label) => { const on = String(getS(k)) === 'true';
    return `<div class="set"><span>${label}</span><div><button class="switch${on ? ' on' : ''}" data-k="${k}" data-v="${!on}" role="switch" aria-checked="${on}" aria-label="${label}" title="${on ? 'On' : 'Off'}"></button></div><span></span></div>`; };
  const swatches = (k, label, cols, custom) => `<div class="set"><span>${label}</span><div class="swatches">${cols.map(c => `<button class="sw${getS(k) === c ? ' sel' : ''}" data-k="${k}" data-v="${c}" style="--c:${c}" title="${c}"></button>`).join('')}${custom ? `<label class="sw pick" title="Custom colour"><input type="color" data-color="${k}" value="${getS(k)}"></label>` : ''}</div><span></span></div>`;
  const tabs = [['game', 'Game'], ['controls', 'Keybinds'], ['hud', 'HUD'], ['graphics', 'Graphics'], ['crosshair', 'Crosshair'], ['audio', 'Audio']];
  // one tab's rows (setTab is shadowed so the same code can build any tab)
  const tabBody = setTab => { let body = '';
  if (setTab === 'game') body =range('sens', 'Mouse sensitivity', .2, 3, .05) + range('adsSens', 'Aim sensitivity', .3, 1.5, .05) + range('padSens', 'Controller look', .3, 2.5, .05) + onoff('invertY', 'Invert look')
    + choice('toggleAds', `Aim (${keyLabel('aim')})`, [[false, 'Hold'], [true, 'Toggle']]) + choice('crouchHold', `Crouch (${keyLabel('crouch')})`, [[false, 'Toggle'], [true, 'Hold']]) + range('fov', 'Field of view', 65, 110, 1)
    + range('bob', 'Weapon bob', 0, 1, .05) + range('wobble', 'Weapon wobble', 0, 2, .05) + onoff('shake', 'Screen shake') + range('hurtFx', 'Damage flash', 0, 1, .05) + `<p class="shelp">How strongly the screen flashes red when you get hit. Lower it if it's too much.</p>`
    + `<div class="set"><span>Your save</span><div class="savebtns"><button class="go" data-save="export"><span class="gol">${ic('download')}EXPORT SAVE</span></button><button class="go alt" data-save="import"><span class="gol">${ic('upload')}IMPORT SAVE</span></button></div><span></span></div><p class="shelp">Moves everything (levels, skins, badges, settings, keybinds and a run in progress) to another site or laptop. Export copies a save code and downloads a save file; Import takes either.</p>`;
  else if (setTab === 'hud') body = (FONTS.forEach(loadFont), `<div class="set"><span>Font</span><div class="seg-btn fontpick">${FONTS.map(f => `<button data-k="font" data-v="${f[0]}" class="${(settings.font || 'futura') === f[0] ? 'sel' : ''}" style='font-family:${fontFam(f)}'>${f[1]}</button>`).join('')}</div><span></span></div><p class="shelp">Changes every menu and the HUD straight away. Futura only exists on Macs; the others look the same on every computer.</p>`) + range('hud', 'HUD size', .75, 1.25, .05) + onoff('minimap', 'Minimap') + `<p class="shelp">M still opens the full map when it's off.</p>`
    + onoff('killfeed', 'Kill feed') + onoff('toasts', 'Pop-ups') + `<p class="shelp">Achievement and unlock banners at the top of the screen.</p>`
    + onoff('dmgNums', 'Damage numbers') + onoff('hitmarkers', 'Hit markers') + swatches('hmColor', 'Hit marker colour', HM_COLORS) + onoff('fps', 'FPS counter');
  else if (setTab === 'graphics') body = choice('quality', 'Quality', [['potato', 'Potato'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['ultra', 'Ultra'], ['superultra', 'SUPER ULTRA'], ...(settings.customQ ? [['custom', 'Custom']] : [])]) + `<p class="shelp">${settings.quality === 'custom' ? customNote() : QUALITY_NOTE[settings.quality]}</p>`
    + `<div class="set"><span>Auto-tune</span><div><button class="go benchbtn" data-bench="1">${settings.customQ ? 'RE-TEST' : 'TEST'} THIS ${IS_MAC ? 'MAC' : 'COMPUTER'} &amp; BUILD CUSTOM</button></div><span></span></div><p class="shelp">${state === 'menu' ? 'Takes 15 to 60 seconds. It tries the settings one by one on the menu with extra bots, and keeps the best picture your screen can keep up with. Press Esc to stop.' : 'Quit to the main menu to run the test.'}</p>`
    + choice('res', 'Resolution', [['auto', 'Preset'], [50, '50%'], [67, '67%'], [75, '75%'], [85, '85%'], [100, '100%']]) + `<p class="shelp">How much of your screen's real resolution the game draws. 100% is pin-sharp but heaviest. Now drawing at ${renderPct()}%.</p>`
    + choice('sharpen', 'Sharpen', [[0, 'Off'], [0.2, 'Low'], [0.35, 'Medium'], [0.6, 'High']]) + `<p class="shelp">Crisps up the picture. Almost free. Not used on Potato or Low.</p>`
    + onoff('autoRes', 'Auto resolution') + `<p class="shelp">Lowers the resolution a little (never below 75%) when the game gets slow, so it stays smooth.</p>`
    + `<div class="bindgrp">Ray tracing</div>`
    + choice('rt', 'Ray tracing', [['auto', 'Preset'], ['off', 'Off'], ['perf', 'Performance'], ['quality', 'Quality'], ['max', 'Max']])
    + `<p class="shelp">${post.enabled ? `Traces rays through the scene for soft shadows in every corner, light that bounces colour off nearby walls, and reflections, smoothed over a few frames. Performance and Quality work at half resolution; Max at full. Preset turns it on at Max for Super Ultra. ${post.rt ? `Now: ${['', 'Performance', 'Quality', 'Max'][post.rt]}.` : 'Now: off.'}` : 'Needs Medium graphics or higher.'}</p>`
    + onoff('rtRefl', 'Ray-traced reflections') + onoff('sunRays', 'Sun rays') + `<p class="shelp">Reflections make floors, metal and wet ground mirror what's around them. Sun rays stream through gaps when you look toward the sun. Both only work while ray tracing is on.</p>`
    + choice('mblur', 'Motion blur', [['off', 'Off'], ['low', 'Low'], ['high', 'High']]) + `<p class="shelp">Smears the world a little when you turn fast. Your gun stays sharp.</p>`
    + `<div class="bindgrp">Effects</div>`
    + onoff('bloom', 'Glow (bloom)') + onoff('vignette', 'Vignette') + onoff('grain', 'Film grain') + choice('blood', 'Blood', allowed('blood', [['red', 'Red'], ['oil', 'Oil'], ['paint', 'Paint'], ['off', 'Off']]))
    + choice('gore', 'Gore', allowed('gore', [['bath', 'Bloodbath'], ['extreme', 'Over the top'], ['normal', 'Normal']]))
    + choice('fpsCap', 'Frame rate', [['0', 'Monitor (smoothest)'], ['uncapped', 'Unlimited'], ['240', '240'], ['144', '144'], ['120', '120'], ['60', '60'], ['30', '30']])
    + `<p class="shelp">Monitor draws one frame per screen refresh, which is the smoothest. Unlimited draws as many as it can, so the counter goes higher, but the extra frames never reach your screen and motion can look uneven.</p>`;
  else if (setTab === 'controls') {
    let g = '';
    for (const [id, label, , , grp] of ACTIONS) {
      if (grp !== g) { body += `<div class="bindgrp">${grp}</div>`; g = grp; }
      const changed = settings.binds[id] !== undefined && settings.binds[id] !== ACTIONS.find(a => a[0] === id)[3];
      body += `<div class="set"><span>${label}</span><button class="bindbtn${changed ? ' chg' : ''}" data-bind="${id}">${keyLabel(id)}</button><span></span></div>`;
    }
    body += `<p class="shelp wide">Click an action, then press a key or mouse button. Esc cancels, Backspace clears it. Picking a key that's already used swaps the two. Esc always pauses, and some browser shortcuts (like Ctrl + W) can't be used. Controllers have their own layout.</p>
      <div class="setfoot"><span></span><button class="x" data-bindreset>RESET KEYBINDS</button></div>`;
  }
  else if (setTab === 'audio') body = range('vol', 'Master volume', 0, 1, .05) + range('music', 'Music', 0, 1, .05)
    + choice('spatial', '3D audio', [['hrtf', 'Headphones'], ['speakers', 'Speakers']]) + `<p class="shelp">Enemy shots, footsteps and explosions come from where they really are. Headphones mode also tells front from behind and above from below. Sounds behind walls are muffled.</p>`;
  else body = `<div class="xhed"><div class="xprev"><div class="xprev-ch"></div><span>LIVE PREVIEW</span></div>
      <div><div class="lbl" style="margin-bottom:6px">Presets</div><div class="seg-btn">${Object.keys(XH_PRESETS).map(p => `<button data-preset="${p}">${p}</button>`).join('')}</div></div></div>`
    + choice('xh.style', 'Style', XH_STYLES) + swatches('xh.color', 'Colour', XH_COLORS, true)
    + range('xh.size', 'Length', 1, 20, .5) + range('xh.thick', 'Thickness', .5, 6, .5) + range('xh.gap', 'Gap', 0, 20, .5) + range('xh.opacity', 'Opacity', .1, 1, .05)
    + onoff('xh.outline', 'Outline') + onoff('xh.dot', 'Centre dot') + onoff('xh.dynamic', 'Spread with recoil') + onoff('xh.enemyRed', 'Red over enemies')
    + `<div class="set"><span>Share code</span><div class="codebox"><input id="xhCode" value="${crosshairCode(settings.xh)}" readonly style="width:100%;text-transform:none"><button data-xh="copy">COPY</button></div><span></span></div>
       <div class="set"><span>Load code</span><div class="codebox"><input id="xhLoad" placeholder="PS1-..." style="width:100%;text-transform:none"><button data-xh="load">LOAD</button></div><span class="xmsg"></span></div>`;
  return body; };
  // searching shows matching rows from every tab at once, grouped under the tab's name
  const body = setQ ? tabs.map(([k, n]) => `<div class="sgrp"><div class="bindgrp">${n}</div>${tabBody(k)}</div>`).join('') : tabBody(setTab);
  host.innerHTML = `<div class="ssearch"><input id="setSearch" type="search" placeholder="Search settings (sens, blood, fov...)" value="${setQ.replace(/"/g, '&quot;')}" autocomplete="off" spellcheck="false"></div>`
    + `<div class="stabs${setQ ? ' dim' : ''}">${tabs.map(([k, n]) => `<button data-stab="${k}" class="${setTab === k && !setQ ? 'sel' : ''}">${n}</button>`).join('')}</div><div class="settings${setQ ? ' searching' : ''}">${body}<p class="gnote snone" style="display:none">Nothing matches "${setQ.replace(/</g, '&lt;')}". Try a shorter word.</p></div>`
    + `<div class="setfoot"><span class="gnote">Pastel Siege ${GAME_VERSION}${CHIP ? ` · ${CHIP}` : ""} · ${({ web: "website", crazygames: "CrazyGames", poki: "Poki", dev: "preview" })[window.PS_PLATFORM || "dev"] || window.PS_PLATFORM}</span><button class="x" data-reset>RESET ALL SETTINGS</button></div>`;
  const stop = el => { el.onmousedown = e => e.stopPropagation(); el.onkeydown = e => e.stopPropagation(); };
  const prev = host.querySelector('.xprev-ch');
  const refreshPreview = () => { if (prev) { mountCrosshair(prev, settings.xh); prev._xh.last = -1; } const c = host.querySelector('#xhCode'); if (c) c.value = crosshairCode(settings.xh); };
  if (prev) { refreshPreview(); previewLoop(prev); }
  host.querySelectorAll('[data-stab]').forEach(b => { stop(b); b.onclick = () => { setTab = b.dataset.stab; setQ = ''; SND.ui(); renderSettings(host); }; });
  // search: keep rows whose label or options contain every typed word; hide notes, empty groups and the crosshair preview
  if (setQ) {
    const words = setQ.toLowerCase().split(/\s+/).filter(Boolean); let hits = 0;
    host.querySelectorAll('.sgrp').forEach(g => {
      let n = 0;
      g.querySelectorAll('.set').forEach(r => { const t = r.textContent.toLowerCase(), ok = words.every(w => t.includes(w)); r.style.display = ok ? '' : 'none'; if (ok) n++; });
      g.querySelectorAll('.gnote, .shelp, .setfoot, .xhed, .bindgrp:not(:first-child), [data-bindreset]').forEach(el => { el.style.display = 'none'; });
      g.style.display = n ? '' : 'none'; hits += n;
    });
    host.querySelector('.snone').style.display = hits ? 'none' : '';
  }
  const sq = host.querySelector('#setSearch');
  if (sq) {
    stop(sq);
    sq.oninput = () => { setQ = sq.value.trim() ? sq.value : ''; renderSettings(host); const n = host.querySelector('#setSearch'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    sq.onkeydown = e => { e.stopPropagation(); if (e.key === 'Escape' && sq.value) { e.preventDefault(); setQ = ''; renderSettings(host); host.querySelector('#setSearch').focus(); } };
  }
  host.querySelectorAll('input[type=range]').forEach(r => { stop(r); r.oninput = () => { putS(r.dataset.k, +r.value); r.nextElementSibling.textContent = FMT[r.dataset.k](r.value); applySettings(); refreshPreview(); }; });
  host.querySelectorAll('button[data-v]').forEach(b => { stop(b); b.onclick = () => { const v = b.dataset.v; putS(b.dataset.k, v === 'true' ? true : v === 'false' ? false : v); applySettings(); SND.ui(); renderSettings(host); }; });
  host.querySelectorAll('input[data-color]').forEach(i => { stop(i); i.oninput = () => { putS(i.dataset.color, i.value); applySettings(); refreshPreview(); }; i.onchange = () => renderSettings(host); });
  host.querySelectorAll('[data-bind]').forEach(b => { stop(b); b.onclick = () => startRebind(b, host); });
  const br = host.querySelector('[data-bindreset]'); if (br) { stop(br); br.onclick = () => { settings.binds = {}; applySettings(); SND.ui(); renderSettings(host); }; }
  host.querySelectorAll('[data-save]').forEach(b => { stop(b); b.onclick = () => { SND.ui(); b.dataset.save === 'export' ? exportSave() : importSave(); }; });
  host.querySelectorAll('[data-bench]').forEach(b => { stop(b); b.disabled = state !== 'menu'; b.onclick = () => benchStart(host); });
  host.querySelectorAll('[data-preset]').forEach(b => { stop(b); b.onclick = () => { settings.xh = { ...XH_PRESETS[b.dataset.preset] }; applySettings(); SND.ui(); renderSettings(host); }; });
  host.querySelectorAll('input#xhLoad, input#xhCode').forEach(stop);
  const rs = host.querySelector('[data-reset]'); if (rs) { stop(rs); rs.onclick = () => { if (!rs.dataset.sure) { rs.dataset.sure = 1; rs.textContent = 'CLICK AGAIN TO RESET'; SND.ui(); return; } Object.assign(settings, SET_DEFAULT, { xh: { ...XH_DEFAULT }, binds: {} }); applySettings(); SND.ui(); renderSettings(host); }; }
  host.querySelectorAll('[data-xh]').forEach(b => { stop(b); b.onclick = () => {
    const msg = host.querySelector('.xmsg');
    if (b.dataset.xh === 'copy') { const v = host.querySelector('#xhCode').value; navigator.clipboard?.writeText(v).then(() => { msg.textContent = 'Copied!'; }, () => { msg.textContent = 'Select and copy it'; }); return; }
    const c = parseCrosshair(host.querySelector('#xhLoad').value);
    if (!c) { msg.textContent = 'Invalid code'; SND.deny(); return; }
    settings.xh = c; applySettings(); SND.code(); renderSettings(host);
  }; });
}

// ---------- main menu ----------
const TIPS = ['Crouch to stay hidden. Gunfire and sprinting make noise.', 'Shoot a Titan in its glowing core for triple damage.', 'Jump when a Titan stomps: the shockwave only hits you on the ground.', 'Riskier elevator doors pay more cash.', 'A full paint meter gives you a 1.5× damage frenzy.', 'Jump while sliding to keep your speed.', 'Pull your aim down to pay back recoil.', 'Every third floor is a Rampage: bottomless ammo, weak bots.', 'Landing headshots makes the bots learn faster. Pick your moments.', 'Grapple onto a wall, then jump to fling yourself off it.', 'Try the Daily Tower: everyone gets the same run today.', 'Hold jump in the air to glide once you own the glider.'];
function renderMenu() {
  if ($('tip')) $('tip').textContent = 'Tip: ' + TIPS[Math.floor(Math.random() * TIPS.length)];
  $('r-floor').textContent = prog.bestFloor; $('r-score').textContent = prog.bestScore.toLocaleString(); $('r-kills').textContent = prog.kills.toLocaleString();
  const armCats = []; for (const w of WEAPONS) if (!w.secret && !armCats.includes(w.cat)) armCats.push(w.cat);
  const armCard = w => { const L = levelOf(prog.xp[w.id] || 0);
    return `<div class="arm-card${L.need ? '' : ' max'}" title="${escH(w.desc || w.name)}"><canvas width="200" height="56" data-sil="${w.id}"></canvas><div class="arm-head"><b>${w.name}</b><em class="lvtag">LV ${L.level}</em></div>
      <div class="xpbar"><u style="width:${L.need ? L.into / L.need * 100 : 100}%"></u></div>${w.desc ? `<p>${w.desc}</p>` : ''}<small>Skin · ${skinFor(w.id).name}</small></div>`; };
  $('armory').innerHTML = armCats.map(cat => { const list = WEAPONS.filter(w => !w.secret && w.cat === cat);
    return `<h4 class="grp">${cat}<small>${list.length}</small></h4><div class="armory">${list.map(armCard).join('')}</div>`; }).join('');
  $('armory').querySelectorAll('canvas').forEach(c => gunThumb(c, byId(c.dataset.sil)));
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  $('enemyList').innerHTML = Object.entries(TYPES).map(([, t]) => `<div><i style="background:${hex(t.color)}"></i><div><b>${t.name}</b><span>${t.blurb}</span></div></div>`).join('');
  renderSettings($('settingsMenu')); renderMeta();
}
// characters, achievements, bestiary and the daily tower on the main menu
// menu: player level, daily quests with streak, and the personal leaderboard
function renderProgress() {
  const LI = levelInfo(prog.pxp), nr = nextReward(LI.lvl), d = prog.dq, played = d?.lastPlay === todayKey();
  const streak = d?.streak || 0;
  $('lvBox').innerHTML = `<div class="lvcard"><div class="lvtop"><div class="lvnum">${LI.lvl}</div><div><small>PLAYER LEVEL</small><b>Level ${LI.lvl}</b></div></div>
      <div class="lvbar"><u style="width:${LI.into / LI.need * 100}%"></u></div><small>${LI.into.toLocaleString()} / ${LI.need.toLocaleString()} XP</small>
      <div class="next">${nr ? `Level ${nr[0]}: ${nr[1]}` : 'Every level: +$50 starting cash'}</div>
      <span class="streak">🔥 ${streak ? `${streak}-day streak` : 'No streak yet'}${played ? ' · played today ✓' : ` · play today for +${streakXp(streak + 1)} XP`}</span></div>
    <div class="qcard"><small>TODAY'S QUESTS · NEW ONES AT MIDNIGHT</small>${(d?.quests || []).map(q => { const def = questById(q.id); if (!def) return '';
      return `<div class="q${q.done ? ' done' : ''}"><span>${q.done ? '✔ ' : ''}${def.text}</span><em>+${def.xp} XP${def.cash ? ` · $${def.cash.toLocaleString()}` : ''}</em><div class="qb"><u style="width:${q.n / def.goal * 100}%"></u></div></div>`; }).join('')}</div>`;
  const board = prog.board || [];
  $('boardList').innerHTML = board.length ? board.map((r, i) => `<div class="brow${i === 0 ? ' top' : ''}"><div class="rk">${i === 0 ? '🏆' : '#' + (i + 1)}</div>
      <div><b>${r.score.toLocaleString()} points</b><span>Floor ${r.floor} · ${r.kills} kills · ${charById(r.char)?.name || r.char}${r.daily ? ' · Daily Tower' : ''}</span></div>
      <em>${(r.diff || 'normal').toUpperCase()}</em><em>${r.date || ''}</em></div>`).join('') : '<p class="gnote">No runs yet. Your best runs will show up here.</p>';
  $('lvRewards').innerHTML = LEVEL_REWARDS.map(([at, t]) => `<div class="lvr${LI.lvl >= at ? ' got' : ''}"><b>${LI.lvl >= at ? '✓ ' : ''}LEVEL ${at}</b>${t}</div>`).join('');
}
// ---------- your look: shirt, pants, visor, hat, back item and name tag (friends see it in co-op) ----------
const LOOK_ROWS = [['shirt', 'SHIRT', 'sw'], ['pants', 'PANTS', 'sw'], ['visor', 'VISOR GLOW', 'sw'], ['hat', 'HAT', 'lk'], ['back', 'ON YOUR BACK', 'lk'], ['tag', 'NAME TAG', 'sw']];
const legendCount = () => ACH.filter(a => a[5] === 'L' && prog.ach[a[0]]).length;
const lookOpen = req => !req || (req.lvl ? levelInfo(prog.pxp).lvl >= req.lvl : legendCount() >= req.leg);
const reqText = req => req.lvl ? `Player level ${req.lvl}` : `${req.leg} Legendary badge${req.leg > 1 ? 's' : ''}`;
const reqShort = req => req.lvl ? `LV ${req.lvl}` : `👑${req.leg}`;
function renderLook() {
  const L = prog.look, hex = n => '#' + n.toString(16).padStart(6, '0');
  $('lookOpts').innerHTML = LOOK_ROWS.map(([k, label, kind]) => `<div class="lookrow"><b>${label}</b><div class="opts">${NET.LOOK[k].map(o => {
    const open = lookOpen(o.req), sel = L[k] === o.id, tip = `${o.name}${o.req ? ` · ${open ? 'unlocked' : 'needs ' + reqText(o.req)}` : ''}`;
    const cls = `${kind}${sel ? ' sel' : ''}${open ? '' : ' lock'}`;
    if (kind === 'lk') return `<button class="${cls}" data-lk="${k}" data-id="${o.id}" title="${tip}">${o.name}${o.req ? `<em>${open ? '✓' : reqShort(o.req)}</em>` : ''}</button>`;
    const col = k === 'tag' && !o.hex ? NET.net.col : o.hex, fx = o.fx === 'rainbow' ? ' rain' : o.fx === 'gold' || o.fx === 'chrome' ? ' metal' : '';
    return `<button class="${cls}${fx}" data-lk="${k}" data-id="${o.id}" title="${tip}" style="--c:${hex(col)}">${k === 'tag' && !o.hex ? 'T' : ''}</button>`;
  }).join('')}</div></div>`).join('');
  $('lookOpts').querySelectorAll('[data-lk]').forEach(b => b.onclick = () => {
    const k = b.dataset.lk, o = NET.LOOK[k].find(x => x.id === b.dataset.id);
    if (!lookOpen(o.req)) { SND.deny(); return toast('LOCKED', o.name, `Unlocks at ${reqText(o.req)}`, '🔒'); }
    prog.look = NET.cleanLook({ ...prog.look, [k]: o.id }); saveProg(); NET.setLook(prog.look); SND.click(); renderLook(); lookPreview(true);
  });
  lookPreview(true);
}
// a small spinning 3D preview, only drawn while the Character screen is open
let LP = null;
function lookPreview(rebuild) {
  const cv = $('lookView'); if (!cv) return;
  if (!LP) {
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(260, 320, false); r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .1, 50); cam.position.set(0, 1.25, 5.2); cam.lookAt(0, .95, 0);
    sc.environment = makeEnv(THREE, r); sc.environmentIntensity = .8; // the helmet and visor reflect a soft studio
    sc.add(new THREE.HemisphereLight(0xfff6ea, 0xb38b7a, 1.5)); const d = new THREE.DirectionalLight(0xffffff, 2.6); d.position.set(2, 4, 3); d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
    Object.assign(d.shadow.camera, { left: -1.5, right: 1.5, top: 2.5, bottom: -.5 }); d.shadow.radius = 4; sc.add(d);
    const rim = new THREE.DirectionalLight(0x9fe8ff, 1.1); rim.position.set(-3, 2.5, -3); sc.add(rim);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(1.2, 40), new THREE.ShadowMaterial({ opacity: .25 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.78, .8, 64), new THREE.MeshBasicMaterial({ color: 0x2b2d42, transparent: true, opacity: .35 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .002; sc.add(ring);
    LP = { r, sc, cam, av: null, spin: .6, drag: null, run: false };
    cv.onpointerdown = e => { LP.drag = e.clientX; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if (LP.drag == null) return; LP.av && (LP.av.g.rotation.y += (e.clientX - LP.drag) * .015); LP.drag = e.clientX; };
    cv.onpointerup = cv.onpointercancel = () => { LP.drag = null; };
  }
  if (rebuild || !LP.av) {
    const y = LP.av ? LP.av.g.rotation.y : Math.PI + .5;
    if (LP.av) { LP.sc.remove(LP.av.g); LP.av.g.traverse(m => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } }); }
    LP.av = NET.buildAvatar(prog.look); LP.av.g.rotation.y = y; LP.av.aim.rotation.x = -.08; LP.sc.add(LP.av.g);
  }
  if (!LP.run) { LP.run = true; requestAnimationFrame(lookFrame); }
}
function lookFrame(t) {
  const panel = $('panel-chars');
  if (state !== 'menu' || !panel?.classList.contains('on')) { LP.run = false; return; }
  if (LP.drag == null) LP.av.g.rotation.y += .008;
  LP.av.pose(0, 0, 0); LP.av.aim.rotation.x = -.08 + Math.sin(t / 900) * .02; LP.av.torso.position.y += Math.sin(t / 900) * .004;
  if (LP.av.rainbow.length) NET.tintRainbow(LP.av.rainbow, t / 1000);
  LP.r.render(LP.sc, LP.cam); requestAnimationFrame(lookFrame);
}
function renderMeta() {
  try { renderLook(); } catch (e) { console.warn("look", e); }
  ensureDaily(prog); renderProgress();
  const L = prog.life, hex = n => '#' + n.toString(16).padStart(6, '0');
  checkAch();
  prog.char = 'rookie';
  const c = charById(), U = prog.upg, plv = levelInfo(prog.pxp).lvl, pts = upgPoints(plv, U);
  $('charPick').innerHTML = `<button class="charchip" id="charChip" style="--c:${c.col}"><i>${c.name[0]}</i><div><small>PLAYING AS</small><b>${c.name}</b><span>${upgHp()} max HP · +${Math.round((upgSpd() - 1) * 100)}% speed${pts ? ` · <b style="color:var(--coral)">${pts} point${pts > 1 ? 's' : ''} to spend</b>` : ''}</span></div><em>UPGRADE ${ic('next')}</em></button>`;
  $('charChip').onclick = () => document.querySelector('#mnav [data-panel="chars"]').click();
  // upgrade tracks: 10 pips each, the next level's cost on the button
  $('charList').innerHTML = `<div class="upgpts"><b>${pts}</b><span>upgrade point${pts === 1 ? '' : 's'} to spend<small>You get 1 for every player level (you're level ${plv}). Upgrades start working on your next run.</small></span></div>`
    + UPGRADES.map(T => { const l = U[T.id] || 0, maxed = l >= T.max, cost = upgCost(l);
      return `<div class="upgrow" style="--c:${T.col}"><i>${T.icon}</i><div class="ut"><b>${T.name}</b><span>${T.text(l)}${maxed ? ' · MAX' : ` → ${T.text(l + 1)}`}</span>
        <div class="upips">${Array.from({ length: T.max }, (_, i) => `<s class="${i < l ? 'on' : ''}"></s>`).join('')}</div></div>
        <button class="buy" data-upg="${T.id}" ${maxed || pts < cost ? 'disabled' : ''}>${maxed ? 'MAXED' : `UPGRADE · ${cost} PT${cost > 1 ? 'S' : ''}`}</button></div>`; }).join('')
    + `<div style="text-align:right;margin-top:8px"><button class="x" data-upgreset ${U.hp || U.spd ? '' : 'disabled'}>REFUND ALL POINTS</button></div>`;
  $('charList').querySelectorAll('[data-upg]').forEach(b => b.onclick = () => {
    const T = UPGRADES.find(x => x.id === b.dataset.upg), l = U[T.id] || 0;
    if (l >= T.max || upgPoints(plv, U) < upgCost(l)) return SND.deny();
    U[T.id] = l + 1; saveProg(); SND.levelUp(); renderMeta();
  });
  const ur = $('charList').querySelector('[data-upgreset]'); if (ur) ur.onclick = () => { U.hp = 0; U.spd = 0; saveProg(); SND.ui(); renderMeta(); };
  const got = ACH.filter(a => prog.ach[a[0]]).length, LEG = ACH.filter(a => a[5] === 'L'), lgot = LEG.filter(a => prog.ach[a[0]]).length;
  $('achSum').textContent = `${got} of ${ACH.length} unlocked · ${lgot} of ${LEG.length} Legendary.`;
  const achRow = ([id, name, how, k, goal, tier]) => { const on = !!prog.ach[id], v = Math.min(L[k] || 0, goal);
    return `<div class="ach${on ? ' on' : ''}${tier === 'L' ? ' leg' : ''}"><i>${on ? (tier === 'L' ? '👑' : '🏆') : '🔒'}</i><div><b>${name}</b><span>${how}</span>${!on && goal > 1 ? `<div class="abar"><u style="width:${v / goal * 100}%"></u></div><small>${v.toLocaleString()} / ${goal.toLocaleString()}</small>` : ''}</div></div>`; };
  $('achList').innerHTML = `<div class="achhead leg">👑 LEGENDARY <small>the hardest badges in the game</small></div>` + LEG.map(achRow).join('')
    + `<div class="achhead">🏆 ACHIEVEMENTS</div>` + ACH.filter(a => a[5] !== 'L').map(achRow).join('');
  $('bestList').innerHTML = Object.entries(TYPES).map(([id, t]) => { const n = prog.best[id] || 0;
    return `<div class="beast${n ? '' : ' locked'}" style="--c:${hex(t.color)}"><div class="bport"><i></i><s></s></div><div><b>${n ? t.name : '???'}</b><span>${n ? t.blurb : 'Kill one to learn about it.'}</span>
      ${n ? `<div class="bstats"><em>${t.hp} HP</em><em>${t.dmg ? t.dmg + ' dmg' : 'explodes'}</em><em>${t.speed} m/s</em><em>Killed ${n.toLocaleString()}</em></div>` : ''}</div></div>`; }).join('');
  const today = prog.daily[todayKey()];
  $('dailyInfo').textContent = today ? `Today's best: ${today.score.toLocaleString()} · floor ${today.floor}` : 'Same maps and doors for everyone today';
}
$('dailyBtn').onclick = () => start('daily');
$('trainBtn').onclick = () => start('train');
document.querySelectorAll('#mnav button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#mnav button').forEach(x => x.classList.toggle('sel', x === b));
  document.querySelectorAll('.mpanel').forEach(p => p.classList.toggle('on', p.id === 'panel-' + b.dataset.panel));
  if (b.dataset.panel === "chars") try { lookPreview(); } catch (e) { }
  if (b.dataset.panel === 'pals') loadPals();
  if (b.dataset.panel === 'admin') loadAdminPage();
  if (b.dataset.panel === 'board') { if (lb.tab === 'all') loadBoard(); else renderGlobalBoard(); }
  openDrawer(false); menuTitle();
  SND.ui(); if (b.dataset.panel !== 'play') renderMenu();
});
// ---------- menu bar: the slide-out page list (☰), the page title, back to Play, fullscreen ----------
const goPanel = name => document.querySelector(`#mnav [data-panel="${name}"]`)?.click();
const drawerOpen = () => document.body.classList.contains('drawer');
function openDrawer(on = !drawerOpen()) { document.body.classList.toggle('drawer', on); if (on) SND.ui(); }
function menuTitle() {
  const sel = document.querySelector('#mnav button.sel'), name = sel?.dataset.panel || 'play';
  const label = sel?.querySelector('span')?.firstChild?.textContent?.trim() || '';
  const desc = sel?.querySelector('small')?.textContent || '';
  $('mtitle').innerHTML = `<h1>${label.charAt(0)}${label.slice(1).toLowerCase()}</h1>${desc ? `<p>${desc}</p>` : ''}`;
  $('backPlay').hidden = name === 'play';
}
$('menuBtn').onclick = () => openDrawer();
$('drawerX').onclick = () => openDrawer(false);
$('drawerShade').onclick = () => openDrawer(false);
$('backPlay').onclick = () => goPanel('play');
// fullscreen: the button flips between FULLSCREEN and EXIT FULLSCREEN (F11 and Esc work too, the browser's own way)
function toggleFullscreen() {
  SND.ui();
  try { if (document.fullscreenElement) document.exitFullscreen?.(); else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)?.call(document.documentElement); } catch (e) { }
}
function fsLabel() {
  const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
  $('fsBtn').querySelector('span').textContent = on ? 'EXIT FULLSCREEN' : 'FULLSCREEN'; $('fsBtn').title = on ? 'Exit fullscreen' : 'Fullscreen';
  $('pauseFs').innerHTML = `<span class="gol">${ic('expand')}${on ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}</span>`;
}
$('fsBtn').onclick = toggleFullscreen; $('pauseFs').onclick = toggleFullscreen;
document.addEventListener('fullscreenchange', fsLabel); document.addEventListener('webkitfullscreenchange', fsLabel);
if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) { $('fsBtn').hidden = true; $('pauseFs').hidden = true; }
fsLabel(); menuTitle();
// Esc closes whatever is open, one layer at a time: a pop-up box, then the page list, then the shop or pause menu,
// and on the main menu any page goes back to Play. (Runs before everything else, so pop-ups that swallow keys still close.)
addEventListener('keydown', e => {
  if (e.code === 'Escape' && emailBox) { e.preventDefault(); e.stopImmediatePropagation(); return; } // can't be closed
  if (e.code !== 'Escape' || rebinding || bench || admBox || e.repeat || e.target?.id === 'chatIn') return;
  const boxes = [...document.querySelectorAll('.savebox')], top = boxes[boxes.length - 1];
  const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
  if (top) {
    if (top.querySelector('#useCloud')) return; // picking which save to keep has to be answered
    const btn = [...top.querySelectorAll('button')].find(b => b.id === 'acX' || /^(CLOSE|CANCEL|NOT NOW|BACK|DONE|NO)\b/i.test(b.textContent.trim()));
    stop(); SND.ui(); if (btn) btn.click(); else top.remove(); return;
  }
  if (drawerOpen()) { stop(); openDrawer(false); return; }
  if (state === 'menu') { if (document.querySelector('.mpanel.on')?.id !== 'panel-play') { stop(); goPanel('play'); } return; }
  if (state === 'shop') { stop(); closeShop(); return; }
  if (state === 'paused' && $('pause').classList.contains('on')) { stop(); resume(); return; }
}, true);

// ---------- shop ----------
// ---------- play with friends (step 1: see each other) ----------
const MP_OK = PLATFORM === 'web' || PLATFORM === 'dev';
if (!MP_OK) $('friendsNav').style.display = 'none';
$('mpName').value = localStorage.getItem('psName') || '';
const mpName = () => { const n = $('mpName').value.trim() || 'Player'; localStorage.setItem('psName', n); return n; };
let lastRoom = '';
function renderFriends() {
  const n = NET.net;
  $('mpStatus').textContent = n.status; $('mpCode').textContent = n.on && n.host ? n.code : '';
  const room = n.on && n.host ? n.code : ''; if (room !== lastRoom) { lastRoom = room; pingNow(); } // friends see your co-op code (and a JOIN button)
  const L = NET.players();
  $("mpList").innerHTML = n.on ? L.map((p, i) => `<span><i style="background:#${p.col.toString(16).padStart(6, "0")}"></i>${p.name}${p.me ? " (you)" : ""}${(n.host ? p.me : i === 1) ? " · host" : ""}</span>`).join("") : "";
  $('mpHostGo').style.display = n.on && n.host ? '' : 'none'; $('mpGuest').style.display = n.on && !n.host ? '' : 'none';
  $('mpHost').disabled = $('mpJoin').disabled = n.on;
}
NET.net.onChange = renderFriends; renderFriends();
// ---------- co-op chat ----------
// Press T in a game to type (Enter sends, Esc closes); in the menu the box is always there while you're in a co-op
// game. New messages fade after a few seconds in a run. Muted players' messages are dropped by the host.
const chat = { log: [], open: false, lastT: 0, html: '', was: false };
const chatEl = document.createElement('div'); chatEl.id = 'chat';
chatEl.innerHTML = '<div class="clog"></div><input id="chatIn" maxlength="120" placeholder="Say something · Enter to send" autocomplete="off" spellcheck="false">';
document.body.appendChild(chatEl);
const chatIn = chatEl.querySelector('input');
function chatAdd(m) {
  chat.log.push({ ...m, at: Date.now() }); if (chat.log.length > 40) chat.log.shift();
  if (!m.sys && m.id !== NET.net.id) SND.ui();
  renderChat();
}
function renderChat() {
  const on = NET.net.on, inMenu = state === 'menu', vis = on && (inMenu || state === 'playing');
  if (!on && chat.was) { chat.log = []; chat.open = false; } // a new game starts with an empty chat
  if (on && !chat.was) chat.log.push({ sys: true, x: `Co-op chat: press ${keyLabel('chat')} in a game to talk.`, at: Date.now() });
  chat.was = on;
  chatEl.classList.toggle('on', vis); chatEl.classList.toggle('menu', inMenu); chatEl.classList.toggle('typing', vis && (chat.open || inMenu));
  if (!vis) return;
  const now = Date.now(), list = chat.open || inMenu ? chat.log.slice(-8) : chat.log.filter(m => now - m.at < 10000).slice(-6);
  const html = list.map(m => m.sys ? `<p class="sys">${escT(m.x)}</p>` : `<p><b style="background:${hexCol(m.c)}">${escT(m.n)}</b>${escT(m.x)}</p>`).join('');
  if (html !== chat.html) chatEl.querySelector('.clog').innerHTML = chat.html = html;
}
function openChat() {
  if (!NET.net.on) return;
  for (const k in keys) keys[k] = false; trigger = adsHeld = false; stopCooking(); // stop walking and shooting while you type
  chat.open = true; renderChat(); chatIn.focus();
}
function closeChat() { chat.open = false; chatIn.blur(); renderChat(); }
// checks the database for mutes, at most every 30 seconds per name
const muteCache = new Map();
async function isMutedName(name) {
  name = String(name || '').toLowerCase(); if (!/^[a-z0-9_]{3,16}$/.test(name)) return false;
  let c = muteCache.get(name);
  if (!c || Date.now() - c.at > 30000) {
    try { const r = await muteInfo([name]); c = { t: r[0]?.muted_until ? new Date(r[0].muted_until).getTime() : 0, at: Date.now() }; } catch (e) { c = { t: 0, at: Date.now() }; }
    muteCache.set(name, c);
  }
  return c.t > Date.now();
}
async function sendChat(x) {
  x = String(x || '').trim(); if (!x || !NET.net.on) return;
  if (Date.now() - chat.lastT < 1000) return chatAdd({ sys: true, x: 'Slow down a little.' });
  chat.lastT = Date.now();
  if (account.user && await isMutedName(account.name)) return chatAdd({ sys: true, x: `You're muted for ${leftTxt(muteCache.get(account.name).t)}.` });
  NET.chat(x);
}
chatIn.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); const x = chatIn.value; chatIn.value = ''; sendChat(x); if (state !== 'menu') closeChat(); }
  else if (e.key === 'Escape') closeChat();
});
for (const t of ['keyup', 'keypress', 'mousedown']) chatIn.addEventListener(t, e => e.stopPropagation());
chatIn.addEventListener('blur', () => { if (chat.open) { chat.open = false; renderChat(); } });
NET.net.onChat = chatAdd; NET.net.isMuted = isMutedName;
setInterval(renderChat, 500);
NET.net.onGo = mode => { if (state !== 'playing') start(mode); else { mpPending = mode; banner('HOST STARTED A GAME', `Pause and quit to the menu to join them (${mode === 'daily' ? 'Daily Tower' : 'Training'})`); } };
let mpPending = null;
$('mpHost').onclick = () => { SND.ui(); NET.host(mpName()); };
$('mpJoin').onclick = () => { SND.ui(); NET.join($('mpJoinCode').value, mpName()); };
$('mpJoinCode').onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') $('mpJoin').click(); };
$('mpName').onkeydown = e => e.stopPropagation();
// make sure the name and code boxes always take typing (nothing else on the page gets those key presses)
['mpName', 'mpJoinCode'].forEach(id => {
  const el = $(id);
  el.addEventListener('mousedown', e => { e.stopPropagation(); setTimeout(() => el.focus(), 0); });
  el.addEventListener('click', e => { e.stopPropagation(); el.focus(); });
  for (const t of ['keydown', 'keyup', 'keypress']) el.addEventListener(t, e => e.stopPropagation());
});
$('mpJoinCode').addEventListener('input', e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); if (v !== e.target.value) e.target.value = v; });
$('mpPaste').onclick = async () => {
  try { const t = (await navigator.clipboard.readText()).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10); if (t) { $('mpJoinCode').value = t; SND.ui(); } else SND.deny(); }
  catch (e) { SND.deny(); const c = prompt('Type or paste the code your friend gave you:'); if (c) $('mpJoinCode').value = c.trim().toUpperCase().slice(0, 10); }
};
$('mpLeave').onclick = $('mpLeave2').onclick = () => { SND.ui(); NET.leave(); };
$('mpTrain').onclick = () => { NET.go('train'); start('train'); };
$('mpDaily').onclick = () => { NET.go('daily'); start('daily'); };
let mpWarned = false, lastDt = 0, mpErr = false;
function netFrame(dt) {
  if (!NET.net.on) { if (coop) coopEnd(true); return; }
  const inGame = state === 'playing' || state === 'paused' || state === 'shop' || state === 'mutate' || state === 'elevator';
  const map = inGame && mapDef ? mapDef.id : null; NET.setMap(map);
  NET.tick(dt, { map, x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw, pitch: player.pitch, crouch: player.crouch, hp: player.hp, maxHp: player.maxHp, down: player.down, rv: player.down ? (player.revT || 0) / 3 : 0 });
  if (coop) coopFrame(dt);
  // remind people on a solo run that friends are somewhere else
  else if (state === 'playing' && !mpWarned && NET.net.peers.size && !training && !dailyRun) { mpWarned = true; banner('YOU ARE ON YOUR OWN MAP', 'Shared runs start when the host starts a normal run, or friends can join a run that is already going'); }
}

// ---------- co-op runs ----------
// The host plays a normal run: their game spawns the bots, runs the waves and floors and decides every hit.
// 15 times a second it tells everyone where its bots are. Friends build the same floors from the same seed, see
// copies of the host's bots ("puppets"), and send their hits to the host. Bots chase and shoot whoever is nearest.
// Going to 0 HP puts you down instead of out while a friend is still up: stand next to a downed friend to revive them.
// The run ends when everyone is down at once. Each player keeps their own cash, shop, guns and XP.
let coop = null, snapT = 0, coopGuestStart = null;
const mateObjs = new Map();
const coopOn = () => !!coop;
// in co-op the fight never stops: the shop, pause menu and mutation picker don't freeze the world
const liveNow = () => state === 'playing' || (!!coop && (state === 'shop' || state === 'paused' || state === 'mutate'));
const inRun = () => ['playing', 'paused', 'shop', 'mutate', 'elevator'].includes(state);
const cstartMsg = late => ({ t: 'cstart', floor: floorN, seed: mapDef.seed, diff: diffKey, mod: floorMod.id, w: wave, late: late ? 1 : 0, wx: weather });
function coopHostStart() {
  if (!NET.isHost() || !NET.net.peers.size) return SND.deny();
  start('run'); // a normal run with friends connected turns into a co-op run by itself
}
function coopHostBegin() {
  coop = { role: 'host' }; mates.length = 0; mateObjs.clear();
  NET.toFriends(cstartMsg(false));
  banner('CO-OP RUN', `${NET.players().length} PLAYERS · BOTS CHASE WHOEVER IS CLOSEST · STAND NEXT TO A DOWNED FRIEND TO REVIVE`);
}
// host: someone joined while you're mid-run, so bring them in (a solo run becomes co-op)
NET.net.onJoin = (id, name) => {
  if (!inRun() || training || !mapDef) return;
  if (!coop) { coop = { role: 'host' }; mates.length = 0; mateObjs.clear(); }
  if (coop.role !== 'host') return;
  NET.toFriend(id, cstartMsg(true));
  banner('FRIEND JOINED', `${name.toUpperCase()} IS DROPPING INTO FLOOR ${floorN}`);
};
// cash a late joiner gets, so they aren't stuck with a pistol on floor 6 (about what the wave bonuses would have paid)
function lateCash(w) { let c = 0; for (let i = 1; i <= w; i++) c += 400 + i * 100 + (i % 5 === 0 ? 1500 * floorOf(i) : 0); return Math.round(c * 1.4); }
function coopGuestJoin(d) {
  if (state !== 'menu') { if (coop) coop = null; toMenu(); }
  coopGuestStart = d; if (DIFF[d.diff]) { diffKey = d.diff; diff = ctx.diff = DIFF[d.diff]; }
  start('run');
  coop = { role: 'guest', lastBt: 0 }; coopGuestStart = null; wave = d.w || 0; renderPips();
  applyWeather(d.wx || 'clear');
  if (d.late && d.w > 0) { const c = lateCash(d.w); player.cash += c; SND.cash(); banner('JOINED MID-RUN', `FLOOR ${d.floor} · WAVE ${d.w} · +$${c.toLocaleString()} TO CATCH UP · ${keyLabel('shop')} TO SHOP`); }
  else banner('CO-OP RUN', 'YOU JOINED YOUR FRIEND · YOUR KILLS AND CASH ARE YOUR OWN');
}
function coopEnd(hostLeft) {
  const was = coop; coop = null; mates.length = 0; mateObjs.clear(); player.down = false;
  if (was?.role === 'guest') { bots.forEach(b => b.remove()); bots.length = 0; }
  if (hostLeft && was && ['playing', 'paused', 'shop', 'mutate'].includes(state)) { banner('THE HOST LEFT', 'The co-op run is over'); setTimeout(() => { if (state !== 'menu' && state !== 'dead') gameOver(); }, 1500); }
}
// guest: build the floor the host is on
function coopFloor(d) {
  floorN = d.floor; if (d.mod) floorMod = modById(d.mod) || MODS[0]; renderModChip?.();
  clearAll(); mapDef = generateMap(d.floor, d.seed); loadMap(mapDef); placePlayer(); floorChange();
  applyWeather(d.wx || 'clear');
  if (floorMod.id !== 'blood') player.hp = Math.min(player.maxHp, player.hp + 25);
  $('mmlabel').textContent = `${mapDef.name.toUpperCase()} · ${mapDef.sizeLabel || ''} · ${mapDef.size * 2}M`;
  const fd = $('fade'); fd.classList.remove('go'); void fd.offsetWidth; fd.classList.add('go');
  banner(`FLOOR ${d.floor}`, 'YOUR FRIEND TOOK THE ELEVATOR'); renderPips();
}
// shut the shop, pause menu or mutation picker (co-op: you can get knocked down while one is open)
function closeMenus() {
  if (state === 'shop') { shop.close(); state = 'playing'; } else if (state === 'paused') { show('pause', false); state = 'playing'; }
  else if (state === 'mutate') { show('mutate', false); mutIt = null; state = 'playing'; }
}
function goDown() {
  closeMenus();
  player.down = true; player.hp = 1; player.revT = 0; trigger = adsHeld = false; player.crouchOn = true; skillEvent('down');
  banner('YOU ARE DOWN', 'A friend can stand next to you for 3 seconds to revive you'); SND.hurt();
}
function revive(hp, by) {
  player.down = false; player.hp = Math.max(player.hp, hp); player.revT = 0; player.crouchOn = false;
  banner('REVIVED!', by ? `${by} GOT YOU BACK UP` : 'BACK IN THE FIGHT'); SND.levelUp?.();
}
// is anyone else on the team still standing?
const teamUp = () => NET.peerStates().some(p => p.st.hp > 0 && !p.st.dn && p.st.map === mapDef?.id);
function coopFrame(dt) {
  const playing = state === 'playing' || state === 'shop' || state === 'paused' || state === 'mutate';
  // reviving: a friend standing within 2.2 m of you (on the same map) for 3 seconds
  if (player.down && playing) {
    const near = NET.peerStates().find(p => p.st.map === mapDef?.id && !p.st.dn && p.st.hp > 0 && Math.hypot(p.st.p[0] - player.pos.x, p.st.p[2] - player.pos.z) < 2.2);
    player.revT = near ? (player.revT || 0) + dt : Math.max(0, (player.revT || 0) - dt * .5);
    if (player.revT >= 3) revive(player.maxHp * .35, near?.name);
  }
  if (coop.role === 'host') {
    // friends as targets for the bots
    const seen = new Set();
    for (const p of NET.peerStates()) {
      if (p.st.map !== mapDef?.id) continue; seen.add(p.id);
      let m = mateObjs.get(p.id);
      if (!m) { m = { id: p.id, name: p.name, pos: new V3(), vel: new V3(), eye: new V3(), yaw: 0, eyeH: 1.7, crouch: 0, alive: true, last: null,
        hurt: (d, src, head) => NET.toFriend(p.id, { t: 'hurt', d: Math.round(d * 10) / 10, x: src?.x || 0, z: src?.z || 0, h: head ? 1 : 0 }) }; mateObjs.set(p.id, m); }
      const s = p.st, nx = s.p[0], ny = s.p[1], nz = s.p[2];
      // moving faster than anything in the game allows (dashes and grapples top out around 30 m/s) = teleporting
      if (m.last && m.last !== s && m.map === s.map) { const tn = performance.now(), dtm = (tn - (m.lastT || tn)) / 1000, dist = Math.hypot(nx - m.pos.x, nz - m.pos.z);
        const sdt = s.ts && m.ts ? (s.ts - m.ts) / 1000 : dtm; // the friend's own clock, so lag that bunches messages up can't look like teleporting
        if (sdt > .03 && dist > 10 && dist / sdt > 70) { m.tp = (m.tp || 0) + 1; if (m.tp >= 3) { m.tp = 0; peerSus(p.id, "teleporting"); } } }
      if (m.last !== s) { m.lastT = performance.now(); m.map = s.map; m.ts = s.ts; }
      m.tp = Math.max(0, (m.tp || 0) - lastDt * .15); // needs 3 within a few seconds (one odd jump, like falling out of the map, never counts)
      if (m.last !== s) { if (m.last) m.vel.set((nx - m.pos.x) * 15, (ny - m.pos.y) * 15, (nz - m.pos.z) * 15); m.last = s; }
      m.pos.set(nx, ny, nz); m.yaw = s.yaw; m.crouch = s.c || 0; m.eyeH = 1.7 * (1 - .35 * m.crouch); m.eye.set(nx, ny + m.eyeH, nz); m.alive = s.hp > 0 && !s.dn;
    }
    for (const id of mateObjs.keys()) if (!seen.has(id)) mateObjs.delete(id);
    mates.length = 0; mates.push(...mateObjs.values());
    // everyone down: the run is over for all
    if (liveNow() && player.down && !mates.some(m => m.alive)) { NET.toFriends({ t: 'over' }); gameOver(); return; }
    // tell everyone where the bots are
    if ((snapT += dt) >= 1 / 15) {
      snapT = 0;
      const b = bots.filter(x => x.alive && !x.puppet).map(x => [x.nid, x.type, +x.pos.x.toFixed(2), +x.pos.z.toFixed(2), +x.yaw.toFixed(2), x.state, Math.round(x.hp), x.t.hp, x.elite ? 1 : 0, botLaser(x)]);
      NET.toFriends({ t: 'snap', w: wave, f: floorN, bt: breakT > 0 ? Math.ceil(breakT) : 0, b });
    }
  } else if (player.down && !teamUp() && state === 'playing') { /* the host sends "over" when everyone is down */ }
}
// host: which player should this bot go after? (nearest one standing, checked about once a second)
function botTarget(b) {
  if (!mates.length) return null;
  if ((b.tgtT = (b.tgtT || 0) - lastDt) > 0) return b.tgt && b.tgt.alive && mates.includes(b.tgt) ? b.tgt : null;
  b.tgtT = .8 + Math.random() * .4;
  let best = player.down ? null : 'me', bd = player.down ? Infinity : b.pos.distanceTo(player.pos);
  for (const m of mates) if (m.alive) { const d = b.pos.distanceTo(m.pos); if (d < bd) { bd = d; best = m; } }
  b.tgt = best === 'me' || !best ? null : best;
  if (!best) b.tgt = null;
  return b.tgt;
}
// host: run one bot's brain as if the friend it's chasing were "the player"
const _cam = new V3();
function withTarget(m, fn) {
  const p0 = ctx.player, h0 = ctx.hurt; _cam.copy(camera.position);
  camera.position.copy(m.eye); ctx.player = m; ctx.hurt = m.hurt; ctx.mate = m;
  try { return fn(); } finally { camera.position.copy(_cam); ctx.player = p0; ctx.hurt = h0; ctx.mate = null; }
}
// ---------- co-op anti-cheat (host side) ----------
// The host decides what's real. A friend running a modded game could try to send hits for a billion damage, hundreds of
// hits a second, or teleport around; the host blocks impossible hits and warns everyone about who's doing it.
const HIT_CAP = (() => { let m = 0; for (const w of WEAPONS) if (!w.secret) m = Math.max(m, (w.dmg || 0) * (w.pellets || 1), w.projectile?.dmg || 0); return Math.max(25000, m * 40); })(); // far above any real hit (crits, frenzy and every damage mutation stacked)
const peerAC = new Map();
function peerSus(id, why) {
  const a = peerAC.get(id) || { n: 0, warned: false }; peerAC.set(id, a); a.n++;
  if (a.n >= 5 && !a.warned) {
    a.warned = true; const name = (NET.players().find(p => p.id === id)?.name || 'A FRIEND').toUpperCase();
    banner('🛡 ANTI-CHEAT', `${name} MAY BE CHEATING (${why}) · THEIR IMPOSSIBLE HITS ARE BLOCKED`);
    NET.toFriends({ t: 'acwarn', name, why });
  }
}
// true = let this hit through
function hitOk(from, d) {
  const now = G0 ? G0.nat.now() : performance.now(), a = peerAC.get(from) || { n: 0, warned: false }; peerAC.set(from, a);
  if (!a.t0 || now - a.t0 > 1000) { a.t0 = now; a.hits = 0; a.dmg = 0; }
  const dmg = +d.d;
  if (!Number.isFinite(dmg) || dmg <= 0) return false;
  if (dmg > HIT_CAP) { peerSus(from, 'impossible damage'); return false; }
  if (++a.hits > 600) { peerSus(from, 'too many hits'); return false; } // a nuke on a full wave is a few hundred
  if ((a.dmg += dmg) > HIT_CAP * 25) { peerSus(from, 'too much damage'); return false; }
  return true;
}
function coopMsg(d, from) {
  // only the host runs the game: from a friend, the host accepts hits and nothing else (a fake "cstart" used to take over the host's game)
  if (from != null && d.t !== 'hit') return;
  if (d.t === 'cstart') return coopGuestJoin(d);
  if (!coop) return;
  if (coop.role === 'host') {
    if (d.t === 'hit') {
      if (!hitOk(from, d)) return;
      const b = botByNid(d.n); if (!b || !b.alive || b.puppet) return;
      const died = b.damage(+d.d, { head: !!d.h, blast: !!d.bl, point: b.center() });
      if (died) NET.toFriend(from, { t: 'kill', n: b.nid, h: d.h ? 1 : 0 }); else if (b.t.titan) titanPhase(b);
    }
    return;
  }
  // guest
  if (d.t === 'snap') coopSnap(d);
  else if (d.t === 'cfloor') coopFloor(d);
  else if (d.t === 'zap') zapAt(new V3(d.x, 0, d.z), true);
  else if (d.t === 'acwarn') banner('🛡 ANTI-CHEAT', `${escH(String(d.name).slice(0, 14))} MAY BE CHEATING (${escH(String(d.why).slice(0, 24).toUpperCase())}) · THE HOST IS BLOCKING IT`);
  else if (d.t === 'bd') { const b = botByNid(d.n); if (b && b.alive) { b.hp = 0; b.die({ head: !!d.h, blast: !!d.bl }); } }
  else if (d.t === 'bb') ghostBolt(new V3(...d.f), new V3(...d.v), d.c, !!d.r, !!d.hv);
  else if (d.t === 'hurt') { if (!player.down) hurt(d.d, { x: d.x, z: d.z }, false); if (d.h && state === 'playing') medalHead(); }
  else if (d.t === 'kill') { const b = botByNid(d.n); if (b) { try { const o = b.lastHit || { weaponId: cur()?.base.id, name: cur()?.w.name }; onKill(b, !!d.h, o.name || 'Gun', o); } catch (e) { console.warn(e); } } }
  else if (d.t === 'over') { if (state !== 'dead' && state !== 'menu') { banner('EVERYONE IS DOWN', 'The co-op run is over'); gameOver(); } }
}
// guest: make the host's bots appear, move and disappear
function coopSnap(d) {
  if (d.f !== floorN) return; // still loading that floor
  const was = wave; wave = d.w; if (was !== wave) renderPips();
  if (d.bt > 0 && !coop.lastBt && player.down) revive(30); // everyone gets back up between waves
  coop.lastBt = d.bt; breakT = d.bt;
  const ids = new Set();
  for (const [nid, type, x, z, yaw, st, hp, mh, el, l] of d.b) {
    ids.add(nid);
    let b = botByNid(nid);
    if (!b) { if (!TYPES[type]) continue; b = new Bot(type, new V3(x, 0, z), { nid, puppet: true, elite: !!el }); b.yaw = yaw; bots.push(b); }
    b.t.hp = mh; b.net = { x, z, yaw, st, hp, l };
  }
  for (let i = bots.length - 1; i >= 0; i--) { const b = bots[i]; if (b.puppet && b.alive && !ids.has(b.nid)) { b.remove(); bots.splice(i, 1); } }
}
// host side hooks from the bots
ctx.onDie = (b, hit) => { if (coop?.role === 'host' && !b.puppet) NET.toFriends({ t: 'bd', n: b.nid, h: hit?.head ? 1 : 0, bl: hit?.blast ? 1 : 0 }); };
ctx.onBolt = (from, vel, col, rocket, heavy) => { if (coop?.role === 'host') NET.toFriends({ t: 'bb', f: [from.x, from.y, from.z].map(v => +v.toFixed(2)), v: [vel.x, vel.y, vel.z].map(v => +v.toFixed(2)), c: col, r: rocket ? 1 : 0, hv: heavy ? 1 : 0 }); };
// guest side: hits on the host's bots go to the host
ctx.puppetHit = (b, n, hit) => { if (coop?.role === 'guest') NET.toHost({ t: 'hit', n: b.nid, d: Math.round(n * 10) / 10, h: hit.head ? 1 : 0, bl: hit.blast ? 1 : 0 }); };
NET.net.onMsg = coopMsg;
window.psBusy = () => state !== 'menu'; // the page waits until you're on the menu before reloading for an update
$('mpCoop').onclick = () => coopHostStart();
const shop = new Shop($('shop'), {
  cash: () => player.cash, floor: () => floorN, ui: () => SND.ui(),
  equipped: id => player.slots.primary?.w.id === id || player.slots.secondary?.w.id === id || player.slots.melee?.w.id === id,
  // guns you've bought this run stay in your locker: swapping back to one is free and keeps its attachments and mutations
  buyWeapon: id => {
    const w = byId(id), old = player.slots[w.slot], have = player.locker[id];
    if (old && old.base.id === id) return;
    if (!have) { if (player.cash < w.price) return; player.cash -= w.price; }
    if (old) player.locker[old.base.id] = old;
    delete player.locker[id]; player.slots[w.slot] = have || inst(id); switchTo(w.slot, true); have ? SND.ui() : SND.buy();
  },
  inLocker: id => !!player.locker[id],
  gearStatus: id => {
    if (id === 'armor') { const cap = perk().armorCap || 100; return { text: `Armour ${Math.ceil(player.armor)}/${cap}`, full: player.armor >= cap }; }
    if (id === 'medkit') return { text: `Health ${Math.ceil(player.hp)}/${player.maxHp}`, full: player.hp >= player.maxHp };
    if (id === 'frag') return { text: `Carrying ${player.nades}/${MAX_NADES}`, full: player.nades >= MAX_NADES };
    if (id === 'nvg') return { text: player.nvg ? `Owned for this run · ${keyLabel('nvg')} turns it on/off` : 'Lasts the whole run', full: !!player.nvg };
    const its = ['primary', 'secondary'].map(s => player.slots[s]).filter(Boolean);
    return { text: its.map(i => `${i.w.name}: ${i.reserve}/${i.w.reserve}`).join(' · '), full: its.every(i => i.reserve >= i.w.reserve) };
  },
  buyGear: id => {
    const g = { armor: 650, medkit: 400 * (perk().medkit || 1), frag: 300, ammo: 250, nvg: 5000 }[id]; if (player.cash < g || (id === 'nvg' && player.nvg)) return;
    player.cash -= g; SND.buy();
    if (id === 'armor') player.armor = perk().armorCap || 100; else if (id === 'medkit') player.hp = Math.min(player.maxHp, player.hp + 50);
    else if (id === 'nvg') { player.nvg = true; player.nvgOn = true; applyNight(); saveRun(); }
    else if (id === 'frag') player.nades++; else ['primary', 'secondary'].forEach(s => { const it = player.slots[s]; if (it) it.reserve = it.w.reserve; });
  },
  supLevel: id => slv(id), supStock: id => owned(id), scanLive: () => support.scanT > 0,
  buySupport: id => {
    const s = supById(id), l = slv(id), price = s && supNextPrice(s, l); if (price == null || player.cash < price) return SND.deny();
    player.cash -= price; buySupport(id); l ? SND.levelUp() : SND.buy(); saveRun();
  },
  buyCharge: id => { const s = supById(id); if (!s || player.cash < s.charge || !buyCharge(id)) return SND.deny(); player.cash -= s.charge; SND.buy(); },
  abLevel: id => player.ab[id] || 0,
  buyAbility: id => {
    const a = abById(id), l = player.ab[id] || 0, price = a && abNextPrice(a, l); if (price == null || player.cash < price) return SND.deny();
    player.cash -= price; player.ab[id] = l + 1;
    if (id === 'dash') { player.dashCh = AB(player.ab, 'dash', 'charges'); player.dashCd = 0; }
    l ? SND.levelUp() : SND.buy(); lastAbKey = ''; saveRun();
  },
  items: () => ({ primary: player.slots.primary, secondary: player.slots.secondary, melee: player.slots.melee }),
  pipTier: () => player.pipTier || 0,
  pipPreview: t => { const keep = player.pipTier; player.pipTier = t; const it = [player.slots.secondary, player.slots.primary].find(x => x?.base.id === "pip"), w = computeW(byId("pip"), it?.att || {}, it?.ml || {}); player.pipTier = keep; return w; },
  buyPipTier: () => {
    const t = (player.pipTier || 0) + 1, T = PIP_TIERS[t]; if (!T || player.cash < T.price) return SND.deny();
    player.cash -= T.price; player.pipTier = t;
    for (const k of ["primary", "secondary"]) { const it = player.slots[k]; if (it?.base.id === "pip") { refit(it); it.mag = it.w.mag; it.reserve = Math.max(it.reserve, it.w.reserve); it.mode = Math.min(it.mode, it.w.modes.length - 1); } }
    if (cur()?.base.id === "pip") equipView(); lastSlotsKey = ""; SND.levelUp(); medal(T.name.toUpperCase(), "⬆", 0, "lv"); if (t === PIP_TIERS.length - 1) life('pipmax', 1, true); saveRun();
  },
  buyAttach: (slotKey, id) => {
    // parts you've bought for a gun stay yours for the run: take one off (or swap it for another) and putting it back is free
    const it = player.slots[slotKey], a = attById(id); if (!it || !a || it.att[a.slot] === id) return;
    const own = it.own || (it.own = Object.values(it.att)), had = own.includes(id); if (!had && player.cash < a.price) return;
    if (!had) { player.cash -= a.price; own.push(id); } it.att[a.slot] = id; refit(it); had ? SND.ui() : SND.buy();
  },
  laserOf: slotKey => player.slots[slotKey]?.lz || { col: 'red', lv: 0, cols: ['red'] },
  buyLaserCol: (slotKey, id) => {
    const it = player.slots[slotKey], c = LASER_COLS.find(x => x.id === id); if (!it || !c || it.att.under !== 'laser') return;
    const lz = it.lz = it.lz || { col: 'red', lv: 0, cols: ['red'] }; lz.cols = lz.cols || ['red'];
    if (!lz.cols.includes(id)) { if (player.cash < c.price) return SND.deny(); player.cash -= c.price; lz.cols.push(id); SND.buy(); } else SND.click();
    lz.col = id; if (it === cur()) fitLaser(it); saveRun();
  },
  buyLaserLv: slotKey => {
    const it = player.slots[slotKey]; if (!it || it.att.under !== 'laser') return;
    const lz = it.lz = it.lz || { col: 'red', lv: 0, cols: ['red'] }, nx = LASER_LV[(lz.lv || 0) + 1]; if (!nx || player.cash < nx.price) return SND.deny();
    player.cash -= nx.price; lz.lv = (lz.lv || 0) + 1; SND.levelUp(); if (it === cur()) fitLaser(it); saveRun();
  },
  removeAttach: (slotKey, slot) => { const it = player.slots[slotKey]; if (!it) return; const own = it.own || (it.own = Object.values(it.att)); if (it.att[slot] && !own.includes(it.att[slot])) own.push(it.att[slot]); delete it.att[slot]; refit(it); SND.click(); },
  ownsAttach: (slotKey, id) => { const it = player.slots[slotKey]; return !!it && (Object.values(it.att).includes(id) || !!it.own?.includes(id)); },
  buySkin: (slotKey, skinId) => {
    const it = player.slots[slotKey], s = SKINS.find(x => x.id === skinId); if (!it || !s || s.level || player.cash < s.price) return;
    player.cash -= s.price; if (!prog.skins.includes(skinId)) prog.skins.push(skinId); prog.skinOf[it.base.id] = skinId; saveProg(); SND.buy();
    if (it === cur()) equipView();
  },
  equipSkin: (slotKey, skinId) => { const it = player.slots[slotKey]; if (!it) return; prog.skinOf[it.base.id] = skinId; saveProg(); if (it === cur()) equipView(); },
  buyCharm: (slotKey, id) => {
    const it = player.slots[slotKey], c = CHARMS.find(x => x.id === id); if (!it || !c || player.cash < c.price) return;
    player.cash -= c.price; if (!prog.charms.includes(id)) prog.charms.push(id); prog.charmOf[it.base.id] = id; saveProg(); SND.buy(); if (it === cur()) equipView();
  },
  equipCharm: (slotKey, id) => { const it = player.slots[slotKey]; if (!it) return; prog.charmOf[it.base.id] = id; saveProg(); SND.ui(); if (it === cur()) equipView(); },
  redeem: code => redeem(code),
  thumb: (cv, w) => gunThumb(cv, w),
  close: () => closeShop(),
});
function openShop() { if (state !== 'playing' || player.down) return; if (training) training.shopped = true; if (coop) banner('THE FIGHT KEEPS GOING', 'In co-op the game does not pause while you shop'); state = 'shop'; trigger = adsHeld = false; player.cooking = false; document.exitPointerLock?.(); shop.open(); SND.ui(); }
function closeShop() { shop.close(); state = 'playing'; clock.getDelta(); lock(); saveRun(); }

// ---------- weapon mutations: the picker ----------
let mutIt = null, mutOffers = [];
const pendingItem = () => [cur(), player.slots.primary, player.slots.secondary].find(it => it && it.pend > 0) || null;
// level pips: ●●○ for a level II mutation
const pips = l => `<em class="lpips">${[1, 2, 3].map(i => `<s class="${i <= l ? 'on' : ''}"></s>`).join('')}</em>`;
const mchip = (id, l) => { const m = mutById(id); return `<span class="mchip" style="--c:${m.col}">${m.icon} ${m.name} ${ROMAN[l]}</span>`; };
function openMutate() {
  const it = pendingItem(); if (!it || state !== 'playing') return;
  mutIt = it;
  // the 3 offers stick to the gun until one is picked, so closing and reopening (or reloading) can't reroll them
  if (it.mo) mutOffers = it.mo.map(([id, lvl]) => ({ m: mutById(id), lvl })).filter(o => o.m && (it.ml[o.m.id] || 0) < o.lvl);
  if (!it.mo || !mutOffers.length) { mutOffers = offers(it.w.ml, !!it.w.projectile); it.mo = mutOffers.map(o => [o.m.id, o.lvl]); }
  if (!mutOffers.length) { it.pend = 0; it.mo = null; return; }
  state = 'mutate'; trigger = adsHeld = false; stopCooking(); document.exitPointerLock?.();
  const nx = nextStep(it.mk), have = Object.entries(it.w.ml);
  $('mutate').innerHTML = `<div class="card mutcard"><div class="stamp" style="background:var(--coral)">MUTATION</div>
    <h2>${it.w.name} is evolving</h2><p class="sub">${it.mk} kills this run. Pick one: a new mutation, or level up one you have. Each goes up to level III.${it.pend > 1 ? ` <b>${it.pend} picks waiting.</b>` : ''}${nx ? ` Next pick at ${nx} kills.` : ''}</p>
    <div class="mutcards">${mutOffers.map(({ m, lvl }, i) => `<button class="mut${lvl > 1 ? ' up' : ''}" data-i="${i}" style="--c:${m.col}">
      <div class="mtop"><i>${m.icon}</i><div><span class="mkind">${m.spell ? 'SPELL · ' : ''}${lvl > 1 ? `LEVEL UP · ${ROMAN[lvl - 1]} → ${ROMAN[lvl]}` : 'NEW'}</span>${pips(lvl)}</div></div>
      <b>${m.name} ${ROMAN[lvl]}</b><span class="mdesc">${m.d(lvl)}</span>${lvl > 1 ? `<span class="mwas">was: ${m.d(lvl - 1)}</span>` : ''}<kbd>${i + 1}</kbd></button>`).join('')}</div>
    ${have.length ? `<p class="gnote" style="margin-top:14px">On this gun: ${have.map(([id, l]) => mchip(id, l)).join(' ')}</p>` : ''}
    <p class="note">1 2 3 to pick · ${keyLabel('mutate')} or Esc to decide later (the same 3 will be waiting)</p></div>`;
  $('mutate').querySelectorAll('.mut').forEach(b => { b.onmousedown = e => e.stopPropagation(); b.onclick = () => pickMutation(+b.dataset.i); });
  show('mutate', true); SND.levelUp();
}
function pickMutation(i) {
  const o = mutOffers[i]; if (!o || !mutIt) return;
  mutIt.ml[o.m.id] = o.lvl; mutIt.pend--; mutIt.mo = null; refit(mutIt); lastSlotsKey = ''; if (o.lvl >= MAX_MLV) { life('maxmut', 1, true); life('mut3n', Object.values(mutIt.ml).filter(l => l >= MAX_MLV).length, true); }
  medal(`${mutIt.w.name.toUpperCase()}: ${o.m.name.toUpperCase()} ${ROMAN[o.lvl]}`, o.m.icon, 0, 'lv'); SND.code();
  closeMutate(); saveRun();
}
function closeMutate() { show('mutate', false); mutIt = null; state = 'playing'; clock.getDelta(); lock(); }
const mutIcons = it => Object.entries(it.w.ml).map(([id, l]) => { const m = mutById(id); return `<i style="--c:${m.col}" title="${m.name} ${ROMAN[l]}">${m.icon}<sup>${ROMAN[l]}</sup></i>`; }).join('');

// ---------- saving: a run can be paused, closed and continued later ----------
// Everything that matters is saved: the floor (rebuilt from its seed), wave, every live bot, your loadout and mutations.
const RUN_KEY = 'pastelSiegeRun1';
let autosaveT = 0, diffKey = 'normal';
const itemSave = it => it && { id: it.base.id, att: it.att, own: it.own || null, mag: it.mag, reserve: it.reserve, mode: it.mode, ml: it.ml, mk: it.mk, pend: it.pend, mo: it.mo || null, lz: it.lz || null };
function itemLoad(s) {
  if (!s || !byId(s.id)) return null;
  const it = inst(s.id); Object.assign(it, { att: s.att || {}, own: Array.isArray(s.own) ? s.own.filter(x => typeof x === 'string') : null, mode: s.mode || 0, ml: s.ml || Object.fromEntries((s.muts || []).map(id => [id, 1])), mk: s.mk || 0, pend: s.pend || 0, mo: s.mo || null, lz: s.lz || null });
  it.w = computeW(it.base, it.att, it.ml); it.mag = Math.min(s.mag ?? it.w.mag, it.w.mag + 1); it.reserve = s.reserve ?? it.w.reserve; it.mode = Math.min(it.mode, it.w.modes.length - 1);
  return it;
}
// guestRun: this run is a friend's co-op game, so it never touches your own saved run. reloading: a different save is being
// loaded, so the run in memory must not be written over it on the way out.
let guestRun = false, reloading = false;
function saveRun() {
  if (!['playing', 'paused', 'shop', 'mutate', 'elevator'].includes(state) || player.hp <= 0 || !mapDef || training || coop || guestRun || reloading) return; // co-op runs can't be continued later
  const p = player, data = {
    v: 1, when: Date.now(), diff: diffKey, floorN, wave, breakT, seed: mapDef.seed, score, runTime, stragglerT, cheat: cheatRun, skill: skill.target, pipTier: player.pipTier || 0, stats: { ...stats }, runXP: { ...runXP }, runPXP, night: nightWave, floorHit: !!player.floorHit,
    p: { hp: p.hp, armor: p.armor, cash: p.cash, nades: p.nades, nvg: !!p.nvg, x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw, pitch: p.pitch, cur: p.cur, prev: p.prev },
    slots: { primary: itemSave(p.slots.primary), secondary: itemSave(p.slots.secondary), melee: itemSave(p.slots.melee) },
    locker: Object.fromEntries(Object.entries(p.locker).map(([k, it]) => [k, itemSave(it)])), hadPrimary: !!p.hadPrimary,
    sup: { lv: { ...support.lv }, stock: { ...support.stock }, scanT: support.scanT }, ab: { ...player.ab },
    mod: floorMod.id, wx: weather, modCash: floorMod.cash, paint, paintFills, char: runChar, daily: dailyRun ? todayKey() : null,
    bots: bots.filter(b => b.alive).map(b => ({ type: b.type, x: b.pos.x, z: b.pos.z, hp: b.hp, elite: b.elite, hpMul: b.hpMul, revealed: !!b.revealed, phase: b.phase || 0 })),
  };
  try { sealSave(RUN_KEY, data); } catch (e) { }
}
function loadRun() {
  try {
    const d = openSave(RUN_KEY);
    // a valid checksum is not enough: old or hand-edited saves may be missing pieces the Continue card reads
    if (!d || d.v !== 1 || d.seed == null || !d.p || !d.slots || !Array.isArray(d.bots)) return null;
    return d;
  } catch (e) { return null; }
}
function clearRun() { dropSave(RUN_KEY); }
function renderContinue() {
  const d = loadRun(), box = $('continueBox'); if (!box) return;
  $('start').innerHTML = `<span class="gol">${ic('play')}${d ? 'NEW RUN' : 'DEPLOY'}</span>`;
  if (!d) { box.innerHTML = ''; return; }
  const mins = Math.round((Date.now() - d.when) / 60000), ago = mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} days ago`;
  const guns = [d.slots.primary, d.slots.secondary].filter(Boolean).map(s => `${byId(s.id)?.name || s.id}${Object.keys(s.ml || {}).length ? " " + Object.keys(s.ml).map(id => mutById(id)?.icon || "").join("") : ""}`).join(' + ');
  box.innerHTML = `<div class="contcard"><div><div class="lbl" style="color:var(--coral);opacity:1">Saved run · ${ago}</div><b>Floor ${d.floorN} · Wave ${d.wave}</b><span>$${Math.round(d.p.cash).toLocaleString()} · ${Math.ceil(d.p.hp)} HP · ${d.bots.length} bots left · ${d.diff}</span><span>${guns}</span></div><button class="go" id="continue"><span class="gol">${ic('play')}CONTINUE</span></button></div>
    <p class="note" style="margin-top:6px">Starting a new run replaces this save.</p>`;
  $('continue').onclick = continueRun;
}
function resetPlayer() {
  player.down = false; player.revT = 0; Object.assign(player, { mc: 0, mcT: -9, mcStill: 0, slamBounce: 0, slideBuf: 0, coyote: 0, jumpBuf: 0, sinceDash: 9, groundT: 0 }); cheatRun = acHit || admOn(); cheats.slow = cheats.bouncy = cheats.confetti = false;
  player.detail = false; player.jCharge = 0; $('hud').classList.remove('inspecting'); $('inspectDetail').classList.remove('on');
  Object.assign(player, { maxHp: upgHp(), spdMul: upgSpd(), hp: upgHp(), armor: 0, cash: 800, nades: 1, nvg: false, nvgOn: true, yaw: 0, pitch: 0, adsT: 0, recoilDebt: 0, yawDebt: 0, bloom: 0, kick: 0, shake: 0, spin: 0, crouch: 0, crouchOn: false,
    cur: 'secondary', prev: 'primary', switchT: 0, burstLeft: 0, semiReady: true, cooking: false, cookT: 0, breath: 4, exhale: 0, camOff: 0, lean: 0, slideT: 0, slideCd: 0, slideQ: false,
    dashT: 0, dashCd: 0, dashQ: false, jumpQ: false, wallT: 0, lastWall: 0, wallBudget: 1.4, mantle: null, roll: 0, fovKick: 0, streak: 0, inspectT: 0, landDip: 0,
    ab: { dash: 1, slam: 1, djump: 1 }, dashCh: 1, grap: null, grapCd: 0, grapQ: false, slamCd: 0, slamming: false, jumpsLeft: 0, airPress: false, gliding: false });
  rope.visible = hook.visible = false;
  lastSlotsKey = lastAbKey = lastRoundsKey = ''; chainN = 0; lastKillT = -9; autosaveT = 0;
  ['killfeed', 'medals', 'dmgnums', 'bloodscreen'].forEach(id => $(id).innerHTML = ''); $('vignette').style.opacity = 0;
}
function continueRun() {
  if (isKicked()) { showKick(); return; }
  if (mustAddEmail()) return;
  const d = loadRun(); if (!d) return;
  try { ac(); musicStart(); } catch (e) { report('Audio', e); }
  try {
    guestRun = false; clearAll(); clearSupport(); resetPlayer();
    diffKey = DIFF[d.diff] ? d.diff : 'normal'; diff = ctx.diff = DIFF[diffKey];
    document.querySelectorAll('#diff button').forEach(x => x.classList.toggle('sel', x.dataset.d === diffKey));
    floorN = d.floorN; mapDef = generateMap(floorN, d.seed); loadMap(mapDef); floorMod = MODS[0];
    resetSkill(d.skill); player.pipTier = d.pipTier || 0;
    applyHeat(Math.max(1, d.wave)); $("hud").classList.toggle("rampage", !!diff.rampage);
    $('mmlabel').textContent = `${mapDef.name.toUpperCase()} · ${mapDef.sizeLabel || ''} · ${mapDef.size * 2}M`;
    placePlayer(); camera.fov = settings.fov;
    const P = d.p; Object.assign(player, { hp: P.hp, armor: P.armor, cash: P.cash, nades: P.nades, nvg: !!P.nvg, nvgOn: true, yaw: P.yaw, pitch: P.pitch || 0, cur: P.cur, prev: P.prev });
    player.pos.set(P.x, P.y || 0, P.z);
    player.slots = { primary: itemLoad(d.slots.primary), secondary: itemLoad(d.slots.secondary) || inst('pip'), melee: itemLoad(d.slots.melee) || inst('knife') };
    player.locker = {}; for (const k in d.locker || {}) { const it = itemLoad(d.locker[k]); if (it) player.locker[k] = it; } player.hadPrimary = !!d.hadPrimary; player.floorHit = !!d.floorHit; runPXP = d.runPXP || 0;
    clearSpellFx();
    if (!player.slots[player.cur]) player.cur = 'secondary';
    Object.keys(stats).forEach(k => stats[k] = d.stats?.[k] || 0); Object.keys(runXP).forEach(k => delete runXP[k]); Object.assign(runXP, d.runXP || {});
    score = d.score || 0; wave = d.wave; runTime = d.runTime || 0; stragglerT = d.stragglerT || 0; if (d.cheat) cheatRun = true;
    player.ab = { dash: 1, slam: 1, djump: 1, ...(d.ab || {}) }; player.dashCh = AB(player.ab, 'dash', 'charges');
    floorMod = { ...modById(d.mod), cash: d.modCash ?? modById(d.mod).cash }; paint = d.paint || 0; paintFills = d.paintFills || 0; frenzyT = 0; runChar = 'rookie'; dailyRun = !!d.daily; training = null; renderModChip(); addPaint(0);
    applyWeather(d.wx || 'clear', true);
    camera.position.set(player.pos.x, player.pos.y + 1.7, player.pos.z); camera.updateMatrixWorld();
    setSupport(d.sup?.lv || Object.fromEntries((d.sup?.drones || []).map(k => [k, 1])), d.sup?.stock || {}, d.sup?.scanT || 0);
    for (const s of d.bots) {
      if (!TYPES[s.type]) continue;
      const b = new Bot(s.type, new V3(s.x, 0, s.z), { elite: s.elite, hpMul: s.hpMul }); b.spawnT = .99;
      b.hp = Math.min(s.hp, b.t.hp); if (b.hp < b.t.hp) { b.setBar(); b.bar.visible = true; } b.revealed = s.revealed; bots.push(tuneBot(b));
      if (b.t.titan) { // put the Titan back in the phase it had reached
        const f = b.hp / b.t.hp; b.phase = s.phase || (f < .33 ? 3 : f < .66 ? 2 : 1); b.stompT = 6;
        if (b.phase === 2) b.t.rate *= .7; if (b.phase >= 3) { b.t.rate *= .6; b.t.speed *= 1.5; }
      }
    }
    nightWave = !!d.night; applyNight();
    breakT = d.bots.length ? 0 : Math.max(d.breakT || 0, 4);
    equipView(); renderPips(); updateHUD(0);
  } catch (e) { report('Loading saved run', e); return; }
  state = 'playing'; ['menu', 'over', 'pause'].forEach(s => show(s, false)); $('hud').classList.add('on'); lock(); if (!coop && NET.isHost() && NET.net.peers.size) coopHostBegin(); // friends on the Friends screen come along
  banner('RUN RESUMED', `FLOOR ${floorN} · WAVE ${wave - (floorN - 1) * 5}/5`);
}
addEventListener('beforeunload', () => saveRun());
// switching tabs or windows: save, pause and go quiet (game sites require this)
document.addEventListener('visibilitychange', () => { if (document.hidden) { saveRun(); if (state === 'playing') pause(); } audioGate(); });

// ---------- flow ----------
const show = (id, on) => $(id).classList.toggle('on', on);
// Mouse capture. Browsers refuse to grab the mouse again for about a second after Esc, and sometimes drop it for no
// reason (alt-tab, a popup, a notification). When that happens the game holds still with a "click to aim" screen and
// grabs the mouse on your next click, instead of carrying on with a loose mouse. Only if the browser can't capture
// the mouse at all (or keeps refusing) do we fall back to plain mouse movement.
let fallback = false, lockFails = 0, lockAsk = 0, lockRetry = 0, aimWait = false, lockAt = 0, mouseSkip = 0, mouseLast = 0;
addEventListener("mousedown", e => { if (e.isTrusted) lockAsk = performance.now(); }, true); // the browser only lets a recent click grab the mouse
const looking = () => document.pointerLockElement === renderer.domElement || fallback;
const report = (where, e) => { console.error(e); window.showErr?.(`${where}: ${e && e.message || e}${e && e.stack ? '\n' + e.stack.split('\n').slice(1, 4).join('\n') : ''}`); };
function aimHint(on) { aimWait = on; $('aimhint').classList.toggle('on', on); }
function lockFailed() {
  if (lockRetry || looking()) return; // the promise and the error event both report the same failure
  if (++lockFails >= 5) { fallback = true; if (aimWait) { aimHint(false); if (state === 'paused') { state = 'playing'; clock.getDelta(); } } return; }
  if (padSeen) return; // controller players don't need the mouse
  if (state === 'playing') { state = 'paused'; stopCooking(); trigger = adsHeld = false; for (const k in keys) keys[k] = false; }
  if (state === 'paused' && !$('pause').classList.contains('on')) aimHint(true);
  lockRetry = setTimeout(() => { lockRetry = 0; if (aimWait && performance.now() - lockAsk < 4500) lock(); }, 1100); // still counts as your click for a few seconds
}
function lock() {
  if (fallback || looking()) return;
  const el = renderer.domElement;
  if (!el.requestPointerLock) { fallback = true; return; }
  lockAt = performance.now();
  try {
    const r = el.requestPointerLock();
    if (r && r.catch) r.catch(lockFailed);
  } catch (e) { lockFailed(); }
}
function lockGot() {
  lockFails = 0; clearTimeout(lockRetry); lockRetry = 0; mouseSkip = 3; // the first moves after a grab can jump
  if (aimWait) { aimHint(false); if (state === 'paused' && !$('pause').classList.contains('on')) { state = 'playing'; clock.getDelta(); } }
}
function clearAll() {
  clearBots(); clearMags(scene); pickups.forEach(p => scene.remove(p.mesh)); pickups.length = 0; nades.forEach(n => scene.remove(n.mesh)); nades.length = 0; clearStrikes(); clearSpellFx();
}
function reset(mode = 'run') {
  dailyRun = mode === 'daily'; training = null; runChar = charUnlocked(charById(prog.char), prog.life) ? prog.char : 'rookie';
  floorMod = MODS[0]; paint = paintFills = frenzyT = 0; $('hud').dataset.mod = 'calm'; $('hud').classList.remove('frenzy');
  guestRun = !!coopGuestStart; nightWave = false;
  // the difficulty is the one picked on Play (a Daily Tower or a friend's game must not leave theirs behind)
  if (dailyRun) diffKey = 'normal'; else if (!coopGuestStart) { const d = document.querySelector('#diff button.sel')?.dataset.d; if (DIFF[d]) diffKey = d; }
  diff = ctx.diff = DIFF[diffKey];
  clearAll(); clearSupport(); floorN = coopGuestStart?.floor || 1; mapDef = coopGuestStart ? generateMap(coopGuestStart.floor, coopGuestStart.seed) : mode === 'train' ? generateMap(1, 4242) : dailyRun ? generateMap(1, dailySeed() + 7919) : generateMap(1); loadMap(mapDef);
  applyWeather('clear', true);
  if (coopGuestStart?.mod) floorMod = modById(coopGuestStart.mod) || MODS[0];
  $('mmlabel').textContent = `${mapDef.name.toUpperCase()} · ${mapDef.sizeLabel || ''} · ${mapDef.size * 2}M`;
  player.pipTier = 0; resetPlayer(); stragglerT = 0; $("hud").classList.remove("rampage"); resetSkill((SKILL[diffKey] || SKILL.normal).start + (perk().skill || 0));
  player.slots = { primary: null, secondary: inst('pip'), melee: inst('knife') }; player.locker = {}; player.hadPrimary = false; player.floorHit = false; clearSpellFx();
  if (perk().freeMut) { const pool = MUTATIONS.filter(m => !['homing'].includes(m.id)), m = pool[Math.floor(Math.random() * pool.length)]; player.slots.secondary.ml[m.id] = 1; refit(player.slots.secondary); }
  // player-level rewards: a head start on every run (not in training)
  if (mode !== 'train') {
    const LP = levelPerks(levelInfo(prog.pxp).lvl);
    player.cash += LP.cash; player.nades += LP.nades; player.armor = Math.max(player.armor, LP.armor);
    if (LP.freeMut) player.slots.secondary.pend++;
    if (LP.spell) { const sp = MUTATIONS.filter(m => m.spell), m = sp[Math.floor(Math.random() * sp.length)]; player.slots.secondary.ml[m.id] = Math.max(1, player.slots.secondary.ml[m.id] || 0); refit(player.slots.secondary); }
    runPXP = 0; const sx = markPlayed(prog); life('daystreak', prog.dq?.streak || 0, true); if (sx) { addPXP(sx); toast(`DAY ${prog.dq.streak} STREAK`, 'Welcome back!', `+${sx} XP for playing today. Come back tomorrow for more.`, '🔥'); }
  }
  placePlayer(); camera.fov = settings.fov;
  Object.keys(stats).forEach(k => stats[k] = 0); Object.keys(runXP).forEach(k => delete runXP[k]);
  score = 0; wave = 0; runTime = 0; renderModChip(); addPaint(0);
  equipView();
  if (mode === 'train') startTraining(); else if (!coopGuestStart) spawnWave(1); // co-op friends wait for the host's bots
  updateHUD(0);
}
function start(mode = 'run') {
  if (isKicked()) { showKick(); return; }
  if (mustAddEmail()) return;
  try { ac(); musicStart(); } catch (e) { report("Audio", e); }
  if (mode !== 'train' && !coopGuestStart) clearRun(); player.drawnGuns = new Set(); // every gun gets its first-draw flourish again
  try { reset(mode); } catch (e) { report("Starting game", e); return; }
  if (mode === 'daily') life('dailies');
  state = 'playing'; ['menu', 'over', 'pause'].forEach(s => show(s, false)); $('hud').classList.add('on'); lock();  if (mode === 'run' && !coop && NET.isHost() && NET.net.peers.size) coopHostBegin(); // friends on the Friends screen come along
}
function pause() {
  if (state !== 'playing') return; endDetail(); stopCooking(); state = 'paused'; trigger = adsHeld = false; show('pause', true); saveRun();
  $('pauseInfo').textContent = `Floor ${floorN} · wave ${wave} · ${bots.filter(b => b.alive).length} bots left · $${Math.floor(player.cash).toLocaleString()} · playing as ${charById(runChar).name}${floorMod.id !== 'calm' ? ` · door: ${floorMod.name}` : ''}${training ? ' · training' : ''}. ${coop ? 'CO-OP: the game keeps going while you are paused, so find cover first!' : 'The bots are frozen too.'}`;
  renderSettings($('settingsPause'));
}
function resume() { state = 'playing'; show('pause', false); clock.getDelta(); lock(); }
function toMenu() {
  if (coop) { if (coop.role === "host") NET.toFriends({ t: "over" }); coopEnd(false); } // quitting a co-op run ends it (for everyone, if you host)
  saveRun(); show('mutate', false); show('elevator', false); bigMap = false; $('minimap').classList.remove('big'); if (training) { training = null; renderTraining(); }
  applyWeather('clear', true);
  state = 'menu'; nightWave = false; ['pause', 'over'].forEach(s => show(s, false)); show('menu', true); $('hud').classList.remove('on');
  if (view) { gunCam.remove(view.group); view = null; }
  clearSupport(); document.exitPointerLock?.(); setupMenuScene(); renderMenu(); renderContinue();
}
function gameOver() {
  if (state === "shop") shop.close(); show("pause", false); show("mutate", false); show("elevator", false);
  if (coop) { if (coop.role === "host") NET.toFriends({ t: "over" }); coopEnd(false); }
  state = 'dead'; trigger = adsHeld = false; document.exitPointerLock?.(); if (!guestRun) clearRun();
  const newBest = score > prog.bestScore;
  prog.bestScore = Math.max(prog.bestScore, score); prog.bestFloor = Math.max(prog.bestFloor, floorN); prog.kills += stats.kills; prog.runs++;
  const dk = todayKey(), dBest = dailyRun && score > (prog.daily[dk]?.score || 0); if (dBest) prog.daily[dk] = { score, floor: floorN, char: runChar };
  const rank = score > 0 ? recordRun(prog, { score, floor: floorN, char: runChar, kills: stats.kills, daily: dailyRun, diff: diffKey, date: dk }) : -1; saveProg(); sendScore();
  const LI = levelInfo(prog.pxp);
  $('s-score').textContent = score.toLocaleString(); $('s-wave').textContent = `${floorN} · ${wave}`; $('s-kills').textContent = stats.kills;
  $('s-acc').textContent = (stats.fired ? Math.round(stats.hit / stats.fired * 100) : 0) + '%'; $('s-hs').textContent = stats.heads; { const T = tierOf(skill.eff); $('s-skill').textContent = T[1]; $('s-skill').style.color = T[2]; } $('s-cash').textContent = '$' + stats.earned.toLocaleString();
  $('s-streak').textContent = stats.bestStreak; $('s-time').textContent = `${Math.floor(runTime / 60)}:${String(Math.floor(runTime % 60)).padStart(2, '0')}`;
  $('overSub').textContent = `${dailyRun ? `Daily Tower ${dk}: ` : ''}you reached floor ${floorN}, ${mapDef.name}, as ${charById(runChar).name}.${dBest ? ' New best today!' : ''} +${runPXP.toLocaleString()} XP · player level ${LI.lvl} (${LI.into.toLocaleString()}/${LI.need.toLocaleString()}).${rank >= 0 ? ` #${rank + 1} on your leaderboard.` : ''}`;
  const xp = Object.entries(runXP);
  $('s-xp').innerHTML = xp.length ? xp.map(([id, n]) => { const L = levelOf(prog.xp[id]); return `<div><b>${byId(id).name}</b><i><b style="width:${L.need ? L.into / L.need * 100 : 100}%"></b></i><span>LV ${L.level} · +${n}</span></div>`; }).join('') : '<p class="gnote">No kills with a gun this run.</p>';
  $('best').textContent = newBest && score > 0 ? `★ NEW PERSONAL BEST · best floor ${prog.bestFloor}` : `Personal best: ${prog.bestScore.toLocaleString()} · best floor ${prog.bestFloor}`;
  setTimeout(() => show('over', true), 900);
}
$('start').onclick = () => start(); $('again').onclick = () => start(dailyRun ? 'daily' : 'run'); $('resume').onclick = resume; $('quit').onclick = toMenu; $('tomenu').onclick = toMenu;
$('shop').addEventListener('mousedown', e => e.stopPropagation());
$('pause').addEventListener('mousedown', e => { if (e.target.closest('.card')) e.stopPropagation(); });
$('pauseAdmin').onclick = () => { SND.ui(); if (staff()) openAdmin(); };

// ---------- anti-cheat ----------
// Blocks the tricks cheat scripts use in a browser game:
//  - fake clicks and key presses sent by a script (only real input from you counts; the controller code is allowed),
//  - reading the colours on screen to find bots (how auto-shoot "triggerbots" decide when to fire),
//  - hooking into the game's frame loop to run every frame,
//  - editing saves from outside the game (see save protection in the skins file).
// A run where something is caught doesn't give XP or badges. None of this can stop someone who changes the game's own
// files, so the online leaderboard (later) will also check runs on the server.
const padEvs = new WeakSet(); // the controller's own key presses
const RAF0 = window.requestAnimationFrame, raf = RAF0.bind(window);
const caught = new Set(); let acHit = false; // once a cheat tool is caught, every run this session stops counting
function cheatFlag(what) {
  if (caught.has(what)) return; caught.add(what); acHit = true;
  if (state !== 'menu') cheatRun = true;
  banner('🛡 ANTI-CHEAT', `${what.toUpperCase()} BLOCKED · THIS RUN WON'T COUNT`); SND.deny();
  try { const k = 'psAC', n = +(localStorage.getItem(k) || 0); localStorage.setItem(k, String(n + 1)); } catch (e) { } // for the server checks later
  console.warn('Pastel Siege anti-cheat: blocked', what);
}
// reading the game's picture: readPixels on its 3D context, or copying the game canvas into a 2D canvas
{
  const gameCanvas = renderer.domElement, gl = renderer.getContext();
  const blockRead = function (...a) { if (this === gl || this.canvas === gameCanvas) { cheatFlag('screen reading'); const out = a[6]; if (out && out.fill) out.fill(0); return; } return realRead.apply(this, a); };
  const proto = Object.getPrototypeOf(gl), realRead = proto.readPixels;
  try { Object.defineProperty(proto, 'readPixels', { value: blockRead, writable: false, configurable: false }); } catch (e) { }
  try { Object.defineProperty(gl, 'readPixels', { value: blockRead, writable: false, configurable: false }); } catch (e) { }
  const C2 = CanvasRenderingContext2D.prototype, realDraw = C2.drawImage;
  try { Object.defineProperty(C2, 'drawImage', { value: function (img, ...a) { if (img === gameCanvas) { cheatFlag('screen reading'); return; } return realDraw.call(this, img, ...a); }, writable: false, configurable: false }); } catch (e) { }
  for (const m of ['toDataURL', 'toBlob', 'captureStream']) {
    const real = HTMLCanvasElement.prototype[m]; if (!real) continue;
    try { Object.defineProperty(gameCanvas, m, { value: function (...a) { cheatFlag('screen reading'); return m === 'toDataURL' ? 'data:,' : null; }, writable: false, configurable: false }); } catch (e) { }
  }
}
// someone replacing requestAnimationFrame to run code right after each frame we draw
setInterval(() => { if (window.requestAnimationFrame !== RAF0) cheatFlag('frame hook'); }, 2000);
const realInput = e => e.isTrusted || padEvs.has(e);
// more checks every 2 seconds. Everything here looks for things no human can do, never for playing well:
//  - built-in functions swapped out by a script after the page loaded (put back straight away),
//  - speed hacks: the game's clock running much FASTER than real time for 6 seconds straight. The sound card keeps real
//    time, so we compare with it too. A slow or paused clock (laptop asleep, lag, background tab) is never flagged.
const G0 = window.__psGuard, acClk = { p: 0, d: 0, a: null, off: 0 };
setInterval(() => {
  if (G0) for (const what of G0.check()) {
    if (what === 'clock') continue; // put back silently: some privacy extensions wrap the clock; real speed hacks are caught below
    cheatFlag(what.startsWith('extra ') ? 'prototype hook' : `${what} hook`);
  }
  if (window.requestAnimationFrame !== RAF0 && (!G0 || window.requestAnimationFrame !== G0.nat.raf)) { window.requestAnimationFrame = RAF0; cheatFlag('frame hook'); }
  const p = performance.now(), d = G0 ? G0.nat.dateNow() : Date.now(), a = audioClock();
  if (acClk.p) {
    const dp = p - acClk.p, dd = d - acClk.d, da = a != null && acClk.a != null ? (a - acClk.a) * 1000 : null;
    const fast = (dd > 1000 && dp / dd > 1.25) || (da != null && da > 1000 && dp / da > 1.25);
    acClk.off = fast ? acClk.off + 1 : 0; if (acClk.off >= 3) { cheatFlag('speed hack'); acClk.off = 0; }
  }
  acClk.p = p; acClk.d = d; acClk.a = a;
}, 2000);
// auto-clickers (a program clicking for you): even the fastest human clickers are a few milliseconds uneven every click;
// programs hit the exact same gap. Uses the mouse's own timestamps, and needs it twice in a row (50 clicks).
const clickTimes = []; let clickStrikes = 0;
function clickCheck(e) {
  clickTimes.push(e.timeStamp); if (clickTimes.length > 25) clickTimes.shift();
  if (clickTimes.length < 25) return;
  const gaps = []; for (let i = 1; i < 25; i++) gaps.push(clickTimes[i] - clickTimes[i - 1]);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length, sd = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
  if (mean < 300 && sd < 1.2) { if (++clickStrikes >= 2) { cheatFlag('auto-clicker'); clickStrikes = 0; } clickTimes.length = 0; }
  else if (clickTimes.length === 25 && sd > 4) clickStrikes = 0;
}
// ---------- input ----------
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === renderer.domElement) { lockGot(); return; }
  if (state === 'playing' && !fallback) pause();
});
document.addEventListener('pointerlockerror', lockFailed);
// clicking the "click to aim" screen grabs the mouse; Esc there goes to the pause menu
$('aimhint').addEventListener('mousedown', e => { e.stopPropagation(); if (!e.isTrusted) return; lockAsk = performance.now(); lockFails = Math.min(lockFails, 3); lock(); });
// safety net: if the mouse came loose without the browser telling us, or the "click to aim" screen is left over, fix it
setInterval(() => {
  if (aimWait && (state !== 'paused' || looking() || $('pause').classList.contains('on'))) { aimHint(false); if (state === 'paused' && looking() && !$('pause').classList.contains('on')) { state = 'playing'; clock.getDelta(); } }
  if (state === 'playing' && !looking() && !padSeen && !lockRetry && performance.now() - lockAt > 1500 && document.hasFocus()) pause();
}, 400);
// every key and mouse button goes through the player's bindings (Settings > Keybinds); c is the original code the game reacts to
let rebinding = null; // set while Settings is waiting for "press a key"
function pressBound(c, e) {
  if (c === 'KeyT') { if (state === 'playing' && NET.net.on) { e?.preventDefault?.(); openChat(); } return; }
  if (c === 'KeyM' && state === 'playing') { bigMap = !bigMap; $('minimap').classList.toggle('big', bigMap); SND.ui(); return; }
  if (c === 'KeyB') { if (state === 'playing') openShop(); else if (state === 'shop') closeShop(); return; }
  if (state === 'mutate' && c === 'KeyN') { closeMutate(); return; }
  if (state !== 'playing') return;
  keys[c] = true;
  if (c === 'Mouse0') { trigger = true; return; }
  if (c === 'Mouse2') { adsHeld = settings.toggleAds ? !adsHeld : true; return; }
  if (c === 'Space') player.jumpQ = true;
  if (c === 'KeyR') startReload();
  if (c === 'KeyV') { const it = cur(); it.mode = (it.mode + 1) % it.w.modes.length; player.burstLeft = 0; SND.click(); if (view) view.modeT = .28; } // thumb flicks the selector
  if (c === 'Digit1') switchTo('primary'); if (c === 'Digit2') switchTo('secondary'); if (c === 'Digit3') switchTo('melee');
  if (c === 'KeyX') switchTo(player.prev);
  if (c === 'KeyC') {
    const fast = Math.hypot(player.vel.x, player.vel.z) > 7.5 || player.dashT > 0;
    if (!player.onGround && trySlam()) { } else if (!player.onGround) player.slideBuf = .3; // slide the moment you land
    else if (player.sprinting || fast) player.slideQ = true; else player.crouchOn = settings.crouchHold ? true : !player.crouchOn;
  }
  if (c === 'KeyH') player.grapQ = true;
  if (c === 'KeyK') { if (!useScan()) SND.deny(); }
  if (c === 'KeyL') toggleNVG();
  if (c === 'KeyJ') { player.cant = !player.cant; toast('AIM STYLE', player.cant ? 'Tilted aim ON' : 'Tilted aim OFF', player.cant ? 'Aiming holds the gun on its side: less zoom, quicker sight picture' : 'Back to normal sights', '◢'); }
  if (c === 'KeyF') player.dashQ = true;
  if (c === 'KeyN') { if (pendingItem()) openMutate(); else SND.deny(); }
  if (c === 'KeyI') insHold = .0001; // tap = quick inspect (on release), hold = detailed inspect
  if (c === 'KeyG' && player.nades > 0 && !player.cooking) { player.cooking = true; player.cookT = 0; SND.click(); }
  if (c === 'Enter' && breakT > 0 && !NET.isGuest()) { breakT = 0; nextWave(); }
}
function releaseBound(c) {
  keys[c] = false;
  if (c === 'Mouse0') trigger = false;
  if (c === 'Mouse2' && !settings.toggleAds) adsHeld = false;
  if (c === 'KeyC' && settings.crouchHold) player.crouchOn = false;
  if (c === 'KeyG' && player.cooking && state === 'playing') throwNade();
  if (c === 'KeyI') { if (player.detail) endDetail(); else if (insHold > 0 && state === 'playing') startInspect(); insHold = 0; }
}
addEventListener('keydown', e => {
  if (!realInput(e)) { if (state === 'playing') cheatFlag('fake key presses'); return; }
  if (rebinding) return;
  if (adBusy()) return; // no input while an ad is showing
  if (e.target && e.target.tagName === 'INPUT') return; // typing a code
  if (admKey(e) && staff() && (state === 'playing' || state === 'paused')) { e.preventDefault(); openAdmin(); return; }
  const c = padEvs.has(e) ? e.code : bindIn(e.code);
  if (state === 'playing' && (['Space', 'Tab'].includes(e.code) || c)) e.preventDefault(); // stop the page scrolling or the browser grabbing bound keys
  if (state === 'shop' && c !== 'KeyB') { if (shop.key(e.code)) e.preventDefault(); return; }
  if (e.code === 'Escape' && fallback && state === 'playing') { pause(); return; }
  if (e.code === 'Escape' && aimWait) { aimHint(false); state = 'playing'; pause(); return; }
  if (state === 'mutate' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) { pickMutation(+e.code.slice(5) - 1); return; }
  if (state === 'mutate' && e.code === 'Escape') { closeMutate(); return; }
  if (state === 'elevator') { if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) elevPick(+e.code.slice(5) - 1); else if (e.code === 'Enter' && elevN === 1) elevPick(0); return; }
  if (!c || e.repeat) { if (c && state === 'playing') keys[c] = true; return; }
  pressBound(c, e);
});
addEventListener('keyup', e => { if (!realInput(e)) return; const c = padEvs.has(e) ? e.code : bindIn(e.code); if (c) releaseBound(c); });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; trigger = adsHeld = false; });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousedown', e => {
  if (!e.isTrusted) { if (state === 'playing') cheatFlag('fake clicks'); return; } // auto-shoot scripts send pretend clicks
  if (state === "playing" && e.button === 0) clickCheck(e);
  if (rebinding || state !== 'playing') return;
  if (!looking()) { lockAsk = performance.now(); lock(); return; } // this click grabs the mouse, it doesn't shoot
  if (e.button === 1 || e.button > 2) e.preventDefault(); // middle click autoscroll / back-forward buttons
  const c = bindIn('Mouse' + e.button); if (c) pressBound(c, e);
});
addEventListener('mouseup', e => { if (rebinding || !e.isTrusted) return; const c = bindIn('Mouse' + e.button); if (c) releaseBound(c); });
addEventListener('auxclick', e => { if (state === 'playing') e.preventDefault(); });
addEventListener('wheel', e => { if (state !== 'playing') return; const order = ['primary', 'secondary', 'melee'].filter(k => player.slots[k]), i = order.indexOf(player.cur); switchTo(order[(i + (e.deltaY < 0 ? order.length - 1 : 1)) % order.length]); }, { passive: true });
addEventListener('mousemove', e => {
  if (!e.isTrusted) { if (state === 'playing') cheatFlag('fake mouse movement'); return; } // aimbots turn the camera with pretend mouse moves
  if (state !== 'playing' || !looking()) return;
  // browsers sometimes report one huge jump when the mouse is grabbed or wobbles (a known Chrome bug); skip those
  if (mouseSkip > 0) { mouseSkip--; return; }
  const big = Math.abs(e.movementX) + Math.abs(e.movementY);
  if (big > 900 && mouseLast < 40) { mouseLast = big; return; }
  mouseLast = big;
  if (player.detail && view) { view.dYaw += e.movementX * .007; view.dPitch = clamp(view.dPitch + e.movementY * .007, -1.3, 1.3); view.dIdle = 0; return; }
  const sens = .0022 * settings.sens * (camera.fov / settings.fov) * (player.adsT > .5 ? settings.adsSens : 1);
  const dp = -e.movementY * sens * (settings.invertY ? -1 : 1); player.pitch = clamp(player.pitch + dp, -1.5, 1.5);
  if (dp < 0 && player.recoilDebt > 0) player.recoilDebt = Math.max(0, player.recoilDebt + dp); // pulling down pays back recoil
  player.yaw -= e.movementX * sens; mouseDX += e.movementX; mouseDY += e.movementY;
});

// ---------- controllers ----------
// Standard layout (Xbox names): sticks move/look, RT fire, LT aim, A jump, B crouch/slide (slam in the air), X reload, Y swap,
// LB frag (hold to cook), RB dash, L3 sprint, R3 inspect, d-pad: up grapple, down mutate, left recon scan, right night vision,
// View = shop, Menu = pause. In the door/mutation pickers X A B pick 1 2 3.
let padPrev = [], padSprint = false, aimOnEnemy = false, padSeen = false;
const PAD_KEYS = { 0: 'Space', 1: 'KeyC', 2: 'KeyR', 3: 'KeyX', 4: 'KeyG', 5: 'KeyF', 11: 'KeyI', 12: 'KeyH', 13: 'KeyN', 14: 'KeyK', 15: 'KeyL', 8: 'KeyB' };
const keyEv = (type, code) => { const ev = new KeyboardEvent(type, { code, bubbles: true }); padEvs.add(ev); dispatchEvent(ev); }; // controller presses skip the key bindings
function pollPad(dt) {
  if (emailBox) return; // the email box has to be answered first
  const pads = navigator.getGamepads ? navigator.getGamepads() : [], gp = [...pads].find(p => p && p.connected);
  if (!gp) return;
  if (!padSeen) { padSeen = true; toast('CONTROLLER CONNECTED', gp.id.split('(')[0].trim().slice(0, 40) || 'Gamepad', 'Menu button pauses · View opens the shop', '🎮'); }
  const b = i => !!gp.buttons[i]?.pressed, val = i => gp.buttons[i]?.value || 0, was = i => !!padPrev[i];
  const press = i => b(i) && !was(i), release = i => !b(i) && was(i);
  const dz = v => Math.abs(v) < .16 ? 0 : (v - Math.sign(v) * .16) / .84;
  if (state === 'playing') {
    const lx = dz(gp.axes[0] || 0), ly = dz(gp.axes[1] || 0), rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
    // only touch keys the pad is using, so the keyboard and mouse keep working with a controller plugged in
    const mv = Math.abs(lx) > .3 || Math.abs(ly) > .3;
    if (mv || padPrev.mv) { keys.KeyW = ly < -.3; keys.KeyS = ly > .3; keys.KeyA = lx < -.3; keys.KeyD = lx > .3; }
    padPrev.mv = mv;
    const sp0 = padSprint; if (press(10)) padSprint = !padSprint; if (ly > -.3) padSprint = false; if (padSprint !== sp0) keys.ShiftLeft = padSprint;
    // look: curved response, slower when aiming and a little friction over enemies
    const k = 3.1 * settings.sens * settings.padSens * (camera.fov / settings.fov) * (player.adsT > .5 ? settings.adsSens * .75 : 1) * (aimOnEnemy ? .6 : 1) * dt;
    player.yaw -= Math.sign(rx) * rx * rx * k; const dp = -Math.sign(ry) * ry * ry * k * .8 * (settings.invertY ? -1 : 1); player.pitch = clamp(player.pitch + dp, -1.5, 1.5);
    if (dp < 0 && player.recoilDebt > 0) player.recoilDebt = Math.max(0, player.recoilDebt + dp);
    const rt = val(7) > .35, lt = val(6) > .35; if (rt || padPrev.rt) trigger = rt; if (lt || padPrev.lt) adsHeld = lt; padPrev.rt = rt; padPrev.lt = lt;
    for (const i in PAD_KEYS) { if (press(+i)) keyEv('keydown', PAD_KEYS[i]); if (release(+i)) keyEv('keyup', PAD_KEYS[i]); }
    if (press(9)) pause();
  } else if (state === 'paused') { if (press(9) || press(1)) resume(); }
  else if (state === 'shop') {
    for (const [i, c] of [[12, 'ArrowUp'], [13, 'ArrowDown'], [14, 'ArrowLeft'], [15, 'ArrowRight'], [0, 'Enter']]) if (press(i)) keyEv('keydown', c);
    if (press(1) || press(8)) keyEv('keydown', 'KeyB');
  } else if (state === 'mutate' || state === 'elevator') {
    if (press(2)) keyEv('keydown', 'Digit1'); if (press(0)) keyEv('keydown', elevN === 1 && state === 'elevator' ? 'Enter' : 'Digit2'); if (press(1)) keyEv('keydown', 'Digit3');
    if (press(3) && state === 'mutate') keyEv('keydown', 'KeyN');
  } else if (state === 'menu') { if (press(0)) { if (loadRun()) continueRun(); else start(); } } // never throws away a saved run
  else if (state === 'dead') { if (press(0)) start(dailyRun ? 'daily' : 'run'); if (press(1)) toMenu(); }
  padPrev = Object.assign(gp.buttons.map(x => x.pressed), { mv: padPrev.mv, rt: padPrev.rt, lt: padPrev.lt });
}
addEventListener('gamepadconnected', () => { padSeen = false; });
// ---------- loop ----------
const clock = new THREE.Clock();
let menuT = 0, loopErr = false, fpsT0 = 0, fpsLast = 0, fpsTimes = [], mmTick = 0, hudAcc = 0;
// Auto resolution: if frames are slow for a second, render a little smaller (down to 60%); climb back when it runs smoothly.
let arT = 0, arN = 0, arGood = 0;
function autoRes(dt) {
  if (!settings.autoRes || (QUALITY[quality.level] || {}).noAuto || (+settings.fpsCap && +settings.fpsCap < 60)) { if (getResScale() !== 1) setResScale(1); return; }
  arT += dt; arN++; if (arT < 1) return;
  const avg = arT / arN, k = getResScale(); arT = arN = 0;
  if (avg > 1 / 50 && k > .75) { setResScale(Math.max(.75, k - .05)); arGood = 0; } // small steps and never below 75%, so it can't turn blurry
  else if (avg < 1 / 58 && k < 1 && ++arGood >= 2) { setResScale(Math.min(1, k + .05)); arGood = 0; }
}
try { setupMenuScene(); renderMenu(); renderContinue(); } catch (e) { report('Loading map', e); }if (tamper.keys.length) setTimeout(() => toast('SAVE PROTECTED', 'Your save was changed outside the game', 'It has been put back to your last real save.', '🛡'), 1500);
// browsers only allow sound after a click: the menu theme starts on the first one
addEventListener('pointerdown', () => { try { ac(); musicStart(); } catch (e) { } }, { once: true });
// Frame pacing. "Uncapped" skips the browser's vsync wait and draws frames back to back as fast as your computer
// can (the counter shows the real number); the screen itself still only refreshes at your monitor's rate,
// but your inputs get to the game sooner. Number caps hold the game at that rate.
const mc = new MessageChannel(); let lastFrame = 0;
mc.port1.onmessage = () => loop();
function schedule() {
  // not on Mac: drawing out of step with the screen there causes stutter and heat, so Unlimited acts like Monitor
  if (settings.fpsCap === 'uncapped' && !IS_MAC && !document.hidden && state === 'playing') mc.port2.postMessage(0);
  else raf(loop); // the browser's own version, so a script that swaps it out can't ride along on our frames
}
// Tac Light attachment: a spotlight from your gun into the world
const torch = new THREE.SpotLight(0xfff4dc, 0, 55, .38, .55, 1.4); scene.add(torch, torch.target);
const nvgEl = $("nvg");
// night waves and night vision goggles
let nightWave = false;
function applyNight() { setNight(nightWave, nightWave && player.nvg && player.nvgOn); }
function toggleNVG() { if (!player.nvg) return SND.deny(); player.nvgOn = !player.nvgOn; SND.click(); applyNight(); }
function updateTorch() {
  const N = state === "playing" && (world.night || world.nvg), on = state === "playing" && cur()?.w.torch && (!player.sprinting || N);
  nvgEl.classList.toggle("on", N && !!world.nvg); followGlow(camera.position);
  torch.intensity = lerp(torch.intensity, on ? (N ? 110 : 70) : 0, .25);
  if (torch.intensity < .5) return;  // stays in the scene at 0 so turning it on never stalls to rebuild shaders
  camera.getWorldDirection(_tdir);
  torch.position.copy(camera.position).addScaledVector(_tdir, .3); torch.position.y -= .12; torch.target.position.copy(camera.position).addScaledVector(_tdir, 20); torch.target.updateMatrixWorld();
}
const _tdir = new V3();
// ProMotion (120 Hz) MacBook Pros: if the game can't hold 120 it jumps between 120 and 60, which feels like lag.
// On "Monitor" frame rate, a Mac that keeps missing frames locks to a steady 60 for the rest of the session.
let macCap = 0, macGap = 8.3, macMin = 99, macT = 0;
function macPace(gap) {
  if (gap > 50) return; // tab switch or a one-off hitch
  macMin = Math.min(macMin, gap); macGap = lerp(macGap, gap, .03);
  if (macMin < 9.5 && macGap > 10.4) { if ((macT += gap / 1000) > 2) macCap = 60; } else macT = 0;
}
function loop() {
  const cap = +settings.fpsCap || macCap, now = performance.now();
  if (cap && now - lastFrame < 1000 / cap - .6) { schedule(); return; }
  if (lastFrame && IS_MAC && !+settings.fpsCap && !macCap && state === 'playing' && !document.hidden) macPace(now - lastFrame);
  if (bench && lastFrame) bench.gaps.push(now - lastFrame);
  lastFrame = now; schedule();
  try { frame(); } catch (e) { if (!loopErr) { loopErr = true; report('Game loop', e); } }
  if (bench) try { benchTick(); } catch (e) { report("Graphics test", e); benchEnd(false); }
  try { netFrame(lastDt); } catch (e) { if (!mpErr) { mpErr = true; report("Multiplayer", e); } }
}
function frame() {
  const dt = Math.max(Math.min(clock.getDelta(), .05), 1e-5) * ((cheats.slow || adm.slow) && state === "playing" ? .5 : 1);
  lastDt = dt;
  try { pollPad(dt); } catch (e) { }
  playState(state === 'playing');
  if (thumbQ.length) pumpThumbs();
  // FPS counter from real frame times (not the clamped game step). "1% low" is the speed of the slowest frames,
  // and "worst" is the longest frame: those are what you feel as stutter, even when the average is high.
  if (settings.fps) {
    const now = performance.now(); if (fpsLast) fpsTimes.push(now - fpsLast); fpsLast = now;
    if (now - fpsT0 > 1000 && fpsTimes.length > 5) {
      const s = fpsTimes.slice().sort((a, b) => b - a), avg = fpsTimes.reduce((a, b) => a + b, 0) / fpsTimes.length;
      const low = s.slice(0, Math.max(1, Math.round(s.length / 100))).reduce((a, b) => a + b, 0) / Math.max(1, Math.round(s.length / 100));
      const el = $('fps'); el.textContent = `${Math.round(1000 / avg)} FPS · 1% low ${Math.round(1000 / low)} · worst ${s[0].toFixed(1)} ms · res ${renderPct()}% · ${drawCalls} draws`;
      el.style.color = s[0] > avg * 3 && s[0] > 25 ? '#ff6b5e' : ''; fpsTimes = []; fpsT0 = now;
    }
  } else fpsLast = 0;
  const live = liveNow(), me = state === 'playing';
  if (live) {
    runTime += dt;
    // downed in co-op: you lie on the floor and can only look around until a friend revives you
    if (!me) { /* co-op: in the shop or a menu, the world keeps going around you */ }
    else if (player.down) { camera.position.set(player.pos.x, player.pos.y + .45, player.pos.z); camera.rotation.set(player.pitch, player.yaw, .35); if (view) view.group.visible = false; }
    else updatePlayer(dt);
    const Q = QUALITY[quality.level] || QUALITY.high, thinkN = Q.think || 2;
    // far-off bots that aren't fighting think every other frame (with twice the time step); Potato and Low also slow down near bots that haven't seen you
    for (let i = bots.length - 1; i >= 0; i--) {
      const b = bots[i]; b.acc = (b.acc || 0) + dt;
      if (b.puppet) { if (!puppetStep(b, dt)) { b.remove(); bots.splice(i, 1); } continue; } // co-op friend: copy of the host's bot
      if (b.alive && !b.sees && (b.far || thinkN > 2) && (b.tick = (b.tick || 0) + 1) % (b.far ? thinkN : 2)) continue;
      const step = Math.min(b.acc, .1); b.acc = 0;
      // co-op host: the bot may be chasing a friend instead of you
      const T = coop?.role === "host" && b.alive ? botTarget(b) : null;
      if (adm.freeze && b.alive) continue; // admin: frozen bots
      if (!(T ? withTarget(T, () => b.update(step)) : b.update(step))) bots.splice(i, 1);
    }
    updateShots(dt); updateNades(dt); updateStrikes(dt); if (weather === 'storm') updateStorm(dt); updatePickups(dt); updateSupport(dt, runTime); updateStragglers(dt); updateBurns(dt); updateSpells(dt); updateSkill(dt); updateTitan(dt);
    if (frenzyT > 0) { frenzyT -= dt; $('hud').classList.toggle('frenzy', frenzyT > 0); }
    if (training) updateTraining(dt);
    if (diff.rampage) for (const k of ["primary", "secondary"]) { const it = player.slots[k]; if (it && !it.w.projectile) it.reserve = Math.max(it.reserve, it.w.reserve); }
    if ((autosaveT += dt) > 15) { autosaveT = 0; saveRun(); }
    if (!bots.some(b => b.alive) && wave > 0 && coop?.role !== 'guest') {
      if (breakT <= 0) {
        if (nightWave) { nightWave = false; applyNight(); }
        if (player.down) revive(30); // co-op: everyone gets back up between waves
        breakT = 12; const bonus = 400 + wave * 100 + (wave % 5 === 0 ? 1500 * floorN : 0); earn(bonus); if (floorMod.id !== 'blood') player.hp = Math.min(player.maxHp, player.hp + 15);
        banner(`WAVE ${wave} CLEARED`, wave % 5 === 0 ? `+$${bonus} · NEXT WAVE CLIMBS TO FLOOR ${floorN + 1}` : `+$${bonus} BONUS · ${keyLabel('shop')} TO SHOP`);
        renderPips(); saveProg(); saveRun();
      }
      const before = Math.ceil(breakT); breakT -= dt; if (breakT > 0 && breakT <= 3 && Math.ceil(breakT) < before) SND.click(); if (breakT <= 0) { if (me || floorOf(wave + 1) === floorN) nextWave(); else breakT = .01; } // co-op: the elevator waits until you leave the shop
    }
    // Potato and Low redraw the HUD and minimap less often: writing to the page every frame costs more than the 3D on slow laptops
    if (me) updateAim(); hudAcc += dt; if (!Q.hudHz || hudAcc >= 1 / Q.hudHz) { updateHUD(hudAcc); hudAcc = 0; }
    if (++mmTick % (Q.mm || 2) === 0) drawMinimap();
    autoRes(dt);
  } else if (state === 'menu') {
    menuT += dt * .07; const r = Math.min(world.size * .9, 62);
    camera.position.set(Math.sin(menuT) * r, 30, Math.cos(menuT) * r); camera.lookAt(0, 0, 0);
    camera.fov = 75; camera.updateProjectionMatrix();
    for (let i = bots.length - 1; i >= 0; i--) if (!bots[i].update(dt)) bots.splice(i, 1);
  }
  if (live || state === "menu") { const q = QUALITY[quality.level] || QUALITY.high; updateDebris(dt); updateMags(dt, scene, magFloor, insideSolid, (p, h) => at3(p, () => SND.magDrop(Math.min(1, h / 4)))); updateLOD(camera.position, world.night ? Math.min(q.lod, 44) : q.lod, quality.shadow && !world.night ? q.botShadow : 0); }
  updateFx(dt); updateAtmos(dt); updatePads(performance.now() / 1000); updateWeatherFx(dt); updateImmersion(dt);
  followShadow(state === "menu" ? { x: 0, z: 0 } : player.pos); setListener(camera);
  updateTorch(); updateEdges(camera.position);
  // music follows the fight: calm in menus and between waves, drums when spotted, full score for the boss
  musicLevel(state === 'menu' ? -1 : state === "playing" ? (breakT > 0 ? 0 : diff.rampage || bots.some(b => b.alive && b.t.boss) ? 3 : bots.some(b => b.alive && b.sees) ? 2 : 1) : 0);
  post.uniforms.hurt.value *= Math.exp(-dt * 4);
  // solo pause, shop and mutation screens: draw the frozen world once and stop, so the overlay text stays put
  // (redrawing behind a blurred overlay made the mutation descriptions flicker away on some Macs) and the laptop rests
  const frozen = !live && (state === 'paused' || state === 'mutate' || state === 'shop');
  if (frozen && frozenDrawn) return;
  frozenDrawn = frozen;
  renderer.info.reset(); // count draws over the whole frame (scene, shadows, gun and effects), not just the last pass
  post.sunOn = world.night || world.nvg ? 0 : 1;
  post.render(() => renderer.render(scene, camera), performance.now() / 1000,
    view && state !== "menu" ? () => { renderer.clearDepth(); renderer.render(gunScene, gunCam); } : null, camera, frozen ? 12 : 0); // a still frame gets extra ray tracing passes so it's smooth at once
  drawEsp(); shown.p.copy(camera.position); shown.q.copy(camera.quaternion); shown.ok = state === "playing"; // the view on screen right now: your next shot is checked against this
  drawCalls = renderer.info.render.calls;
}
loop();
window.__gameReady = true;
sdkInit().then(sdkLoaded);
{ const b = document.getElementById('boot'); if (b) { b.classList.add('done'); setTimeout(() => b.remove(), 700); } }
