import { randomUUID } from 'node:crypto';
import { setImmediate } from 'node:timers/promises';
import { send } from './http.js';

// CONTRACT §2: public errors are selected here, never from database messages.
const problems = {
  'invalid-json': [400, 'Malformed JSON'],
  validation: [400, 'Invalid request'],
  'idempotency-key-missing': [400, 'Idempotency-Key required'],
  'not-found': [404, 'Not found'],
  'idempotency-key-in-flight': [409, 'Request in progress'],
  'unknown-menu-item': [422, 'Unknown menu item'],
  'idempotency-key-reused': [422, 'Idempotency-Key reused'],
  internal: [500, 'Internal error'],
};

class Problem extends Error {
  constructor(slug, detail, errors) {
    super(detail);
    this.slug = slug;
    this.errors = errors;
  }
}

function sendProblem(res, problem) {
  const [status, title] = problems[problem.slug];
  const body = {
    type: `https://menu.example/problems/${problem.slug}`,
    title,
    status,
    detail: problem.message,
  };
  if (problem.errors !== undefined) body.errors = problem.errors;
  send(res, status, body, { 'content-type': 'application/problem+json' });
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const integerIn = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

function decimalInteger(value, min, max) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && integerIn(number, min, max) ? number : null;
}

// §4.2: compare JSON values recursively, including unknown fields. Object key
// order is immaterial; array order and every field value remain significant.
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function readJson(req) {
  // Decode once: a multibyte UTF-8 character can straddle network chunks (§1).
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Problem('invalid-json', 'The request body is not valid JSON.');
  }
}

function validateOrder(body) {
  if (!isObject(body)) return [{ pointer: '', detail: 'must be an object' }];
  const errors = [];
  if (!integerIn(body.tableId, 1, 200)) {
    errors.push({ pointer: '/tableId', detail: 'must be an integer from 1 to 200' });
  }
  if (!Array.isArray(body.items)) {
    errors.push({ pointer: '/items', detail: 'must be an array of 1 to 20 lines' });
    return errors;
  }
  if (body.items.length < 1 || body.items.length > 20) {
    errors.push({ pointer: '/items', detail: 'must contain 1 to 20 lines' });
  }
  body.items.forEach((item, i) => {
    if (!isObject(item) || !Number.isInteger(item.menuItemId) || item.menuItemId <= 0) {
      errors.push({ pointer: `/items/${i}/menuItemId`, detail: 'must be a positive integer' });
    }
    if (!isObject(item) || !integerIn(item.qty, 1, 20)) {
      errors.push({ pointer: `/items/${i}/qty`, detail: 'must be an integer from 1 to 20' });
    }
  });
  return errors;
}

