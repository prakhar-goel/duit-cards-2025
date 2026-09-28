# Phone login options

## Android number picker

The native app now offers Google Play services Phone Number Hint once when a user
moves from the introduction to phone login. A **Choose my number** button can
reopen it. Android displays available SIM-based numbers and the user chooses one
or cancels. Manual entry remains available on all platforms.

A selected number only fills the form. It is not proof of ownership, does not
create a session and never sends an SMS by itself. Firebase verification and the
explicit **Send code** action remain unchanged. No additional phone/SMS permission
was added. The selected country code is preserved; national-only hints require
the user to supply a country code rather than guessing from language or location.

Implementation uses the checked-in Android project and a small React Native native
module. If regenerating Android with Expo prebuild, preserve the package
registration, module files and Google Play services dependency. Web/iOS/older APKs
without this module keep manual entry. This native system sheet cannot be reviewed
in Chrome; its actual SIM-number choices need a physical Android device smoke test.

Source: https://developer.android.com/identity/phone-number-hint

## Truecaller OAuth login

Android uses Truecaller's OAuth SDK 3.3.0 in a private, non-exported activity.
The consent flow uses a fresh random state and SHA-256 PKCE challenge each time.
Only `openid`, `phone` and `profile` are requested. Cancellation, unsupported
phones, SDK errors and a two-minute timeout return to the Firebase SMS route.
The Android SIM chooser remains a convenience; it is never proof of identity.

The API exchanges the one-use authorization code and verifier directly with
Truecaller's fixed non-EU token endpoint, then fetches userinfo. It requires a
verified E.164 phone and a provider subject. It never accepts client-supplied
phone/profile/access tokens as identity and never stores provider tokens.

Identity links are kept in `users.firebase_uid`, `users.truecaller_uid` and the
unique verified `phone_number`. The first login through the other provider joins
that verified account; a different already-linked provider subject or changed
number returns a recovery conflict. Profile contact fields and provider email
are never used to claim an existing account. Suspended accounts remain blocked.
Company invitations accept either verified provider, still requiring a matching
invitation phone and valid unconsumed invitation.

### Console and server setup

Project: https://sdk-console-noneu.truecaller.com/dashboard/project/6bea61a1-f27d-436d-8559-47c98002d766

- Android package: `io.duit.ecards.pilot`.
- Existing release SHA-1: `EF:3A:7D:94:25:01:7B:F5:64:E9:60:B9:73:AD:3F:9E:57:BC:37:EC`.
- Put the generated public client ID in Android's `truecaller_client_id` string
  and Render's `TRUECALLER_CLIENT_ID`. It is a public application identifier,
  not a signing secret. The button appears only when APK and server IDs match.
- Configure the console consent screen with DUIT's name, developer/support email,
  homepage and matching scopes. The owner supplies contact details.
- While the project is in test mode, add each tester's Truecaller number under
  Test Numbers. Truecaller must be installed and signed in on their device.
- Actual physical-device success, cancellation and Firebase fallback need a
  signed-APK smoke test. Complete provider review before production use.

Current configuration status is recorded in `DEVELOPMENT_HANDOFF.md`. Never
replace the release signing key to resolve an SDK configuration failure.

Sources:
- https://docs.truecaller.com/truecaller-sdk/android/latest-oauth-sdk-3.3.0/integration-steps
- https://docs.truecaller.com/truecaller-sdk/android/latest-oauth-sdk-3.3.0/integration-steps/generating-client-id
- https://docs.truecaller.com/truecaller-sdk/android/latest-oauth-sdk-3.3.0/integration-steps/integrating-with-your-backend/fetching-user-profile
