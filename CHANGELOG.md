# Changelog

## v95 — 2026-11-26

### Fixed

- **Legacy saves are no longer wiped.** In `skins_v95.js` the migration check was swallowed by a trailing `//` comment, so a pre-checksum save was treated as tampered, deleted, and the player was told "SAVE PROTECTED". The check now runs and is covered by a regression test.
- **The admin Leech is reachable again.** It shared the id `leech` with the normal Leech MP, so both admin buttons handed over the SMG. The admin version is now `leechadmin`.
- **No more spawning inside a staircase.** On rare map seeds a staircase reached into the spawn pad. The generator now nudges the spawn to the closest clear spot.
- **Daily streaks survive clock changes.** "Yesterday" was calculated as `now - 24 hours`, which lands on the wrong calendar day after a daylight-saving switch. It now subtracts one day with `Date.setDate()`.
- **Rebinding reads the bindings you give it.** `rebind()` used the game's currently applied key map instead of the `binds` argument, so editing a copy could swap the wrong actions.
- **Multiplayer shots are validated.** A malformed `shot` message could throw or feed `NaN` into the tracer renderer.
- **The weapon card tells the truth.** It claimed "headshots one-tap" for every gun; it now reports the real headshot count. The Monolith suppressor's 10 m hearing radius is no longer shown as 14 m.
- **A damaged saved run can no longer break the menu.** `loadRun()` checks the pieces the Continue card reads before using them.

### Added

- `package.json` with `npm test` / `node --test` and a local `serve` script.
- 38 tests covering save sealing and migration, weapon and attachment data, map generation, daily quests, levelling, controls, crosshair share codes, and run rewards.
- `CHANGELOG.md` and a `.gitignore`.

### Changed

- All modules renamed from `*_v94.js` to `*_v95.js`, and the service-worker cache version bumped, so returning players receive the fixes instead of cached v94 files.
- `_headers` now uses proper `#` comments instead of pseudo C-style comments that were parsed as path rules.
- Removed a dead `JSON.parse` in the save-import confirmation.
