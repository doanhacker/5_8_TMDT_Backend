ALTER TABLE orders
ADD COLUMN payment_id INT DEFAULT NULL AFTER voucher_id;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL;