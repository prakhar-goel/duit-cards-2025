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
in Chrome; it needs a physical Android SIM/device smoke test before release.

Source: https://developer.android.com/identity/phone-number-hint

## Truecaller — activation pending

Recommended flow: offer Truecaller as an optional fast login on supported devices,
with the existing phone-number picker and Firebase OTP as fallback. Do not display
an active Truecaller login button before the provider is configured and tested.

Truecaller requires an OAuth project in its developer console, Android credentials
for package **io.duit.ecards.pilot** and the existing release signing certificate's
**SHA-1**. The resulting **Client ID** identifies the app. No replacement signing
key should be generated. Debug/release identities may require separate entries.
Truecaller's integration guide also requires submission for review before going live.

The owner has been asked whether DUIT is already registered. No Truecaller SDK,
provider keys or authentication endpoint has been enabled in this milestone.

When credentials are ready:

1. Integrate the supported OAuth SDK with PKCE and request-state validation.
2. Validate the provider response on the server before establishing DUIT identity;
   never trust a phone number/profile supplied directly by the mobile client.
3. Preserve one DUIT identity per verified phone and explicitly reconcile the
   Firebase-backed account/employee-invitation flow. An existing unverified profile
   phone or email must not silently claim another account.
4. Handle cancellation, missing Truecaller, unsupported verification and provider
   failures by offering the existing Firebase OTP path.
5. Test on the signed Android app and complete Truecaller review before release.

Sources:
- https://docs.truecaller.com/truecaller-sdk/android/latest-oauth-sdk-3.3.0/integration-steps
- https://docs.truecaller.com/truecaller-sdk/android/latest-oauth-sdk-3.3.0/integration-steps/generating-client-id