export function createV1(db) {
  const q = {
    menu: db.prepare('SELECT id, name, price_vnd FROM menu_items WHERE id = ?'),
    order: db.prepare('SELECT id, table_id, total_vnd, created_at FROM orders WHERE id = ?'),
    lines: db.prepare(`SELECT menu_item_id, qty, unit_price_vnd FROM order_items
      WHERE order_id = ? ORDER BY line`),
    insertOrder: db.prepare('INSERT INTO orders (table_id, total_vnd, created_at) VALUES (?, ?, ?)'),
    insertLine: db.prepare(`INSERT INTO order_items
      (order_id, line, menu_item_id, qty, unit_price_vnd) VALUES (?, ?, ?, ?, ?)`),
    response: db.prepare('SELECT * FROM idempotency_responses WHERE request_key = ?'),
    saveResponse: db.prepare(`INSERT INTO idempotency_responses
      (request_key, fingerprint, status, response_body, location, created_at) VALUES (?, ?, 201, ?, ?, ?)`),
    claim: db.prepare('INSERT INTO idempotency_in_flight (request_key) VALUES (?)'),
    inFlight: db.prepare('SELECT request_key FROM idempotency_in_flight WHERE request_key = ?'),
    release: db.prepare('DELETE FROM idempotency_in_flight WHERE request_key = ?'),
    cursor: db.prepare('SELECT * FROM order_cursors WHERE token = ?'),
    saveCursor: db.prepare(`INSERT INTO order_cursors
      (token, snapshot_id, before_id, table_id, created_at) VALUES (?, ?, ?, ?, ?)`),
    maxId: db.prepare('SELECT COALESCE(MAX(id), 0) AS id FROM orders'),
    page: db.prepare(`SELECT id FROM orders
      WHERE id <= ? AND (? IS NULL OR id < ?) AND (? IS NULL OR table_id = ?)
      ORDER BY id DESC LIMIT ?`),
  };

  function transaction(action) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function menuItem(id) {
    return Number.isSafeInteger(id) ? q.menu.get(id) : undefined;
  }

  function orderView(id) {
    const row = q.order.get(id);
    if (!row) throw new Problem('not-found', 'The requested order was not found.');
    return {
      id: row.id,
      tableId: row.table_id,
      items: q.lines.all(id).map((line) => ({
        menuItemId: line.menu_item_id,
        qty: line.qty,
        unitPriceVnd: line.unit_price_vnd,
      })),
      totalVnd: row.total_vnd,
      createdAt: row.created_at,
    };
  }

  function priorRequest(key) {
    const response = q.response.get(key);
    if (response) return response;
    if (q.inFlight.get(key)) {
      throw new Problem('idempotency-key-in-flight', 'A request with this key is still being processed.');
    }
    return null;
  }

  async function placeOrder(req, res) {
    // §4.2: keep the six validation steps in their prescribed order.
    const key = req.headers['idempotency-key'];
    if (typeof key !== 'string' || key.length < 1 || key.length > 255) {
      throw new Problem('idempotency-key-missing', 'A key of 1 to 255 characters is required.');
    }
    const body = await readJson(req);
    const fingerprint = canonicalJson(body);

    // WAL readers can see an in-flight claim even while its owner is writing.
    // Recheck under the write lock before claiming a previously unseen key.
    const stored = priorRequest(key) ?? transaction(() => {
      const response = priorRequest(key);
      if (response) return response;
      q.claim.run(key);
      return null;
    });
    if (stored) {
      if (stored.fingerprint !== fingerprint) {
        throw new Problem('idempotency-key-reused', 'This key was used with a different request body.');
      }
      res.writeHead(stored.status, {
        'content-type': 'application/json',
        Location: stored.location,
        'Idempotent-Replayed': 'true',
      });
      res.end(stored.response_body);
      return;
    }

    let claimed = true;
    try {
      // Let overlapping requests observe the shared claim before creation.
      await setImmediate();
      const errors = validateOrder(body);
      if (errors.length) {
        throw new Problem('validation', `${errors.length} request field problems were found.`, errors);
      }
      const result = transaction(() => {
        // Check existence and snapshot prices in the same transaction as writes.
        const menu = body.items.map((item) => menuItem(item.menuItemId));
        const unknown = [];
        menu.forEach((item, i) => {
          if (!item) unknown.push({ pointer: `/items/${i}/menuItemId`, detail: 'menu item does not exist' });
        });
        if (unknown.length) {
          throw new Problem('unknown-menu-item', `${unknown.length} order lines name an unknown menu item.`, unknown);
        }
        const createdAt = new Date().toISOString();
        const total = body.items.reduce((sum, item, i) => sum + item.qty * menu[i].price_vnd, 0);
        const id = Number(q.insertOrder.run(body.tableId, total, createdAt).lastInsertRowid);
        body.items.forEach((item, i) => q.insertLine.run(id, i, item.menuItemId, item.qty, menu[i].price_vnd));
        const responseBody = JSON.stringify(orderView(id));
        const location = `/v1/orders/${id}`;
        q.saveResponse.run(key, fingerprint, responseBody, location, createdAt);
        q.release.run(key);
        return { responseBody, location };
      });
      claimed = false;
      res.writeHead(201, { 'content-type': 'application/json', Location: result.location });
      res.end(result.responseBody);
    } finally {
      // §4.2: a failed request must leave the key free for a corrected retry.
      if (claimed) q.release.run(key);
    }
  }

  function listOrders(res, params) {
    const errors = [];
    for (const name of ['tableId', 'limit', 'cursor']) {
      if (params.getAll(name).length > 1) {
        errors.push({ parameter: name, detail: 'must be supplied at most once' });
      }
    }
    const tableId = params.has('tableId') ? decimalInteger(params.get('tableId'), 1, 200) : null;
    const limit = params.has('limit') ? decimalInteger(params.get('limit'), 1, 100) : 20;
    if (params.has('tableId') && tableId === null) {
      errors.push({ parameter: 'tableId', detail: 'must be an integer from 1 to 200' });
    }
    if (limit === null) errors.push({ parameter: 'limit', detail: 'must be an integer from 1 to 100' });
    const cursor = params.has('cursor') ? q.cursor.get(params.get('cursor')) : null;
    if (params.has('cursor') && (!cursor || cursor.table_id !== tableId)) {
      errors.push({ parameter: 'cursor', detail: 'must be a returned cursor used with the same tableId' });
    }
    if (errors.length) {
      throw new Problem('validation', `${errors.length} query parameter problems were found.`, errors);
    }

    // §4.4: a snapshot upper bound excludes new orders; a strict last-ID
    // boundary prevents duplicates. One extra matching row proves a next page.
    const snapshot = cursor ? cursor.snapshot_id : q.maxId.get().id;
    const before = cursor ? cursor.before_id : null;
    const rows = q.page.all(snapshot, before, before, tableId, tableId, limit + 1);
    const page = rows.slice(0, limit);
    let nextCursor = null;
    if (rows.length > limit) {
      nextCursor = randomUUID();
      q.saveCursor.run(nextCursor, snapshot, page.at(-1).id, tableId, new Date().toISOString());
    }
    send(res, 200, { items: page.map((row) => orderView(row.id)), nextCursor });
  }

  return async function handleV1(req, res, url) {
    try {
      if (url.pathname === '/v1/orders') {
        if (req.method === 'POST') {
          await placeOrder(req, res);
          return true;
        }
        if (req.method === 'GET') {
          listOrders(res, url.searchParams);
          return true;
        }
      }
      const match = /^\/v1\/(menu|orders)\/([^/]+)$/.exec(url.pathname);
      if (req.method === 'GET' && match) {
        const id = decimalInteger(match[2], 1, Number.MAX_SAFE_INTEGER);
        if (id === null) throw new Problem('not-found', 'The requested resource was not found.');
        if (match[1] === 'orders') {
          send(res, 200, orderView(id));
        } else {
          const item = menuItem(id);
          if (!item) throw new Problem('not-found', 'The requested menu item was not found.');
          send(res, 200, { id: item.id, name: item.name, priceVnd: item.price_vnd });
        }
        return true;
      }
      throw new Problem('not-found', 'The requested resource was not found.');
    } catch (error) {
      if (!res.headersSent) {
        sendProblem(res, error instanceof Problem ? error : new Problem('internal', 'An unexpected error occurred.'));
      } else if (!res.writableEnded) {
        res.end();
      }
    }
    return true;
  };
}
