---
name: ia3-fix
description: Phase 5 of the IA#3 assignment — get the failing contract tests to green by fixing the /v1 implementation from contract sentences, never from test code. Use after contract-run-1.txt is committed and explained, whenever a contract test fails, when the human asks to fix a test or a CONTRACT.md section, or when you must draft fix prompts. Covers drafting fix prompts (test name + section), the fix loop, regression checks, one commit per fix, the AI-LOG entry per fix, stuck cases, suspected wrong tests, and gate G5b.
---

# ia3-fix — from red to green, guided by the contract

A fix is correct when it makes the code obey a sentence of `CONTRACT.md`. The tests only report whether it does. Work from the sentence, so the result also holds for cases the tests do not check.

## Preconditions

- Current phase is 5 (`ia3-workflow`); `contract-run-1.txt` and the phase 4 notes are committed (`git ls-files contract-run-1.txt`).
- You may run `npm test` and `npm run contract` now. You still never read `test/`, never edit `test/`, `CONTRACT.md` or `package.json`.

## Step 1 — Draft the fix prompts

Take the failed tests from `contract-run-1.txt` (list after `✖ failing tests:`) and the `NOTES.md` §2 lines. Group tests that fail for the same root cause. For each group write one prompt in this shape:

```
Fix: "<test name as printed>" [+ other test names of the same cause]
CONTRACT.md §x.y: "<the sentence>"
Observed: <one line from the output, e.g. status or header difference — optional>
```

Rules for the prompts:

- Name the test and the contract section. Never include test code, assertion source or stack-trace lines.
- "Observed" may restate what the output says (status, header, body mismatch); drop anything that points into `test/`.
- Every prompt must trace back to a test that failed in `contract-run-1.txt`.

## Step 2 — Gate G5a

Show the list. Ask "approve, or anything to change, drop or add?". The approved list is what you log as the prompts handed over, marked "(agent-drafted, approved)". Record the human's changes. Do not start fixing before approval.

## Step 3 — Fix loop (per prompt)

1. **Locate** the sentence in `CONTRACT.md` and re-read the whole section, not only the sentence; neighbouring sentences often change its meaning.
2. **Reproduce** by hand: start the server on a temp database (`DB_PATH`) and send the request, or reason from the code. Do not open `test/`.
3. **Find the cause** in `src/v1.js`, `src/app.js` or the migration. Compare with what the first attempt did (`git show ia3-first-attempt:src/v1.js`) and why that was wrong.
4. **Fix at the cause.** Make the rule hold for every input the sentence covers. Do not special-case values, do not weaken a rule to silence a test, do not copy expected values out of failure messages.
5. **Look sideways:** other endpoints or sections that share the same helper or the same sentence pattern.
6. **Schema changes:** edit `migrations/002_*.up.sql` and its `.down.sql`; never add another migration. Re-apply on a temp database with `DB_PATH`: `npm run migrate`, `npm run migrate:down`, `npm run migrate`.
7. **Verify:** `npm test` (legacy 3/3) and `npm run contract`, saving the output outside the repo history: `npm run contract 2>&1 | tee .agents/scratch/run-<n>.txt` (create the folder if it is missing; it is gitignored). Compare with the previous run in `.agents/scratch/`: the target tests must pass and **no test that passed before may fail**. If one does, rework the fix before committing; never commit a regression.
8. **Commit** (one commit per root cause), explicit paths only:

   ```
   fix(v1): <short name> (§x.y)

   Fixes: <test name>; <test name>
   ```

   Files: the changed `src/*`, `migrations/002_*` if touched, and `AI-LOG.md`.

9. **AI-LOG entry** (`ia3-ailog`) in the same commit: the prompt verbatim; `Kept` / `Changed` for this fix; `Rejected` = what the earlier code did that this fix replaced, and any approach you tried and dropped, each with the reason; `By hand` = what the human did (approved the list, reviewed).

Keep fix commits tied to run-1 failures: a commit that fixes something no run-1 test showed makes the history look as if run 1 was re-run. Cleanups the human requests at G5b are labelled `refactor(v1): …` instead.

## Stuck rule

After three genuinely different attempts on one root cause without progress, stop. Tell the human: the sentence, what the code does now, what you tried, what you think is missing. Continue with other prompts meanwhile.

## Suspected wrong test or contract

If the sentence and the observed requirement seem to contradict, or the contract is silent where a test demands something: do not touch `test/` or `CONTRACT.md`. Add a finding to `NOTES.md` §4 (test name, section, what looks wrong, why), commit it as `docs(notes): finding — <test name>`, tell the human, and keep going. A finding is not a failure; an edited test scores zero.

## Step 4 — Gate G5b (when all contract tests pass and legacy is 3/3)

Summarise the fixes (`git diff ia3-first-attempt..HEAD --stat` plus one line per fix) and ask "approve, or anything to change or drop?". Write the answer into the AI-LOG entries (`Changed` / `Rejected`). Apply requested changes as new commits, then re-run both suites. After approval, continue with the final run in `ia3-contract-run`.

## Never

- Read or edit `test/`; edit `CONTRACT.md`; hard-code test values; leave a failing legacy test.
- Amend or rewrite earlier commits; fix by creating a second migration.
