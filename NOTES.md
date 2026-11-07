# NOTES — IA#3

**Student:** 23127449 — Nguyễn Tấn Phát

The predictions below were drafted by the implementing agent before reading any source or test code. At G1, the human read and approved both predictions and explained the expected failure mechanism for each.

## 1. Predictions

| # | CONTRACT.md sentence | § | Why I expect the agent to get it wrong |
| --- | --- | --- | --- |
| P1 | "**Only a `201` is stored.**" | §4.2 — Idempotency | I expect the agent to reserve an idempotency key before validation and leave that reservation or an error response stored after a 4xx. A corrected request using the same key would then be rejected or replay the earlier error instead of being allowed to create an order. |
| P2 | "A client never receives a cursor that leads to an empty page." | §4.4 — List orders | I expect the agent to return a cursor whenever a page contains exactly `limit` orders, without checking whether another matching order exists. If the final page has exactly `limit` orders, following that cursor would return an empty page. |

## 2. First run — failures in contract-run-1.txt

First attempt: legacy 3/3; contract 27/29 passed, 0 failed, 2 cancelled. Implementation: `b92fcf1` (`ia3-first-attempt`). The unmodified first-run capture is committed as `c6a383d`.

Both cancelled tests are listed below because neither completed. The parent suite's setup reported `npm run migrate failed: undefined` with a null process status; this is not evidence of two incorrect HTTP responses. There are two test entries despite the summary's `fail 0`, because it separately reports `cancelled 2`.

- **`§4.2 a retry that lands on the other instance is still a replay`** — CONTRACT §4.2: "Same key, same body → the **stored** response: status `201`, the identical body, the same `Location`, plus the header **`Idempotent-Replayed: true`**." The agent did: in the tagged implementation, `priorRequest` reads the saved fingerprint, status, body and Location from SQLite, and `placeOrder` replays that saved response. In run 1, suite setup stopped at the migration subprocess, so this test was cancelled before exercising the second instance; no HTTP outcome was observed. Read two ways? no; I would not change the contract wording to address this setup failure.
- **`§4.4 a cursor from one instance works on the other`** — CONTRACT §4.4: "A cursor is **opaque**: the client stores it and sends it back unchanged, and never builds one." The agent did: in the tagged implementation, `listOrders` stores each random token and its snapshot, boundary and table filter in SQLite and resolves incoming tokens from that same database. In run 1, the same parent-suite setup failure cancelled this test before another instance used the cursor; no HTTP outcome was observed. Read two ways? no; I would not change the contract wording to address this setup failure.

## 3. Sentences that could be read two ways

To be filled in phase 6 after the human asks the ambiguity question.

## 4. Findings about the tests or the contract

- Run 1: the suite `§4 two instances, one database (as in session 4)` stopped during setup with `npm run migrate failed: undefined` and a null process status; its two tests were cancelled. A separate Node child-process diagnostic on Windows found that invoking npm directly returns status null with ENOENT, while invoking npm through cmd succeeds. This is consistent with an npm-launch compatibility issue, but I have not read the test source and cannot confirm the suite's exact invocation. The repository migration runner itself already passed direct up/down/up after the authorized fileURLToPath fix. I would investigate the execution environment before changing /v1 behavior. Neither test/ nor CONTRACT.md was edited, and run 1 was not repeated or replaced.

## 5. Prediction outcomes

To be evaluated against the first attempt in phase 6; neither outcome is known yet.
