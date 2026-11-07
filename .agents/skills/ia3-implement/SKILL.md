---
name: ia3-implement
description: Phase 2 of the IA#3 assignment — write the agent's first attempt at the /v1 API from CONTRACT.md (migrations/002_*, src/v1.js, legacy headers in src/app.js). Use when the human hands over the implementation prompt, when the current phase is "first attempt", or whenever you must analyse CONTRACT.md before coding. Covers how to analyse the contract, what to record while you work, which files you may touch, how to check your work without running the contract tests, and the rule check before the commit.
---

# ia3-implement — the first attempt

The first attempt is graded as evidence: `contract-run-1.txt` will show what this attempt does on its own. Do your honest best. Do not hold anything back to create failures, and do not peek at the tests to avoid them.

## Preconditions (stop and tell the human if any is false)

- Current phase is 2 (see `ia3-workflow`); the predictions commit exists; no commit has changed `src/` yet; `git status` is clean.
- The human has pasted the hand-over prompt. Copy it verbatim into the AI-LOG entry.
- Tag `ia3-starter` exists.

## Forbidden in this phase

- Running `npm run contract` or other files under `test/`, except the explicitly required `npm test` legacy command; reading `test/` is always forbidden (exclude it from grep and search).
- Editing `CONTRACT.md`, `test/`, `package.json`; adding dependencies.
- Creating tables from application code.
- Committing before gate G2.

## Step 1 — Analyse the contract

Read `CONTRACT.md` completely, then read the code you will touch: `src/app.js`, `src/v1.js`, `src/http.js`, `src/db.js`, `scripts/migrate.js`, `migrations/001_init.up.sql`. The contract is the spec; the code is wrong when they differ.

Build a checklist of every sentence that constrains behaviour (wording such as must, always, never, only, exactly, at most, default). Do not paraphrase loosely: keep the sentence and its section number. Then walk each endpoint and rule through these questions so nothing is missed:

- **Inputs:** which path, query, header and body parts exist; which are required, optional, bounded, typed?
- **Order of checks:** if several things are wrong at once, which error wins? Is the order stated?
- **Outputs:** for every outcome, the status, headers and body shape; which fields are exact and which are free?
- **Errors:** the error format and the allowed error codes; what each code is for; which fields must be listed together.
- **State:** what is stored, when it is written, what must be atomic, what must survive between requests.
- **Concurrency and instances:** can two requests, or two server processes sharing one database file, hit the same thing at once?
- **Time and size limits:** retention, maximum lengths, ranges, defaults.
- **Legacy:** what section 5 adds to the old API and what must stay exactly as it is, including error responses and unmatched routes.
- **Leaks:** what must never appear in an error response.

Also note repo constraints from the code: how handlers are wired, how migrations are applied (each file runs inside its own transaction), that every instance opens the same SQLite file, and what the legacy code already does.

## Step 2 — Record every choice you make

Create `.agents/scratch/assumptions.md` (it is gitignored). Whenever the contract allows more than one reading, or says nothing about a case you must still handle, add a row:

| §   | Sentence (quoted, or "silent") | Reading A | Reading B | I chose | Why |
| --- | ------------------------------ | --------- | --------- | ------- | --- |

Be honest and complete: this file is the source for the ambiguity question in phase 6, and it feeds the `Rejected` line of the AI-LOG. When two readings fit, choose the one most consistent with the other sections and with what existing legacy clients rely on, and say so.

Keep a second list in the same file, "Considered and dropped": designs or code you wrote or planned and then discarded, with the reason.

## Step 3 — Plan, briefly

Before coding, write a short plan in the conversation: the pieces you will build (routing, error builder, validation, idempotency storage, pagination, legacy headers), the schema you need, and which checklist rows each piece covers. Choose the simplest schema that satisfies the state and concurrency rows of your checklist.

## Step 4 — Implement within the allowed files

Allowed: `migrations/002_*.up.sql`, `migrations/002_*.down.sql` (exactly one pair), `src/v1.js`, `src/app.js`. Another file under `src/` needs a reason, which goes into the AI-LOG entry.

- The `down` file must undo everything the `up` file creates.
- Migration SQL must not contain `BEGIN` or `COMMIT`; the migration runner wraps it.
- Keep legacy behaviour frozen except what section 5 adds. The new error format must not leak onto legacy routes.
- Keep responses free of internals (no SQL text, table names, paths, stack traces).
- Write code a student can read and explain: small functions, comments that cite the contract section.

## Step 5 — Check your own work without the contract tests

- `npm run migrate` on a throw-away database: set `DB_PATH` to a temp file so `data/app.db` stays untouched.
- `npm test` must be green (legacy). Fix any breakage; it is part of the attempt.
- Optionally start the server (`npm start`, port from `PORT`, default 3001) and send a few requests with curl or a Node one-liner to see the main paths. Do not commit scripts you write for this, and do not add test files.
- Round trip: `npm run migrate`, `npm run migrate:down`, `npm run migrate` must all succeed.

## Step 6 — One self-review pass

Re-read your diff against the checklist from step 1, row by row. Fix what you find. Note in the AI-LOG entry what you changed or dropped in this pass (that is real `Changed` / `Rejected` material). Do not run the contract tests, even to confirm. One pass only.

## Step 7 — Rule check (before the gate)

```bash
git diff ia3-starter --stat -- test CONTRACT.md package.json   # must print nothing
ls migrations/002_*                                            # exactly one .up.sql and one .down.sql
grep -rn "CREATE TABLE" src/                                   # must find nothing
git status --short                                             # only allowed files (+ AI-LOG.md)
```

Show the output to the human.

## Step 8 — Gate G2, then commit

Summarise what you built (the pieces, the schema, the main choices from `assumptions.md`) and the rule-check output. Ask "approve, or anything to change or drop?". Fix rule violations in the working tree. Record the answer in the AI-LOG entry.

After approval, write the AI-LOG entry (`ia3-ailog`), stage `migrations/002_*`, `src/v1.js`, `src/app.js` and `AI-LOG.md` explicitly, and commit:

```
feat(v1): agent first attempt
```

Then `git tag ia3-first-attempt`. Phase 3 has no gate: continue with `ia3-contract-run`.
