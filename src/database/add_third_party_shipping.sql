USE tech_ecommerce_db;

CREATE TABLE IF NOT EXISTS shipping_providers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_name VARCHAR(120) NOT NULL UNIQUE,
  provider_code VARCHAR(50) NOT NULL UNIQUE,
  api_base_url VARCHAR(255),
  tracking_url_template VARCHAR(255),
  supports_cod BOOLEAN NOT NULL DEFAULT TRUE,
  supports_insurance BOOLEAN NOT NULL DEFAULT FALSE,
  supports_webhook BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  config JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipping_services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id INT UNSIGNED NOT NULL,
  service_name VARCHAR(120) NOT NULL,
  service_code VARCHAR(50) NOT NULL,
  service_type ENUM('standard', 'express', 'same_day', 'economy', 'custom') NOT NULL DEFAULT 'standard',
  estimated_delivery_min_days INT UNSIGNED DEFAULT NULL,
  estimated_delivery_max_days INT UNSIGNED DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_shipping_service (provider_id, service_code),
  CONSTRAINT fk_shipping_services_provider
    FOREIGN KEY (provider_id) REFERENCES shipping_providers(id)
    ON DELETE CASCADE
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_provider_id INT UNSIGNED NULL AFTER promotion_id,
  ADD COLUMN IF NOT EXISTS shipping_service_id INT UNSIGNED NULL AFTER shipping_provider_id;

SET @has_fk_orders_shipping_provider := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND CONSTRAINT_NAME = 'fk_orders_shipping_provider'
);

SET @sql_fk_orders_shipping_provider := IF(
  @has_fk_orders_shipping_provider = 0,
  'ALTER TABLE orders ADD CONSTRAINT fk_orders_shipping_provider FOREIGN KEY (shipping_provider_id) REFERENCES shipping_providers(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_fk_orders_shipping_provider;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk_orders_shipping_service := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND CONSTRAINT_NAME = 'fk_orders_shipping_service'
);

SET @sql_fk_orders_shipping_service := IF(
  @has_fk_orders_shipping_service = 0,
  'ALTER TABLE orders ADD CONSTRAINT fk_orders_shipping_service FOREIGN KEY (shipping_service_id) REFERENCES shipping_services(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_fk_orders_shipping_service;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS shipments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  shipping_provider_id INT UNSIGNED NOT NULL,
  shipping_service_id INT UNSIGNED NULL,
  shipment_code VARCHAR(80) NOT NULL UNIQUE,
  tracking_number VARCHAR(120) UNIQUE,
  external_order_code VARCHAR(120),
  external_shipment_id VARCHAR(120),
  shipping_status ENUM(
    'pending',
    'ready_to_pick',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'delivery_failed',
    'returned',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',
  cod_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  insurance_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  sender_name VARCHAR(120),
  sender_phone VARCHAR(20),
  sender_address TEXT,
  receiver_name VARCHAR(120),
  receiver_phone VARCHAR(20),
  receiver_address TEXT,
  expected_pickup_at DATETIME DEFAULT NULL,
  expected_delivery_at DATETIME DEFAULT NULL,
  shipped_at DATETIME DEFAULT NULL,
  delivered_at DATETIME DEFAULT NULL,
  cancelled_at DATETIME DEFAULT NULL,
  provider_response JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_shipments_provider
    FOREIGN KEY (shipping_provider_id) REFERENCES shipping_providers(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_shipments_service
    FOREIGN KEY (shipping_service_id) REFERENCES shipping_services(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shipment_tracking_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id BIGINT UNSIGNED NOT NULL,
  tracking_status VARCHAR(80) NOT NULL,
  tracking_description VARCHAR(255),
  tracking_location VARCHAR(180),
  event_time DATETIME DEFAULT NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_tracking_logs_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipping_webhook_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipping_provider_id INT UNSIGNED NOT NULL,
  webhook_event VARCHAR(120) NOT NULL,
  external_reference VARCHAR(120),
  signature VARCHAR(255),
  payload JSON NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at DATETIME DEFAULT NULL,
  error_message VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipping_webhook_logs_provider
    FOREIGN KEY (shipping_provider_id) REFERENCES shipping_providers(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_orders_shipping_provider_id ON orders(shipping_provider_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipment_tracking_logs_shipment_id ON shipment_tracking_logs(shipment_id);
CREATE INDEX idx_shipping_webhook_logs_provider_id ON shipping_webhook_logs(shipping_provider_id);

INSERT INTO shipping_providers (
  provider_name,
  provider_code,
  api_base_url,
  tracking_url_template,
  supports_cod,
  supports_insurance,
  supports_webhook,
  status,
  config
)
VALUES
  (
    'Giao Hang Nhanh',
    'GHN',
    'https://online-gateway.ghn.vn',
    'https://donhang.ghn.vn/?order_code={tracking_number}',
    TRUE,
    TRUE,
    TRUE,
    'active',
    JSON_OBJECT('sandbox', TRUE)
  ),
  (
    'Giao Hang Tiet Kiem',
    'GHTK',
    'https://services.giaohangtietkiem.vn',
    'https://i.ghtk.vn/{tracking_number}',
    TRUE,
    TRUE,
    TRUE,
    'active',
    JSON_OBJECT('sandbox', TRUE)
  ),
  (
    'Viettel Post',
    'VTPOST',
    'https://partner.viettelpost.vn',
    'https://viettelpost.vn/tra-cuu-hanh-trinh-don/?billcode={tracking_number}',
    TRUE,
    TRUE,
    TRUE,
    'active',
    JSON_OBJECT('sandbox', TRUE)
  )
ON DUPLICATE KEY UPDATE
  api_base_url = VALUES(api_base_url),
  tracking_url_template = VALUES(tracking_url_template),
  supports_cod = VALUES(supports_cod),
  supports_insurance = VALUES(supports_insurance),
  supports_webhook = VALUES(supports_webhook),
  status = VALUES(status),
  config = VALUES(config);

INSERT INTO shipping_services (
  provider_id,
  service_name,
  service_code,
  service_type,
  estimated_delivery_min_days,
  estimated_delivery_max_days,
  is_active,
  config
)
SELECT
  sp.id,
  service_data.service_name,
  service_data.service_code,
  service_data.service_type,
  service_data.min_days,
  service_data.max_days,
  TRUE,
  JSON_OBJECT('default_service', TRUE)
FROM shipping_providers sp
JOIN (
  SELECT 'GHN' AS provider_code, 'Giao Hang Tieu Chuan' AS service_name, 'STANDARD' AS service_code, 'standard' AS service_type, 2 AS min_days, 5 AS max_days
  UNION ALL
  SELECT 'GHN', 'Giao Hang Nhanh', 'EXPRESS', 'express', 1, 2
  UNION ALL
  SELECT 'GHTK', 'Giao Hang Tieu Chuan', 'STANDARD', 'standard', 2, 5
  UNION ALL
  SELECT 'VTPOST', 'Chuyen Phat Nhanh', 'EXPRESS', 'express', 1, 3
) AS service_data
  ON sp.provider_code = service_data.provider_code
ON DUPLICATE KEY UPDATE
  service_name = VALUES(service_name),
  service_type = VALUES(service_type),
  estimated_delivery_min_days = VALUES(estimated_delivery_min_days),
  estimated_delivery_max_days = VALUES(estimated_delivery_max_days),
  is_active = VALUES(is_active),
  config = VALUES(config);
