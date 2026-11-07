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

## 2026-11-07 — Phase 5: Environment repair and verification

```
Tool: Codex (GPT-6)
Prompt: (agent-drafted, approved) Fix: "§4.2 a retry that lands on the other instance is still a replay" + "§4.4 a cursor from one instance works on the other"; CONTRACT.md §4.2: "Same key, same body → the **stored** response: status `201`, the identical body, the same `Location`, plus the header **`Idempotent-Replayed: true`**."; CONTRACT.md §4.4: "A cursor is **opaque**: the client stores it and sends it back unchanged, and never builds one."; Observed: Both tests were cancelled after the parent suite reported that npm run migrate failed with an undefined diagnostic and a null child-process status.
Asked for: Repair the execution environment, run the unchanged repository, preserve run 1, and propose code fixes only if actual API mismatches appear.
Kept: All implementation and migration-runner code remains identical to ia3-first-attempt. Both formerly cancelled multi-instance tests passed, as did the other 27 contract tests and all three legacy tests.
Changed: Downloaded the official node:22-bookworm-slim Docker image and ran a network-disabled container with a read-only repository mount and a fresh temporary SQLite database. Ran migration, seed, legacy tests and contract tests, capturing stdout/stderr together in ignored .agents/scratch/run-2.txt. Added the verified follow-up finding to NOTES.md section 4; no implementation fix was needed.
Rejected: Nothing rejected in this step.
By hand: The human approved the environment-repair proposal at G5a with "Approved" and reviewed and approved the diff at G5b with "Approved. I reviewed the fix diff."
```

Approved action: Run the unchanged committed repository in Linux with Node >=22.13, no network during execution, a read-only repository mount and a temporary database; keep subsequent output separate from contract-run-1.txt. No package dependencies were installed in the repository.

Environment: Node v22.23.4; Docker image node:22-bookworm-slim, downloaded digest sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d.

Verification: migrate and seed succeeded, legacy 3/3 passed, contract 29/29 passed, fail 0, cancelled 0, process exit 0. The UTF-8 scratch capture contains the complete run. The original run-1 capture remains unchanged. The OS and Node version both changed from the first run, so no claim is made that this isolates a single platform/version variable. No test source was read or edited. This finding is recorded as documentation, without inventing a fix(v1) commit for unchanged code. After G5b approval, the separate final run below was captured and committed.

## 2026-11-07 — Phase 5: Final run

```
Tool: Codex (GPT-6)
Prompt: After G5b approval, capture the final contract-test run against a clean database and commit only contract-run-final.txt.
Asked for: Preserve a final 29/29 capture after the last implementation change and the approved environment repair.
Kept: The complete contract stdout/stderr in contract-run-final.txt, committed alone as 06f8e43. It reports 29 tests, pass 29, fail 0, cancelled 0. The original run-1 capture remains unchanged.
Changed: Started a new Linux container with a fresh temporary SQLite database, the same Node v22.23.4 image, a read-only repository mount and no network. Ran migrate, seed and legacy tests before the final contract command. Routed preflight output separately into ignored .agents/scratch/final-preflight.txt so the final capture contains only the contract command's output.
Rejected: Nothing rejected in this step.
By hand: The human reviewed and approved G5b. No additional human code changes are claimed.
```

G5b response (verbatim): Approved. I reviewed the fix diff.

Final command: npm run contract 2>&1 inside the Linux container, with stdout captured directly as bytes into host contract-run-final.txt. No PowerShell text conversion, output filtering, or migration helper was used.

Verification: Clean-database migration and seed succeeded; legacy 3/3 passed; final contract 29/29 passed with exit 0. UTF-8 decoding succeeded with no BOM or NUL bytes. No src/, migrations/ or scripts/ change followed the successful environment run. The capture-only commit contains just contract-run-final.txt; this log entry will be committed with phase 6 as required by ia3-contract-run and ia3-ailog.

## 2026-11-07 — Phase 6: Ambiguities and prediction outcomes

