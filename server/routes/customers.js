const express = require('express');
const { pool } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NEAR_LIMIT_RATIO = 0.8;

// $1 = shop_id. Optional $2 narrows the result to one customer (see fetchCustomers).
const CUSTOMER_SQL = `
  SELECT c.id, c.name, c.phone, c.upi_id, c.credit_limit,
    COALESCE(SUM(CASE WHEN i.status <> 'PAID' THEN i.total_amount - i.paid_amount END), 0) AS total_owed,
    COALESCE(MAX(CASE WHEN i.status <> 'PAID' THEN GREATEST(0, CURRENT_DATE - i.due_date) END), 0) AS max_days_overdue,
    COALESCE(BOOL_OR(i.last_reminded_at IS NOT NULL AND i.last_reminded_at::date = CURRENT_DATE), false) AS reminded_today
  FROM customers c
  LEFT JOIN invoices i ON i.customer_id = c.id AND i.shop_id = c.shop_id
  WHERE c.shop_id = $1`;

function toCustomer(row) {
  const totalOwed = Number(row.total_owed);
  const creditLimit = Number(row.credit_limit);
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    upiId: row.upi_id,
    creditLimit,
    totalOwed,
    maxDaysOverdue: Number(row.max_days_overdue),
    nearLimit: totalOwed >= NEAR_LIMIT_RATIO * creditLimit,
    remindedToday: row.reminded_today === true,
  };
}

async function fetchCustomers(shopId, id = null) {
  const params = [shopId];
  let filter = '';
  if (id !== null) {
    params.push(id);
    filter = ' AND c.id = $2';
  }
  const result = await pool.query(
    `${CUSTOMER_SQL}${filter} GROUP BY c.id ORDER BY c.created_at`,
    params
  );
  return result.rows.map(toCustomer);
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanUpiId(value) {
  const trimmed = cleanText(value);
  return trimmed === '' ? null : trimmed;
}

function isValidCreditLimit(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// GET /api/customers
router.get('/', async (req, res, next) => {
  try {
    const customers = await fetchCustomers(req.shopId);
    return res.status(200).json(customers);
  } catch (err) {
    next(err);
  }
});

// POST /api/customers
router.post('/', async (req, res, next) => {
  const body = req.body || {};
  const name = cleanText(body.name);
  const phone = cleanText(body.phone);
  if (!name || !phone) {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  const hasCreditLimit = body.creditLimit !== undefined && body.creditLimit !== null;
  if (hasCreditLimit && !isValidCreditLimit(body.creditLimit)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  try {
    let creditLimit = hasCreditLimit ? body.creditLimit : null;
    if (creditLimit === null) {
      const shop = await pool.query('SELECT default_credit_limit FROM shops WHERE id = $1', [req.shopId]);
      if (!shop.rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      creditLimit = shop.rows[0].default_credit_limit;
    }
    const inserted = await pool.query(
      `INSERT INTO customers (shop_id, name, phone, upi_id, credit_limit)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.shopId, name, phone, cleanUpiId(body.upiId), creditLimit]
    );
    const [customer] = await fetchCustomers(req.shopId, inserted.rows[0].id);
    return res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'NOT_FOUND' });

  const body = req.body || {};
  const columns = [];
  const values = [];
  if ('name' in body) {
    const name = cleanText(body.name);
    if (!name) return res.status(400).json({ error: 'VALIDATION_ERROR' });
    columns.push('name');
    values.push(name);
  }
  if ('phone' in body) {
    const phone = cleanText(body.phone);
    if (!phone) return res.status(400).json({ error: 'VALIDATION_ERROR' });
    columns.push('phone');
    values.push(phone);
  }
  if ('upiId' in body) {
    columns.push('upi_id');
    values.push(cleanUpiId(body.upiId));
  }
  if ('creditLimit' in body) {
    if (!isValidCreditLimit(body.creditLimit)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR' });
    }
    columns.push('credit_limit');
    values.push(body.creditLimit);
  }

  try {
    if (columns.length > 0) {
      // Column names come only from the fixed list above; values are bound parameters.
      const assignments = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      values.push(id, req.shopId);
      const updated = await pool.query(
        `UPDATE customers SET ${assignments}
         WHERE id = $${values.length - 1} AND shop_id = $${values.length} RETURNING id`,
        values
      );
      if (updated.rowCount === 0) return res.status(404).json({ error: 'NOT_FOUND' });
    }
    const [customer] = await fetchCustomers(req.shopId, id);
    if (!customer) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(200).json(customer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
