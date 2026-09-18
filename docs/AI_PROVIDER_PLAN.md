# AI provider plan and contract

**18 September update:** The owner selected GCP project `duit-cards-2025` for Google AI. See [Google AI limits](GOOGLE_AI_LIMITS.md) for the configured cloud cap and application safeguards. The OpenAI implementation below is the existing adapter, not the selected Google integration. Live AI remains disabled until the Google adapter and its credentials are ready.

Verified against official OpenAI documentation on **18 September 2026**. The implementation is `apps/api/src/providers/index.js`. It uses Node’s built-in `fetch`, `FormData`, `Blob` and abort signals plus the API’s existing Zod dependency. There are **no live AI calls in the tests** and no credentials in source.

## Default providers and price assumptions

Use OpenAI direct API for the private pilot so one server credential covers text/vision, image editing and recorded-audio transcription. This is a practical pilot choice, not evidence that it is the only or best provider for every task. Account access to each model still needs a live smoke test after approval.

The following are **Standard, short-context** prices. Token rates are **USD per one million tokens**. No Fast, long-context, web-search, regional-processing or third-party enrichment charges are enabled. [Official pricing](https://developers.openai.com/api/docs/pricing)

| Model           | Input | Cached input | Cache write | Output | Pilot role                                                                                                    |
| --------------- | ----: | -----------: | ----------: | -----: | ------------------------------------------------------------------------------------------------------------- |
| `gpt-5.6-terra` | $2.00 |        $0.20 |       $2.50 | $12.00 | Default card extraction, profile drafts, meeting summaries, follow-ups and small authorized contact reranking |
| `gpt-5.6-luna`  | $0.20 |        $0.02 |       $0.25 |  $1.20 | Manually selected lower-cost alternative after the same quality evaluation                                    |

Terra supports text/image inputs and structured outputs; its documented reasoning settings include low. The pilot sets `reasoning.effort=low`, a strict JSON schema and explicit output-token limits. This provides a sensible quality baseline while keeping individual requests small. There is **no automatic model fallback or retry** that could silently create another charge. [Terra model](https://developers.openai.com/api/docs/models/gpt-5.6-terra), [Luna model](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

For optional image cleanup use the dated snapshot `gpt-image-2.5-sunburst-2026-09-08`: image input $8/M, image output $30/M, text input $5/M; cached image/text inputs $2/M and $1.25/M. It is the current model recommended for precise edits. One `medium`, `1024x1024`, PNG edit is requested, with no streamed partial images. The official calculator estimates 440 output tokens, or **$0.0132 output only**, for that setting; text and image input costs are additional. **This is not the complete edit cost or a guaranteed maximum.** [Image generation and calculator](https://developers.openai.com/api/docs/guides/image-generation), [Sunburst model](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst)

For completed recordings use `gpt-transcribe`, documented at **$0.0045 per minute**. The server must independently verify duration; a client-provided duration is not trusted. The pilot accepts recordings up to ten minutes and 12 MB, below the provider’s 25 MB file limit. [Transcription guide](https://developers.openai.com/api/docs/guides/speech-to-text), [Model pricing](https://developers.openai.com/api/docs/models/gpt-transcribe)

## Proposed development budget — approval required

Recommend **$25 total for text, vision and transcription development/evaluation**, with a server-side ledger and reservations. It is a proposed spending cap, not authorization. An illustrative 1,000 text requests at 2,000 uncached input tokens and 700 output tokens would be $12.40 at base Terra rates, or $13.40 if all input is billed at cache-write rate. Add $0.45 for 100 minutes of transcription. Actual request lengths and reasoning tokens vary. Card images add input tokens.

Image editing requires **separate approval**, even if it ultimately shares the same total budget. The Images endpoint has no documented per-request dollar or maximum-output-token parameter. Its input costs also cannot be guaranteed from the current documented output calculator. The implementation therefore defaults to disabled and uses an explicitly approved **per-image admission allowance**, not a fictional provider hard cap. A proposed initial allowance is $1 per edit, at most 10 test edits, followed by review of measured costs and preservation quality. Do not present $1 as a guarantee that the provider cannot bill more for a request already sent. If a strict all-modality hard cap is required, leave image generation disabled until a documented bound or enforceable provider control is available.

## Configuration

Set only in local/server secrets; never in a mobile build or browser bundle:

```dotenv
OPENAI_API_KEY=
DUIT_AI_ENABLED=false
DUIT_AI_BUDGET_APPROVED_USD=0
DUIT_AI_TEXT_MODEL=gpt-5.6-terra
DUIT_AI_MAX_JOB_USD=0.5
DUIT_AI_IMAGE_ENABLED=false
DUIT_AI_IMAGE_RESERVE_USD=0
```

The API budget ledger must enforce the approved total across all users and concurrent jobs. The provider’s environment checks alone are **not** a budget ledger. Do not turn on flags until the user has approved costs and supplied a server credential. Provider status exposes model names and missing configuration names, never the credential value.

## Backend integration contract

```js
import { getProviderStatus, estimateCost, runAi } from "./providers/index.js";

const status = getProviderStatus();
// request contains only facts/media already authorized for this authenticated owner.
const estimate = estimateCost({ task, input, media });
// Atomically reserve estimate.reserveUsd in the backend's persistent budget ledger.
const completion = await runAi({
  task,
  input,
  media,
  reservationUsd: estimate.reserveUsd,
  signal,
});
// Settle conservative measured cost; retain job, sources and review status.
// Applying the draft is a separate owner-authorized endpoint.
```

Pure functions also accept an options object `{env}`; `runAi` accepts `{env,fetchImpl}` for isolated tests. Production should not let a request choose either option.

`estimateCost` returns `provider`, `model`, `estimatedUsd`, `reserveUsd`, `pricingVersion`, `basis` and `boundType`. Text adds `inputTokenUpperBound` and `maxOutputTokens`; audio adds `audioSeconds`; image estimates use `boundType='approved_allowance'` and `requiresSeparateApproval=true`. Token reservations account conservatively for text UTF-8 bytes, JSON schema/message overhead, at most 3,001 high-detail image tokens per uploaded card side, and the full output cap including reasoning. At most two card images are allowed. The vision ceiling comes from 2,500 patches with the documented 1.2 multiplier and rounding headroom. [Vision pricing rules](https://developers.openai.com/api/docs/guides/images-vision)

`runAi` returns:

```js
{
  task, result, provider: 'openai', model, requestId,
  requiresReview: true, pricingVersion,
  usage: {
    inputTokens, outputTokens, audioSeconds,
    costUsd, costEstimated, costBasis, pricingVersion
  }
}
```

`costUsd` is a **conservative ledger estimate**, not an invoice. Text usage not explicitly marked cached is charged at the higher cache-write rate in this estimate. Missing usage retains the reservation. Reconcile with provider billing before reporting exact spend to an administrator.

Errors are `AiProviderError` with safe `code`, `status`, and `message`, optionally `requestId`, `usage` and `chargeMayHaveOccurred`. Important cases:

- `provider_unavailable` / 503: missing setup or provider not reachable; manual work remains usable.
- `ai_reservation_required` / 409: caller has not reserved enough; no provider request occurs.
- `ai_job_budget_exceeded` / 402: text/audio request exceeds the configured per-job limit.
- `image_budget_unapproved` / 503: image editing is independently disabled.
- `provider_rate_limited` / 429: surface a retry action; do not silently retry.
- `invalid_ai_response`, `invalid_ai_evidence`, `incomplete_ai_response`: never apply a partial/untrusted draft.
- `ai_refused`: show a clear unsuccessful result without overwriting the source.
- `audio_duration_unverified`: the server must probe media first.

**Settlement rules:** even a rejected structured result can be billable. Settle `error.usage` when present. If a request times out, disconnects or has an ambiguous upstream failure, retain its reservation for reconciliation when `chargeMayHaveOccurred=true`; do not immediately release it and retry. This prevents repeated uncertain requests from bypassing the total cap.

## Tasks and result shapes

All text inputs are JSON objects, limited to 48 KB. Optional `input.sources` is an array of `{id,text}` facts. Other top-level input fields become evidence sources named `input:<field>`. Duplicate source IDs are rejected. The backend must build these inputs from the authenticated owner’s data; this module has no database access.

| Task               | Input                                                                                                                                  | Reviewable result                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `card_extract`     | One or two owned card image files; optional language/brief fields                                                                      | `fields` with nullable name/role/company/email/phone/website/address; `rawText`; `uncertainFields`; per-field `{field,quote,sourceId}` evidence; warnings |
| `profile_draft`    | `brief` plus optional ownerName/company/audience/offer/proof/desiredAction and source facts                                            | headline, summary, offers, needs, CTA `{label,type,value}`, six ordered panels `{panelType,body,evidenceIds}`, evidence IDs and warnings                  |
| `meeting_summary`  | `note` or `originalNote`, optional occurredAt/personName/source facts                                                                  | summary, needs, offers, explicit commitments `{text,dueAt,evidenceIds}`, separately labelled suggestedNextStep, evidence IDs and warnings                 |
| `followup_draft`   | `note`/context, channel, senderName, recipientName, sources                                                                            | nullable subject, message, evidence IDs and warnings; **no send operation**                                                                               |
| `network_search`   | query and at most 40 authorized candidates `{id,name,evidence:[{id,text}]}`; if evidence omitted, candidate JSON becomes `person:<id>` | answer and at most eight `{personId,reason,evidenceIds}` matches, warnings; IDs must belong to the supplied candidate and sources                         |
| `portrait_cleanup` | Exactly one owned uploaded image                                                                                                       | `images:[{mimeType:'image/png',base64}]`, sourceMediaIds and comparison warning                                                                           |
| `card_cleanup`     | Exactly one owned uploaded image                                                                                                       | Same image result; prompt explicitly preserves all printed text, numbers, logos and edges                                                                 |
| `transcribe`       | Exactly one owned recording with server-verified duration                                                                              | text, detected language codes, sourceMediaIds, review warning                                                                                             |

Media entries are `{id,mimeType,bytes}` where bytes is a server-loaded `Buffer`/`Uint8Array`. Audio additionally requires `{durationSeconds,durationVerified:true}` from a trusted probe. Arbitrary URLs and file paths are never fetched. The backend must check ownership before loading bytes. Images must have an allowed PNG/JPEG/WebP signature; production media ingestion still owns full file decoding, dimension checks and malware handling. Audio types include MP3, MP4/M4A, WebM and WAV.

The backend must write generated images to **new private media assets**, remove base64 from persisted job JSON/client responses, and expose authorized media URLs. Applying an image changes an asset reference only after review; retain the original for comparison/revert. Image prompts request conservative cleanup, preserve a portrait’s identity/appearance and a card’s facts, but cannot guarantee preservation: always show the original beside the draft.

## Trust and quality boundaries

Requests are stateless (`store:false`) Responses calls with no tools, web search or remote contact lookup. User notes, images, OCR and contact text are explicitly untrusted data in a separate user payload. Input instructions cannot authorize reading another account or sending a message. Strict JSON schemas plus local Zod validation constrain outputs. Contact matches and source IDs are checked against the exact authorized candidate set; card fields need matching visible-text quotes; invented CTA values are rejected.

These controls reduce mistakes but do not prove that every semantic statement is true. Source IDs may be valid while a paraphrase is wrong. Card raw text is model output, not an independent OCR oracle. Human review, evaluation and source display are essential. No artificial response is returned when a provider is unavailable. Original manual drafts remain user-authored rather than being relabelled “AI.”

Before enabling a paid pilot, run: 50 diverse consented business cards for extraction correctness; varied Hindi/English names and meeting notes; attempts to inject instructions in card/note text; 100 owner-scoped match relevance ratings; portrait/card before–after checks; and refusal/timeout/budget-concurrency cases. The provider unit suite covers request construction, unavailable configuration, reservation checks, output validation, source isolation, image/audio gates and uncertain charges with mock `fetch` only. Live service quality and account access remain unverified until approved credentials are available.
