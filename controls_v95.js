// Rebindable controls. The game logic still talks in its original codes ("internal" below: KeyW, Space, Mouse0...);
// every real key or mouse button is translated through the player's bindings first, so nothing else had to change.
// Mouse buttons are written as Mouse0 (left), Mouse1 (middle), Mouse2 (right), Mouse3 / Mouse4 (side buttons).

// [id, label, internal code, default key, group]
export const ACTIONS = [
  ['fwd', 'Move forward', 'KeyW', 'KeyW', 'Move'],
  ['back', 'Move back', 'KeyS', 'KeyS', 'Move'],
  ['left', 'Move left', 'KeyA', 'KeyA', 'Move'],
  ['right', 'Move right', 'KeyD', 'KeyD', 'Move'],
  ['sprint', 'Sprint / steady scope', 'ShiftLeft', 'ShiftLeft', 'Move'],
  ['jump', 'Jump / climb / glide', 'Space', 'Space', 'Move'],
  ['crouch', 'Crouch / slide / slam', 'KeyC', 'KeyC', 'Move'],
  ['dash', 'Dash', 'KeyF', 'KeyF', 'Move'],
  ['grapple', 'Grapple hook', 'KeyH', 'KeyH', 'Move'],
  ['grapple2', 'Grapple hook (2nd key)', 'KeyH', 'Mouse1', 'Move'],
  ['leanL', 'Lean left', 'KeyQ', 'KeyQ', 'Move'],
  ['leanR', 'Lean right', 'KeyE', 'KeyE', 'Move'],
  ['fire', 'Fire', 'Mouse0', 'Mouse0', 'Combat'],
  ['aim', 'Aim down sights', 'Mouse2', 'Mouse2', 'Combat'],
  ['reload', 'Reload', 'KeyR', 'KeyR', 'Combat'],
  ['mode', 'Fire mode', 'KeyV', 'KeyV', 'Combat'],
  ['primary', 'Primary weapon', 'Digit1', 'Digit1', 'Combat'],
  ['secondary', 'Sidearm', 'Digit2', 'Digit2', 'Combat'],
  ['melee', 'Melee weapon', 'Digit3', 'Digit3', 'Combat'],
  ['swap', 'Last weapon', 'KeyX', 'KeyX', 'Combat'],
  ['nade', 'Frag (hold to cook)', 'KeyG', 'KeyG', 'Combat'],
  ['inspect', 'Inspect weapon', 'KeyI', 'KeyI', 'Combat'],
  ['scan', 'Recon scan', 'KeyK', 'KeyK', 'Gear'],
  ['nvg', 'Night vision on / off', 'KeyL', 'KeyL', 'Gear'],
  ['cant', 'Tilted aim on / off', 'KeyJ', 'KeyJ', 'Combat'],
  ['mutate', 'Pick a mutation', 'KeyN', 'KeyN', 'Menus'],
  ['shop', 'Buy menu', 'KeyB', 'KeyB', 'Menus'],
  ['map', 'Full map', 'KeyM', 'KeyM', 'Menus'],
  ['chat', 'Co-op chat', 'KeyT', 'KeyT', 'Menus'],
  ['next', 'Start next wave early', 'Enter', 'Enter', 'Menus'],
];
const DEFAULT_KEYS = new Set(ACTIONS.map(a => a[3]));
export const NOBIND = new Set(['Escape', 'MetaLeft', 'MetaRight', 'ContextMenu']); // Esc always pauses / cancels

let map = {}, byAct = {};
// binds = { actionId: code } holding only the ones the player changed
export function setBinds(binds = {}) {
  map = {}; byAct = {};
  for (const [id, , internal, def] of ACTIONS) { const k = binds[id] || def; byAct[id] = k; if (k) map[k] = internal; }
}
// real code -> the internal code the game reacts to, or null if that key now does nothing
export function bindIn(code) {
  if (code in map) return map[code];
  return DEFAULT_KEYS.has(code) ? null : code;
}
export const keyOf = id => byAct[id] || '';
// assign a key; whatever action had it before gets this action's old key (a swap), so nothing is ever lost.
// Everything is read from the `binds` argument, so a caller editing a copy (or an older settings object) still swaps correctly.
const keyIn = (binds, id, def) => binds[id] || def;
export function rebind(binds, id, code) {
  const out = { ...binds }, act = ACTIONS.find(a => a[0] === id), old = act ? keyIn(binds, id, act[3]) : keyOf(id);
  for (const [other, , , def] of ACTIONS) if (other !== id && keyIn(binds, other, def) === code) out[other] = old;
  out[id] = code; return out;
}
const NAMES = { Mouse0: 'L-Click', Mouse1: 'Middle mouse', Mouse2: 'R-Click', Mouse3: 'Mouse 4', Mouse4: 'Mouse 5', Space: 'Space',
  ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'L-Alt', AltRight: 'R-Alt',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
  Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', CapsLock: 'Caps', Enter: 'Enter', Tab: 'Tab', Backspace: 'Backspace' };
export function keyName(code) {
  if (!code) return '—';
  if (NAMES[code]) return NAMES[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  if (code.startsWith('Mouse')) return 'Mouse ' + (+code.slice(5) + 1);
  return code;
}
export const keyLabel = id => keyName(keyOf(id));
