const express = require('express');
const { pool } = require('../db/db');
const { requireAuth, getEffectivePlan } = require('../middleware/auth');
const { buildForecast } = require('../lib/forecastEngine');

const router = express.Router();
router.use(requireAuth);

function parseFlag(value) {
  return value === 'true' || value === '1';
}

// GET /api/forecast?days=30&delayTop=true&badDay5=false&extraCredit15k=true
router.get('/', async (req, res, next) => {
  try {
    const shopResult = await pool.query(
      'SELECT id, cash_in_hand, plan, trial_expires_at FROM shops WHERE id = $1',
      [req.shopId]
    );
    const shop = shopResult.rows[0];
    if (!shop) return res.status(404).json({ error: 'NOT_FOUND' });

    const [invoiceResult, expenseResult] = await Promise.all([
      pool.query(
        `SELECT i.id, i.customer_id, c.name AS customer_name, i.total_amount, i.paid_amount,
                i.status, to_char(i.due_date, 'YYYY-MM-DD') AS due_date
         FROM invoices i
         JOIN customers c ON c.id = i.customer_id AND c.shop_id = i.shop_id
         WHERE i.shop_id = $1 AND i.status IN ('UNPAID', 'PARTIAL')`,
        [req.shopId]
      ),
      pool.query(
        `SELECT id, title, amount, is_paid, to_char(due_date, 'YYYY-MM-DD') AS due_date
         FROM expenses
         WHERE shop_id = $1 AND is_paid = false`,
        [req.shopId]
      ),
    ]);

    const forecast = buildForecast({
      shop,
      invoices: invoiceResult.rows,
      expenses: expenseResult.rows,
      days: Number(req.query.days),
      delayTop: parseFlag(req.query.delayTop),
      badDay5: parseFlag(req.query.badDay5),
      extraCredit15k: parseFlag(req.query.extraCredit15k),
      effectivePlan: getEffectivePlan(shop),
    });
    return res.status(200).json(forecast);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
