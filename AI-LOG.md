# AI-LOG.md — IA#3

## 2026-11-07 — Phase 1: Predictions

```
Tool: Codex (GPT-6)
Prompt: Go. Start phase 1 with the ia3-notes skill: read CONTRACT.md only (not src/ or test/), choose your two predictions, create NOTES.md and stop at gate G1.
Asked for: Draft two predictions from the contract, create NOTES.md, and stop for human review before committing.
Kept: The agent drafted P1 about retaining an idempotency key after a 4xx (§4.2) and P2 about a cursor leading to an empty page (§4.4). Both quoted sentences were verified directly against CONTRACT.md. NOTES.md includes all five section headings.
Changed: G1 was approved without changes to the prediction content. Updated the pending-review statement in NOTES.md to record approval. No source files or tests were read, and no test commands were run.
Rejected: Nothing rejected in this step.
By hand: The human authorized phase 1, supplied the task prompt and student details, and read and approved both predictions at G1. The human explained that retaining a key after a 4xx can block a corrected request, and that a full page does not prove another matching order exists. Student details are recorded in NOTES.md, not repeated in this log.
```

G1 response (verbatim):

Approved. I read both predictions and I can explain them: P1 because the agent may reserve or persist an idempotency key before validation and fail to release it after a 4xx response, preventing a corrected request from succeeding with the same key. P2 because the agent may return a cursor whenever the current page contains exactly `limit` orders without checking whether more matching orders actually exist, resulting in a cursor that leads to an empty page.

## 2026-11-07 — Phase 2: First attempt

```
Tool: Codex (GPT-6)
Prompt: Implement the `/v1` API in `src/v1.js` exactly as `CONTRACT.md` specifies, and the headers its section 5 requires on the legacy API in `src/app.js`. Put any new table in a new migration with a `down`. Do not read or edit anything under `test/`, and do not edit `CONTRACT.md`. Run `npm test` when you are done; it must stay green.
Asked for: Implement the first attempt, preserve legacy behavior, and pass legacy tests before G2; the follow-up explicitly authorizes fixing scripts/migrate.js for portable paths, rerunning checks without the migration helper, and fencing the log entries.
Kept: The human approved all four /v1 endpoint handlers, centralized problem details, ordered validation, price snapshots, JSON-value fingerprints, atomic successful response storage, shared in-flight claims, and database-backed snapshot cursors in src/v1.js. Added only the required legacy headers in src/app.js. One 002_v1_state migration pair adds three state tables and drops them in reverse order. A quoted checklist and decisions are recorded in ignored scratch files.
Changed: The single self-review changed prior-request lookup to read before acquiring a write lock, with an atomic recheck when claiming a new key; this lets another process observe an in-flight claim while its owner writes. It also removed a redundant claim deletion after success. Failed requests still release their claims. Both quoted predictions were checked manually without running contract tests. Following the human's explicit scope extension, scripts/migrate.js now imports fileURLToPath from node:url and uses fileURLToPath(new URL('../migrations/', import.meta.url)) instead of URL.pathname. The old expression produced a duplicated drive prefix on Windows. This change only converts the migration directory URL into a native path; SQL, migration ordering, transaction boundaries and rollback behavior are unchanged. After the human clarified the format, only the seven template fields remain inside triple-backtick blocks; supplementary prompts, gate responses, verification and limitations are outside.
Rejected: Dropped the initial code that took BEGIN IMMEDIATE before every replay/in-flight lookup, because waiting for another writer could hide the in-flight state until that request finished. Dropped the redundant post-success DELETE because the successful transaction already removes the claim. No human rejection is claimed.
By hand: The human supplied the implementation prompt, asked about the migration helper and grading risk, explicitly authorized the extra scripts/migrate.js change, and updated the ia3-ailog skill to require fenced template fields. At G2 the human reviewed and approved the diff, confirmed no changes to test/ or CONTRACT.md and that new tables are only in 002 migrations, and instructed the agent to commit and tag. The agent made the implementation and migration-runner code changes; the human's skill edit is committed separately as required by the workflow.
```

Verification: Earlier migration checks used a scratch-only Windows path adapter because the starter runner failed to locate migrations. After the authorized path fix, NODE_OPTIONS was cleared and the repository scripts were run directly against a fresh throw-away SQLite database: npm.cmd run migrate, npm.cmd run migrate:down, npm.cmd run migrate, npm.cmd run seed, and npm.cmd test all passed, with 200 menu items seeded and legacy 3/3. npm.cmd invokes the normal npm CLI while avoiding the local PowerShell npm.ps1 policy restriction. The migration adapter was not used for this run. Manual HTTP checks also passed for errors/precedence, corrected requests after 4xx, price snapshots, JSON equality and stored replay across two processes, cursor/filter validation, exact final pages and stable pagination during insertion, legacy headers/error isolation, and generic 500s. A controlled shared-claim check returned 409; the overlap run observed four 409s and exactly one new order. No test source was read and no contract-test command was run. These executions were on Windows with Node v26.13.0; no Linux or macOS execution is claimed.

Limitations/choices: Successful keys and cursor state are retained indefinitely (at least 24 hours). Unknown request fields affect idempotency equality but not order validation/storage. Cursors require the same table filter. No extra Content-Type rejection was added beyond the six prescribed steps. A process crash after claim acquisition can leave a stale claim; crash recovery is not specified. The migration runner now uses Node's native cross-platform URL-to-path conversion and no longer needs the temporary adapter. The extra scripts/migrate.js edit is an explicit human-authorized exception to the original phase-2 file scope. G2 is approved; the first attempt is ready for its commit and ia3-first-attempt tag.

G2 response (verbatim):

Approved. I checked the diff: nothing in test/ or CONTRACT.md, and the new tables are only in migrations/002_*.
Commit and tag.
