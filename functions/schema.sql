CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  price REAL NOT NULL CHECK (price >= 0),
  compare_at_price REAL CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  category TEXT NOT NULL CHECK (category IN ('hijabs', 'accessories')),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images_json TEXT NOT NULL DEFAULT '[]',
  variants_json TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(active, category);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  google_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address_json TEXT NOT NULL DEFAULT '{}',
  loyalty_stamps INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_stamps >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  items_json TEXT NOT NULL DEFAULT '[]',
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  shipping_address_json TEXT NOT NULL DEFAULT '{}',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_amount_paise INTEGER CHECK (razorpay_amount_paise IS NULL OR razorpay_amount_paise >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  delivery_status TEXT NOT NULL DEFAULT 'Processing' CHECK (delivery_status IN ('Processing', 'Shipped', 'Delivered')),
  loyalty_stamp_issued INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_stamp_issued IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status, created_at DESC);

CREATE TRIGGER IF NOT EXISTS award_loyalty_stamp_after_delivery
AFTER UPDATE OF loyalty_stamp_issued ON orders
WHEN OLD.loyalty_stamp_issued = 0 AND NEW.loyalty_stamp_issued = 1
BEGIN
  UPDATE customers
  SET loyalty_stamps = loyalty_stamps + 1,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.customer_id;
END;

CREATE TRIGGER IF NOT EXISTS award_stamp_after_payment
AFTER UPDATE OF payment_status ON orders
WHEN OLD.payment_status != 'paid' AND NEW.payment_status = 'paid' AND OLD.loyalty_stamp_issued = 0
BEGIN
  UPDATE orders SET loyalty_stamp_issued = 1 WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_verified ON reviews(product_id, verified, created_at DESC);

CREATE TABLE IF NOT EXISTS review_proofs (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_review_proofs_verified_created ON review_proofs(verified, created_at DESC);

CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_hash TEXT PRIMARY KEY,
  page TEXT NOT NULL CHECK (page IN ('home', 'checkout', 'reviews', 'product', 'other', 'admin')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_active_expiry ON visitor_sessions(active, expires_at);

CREATE TABLE IF NOT EXISTS visitor_actions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_visitor_actions_created ON visitor_actions(created_at DESC);