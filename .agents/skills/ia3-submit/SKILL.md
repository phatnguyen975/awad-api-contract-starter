---
name: ia3-submit
description: Finish and package the IA#3 assignment — oral-prep notes (phase 7), preflight checks, the criterion-by-criterion audit, SELF_ASSESSMENT_REPORT.md, and the submission zip (phase 8). Use when the human says the work is done, asks for the self-assessment, the score, the zip, the submission or a final check, when the current phase is 7 or 8, or when someone wants the work graded against the rubric. Covers verification of the committed state, commit-order checks, honest scoring, zip contents and name, and a final unzip-and-run test.
---

# ia3-submit — oral prep, preflight, self-assessment, zip

Examples use bash; detect the shell and run the equivalent. Dates and names come from the human or the repo; never invent them. The deadline is Thursday, 12 November 2026, 22:00.

## A. Oral prep (phase 7, after the AI-LOG audit)

Write `.agents/scratch/oral-prep.md` (not committed). Plain language, so the human can explain the work when asked:

- for each section of `CONTRACT.md`: what the code does and why it is built that way (2–3 sentences, naming the function);
- the two predictions and whether they came true;
- each failed test of run 1 and what fixed it;
- each ambiguity: the two readings, the decision, the proposed sentence;
- the rules of the assignment and how they were kept.

Show it at gate G7 together with the AI-LOG audit. The human should read it well enough to explain the work and correct any attribution or understanding gaps. Score only against the published rubric; do not invent an automatic zero rule that the brief does not state.

## B. Preflight (phase 8, step 1)

Everything is checked on the **committed** state, because the grader unzips a repository and runs it.

```bash
git status --short                                              # nothing (ignored files aside)
git diff ia3-starter --stat -- test CONTRACT.md package.json    # prints nothing
ls migrations/002_*                                             # exactly one .up.sql and one .down.sql
grep -rn "CREATE TABLE" src/                                    # prints nothing
git ls-files data node_modules                                  # prints nothing
```

Migration round trip on a temp database: `DB_PATH=<temp file> npm run migrate`, then `npm run migrate:down`, then `npm run migrate`; all must succeed.

Clean run from a fresh clone (catches files that exist only in the working tree):

```bash
git clone --no-hardlinks . ../ia3-verify && cd ../ia3-verify
npm run migrate && npm run seed && npm test && npm run contract 2>&1 | tee /tmp/verify.txt
```

Legacy must be 3 of 3 and the contract summary must read `tests 29`, `pass 29`, `fail 0`, matching `contract-run-final.txt`. If anything differs, stop and go back to `ia3-fix` / `ia3-contract-run`; if `src/` or `migrations/` changed after the last final capture, capture it again.

Commit order (each line must print its OK):

```bash
N=$(git log --reverse --format=%H --diff-filter=A ia3-starter..HEAD -- NOTES.md | head -1)
S=$(git log --reverse --format=%H ia3-starter..HEAD -- src migrations | head -1)
git merge-base --is-ancestor $N $S && echo "predictions before first src change: OK"
R=$(git log --reverse --format=%H -- contract-run-1.txt | head -1)
F=$(git log --reverse --format=%H --grep='^fix(v1)' | head -1)
[ -z "$F" ] || git merge-base --is-ancestor $R $F && echo "run 1 before first fix: OK"
[ -z "$(git log ia3-first-attempt..$R --format=%h -- src migrations)" ] && echo "no src change between first attempt and run 1: OK"
```

Also confirm the required root deliverables are tracked: `contract-run-1.txt`, `contract-run-final.txt`, `NOTES.md`, `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md` (after step C), plus the implementation files `src/v1.js`, `src/app.js` and `migrations/002_*`.

## C. Audit and score (phase 8, step 3)

Go through each criterion against docs/ia3-requirements.md, find the supported band, and cite the final evidence. Do not automatically subtract marks by selecting the lower bound: claim full marks when every top-band requirement is supported, and explain any specific unmet requirement that prevents the maximum. Distinguish a defensible self-assessment from a guarantee of the instructor's mark. Never change evidence or attribute an agent-originated discovery to the human in order to increase the score.

