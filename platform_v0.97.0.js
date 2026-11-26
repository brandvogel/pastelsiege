// Game-site hooks. Each release's index.html sets window.PS_PLATFORM to 'web', 'crazygames' or 'poki';
// the preview leaves it unset ('dev'). Everything here is safe when a site's SDK is missing or blocked: it just does nothing.
import { ac } from './audio_v0.97.0.js';

export const PLATFORM = window.PS_PLATFORM || 'dev';

// What each site allows. Poki bans visible body fluids; CrazyGames must be PEGI 12, so no over-the-top gore there.
// The first allowed value is the default on that site.
const RULES = {
  poki: { blood: ['off'], gore: ['normal'] },
  crazygames: { blood: ['paint', 'oil', 'red', 'off'], gore: ['normal'] },
};
export function allowed(key, opts) { const r = RULES[PLATFORM]?.[key]; return r ? opts.filter(o => r.includes(o[0])) : opts; }
export function enforce(settings) {
  const r = RULES[PLATFORM]; if (!r) return;
  for (const k in r) if (!r[k].includes(settings[k])) settings[k] = r[k][0];
}

const CG = () => { const s = window.CrazyGames?.SDK; return PLATFORM === 'crazygames' && s && s.environment && s.environment !== 'disabled' ? s : null; };
const PK = () => PLATFORM === 'poki' && window.PokiSDK ? window.PokiSDK : null;
const safe = f => { try { const r = f(); if (r && r.catch) r.catch(() => { }); } catch (e) { } };
let ready = false, playing = false, adOn = false, siteMute = false, lastAd = performance.now();

// sound is off while the tab is hidden, an ad is showing, or the site asks for silence
export function audioGate() { try { const a = ac(); if (document.hidden || adOn || siteMute) a.suspend(); else a.resume(); } catch (e) { } }
export const adBusy = () => adOn;

export async function sdkInit() {
  try {
    if (PLATFORM === 'crazygames' && window.CrazyGames?.SDK) {
      await window.CrazyGames.SDK.init();
      const g = CG()?.game;
      if (g) { siteMute = !!g.settings?.muteAudio; safe(() => g.addSettingsChangeListener(s => { siteMute = !!s.muteAudio; audioGate(); })); safe(() => g.loadingStart()); }
    } else if (PLATFORM === 'poki' && window.PokiSDK) await window.PokiSDK.init();
  } catch (e) { console.warn('site SDK', e); }
  ready = true; audioGate();
}
export function sdkLoaded() { safe(() => CG()?.game.loadingStop()); safe(() => PK()?.gameLoadingFinished()); }

// called every frame; tells the site when real gameplay starts and stops (menus, pause, shop, elevator, death)
export function playState(on) {
  if (!ready || on === playing || adOn) return; playing = on;
  if (on) { safe(() => CG()?.game.gameplayStart()); safe(() => PK()?.gameplayStart()); }
  else { safe(() => CG()?.game.gameplayStop()); safe(() => PK()?.gameplayStop()); }
}

// a between-floors ad, at most every 3 minutes. done() always runs, even if the ad fails or is blocked.
export function midAd(done = () => { }) {
  const cg = CG(), pk = PK();
  if (!ready || (!cg && !pk) || performance.now() - lastAd < 180000) return done();
  lastAd = performance.now(); playState(false);
  let fin = false;
  const start = () => { adOn = true; audioGate(); };
  const end = () => { if (fin) return; fin = true; adOn = false; audioGate(); done(); };
  try {
    if (cg) cg.ad.requestAd('midgame', { adStarted: start, adFinished: end, adError: end });
    else pk.commercialBreak(start).then(end, end);
  } catch (e) { end(); }
  setTimeout(end, 90000); // never leave the game stuck if a site forgets to answer
}

// big moments only (a Titan kill): CrazyGames throws confetti
export function happy() { safe(() => CG()?.game.happytime()); }

// on game sites the page around the game can scroll: stop space/arrows and the wheel from moving it during play
if (PLATFORM === 'crazygames' || PLATFORM === 'poki') {
  addEventListener('keydown', e => { if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) e.preventDefault(); });
  addEventListener('wheel', e => { if (document.pointerLockElement) e.preventDefault(); }, { passive: false });
}
