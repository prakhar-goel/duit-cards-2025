# Run DUIT 2026 on your Mac and phone

Work from the modern repository, not the restored legacy project:

```sh
cd /Volumes/UserData/prakhargoel/Development/duit/duit-cards-2025
```

This pilot uses its own PostgreSQL databases (`duit_2026_pilot` and `duit_2026_pilot_test`), media, accounts and Android package. Setup does not modify the original DUIT database or archive. Existing configuration, database rows, passwords and `.local/signing` files are preserved.

## First setup

Use Node.js 22 or newer and a running local PostgreSQL installation. Postgres.app and Homebrew PostgreSQL command-line tools are detected. The local PostgreSQL administrator normally matches your macOS username; set `DUIT_PG_ADMIN_USER` if yours differs.

```sh
npm install
npm run setup:pilot
npm run build:public
npm run pilot
```

Setup creates only missing pilot databases and a local operator, applies tracked pilot migrations, and writes generated secrets to `.env.local` with private file permissions. It does not install or start PostgreSQL, reset an existing password, or remove a database. If the configured database role has a password, that role must already exist. Configuration pointing at a legacy or remote database is rejected by these local launchers.

Operator details are in **`.local/credentials.json`**. They are not printed in the terminal, committed, or embedded in the app. Keep that file and `.env.local` private.

In a second terminal, add or refresh the explicitly fictional demo:

```sh
npm run seed:pilot
```

The seed is repeatable and preserves existing edited records. The separately supplied archive import command creates a private, read-only admin library; archive records are not public pilot accounts.

Read-only setup check:

```sh
node scripts/setup-pilot.mjs --check
```

## Daily use: persistent phone server

```sh
npm run phone
```

This starts a detached local process and returns your terminal prompt. It prints both address slots:

- **Local on this Mac** — the website, admin dashboard and download page.
- **Local Wi-Fi phone** — paste this server address into the Android app.
- **Internet phone** — the current tunnel address, or a clear “not running” message.

The background server keeps running when the terminal tab closes. The Mac must remain awake, online and with its lid open. This is not an auto-start service after a reboot.

```sh
npm run phone:status
npm run phone:stop
```

`phone:stop` signals only a process whose PID, project path and random runtime identity match this launcher. An API started in another terminal may be reused for local access, but the launcher does not take ownership or stop it. If a different service uses the requested port, it fails clearly rather than silently changing the phone's server address.

After changing Wi-Fi networks, restart the managed server to discover the new LAN address:

```sh
npm run phone:stop
npm run phone
```

Use the newly printed Wi-Fi address in the app. Some office or guest networks isolate devices; in that case local Wi-Fi access will be blocked even when both devices show the same network name.

## Internet access: only when you request it

```sh
npm run phone:internet
```

This command starts a Cloudflare quick tunnel to the modern DUIT API and website. It creates a random private `PILOT_INVITE_CODE` in `.env.local` if one is absent, and restarts its owned API with the correct HTTPS links. Existing pilot users can sign in normally. New signup requires the invitation code or a previously verified recipient claim matching the signup email.

Copy the **Internet phone** address into the app on the other phone. The same address provides `/admin`, `/download` and app-free `/c/<slug>` profiles. Local and internet addresses are both displayed; the internet address is printed as soon as Cloudflare announces it. A new tunnel gets a different URL, so update the app server setting after restarting the tunnel. No APK rebuild is required for that change.

```sh
npm run phone:internet:stop
```

This closes internet access and keeps the managed local API running. `phone:stop` stops both.

If an API was started manually outside the launcher, internet mode asks you to stop it in its original terminal first. It will not kill or reconfigure that unrelated process.

The launcher uses an installed `cloudflared`, an explicit trusted `CLOUDFLARED_BIN`, or the existing cached legacy-project binary. It does not modify the legacy gateway or Cloudflare configuration. Its own tunnel configuration lives under `.local/pilot`. If no binary exists, install the official Cloudflare package and retry; for Homebrew, `brew install cloudflared` is sufficient. No binary is silently downloaded.

**Cloudflare Access is not configured.** The pilot uses DUIT account authentication, an invitation gate and a private admin role. Published fictional cards intentionally open without app login. Private contacts, meeting notes, voice recordings and archived profiles still require the appropriate authenticated account. A tunnel URL is an address, not a substitute for account security.

A quick tunnel is intended for this private trial. Availability depends on the Mac and network. If Cloudflare has printed a URL but DNS has not settled yet, retry the same address shortly; the launcher does not hide a valid announced URL because this Mac cannot resolve it immediately.

## Foreground and development modes

```sh
npm run pilot
```

Runs the packaged API and built website in the foreground. Ctrl+C stops its own child processes. Rebuild the website after changes.

