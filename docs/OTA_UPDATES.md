# Android staging OTA updates

The first OTA-capable APK is 4.6.6. Install it from the existing Render /download
page. The page reads `otaEnabled` from the published build metadata; older APKs
are never labelled OTA-capable.

Expo project: @prakhar/duit_cards_2025_mobileapp_cursor, channel/branch `staging`.
The pre-existing Expo slug was reconciled with the linked project ID. Android
package and signing identity remain unchanged. Runtime: `duit-android-4.6.6`.
Android native XML and app.json must agree on runtime, URL and channel.

On launch, DUIT checks/downloads updates in the background and applies them on
its next cold launch. It still launches offline from its embedded/cached bundle.
Server settings includes Check for updates and an explicit Restart to update
button so an update need not interrupt a form or card exchange.

After a UI-only PR merges and protected main CI passes:

```sh
npm run release:ota -- "Describe the UI improvement"
```

Run from a clean, up-to-date main with authenticated `eas` and `gh`. The script
checks the published APK's runtime/channel and refuses changes to Android,
app config, package manifests or lockfile since its build. Such changes require
a new APK; change the runtime string in app.json and Android strings.xml when
native compatibility changes. Do not bump the app version for a UI-only OTA.
The script fixes the initial API URL to the APK's server and excludes dotenv
loading/shared demo credentials. Never publish directly from an unreviewed branch.

The server selection remains local to each installation and independent of OTA.
Render is the stable hosted endpoint. Local Mac defaults to
http://Prakhars-MacBook-Pro.local:48152 (same Wi-Fi, `npm run phone` running).
If multicast DNS is unavailable, select Local Mac, paste the LAN URL printed by
that command and save; the Local Mac preset remembers the replacement. Switching
servers signs out and keeps each server/account's offline data isolated.

Source documentation: https://docs.expo.dev/bare/installing-updates/
