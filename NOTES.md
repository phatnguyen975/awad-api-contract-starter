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

The following records the agent's original six-point answer and the human-approved decisions. At G6, the human approved A1–A6, replaced A5's proposed sentence without changing its decision, requested concrete proposed wording, and selected and checked B2 and B4 from the agent's separate second pass. The reasons and proposed sentences for B2 and B4 were drafted with Claude chat, then reviewed and adopted by the human; their wording is preserved below. All approved decisions match the existing code; no implementation change is required.

The §4.2 proposals retain the existing six-step precedence: key/header validation and JSON parsing still precede the step-3 in-flight/replay decision. B2 specifies two errors per non-object line, not a maximum of two errors for the entire request.

### Agent's answer — A1–A6

These are gaps or competing readings that affect observable behavior. I checked the whole contract before including them. I excluded raw-text JSON comparison, ignoring unknown fields when comparing complete JSON bodies, offset pagination that shifts pages, and issuing a cursor for a final full page: other sentences already settle those cases. Token storage format and indefinite retention beyond the stated minimum are implementation policies, not ambiguities by themselves.

#### A1 — §4.2: Content-Type failure behavior is unspecified

Context: "Request headers: `Content-Type: application/json` and **`Idempotency-Key`**"; the contract lists six checks but does not specify a media-type failure, its status or its place in that sequence.

- Found by: agent
- Reading 1: Reject a missing or non-JSON Content-Type even when the body contains valid JSON, choosing an additional rejection rule.
- Reading 2: Apply the six prescribed checks to the body regardless of Content-Type; the header describes the expected client request without specifying an additional server rejection.
- Agent chose: Reading 2. `readJson` parses the body without inspecting Content-Type, so a valid request with a new key can return 201 even if that header is absent or different.
- My decision: Reading 2 — I would keep the stated six-step precedence and avoid inventing an unspecified media-type error. The human approved this policy at G6; the original wording does not unambiguously settle it.
- Sentence to add to CONTRACT.md: "For POST /v1/orders, parse the body as JSON regardless of the Content-Type header, including when it is absent, and apply the six checks in the stated order."

#### A2 — §§1, 4.1, 4.3, 4.4: Textual spelling of integers

Context: "Ids are positive integers." The query table also requires integers but does not define their URL spelling.

- Found by: agent
- Reading 1: Accept any URL text that converts to a bounded integer, such as `1.0`, `1e1`, a leading plus sign or surrounding whitespace.
- Reading 2: Require nonempty ASCII decimal digits, allowing leading zeroes; reject the other spellings.
- Agent chose: Reading 2. `decimalInteger` rejects those alternate spellings, yielding 404 not-found for path IDs or 400 validation with the parameter name for query values. JSON numeric fields are validated as numbers, not with this URL-text rule.
- My decision: Reading 2 — I would make accepted URL representations predictable and avoid implicit coercion. A leading-zero value such as `01` still denotes 1.
- Sentence to add to CONTRACT.md: "Path IDs and integer query parameters must contain only ASCII decimal digits, with leading zeroes allowed; reject signs, decimal points, exponents and surrounding whitespace with 404 not-found for path IDs or 400 validation for query parameters."

#### A3 — §4.4: Repeated recognized query parameters

Context: the contract is silent about repeats such as `?limit=1&limit=2`; it only says "Query parameters, all optional".

- Found by: agent
- Reading 1: Select one occurrence, such as the first or last, and validate only that value.
- Reading 2: Reject a repeated recognized parameter even if its occurrences contain identical values.
- Agent chose: Reading 2. `listOrders` detects multiple occurrences of tableId, limit or cursor and returns 400 validation with that parameter name.
- My decision: Reading 2 — I would reject a request whose effective filter or page size depends on which occurrence a parser selects.
- Sentence to add to CONTRACT.md: "tableId, limit and cursor may each appear at most once in the query string; a repeated occurrence, even with the same value, is 400 validation with parameter set to that name."

#### A4 — §4.4: Changing limit while following a cursor

Context: "Use a cursor with the same `tableId` it came from." The contract does not say whether the original limit is also bound to the cursor.

- Found by: agent
- Reading 1: A cursor also fixes the original page size, so a different limit is rejected or ignored.
- Reading 2: Only the table filter is fixed; each request may choose another valid limit.
- Agent chose: Reading 2. Cursor state contains the snapshot, last-ID boundary and table filter, while `listOrders` uses the current request's validated limit, defaulting to 20 if omitted.
- My decision: Reading 2 — I would bind the cursor to the ordering and filter needed for stability, and allow the client to change page size without duplicates or omissions.
- Sentence to add to CONTRACT.md: "When following a cursor, the client may change limit to any integer from 1 to 100; if limit is omitted, use 20, while retaining the cursor's snapshot and the same tableId filter."
- Implementation evidence: `listOrders` in src/v1.js:224; current/default limit at line 232, table-filter check at lines 237–239, and retained snapshot/boundary with the current limit at lines 247–254.

#### A5 — §4.2: Recovery of an unfinished key after a process crash

