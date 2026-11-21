require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const { computeRecordHash } = require('../services/recordHash');
const { SHOP, CUSTOMERS, INVOICES, EXPENSES } = require('./seedData');

const DAY_MS = 86400000;

async function seed() {
  await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

  const existing = await pool.query('SELECT id FROM shops WHERE email_or_phone = $1', [SHOP.email]);
  if (existing.rows.length > 0) {
    console.log('Seed skipped: sample shop already exists');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(SHOP.password, 10);
    const shopRes = await client.query(
      `INSERT INTO shops (email_or_phone, password_hash, shop_name, owner_name, address, upi_id, cash_in_hand, plan, onboarded)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pro', true) RETURNING id`,
      [SHOP.email, passwordHash, SHOP.shopName, SHOP.ownerName, SHOP.address, SHOP.upiId, SHOP.cashInHand]
    );
    const shopId = shopRes.rows[0].id;

    const customerIds = [];
    for (const c of CUSTOMERS) {
      const res = await client.query(
        `INSERT INTO customers (shop_id, name, phone, upi_id, credit_limit)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [shopId, c.name, c.phone, c.upiId, c.creditLimit]
      );
      customerIds.push(res.rows[0].id);
    }

    for (let i = 0; i < INVOICES.length; i++) {
      const { c, daysAgo, total, paid } = INVOICES[i];
      const createdAt = new Date(Date.now() - daysAgo * DAY_MS);
      const dueDate = new Date(createdAt.getTime() + 30 * DAY_MS);
      const dueStr = dueDate.toISOString().slice(0, 10);
      const status = paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
      const paymentMode = paid > 0 ? (i % 2 === 0 ? 'CASH' : 'UPI') : null;
      const invoiceCode = 'INV-' + String(i + 1).padStart(3, '0');
      const itemsJson = JSON.stringify([{ name: 'Provisions', qty: 1, unit_price: total, discount: 0 }]);
      const recordHash = computeRecordHash({ shopId, invoiceCode, totalAmount: total, createdAt });

      await client.query(
        `INSERT INTO invoices (shop_id, customer_id, invoice_code, items_json, subtotal, discount, total_amount,
                               paid_amount, due_date, status, payment_mode, record_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [shopId, customerIds[c], invoiceCode, itemsJson, total, 0, total, paid, dueStr, status, paymentMode, recordHash, createdAt]
      );
    }

    for (const e of EXPENSES) {
      const dueStr = new Date(Date.now() + e.dueInDays * DAY_MS).toISOString().slice(0, 10);
      await client.query(
        `INSERT INTO expenses (shop_id, title, category, amount, due_date, is_paid)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [shopId, e.title, e.category, e.amount, dueStr]
      );
    }

    await client.query('COMMIT');
    console.log(
      `Seeded sample shop ${SHOP.email}: ${CUSTOMERS.length} customers, ${INVOICES.length} invoices, ${EXPENSES.length} expenses`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .catch((err) => {
    process.exitCode = 1;
    console.error('Seed failed:', err.message);
  })
  .finally(() => pool.end());
