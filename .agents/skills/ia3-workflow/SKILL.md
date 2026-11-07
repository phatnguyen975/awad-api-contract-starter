---
name: ia3-workflow
description: Master workflow for the IA#3 API-contract assignment (implement /v1 from CONTRACT.md, tests judge). Use at the start of EVERY session in this repo and whenever you are unsure what to do next, which phase you are in, what to commit, which human gate comes next, or how to resume after an interruption. Also use whenever the user mentions IA#3, the contract tests, NOTES.md, AI-LOG.md, contract-run files, phases, gates or commits. It detects the current phase from git, defines commit order and messages, and lists the human gates.
---

# IA#3 workflow

The grader reads the **commit order** as evidence (predictions before code, run 1 before fixes). So every step has one place in history, and history is never rewritten. This skill tells you where you are, what the next step is, when to stop for the human, and what each commit contains. Step details live in the other `ia3-*` skills.

Examples use bash. Detect the shell you are in and run the equivalent. Keep `ia3-ailog` in mind in every phase.

## 1. Detect the phase

Setup check first: `AGENTS.md`, `.agents/skills/` and the tag `ia3-starter` must exist. If not, stop and tell the human that setup is unfinished.

```bash
git status --short
git tag --list 'ia3-*'
S=$(git log --format=%s ia3-starter..HEAD)
echo "$S" | grep -q '^docs(notes): predictions'        && echo "P1 done"
git rev-parse -q --verify refs/tags/ia3-first-attempt >/dev/null && echo "P2 done"
git ls-files --error-unmatch contract-run-1.txt >/dev/null 2>&1  && echo "P3 done"
echo "$S" | grep -q '^docs(notes): explain failures'     && echo "P4 done"
F=$(git log -1 --format=%H -- contract-run-final.txt)
[ -n "$F" ] && [ -z "$(git log $F..HEAD --format=%h -- src migrations)" ] && echo "P5 done"
echo "$S" | grep -q '^docs(notes): ambiguities'          && echo "P6 done"
echo "$S" | grep -q '^docs(ailog): final pass'           && echo "P7 done"
git ls-files --error-unmatch SELF_ASSESSMENT_REPORT.md >/dev/null 2>&1 && echo "P8 committed"
```

The **first phase not marked done** is the current one. Phase 8 also needs the zip built and verified (see `ia3-submit`); ask the human whether it was submitted.

If `git status` shows uncommitted changes, you are in the middle of a step: read the diff, work out which step it belongs to, tell the human, and continue that step instead of starting over.

## 2. Step protocol

1. Announce: "Phase X, step Y. Next: …. Gate: …".
2. Do the step yourself, using the skill named in the phase map. Do not ask the human for things you can do.
3. At a gate, summarise the result, ask "approve, or anything to change or drop?", write the answer into the AI-LOG entry (`Changed` / `Rejected` / `By hand`), and wait. Do not start the next phase before approval.
4. Write the AI-LOG entry for the step (see `ia3-ailog`), then commit as in section 4.

## 3. Phase map

