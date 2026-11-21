require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const expensesRoutes = require('./routes/expenses');
const forecastRoutes = require('./routes/forecast');

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
