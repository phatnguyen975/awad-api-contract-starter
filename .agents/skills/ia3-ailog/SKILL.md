---
name: ia3-ailog
description: Keep AI-LOG.md for the IA#3 assignment — the honest account of what the agent was asked, what was kept, changed, rejected and done by hand. Use in EVERY phase right after finishing a step, whenever you are about to commit, when you write or edit AI-LOG.md, when a prompt was handed over (hand-over, fix prompts, the ambiguity question), when the human answers at a gate, and during the final audit in phase 7. Covers entry format, required entries, what goes into Rejected and By hand, and the audit checklist.
---

# ia3-ailog — the AI-LOG.md

The log is graded (criterion 6) and is the place where AI use is declared. It must be short, specific and **true**. A real `Rejected` line is worth more than an invented one; an entry that says nothing checkable ("used AI, fixed things") is worth nothing. The human will be asked about anything in it.

`AI-LOG.md` records assignment work from phase 1 onward. If it is missing, create it with the heading `# AI-LOG.md — IA#3` and tell the human.

## When to write

Right after each step, before its commit, and **in the same commit** as the step. Exceptions: commits that only capture a test run (`contract-run-1.txt`, `contract-run-final.txt`) contain just that file, so their entries go into the next commit (phase 4 and phase 6).

One entry per phase, except phase 5: one entry per fix commit.

## Entry format

````md
## <YYYY-MM-DD> — <Phase N: what>

```
Tool: <agent name + model>
Prompt: <exactly what the human handed over; or, for a step you ran yourself, the instruction in one line>
Asked for: <the task, in one sentence>
Kept: <what you took as it came>
Changed: <what was rewritten, and why>
Rejected: <what was thrown away, and why>
By hand: <what the human did in this step>
```
````

Use today's date. If you do not know your own model name, ask the human once and reuse the answer.

Field rules:

- **Prompt.** Verbatim for what the human pasted (the hand-over prompt, the ambiguity question). Fix prompts are the approved list from `ia3-fix`: the test name and the contract section, marked "(agent-drafted, approved)". They never contain test code, assertion source or stack-trace lines; if the human pasted such text, log only the test name and section and tell the human that criterion 6 penalises it. Steps you start yourself (explaining run 1, second pass, audit) get a one-line statement of the instruction.
- **Kept / Changed.** Concrete: files, functions, rules. "Kept the cursor design; changed the error builder because it exposed internals" beats "some fixes".
- **Rejected.** Only things that really existed and were dropped, each with the reason. Sources: your "Considered and dropped" list in `.agents/scratch/assumptions.md`; code from the first attempt that a fix replaced; anything the human asked you to drop at a gate; anything you wanted to do and a rule stopped (for example, editing `CONTRACT.md`). If nothing was rejected in this step, write "Nothing rejected in this step."; never invent one.
- **By hand.** Only what the human did, taken from what they said or did at the gate: pasted the prompt, approved, edited X, chose a point, checked a sentence in the contract. If they only approved, write "reviewed and approved". Never credit the human with work they did not do, and never claim work for yourself that you did not do.

Entries are plain and short; three honest lines per field are enough. No secrets, API keys, real user data or other people's work, in the log or anywhere else.

## Entries the final log must contain

| Phase | Entry                                   | Must contain                                                                      |
| ----- | --------------------------------------- | --------------------------------------------------------------------------------- |
| 1     | Predictions                             | Who wrote them; what the human changed at G1                                      |
| 2     | First attempt                           | The hand-over prompt verbatim; what the self-review changed or dropped; G2 answer |
| 3     | Run 1                                   | The command, N/29 (written in the phase 4 commit)                                 |
| 4     | Explain run 1                           | G4 answer                                                                         |
| 5     | One per fix                             | The approved fix prompt; real `Changed` and `Rejected`                            |
| 5     | Final run                               | The command, 29/29, G5b answer (written in the phase 6 commit)                    |
| 6     | Ambiguities                             | The question verbatim; the second pass; which point the human chose and checked   |
| 7     | Final pass                              | What the audit corrected                                                          |
| 8     | Self-assessment                         | The claimed total and how it was derived                                          |

## Audit (phase 7)

Run these and fix what they reveal:

```bash
FIX=$(git log --format=%s | grep -c '^fix(v1)')
ENT=$(grep -c '^## .* — Phase 5: fix' AI-LOG.md)
echo "fix commits=$FIX entries=$ENT"                  # entries must be >= fix commits
grep -E '^Rejected: ' AI-LOG.md | grep -vci 'nothing rejected'   # must be >= 1
grep -n -iE 'assert\.|test\(|describe\(' AI-LOG.md     # must print nothing (no test code)
```

Then read the whole file once and check:

- every prompt that was handed over appears, verbatim where required;
- at least one `Rejected` is a real thing the agent wrote that was not kept, with its reason;
- `By hand` lines match what the human said at the gates;
- the order of entries follows the commit order;
- no secrets, no invented work.

Show the result at gate G7 ("approve, or anything to change?"), record the answer, and commit `AI-LOG.md` as `docs(ailog): final pass`.

## If you made a mistake

Log it in the entry of the step where it happened (what, when you noticed, what you did). Do not edit earlier entries to hide it, and do not rewrite history.
