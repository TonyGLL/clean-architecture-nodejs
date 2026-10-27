-- Up Migration
-- The payments repository reads/writes payments.payment_method (card summary); the original schema only had payment_method_id.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255);

-- Down Migration
ALTER TABLE payments DROP COLUMN IF EXISTS payment_method;