Context: the contract is silent about crash recovery for an in-flight reservation; it only specifies 409 while a request is still being processed and retention for a successfully stored key.

- Found by: agent
- Reading 1: Automatically expire or recover an abandoned reservation so the key becomes usable after its owner crashes.
- Reading 2: Do not guess a processing deadline; retain the reservation until completion or operational recovery.
- Agent chose: Reading 2. Claims are durable and have no lease or startup cleanup. A crash after claiming can leave later valid-JSON requests with that key receiving 409 indefinitely until the stale claim is removed. This is a real availability limitation, not a behavior demonstrated by the green tests.
- My decision: Reading 2 for the current scope — I would make the lack of automatic recovery explicit rather than invent a timeout that could reclaim a live request and permit duplicate creation. A human decision to add automatic recovery would require a code change, verification and a new final capture.
- Sentence to add to CONTRACT.md: "A key whose first request has not finished is never released automatically: the server answers 409 idempotency-key-in-flight until that request completes, even if the process that started it has crashed; clearing such a key is an operational action outside this contract."

#### A6 — §5: Which legacy errors receive retirement headers

Context: "Every legacy response, errors included, carries these two headers" follows a list of four legacy endpoint/method combinations; unmatched routes and the health endpoint are not classified explicitly.

- Found by: agent
- Reading 1: Add Deprecation and Sunset only for the four listed combinations; leave unsupported methods and unmatched paths without them.
- Reading 2: Add them to every response produced by the existing legacy handler, including its unmatched-route errors, while leaving GET /health outside that API.
- Agent chose: Reading 2. `legacy` installs the headers before handling requests, and `handle` dispatches health and /v1 before legacy. A request for `/missing` receives legacy headers; GET /health does not.
- My decision: Reading 2 — I would consistently mark responses belonging to the retiring handler without deprecating the operational health endpoint.
- Sentence to add to CONTRACT.md: "Every response dispatched to the legacy handler, including unmatched paths and unsupported methods, must include Deprecation: @1792022400 and Sunset: Thu, 31 Dec 2026 23:59:59 GMT; GET /health and /v1 responses do not carry these headers."
- Implementation evidence: `legacy` in src/app.js:25 installs headers at line 27; its unmatched-route error is at line 61. `handle` at line 64 dispatches GET /health and /v1 before passing the exact header values to legacy at lines 70–73.

### My selected points, decisions and proposed wording — B2 and B4

I selected B2 and B4 from the agent's separate second-pass candidates, read the cited contract lines myself, and pointed them out for clarification. I supplied the two final proposed sentences below and requested their adoption. Claude chat helped draft the wording of my reasons and sentences; I reviewed and adopted it. The attribution records my selection, contract check and proposed resolution, together with the candidates' source. The second pass offered B1–B4; only B2 and B4 were adopted here.

#### B2 — §§2, 4.2: Pointers for a non-object order line

Context: "one entry **per problem found** (not just the first)" does not define whether `items: [null]` is one invalid line or two missing field problems. The whole-body non-object rule does not specify nested elements.

