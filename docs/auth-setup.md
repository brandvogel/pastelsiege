# Sign-in options: Supabase setup

The game supports: email + password, **sign-in links by email** (magic links), **password reset**, **Google** and
**Discord**. These are the one-time steps in Supabase (project `qembjixloxurcybpivli`) and with Google / Discord.

## 1. SQL (Supabase → SQL Editor → New query → Run)

New Google / Discord players have no game username yet. This gives them a temporary one (`player123456`) and lets
them pick their real one once; the game shows a "Pick your username" box. Normal email sign-ups are unchanged
(a taken username still fails, as before). Safe to run more than once.

```sql
alter table public.profiles add column if not exists needs_name boolean not null default false;

create or replace function public.new_player() returns trigger
language plpgsql security definer set search_path to '' as $$
declare n text := lower(new.raw_user_meta_data ->> 'username'); tries int := 0;
begin
  if n is null then -- Google / Discord: a temporary name until they pick one
    loop
      n := 'player' || lpad(floor(random() * 1000000)::text, 6, '0');
      exit when not exists (select 1 from public.profiles where username = n);
      tries := tries + 1;
      if tries > 20 then n := 'p' || substr(replace(new.id::text, '-', ''), 1, 15); exit; end if;
    end loop;
    insert into public.profiles (id, username, needs_name) values (new.id, n, true);
  else
    insert into public.profiles (id, username) values (new.id, n);
  end if;
  return new;
end $$;

create or replace function public.set_username(name_ text) returns text
language plpgsql security definer set search_path to '' as $$
declare n text := lower(trim(name_));
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and needs_name) then raise exception 'You already have a username'; end if;
  if n !~ '^[a-z0-9_]{3,16}$' then raise exception 'Usernames are 3 to 16 letters, numbers or _'; end if;
  if exists (select 1 from public.profiles where username = n and id <> auth.uid()) then raise exception 'That username is taken.'; end if;
  update public.profiles set username = n, needs_name = false where id = auth.uid();
  return n;
end $$;
revoke all on function public.set_username(text) from public, anon;
grant execute on function public.set_username(text) to authenticated;
```

## 2. Where links may send people back to (Authentication → URL Configuration)

- **Site URL:** `https://www.pastelsiege.com`
- **Redirect URLs** (add each):
  - `https://www.pastelsiege.com/**`
  - `https://pastelsiege.com/**`
  - `http://localhost:8765/**` and `http://127.0.0.1:8765/**` (local testing)

## 3. Email links (Authentication → Emails)

Magic links and password reset use the **Magic Link** and **Reset Password** templates; the defaults work. Optional:
reword them in the game's voice. (Keep `{{ .ConfirmationURL }}` in them.)

## 4. Google (Google Cloud Console → APIs & Services)

1. **OAuth consent screen**: External; app name "Pastel Siege"; support email; authorised domain `pastelsiege.com`;
   scopes `email`, `profile`, `openid`. Publish the app ("In production") so anyone can sign in.
2. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorised JavaScript origins: `https://www.pastelsiege.com`
   - Authorised redirect URI: `https://qembjixloxurcybpivli.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client secret** into Supabase → Authentication → Sign In / Providers → **Google** →
   enable → save. Leave "Skip nonce checks" off.
4. Put the same **Client ID** in the game: `GOOGLE_CLIENT_ID` near the bottom of `account_v*.js`. The game then shows
   Google's own button, and Google's popup names pastelsiege.com instead of `qembjixloxurcybpivli.supabase.co`.
   (While it's empty, the game uses the old redirect, which shows the Supabase address.) Also add
   `http://localhost:8765` to the Authorised JavaScript origins for local testing.
5. To show **"Pastel Siege"** and your logo, get the brand verified: Google Auth Platform → **Branding**: app name,
   logo, home page `https://www.pastelsiege.com`, privacy policy link, authorised domain `pastelsiege.com`. Prove you
   own the domain in Google Search Console (a DNS TXT record in Cloudflare), then press **Verify branding**. It usually
   takes a few days.

## 5. Discord (discord.com/developers/applications)

1. **New Application** "Pastel Siege" (add the icon).
2. **OAuth2 → Redirects**: add `https://qembjixloxurcybpivli.supabase.co/auth/v1/callback`, save.
3. Copy the **Client ID**, and **Reset Secret** to get the **Client Secret**.
4. Supabase → Authentication → Sign In / Providers → **Discord** → enable, paste both → save.

## Notes

- A Google / Discord sign-in with the same (verified) email as an existing account joins that account, so existing
  players can switch to it and keep their progress.
- Sign-in links only work in the browser that asked for them (the game checks), so a forwarded link can't sign
  someone into your account.
- The sign-in link button never creates accounts (new accounts need a username).