| Phase           | Steps in brief                                                                                                            | Skill                         | Gate                               | Commit message                                                                        | Files in the commit                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1 Predictions   | Read `CONTRACT.md` only; choose 2 sentences; write `NOTES.md` §1                                                          | `ia3-notes`                   | G1 before commit                   | `docs(notes): predictions made before the agent runs`                                 | `NOTES.md`, `AI-LOG.md`                                                             |
| 2 First attempt | Analyse; write `migrations/002_*`, `src/v1.js`, legacy headers in `src/app.js`; `npm test` green; self-review; rule check | `ia3-implement`               | G2 before commit                   | `feat(v1): agent first attempt`, then tag `ia3-first-attempt`                         | `migrations/002_*.up.sql`, `.down.sql`, `src/v1.js`, `src/app.js`, `AI-LOG.md`      |
| 3 Run 1         | Run `npm run contract` once, save output                                                                                  | `ia3-contract-run`            | none                               | `test(run1): contract-run-1.txt — first attempt, N/29`                                | `contract-run-1.txt` only                                                           |
| 4 Explain run 1 | One `NOTES.md` §2 line per failed test, from `git show ia3-first-attempt:src/v1.js`                                       | `ia3-notes`                   | G4 before commit                   | `docs(notes): explain failures of run 1`                                              | `NOTES.md`, `AI-LOG.md` (includes the phase 3 entry)                                |
| 5 Fix to green  | Draft fix prompts; fix; capture final                                                                                     | `ia3-fix`, `ia3-contract-run` | G5a before fixing; G5b after green | `fix(v1): <short name> (§x)` per fix; `test(run-final): contract-run-final.txt 29/29` | fix: `src/*`, `migrations/002_*`, `AI-LOG.md`; final: `contract-run-final.txt` only |
| 6 Ambiguities   | Answer the human's question; second pass; `NOTES.md` §3, §5                                                               | `ia3-ambiguity`, `ia3-notes`  | G6 before commit                   | `docs(notes): ambiguities and prediction outcomes`                                    | `NOTES.md`, `AI-LOG.md` (includes the final-run entry)                              |
| 7 AI-LOG pass   | Audit `AI-LOG.md`; write `.agents/scratch/oral-prep.md` (not committed)                                                   | `ia3-ailog`, `ia3-submit`     | G7 before commit                   | `docs(ailog): final pass`                                                             | `AI-LOG.md`                                                                         |
| 8 Submit        | Preflight; self-assessment; zip                                                                                           | `ia3-submit`                  | G8 before commit                   | `docs(self-assessment): claim <total>/100`                                            | `SELF_ASSESSMENT_REPORT.md`, `AI-LOG.md`                                            |

If run 1 passes 29/29: phase 4 only writes the line "The agent passed 29/29 on the first attempt." into `NOTES.md` §2 (same commit message); phase 5 only captures the final run.

## 4. Commit rules

- Stage explicit paths (`git add <path>`); never `git add -A` or `git add .`.
- Before each commit run `git status --short` and `git diff --cached --stat`; only the files listed for that step may be staged.
- Commit run-capture files alone. Their AI-LOG entries go into the next commit.
- Never amend, rebase, squash, `reset --hard` or force-push. Fix forward with a new commit.
- Never commit `data/`, `node_modules/`, `.agents/scratch/`.
- Tags: `ia3-starter` (made by the human in setup), `ia3-first-attempt` (yours, on the first-attempt commit).
- Edits to `AGENTS.md` or skills during the work get their own commit `chore(agent): …` and touch nothing else.

## 5. Order invariants (check before every commit)

1. The predictions commit comes before any commit that changes `src/`.
2. `contract-run-1.txt` is created exactly once, by the first `npm run contract` of the whole assignment, and is committed before any `fix(v1)` commit.
3. `contract-run-final.txt` is captured after the last change to `src/` or `migrations/`. If code changes afterwards, capture it again in a new commit.
4. `git diff ia3-starter --stat -- test CONTRACT.md` prints nothing.

Quick review of history: `git log --reverse --format='%h %s' --name-only ia3-starter..HEAD`.

## 6. Human gates

| Gate | What the human checks                                                                                                         |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- |
| G1   | Two different predictions, each with a quoted sentence, section and reason; the human can explain them                        |
| G2   | The diff obeys the rules (nothing in `test/` or `CONTRACT.md`, tables only in `002_*` with a down)                            |
| G4   | Each `NOTES.md` §2 line says what the agent actually did, not just the test name                                              |
| G5a  | The list of fix prompts (test name + section, no test code)                                                                   |
| G5b  | The overall fix diff; what the human does not want to keep goes to `Rejected`                                                 |
| G6   | Decisions and proposed contract sentences; at least one point outside the agent's first list, chosen and checked by the human |
| G7   | `AI-LOG.md` is true; `oral-prep.md` is understood                                                                             |
| G8   | Claimed score has evidence; the total equals the number in the zip name                                                       |

The only inputs the human gives: the hand-over prompt (phase 2), the ambiguity question (phase 6), the chosen ambiguity (phase 6), student ID and name (phase 8).

## 7. When something goes wrong

Stop and tell the human at once if you did something out of order (ran `npm run contract` early, touched `test/`, committed the wrong file). Then:

- Record it in `AI-LOG.md` and, if it affects the evidence, in `NOTES.md`. Honest records cost less than a hidden problem.
- Not yet committed: undo it in the working tree (for `test/` and `CONTRACT.md`: `git checkout ia3-starter -- test CONTRACT.md`).
- Already committed: fix forward with a new commit; never rewrite history.
- Early contract run: do not present a later run as "run 1". Tell the human and let them decide how to handle it.
