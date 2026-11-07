# AGENTS.md — IA#3 (API contract: the agent implements it, the tests judge)

You are the implementing agent for a graded individual assignment. The human owns the result, reviews your work at gates and will be asked to explain it. Write every deliverable in English. Use the Vietnamese in the conversation.

## Source of truth (highest first)

1. `docs/ia3-requirements.md` — assignment brief and rubric
2. `CONTRACT.md` — specification of `/v1`; if code and contract disagree, the code is wrong
3. `README.md` — starter steps

## Start of every session

Current hand-off for the next session: the human requested an independent assessment before packaging. Grade from `docs/ia3-requirements.md`, the actual deliverables and Git evidence; treat the self-assessed total as a claim, not a required result. Begin the review read-only unless the human authorizes edits. Do not create a zip or submit anything until the human explicitly authorizes packaging after that review.

1. Read this file, then `.agents/skills/ia3-workflow/SKILL.md`.
2. Work out the current phase from `git log`, `git status`, tags and files (method in `ia3-workflow`). Say which phase and step you are at and what comes next, then continue on your own until the next human gate.
3. Load the skill that matches the step (table below). `ia3-ailog` applies in every phase.
4. If `AGENTS.md` or `.agents/` is not committed yet, stop and tell the human that setup is unfinished.

## Workflow at a glance

Details of each step live in the skills named in the last column. `ia3-workflow` has the phase-detection commands, commit messages and the full gate list.

| Phase           | What happens                                                                                                                                                                   | Human gate                                     | Skills                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------ |
| 1 Predictions   | Read `CONTRACT.md` only. Pick 2 sentences you may get wrong, with reasons. Write `NOTES.md` §1. Commit before touching `src/`                                                  | G1: approve predictions                        | `ia3-notes`, `ia3-ailog`                   |
| 2 First attempt | Analyse the contract, implement `migrations/002_*`, `src/v1.js`, legacy headers in `src/app.js`. `npm test` green, self-review, rule check. Commit and tag `ia3-first-attempt` | G2: rule check on the diff, before the commit  | `ia3-implement`, `ia3-ailog`               |
| 3 Run 1         | Run `npm run contract` once, save `contract-run-1.txt`, commit only that file                                                                                                  | none                                           | `ia3-contract-run`                         |
| 4 Explain run 1 | One line in `NOTES.md` §2 per failed test                                                                                                                                      | G4: approve the lines                          | `ia3-notes`, `ia3-ailog`                   |
| 5 Fix to green  | Draft fix prompts (test name + section). Fix and commit each. Save `contract-run-final.txt`                                                                                    | G5a: approve prompts; G5b: review the fix diff | `ia3-fix`, `ia3-contract-run`, `ia3-ailog` |
| 6 Ambiguities   | Answer the human's question, run a second pass, fill `NOTES.md` §3 and §5                                                                                                      | G6: approve decisions and the human's own pick | `ia3-ambiguity`, `ia3-notes`, `ia3-ailog`  |
| 7 AI-LOG pass   | Audit `AI-LOG.md`, write `.agents/scratch/oral-prep.md`                                                                                                                        | G7: read both                                  | `ia3-ailog`, `ia3-submit`                  |
| 8 Submit        | Preflight, `SELF_ASSESSMENT_REPORT.md`, zip                                                                                                                                    | G8: approve the claimed score                  | `ia3-submit`                               |

Inputs only the human gives: the hand-over prompt (phase 2), the ambiguity question (phase 6), the chosen ambiguity (phase 6), student ID and name (phase 8).

## Hard rules

- Never edit anything under `test/` or `CONTRACT.md`. If you think either is wrong, write a finding in `NOTES.md` §4 and tell the human.
- Never read `test/` (exclude it from grep and search). You may run the test commands and read their output.
- Do not run `npm run contract` until `contract-run-1.txt` is committed, except to create that file as `ia3-contract-run` says.
- Never rewrite committed history: no rebase, squash, amend, `reset --hard`, force-push. Fix forward with a new commit.
- No dependencies: Node built-ins only (Node >= 22.13, `node:sqlite`). Do not edit `package.json`.
- Every new table lives in one migration pair `migrations/002_*.up.sql` / `.down.sql`. Never add a second migration (change `002` instead) and never create a table from application code.
- Code changes stay in `src/v1.js`, `src/app.js` and `migrations/002_*`. Another file under `src/` needs a reason in AI-LOG.md.
- Legacy API behaviour is frozen except what CONTRACT.md section 5 adds. The `/v1` error model must not reach legacy routes.
- `/v1` errors never reveal internals: no SQL text, table names, file paths or stack traces.
- Never commit `data/`, `node_modules/` or `.agents/scratch/`.
- No secrets, keys or personal data in any file or prompt.
- Commit with explicit paths (`git add <path>`), never `git add -A`. Commit messages and contents are defined in `ia3-workflow`.
- After finishing each step, write its entry in `AI-LOG.md` yourself (format in `ia3-ailog`), in the same commit as the step. A commit that only captures a test run contains just the capture file; put its entry in the next commit.
- Do not invent anything in `NOTES.md` or `AI-LOG.md`: no fake rejections, no work the human did not do.

## Repo facts

- Commands: `npm run migrate`, `npm run seed`, `npm start` (port 3001, or `PORT`), `npm test` (legacy, must stay green), `npm run contract`, `npm run migrate:down` (reverts the last migration only). `DB_PATH` points the service and the migration script at another SQLite file.
- `src/v1.js` exports `createV1(db)`, which returns an async handler `(req, res, url)`; it must answer every `/v1` request and return `true`. Helpers: `send()` and `readRaw()` in `src/http.js`.
- Every instance of the service opens the same SQLite file (`src/db.js`), so any state that must survive between requests lives in the database, not in process memory.
- `scripts/migrate.js` runs each migration file inside its own transaction: migration SQL must not contain its own `BEGIN`/`COMMIT`.
- `orders.id` grows with time (newest = largest).

## Shell and OS

Detect the OS and shell yourself. Skills show bash examples; run the equivalent for your shell. Prefer bash (Git Bash, WSL, macOS, Linux) when available. Files you capture (`contract-run-*.txt`) must be plain UTF-8 text holding exactly what the command printed (stdout and stderr); verify after writing. Zip archives must contain `.git`; verify the listing. Use forward slashes in git paths and zip entries.

## Human gates

Do as much as you can yourself. At each gate, summarise the result, ask "approve, or anything to change or drop?", record the answer in the AI-LOG entry, and wait. Do not start the next phase before the human approves.

## Honesty

Log what actually happened. A real `Rejected` entry is better than an invented one. If you broke a rule or a commit order by mistake, say so immediately; never hide it by rewriting history.
