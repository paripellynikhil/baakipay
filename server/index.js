require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const expensesRoutes = require('./routes/expenses');
const forecastRoutes = require('./routes/forecast');
const analyticsRoutes = require('./routes/analytics');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) =>
  res.json({ ok: true, service: 'baakipay', time: new Date().toISOString() })
);

app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/analytics', analyticsRoutes);

const path = require('path');
const fs = require('fs');
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}


app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'INVALID_JSON' });
  }
  console.error(err);
  return res.status(500).json({ error: 'SERVER_ERROR' });
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log('BaakiPay API listening on port ' + port));
