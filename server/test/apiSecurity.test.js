import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createRequire } from 'node:module';

// The API modules are CommonJS; load them through createRequire so the
// shared pg Pool object is the same instance the routes receive.
const require = createRequire(import.meta.url);

// Never touch the live Neon database: replace query on the shared pool
// before any route runs. The Pool constructor does not connect at require time.
const { pool } = require('../db/db');
const queryMock = vi.fn(async () => ({ rows: [], rowCount: 0 }));

let app;
let server;
let base;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-vitest';
  pool.query = queryMock;
  pool.connect = vi.fn(async () => {
    throw new Error('DB access blocked in tests');
  });
  app = require('../index.js');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function get(path, headers = {}) {
  return fetch(base + path, { headers });
}

describe('public endpoints', () => {
  it('GET /api/health returns 200 with ok and service name', async () => {
    const res = await get('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('baakipay');
  });
});

describe('unknown API routes', () => {
  it('GET /api returns JSON 404 NOT_FOUND', async () => {
    const res = await get('/api');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: 'NOT_FOUND' });
  });

  it('GET /api/unknown returns JSON 404 NOT_FOUND', async () => {
    const res = await get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: 'NOT_FOUND' });
  });
});

describe('protected endpoints reject unauthenticated requests', () => {
  const protectedPaths = ['/api/customers', '/api/invoices', '/api/expenses'];

  for (const path of protectedPaths) {
    it(`GET ${path} without a token returns 401 UNAUTHORIZED`, async () => {
      const res = await get(path);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'UNAUTHORIZED' });
    });
  }

  it('rejects a malformed bearer token with 401 INVALID_TOKEN', async () => {
    const res = await get('/api/customers', { Authorization: 'Bearer not-a-real-jwt' });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'INVALID_TOKEN' });
  });

  it('does not reach the database for unauthenticated requests', async () => {
    queryMock.mockClear();
    await get('/api/invoices');
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('authenticated requests', () => {
  it('accepts a valid token and reaches the route handler', async () => {
    const { signToken } = require('../middleware/auth');
    const token = signToken(42);
    const res = await get('/api/customers', { Authorization: `Bearer ${token}` });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(queryMock).toHaveBeenCalled();
  });

    it('POST /api/invoices returns 403 INVOICE_LIMIT_REACHED at the free-plan monthly limit', async () => {
      const { signToken } = require('../middleware/auth');
      const replies = [
        { rows: [] }, // BEGIN
        { rows: [{ default_due_days: 7, plan: 'free', trial_expires_at: null }], rowCount: 1 }, // shop
        { rows: [], rowCount: 1 }, // customer exists
        { rows: [{ n: 10 }], rowCount: 1 }, // bills this month
        { rows: [] }, // ROLLBACK
      ];
      const client = { query: vi.fn(async () => replies.shift()), release: vi.fn() };
      const originalConnect = pool.connect;
      pool.connect = vi.fn(async () => client);
      try {
        const res = await fetch(base + '/api/invoices', {
          method: 'POST',
          headers: { Authorization: `Bearer ${signToken(42)}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: '11111111-1111-4111-8111-111111111111', items: [{ name: 'Rice', qty: 1, unitPrice: 100 }] }),
        });
        expect(res.status).toBe(403);
        expect(await res.json()).toEqual({ error: 'INVOICE_LIMIT_REACHED', upgradePrompt: true });
      } finally {
        pool.connect = originalConnect;
      }
    });
    it('POST /api/invoices/match-sms reads 5,000 as the amount, not the Ref number, and requires confirmation', async () => {
      const { signToken } = require('../middleware/auth');
      const res = await fetch(base + '/api/invoices/match-sms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${signToken(42)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Rs. 5,000 credited from Rahul via UPI Ref 432198765' }),
      });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.amount).toBe(5000);
      expect(body.requires_confirmation).toBe(true);
    });

});

describe('bad JSON bodies', () => {
  it('returns 400 INVALID_JSON for malformed JSON on a public POST path', async () => {
    const res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"broken":',
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'INVALID_JSON' });
  });
});

