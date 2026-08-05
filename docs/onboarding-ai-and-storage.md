# Onboarding: AI integration and storing user answers

This document explains how the onboarding wizard stores data today and how to connect a real AI backend.

## What the app stores today

On completion (or **Skip**), the app persists (two `AsyncStorage.setItem` calls):

- `duit:onboarding:v1:completed` — `"true"` when the user finishes or skips.
- `duit:onboarding:v1:profile` — JSON string of `OnboardingProfilePayload` from `apps/mobile/src/onboarding/state.ts` (name, role, company, website, networking intents, mock AI choice, `completedAt`, `mockAiVersion`).

`AsyncStorage` is suitable for prototypes. For production fintech apps, treat PII as sensitive: prefer encrypted local storage and/or server-side profiles tied to authenticated users.

## Replacing the mock AI (`apps/mobile/src/onboarding/mockAi.ts`)

The functions `getAiFollowUpContent` and `getPlanBullets` are **pure** and synchronous. They stand in for:

1. **LLM routing** — Decide the next question, headline, subtitle, and option list from prior answers.
2. **Structured output** — Return JSON that matches the same shapes (`AiFollowUpOption[]`, string bullets).

### Recommended production shape

1. **Client** collects `OnboardingForm` (or a sanitized subset).
2. **POST** to your API, e.g. `POST /v1/onboarding/ai-step` with body:
   - `step: "followup" | "plan"`
   - `answers: OnboardingForm` (or fields you allow off-device)
3. **Server**:
   - Validates auth and rate limits.
   - Optionally fetches and summarizes the user’s website server-side (never scrape arbitrary URLs from the client without safeguards).
   - Calls your model (OpenAI, Anthropic, Gemini, etc.) with a strict JSON schema in the prompt.
4. **Response** maps into the same types the UI expects, or you extend the UI for richer content.

### OpenAI-style sketch (server-side, pseudocode)

```ts
const completion = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: "Return only JSON with keys headline, subtitle, options[{id,emoji,label}]..." },
    { role: "user", content: JSON.stringify(answers) },
  ],
});
```

Parse JSON, validate with Zod, return to the client.

### Website enrichment

- **Do not** paste raw HTML into the model from the client without size limits and redaction.
- Prefer **server-side fetch** + extract main text (readability, trafilatura, etc.), cap tokens, strip scripts.
- Cache by URL hash and user id to control cost.

## Storing answers in production

| Approach | Use when |
|----------|----------|
| **Backend user profile** (REST/GraphQL) | Logged-in users; source of truth; sync across devices. |
| **Encrypted local store** (`expo-secure-store`, encrypted SQLite) | Tokens and sensitive fields before account creation. |
| **AsyncStorage** | Prototypes only; not for secrets. |

Flow that scales:

1. Anonymous session: optional local draft.
2. After sign-up: `PATCH /users/me/onboarding` with the same payload shape.
3. Mark completion server-side and mirror `completed` in local storage for fast startup.

## Feature flag and rollback

- Toggle `onboardingWizardV1` in `apps/mobile/src/onboarding/featureFlags.ts`.
- To force re-show for QA, clear `duit:onboarding:v1:completed` (and profile if needed) in dev builds.
