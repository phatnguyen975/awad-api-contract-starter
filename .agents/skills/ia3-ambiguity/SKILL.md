---
name: ia3-ambiguity
description: Phase 6 of the IA#3 assignment — find and decide the sentences of CONTRACT.md that could be read two ways, and write NOTES.md §3. Use when the human pastes the question "Which sentences of CONTRACT.md could be read two ways, and what did you choose for each?", when the current phase is "ambiguities", when the first run passed 29/29 and three guessed points must be explained, or whenever you must propose new wording for the contract. Covers answering the question, structuring each point, a second independent pass for points outside your first list, honest "Found by" labels, and gate G6.
---

# ia3-ambiguity — what the tests did not settle

A green run only means the tests found nothing. This phase finds the places where two reasonable implementations would behave differently and the contract does not say which is right, then decides each one and proposes the sentence that would settle it. `CONTRACT.md` itself is never edited: the proposal lives in `NOTES.md`.

## Preconditions

- Current phase is 6 (`ia3-workflow`); `contract-run-final.txt` is committed with 29/29.
- The human has pasted the question. If not, ask them to paste it; their message is the prompt to log. Their exact words are: "Which sentences of CONTRACT.md could be read two ways, and what did you choose for each?"
- You have `.agents/scratch/assumptions.md` from phase 2. If it is missing, rebuild the list from the code and the contract and say that you did.

## What counts as an ambiguity

Two readings of one sentence (or of a silence) that lead to **different observable behaviour**: another status, header, body, stored state, or result under concurrency. Style preferences and wording nits do not count. Before you list a point, search the whole contract (`grep -n` for the key words): if another sentence already settles it, it is not an ambiguity.

## Step 1 — Answer the question

Answer from `assumptions.md`, your final code and a fresh reading of the contract. Be complete and honest, including choices you made silently. Save your answer to the human **verbatim** under "Agent's answer" in `NOTES.md` §3.

Then turn each point of your answer into a block:

```md
### A1 — §x.y "<quoted sentence, or: the contract is silent about …>"

- Found by: agent
- Reading 1: <behaviour>
- Reading 2: <behaviour>
- Agent chose: <reading> (what the code does)
- My decision: <reading> — because <reason>
- Sentence to add to CONTRACT.md: "<concrete, testable sentence in the contract's style>"
```

Rules for the blocks:

- The proposed sentence names concrete values (status, header, field, number) so a test could check it. "Clarify the behaviour" is not a sentence.
- Draft "My decision" yourself: prefer the reading most consistent with other sections and with legacy clients, and say why. The human approves or overrides at G6.
- If the decision differs from what the code does, say so: it needs a `fix(v1)` commit and a new final capture (`ia3-workflow` §3, §5).

## Step 2 — Second pass for points outside your list

Run a separate, deliberate pass to find points **not in step 1**. Do not reuse your list. Methods:

1. **Untested sentences.** List the test names that passed and put them beside the contract sentences; sentences without a matching test name are where gaps hide:

   ```bash
   grep -E '^\s+✔ ' contract-run-final.txt | sed -E 's/^\s+✔ //; s/ \([0-9.]+ms\)$//'
   ```

2. **Two implementations.** For each constraining sentence ask: could two sensible implementations differ in status, header, body or stored state?
3. **Input sweep.** Boundaries, types, empty or missing parts, duplicates, ordering of checks, unknown paths or methods, repeated parameters, concurrency, time and retention.
4. **Interactions.** Two sections that both apply to one request.
5. **Silences.** Cases your code had to decide although the contract says nothing.

You still never read `test/`; test names from the run output are enough.

Offer 3 to 5 candidates, each with its two readings, what the code currently does, and a proposed sentence, in the same block format with `Found by:` left open.

## Step 3 — The human picks

Discovery and review are different evidence. A candidate generated in this second pass is still agent-originated, even if it was absent from the first answer. The assignment brief's top band requires at least one point found by the human that the agent did not list. Selecting, checking and adopting a suggested point is useful human work, but does not by itself prove independent discovery. Do not change the actual provenance to satisfy that requirement.

The human chooses at least one candidate (or names one of their own), checks it against `CONTRACT.md` themselves, and gives a reason in their own words. Then:

- Put the human's reason into "My decision" as they wrote it. For an agent-suggested point, identify its agent origin and the human's selection/check separately. An existing `Found by: me` selection/check label must retain an explicit explanation of the candidate's agent origin and must not be counted as proof of independent human discovery. Use an unqualified `Found by: me` discovery label only for a point actually supplied by the human outside the agent's lists.
- In `AI-LOG.md` record where the point came from (your second pass, or the human) and what the human did (checked it, wrote the reason). Do not hide the second pass; do not exaggerate the human's part.
- Never credit the human with discovery or checking they did not perform. If no independently human-found point is supplied, state the remaining criterion-5 limitation at the gate rather than treating the second-pass selection as an automatic top-band result.

If the human names a point of their own, verify it against the contract and the code, then draft the two readings and the sentence for them.

## Step 4 — Gate G6

Show all blocks. Ask "approve, or anything to change or drop?". Check together:

- every block has all five fields, a concrete proposed sentence, and a quoted section;
- discovery provenance is explicit, and any claim to the rubric's top band includes at least one human-found point not supplied by the agent;
- nothing is "no ambiguities".

Record the answers in the AI-LOG entry.

## Step 5 — Outcomes and commit

Fill `NOTES.md` §5 with `ia3-notes` (one line per prediction, judged against run 1). Write the AI-LOG entries for phase 6, including the final-run capture of phase 5. Commit `NOTES.md` and `AI-LOG.md`:

```
docs(notes): ambiguities and prediction outcomes
```

## If run 1 passed 29/29

Criterion 4 is then scored on this list. Choose the three points of step 1 where your code had a real choice (rows of `assumptions.md` with two readings). For each, also write a §2-style line: contract sentence, what the agent did, and the wording you would change it to. Put these three blocks first in §3 and add the sentence "Run 1 passed 29/29; see §3 A1–A3." to §2.
