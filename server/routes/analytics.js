const express = require('express');
const crypto = require('node:crypto');
const { pool } = require('../db/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MONTHS_WINDOW = 6;
const TOP_OVERDUE_LIMIT = 5;

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// Last 6 calendar months ending with the current month, oldest first.
function monthKeys() {
  const now = new Date();
  const keys = [];
  for (let i = MONTHS_WINDOW - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

// Rule: an invoice is bucketed into the month of its created_at.
// invoiced = sum(total_amount) of those invoices; collected = sum(paid_amount) of the same invoices.
// Months with no invoices are filled with 0.
async function monthlyTotals(shopId) {
  const { rows } = await pool.query(
    `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
            SUM(total_amount) AS invoiced, SUM(paid_amount) AS collected
       FROM invoices
      WHERE shop_id = $1
        AND created_at >= date_trunc('month', CURRENT_DATE) - make_interval(months => $2::int)
      GROUP BY 1`,
    [shopId, MONTHS_WINDOW - 1]
  );
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  return monthKeys().map((month) => {
    const r = byMonth.get(month);
    return {
      month,
      invoiced: r ? round2(Number(r.invoiced)) : 0,
      collected: r ? round2(Number(r.collected)) : 0,
    };
  });
}

// On-time rate and average days are measured over PAID invoices only.
// totalOutstanding = sum(total_amount - paid_amount) over invoices not PAID.
async function paymentMetrics(shopId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE status = 'PAID') AS paid_count,
            COUNT(*) FILTER (WHERE status = 'PAID' AND paid_at::date <= due_date) AS on_time_count,
            AVG(CASE WHEN status = 'PAID' THEN paid_at::date - created_at::date END) AS avg_days,
            COALESCE(SUM(CASE WHEN status <> 'PAID' THEN total_amount - paid_amount END), 0) AS outstanding
       FROM invoices
      WHERE shop_id = $1`,
    [shopId]
  );
  const r = rows[0];
  const paidCount = Number(r.paid_count);
  return {
    paidCount,
    onTimeRate: paidCount ? round1((Number(r.on_time_count) / paidCount) * 100) : 0,
    avgDaysToCollect: r.avg_days === null ? 0 : round1(Number(r.avg_days)),
    totalOutstanding: round2(Number(r.outstanding)),
  };
}

// Unpaid invoices past due, grouped by customer, largest outstanding first.
async function overdueCustomers(shopId) {
  const { rows } = await pool.query(
    `SELECT c.id AS customer_id, c.name,
            SUM(i.total_amount - i.paid_amount) AS outstanding,
            MAX(CURRENT_DATE - i.due_date) AS max_days_overdue
       FROM invoices i
       JOIN customers c ON c.id = i.customer_id AND c.shop_id = i.shop_id
      WHERE i.shop_id = $1 AND i.status <> 'PAID' AND i.due_date < CURRENT_DATE
      GROUP BY c.id, c.name
      ORDER BY outstanding DESC
      LIMIT $2`,
    [shopId, TOP_OVERDUE_LIMIT]
  );
  return rows.map((r) => ({
    customer_id: r.customer_id,
    name: r.name,
    outstanding: round2(Number(r.outstanding)),
    maxDaysOverdue: Number(r.max_days_overdue),
  }));
}

async function shopProfile(shopId) {
  const { rows } = await pool.query(
    'SELECT shop_name, owner_name, address, upi_id FROM shops WHERE id = $1',
    [shopId]
  );
  return rows[0] || null;
}

const FALLBACK_TIPS = [
  'Record every payment as soon as it arrives so balances stay accurate.',
  'Share your UPI ID on every bill so customers can pay instantly.',
  'Review your top debtors once a week to keep balances from growing.',
];

function formatRupees(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

// Plain-English tips built from the computed metrics. Always returns 3-4 tips.
function buildSmartTips({ onTimeRate, avgDaysToCollect, paidCount, topOverdue }) {
  const tips = [];
  if (paidCount > 0 && onTimeRate < 50) {
    tips.push('Fewer than half of your paid invoices were settled by the due date. Send payment reminders a few days before each due date.');
  }
  if (topOverdue.length > 0) {
    const top = topOverdue[0];
    tips.push(`${top.name} has ${formatRupees(top.outstanding)} overdue, up to ${top.maxDaysOverdue} days late. Follow up with them first.`);
  }
  if (avgDaysToCollect > 30) {
    tips.push(`Invoices take about ${Math.round(avgDaysToCollect)} days to collect. Consider shorter credit periods or part payments.`);
  }
  for (const tip of FALLBACK_TIPS) {
    if (tips.length >= 3) break;
    tips.push(tip);
  }
  return tips.slice(0, 4);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = canonicalize(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function summaryHashOf(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(payload))).digest('hex');
}

router.get('/', async (req, res, next) => {
  try {
    const shopId = req.shopId;
    const [months, metrics, topOverdue, shop] = await Promise.all([
      monthlyTotals(shopId),
      paymentMetrics(shopId),
      overdueCustomers(shopId),
      shopProfile(shopId),
    ]);
    const totals = {
      invoiced: round2(months.reduce((sum, m) => sum + m.invoiced, 0)),
      collected: round2(months.reduce((sum, m) => sum + m.collected, 0)),
      outstanding: metrics.totalOutstanding,
    };
    const smartTips = buildSmartTips({ ...metrics, topOverdue });
    const summaryHash = summaryHashOf({
      shopId,
      months,
      totals,
      metrics: { onTimeRate: metrics.onTimeRate, avgDaysToCollect: metrics.avgDaysToCollect },
    });
    res.json({
      months,
      onTimeRate: metrics.onTimeRate,
      avgDaysToCollect: metrics.avgDaysToCollect,
      totalOutstanding: metrics.totalOutstanding,
      topOverdue,
      smartTips,
      summaryHash,
      generatedAt: new Date().toISOString(),
      shop,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
