const crypto = require('crypto');
const { pool } = require('../db/db');
const { getEffectivePlan } = require('../middleware/auth');

const FREE_MONTHLY_INVOICE_LIMIT = 10;

// $1 = shop_id. Optional $2 narrows the result to one invoice (see fetchInvoices).
const INVOICE_SQL = `
  SELECT i.id, i.invoice_code, i.customer_id, c.name AS customer_name, i.items_json,
    i.subtotal, i.discount, i.total_amount, i.paid_amount,
    to_char(i.due_date, 'YYYY-MM-DD') AS due_date, i.status, i.last_reminded_at,
    i.record_hash, i.created_at
  FROM invoices i
  JOIN customers c ON c.id = i.customer_id AND c.shop_id = i.shop_id
  WHERE i.shop_id = $1`;

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function toInvoice(row) {
  return {
    id: row.id,
    invoiceCode: row.invoice_code,
    customerId: row.customer_id,
    customerName: row.customer_name,
    items: row.items_json,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    dueDate: row.due_date,
    status: row.status,
    lastRemindedAt: row.last_reminded_at,
    recordHash: row.record_hash,
    createdAt: row.created_at,
  };
}

async function fetchInvoices(shopId, id = null) {
  const params = [shopId];
  let filter = '';
  if (id !== null) {
    params.push(id);
    filter = ' AND i.id = $2';
  }
  const result = await pool.query(`${INVOICE_SQL}${filter} ORDER BY i.created_at DESC`, params);
  return result.rows.map(toInvoice);
}

// Returns normalized items with money rounded to 2 decimals, or null when invalid.
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const out = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') return null;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const discount = item.discount === undefined || item.discount === null ? 0 : item.discount;
    if (!name || !isFiniteNumber(item.qty) || item.qty <= 0) return null;
    if (!isFiniteNumber(item.unitPrice) || item.unitPrice < 0) return null;
    if (!isFiniteNumber(discount) || discount < 0) return null;
    const unitPrice = round2(item.unitPrice);
    const itemDiscount = round2(discount);
    out.push({
      name,
      qty: item.qty,
      unitPrice,
      discount: itemDiscount,
      lineTotal: round2(item.qty * unitPrice - itemDiscount),
    });
  }
  return out;
}

// Runs inside a transaction. Returns { id } on success or { fail: [status, body] }.
async function insertInvoice(client, shopId, input) {
  // FOR UPDATE on the shop row serialises invoice creation per shop, so codes do not collide.
  const shopRes = await client.query(
    'SELECT default_due_days, plan, trial_expires_at FROM shops WHERE id = $1 FOR UPDATE',
    [shopId]
  );
  const shop = shopRes.rows[0];
  if (!shop) return { fail: [404, { error: 'NOT_FOUND' }] };

  const cust = await client.query(
    'SELECT 1 FROM customers WHERE id = $1 AND shop_id = $2',
    [input.customerId, shopId]
  );
  if (cust.rowCount === 0) return { fail: [404, { error: 'NOT_FOUND' }] };

  if (getEffectivePlan(shop) === 'free') {
    const count = await client.query(
      `SELECT COUNT(*)::int AS n FROM invoices
       WHERE shop_id = $1 AND created_at >= date_trunc('month', NOW())`,
      [shopId]
    );
    if (count.rows[0].n >= FREE_MONTHLY_INVOICE_LIMIT) {
      return { fail: [403, { error: 'INVOICE_LIMIT_REACHED', upgradePrompt: true }] };
    }
  }

  let dueDate = input.dueDate;
  if (!dueDate) {
    const due = await client.query(
      'SELECT (CURRENT_DATE + $1::int)::text AS due',
      [shop.default_due_days]
    );
    dueDate = due.rows[0].due;
  }

  const seq = await client.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_code FROM 5) AS BIGINT)), 0) AS max_seq
     FROM invoices WHERE shop_id = $1 AND invoice_code ~ '^INV-[0-9]+$'`,
    [shopId]
  );
  const invoiceCode = 'INV-' + String(Number(seq.rows[0].max_seq) + 1).padStart(3, '0');

  const payload = {
    shopId,
    invoiceCode,
    customerId: input.customerId,
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    totalAmount: input.totalAmount,
    dueDate,
  };
  const recordHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  const inserted = await client.query(
    `INSERT INTO invoices (shop_id, customer_id, invoice_code, items_json, subtotal, discount,
       total_amount, paid_amount, due_date, status, record_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'UNPAID', $9) RETURNING id`,
    [shopId, input.customerId, invoiceCode, JSON.stringify(input.items), input.subtotal,
      input.discount, input.totalAmount, dueDate, recordHash]
  );
  return { id: inserted.rows[0].id };
}

module.exports = { round2, isFiniteNumber, fetchInvoices, normalizeItems, insertInvoice };
