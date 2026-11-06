# NOTES — IA#3

**Student:** 23127449 — Nguyễn Tấn Phát

The predictions below were drafted by the implementing agent before reading any source or test code. At G1, the human read and approved both predictions and explained the expected failure mechanism for each.

## 1. Predictions

| # | CONTRACT.md sentence | § | Why I expect the agent to get it wrong |
| --- | --- | --- | --- |
| P1 | "**Only a `201` is stored.**" | §4.2 — Idempotency | I expect the agent to reserve an idempotency key before validation and leave that reservation or an error response stored after a 4xx. A corrected request using the same key would then be rejected or replay the earlier error instead of being allowed to create an order. |
| P2 | "A client never receives a cursor that leads to an empty page." | §4.4 — List orders | I expect the agent to return a cursor whenever a page contains exactly `limit` orders, without checking whether another matching order exists. If the final page has exactly `limit` orders, following that cursor would return an empty page. |

## 2. First run — failures in contract-run-1.txt

Not run yet. No test results or implementation behavior have been observed.

## 3. Sentences that could be read two ways

To be filled in phase 6 after the human asks the ambiguity question.

## 4. Findings about the tests or the contract

No findings recorded in this phase.

## 5. Prediction outcomes

To be evaluated against the first attempt in phase 6; neither outcome is known yet.