```sh
npm run dev:pilot
```

Runs the API, Vite website and Expo development server together:

| Service                | Default address          |
| ---------------------- | ------------------------ |
| Packaged API + website | `http://localhost:48152` |
| Website live preview   | `http://localhost:48153` |
| Expo / Metro           | port `48151`             |

The development launcher explicitly sets `EXPO_PUBLIC_API_URL` to the current LAN API and disables Expo's older dotenv override. The old root `.env` value pointing to port 4000 is not used. Optional port settings are `DUIT_API_PORT`, `DUIT_WEB_PORT` and `DUIT_MOBILE_PORT`; they must be distinct. `DUIT_LAN_HOST` can select a specific reachable IPv4 host when the Mac has multiple network adapters.

## APK and signing

```sh
npm run build:apk
```

The build script creates a private signing key only if one is missing. Preserve **`.local/signing`** so later APKs can update the installed pilot. Setup does not replace these files.

The packaged API serves the build at `/downloads/DUIT-2026-Pilot.apk`; `/download` checks whether it exists before presenting a download button. The default artifact is `artifacts/DUIT-2026-Pilot.apk`. Installing this pilot does not replace the separately restored legacy DUIT app.

## Quick demo login

Private APK builds now prefill Maya’s demo email and password from `.local/credentials.json`. Tap **Step inside**. Fields remain editable, signup starts blank, and returning to sign-in restores the demo values. This shares access to the fictional Maya workspace with APK recipients; it does not grant operator access. The password is intentionally present in this private demo bundle but is not committed to source.

To create an APK without demo credentials, run `DUIT_DEMO_PREFILL=false npm run build:apk`. Builds without the private credentials file also leave login blank. Existing signed-in sessions remain signed in after updating.

## Real AI and recipient verification

Ordinary card editing, sharing, contacts and meeting tools work without AI. AI begins disabled; the app says so instead of presenting template text as a real model result. To enable it, configure the server API key and explicitly agreed spending limit in the private environment:

```dotenv
OPENAI_API_KEY=your-private-server-key
DUIT_AI_ENABLED=true
DUIT_AI_BUDGET_APPROVED_USD=your-approved-dollar-limit
```

Use a numeric limit, restart the managed API, and follow `docs/AI_PROVIDER_PLAN.md`. Image edits require their separate approval/settings. No keys belong in `EXPO_PUBLIC_*` values, source code or the APK. Local voice transcription also requires a working `ffprobe` executable so the server can verify recording duration.

Verification messages currently use **the private admin outbox** (`LOCAL_OUTBOX=true`). No email is sent. An operator must provide the verification link privately to the actual invited tester; forwarded card-link possession alone does not prove ownership. A real mail delivery provider is required before turning this into a self-service external recipient flow.

## Logs, recovery and verification

Runtime state and logs are under `.local/pilot/`:

- `state.json` — process ownership and currently announced addresses.
- `runtime.log` — API and tunnel output; treat it as private.
- `cloudflared.yml` — only this pilot's isolated tunnel configuration.

Use `phone:status` first when something fails. If a process no longer matches the recorded identity, the launcher leaves it alone. Never delete signing files or database folders to repair a launcher issue.

```sh
node --env-file=.env.local --test --test-timeout=30000 apps/api/test/*.test.js
```

Tests refuse any database except `duit_2026_pilot_test`. API/provider tests make no paid calls. Launcher verification used an alternate local port and a mocked `cloudflared` executable; it did not open a public tunnel or stop the existing app server.


### Expanded visual network

After the base setup, `node --env-file=.env.local scripts/expand-network.mjs` previews the six-profile expansion. Add `--apply` to apply it once. It takes a private recovery snapshot under `.local` and records its completion there; it changes only authored fixture workspaces. The supplied legacy archive is excluded. The generated visual assets are in `apps/web/public/demo`; artwork can be reproduced with `scripts/create-network-artwork.mjs` and motion portfolios with `scripts/create-business-clips.mjs`. Production image/video uploads use authenticated media storage and become accessible through shared cards only after publication.


### Preserve the tester server address

Testers depend on a stable internet server address. Reuse the running tunnel during routine development; do not stop and recreate it as part of an app build or website update. `npm run phone:internet` reuses the existing managed tunnel, and `npm run phone:status` prints its address without restarting it. Avoid `phone:stop` or `phone:internet:stop` unless shutdown is intended.

The current Cloudflare quick tunnel has a temporary hostname. If that process ends, its hostname cannot be guaranteed on restart. A permanent address requires a configured named Cloudflare tunnel with a user-controlled domain, or a fixed ngrok domain. Arrange one planned migration once the account/domain is available, retaining existing app sign-in and invitation checks. Do not claim the temporary hostname is permanent.
