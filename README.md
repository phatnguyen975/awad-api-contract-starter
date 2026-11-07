# IA#3 — Contract-based menu and order API

This repository implements the versioned `/v1` API specified in [CONTRACT.md](CONTRACT.md), alongside the preserved legacy `/menu` API. The assignment brief and rubric are in [docs/ia3-requirements.md](docs/ia3-requirements.md).

## Requirements

Use Node.js 22.13 or later. The service uses Node built-ins, including `node:sqlite`; no package installation or external dependencies are required.

## Run the service

On a fresh database:

```sh
npm run migrate
npm run seed
npm start
```

The default port is 3001; `PORT` changes it. `DB_PATH` selects a different SQLite file. Seed once for a fresh database: the seed command adds 200 menu items. Migration SQL is applied transactionally, and `npm run migrate:down` reverts only the last applied migration.

On Windows PowerShell, use `npm.cmd` in place of `npm` if execution policy blocks npm.ps1. The migration runner uses `fileURLToPath` to resolve its directory on Windows, Linux and macOS.

## Verify

These commands verify the completed implementation. When following the assignment from the starter, preserve the phase gates and first-run timing in AGENTS.md rather than running contract tests early.

```sh
npm test
npm run contract
```

The verified Linux environment is Node v22.23.4. Both a clean-clone run and the final verification run passed legacy 3/3 and contract 29/29. The final capture itself contains only contract-test output; legacy results are documented in [SELF_ASSESSMENT_REPORT.md](SELF_ASSESSMENT_REPORT.md).

The original Windows run passed 27 contract tests and cancelled two during multi-instance setup. A standalone child-process diagnostic found a direct npm launch returning ENOENT on Windows. The same implementation passed both multi-instance tests on Linux; no test source was edited.

To reproduce verification in Linux from a read-only repository with a temporary database, use Docker. This command also works from PowerShell:

```powershell
docker run --rm --network none --mount "type=bind,source=$($PWD.Path),target=/work,readonly" --workdir /work --env DB_PATH=/tmp/ia3-verify.db node:22-bookworm-slim sh -c "npm run migrate && npm run seed && npm test && npm run contract"
```

For a POSIX shell:

```sh
docker run --rm --network none --mount "type=bind,source=$(pwd),target=/work,readonly" --workdir /work --env DB_PATH=/tmp/ia3-verify.db node:22-bookworm-slim sh -c "npm run migrate && npm run seed && npm test && npm run contract"
```

Verification used image digest `sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d`. A new container supplies a fresh temporary database. Existing run captures are historical evidence; keep subsequent verification output separate.

## Implementation

| Path | Role |
| --- | --- |
| `src/v1.js` | Menu/order routes, problem details, validation, idempotency and cursor pagination |
| `src/app.js` | Legacy behavior and retirement/successor headers, plus dispatch to `/v1` |
| `migrations/001_init.*.sql` | Starter menu, order and order-line schema |
| `migrations/002_v1_state.*.sql` | One reversible pair for saved responses, in-flight claims and cursor state |
| `scripts/migrate.js` | Migration runner with native URL-to-path conversion |

`/v1` prices and totals use integer dong. Legacy `price` remains in thousands of dong. Completed orders retain their line order and price snapshots. Successful idempotency responses and cursor state are stored in SQLite so they work across instances. In-flight claims have no automatic crash expiry; the adopted clarification and other decisions are recorded in NOTES.md.

## Evidence and submission

| Evidence | Location |
| --- | --- |
| Predictions, first-run explanations, ambiguities and outcomes | [NOTES.md](NOTES.md) |
| Prompts, reviews, changes and assistant attribution | [AI-LOG.md](AI-LOG.md) |
| Original first attempt: 27 pass, 0 fail, 2 cancelled on Windows | [contract-run-1.txt](contract-run-1.txt), commit `c6a383d` |
| Final contract run: 29 pass, 0 fail, 0 cancelled on Linux | [contract-run-final.txt](contract-run-final.txt), commit `06f8e43` |
| Current score claim and its evidence | [SELF_ASSESSMENT_REPORT.md](SELF_ASSESSMENT_REPORT.md) |

Predictions were committed at `5ec00af` before the first implementation at `b92fcf1`, tagged `ia3-first-attempt`. No application or migration-runner code changed after that attempt. The Git history preserves the captures and subsequent documentation decisions; it has not been rewritten.

The submission archive must include `.git` and the required deliverables, and exclude `data/`, `node_modules/` and `.agents/scratch/`. Tests, CONTRACT.md and package.json remain unchanged from `ia3-starter`. The original starter README remains available with `git show ia3-starter:README.md`.
