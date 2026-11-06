---
name: ia3-notes
description: Write and maintain NOTES.md for the IA#3 assignment — the two predictions made before the agent runs (phase 1), one explained line per failed test of contract-run-1.txt (phase 4), findings about tests or contract, and the prediction outcomes (phase 6). Use whenever you create or edit NOTES.md, when choosing which two CONTRACT.md sentences you expect to get wrong, when explaining why a contract test failed, or when recording whether a prediction came true. The ambiguity section (§3) is written with the ia3-ambiguity skill.
---

# ia3-notes — NOTES.md

`NOTES.md` is graded on three criteria: predictions made before the code (§1), the first run read line by line (§2), and the sentences that could be read two ways (§3, see `ia3-ambiguity`). Write it in English, in the human's first-person voice ("I would write…"), and state only what is true: quote the contract exactly, describe what the code actually did, record outcomes as they were.

## Template

Create the file in phase 1 with every heading, so later phases only fill sections.

```md
# NOTES — IA#3

**Student:** `<student ID>` — `<full name>`

## 1. Predictions (written before the agent touched src/)

| #   | CONTRACT.md sentence | §    | Why I expect the agent to get it wrong |
| --- | -------------------- | ---- | -------------------------------------- |
| P1  | "<quoted sentence>"  | §x.y | <reason>                               |
| P2  | "<quoted sentence>"  | §x.y | <reason>                               |

## 2. First run — failures in contract-run-1.txt

First attempt: legacy 3/3 · contract N/29 (commit `<sha>`).

- **`<test name exactly as printed>`** — CONTRACT §x.y: "<sentence>". The agent did: <observed status / header / body / behaviour>. Read two ways? no | yes → I would write: "<new wording>".

## 3. Sentences that could be read two ways

<filled in phase 6 with ia3-ambiguity>

## 4. Findings about the tests or the contract

- <optional>

## 5. Prediction outcomes

- <filled in phase 6>
```

Ask the human for student ID and name if they are not known yet; never invent them.

## Phase 1 — The two predictions

Read `CONTRACT.md` only. Do not read `src/` or any earlier work yet. Choose exactly two sentences that you, as an AI agent implementing this contract, are most likely to get wrong.

Good candidates have behaviour that can be checked and a tempting shortcut. Typical places where agent implementations slip:

- exactness words (only, exactly, every, never, if and only if) that an implementation satisfies in the common case but not at the edge;
- what "equal", "same" or "valid" means when a quick comparison would be easier;
- the order in which several problems are reported or checked;
- error paths: what is returned, which headers and which fields are present, what must not leak;
- state that must outlive one request or be shared by several server processes;
- steps that must happen together or not at all;
- defaults, bounds, and what happens just outside them;
- behaviour that must stay unchanged in old code while new rules are added next to it.

Rules for the two entries:

- Different sections, different kinds of risk. Not both about the same mechanism.
- Quote the sentence verbatim and give its section. Verify the quote: `grep -F "<sentence>" CONTRACT.md` must match.
- The reason names the concrete wrong behaviour you expect ("it would check only the first element of a list, so a bad second element passes"), not a feeling ("this is complicated").
- Write the reason from how an implementation typically goes wrong, before any code exists.

Create `NOTES.md` with the template and §1 filled. Gate G1: show both predictions, ask "approve, or anything to change or drop?", accept replacements, record the answer in the AI-LOG entry. After approval commit `NOTES.md` and `AI-LOG.md` with `docs(notes): predictions made before the agent runs`. Never edit §1 afterwards; outcomes go in §5.

## Phase 4 — Explain run 1 (before any fix)

Input: the failing tests in `contract-run-1.txt` (the list after `✖ failing tests:`).

For each failed test write one bullet in §2, in this order:

1. the test name exactly as printed;
2. the sentence of the contract it checks, quoted, with its section;
3. what the agent did instead, as observable behaviour: status, header, body, or what the code does, naming the function or branch;
4. "Read two ways?": no, or yes with the new wording you would put in the contract (a full sentence in the contract's style).

Find out what the agent really did, not what the test name suggests:

- the failure message in the output (actual vs expected values are fine to use);
- `git show ia3-first-attempt:src/v1.js` (and `src/app.js`, the migration);
- optionally confirm by running the first-attempt code: `git worktree add ../ia3-first ia3-first-attempt`, start it with `DB_PATH` set to a temp file, send the request, then `git worktree remove ../ia3-first`.

Quality bar: each line must teach something a reader could not get from the test name. "Fails the pagination test" is not a line; "The agent rounded the total in the handler, so the stored value and the returned value differ" is the kind of line that teaches something.

Several tests with one root cause each still get their own line; the later lines may be short but must still name the behaviour.

Check the count before the gate:

```bash
FAIL=$(grep -m1 '^ℹ fail' contract-run-1.txt | awk '{print $3}')
LINES=$(awk '/^## 2\./{f=1;next} /^## 3\./{f=0} f && /^- \*\*`/{n++} END{print n+0}' NOTES.md)
echo "failed=$FAIL lines=$LINES"    # must be equal
```

If run 1 passed 29/29, write only "The agent passed 29/29 on the first attempt." in §2. Criterion 4 is then scored on three points the agent guessed at; those are written in §3 with `ia3-ambiguity`.

Gate G4: show the lines, ask "approve, or anything to change or drop?". The human decides the proposed contract wordings. Commit `NOTES.md` together with the AI-LOG entries of phases 3 and 4: `docs(notes): explain failures of run 1`.

## §4 — Findings

Used by `ia3-fix` when a test or the contract looks wrong: one bullet with the test name, the section, what looks wrong and why. No claim that it is wrong unless you can point at the sentences that conflict.

## Phase 6 — Prediction outcomes (§5)

One line per prediction, judged against **run 1**, not later runs:

```md
- P1 — came true | did not — <failing test name in run 1, or "passed in run 1">
```

"Came true" means the first attempt got that sentence wrong: shown by a failing test, or, if no test failed, by what the first-attempt code does (say which). "Did not" means the first attempt handled it correctly. Add a few words on why when the outcome is surprising.

Commit §3 and §5 together as `docs(notes): ambiguities and prediction outcomes` (see `ia3-ambiguity`).
