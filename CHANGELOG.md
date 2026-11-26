# Changelog

## v97 (unreleased)

### Fixed: "Which save do you want?"

- It no longer appears when progress is the same, when only settings or daily quests differ, or after signing out and back in.
- Nothing uploads while the question is unanswered, or before your account save has been checked, so it can't be overwritten first.

## v96

### Changed: accounts use real emails

- New accounts need a username, an email and a password, and the email must be confirmed before signing in.
- Accounts without an email must add and confirm one the next time the game opens. The box can't be closed, except by signing out.
- Sign in with your email. Accounts that haven't added one yet sign in with their username.
- While Supabase's "Confirm email" setting is off, new sign-ups are paused and nobody is asked for an email.

### Fixed: menus and HUD

- **Style-name clashes.** Detailed inspect no longer puts a solid panel over the game, mutation descriptions no longer fade away, and the HUD weapon name, armory cards and built-in mutation tag no longer pick up another element's style.
- **One set of button sizes.** Dialog rows, friends, admin and leaderboard buttons match; the graphics test button is small again; the top bar and pages span the full width.
- **One type scale** (10 to 64 px, 13 sizes instead of 34), larger settings explanations and popup titles, consistent card and screen titles, fewer corner radii and border widths.
- Co-op host buttons, HUD counters and top chips, Rampage/Frenzy banners, short-window Deploy button and assorted spacing. Overridden old styles removed.
- Minimap and name-tag text follow the Font setting.

### Fixed: game

- Glass Cannon, one-hit kills, Smite, Kill aura and executes now kill armoured bots.
- A Titan no longer jumps to phase 3 after continuing a run; friends' hits now advance its phases, and a friend's game no longer spawns its own backup.
- Continuing a run keeps night waves, door and weather effects on bots, the "took damage" flag and the run's XP.
- Joining a friend's game no longer deletes your saved run; importing a save from the pause menu is no longer overwritten by the current run.
- Controller A on the menu continues a saved run instead of replacing it.
- Daily Tower or a friend's game no longer changes your chosen difficulty.
- Co-op guests earn weapon XP and mutation progress for their kills.
- A grenade being cooked is put away when you pause or open a menu.
- Backspace now clears a keybind, and on-screen key hints follow your keybinds.
- The normal Leech MP has its own description again, and Pip-9 upgrades keep the Rapid-Fire Barrel bonus.
- Laser dot shows on walls; the boss bar names the Titan.
- An abandoned multiplayer attempt can no longer end a newer one, hosting errors stay on screen, and junk network data is rejected.
- Names and messages from other players are escaped before being shown.
- Account token refresh runs once at a time; space and arrows work in text boxes on game sites.

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
