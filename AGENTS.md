# Repository Working Instructions

## Product input log

- Maintain `docs/PRODUCT_INPUT_LOG.md` as an append-only record of the user's product and PRD prompts and inputs.
- At the start of any turn containing new product direction, product feedback, product decisions, use cases, positioning, market input, MVP scope, or PRD changes, append the user's exact wording before editing derived product documents or code.
- Record one ISO 8601 timestamp per entry in the `Asia/Kolkata` timezone. Obtain the timestamp from the system clock; do not estimate or invent it.
- Preserve wording, spelling, punctuation, links, and line breaks. Do not summarize, interpret, correct, or mix assistant-authored conclusions into the log.
- Do not log execution-only messages such as requests to run commands, commit, push, merge, or report status unless they also contain product or PRD input.
- Never rewrite or reorder existing entries. Corrections or clarifications must be appended as new entries.
- After a completed repository milestone, create a focused commit and push the current branch. Product-log updates must be included in the same milestone commit or in a dedicated documentation commit.

## Product document precedence

- `docs/PRODUCT_INPUT_LOG.md` is the verbatim source record of user input.
- `docs/PRD.md` is the interpreted and structured product source of truth.
- When the documents conflict, do not silently change the input log. Reconcile the PRD through an explicit product decision and retain the original input history.
