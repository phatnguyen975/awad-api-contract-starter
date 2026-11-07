-- Cross-process idempotency and opaque cursors (CONTRACT sections 4.2/4.4).
CREATE TABLE idempotency_responses (
  request_key TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  status INTEGER NOT NULL CHECK (status = 201),
  response_body TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Temporary claims are removed on both success and failure, not replayed.
CREATE TABLE idempotency_in_flight (
  request_key TEXT PRIMARY KEY
);

CREATE TABLE order_cursors (
  token TEXT PRIMARY KEY,
  snapshot_id INTEGER NOT NULL,
  before_id INTEGER NOT NULL,
  table_id INTEGER CHECK (table_id BETWEEN 1 AND 200),
  created_at TEXT NOT NULL
);