| #   | Top band needs                                                                                                                                                                | Evidence                                | Claim if top band | Claim otherwise                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Legacy 3/3, contract 29/29 in the clean run, matches `contract-run-final.txt`                                                                                                 | clean-run output                        | 30                | use the published 20–29, 10–19 or 0–9 band for the actual test/legacy/startup result |
| 2   | Nothing changed in `test/` or `CONTRACT.md`; every new table in one `002_*` pair with a down                                                                                  | preflight output                        | 10                | table outside a migration or no down → published 5–9 band; test or contract changed → 0 (and criterion 1 → 0) |
| 3   | Two quoted or numbered sentences, each with a reason; commit before the first `src/` change; one outcome line each                                                            | `NOTES.md` §1 and §5; order check       | 10                | use the rubric's 5–8, 1–4 or 0 band according to the actual missing evidence |
| 4   | `contract-run-1.txt` committed before any fix; every unsuccessful test explained from actual output and implementation, with proposed wording where ambiguous                 | `NOTES.md` §2; preserve fail/cancelled distinction | 20        | use the rubric's 11–16, 4–10 or 0–3 band for the actual omission; do not invent HTTP results for cancelled tests |
| 5   | Agent's answer in `NOTES.md`; each point has section, two readings, decision/reason and proposed sentence; at least one point not listed by the agent was found by the human     | `NOTES.md` §3 and honest discovery provenance | 20          | 11–16 if no independent human-found point is evidenced; 4–10 without decisions/wording; 0–3 if missing |
| 6   | Hand-over and every fix prompt logged; fix prompts name test and section only; real `Changed` and `Rejected`                                                                  | `AI-LOG.md` audit                       | 10                | use the rubric's 5–8, 1–4 or 0 band according to the actual omission |

The claimed total is the sum; meeting every maximum gives 30 + 10 + 10 + 20 + 20 + 10 = 100. A selected and checked candidate from a second agent pass remains agent-originated; disclose that distinction when judging criterion 5 against the assignment brief. Honesty adjustment follows the brief: more than 10 points of overclaim can cost 3 to 10 marks, and underclaiming by 21 or more can cost 3. Every claimed criterion needs an evidence pointer; preserve the actual runs, commits and human contributions.

## D. SELF_ASSESSMENT_REPORT.md

Ask the human for their student ID and full name. Create the file at the repository root:

```markdown
# Self-assessment — IA#3

**Submitted by:** `<student ID>` — `<full name>`

**Total I claim:** <total>/100

| Criterion                                    | Max | I claim | Evidence                                                                       |
| -------------------------------------------- | --- | ------- | ------------------------------------------------------------------------------ |
| 1. The contract tests pass                   | 30  | <n>     | contract-run-final.txt: contract 29/29; documented clean verification: legacy 3/3 |
| 2. The rules were kept                       | 10  | <n>     | `git diff ia3-starter -- test CONTRACT.md` empty; migrations/002_*.up/down.sql |
| 3. Predictions, made before the agent ran    | 10  | <n>     | NOTES.md §1, §5; commit `<sha>` precedes `<sha>` (first src change)            |
| 4. The first run, read line by line          | 20  | <n>     | contract-run-1.txt (commit `<sha>`); NOTES.md §2, <k> lines                    |
| 5. The sentences that could be read two ways | 20  | <n>     | NOTES.md §3: full point analysis and actual discovery provenance; identify a human-found point or disclose the missing requirement |
| 6. AI-LOG.md                                 | 10  | <n>     | AI-LOG.md: entries for every phase; Rejected in <entries>                      |

### What I did not manage

<a frank paragraph: what is weak, missing, or uncertain; "nothing" only if that is true>

### What I would do differently

<one or two sentences>
```

The table total, the number in the heading and the number in the zip name must be identical; the table wins if they ever differ. Use real commit hashes from `git log`. The "did not manage" section is scored as honesty: write what is actually imperfect (a weak line in §2, an untested sentence, a choice you are unsure about).

## E. Gate G8, commit, zip (phase 8, steps 4–6)

Show the score table and the evidence, ask "approve, or anything to change?", record the answer in the AI-LOG entry for phase 8 (the claimed total and how it was derived). Commit:

```
docs(self-assessment): claim <total>/100
```

Build the zip from the repository root so the files sit at the root of the archive and `.git` is inside. Name it `<StudentID>_<total>.zip` and put it next to the repository, not inside it:

```bash
zip -r ../<StudentID>_<total>.zip . -x "data/*" "node_modules/*" ".agents/scratch/*"
```

Without `zip` (Windows): `tar -a -c -f ..\<StudentID>_<total>.zip --exclude=data --exclude=node_modules --exclude=.agents/scratch .` (bsdtar ships with Windows 10 and later), or a short script with Python's `zipfile`. Whichever tool you use, check the result:

```bash
unzip -Z1 ../<StudentID>_<total>.zip | sed 's#^\./##' > /tmp/zip-list    # Windows: tar -tf <zip>
grep -c '^\.git/' /tmp/zip-list        # must be greater than 0
grep -c '^data/' /tmp/zip-list         # must be 0
grep -c '^node_modules/' /tmp/zip-list # must be 0
grep -c '\\' /tmp/zip-list             # must be 0 (no backslash paths)
for f in NOTES.md AI-LOG.md SELF_ASSESSMENT_REPORT.md contract-run-1.txt contract-run-final.txt src/v1.js src/app.js; do grep -qx "$f" /tmp/zip-list || echo "MISSING $f"; done
```

Final smoke test as the grader does: unzip into an empty directory and run `npm run migrate && npm run seed && npm test && npm run contract`; it must show legacy 3/3 and contract 29/29.

Tell the human the exact zip path and name, and remind them to submit it from their `<StudentID>@student.hcmus.edu.vn` account before the deadline. A wrong file name costs no marks but delays the result.
