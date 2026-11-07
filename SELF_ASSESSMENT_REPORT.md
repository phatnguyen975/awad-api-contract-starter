# Self-assessment — IA#3

**Submitted by:** 23127449 — Nguyễn Tấn Phát

**Total I claim:** 100/100

**Status:** Prepared for an independent review in a new session. The human authorized committing this review copy and deferred packaging until after that review. C2 and its log entry are committed at `007743f`. No submission zip has been created.

This assessment applies the six criteria in [docs/ia3-requirements.md](docs/ia3-requirements.md) to the current deliverables and their actual evidence. The table is the current score proposal; chronological log entries retain the proposals made at their respective times. The instructor's run and assessment determine the awarded mark.

## Score and evidence

| Criterion | Maximum | I claim | Evidence and reason |
| --- | --- | --- | --- |
| 1. The contract tests pass | 30 | 30 | [contract-run-final.txt](contract-run-final.txt), committed alone at `06f8e43`, reports tests 29, pass 29, fail 0 and cancelled 0. Clean-clone verification at `2e5bb12` and a subsequent check of the unchanged application both passed legacy 3/3 and contract 29/29 in Linux Node v22.23.4. |
| 2. The rules were kept | 10 | 10 | The starter diff for test/, CONTRACT.md and package.json is empty. All three new tables are created by [002_v1_state.up.sql](migrations/002_v1_state.up.sql) and removed by [002_v1_state.down.sql](migrations/002_v1_state.down.sql). The up/down/up round trip passed, and src/ contains no CREATE TABLE. The human-authorized scripts/migrate.js portability change is documented in [AI-LOG.md](AI-LOG.md). |
| 3. Predictions, made before the agent ran | 10 | 10 | [NOTES.md](NOTES.md) §1 contains two different contract sentences, section references and specific reasons. Prediction commit `5ec00af` precedes the first source change at `b92fcf1`, tagged ia3-first-attempt. NOTES §5 records the outcome of each prediction against its passed run-1 test. All top-band requirements are present. |
| 4. The first run, read line by line | 20 | 20 | [contract-run-1.txt](contract-run-1.txt), committed alone at `c6a383d`, preserves 27 passed, 0 failed and 2 cancelled tests. NOTES §2 explains each cancelled test with its exact name, relevant contract sentence, tagged implementation behavior and the unobserved HTTP outcome; §4 explains their shared setup failure and later verification. Explanations were committed at `49efef2` before environment repair; run 1 was not replaced and no API failure or code fix is invented. |
| 5. The sentences that could be read two ways | 20 | 20 | NOTES §3 includes the agent's A1–A6 answer and the adopted B2/B4 analyses, each with sections, competing readings, actual code behavior, decision/reason and proposed wording. The additional C2 block was supplied by me after the agent's A/B lists: I identified the unsupported-method question, supplied both readings, chose 404 with a reason and provided a concrete sentence. C2 is labeled Found by: me and its human origin is recorded in the C2 log entry; both are committed at `007743f`. |
| 6. AI-LOG.md | 10 | 10 | AI-LOG records the implementation hand-over prompt, the approved environment-repair prompt with test names and contract sections, the ambiguity question, gate decisions and actual assistant attribution. It contains real Changed and Rejected material: the phase-2 implementation replacements and my replacement of the agent's A5 wording to clarify completion, crashes and operational clearing. The C2 follow-up records the new human-provided point and instruction. No test code is pasted into a fix prompt. |
| **Total** | **100** | **100** | **30 + 10 + 10 + 20 + 20 + 10 = 100** |

## Interpretation of the first-run evidence

Run 1 did not pass all 29 tests: two tests were cancelled during the multi-instance suite's migration-subprocess setup. NOTES §2 therefore explains those two unsuccessful tests rather than applying the rubric's special all-29-passed alternative or claiming that incorrect HTTP responses were observed. The analysis goes beyond repeating test names: it identifies what the tagged implementation does, where execution stopped, and why changing contract wording was not a remedy for that setup failure.

The capture remains the authentic first run. The later Linux success is separate evidence, with its different OS and Node version declared. The rubric gives no specific automatic deduction for an honestly preserved and fully explained cancelled-test setup case; I claim the top of the 17–20 band for the complete analysis, subject to the instructor's judgment.

## Human contribution to the ambiguity analysis

C2 addresses an existing /v1 path called with an unsupported method. Its cited sentences are §2 lines 21–22, 42, 53 and 57. The two readings produce observably different responses: 404 not-found for an unmatched method/path route, or 500 internal through the table's catch-all. I selected the former and supplied the sentence explicitly requiring 404 and excluding 405. The agent checked that handleV1 at src/v1.js lines 259–269 and 284, with sendProblem at lines 25–34, already implements that decision.

C2 was introduced in my four-candidate message before the agent evaluated it, and was not one of the agent's earlier A/B candidates. This is the additional human-provided point supporting the criterion-5 requirement. B2/B4 retain their separate, disclosed origin in the agent's second pass; their wording was drafted with Claude chat and reviewed and adopted by me. Their provenance is not changed to justify this score.

## Verification and history

| Check | Actual evidence |
| --- | --- |
| Runtime | Linux, Node v22.23.4; official node:22-bookworm-slim image, digest sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d |
| Clean committed baseline | A fresh git clone --no-hardlinks at `2e5bb12`, mounted read-only, with temporary SQLite databases and networking disabled during execution |
| Migration verification | On a separate temporary database: migrate, migrate:down, migrate all succeeded |
| Clean grading sequence | migrate, seed, npm test, npm run contract all succeeded; seed added 200 menu items |
| Latest available verification | Legacy: tests 3, pass 3, fail 0, cancelled 0. Contract: tests 29, pass 29, fail 0, cancelled 0. No application code has changed since those checks. |
| Capture contents | The final capture contains contract output only; the legacy result comes from verification, not from a claim that legacy output appears in that capture. Both captures are UTF-8 and unchanged. |
| Source history | No source, migration or migration-runner changes between ia3-first-attempt and run 1, or after final-capture commit `06f8e43`; no implementation-fix commit was needed |
| Protected files and exclusions | Test blob IDs, CONTRACT.md and package.json match ia3-starter; no data/, node_modules/ or .agents/scratch/ files are tracked |

Local diagnostic output is retained in ignored .agents/scratch/phase8-preflight.txt and .agents/scratch/submission-review-current.txt. The committed baseline, commands, environment and results are recorded here so evidence does not depend solely on excluded scratch files. Later edits have affected documentation only; no additional runtime result or commit is invented.

## What I did not manage

The full contract suite did not complete natively on Windows: two multi-instance tests were cancelled during setup, consistent with an npm child-process launch issue. The declared Linux environment passed all 29 tests, but a universal native-platform result is not claimed. In-flight keys have no automatic crash recovery; an abandoned reservation requires operational clearing, as the adopted clarification states. These limitations remain disclosed rather than hidden by a full-mark claim.

## What I would do differently

I would agree the execution environment and clarify unsupported-method handling and in-flight recovery policy before implementation. I would keep the distinction between an independently supplied point and a reviewed agent suggestion explicit from the beginning.

## Submission readiness

The human authorized committing the documentation and this report for an independent assessment in a new session. Packaging and submission are intentionally on hold until the human authorizes them after that review. The eventual archive must include .git and exclude data/, node_modules/ and .agents/scratch/, and the extracted archive must pass the grading sequence. Its total must equal the approved report total. Archive creation and unzip-and-run verification have not been performed.
