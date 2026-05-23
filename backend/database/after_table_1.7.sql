USE laptop_ecommerce_db;

ALTER TABLE products
ADD COLUMN device_type VARCHAR(30) NOT NULL DEFAULT 'LAPTOP' AFTER category_id;

ALTER TABLE product_specifications
ADD COLUMN battery_capacity_mah INT DEFAULT NULL AFTER os,
ADD COLUMN refresh_rate_hz INT DEFAULT NULL AFTER battery_capacity_mah,
ADD COLUMN charging_port VARCHAR(50) DEFAULT NULL AFTER refresh_rate_hz,
ADD COLUMN connectivity VARCHAR(255) DEFAULT NULL AFTER charging_port,
ADD COLUMN water_resistance VARCHAR(50) DEFAULT NULL AFTER connectivity,
ADD COLUMN sensors VARCHAR(255) DEFAULT NULL AFTER water_resistance,
ADD COLUMN speaker_type VARCHAR(100) DEFAULT NULL AFTER sensors,
ADD COLUMN extra_specs_json JSON DEFAULT NULL AFTER speaker_type;

ALTER TABLE product_variants
ADD COLUMN extra_specs_json JSON DEFAULT NULL AFTER status;
