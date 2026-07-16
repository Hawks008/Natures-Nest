const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/orders
// body: { customerName, email, phone, address, items: [{ productId, quantity }] }
//
// Prices are always re-read from the database here, never trusted from the
// client, so someone tampering with the frontend cart can't change what they pay.
router.post('/', async (req, res) => {
  const { customerName, email, phone, address, items } = req.body;

  if (!customerName || !email) {
    return res.status(400).json({ error: 'customerName and email are required.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const productIds = items.map((item) => item.productId);
    const productResult = await client.query(
      'SELECT id, name, price FROM products WHERE id = ANY($1) AND in_stock = TRUE',
      [productIds]
    );

    const productsById = {};
    productResult.rows.forEach((p) => { productsById[p.id] = p; });

    let subtotal = 0;
    const lineItems = [];

    for (const item of items) {
      const product = productsById[item.productId];
      if (!product) {
        throw new Error(`Product "${item.productId}" is unavailable.`);
      }
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for "${item.productId}".`);
      }
      const lineTotal = Number(product.price) * quantity;
      subtotal += lineTotal;
      lineItems.push({ product, quantity });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, email, phone, address, subtotal, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [customerName, email, phone || null, address || null, subtotal.toFixed(2)]
    );
    const order = orderResult.rows[0];

    for (const { product, quantity } of lineItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, product.id, product.name, product.price, quantity]
      );
    }

    await client.query('COMMIT');

    // Placeholder for payment: swap this block for a real Stripe/Paystack
    // charge once you have an account set up, then update order status
    // based on the payment result instead of marking it pending.
    res.status(201).json({
      order,
      items: lineItems.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity
      })),
      payment: {
        status: 'not_processed',
        note: 'Payment integration is a placeholder. Wire up a real provider before going live.'
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message || 'Could not create order.' });
  } finally {
    client.release();
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const itemsResult = await db.query(
      'SELECT product_id, product_name, unit_price, quantity FROM order_items WHERE order_id = $1',
      [req.params.id]
    );
    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load order.' });
  }
});

// GET /api/orders  (basic admin listing, most recent first)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

// PATCH /api/orders/:id/status   body: { status: 'paid' | 'fulfilled' | 'cancelled' }
router.patch('/:id/status', async (req, res) => {
  const allowed = ['pending', 'paid', 'fulfilled', 'cancelled'];
  const { status } = req.body;
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update order status.' });
  }
});

module.exports = router;
