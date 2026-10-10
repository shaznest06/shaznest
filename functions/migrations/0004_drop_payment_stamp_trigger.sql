-- Loyalty stamps must follow delivery (admin action), not payment.
DROP TRIGGER IF EXISTS award_stamp_after_payment;
