-- Nature's Nest database schema
-- Run this once against a fresh PostgreSQL database, e.g.:
--   psql "$DATABASE_URL" -f schema.sql

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  weight_label  TEXT NOT NULL,
  price         NUMERIC(10, 2) NOT NULL,
  swatch_color  TEXT NOT NULL DEFAULT '#EDE6D3',
  in_stock      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | paid | fulfilled | cancelled
  subtotal      NUMERIC(10, 2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES products(id),
  product_name  TEXT NOT NULL,   -- snapshot, in case product name changes later
  unit_price    NUMERIC(10, 2) NOT NULL,  -- snapshot of price at purchase time
  quantity      INTEGER NOT NULL CHECK (quantity > 0)
);

-- Seed data matching the products already in the storefront frontend
INSERT INTO products (id, name, category, description, weight_label, price, swatch_color) VALUES
('jasmine',   'Jasmine rice',              'grains', 'Fragrant long-grain rice, sun-dried and stone-milled.',        '5 kg bag',      38.00, '#D9C79A'),
('brownrice', 'Local brown rice',          'grains', 'Unpolished rice with the bran left on for extra fibre.',       '5 kg bag',      34.00, '#B6996B'),
('millet',    'Pearl millet',              'grains', 'Ground fresh weekly, great for porridge and tuo zaafi.',       '2 kg bag',      22.00, '#C9B27E'),
('shea',      'Cold-pressed shea butter',  'oils',   'Unrefined, hand-whipped, straight from Tamale.',                '500 g jar',     45.00, '#EFE3C6'),
('palmoil',   'Red palm oil',              'oils',   'Traditionally pressed, rich colour and aroma.',                 '1 L bottle',    32.00, '#B5501D'),
('groundnut', 'Groundnut oil',             'oils',   'Cold-pressed from roasted groundnuts, light and nutty.',        '1 L bottle',    29.00, '#D9A441'),
('suya',      'Suya spice mix',            'spices', 'Ground peanut and pepper blend, hand-mixed in small batches.',  '250 g pouch',   18.00, '#9C4A2C'),
('ginger',    'Dried ginger powder',       'spices', 'Sun-dried root, ground fine, no anti-caking agents.',           '150 g pouch',   14.00, '#C89116'),
('pepper',    'Dried chilli pepper',       'spices', 'Sun-dried whole peppers, coarsely ground.',                     '200 g pouch',   16.00, '#8C2C1E'),
('plantain',  'Plantain chips',            'dried',  'Thin-sliced and lightly salted, no palm oil residue.',          '150 g bag',     12.00, '#E1C24A'),
('coconut',   'Dried coconut flakes',      'dried',  'Toasted lightly for snacking or baking.',                       '200 g bag',     15.00, '#EDE6D3'),
('kokonte',   'Kokonte flour',             'dried',  'Sun-dried cassava, milled fine, no bleaching.',                 '1 kg bag',      20.00, '#D7C9A3');
