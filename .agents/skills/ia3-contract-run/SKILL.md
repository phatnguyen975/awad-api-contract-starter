---
name: ia3-contract-run
description: Capture the official contract-test runs for the IA#3 assignment — contract-run-1.txt (the agent's first attempt, before any fix) and contract-run-final.txt (after the last fix). Use whenever the current phase is "run 1" or "final run", when the human asks to run, save or re-run the contract tests, or before anyone runs `npm run contract` for the first time in this repo. Covers the exact command, one-shot rule for run 1, UTF-8 capture on any OS, verification of the output, and the commit.
---

# ia3-contract-run — capturing the two official runs

The two files are evidence. `contract-run-1.txt` must show the first attempt as it was, so it is created **once**, never edited, never re-run. `contract-run-final.txt` must show the state of the code the grader will run.

Examples use bash. Detect the shell and run the equivalent; on Windows prefer Git Bash or WSL, otherwise use the fallback in section 3.

## 1. Run 1 (phase 3)

**Preconditions** — if one is false, stop and tell the human:

- Current phase is 3; tag `ia3-first-attempt` exists; `git status --short` is clean.
- `contract-run-1.txt` does not exist (tracked or not).
- Nobody has run `npm run contract` earlier in this assignment. If you ran it or are unsure, say so now (see `ia3-workflow` §7).
- `node --version` is 22.13 or newer.

**Command**, exactly once:

```bash
npm run contract 2>&1 | tee contract-run-1.txt
```

Do not run it twice "to be safe", do not use `tee -a`, do not filter or edit the output (the file contains local paths and warnings; leave them).

**If the run does not produce the summary lines** (`ℹ tests`, `ℹ pass`, `ℹ fail`):

- Environment problem (wrong Node, missing npm, command not found): fix the environment, delete the unusable file, run again. This does not change the attempt. Tell the human.
- The attempt itself crashes (import error, syntax error, server never starts): that output _is_ the first attempt. Keep it, commit it, tell the human.

## 2. Verify the file, then commit

Check that the file is plain UTF-8 and read the summary (portable, works in any shell that has Node):

```bash
node -e "const b=require('fs').readFileSync(process.argv[1]);const t=b.toString('utf8');const bad=b.includes(0)||(b[0]===0xEF&&b[1]===0xBB)||b[0]===0xFF||b[0]===0xFE;const g=k=>(t.match(new RegExp('^ℹ '+k+' (\\\\d+)','m'))||[])[1];console.log({bad,tests:g('tests'),pass:g('pass'),fail:g('fail')})" contract-run-1.txt
```

`bad` must be `false` (UTF-16 or a BOM means the capture went wrong; redo it with the section 3 fallback), and `tests` must be 29. The names of the failed tests are listed once more after the line `✖ failing tests:`; this extracts them and the count must equal `fail`:

```bash
awk '/^✖ failing tests:/{f=1;next} f && /^✖ /{print}' contract-run-1.txt | sed 's/ ([0-9.]*ms)$//' | sort -u
```

Tell the human "run 1: N/29 pass" and list the failed names. Then commit only this file:

```bash
git add contract-run-1.txt
git commit -m "test(run1): contract-run-1.txt — first attempt, N/29"
```

No gate follows. Its AI-LOG entry goes into the next commit (phase 4). If N is 29, say so: phase 4 then only records that fact (`ia3-workflow` §3).

## 3. Capture without bash (Windows fallback)

Windows PowerShell 5.1 turns stderr lines into error records and `Tee-Object` writes UTF-16, so the `2>&1 | tee` form can produce a bad file. Let `cmd` write the bytes Node produced, then show the file:

```bat
cmd /c "npm run contract > contract-run-1.txt 2>&1"
type contract-run-1.txt
```

The same applies to the final run with the other file name. Always run the section 2 verification afterwards.

## 4. Final run (end of phase 5)

**Preconditions:** every fix is committed; `git status --short` shows nothing for `src/` and `migrations/`; the last `npm run contract` during fixing showed 29/29 and `npm test` showed 3/3.

Start from a clean database so the result matches what the grader will do:

```bash
rm -rf data                 # PowerShell: Remove-Item -Recurse -Force data
npm run migrate
npm run seed
npm test                    # legacy must be 3 of 3
npm run contract 2>&1 | tee contract-run-final.txt
```

Verify the file as in section 2: `bad` false, `tests` 29, `pass` 29, `fail` 0. If it is not 29/29, this is not the final run: delete the file and go back to `ia3-fix`.

Commit only this file:

```bash
git add contract-run-final.txt
git commit -m "test(run-final): contract-run-final.txt 29/29"
```

If `src/` or `migrations/` change after this commit, repeat this section and commit the new capture as `test(run-final): re-capture after <reason>`. Its AI-LOG entry goes into the next commit.