```
Tool: Codex (GPT-6)
Prompt: Which sentences of CONTRACT.md could be read two ways, and what did you choose for each
Asked for: Identify competing readings, explain the implementation's choices and proposed contract wording, and perform a separate pass for a human-selected point outside the original answer.
Kept: The human approved A1–A6 covering Content-Type rejection, URL integer spelling, duplicate query parameters, limit changes with cursors, abandoned in-flight claims after crashes, and legacy header coverage. Added the human-selected B2 and B4 as Found by: me, with the supplied reasons and proposed sentences verbatim. Each adopted point includes its section, two readings, actual code choice, decision, reason and testable proposed wording. The document is in English; the conversation summarizes it in Vietnamese.
Changed: Replaced A5's proposed sentence with the human's completion/crash/operational-action wording while keeping its decision unchanged. Checked A1–A6 for concrete status/header/field/number values and strengthened A6 with the exact Deprecation and Sunset values, showing the rewrite before editing. Showed the functions and line numbers implementing A4, A6, B2 and B4 before finalizing, and confirmed both B readings match the unchanged code within the stated six-step precedence. Section 5 records both predictions as not having come true, using their passed tests in the original run.
Rejected: Replaced the agent's original A5 proposed sentence at the human's request, using the more explicit completion/crash/operational-action sentence they supplied. Excluded raw-text JSON comparison, ignoring unknown fields during complete-body comparison, page-shifting offset pagination and a cursor for a final full page as ambiguity claims because other sentences settle them. B1 and B3 were not selected for adoption; no human rejection of their readings is claimed.
By hand: The human reported: "I picked B2 and B4 from your second-pass candidates; I read the contract lines myself; the wording of my reasons and sentences was drafted with Claude chat and I reviewed and adopted it." The human approved A1–A6, supplied A5's replacement sentence, checked B4 against lines 121–122, 134 and 141–144 and B2 against lines 35, 46, 112–113 and 124, and authorized the phase-6 commit and continuation to G7.
```

Second-pass provenance: The agent generated B1–B4 separately from A1–A6 by sweeping inputs and interacting rules and comparing cases with passed test names. The human selected and checked B2 and B4; Claude chat drafted the supplied wording, which the human reviewed and adopted. These were not independently discovered from scratch by the human. The Found by: me labels implement the workflow's selection/check convention while preserving that origin. B1 and B3 remain exploratory scratch candidates rather than adopted decisions. Test names do not prove which inputs the unread assertions cover.

Code confirmation before finalizing: A4 is listOrders in src/v1.js:224, with current/default limit at 232 and cursor/filter/boundary logic at 237–254. A6 is legacy/handle in src/app.js:25 and 64, with header installation at 27 and early health/v1 dispatch plus exact header values at 66–73. B2 is validateOrder in src/v1.js:68, specifically the two independent field checks at 81–87; each non-object line gets two child pointers and no parent-line entry. B4 is priorRequest/placeOrder at 148 and 157: header and JSON checks run first, then an in-flight claim returns 409 without a body comparison; stored-response comparison at 174–176 can return 422. Code was not changed.

G6 status: Approved subject to the requested wording and code verification, both completed. Only NOTES.md and AI-LOG.md are changed deliverables; CONTRACT.md, test/, source, migrations and run captures remain unchanged. The phase-5 final-run entry above is included in this documentation commit. The human explicitly authorized commit message docs(notes): ambiguities and prediction outcomes, then phase 7 stopping at G7.

## 2026-11-07 — Phase 7: AI-LOG audit and oral preparation

```
Tool: Codex (GPT-6)
Prompt: Audit AI-LOG.md after the phase-6 commit, write the ignored oral-preparation notes, and stop at G7 for the human to read both.
Asked for: Check the log's prompts, changes, rejections, attribution and capture timing against the recorded work, and prepare explanations the human can review.
Kept: The implementation/fix/ambiguity prompts, gate reviews, original Windows run and separate Linux final result, actual rejected code/wording, and explicit Claude-chat provenance for the human-adopted B2/B4 wording. The audit confirms the seven-field fence format and no test-code patterns in the log.
Changed: Aligned the logging instructions, log and scratch documents with the human's clarified scope: assignment records begin with predictions. Updated the ia3-ailog and ia3-workflow skills accordingly. Wrote ignored .agents/scratch/ai-log-audit.md with the checks and their limits, and .agents/scratch/oral-prep.md covering every contract section, both predictions, both cancelled tests, all eight adopted ambiguities, rules and evidence. Application code and test captures remain unchanged.
Rejected: Nothing rejected in this step.
By hand: The human clarified the logging scope and requested consistent instructions and documents, then read oral-prep.md and the log, approved G7, and instructed the agent to continue with phase-8 preflight and scoring, stopping at G8 before creating the zip.
```

Audit result: Phases 1–6 are present; there are zero implementation-fix commits and zero invented implementation-fix entries, and three nonempty Rejected fields were manually checked for their actual meaning. Both capture commits contain only their capture files; source/migration/script history is unchanged after the final capture. Forbidden tracked paths and starter diffs are empty. G7 is approved; skill-instruction changes are committed separately as chore(agent), followed by the phase-7 final-pass commit.

G7 response (approval excerpt): Approved. I read oral-prep.md and the log.
