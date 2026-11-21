const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/db');
const { sendOtp, verifyOtp } = require('../services/otpService');
const { signToken, getEffectivePlan } = require('../middleware/auth');

const router = express.Router();

const PUBLIC_COLUMNS = `id, email_or_phone, shop_name, owner_name, bio, address, upi_id, cash_in_hand,
  default_credit_limit, default_due_days, language, plan, trial_expires_at, onboarded, created_at`;

function publicShop(row) {
  const { password_hash, ...rest } = row; // eslint-disable-line no-unused-vars
  return rest;
}

// API-001
router.post('/register', async (req, res, next) => {
  try {
    const { emailOrPhone, password, shopName, ownerName } = req.body || {};
    if (!emailOrPhone || !password || !shopName || !ownerName) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'emailOrPhone, password, shopName and ownerName are required',
      });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters',
      });
    }
    const exists = await pool.query('SELECT id FROM shops WHERE email_or_phone = $1', [emailOrPhone]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'ACCOUNT_EXISTS' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO shops (email_or_phone, password_hash, shop_name, owner_name)
       VALUES ($1, $2, $3, $4) RETURNING ${PUBLIC_COLUMNS}`,
      [emailOrPhone, passwordHash, shopName, ownerName]
    );
    const row = result.rows[0];
    return res.status(201).json({
      token: signToken(row.id),
      shop: publicShop(row),
      effectivePlan: getEffectivePlan(row),
    });
  } catch (err) {
    next(err);
  }
});

// API-002
router.post('/login', async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body || {};
    const result = await pool.query('SELECT * FROM shops WHERE email_or_phone = $1', [emailOrPhone]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(String(password || ''), row.password_hash))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    return res.status(200).json({
      token: signToken(row.id),
      shop: publicShop(row),
      effectivePlan: getEffectivePlan(row),
    });
  } catch (err) {
    next(err);
  }
});

// API-003
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { emailOrPhone } = req.body || {};
    const result = await pool.query('SELECT id FROM shops WHERE email_or_phone = $1', [emailOrPhone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    }
    const otpResult = await sendOtp(emailOrPhone);
    return res.status(200).json({ message: 'OTP sent to registered phone/email', ...otpResult });
  } catch (err) {
    if (err.code === 'OTP_PROVIDER_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'OTP_PROVIDER_NOT_CONFIGURED' });
    }
    next(err);
  }
});

// API-004
router.post('/reset-password', async (req, res, next) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body || {};
    if (!verifyOtp(otp)) {
      return res.status(400).json({ error: 'INVALID_OTP' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'New password must be at least 8 characters',
      });
    }
    const result = await pool.query('SELECT id FROM shops WHERE email_or_phone = $1', [emailOrPhone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE shops SET password_hash = $1 WHERE id = $2', [passwordHash, result.rows[0].id]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
