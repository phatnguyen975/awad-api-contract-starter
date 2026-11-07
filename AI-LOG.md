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

## 2026-11-07 — Phase 3: Run 1

```
Tool: Codex (GPT-6)
Prompt: Continue after the approved first-attempt commit and tag, using ia3-contract-run to capture the first contract-test run exactly once.
Asked for: Preserve and commit the first official run before any fixes.
Kept: The complete stdout/stderr capture in contract-run-1.txt, committed alone as c6a383d after first-attempt commit b92fcf1 and tag ia3-first-attempt. Node was v26.13.0 and the working tree was clean before the run.
Changed: Used the skill's cmd redirection fallback to capture Node's bytes without PowerShell stderr conversion or UTF-16 encoding. No implementation changed and the capture was not edited or replaced.
Rejected: Nothing rejected in this step.
By hand: The human approved G2 and instructed the agent to commit and tag; the agent then followed the workflow into phase 3 without an additional gate.
```

Command: cmd /c "npm run contract > contract-run-1.txt 2>&1" (executed once).

Result: 29 tests, 27 passed, 0 failed, 2 cancelled; command exit status 1. The multi-instance suite reported a migration-subprocess setup failure. UTF-8 verification passed with no BOM or NUL bytes. The capture-only commit intentionally contains no AI-LOG changes; this entry belongs in the next, phase-4 commit.

## 2026-11-07 — Phase 4: Explain run 1

```
Tool: Codex (GPT-6)
Prompt: Explain every test that did not complete successfully in run 1 from its output, the contract, and the tagged first-attempt implementation; stop at G4 before fixing.
Asked for: Record two honest explanations for the cancelled tests and distinguish setup failure from unobserved API behavior.
Kept: The human approved the two NOTES.md section 2 explanations. Each names a cancelled test, quotes the relevant contract sentence, describes the tagged SQLite-backed implementation, and states that no HTTP outcome was observed. Section 4 records the parent-suite migration-launch finding.
Changed: Replaced the unrun placeholder with the actual counts and two explanations. Counted the two cancelled tests separately from the summary's zero failed tests; the failed parent-suite setup is recorded as a shared finding, not a third test. Read the implementation through git show ia3-first-attempt:src/v1.js, without opening test source.
Rejected: Did not attribute an incorrect API response to either cancelled test, because the suite stopped before those behaviors ran. No contract wording change or implementation fix is justified by that output alone.
By hand: The human read and approved the explanations at G4. No fix prompt has been approved yet.
```

Diagnostic: A standalone Node child-process check ran npm --version directly and through cmd. The direct invocation returned status null and ENOENT; the cmd invocation succeeded. This supports a Windows npm-launch hypothesis, without confirming the unread test harness's exact invocation. No contract re-run, test-source inspection, or code change followed run 1.

G4 response (verbatim): Approved. I read the lines.
