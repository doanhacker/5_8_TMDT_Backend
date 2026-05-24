-- =========================================================================
-- DATABASE INITIALIZATION SCRIPT FOR E-COMMERCE & AI SYSTEM
-- =========================================================================

CREATE DATABASE IF NOT EXISTS laptop_ecommerce_db;
USE laptop_ecommerce_db;

-- =========================================================================
-- GROUP 1: USERS & ROLES
-- =========================================================================

-- 1. users (btl_NGUOI_DUNG)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    status ENUM('ACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. roles (btl_VAI_TRO)
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- 3. user_roles (btl_VAI_TRO_NGUOI_DUNG)
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
);

-- 4. user_addresses (btl_DIA_CHI_NGUOI_DUNG)
CREATE TABLE IF NOT EXISTS user_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(15) NOT NULL,
    specific_address VARCHAR(255) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================================================
-- GROUP 2: CATALOG (CATEGORIES, BRANDS, PRODUCTS)
-- =========================================================================

-- 5. brands (btl_THUONG_HIEU)
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL,
    logo_url VARCHAR(255),
    device_type ENUM('LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    UNIQUE KEY uniq_brand_name_device_type (brand_name, device_type)
);

-- 6. categories (btl_DANH_MUC)
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INT DEFAULT NULL,
    device_type ENUM('LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- 7. products (btl_SAN_PHAM)
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    brand_id INT,
    category_id INT,
    original_price DECIMAL(15,2) NOT NULL,
    discount_price DECIMAL(15,2) DEFAULT NULL,
    stock_quantity INT DEFAULT 0,
    status ENUM('IN_STOCK', 'OUT_OF_STOCK', 'COMING_SOON', 'DISCONTINUED') DEFAULT 'IN_STOCK',
    description_html LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

-- 8. product_specifications (btl_THONG_SO_KY_THUAT)
CREATE TABLE IF NOT EXISTS product_specifications (
    spec_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNIQUE NOT NULL,
    cpu_name VARCHAR(100),
    cpu_benchmark_score INT,
    ram_gb INT,
    ram_type VARCHAR(50),
    storage_gb INT,
    gpu VARCHAR(100),
    screen_size FLOAT,
    weight_kg FLOAT,
    os VARCHAR(50),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 9. product_images (btl_HINH_ANH_SAN_PHAM)
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- =========================================================================
-- GROUP 3: INVENTORY
-- =========================================================================

-- 10. import_receipts (btl_PHIEU_NHAP)
CREATE TABLE IF NOT EXISTS import_receipts (
    receipt_id INT AUTO_INCREMENT PRIMARY KEY,
    importer_id INT,
    supplier_name VARCHAR(255),
    total_import_cost DECIMAL(15,2) NOT NULL,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (importer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 11. import_receipt_details (btl_CHI_TIET_PHIEU_NHAP)
CREATE TABLE IF NOT EXISTS import_receipt_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT NOT NULL,
    product_id INT NOT NULL,
    import_quantity INT NOT NULL,
    unit_import_price DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES import_receipts(receipt_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

-- =========================================================================
-- GROUP 4: PROMOTIONS & CART
-- =========================================================================

-- 12. vouchers (btl_MA_GIAM_GIA)
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    min_order_value DECIMAL(15,2) DEFAULT 0,
    remaining_quantity INT DEFAULT 0,
    expiration_date DATETIME NOT NULL
);

-- 13. carts (btl_GIO_HANG)
CREATE TABLE IF NOT EXISTS carts (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 14. cart_details (btl_CHI_TIET_GIO_HANG)
CREATE TABLE IF NOT EXISTS cart_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- =========================================================================
-- GROUP 5: ORDERS & PAYMENTS
-- =========================================================================

-- 15. orders (btl_DON_HANG)
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_id INT,
    voucher_id INT DEFAULT NULL,
    order_type ENUM('NORMAL', 'PRE_ORDER') DEFAULT 'NORMAL',
    status ENUM('PENDING_CONFIRMATION', 'WAITING_FOR_STOCK', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING_CONFIRMATION',
    subtotal DECIMAL(15,2) NOT NULL,
    shipping_fee DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_date DATE DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (address_id) REFERENCES user_addresses(address_id) ON DELETE SET NULL,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id) ON DELETE SET NULL
);

-- 16. order_details (btl_CHI_TIET_DON_HANG)
CREATE TABLE IF NOT EXISTS order_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

-- 17. payments (btl_THANH_TOAN)
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNIQUE NOT NULL,
    payment_method ENUM('COD', 'VNPAY', 'MOMO') NOT NULL,
    payment_status ENUM('UNPAID', 'DEPOSITED', 'PAID', 'REFUNDED') DEFAULT 'UNPAID',
    transaction_id VARCHAR(100) DEFAULT NULL,
    payment_date TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- =========================================================================
-- GROUP 6: INTERACTION & E-MARKETING
-- =========================================================================

-- 18. product_reviews (btl_DANH_GIA_SAN_PHAM)
CREATE TABLE IF NOT EXISTS product_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 19. product_qa (btl_CAU_HOI_SAN_PHAM)
CREATE TABLE IF NOT EXISTS product_qa (
    qa_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    question_content TEXT NOT NULL,
    answer_content TEXT,
    replier_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (replier_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 20. user_behaviors (btl_HANH_VI_NGUOI_DUNG)
CREATE TABLE IF NOT EXISTS user_behaviors (
    behavior_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(255) DEFAULT NULL,
    product_id INT NOT NULL,
    behavior_type ENUM('VIEW', 'ADD_TO_CART', 'PURCHASE') NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- =========================================================================
-- GROUP 7: AI ASSISTANT & CHAT
-- =========================================================================

-- 21. ai_chat_logs (btl_NHAT_KY_CHAT_AI)
CREATE TABLE IF NOT EXISTS ai_chat_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INT DEFAULT NULL,
    sender_type ENUM('USER', 'BOT') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 22. chat_rooms (btl_PHONG_CHAT)
CREATE TABLE IF NOT EXISTS chat_rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    staff_id INT DEFAULT NULL,
    status ENUM('WAITING', 'ACTIVE', 'CLOSED') DEFAULT 'WAITING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 23. chat_messages (btl_TIN_NHAN_CHAT)
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('CUSTOMER', 'STAFF') NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('TEXT', 'IMAGE') DEFAULT 'TEXT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================================================
-- GROUP 8: NEWS, BLOGS & BANNERS, NOTIFICATIONS
-- =========================================================================

-- 24. blog_categories (btl_TIN_TUC_DANH_MUC)
CREATE TABLE IF NOT EXISTS blog_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. blog_posts (btl_TIN_TUC_BAI_VIET)
CREATE TABLE IF NOT EXISTS blog_posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    author_id INT,
    title VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    content_html LONGTEXT NOT NULL,
    view_count INT DEFAULT 0,
    status ENUM('DRAFT', 'PUBLISHED', 'HIDDEN') DEFAULT 'DRAFT',
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES blog_categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 26. slider_banners (btl_SLIDER_BANNER)
CREATE TABLE IF NOT EXISTS slider_banners (
    slider_id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT,
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    link_url VARCHAR(255),
    display_order INT DEFAULT 0,
    status ENUM('VISIBLE', 'HIDDEN') DEFAULT 'VISIBLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 27. notifications (btl_THONG_BAO)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type ENUM('ORDER', 'PROMOTION', 'SYSTEM', 'NEWS') NOT NULL,
    link_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);