- Found by: me (selected and checked from the agent's second-pass candidates)
- Reading 1: Return one validation entry pointing at `/items/0` because the line itself is not an object.
- Reading 2: Return separate validation entries for the required menuItemId and qty fields at `/items/0/menuItemId` and `/items/0/qty`.
- Agent chose: Reading 2. `validateOrder` adds both field errors for a non-object element.
- My decision: two errors, one per field.
- Final wording proposed by: me; drafted with Claude chat, reviewed and adopted by me, then supplied to the implementing agent.
- My reason (verbatim): The contract defines the rules per field (lines 112-113), requires every broken field to be listed (line 124) and shows pointers such as /items/0/qty (line 35). An element such as null has neither field, so both field rules are broken, and each broken field is one problem (line 46).
- Sentence to add to CONTRACT.md: "An element of items that is not an object (for example null) produces exactly two errors entries, /items/{i}/menuItemId and /items/{i}/qty, and no entry for /items/{i}."
- Human check: CONTRACT.md lines 35, 46, 112–113 and 124.
- Implementation evidence: `validateOrder` in src/v1.js:68; lines 81–87 independently add the menuItemId and qty errors for a non-object element, with no parent-line error. `placeOrder` at lines 191–193 returns those errors as 400 validation.

#### B4 — §4.2: A different body while the same key is in flight

Context: "Same key, different body → `422 idempotency-key-reused`. Nothing is created." and "Same key while the first request is still being processed → `409 idempotency-key-in-flight`. The client waits and retries." can both describe one request; step 3 does not order these alternatives.

- Found by: me (selected and checked from the agent's second-pass candidates)
- Reading 1: Compare against the active request's body and return 422 when the body differs, even before a successful response exists.
- Reading 2: Return 409 for an active key regardless of its body's equality; apply the 422 comparison after a 201 response has been stored.
- Agent chose: Reading 2. `priorRequest` checks for an in-flight claim before any field validation and without storing or comparing its fingerprint. Header validation and JSON parsing still run first as steps 1 and 2 require.
- My decision: 409 first.
- Final wording proposed by: me; drafted with Claude chat, reviewed and adopted by me, then supplied to the implementing agent.
- My reason (verbatim): The server stores a key's body fingerprint only when step 6 succeeds (lines 134 and 144), so while the first request is still running there is no stored body to compare with. Line 142-143 defines that situation as 409 and tells the client to wait and retry; after the first request finishes, the retry gets either the replay (same body) or 422 (different body).
- Sentence to add to CONTRACT.md: "If a request arrives with a key whose first request has not finished, the answer is 409 idempotency-key-in-flight whether or not its body equals the first request's body; a body is compared only against the stored 201 response, after the first request has finished."
- Human check: CONTRACT.md lines 121–122, 134 and 141–144.
- Implementation evidence: `priorRequest` in src/v1.js:148, especially lines 149–152, returns an existing stored response or raises the in-flight problem without comparing bodies. `placeOrder` checks the header and JSON at lines 159–164, performs the lookup at lines 168–173, and compares fingerprints only for a stored response at lines 174–176. Successful storage and claim removal share the transaction at lines 195–214. If the first request instead ends with a 4xx, its claim is released and a corrected retry may start afresh, as §4.2 separately requires.

### G6 review and proposed-wording check

The human approved A1–A6 and selected/checked B2 and B4, with the requested A5 wording and the A6 clarification shown before editing. All eight decisions match current code. No source, migration, contract or test was changed; the committed final capture remains applicable.

| Point | Concrete values in the proposed sentence |
| --- | --- |
| A1 | POST /v1/orders, Content-Type, JSON, six ordered checks |
| A2 | ASCII decimal digits; 404 not-found or 400 validation |
| A3 | tableId, limit, cursor; at most once; 400 validation |
| A4 | limit 1–100, default 20; same tableId and snapshot |
| A5 | 409 idempotency-key-in-flight; completion/crash/operational clearing |
| A6 | Deprecation: @1792022400; Sunset: Thu, 31 Dec 2026 23:59:59 GMT; GET /health and /v1 |

### Human-provided additional point

#### C2 — §2: Unsupported method on an existing /v1 path

Section and sentences: §2, lines 21–22, 42, 53 and 57.

- Lines 21–22: "Every `/v1` response with a 4xx or 5xx status — including a request for a `/v1` path that does not exist — is a **problem details** object (RFC 9457):"
- Line 42: "`https://menu.example/problems/` followed by a slug from the table below. No other values"
- Line 53: "no resource with that id (also when the id is not a positive integer), or no such `/v1` path" (`404 not-found`).
- Line 57: "anything else. `detail` is a fixed, generic sentence" (`500 internal`).

- Found by: me
- Reading 1: a route is a method and path pair, so DELETE /v1/orders is a /v1 path that does not exist: 404 not-found.
- Reading 2: the path exists and no row of the problem table fits, so it falls under "anything else": 500 internal.
- Agent chose: 404 not-found (`handleV1`, src/v1.js lines 259–269 and 284; `sendProblem`, lines 25–34). The response type is `https://menu.example/problems/not-found`.
- My decision: Reading 1, because the table of problem types is closed (line 42), has no 405, and "internal" is for server faults, not for a client sending an unsupported request.
- Sentence to add to CONTRACT.md: "A request to an existing /v1 path with a method that path does not support is answered 404 not-found, like any other /v1 path that does not exist; no 405 is used."

## 4. Findings about the tests or the contract

- Run 1: the suite `§4 two instances, one database (as in session 4)` stopped during setup with `npm run migrate failed: undefined` and a null process status; its two tests were cancelled. A separate Node child-process diagnostic on Windows found that invoking npm directly returns status null with ENOENT, while invoking npm through cmd succeeds. This is consistent with an npm-launch compatibility issue, but I have not read the test source and cannot confirm the suite's exact invocation. The repository migration runner itself already passed direct up/down/up after the authorized fileURLToPath fix. I would investigate the execution environment before changing /v1 behavior. Neither test/ nor CONTRACT.md was edited, and run 1 was not repeated or replaced.
- Follow-up after G5a approval: the unchanged committed implementation passed migrate, seed, legacy 3/3 and contract 29/29 in an official Node Linux container (Node v22.23.4, image node:22-bookworm-slim). Both multi-instance tests passed, with zero cancellations. The repository was mounted read-only, network access was disabled during execution, and SQLite state was temporary inside the container. Output is in ignored .agents/scratch/run-2.txt. This demonstrates that the implementation satisfies both tested behaviors in that environment; the original Windows 27-pass/2-cancelled run remains the authentic first capture. No test source was inspected, no test/contract/API code was changed, and no implementation-fix commit was invented. The OS and Node version both differ from run 1; the exact unread harness invocation remains unconfirmed.

## 5. Prediction outcomes

- P1 — did not come true in run 1: `§4.2 only a 201 is stored: after a 4xx the same key may be used with a fixed body` passed. The first attempt allowed a corrected body to use the key after a 4xx; this outcome does not claim crash recovery was tested.
- P2 — did not come true in run 1: `§4.4 nextCursor is null exactly when there is nothing more` passed. The first attempt checked for an extra matching order before issuing a cursor.
