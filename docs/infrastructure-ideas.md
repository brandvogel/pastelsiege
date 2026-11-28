# Pastel Siege: infrastructure ideas

A backlog to come back to. ⭐ = do first. The current setup: the website on Vercel; accounts, saves and
leaderboards on Supabase; email through Supabase SMTP; the multiplayer relay on the homelab (venus) behind a
Cloudflare Tunnel; PeerJS for direct co-op connections. DNS is on Cloudflare.

**Top 5 by impact for the effort:** move email to Resend · retire the old Netlify site · GitHub Actions CI ·
crash reporting · nightly database backups.

## Email and accounts (Supabase Auth)
- ⭐ **Move email off personal Gmail** to Resend (in progress, see the end of this file), Postmark or Brevo, sending
  from `noreply@pastelsiege.com`. Bounces stop landing in a personal inbox, delivery improves, no Gmail send cap.
  Set up SPF, DKIM and DMARC.
- ⭐ **Password reset in the game.** Supabase supports it; the game needs the screen.
- **Clean up placeholder accounts.** Once most players have moved to a real email, delete never-confirmed
  `@players.pastelsiege.game` accounts and turn "Secure email change" back on.
- **Turn off the "Email address changed" notification** while placeholder accounts exist (it emails the old fake
  address and bounces).
- **Sign in with Google, Discord or Apple.** No passwords to forget; Discord suits gamers.
- **Magic-link sign-in** as an option.
- **CAPTCHA on sign-up** (hCaptcha / Cloudflare Turnstile, both supported by Supabase).
- **Custom email templates** in the game's pastel style.

## Database (Supabase Postgres)
- ⭐ **Review Row Level Security** on every table (profiles, leaderboard, cloud saves): nobody can read or edit
  another player's data.
- ⭐ **Backups.** The free plan has no point-in-time restore: nightly `pg_dump` from venus to its disk or Cloudflare R2.
- **Check scores on the server.** The game sends run stats to an Edge Function that checks they're plausible before
  writing the score.
- **Weekly and daily leaderboards** reset by a scheduled job (pg_cron).
- **A cleanup job** for stale presence rows, expired kicks and old empty accounts.
- **Indexes** on leaderboard and username lookups.
- **Daily Tower results stored server-side** so everyone's daily run is compared fairly.
- **Admin audit log**: every kick, mute, rank change and score wipe, and who did it.

## Supabase Edge Functions
- **Anti-cheat checks** for run stats, achievement claims and cloud saves.
- **Discord webhook**: post world-record runs, new bug reports and other events to a Discord channel.
- **In-game bug reports** stored with game version, browser, GPU and recent errors.
- **Server-side redeem codes** so codes can't be read out of the game files.

## Hosting and delivery (Vercel and Cloudflare)
- ⭐ **Retire the old Netlify deploy** so nobody plays an outdated build.
- **Cache headers**: versioned files (`*_vX.Y.Z.js`) cached forever and immutable; `index.html` and `sw.js` never cached.
- **Host three.js locally** instead of jsdelivr (CDN outages, school networks that block CDNs).
- **Preview deploys**: every pushed branch gets its own Vercel URL to test and share with testers.
- **Cloudflare in front of the site** for caching, DDoS protection and analytics.
- **Compression**: make sure the large JS files are served gzip/brotli.

## Multiplayer infrastructure (when multiplayer work resumes)
- **Own PeerJS signalling server** on venus behind the Cloudflare Tunnel, instead of the free public PeerJS cloud.
- **TURN server** (coturn on venus, or Cloudflare Calls TURN) so direct connections work behind strict NATs and
  school networks. Probably why direct joins fail and fall back to the relay.
- **Relay health checks** with auto-restart (systemd / Docker restart policy) and an alert when it's down.
- **Relay limits**: rate limiting and room caps so one bad client can't flood it.
- **A second relay region** on a cheap VPS (Fly.io, Hetzner) for players far from Australia.

## Monitoring
- ⭐ **Error reporting**: send in-game crash reports to Sentry (free tier) or a Supabase table, with browser, GPU and
  version.
- **Uptime checks**: UptimeRobot / Better Stack / Uptime Kuma pinging the site, relay and Supabase, with phone alerts.
- **Privacy-friendly analytics**: Plausible, Umami (self-host on venus) or Cloudflare Web Analytics: players per day,
  devices, where people drop off.
- **Performance data**: anonymous FPS / CPU / GPU times by preset and GPU, to tune defaults for real hardware.
- **A status page** for site, accounts and multiplayer.

## Development workflow
- ⭐ **GitHub Actions CI**: run `npm test` on every push; a broken build can't be deployed.
- **A release script**: bump the version, rename versioned files, update `sw.js`, `package.json` and the changelog,
  run tests, tag the release.
- **Browser tests in CI**: headless Playwright: load the game, start a run, fire and reload, fail on any page error.
- **A staging Supabase project** so testing never touches real player data.
- **Branch protection** on main: only changes that pass tests.
- **Dependabot / Renovate** for three.js and the relay's packages.

## The homelab (venus)
- **A proper dev server**: a systemd or Docker web server instead of ad-hoc Python servers, behind a
  password-protected Cloudflare Tunnel hostname (Cloudflare Access), e.g. `dev.pastelsiege.com`, for testing from
  any device. Safer than random public quick-tunnel links.
- **Self-hosted tools**: Umami, Uptime Kuma, a Gitea mirror of the repo, the PeerJS server.
- **Back up venus itself**: relay config, tunnel token, database dumps, copied to another drive or the cloud.

## Player-facing extras
- **Cloud save conflicts**: when two devices disagree, show both saves and let the player pick.
- **Account deletion and data export** (good practice; some stores require it).
- **Moderation**: auto-mute for chat flooding, a report-player button, a ban list checked at sign-in.
- **Announcements from the database**: a message-of-the-day / patch-notes panel updated in Supabase, no redeploy.
- **Remote config**: a settings table to switch features on or off for everyone (events, double-XP weekends,
  disabling a buggy feature) without a release.

## Resend setup checklist (email from noreply@pastelsiege.com)
1. Create a Resend account and add the domain `pastelsiege.com`.
2. Add Resend's DNS records in Cloudflare (Resend can do it automatically with "Sign in to Cloudflare"):
   a DKIM TXT record at `resend._domainkey`, plus an MX and an SPF TXT record on the `send` subdomain. These don't
   touch the root MX/SPF, so incoming mail to the domain keeps working. Leave all of them **DNS only** (grey cloud).
3. Add a DMARC record: TXT `_dmarc` = `v=DMARC1; p=none;` (tighten to `p=quarantine` once mail flows cleanly).
4. Wait for Resend to show the domain as **Verified**.
5. Create an API key with **Sending access** only, restricted to `pastelsiege.com`.
6. Supabase → Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port `465`, username `resend`,
   password = the API key, sender `noreply@pastelsiege.com`, sender name `Pastel Siege`.
7. Supabase → Authentication → Rate Limits: raise "emails per hour" (the built-in limit is tiny).
8. Test: sign up with a fresh email, and add an email to an old account. Check the mail arrives (not in spam) and
   that the Resend dashboard shows it delivered.
9. Revoke the Gmail app password Supabase used, so it can't be misused.
