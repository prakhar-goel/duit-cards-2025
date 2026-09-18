# Initial Google AI limits

Configured 18 September 2026 for project `duit-cards-2025` (project number `101035881110`). Billing is enabled on the existing SGC account. No other project's budget was changed.

## Google Cloud

Verified in Cloud Billing: **DUIT AI initial monthly spend cap**, status **Configured**.

- Project: Duit Cards 2025 only.
- Service: Vertex AI (`aiplatform.googleapis.com`), now called Agent Platform.
- Monthly spend cap: **INR 450**.
- Notifications: 50% / INR 225, 80% / INR 360, 100% / INR 450 to billing recipients and project owners.
- Budget ID: `2a6f6846-8613-4d95-9b16-4405500255d9`.
- [Manage the cap](https://console.cloud.google.com/billing/01C3FC-F8C1DE-FB627C/budgets/2a6f6846-8613-4d95-9b16-4405500255d9/edit?authuser=5&project=duit-cards-2025).

This is a spend-cap budget, not just an alert. Google pauses new eligible service usage after enforcement. Enforcement is not instantaneous: in-flight calls and reporting delays can produce billable overages. This cap does not cover other GCP services, direct Gemini API usage, Render, or another AI vendor. No direct Gemini API key was created. [Official limitations](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps)

## Application limits

The admission guard in `apps/api/src/ai-limits.js` applies before the provider call and inside the existing budget-reservation transaction:

| Control | Initial ceiling |
| --- | ---: |
| Total approved pilot allowance | USD 5; manual increase required, no automatic reset |
| Rolling 24-hour allowance | USD 0.50 |
| Per-request reservation | USD 0.10 |
| All users combined, rolling 24 hours | 50 requests |
| One user, rolling 24 hours | 20 requests |
| All users combined, rolling minute | 3 requests |
| Concurrent queued/running jobs | 1 |

Daily money includes recorded costs and unresolved reservations. Failed requests count toward request limits. Unknown charges retain reservations for operator review. The pilot budget row lock serializes admission across processes. Counters are database-backed and survive restarts. Environment settings may lower these initial ceilings, but increasing them requires an intentional code change. The provider enable flag and configured credentials are still required; a spending allowance does not enable AI by itself.

No automatic provider retries, model upgrades, image generation, video generation, web grounding, or provisioned throughput are enabled. Existing manual features continue to work when AI is unavailable or capped.

## Activation state and next step

Google is the selected project/provider direction. The currently implemented provider adapter remains OpenAI; Google live inference is **not enabled** by this limits change. No AI credentials were created or put in the APK. No paid inference was run.

Before enabling Google, add its server-only adapter and validate reservation bounds against the chosen model's current pricing, including thinking/output tokens. Start with card extraction and meeting-note summaries. Keep original data and present editable drafts; missing card fields stay empty. Use a least-privilege DUIT service identity. Run a small controlled accuracy/cost check before opening AI to the shared tester account.
