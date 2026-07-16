require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*'
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Generic error handler (catches anything thrown synchronously in routes)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

app.listen(PORT, () => {
  console.log(`Nature's Nest API running on http://localhost:${PORT}`);
});
