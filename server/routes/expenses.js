const express = require('express');
const { pool } = require('../db/db');
const { requireAuth } = require('../middleware/auth');
const { round2, isFiniteNumber } = require('../lib/invoiceData');

const router = express.Router();
router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Real calendar date check (rejects e.g. 2024-02-31).
function isValidDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// The expenses table predates this router: `title` holds the expense name and
// `is_paid` holds paid state. `status` is derived from `is_paid` here.
const EXPENSE_SQL = `
  SELECT id, title AS name, category, amount,
    to_char(due_date, 'YYYY-MM-DD') AS due_date,
    CASE WHEN is_paid THEN 'paid' ELSE 'unpaid' END AS status,
    paid_at, notes, created_at
  FROM expenses
  WHERE shop_id = $1`;

function toExpense(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount),
    dueDate: row.due_date,
    status: row.status,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

async function fetchExpenses(shopId, id = null) {
  const params = [shopId];
  let filter = '';
  if (id !== null) {
    params.push(id);
    filter = ' AND id = $2';
  }
  const result = await pool.query(`${EXPENSE_SQL}${filter} ORDER BY due_date ASC, created_at DESC`, params);
  return result.rows.map(toExpense);
}

// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const expenses = await fetchExpenses(req.shopId);
    return res.status(200).json(expenses);
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses
router.post('/', async (req, res, next) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  if (!name || !category) return res.status(400).json({ error: 'VALIDATION_ERROR' });
  if (!isFiniteNumber(body.amount) || body.amount <= 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  if (!isValidDate(body.dueDate)) return res.status(400).json({ error: 'VALIDATION_ERROR' });
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  const notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes.trim() : null;

  try {
    const inserted = await pool.query(
      `INSERT INTO expenses (shop_id, title, category, amount, due_date, is_paid, notes)
       VALUES ($1, $2, $3, $4, $5, false, $6) RETURNING id`,
      [req.shopId, name, category, round2(body.amount), body.dueDate, notes]
    );
    const [expense] = await fetchExpenses(req.shopId, inserted.rows[0].id);
    return res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/expenses/:id/pay
router.patch('/:id/pay', async (req, res, next) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'NOT_FOUND' });

  let client = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const locked = await client.query(
      'SELECT amount, is_paid FROM expenses WHERE id = $1 AND shop_id = $2 FOR UPDATE',
      [id, req.shopId]
    );
    const row = locked.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    if (row.is_paid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ALREADY_PAID' });
    }
    await client.query(
      'UPDATE expenses SET is_paid = true, paid_at = NOW() WHERE id = $1 AND shop_id = $2',
      [id, req.shopId]
    );
    await client.query(
      'UPDATE shops SET cash_in_hand = cash_in_hand - $1 WHERE id = $2',
      [Number(row.amount), req.shopId]
    );
    await client.query('COMMIT');

    const [expense] = await fetchExpenses(req.shopId, id);
    return res.status(200).json(expense);
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    if (client) client.release();
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'NOT_FOUND' });
  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND shop_id = $2 RETURNING id',
      [id, req.shopId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(200).json({ id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
