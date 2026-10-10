ALTER TABLE orders ADD COLUMN shipping_address_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN razorpay_payment_id TEXT;
ALTER TABLE orders ADD COLUMN razorpay_amount_paise INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);

DROP TRIGGER IF EXISTS award_loyalty_stamp_after_delivery;
CREATE TRIGGER award_loyalty_stamp_after_delivery
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