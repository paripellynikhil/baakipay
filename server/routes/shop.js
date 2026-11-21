const express = require('express');
const { pool } = require('../db/db');
const { requireAuth, getEffectivePlan } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const SHOP_COLUMNS = `id, email_or_phone, shop_name, owner_name, bio, address, upi_id, cash_in_hand,
  default_credit_limit, default_due_days, language, plan, trial_expires_at, onboarded, created_at`;

// Only these keys may be written via PUT /profile. plan and trial_expires_at are never writable here.
const PROFILE_WHITELIST = [
  'shop_name', 'owner_name', 'bio', 'address', 'upi_id', 'cash_in_hand',
  'default_credit_limit', 'default_due_days', 'language', 'onboarded',
];
const LANGUAGES = ['en', 'te', 'hi'];
const MAX_RECURRING_BILLS = 10;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function loadShop(id) {
  const result = await pool.query(`SELECT ${SHOP_COLUMNS} FROM shops WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

function isNonNegativeNumber(v) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

// Returns an error message string, or null when the provided values are valid.
function validateProfile(body) {
  if ('cash_in_hand' in body && !isNonNegativeNumber(body.cash_in_hand)) {
    return 'cash_in_hand must be a number >= 0';
  }
  if ('default_credit_limit' in body && !isNonNegativeNumber(body.default_credit_limit)) {
    return 'default_credit_limit must be a number >= 0';
  }
  if ('default_due_days' in body) {
    const d = body.default_due_days;
    if (!Number.isInteger(d) || d < 0 || d > 365) {
      return 'default_due_days must be an integer between 0 and 365';
    }
  }
  if ('language' in body && !LANGUAGES.includes(body.language)) {
    return "language must be one of 'en', 'te', 'hi'";
  }
  return null;
}

function isValidBill(bill) {
  return (
    bill &&
    typeof bill.title === 'string' && bill.title.trim() !== '' &&
    typeof bill.category === 'string' && bill.category.trim() !== '' &&
    typeof bill.amount === 'number' && Number.isFinite(bill.amount) && bill.amount > 0 &&
    typeof bill.dueDate === 'string' && DATE_RE.test(bill.dueDate)
  );
}

// GET /api/shop/profile
router.get('/profile', async (req, res, next) => {
  try {
    const shop = await loadShop(req.shopId);
    if (!shop) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(200).json({ shop, effectivePlan: getEffectivePlan(shop) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/shop/profile
router.put('/profile', async (req, res, next) => {
  const body = req.body || {};
  const provided = PROFILE_WHITELIST.filter((key) => key in body);
  const validationError = validateProfile(body);
  if (validationError) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: validationError });
  }

  const bills = Array.isArray(body.recurringBills)
    ? body.recurringBills.filter(isValidBill).slice(0, MAX_RECURRING_BILLS)
    : [];

  let client = null;
  try {
    if (provided.length > 0) {
      // Column names come only from PROFILE_WHITELIST; values are bound parameters.
      const sets = provided.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const values = provided.map((col) => body[col]);
      values.push(req.shopId);
      await pool.query(`UPDATE shops SET ${sets} WHERE id = $${values.length}`, values);
    }

    let recurringBillsAdded = 0;
    if (bills.length > 0) {
      client = await pool.connect();
      await client.query('BEGIN');
      for (const bill of bills) {
        await client.query(
          `INSERT INTO expenses (shop_id, title, category, amount, due_date, is_paid)
           VALUES ($1, $2, $3, $4, $5, false)`,
          [req.shopId, bill.title.trim(), bill.category.trim(), bill.amount, bill.dueDate]
        );
        recurringBillsAdded += 1;
      }
      await client.query('COMMIT');
    }

    const shop = await loadShop(req.shopId);
    if (!shop) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(200).json({
      shop,
      effectivePlan: getEffectivePlan(shop),
      recurringBillsAdded,
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    next(err);
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
