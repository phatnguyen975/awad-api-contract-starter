# AI-LOG.md — IA#3

## 2026-11-07 — Phase 1: Predictions

```
Tool: Codex (GPT-6)
Prompt: Go. Start phase 1 with the ia3-notes skill: read CONTRACT.md only (not src/ or test/), choose your two predictions, create NOTES.md and stop at gate G1.
Asked for: Draft two predictions from the contract, create NOTES.md, and stop for human review before committing.
Kept: The agent drafted P1 about retaining an idempotency key after a 4xx (§4.2) and P2 about a cursor leading to an empty page (§4.4). Both quoted sentences were verified directly against CONTRACT.md. NOTES.md includes all five section headings.
Changed: G1 was approved without changes to the prediction content. Updated the pending-review statement in NOTES.md to record approval. No source files or tests were read, and no test commands were run.
Rejected: Nothing rejected in this step.
By hand: The human authorized phase 1, supplied the task prompt and student details, and read and approved both predictions at G1. The human explained that retaining a key after a 4xx can block a corrected request, and that a full page does not prove another matching order exists. Student details are recorded in NOTES.md, not repeated in this log.
```

G1 response (verbatim):

> Approved. I read both predictions and I can explain them: P1 because the agent may reserve or persist an idempotency key before validation and fail to release it after a 4xx response, preventing a corrected request from succeeding with the same key. P2 because the agent may return a cursor whenever the current page contains exactly `limit` orders without checking whether more matching orders actually exist, resulting in a cursor that leads to an empty page.
