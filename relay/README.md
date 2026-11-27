# Pastel Siege relay

Players normally connect straight to each other. Some networks, like school Wi-Fi, block that. Players there connect through this relay instead.

The relay runs on your homelab. A Cloudflare Tunnel makes it reachable as `wss://relay.pastelsiege.com` without opening any ports on your router. To the network it looks like an ordinary secure website. It only passes messages between players; the host's game still runs the game.

## Set it up

1. **Create the tunnel.** In the Cloudflare dashboard, go to **Zero Trust → Networks → Tunnels**, create a tunnel of type *Cloudflared*, and run the install command it shows on the homelab. That installs `cloudflared` as a service that starts with the machine.
2. **Add a public hostname** to the tunnel:
   - Subdomain `relay`, domain `pastelsiege.com`.
   - Service type `HTTP`, URL `localhost:8080`.
3. **Start the relay** on the homelab, in this folder:
   ```sh
   docker compose up -d --build
   ```
   It listens on `127.0.0.1:8080`, so only that machine and its tunnel can reach it.

   If you'd rather run the tunnel in Docker too, see the comment at the top of `docker-compose.yml`. Use only one tunnel connector for the same tunnel.
4. **Check it.** Open `https://relay.pastelsiege.com` in a browser. It should say `Pastel Siege relay. 0 games open.`
5. **Turn it on in the game.** Set `RELAY_URL` near the top of `net_v*.js` to `'wss://relay.pastelsiege.com'`, then deploy the game.

## Without Docker

```sh
npm install
PORT=8080 node server.js
```

Run `cloudflared` separately and point the public hostname at `localhost:8080`.

## Settings (environment variables)

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `8080` | Port the relay listens on. |
| `ALLOWED_ORIGINS` | `https://pastelsiege.com,https://www.pastelsiege.com` | Websites allowed to use the relay. Other sites are refused. |
| `ALLOW_PREVIEWS` | on | Also allows Vercel preview links and localhost, for testing. Set to `0` to turn this off. |
| `MAX_ROOMS` | `200` | Most games open at once. |

## Limits

- 4 friends per game.
- 64 KB per message.
- 120 messages a second per player; the game sends about 15.
- Silent connections are dropped after about a minute.

The relay sees game messages (positions, chat), but not accounts or passwords.
