-- =======================================================
-- Thêm cột max_discount_amount
-- =======================================================
ALTER TABLE vouchers
ADD COLUMN max_discount_amount DECIMAL(15,2) DEFAULT NULL
    AFTER discount_value;