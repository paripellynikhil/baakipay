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

// POST /api/invoices/match-sms  (body: { text })
// Read-only: suggests invoices for an incoming payment SMS. Never clears an invoice.
// Declared before any /:id route on purpose.
const SMS_AMOUNT_RE = /(?:Rs\.?|INR|₹)\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/i;
const SMS_CODE_RE = /INV-\d+/i;
const SMS_SENDER_RE = /\bfrom\s+(.+?)(?=\s+on\s|\s+Ref|\.|,|\r?\n|$)/i;

router.post('/match-sms', async (req, res, next) => {
  const body = req.body || {};
  if (typeof body.text !== 'string') return res.status(400).json({ error: 'VALIDATION_ERROR' });
  const text = body.text;

  const amountMatch = SMS_AMOUNT_RE.exec(text);
  if (!amountMatch) return res.status(400).json({ error: 'NO_AMOUNT' });
  const amount = Number(amountMatch[1].replace(/,/g, ''));
  if (!isFiniteNumber(amount) || amount <= 0) return res.status(400).json({ error: 'NO_AMOUNT' });

  const codeMatch = SMS_CODE_RE.exec(text);
  const invoiceCode = codeMatch ? codeMatch[0].toUpperCase() : null;
  const senderMatch = SMS_SENDER_RE.exec(text);
  const senderName = senderMatch ? senderMatch[1].trim() : '';
  const fragment = senderName.toLowerCase();

  try {
    const result = await pool.query(
      `SELECT i.id, i.invoice_code, c.name AS customer_name, i.total_amount, i.paid_amount
       FROM invoices i
       JOIN customers c ON c.id = i.customer_id AND c.shop_id = i.shop_id
       WHERE i.shop_id = $1 AND i.status IN ('UNPAID', 'PARTIAL')
       ORDER BY i.created_at DESC`,
      [req.shopId]
    );
    const open = result.rows
      .map((row) => ({
        id: row.id,
        invoice_code: row.invoice_code,
        customer_name: row.customer_name,
        remaining: round2(Number(row.total_amount) - Number(row.paid_amount)),
      }))
      .filter((inv) => inv.remaining > 0);

    const nameMatches = (inv) => {
      const name = String(inv.customer_name).toLowerCase();
      return fragment !== '' && name !== ''
        && (name.includes(fragment) || fragment.includes(name));
    };
    const isExact = (inv) => round2(inv.remaining) === round2(amount);

    let step = 'name';
    let considered = [];
    const byCode = invoiceCode
      ? open.find((inv) => String(inv.invoice_code).toUpperCase() === invoiceCode)
      : undefined;
    if (byCode) {
      step = 'code';
      considered = [byCode];
    } else {
      considered = open.filter((inv) => nameMatches(inv) || isExact(inv));
    }

    const scored = considered.map((inv) => {
      const nameMatch = nameMatches(inv);
      const exact = isExact(inv);
      let tag = 'Name Match';
      if (exact) tag = 'Full Payment Match';
      else if (inv.remaining > amount) tag = 'Possible Partial Payment';
      return {
        candidate: {
          id: inv.id,
          invoice_code: inv.invoice_code,
          customer_name: inv.customer_name,
          remaining: inv.remaining,
          tag,
          name_match: nameMatch,
        },
        rank: nameMatch && exact ? 0 : nameMatch ? 1 : 2,
      };
    });
    scored.sort((a, b) => a.rank - b.rank);
    const candidates = scored.map((s) => s.candidate);
    const multiMatch = candidates.filter((c) => c.name_match).length >= 2;

    return res.status(200).json({
      amount,
      senderName,
      invoiceCode,
      step,
      candidates,
      multi_match: multiMatch,
      requires_confirmation: true,
    });
  } catch (err) {
    next(err);
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

// POST /api/invoices/:id/pay  (body: { amount, mode: 'upi' | 'cash' })
// Payments are capped at the remaining balance.
router.post('/:id/pay', async (req, res, next) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'NOT_FOUND' });
  const body = req.body || {};
  if (!isFiniteNumber(body.amount) || body.amount <= 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }
  if (body.mode !== 'upi' && body.mode !== 'cash') {
    return res.status(400).json({ error: 'VALIDATION_ERROR' });
  }

  let client = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const locked = await client.query(
      'SELECT total_amount, paid_amount, status FROM invoices WHERE id = $1 AND shop_id = $2 FOR UPDATE',
      [id, req.shopId]
    );
    const row = locked.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    const remaining = round2(Number(row.total_amount) - Number(row.paid_amount));
    if (remaining <= 0 || row.status === 'PAID') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ALREADY_PAID' });
    }

    const applied = round2(Math.min(body.amount, remaining));
    const newPaid = round2(Number(row.paid_amount) + applied);
    const fullyPaid = round2(remaining - applied) <= 0;
    if (fullyPaid) {
      await client.query(
        `UPDATE invoices SET paid_amount = $1, status = 'PAID', paid_at = NOW()
         WHERE id = $2 AND shop_id = $3`,
        [newPaid, id, req.shopId]
      );
    } else {
      await client.query(
        `UPDATE invoices SET paid_amount = $1, status = 'PARTIAL'
         WHERE id = $2 AND shop_id = $3`,
        [newPaid, id, req.shopId]
      );
    }
    await client.query(
      'UPDATE shops SET cash_in_hand = cash_in_hand + $1 WHERE id = $2',
      [applied, req.shopId]
    );
    await client.query('COMMIT');

    const [invoice] = await fetchInvoices(req.shopId, id);
    return res.status(200).json({ invoice, applied, mode: body.mode });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    if (client) client.release();
  }
});


module.exports = router;
