USE laptop_ecommerce_db;

ALTER TABLE users
ADD COLUMN token_version INT NOT NULL DEFAULT 1 AFTER status;