# Clickable personal prototype

The conversation now contains an app-like wireframe prototype built from the earlier Balsamiq-style mocks. This supplements the 116-screen reference library with connected personal journeys, rather than a screen-picker presentation.

## Interactive behavior

- People list with text search and source filters.
- Manual capture validates name/contact and adds the entered person to the local prototype list.
- Sample scan extracts an authored contact; repeating it detects a duplicate and offers update or separate record.
- Selected-person context is maintained through notes, meetings, phone-save confirmation and sharing.
- Notes and meeting entries update the selected person's history.
- Own-card edits update the card and recipient preview; optional AI wording is a simulated suggestion requiring acceptance.
- WhatsApp message is composed from recipient and meeting context, editable, and validates the recipient phone. Opening WhatsApp is simulated and recorded without claiming delivery.
- Offline switch retains changes and increments a pending count; simulated sync clears it.
- Start over restores samples. In-session form/list state is not a real account or permanent storage. No uploads, OS permissions, GPS, AI, messages or network requests are performed.

## Validation

JavaScript syntax passed. In Chrome, added Rohan Shah with an example email, verified the saved state and new People row, then changed the own-card company to DUIT Studio and verified the rendered card reflected it. This is prototype interaction validation, not native app integration testing.

## Next

Owner reviews the actual personal journeys before implementation. Full screen reference remains available in the prior conversation response. App code, APK and OTA are unchanged.
