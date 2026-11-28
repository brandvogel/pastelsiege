# Changelog

## v0.99.2

### More ways to sign in
- **Continue with Google** and **Continue with Discord** on the sign-in screen. New players pick their username once; a Google or Discord account with the same email as an existing account joins it.
- **Forgot password?** emails a reset link; opening it signs you in and asks for a new password.
- **Email me a sign-in link** signs you in without a password.
- Links only work in the browser that asked for them, so a forwarded link can't sign someone into your account.
- Google sign-in uses Google's own button, so Google names pastelsiege.com instead of the account server's address.
- New **Terms of Service** (`/terms`) and **Privacy Policy** (`/privacy`) pages, linked from the sign-in screen.

## v0.99.1

### Security headers
- New `vercel.json` gives the website proper security headers on Vercel (which ignores the old `_headers` file):
  - **Content-Security-Policy**: the page may only load code from itself and jsdelivr (three.js, PeerJS), and only connect to itself, Supabase, the relay and the PeerJS server, so an injected script can't load from or leak data to anywhere else.
  - **No embedding** on other sites (stops click-jacking and fake copies wrapping the real game), HTTPS-only (HSTS), no camera, microphone or location access, and safer referrer and opener settings.
  - **Caching**: versioned game files are cached forever; the page, `sw.js` and the manifest are always checked for updates.

### Faster on every computer
- **Fixed a big slowdown when a run starts.** The game was drawing about 80 gun pictures for the shop and menus *during* play, one per frame, each building a full 3D gun and compiling its shaders. That held many computers near 30 FPS on every preset for the first minutes of a run. Now only pictures you can actually see get drawn during a run (at most one a second), the rest wait for the menus, and compiled shaders are kept instead of thrown away after each picture.
- Shaders no longer make the browser stop and wait while they compile (the error checks that forced it are only on while developing), so new effects and guns appearing mid-fight don't hitch.
- Potato and Low drop the expensive extras on guns, robots and props (clear coat, sheen, brushed-metal streaks, fine bump maps): the biggest per-pixel cost on a gun that fills a big part of the screen.
- The FPS counter (Settings > HUD) now shows **CPU** and **GPU** time per frame, so it's clear whether the computer or the graphics chip is the limit.
- **Battery saver warning:** browsers in Energy Saver / Low Power Mode hold every page at 30 FPS whatever the settings. When the game sees frames arriving exactly 33 ms apart while it only needs a fraction of that, it says so once, with how to turn it off.

### Custom graphics
- **Custom** is always in the Quality list, and choosing it opens an editor: resolution, shadows, post effects, glow, edge smoothing, materials & effects, surface bumps, ground details, bot detail range, outline range, rain & snow, clouds, far bot updates and HUD updates. Each row says roughly how much it costs, so it's easy to see what to turn down first.
- **Start from** copies any preset into Custom as a starting point. The graphics test still builds a Custom preset, and now you can change it afterwards.

### Gun position
- Guns sit a little closer to the middle and higher, and move further in on narrower screens (16:10 laptops, tablets, phones), so the gun, the casings flying out and the reloads stay in view instead of behind the ammo panel.
- The ammo panel is smaller.

