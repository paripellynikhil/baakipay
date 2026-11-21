const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!match) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'SERVER_MISCONFIGURED' });
  }
  try {
    const payload = jwt.verify(match[1], secret);
    req.shopId = payload.shopId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

function getEffectivePlan(shop, now = new Date()) {
  if (shop.plan === 'trial' && now > new Date(shop.trial_expires_at)) {
    return 'free';
  }
  return shop.plan;
}

function signToken(shopId) {
  return jwt.sign({ shopId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { requireAuth, getEffectivePlan, signToken };
