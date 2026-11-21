const express = require('express');
const { pool } = require('../db/db');
const { requireAuth } = require('../middleware/auth');
const { round2, isFiniteNumber, fetchInvoices, normalizeItems, insertInvoice } = require('../lib/invoiceData');

const router = express.Router();
router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/invoices
router.get('/', async (req, res, next) => {
  try {
    const invoices = await fetchInvoices(req.shopId);
    return res.status(200).json(invoices);
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices
router.post('/', async (req, res, next) => {
  const body = req.body || {};
  if (typeof body.customerId !== 'string') {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  const items = normalizeItems(body.items);
  if (!items) return res.status(400).json({ error: 'VALIDATION_ERROR' });

  const discount = body.discount === undefined || body.discount === null ? 0 : body.discount;
  if (!isFiniteNumber(discount) || discount < 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  if (body.dueDate !== undefined && body.dueDate !== null
    && (typeof body.dueDate !== 'string' || !DATE_RE.test(body.dueDate))) {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  if (!UUID_RE.test(body.customerId)) return res.status(404).json({ error: 'NOT_FOUND' });

  const subtotal = round2(items.reduce((sum, it) => sum + it.lineTotal, 0));
  const discountAmt = round2(discount);
  const totalAmount = round2(Math.max(0, subtotal - discountAmt));

  let client = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await insertInvoice(client, req.shopId, {
      customerId: body.customerId,
      dueDate: body.dueDate || null,
      items,
      subtotal,
      discount: discountAmt,
      totalAmount,
    });
    if (result.fail) {
      await client.query('ROLLBACK');
      return res.status(result.fail[0]).json(result.fail[1]);
    }
    await client.query('COMMIT');
    const [invoice] = await fetchInvoices(req.shopId, result.id);
    return res.status(201).json(invoice);
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    if (client) client.release();
  }
});

// POST /api/invoices/:id/remind
router.post('/:id/remind', async (req, res, next) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'NOT_FOUND' });
  try {
    const result = await pool.query(
      `UPDATE invoices SET last_reminded_at = NOW()
       WHERE id = $1 AND shop_id = $2
       RETURNING id, last_reminded_at`,
      [id, req.shopId]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(200).json({ id: row.id, lastRemindedAt: row.last_reminded_at });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
