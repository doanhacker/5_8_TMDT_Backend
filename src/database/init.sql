CREATE DATABASE IF NOT EXISTS tech_ecommerce_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tech_ecommerce_db;

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  email_verified_at DATETIME DEFAULT NULL,
  customer_type ENUM('new', 'loyal', 'vip') NOT NULL DEFAULT 'new',
  status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS user_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_type ENUM('email_verification', 'password_reset', 'refresh_token') NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addresses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  recipient_name VARCHAR(120) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  ward VARCHAR(120),
  district VARCHAR(120),
  city VARCHAR(120) NOT NULL,
  province VARCHAR(120),
  country VARCHAR(120) NOT NULL DEFAULT 'Vietnam',
  postal_code VARCHAR(20),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brands (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  category_type ENUM(
    'laptop',
    'smartphone',
    'tablet',
    'monitor',
    'keyboard',
    'mouse',
    'headphone',
    'speaker',
    'storage',
    'accessory',
    'other'
  ) NOT NULL DEFAULT 'other',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  brand_id INT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  sku VARCHAR(80) NOT NULL UNIQUE,
  short_description VARCHAR(255),
  description TEXT,
  base_price DECIMAL(12, 2) NOT NULL,
  sale_price DECIMAL(12, 2) DEFAULT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  min_stock_threshold INT NOT NULL DEFAULT 5,
  warranty_months INT UNSIGNED DEFAULT 0,
  product_type ENUM('available', 'preorder', 'custom_order') NOT NULL DEFAULT 'available',
  stock_status ENUM('in_stock', 'low_stock', 'out_of_stock', 'discontinued') NOT NULL DEFAULT 'in_stock',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  total_sold INT UNSIGNED NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
  expected_restock_date DATE DEFAULT NULL,
  thumbnail_url VARCHAR(255),
  specs JSON NULL,
  ai_summary TEXT,
  status ENUM('draft', 'active', 'inactive', 'archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_products_brand
    FOREIGN KEY (brand_id) REFERENCES brands(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  alt_text VARCHAR(180),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  variant_value VARCHAR(120) NOT NULL,
  variant_sku VARCHAR(80) UNIQUE,
  additional_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  specs JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_attributes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  attribute_name VARCHAR(120) NOT NULL,
  attribute_value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_attributes_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  question_content TEXT NOT NULL,
  admin_reply TEXT,
  status ENUM('pending', 'answered', 'hidden') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_questions_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_product_questions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlists_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wishlist_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_wishlist_item (wishlist_id, product_id),
  CONSTRAINT fk_wishlist_items_wishlist
    FOREIGN KEY (wishlist_id) REFERENCES wishlists(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comparison_lists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  session_key VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comparison_lists_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comparison_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comparison_list_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_comparison_item (comparison_list_id, product_id),
  CONSTRAINT fk_comparison_items_list
    FOREIGN KEY (comparison_list_id) REFERENCES comparison_lists(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_comparison_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recently_viewed_products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  session_key VARCHAR(120) NULL,
  product_id INT UNSIGNED NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recently_viewed_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_recently_viewed_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  promotion_name VARCHAR(150) NOT NULL,
  code VARCHAR(50) UNIQUE,
  discount_type ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
  discount_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  min_order_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  max_discount_value DECIMAL(12, 2) DEFAULT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('draft', 'active', 'expired', 'disabled') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL UNIQUE,
  session_key VARCHAR(120) NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cart_item (cart_id, product_id, variant_id),
  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES carts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  address_id INT UNSIGNED NULL,
  promotion_id INT UNSIGNED NULL,
  order_code VARCHAR(50) NOT NULL UNIQUE,
  order_type ENUM('normal', 'preorder', 'custom_order') NOT NULL DEFAULT 'normal',
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method ENUM('cod', 'bank_transfer', 'momo', 'vnpay', 'card') NOT NULL DEFAULT 'cod',
  payment_status ENUM('pending', 'partially_paid', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  order_status ENUM(
    'pending_confirmation',
    'confirmed',
    'processing',
    'waiting_for_stock',
    'shipping',
    'completed',
    'cancelled',
    'returned'
  ) NOT NULL DEFAULT 'pending_confirmation',
  can_cancel BOOLEAN NOT NULL DEFAULT TRUE,
  cancel_reason TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_address
    FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_promotion
    FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  product_name VARCHAR(180) NOT NULL,
  sku VARCHAR(80),
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  item_type ENUM('normal', 'preorder', 'custom_order') NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS preorder_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NULL,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  preorder_code VARCHAR(50) NOT NULL UNIQUE,
  expected_available_date DATE DEFAULT NULL,
  deposit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('waiting_for_stock', 'stock_arrived', 'shipping', 'completed', 'cancelled') NOT NULL DEFAULT 'waiting_for_stock',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_preorder_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_preorder_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_preorder_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_preorder_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  changed_by INT UNSIGNED NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_status_history_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_status_history_user
    FOREIGN KEY (changed_by) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS returns_refunds (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NULL,
  user_id INT UNSIGNED NOT NULL,
  request_type ENUM('return', 'refund', 'exchange') NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_returns_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_returns_item
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_returns_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  payment_code VARCHAR(80) NOT NULL UNIQUE,
  provider VARCHAR(80),
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('cod', 'bank_transfer', 'momo', 'vnpay', 'card') NOT NULL,
  status ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NULL,
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(150),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_order_item
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_locations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  location_name VARCHAR(120) NOT NULL,
  location_type ENUM('warehouse', 'branch') NOT NULL DEFAULT 'warehouse',
  address_line VARCHAR(255),
  city VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_stocks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  location_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_inventory_stock (location_id, product_id, variant_id),
  CONSTRAINT fk_inventory_stock_location
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_inventory_stock_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_inventory_stock_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  location_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  action_type ENUM('import', 'export', 'adjustment', 'reserve', 'release') NOT NULL,
  quantity_change INT NOT NULL,
  reference_type VARCHAR(50),
  reference_id BIGINT UNSIGNED NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_logs_location
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_logs_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_logs_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS support_conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  assigned_staff_id INT UNSIGNED NULL,
  channel_type ENUM('staff_chat', 'ai_chat') NOT NULL,
  status ENUM('open', 'pending', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  subject VARCHAR(180),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_conversations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_support_conversations_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_user_id INT UNSIGNED NULL,
  sender_type ENUM('customer', 'staff', 'ai', 'system') NOT NULL,
  message_type ENUM('text', 'image', 'order_info', 'product_info') NOT NULL DEFAULT 'text',
  message_content TEXT,
  attachment_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES support_conversations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_support_messages_user
    FOREIGN KEY (sender_user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_training_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  document_type ENUM('faq', 'policy', 'product_knowledge', 'conversation_script') NOT NULL,
  content LONGTEXT NOT NULL,
  version VARCHAR(50) DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_models (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(120) NOT NULL UNIQUE,
  model_type ENUM('content_based', 'collaborative', 'hybrid', 'rule_based') NOT NULL,
  version VARCHAR(50) NOT NULL,
  status ENUM('training', 'active', 'inactive') NOT NULL DEFAULT 'inactive',
  config JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  source_product_id INT UNSIGNED NULL,
  recommended_product_id INT UNSIGNED NOT NULL,
  model_id INT UNSIGNED NULL,
  recommendation_reason VARCHAR(255),
  recommendation_context ENUM(
    'homepage',
    'product_detail',
    'cart',
    'ai_assistant',
    'out_of_stock_alternative',
    'upgrade_suggestion'
  ) NOT NULL,
  clicked BOOLEAN NOT NULL DEFAULT FALSE,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendation_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_recommendation_logs_source
    FOREIGN KEY (source_product_id) REFERENCES products(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_recommendation_logs_product
    FOREIGN KEY (recommended_product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_recommendation_logs_model
    FOREIGN KEY (model_id) REFERENCES recommendation_models(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  notification_type ENUM('order', 'promotion', 'price_drop', 'stock_back', 'system') NOT NULL,
  title VARCHAR(180) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME DEFAULT NULL,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loyalty_points (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  points_balance INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_loyalty_points_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_support_conversations_user_id ON support_conversations(user_id);
CREATE INDEX idx_recommendation_logs_user_id ON recommendation_logs(user_id);

INSERT INTO roles (role_name, description)
VALUES
  ('admin', 'System administrator'),
  ('staff', 'Operational staff'),
  ('customer', 'Customer account')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

INSERT INTO brands (name, slug, description)
VALUES
  ('Apple', 'apple', 'Consumer electronics and accessories'),
  ('Samsung', 'samsung', 'Phones, displays and smart devices'),
  ('Asus', 'asus', 'Laptops and gaming devices'),
  ('Dell', 'dell', 'Laptops, monitors and workstations'),
  ('Logitech', 'logitech', 'Computer accessories and peripherals'),
  ('Sony', 'sony', 'Audio and entertainment devices')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

INSERT INTO categories (parent_id, name, slug, category_type, description)
VALUES
  (NULL, 'Laptop', 'laptop', 'laptop', 'Laptop for study, office and gaming'),
  (NULL, 'Dien Thoai', 'dien-thoai', 'smartphone', 'Smartphones and mobile devices'),
  (NULL, 'May Tinh Bang', 'may-tinh-bang', 'tablet', 'Tablet devices'),
  (NULL, 'Man Hinh', 'man-hinh', 'monitor', 'Gaming and office monitors'),
  (NULL, 'Ban Phim', 'ban-phim', 'keyboard', 'Mechanical and office keyboards'),
  (NULL, 'Chuot', 'chuot', 'mouse', 'Gaming and wireless mice'),
  (NULL, 'Tai Nghe', 'tai-nghe', 'headphone', 'Headphones and earphones'),
  (NULL, 'Luu Tru', 'luu-tru', 'storage', 'SSD, HDD and storage devices'),
  (NULL, 'Phu Kien', 'phu-kien', 'accessory', 'Tech accessories')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

INSERT INTO recommendation_models (model_name, model_type, version, status, config)
VALUES
  (
    'default_content_based',
    'content_based',
    '1.0.0',
    'active',
    JSON_OBJECT('features', JSON_ARRAY('brand', 'category', 'price_range', 'specs'))
  ),
  (
    'default_collaborative',
    'collaborative',
    '1.0.0',
    'inactive',
    JSON_OBJECT('signals', JSON_ARRAY('view', 'cart', 'purchase', 'review'))
  )
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  config = VALUES(config);
