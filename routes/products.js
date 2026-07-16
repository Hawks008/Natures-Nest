const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products?category=grains
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const result = category
      ? await db.query(
          'SELECT * FROM products WHERE category = $1 AND in_stock = TRUE ORDER BY name',
          [category]
        )
      : await db.query('SELECT * FROM products WHERE in_stock = TRUE ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load product.' });
  }
});

// POST /api/products  (basic admin endpoint to add a new product)
router.post('/', async (req, res) => {
  const { id, name, category, description, weight_label, price, swatch_color } = req.body;
  if (!id || !name || !category || !price) {
    return res.status(400).json({ error: 'id, name, category, and price are required.' });
  }
  try {
    const result = await db.query(
      `INSERT INTO products (id, name, category, description, weight_label, price, swatch_color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, name, category, description || '', weight_label || '', price, swatch_color || '#EDE6D3']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A product with that id already exists.' });
    }
    res.status(500).json({ error: 'Could not create product.' });
  }
});

// PATCH /api/products/:id  (update price, description, stock status, etc.)
router.patch('/:id', async (req, res) => {
  const fields = ['name', 'category', 'description', 'weight_label', 'price', 'swatch_color', 'in_stock'];
  const updates = [];
  const values = [];
  let i = 1;

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${i}`);
      values.push(req.body[field]);
      i++;
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' });
  }

  values.push(req.params.id);
  try {
    const result = await db.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ deleted: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete product.' });
  }
});

module.exports = router;