### Guns
- **Pistol slides cycle like the real thing:** they slam back about a third of their length, pause as the case flies, spring forward and settle. On the last round the slide locks back until you reload. Dual pistols too.
- **Spent cases stay on the floor** for 20 seconds (25 on High, 30 on Ultra, 12 on Potato), and twice as many can lie around at once.
- **Bassier, thumpier shots:** a kick-drum style thump (a fast pitch drop, lightly saturated so it comes through on laptop and phone speakers), a fuller low body, a softer crack, and the master compressor lets more of the punch through.
- **Reloads get slicker as your player level goes up**, on every gun (and up to 22% faster on top of each gun's level perks):
  - Lv 1-4: a careful mag swap. Lv 5-9: smoother and quicker.
  - Lv 10-14: the new mag twirls in your fingers; pistols drop the slide with the thumb instead of racking it.
  - Lv 15-19: a wrist flick throws the old mag clear, the new one flips end over end into the well.
  - Lv 20: the movie reload: flick the old mag away, toss the new one up spinning, roll the gun under it and catch it.
- **Detailed inspects** (hold the inspect key; three per gun, in turn): the full check (run your hand along it, turn it to see both sides, press-check the chamber, half-drop the mag to see the rounds, slap it home), the showcase (look down the sights, roll it to see underneath, tap the side), and the roll. Revolvers swing the cylinder out and spin it, break-actions crack open, bolt guns work the bolt.

### Melee
- Melee weapons are held higher and every swing stays on screen (overheads and upswings used to end below the bottom edge). Two-handed swings no longer stretch the off-hand arm across your view.
- **Five new melee weapons:** Combat Tomahawk, Crowbar, Kukri, Shock Baton (its hits stun bots for a moment, crackling with electricity) and a two-handed Fire Axe.

### Robots bleed oil
- Robots now spill **black oil with the odd squirt of glowing coolant** instead of blood, and their oil leaves shiny stains with a rainbow film like a real oil slick.
- Every hit throws **sparks** and sometimes an **electric arc** from torn wiring. Dying robots **short-circuit**: arcs crackle all over them with a blue-white flash and a shower of sparks. Their flying parts keep sparking as they tumble and scrape sparks off the floor.
- Settings: "Robot insides" (Oil & sparks, Red blood, Paint, Off) and "Gore" (Carnage, Over the top, Normal). Over the top is the default. Saves that had Red switch to Oil once (you can switch back).

### New robots
- **Rocketeer** (floor 8+): hangs back and fires splashing rockets.
- **Arc Walker** (9+): walks in close and arcs electricity into you; each zap slows you for a moment.
- **Sentry** (9+): a planted turret that never moves and never stops firing.
- **Leech** (10+): a drone that latches on, drains your health and heals itself with it.
- **Mortar** (11+): lobs shells from far away; a glowing orange ring shows where each will land.

### Bosses
- **Four bosses take turns**, one per floor, each with its own look and attacks, two rage phases (at 2/3 and 1/3 health: faster, bigger attacks, and backup arrives) and attacks that get stronger and more frequent the higher the floor:
  - **Warden** (now with glowing vents, exhaust stacks and a sensor mast): cannons and rockets, then **missile rain**, rings marking where shells land, more each phase.
  - **Ravager** (dark red, spiked shoulders and spine, horns): a shotgun up close, **charges** straight at you, and from phase 2 **slams the ground** (jump the shockwave).
  - **Tesla** (blue, with humming coils): chain lightning at long range, **lightning strikes** all around you, and an electric **overload nova** up close in phase 3.
  - **Overseer** (a giant flying eye): rapid fire and a burning **laser sweep** across the ground (two crossing sweeps from phase 2), and it calls Hornets.
- The admin panel can spawn each boss.

### Maps: doors, windows and things that break
- **Doors** in doorways: a proper frame, a panelled door with hinges and a handle on each side. They swing open (away from you) as soon as you or a bot walks up, and close behind you. Shut, they're solid: they block you, and bullets from both sides.
- **Glass windows** with a frame, a cross bar and a sill. You and the bots can see through them, but they stop bullets and bodies until they're broken: one shot or blast shatters them in a shower of glass.
- **Breakable wooden crates**, built like real ones (dark corner posts, plank faces, a cross brace, metal corner brackets). They take a few hits, then splinter apart into planks and dust, and bots path through the gap. Explosions break everything nearby.
- In co-op, broken glass and crates break for everyone.

### Weather
- **Wet ground, puddles and snow on the world itself.** In rain, floors and walls soak up over about 10 seconds, turning darker and glossy. Over the next half minute puddles collect in low spots on flat ground, with soaked dark edges. They mirror the sky (brightest at low angles, like real water), raindrops ripple their surface, and ray-traced reflections add the world on top when they're on. In snow, white settles on everything that faces up. Everything dries off or melts slowly once the weather clears.
- **Rain** is soft streaks that face you and slant with the wind, instead of thin lines, and there's more of it.
- **Splashes**: bright rings spread where drops land (twice as many as before), and close by little droplets jump up and fall back. Puddles ripple with every drop.
- **Hail**: a new weather. Ice pellets pour down and clatter all around, bounce off the ground, leave a light white cover, and sting (a little damage) when you're out in the open. Get under a roof.
- **Splashes under your feet**: walking on wet ground kicks up small splashes, running through puddles sends up big ones (with a splashy sound), landings splash, and slides spray water.
- **Runoff**: water pours off the corners of building roofs in the rain and splashes where it lands.
- **Snow footprints and slide trails**: once snow has settled you leave a trail of footprints (with a little kick of snow) and long grooves where you slide. None under roofs.
- Potato now has rain too (it had none), and rain is brighter and easier to see on every preset.
- **Admin panel > Weather tab**: switch to any weather instantly, keep it on every floor, turn night on or off, and set rain/snow amount, wind, puddles, snow cover, fog and splashes with sliders. SOAK / SETTLE NOW skips ahead, DRY OUT clears the ground, and LIGHTNING AT CROSSHAIR calls a strike where you aim (in any weather).

## v0.99.0 (unreleased)

### Changed: new player characters

- Players are armoured spacefighters, in co-op and on the Character screen. Each has a glossy helmet with a gold mirror visor, layered armour plates, pauldrons, gauntlets with a wrist computer, knee pads, mag boots and a life-support pack.
- Your look paints the character: **Shirt** colours the armour, **Pants** the legs and **Visor** the visor tint and every glowing strip. Hats and back items sit on the new body.
- Characters bend their knees when they walk and crouch, and hold their rifle with both hands.
- Each character is merged into about 35 draw calls, so four friends cost about the same as the old robots.
- Your first-person arms match: armour gauntlets in your shirt colour, a cream suit, dark gloves with armoured knuckles, and a vent and wrist computer glowing in your visor colour.

### Added: reload animations for every kind of gun

- Your left arm has a real elbow now, so the hand can reach anywhere and the arm follows.
- **Magazine guns** tilt to show the mag well. Empty reloads drop the old mag, which falls to the floor and stays there for a while. Partial reloads keep the old mag and put it away. Your hand fetches a fresh mag from the pouch, seats it and taps it home.
- Empty reloads then finish the gun's own way: ARs slap the bolt catch, AKs and SMGs rack their charging handle, bolt guns work the bolt, and pistols rack the slide, which stays locked back until then.
- **Shotguns and lever guns** load each round by hand, with the shell visible in your fingers, then pump at the end.
- **Revolvers** swing the cylinder out, dump all six cases, load and flick it shut.
- **Double barrels** break open, pop both hulls and load two fresh ones.
- **Bullpups and P90-style guns** reach behind the grip or over the top for the mag.
- Sounds follow the animation: mag release, pouch, seat, tap and rack.

### Added: more gun animations

- **First draw.** The first time you pull out each gun in a run, you rack it, check the mag, spin the cylinder or snap the action shut.
- **Idle fidgets.** Stand still for a while and you glance at your wrist computer or check that the mag is seated.
- Changing **fire mode** flicks the gun a little.
- **Pistols** are held at high ready, muzzle up, while sprinting.
- The gun tucks back when you stand right against a wall.
- The pump moves your hand with it.

### Changed: shell ejection

- Spent cases are real shapes: bottlenecked rifle brass, short pistol cases, bigger sniper cases and red shotgun hulls with brass heads.
- Cases come out of the gun's ejection port and tumble end over end. They bounce off walls and land on roofs and crates, not only the ground. They lie flat, tink as they bounce, and stay down for 3 seconds (Potato) up to 45 (Super Ultra).

### Changed: better guns

Guns have surface detail: stippled polymer grips, brushed metal, raised wood grain, and handling marks that change how shiny the paint is.

### Changed: the world looks more detailed

- **Surface relief.** Walls and ground have detail that catches the light: mortar lines, plank gaps, corrugated metal, paving seams and sand ripples. It's on from Medium up.
- **Ground clutter.** Pebbles, rocks and tufts of grass (or dry grass, snow lumps or toy bricks, depending on the map) are scattered over open ground. There are more on higher presets and none on Potato and Low.
- **Light.** The sun is lower, so buildings cast real shadows and walls have a lit side and a shaded side. The sky fill is a little softer.

### Added: ray tracing settings

- **Settings > Graphics > Ray tracing**: Off, Performance, Quality or Max, or Preset, where Super Ultra uses Max.
- Rays are traced through the scene for soft shadows in every corner, coloured light bouncing off nearby walls, glossy reflections (mirror-like on wet ground in the rain) and sun rays.
- Results are smoothed over several frames and follow the camera, so the noisy speckle of the old Super Ultra pass is gone. Performance and Quality work at half resolution, which is much cheaper.
- Ray-traced reflections and sun rays can each be turned off.
- New **motion blur** (Off, Low or High) smears the world when you turn fast. Your gun stays sharp.
- Pause screens get extra passes, so screenshots are smooth straight away.

### Changed: faster first-person drawing

The gun and arms you hold are merged per material: about 35 draw calls instead of 90 to 130.

### Added: a relay server for blocked networks

- `relay/` holds the backup relay that multiplayer already knew how to use but that was never written. It runs on a homelab behind a Cloudflare Tunnel, so school Wi-Fi sees an ordinary secure website. It's the fallback when a direct connection or the PeerJS matchmaking server is blocked.
- It refuses other websites, full games and floods of messages, and drops connections that go silent. It includes Docker and Docker Compose files, setup steps and tests.
- The game uses it automatically: `RELAY_URL` in `net_v0.99.0.js` points at `wss://relay.pastelsiege.com`.

## v0.98.0 (unreleased)

### Changed: the menus are redesigned

Same colours, fonts and chunky look, with one set of parts for every page.

- **Pages down the left.** Every page is always one click away in a side list, instead of hidden behind the ☰ button. On small windows the list slides out from the left.
- **A title bar on every page** with the page name, what it's for, fullscreen and your account.
- **Play** puts difficulty first, then one big DEPLOY, then Daily Tower and Training side by side. Your level, records and today's quests sit in their own column, with your streak and next level reward.
- **Settings**: on/off options are switches, every help note sits under its setting, and rows line up.
- **Armory** groups guns by type, with shorter cards.
- **Help** splits the controls into Moving, Shooting and Gear and menus, and lists every key you can rebind. The other help is split into cards.
- **Multiplayer, Records, Character, Awards and Bestiary** use the same card layout.
- **Pop-ups** (sign in, saves, email) have one title size, full-width fields and tidy button rows.
- **New icons.** Every button uses one hand-drawn icon set in the game's outline style, instead of a mix of emoji and symbols that looked different on each computer. That includes the page list, top bar, account, buy menu sections, pause, game over and close buttons.
- **New buttons.** Every button has one shape: an ink outline, a raised shadow and a soft bevel, and it sinks in when pressed. There are three sizes and an icon on every button. The top-bar **Sign in** button is now a solid navy button, and once you sign in it shows your initial, name and save status. Daily Tower, Training and "Which save do you want?" use large icon tiles.
- **More room around text.** Help notes, hints and messages no longer sit right against buttons and their shadows.
- **Pause** has a wider layout with settings beside the buttons, and **Game over** shows its stats in three even rows with Play again and Main menu side by side.

## v0.97.0

Versions now use semantic versioning: v97 is 0.97.0. Older entries are renumbered the same way.

### Fixed: "Which save do you want?"

- It no longer appears when progress is the same, when only settings or daily quests differ, or after signing out and back in.
- Nothing uploads while the question is unanswered, or before your account save has been checked, so it can't be overwritten first.

## v0.96.0

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

## v0.95.0 — 2026-11-26

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

- All modules renamed from `*_v94.js` to `*_v95.js`, and the service-worker cache version bumped, so returning players receive the fixes instead of cached v0.94.0 files.
- `_headers` now uses proper `#` comments instead of pseudo C-style comments that were parsed as path rules.
- Removed a dead `JSON.parse` in the save-import confirmation.
