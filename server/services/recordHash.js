const crypto = require('crypto');

// BR-007: paid_amount deliberately excluded from the hash so it stays immutable.
function computeRecordHash({ shopId, invoiceCode, totalAmount, createdAt }) {
  const raw = `${shopId}|${invoiceCode}|${Number(totalAmount).toFixed(2)}|${new Date(createdAt).toISOString()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { computeRecordHash };
