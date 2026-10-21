# Complete wireframe screen inventory

Discussion prototype only. 116 named screens and states across 11 flows. This is not a commitment to implement 116 app screens. Permission prompts, transient states, recipient web views and deferred tools are included for UX review.

The clickable source is presented inline in the conversation as `duit-all-screens.html`; it makes no network calls and performs no real account, contact, publishing or messaging actions. Camera, QR, OS permissions, AI, upload and download operations are placeholders. Main actions connect the storyboard; forms are illustrative rather than a complete application validation engine.

## Validation

JavaScript syntax check passed. Chrome opened every one of the 116 screen selections and verified its heading. Visually inspected home layout and duplicate-review state; exercised scan-review → duplicate → review-differences navigation. This does not validate native integrations or final production layout.

## Scope boundaries

Personal flows remain the priority: share my card; capture/save another person; optionally save contact details to the phone. Company/enquiry/admin flows are explicitly optional and deferred, retained only to discuss existing functionality. Phone sync, required fields and final navigation remain product decisions. No app implementation, APK or OTA release.

## Start & sign in

- `welcome` — A card. A connection.
- `phone` — Your mobile number
- `number-picker` — Choose your number
- `truecaller` — Continue with Truecaller
- `otp` — Enter the code
- `otp-error` — Check your code
- `first-run` — What would you like to do?
- `sample` — Explore a card

## People & finding

- `people` — People
- `scanned` — Scanned cards
- `sent` — Shared my card
- `search` — Search people
- `filters` — Filter people
- `empty` — Your people start here
- `no-results` — No matching people
- `loading` — Opening your people

## Capture a person

- `add` — Add person
- `camera-permission` — Camera access
- `camera-denied` — Camera unavailable
- `camera` — Scan the front
- `gallery` — Choose a card photo
- `crop` — Check the photo
- `scan-back` — Does it have a back?
- `back-photo` — Back of card
- `reading` — Reading the card
- `review` — Check the details
- `scan-failed` — Couldn’t read the card
- `scan-offline` — Photo saved on this phone
- `manual` — New contact
- `manual-error` — Check the contact
- `duplicate` — You may know this person
- `merge` — Review before updating
- `saved` — Person saved
- `scan-qr` — Scan DUIT QR
- `paste-link` — Paste a card link
- `bad-link` — Couldn’t open this card
- `link-preview` — Save Aisha’s card?

## Phone contacts

- `phone-permission` — Save to phone
- `phone-review` — Choose what to save
- `phone-existing` — Already in your phone
- `phone-denied` — Saved in DUIT only
- `phone-saved` — Saved in both places

## Person & meetings

- `person` — Meera Joshi
- `aisha` — Aisha Rahman
- `noah` — Noah Morgan
- `person-card` — Meera’s visiting card
- `card-image` — Original visiting card
- `person-business` — Saanjh Textiles
- `person-actions` — Contact actions
- `edit-contact` — Edit saved contact
- `history` — Meetings with Meera
- `meeting` — Meeting details
- `date` — When did you meet?
- `location` — Where did you meet?
- `location-result` — Confirm place
- `location-manual` — Enter a place
- `note` — Private note
- `archive` — Archive this person?

## Sharing

- `share` — Share my card
- `whatsapp` — Who are you sharing with?
- `share-person` — Choose a person
- `message` — Your message
- `share-return` — Back from WhatsApp
- `share-link` — Share your link
- `share-event` — Sharing record

## My card & editing

- `create` — Start your card
- `own-scan` — Read my visiting card
- `own-details` — Your public details
- `own-photo` — Your portrait
- `own-artwork` — Your visiting card
- `cleanup` — Clean up the card
- `own-business` — What do you do?
- `ai-review` — Review the suggestion
- `ai-error` — AI is unavailable
- `slides` — Arrange your card
- `slide-edit` — Edit a business slide
- `own-preview` — Preview before publishing
- `published` — Your card is ready
- `mycard` — My card

## Recipient web view

- `public` — Prakhar Goel
- `public-card` — Prakhar’s visiting card
- `public-business` — About DUIT
- `public-save` — Save to your contacts
- `public-saved` — Contact file ready
- `public-message` — Contact Prakhar
- `public-unavailable` — Card unavailable

## Settings & reliability

- `settings` — Settings
- `account` — Account details
- `sync-settings` — Phone contact preferences
- `queue` — Saved captures & sync
- `synced` — All caught up
- `sync-error` — Couldn’t sync yet
- `conflict` — Choose the latest details
- `offline` — People · offline
- `network-error` — Connection unavailable
- `archived` — Archived people
- `export` — Export my contacts
- `export-ready` — Export ready
- `privacy` — Your private information
- `server` — Server & app updates
- `signout` — Sign out?

## Optional business tools

- `enquiry` — Ask about the business
- `enquiry-sent` — Enquiry received
- `inbox` — Incoming enquiries
- `enquiry-detail` — Enquiry from Meera
- `activity` — Card activity
- `business` — My business
- `employees` — Employees
- `employee` — Employee & card
- `invite` — Invite employee
- `company-cards` — Company cards
- `company-profile` — Company profile

## Optional admin onboarding

- `master` — DUIT Master
- `master-person` — Onboard a person
- `master-company` — Onboard a company
- `master-review` — Review before invitation
