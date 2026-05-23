-- =========================================================================
-- SEED DATA FOR INITIAL SETUP
-- =========================================================================

USE laptop_ecommerce_db;

-- Insert default roles
INSERT INTO roles (role_id, role_name) VALUES 
(1, 'ADMIN'),
(2, 'STAFF'),
(3, 'CUSTOMER')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Insert sample slider banners
INSERT INTO slider_banners (title, image_url, link_url, display_order, status) VALUES
('Summer Sale 2024', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200', 'https://example.com/sale', 1, 'VISIBLE'),
('New Arrivals', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200', 'https://example.com/new', 2, 'VISIBLE'),
('Gaming Laptops', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1200', 'https://example.com/gaming', 3, 'VISIBLE')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Insert sample brands
INSERT INTO brands (brand_name, logo_url) VALUES
('ASUS', 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg'),
('Dell', 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg'),
('HP', 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg'),
('Lenovo', 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg'),
('MSI', 'https://upload.wikimedia.org/wikipedia/commons/7/7e/MSI_Logo.svg'),
('Acer', 'https://upload.wikimedia.org/wikipedia/commons/0/00/Acer_2011.svg')
ON DUPLICATE KEY UPDATE brand_name = VALUES(brand_name);

-- Insert sample categories
INSERT INTO categories (category_name, parent_category_id) VALUES
('Điện thoại', NULL),
('Laptop', NULL),
('Tablet', NULL),
('Smartwatch', NULL),
('Tai nghe', NULL),
('Phụ kiện', NULL),
('Màn hình, Máy in', NULL),
('Máy cũ, Thu cũ', NULL),
('Dịch vụ tiện ích', NULL),
('Laptop Gaming', NULL),
('Laptop Văn Phòng', NULL),
('Laptop Đồ Họa', NULL),
('Laptop Sinh Viên', NULL),
('Laptop Cao Cấp', NULL)
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

-- Insert sample admin user (password: admin123)
-- Password hash cho 'admin123' với bcrypt salt rounds = 10
INSERT INTO users (email, password_hash, full_name, phone_number, status) VALUES
('admin@laptop-shop.com', '$2b$10$rZ7Yx5J5J5J5J5J5J5J5J5uXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Admin System', '0900000000', 'ACTIVE')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Gán role ADMIN cho user admin (user_id = 1, role_id = 1)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- Insert sample vouchers
INSERT INTO vouchers (voucher_code, discount_type, discount_value, min_order_value, remaining_quantity, expiration_date) VALUES
('WELCOME10', 'PERCENTAGE', 10.00, 5000000, 100, '2026-12-31 23:59:59'),
('SUMMER500K', 'FIXED_AMOUNT', 500000.00, 10000000, 50, '2026-06-30 23:59:59'),
('NEWUSER15', 'PERCENTAGE', 15.00, 3000000, 200, '2026-12-31 23:59:59')
ON DUPLICATE KEY UPDATE voucher_code = VALUES(voucher_code);

-- Insert blog categories
INSERT INTO blog_categories (category_name, description) VALUES
('Tin Công Nghệ', 'Tin tức và xu hướng công nghệ mới nhất'),
('Hướng Dẫn', 'Hướng dẫn sử dụng và bảo trì laptop'),
('Đánh Giá Sản Phẩm', 'Đánh giá chi tiết các sản phẩm laptop')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

COMMIT;


-- TEST PAYMENT--

-- =========================================================================
-- MOCK DATA — Test chức năng thanh toán VNPAY / COD
-- Chạy theo thứ tự từ trên xuống (có FK dependency)
-- Xóa data cũ trước khi insert để tránh trùng
-- =========================================================================

USE laptop_ecommerce_db;

-- =========================================================================
-- BƯỚC 0: XÓA DATA CŨ (theo thứ tự FK ngược lại)
-- =========================================================================
DELETE FROM payments          WHERE order_id    IN (SELECT order_id FROM orders WHERE user_id IN (901,902,903));
DELETE FROM order_details     WHERE order_id    IN (SELECT order_id FROM orders WHERE user_id IN (901,902,903));
DELETE FROM orders            WHERE user_id     IN (901,902,903);
DELETE FROM product_variants  WHERE product_id  IN (SELECT product_id FROM products WHERE brand_id IN (SELECT brand_id FROM brands WHERE brand_name IN ('Dell Mock','Apple Mock','Asus Mock')));
DELETE FROM product_specifications WHERE product_id IN (SELECT product_id FROM products WHERE brand_id IN (SELECT brand_id FROM brands WHERE brand_name IN ('Dell Mock','Apple Mock','Asus Mock')));
DELETE FROM products          WHERE brand_id    IN (SELECT brand_id FROM brands WHERE brand_name IN ('Dell Mock','Apple Mock','Asus Mock'));
DELETE FROM user_addresses    WHERE user_id     IN (901,902,903);
DELETE FROM user_roles        WHERE user_id     IN (901,902,903);
DELETE FROM users             WHERE user_id     IN (901,902,903);
DELETE FROM brands            WHERE brand_name  IN ('Dell Mock','Apple Mock','Asus Mock');
DELETE FROM categories        WHERE category_name = 'Laptop Mock';

-- =========================================================================
-- BƯỚC 1: CATEGORIES
-- =========================================================================
INSERT INTO categories (category_id, category_name, parent_category_id) VALUES
(901, 'Laptop Mock', NULL);

-- =========================================================================
-- BƯỚC 2: BRANDS
-- =========================================================================
INSERT INTO brands (brand_id, brand_name, logo_url) VALUES
(901, 'Dell Mock',  NULL),
(902, 'Apple Mock', NULL),
(903, 'Asus Mock',  NULL);

-- =========================================================================
-- BƯỚC 3: PRODUCTS
-- ✅ Không có original_price / discount_price / stock_quantity / status
--    (đã bị xóa theo alter_tables_1.1.sql — chuyển xuống product_variants)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, description_html, highlight_features) VALUES
(901, 'Dell XPS 15 Mock',       901, 901, '<p>Mock laptop Dell XPS 15</p>',       'Màn hình OLED, Pin 86Wh'),
(902, 'MacBook Pro M3 Mock',     902, 901, '<p>Mock laptop MacBook Pro M3</p>',    'Chip M3, Màn hình Liquid Retina'),
(903, 'Asus ROG Strix G16 Mock', 903, 901, '<p>Mock laptop Asus ROG Strix</p>',   'RTX 4070, Tản nhiệt ROG');

-- =========================================================================
-- BƯỚC 4: PRODUCT_SPECIFICATIONS
-- ✅ Đã xóa cpu_name, cpu_benchmark_score, gpu, ram_gb, ram_type, storage_gb
--    (theo alter_tables_1.1.sql — chuyển xuống product_variants)
-- Chỉ còn: spec_id, product_id, screen_size, weight_kg, os
-- =========================================================================
INSERT INTO product_specifications (product_id, screen_size, weight_kg, os) VALUES
(901, 15.6, 1.86, 'Windows 11'),
(902, 14.2, 1.55, 'macOS Sonoma'),
(903, 16.0, 2.50, 'Windows 11');

-- =========================================================================
-- BƯỚC 5: PRODUCT_VARIANTS
-- ✅ Theo cấu trúc mới trong alter_tables_1.1.sql
-- cpu_name, cpu_benchmark_score, gpu, ram_gb, ram_type, storage_gb chuyển xuống đây
-- =========================================================================
INSERT INTO product_variants (
    variant_id, product_id, sku,
    cpu_name, cpu_benchmark_score, gpu,
    ram_gb, ram_type, storage_gb,
    color_name,
    original_price, discount_price, stock_quantity, status
) VALUES
-- Dell XPS 15 — 2 biến thể
(901, 901, 'DELL-XPS15-i7-16-512-SILVER',
    'Intel Core i7-13700H', 18500, 'NVIDIA RTX 4060',
    16, 'DDR5', 512,
    'Bạc',
    35000000, 32000000, 10, 'IN_STOCK'),

(902, 901, 'DELL-XPS15-i9-32-1TB-BLACK',
    'Intel Core i9-13900H', 22000, 'NVIDIA RTX 4070',
    32, 'DDR5', 1024,
    'Đen',
    52000000, 48000000, 5, 'IN_STOCK'),

-- MacBook Pro M3 — 2 biến thể
(903, 902, 'MBP-M3-16-512-SILVER',
    'Apple M3 Pro', 25000, 'Apple M3 Pro GPU 18-core',
    16, 'Unified', 512,
    'Bạc',
    49000000, NULL, 8, 'IN_STOCK'),

(904, 902, 'MBP-M3-MAX-64-2TB-BLACK',
    'Apple M3 Max', 35000, 'Apple M3 Max GPU 40-core',
    64, 'Unified', 2048,
    'Đen không gian',
    89000000, NULL, 3, 'IN_STOCK'),

-- Asus ROG — 1 biến thể
(905, 903, 'ASUS-ROG-G16-R9-16-512-BLACK',
    'AMD Ryzen 9 7945HX', 28000, 'NVIDIA RTX 4070 Ti',
    16, 'DDR5', 512,
    'Đen',
    42000000, 38000000, 7, 'IN_STOCK');

-- =========================================================================
-- BƯỚC 6: USERS (mock users để test)
-- =========================================================================
INSERT INTO users (user_id, email, password_hash, full_name, phone_number, status) VALUES
(901, 'test_user1@mock.com', '$2b$10$mockhashmockhashmockha1', 'Nguyen Van Test',  '0901111111', 'ACTIVE'),
(902, 'test_user2@mock.com', '$2b$10$mockhashmockhashmockha2', 'Tran Thi Mock',    '0902222222', 'ACTIVE'),
(903, 'test_user3@mock.com', '$2b$10$mockhashmockhashmockha3', 'Le Van Demo',      '0903333333', 'ACTIVE');

-- =========================================================================
-- BƯỚC 7: USER_ADDRESSES
-- =========================================================================
INSERT INTO user_addresses (address_id, user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default) VALUES
(901, 901, 'Nguyen Van Test',  '0901111111', '123 Nguyen Trai',    'Phuong Thuong Dinh', 'Thanh Xuan',  'Ha Noi',   TRUE),
(902, 902, 'Tran Thi Mock',    '0902222222', '456 Le Loi',         'Phuong Ben Nghe',    'Quan 1',      'TP.HCM',   TRUE),
(903, 903, 'Le Van Demo',      '0903333333', '789 Tran Phu',       'Phuong Hai Chau 1',  'Hai Chau',    'Da Nang',  TRUE);

-- =========================================================================
-- BƯỚC 8: ORDERS
-- Tạo các đơn hàng ở các trạng thái khác nhau để cover mọi test case
-- =========================================================================
INSERT INTO orders (
    order_id, user_id, address_id, voucher_id, order_type, status,
    subtotal, shipping_fee, discount_amount, total_amount,
    order_date, estimated_delivery_date
) VALUES

-- ✅ TEST CASE 1: Order sẵn sàng thanh toán VNPAY (PENDING_CONFIRMATION)
(901, 901, 901, NULL, 'NORMAL', 'PENDING_CONFIRMATION',
    32000000, 0, 0, 32000000,
    NOW(), DATE_ADD(CURDATE(), INTERVAL 5 DAY)),

-- ✅ TEST CASE 2: Order sẵn sàng thanh toán COD (PENDING_CONFIRMATION)
(902, 902, 902, NULL, 'NORMAL', 'PENDING_CONFIRMATION',
    49000000, 0, 0, 49000000,
    NOW(), DATE_ADD(CURDATE(), INTERVAL 5 DAY)),

-- ✅ TEST CASE 3: Order WAITING_FOR_STOCK — vẫn có thể thanh toán
(903, 903, 903, NULL, 'NORMAL', 'WAITING_FOR_STOCK',
    38000000, 0, 0, 38000000,
    NOW(), DATE_ADD(CURDATE(), INTERVAL 7 DAY)),

-- ❌ TEST CASE 4: Order đang PROCESSING — không thể tạo payment mới
(904, 901, 901, NULL, 'NORMAL', 'PROCESSING',
    89000000, 0, 0, 89000000,
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY)),

-- ❌ TEST CASE 5: Order đã COMPLETED — không thể tạo payment mới
(905, 902, 902, NULL, 'NORMAL', 'COMPLETED',
    42000000, 30000, 0, 42030000,
    DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY)),

-- ❌ TEST CASE 6: Order đã CANCELLED — không thể tạo payment mới
(906, 903, 903, NULL, 'NORMAL', 'CANCELLED',
    32000000, 0, 0, 32000000,
    DATE_SUB(NOW(), INTERVAL 3 DAY), NULL),

-- ✅ TEST CASE 7: Order đã có payment VNPAY UNPAID — test duplicate & updateStatus
(907, 901, 901, NULL, 'NORMAL', 'PROCESSING',
    52000000, 0, 0, 52000000,
    DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY)),

-- ✅ TEST CASE 8: Order đã có payment COD UNPAID — test updateStatus PAID/REFUNDED
(908, 902, 902, NULL, 'NORMAL', 'SHIPPING',
    32000000, 30000, 0, 32030000,
    DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY));

-- =========================================================================
-- BƯỚC 9: ORDER_DETAILS
-- ✅ Dùng variant_id theo alter_tables_1.1.sql (không còn product_id)
-- =========================================================================
INSERT INTO order_details (order_id, variant_id, quantity, price_at_purchase) VALUES
-- Order 901: 1 Dell XPS 15 bạc
(901, 901, 1, 32000000),

-- Order 902: 1 MacBook Pro M3 bạc
(902, 903, 1, 49000000),

-- Order 903: 1 Asus ROG
(903, 905, 1, 38000000),

-- Order 904: 1 MacBook Pro M3 Max đen
(904, 904, 1, 89000000),

-- Order 905: 1 Asus ROG (đã hoàn thành)
(905, 905, 1, 42000000),

-- Order 906: 1 Dell XPS 15 bạc (đã hủy)
(906, 901, 1, 32000000),

-- Order 907: 1 Dell XPS 15 đen
(907, 902, 1, 52000000),

-- Order 908: 1 Dell XPS 15 bạc
(908, 901, 1, 32000000);

-- =========================================================================
-- BƯỚC 10: PAYMENTS
-- Chỉ tạo payment cho các order đã qua giai đoạn PENDING_CONFIRMATION
-- (Order 901, 902, 903 chưa có payment → dùng để test POST /process)
-- =========================================================================
INSERT INTO payments (order_id, payment_method, payment_status, transaction_id, payment_date) VALUES

-- Order 904 (PROCESSING): VNPAY đã PAID
(904, 'VNPAY', 'PAID', 'VNP_TXN_MOCK_904', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Order 905 (COMPLETED): COD đã PAID
(905, 'COD',   'PAID', NULL,               DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Order 906 (CANCELLED): COD REFUNDED
(906, 'COD',   'REFUNDED', NULL,           DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Order 907 (PROCESSING): VNPAY UNPAID → test duplicate payment & updateStatus
(907, 'VNPAY', 'UNPAID', NULL,             NULL),

-- Order 908 (SHIPPING): COD UNPAID → test updateStatus PAID
(908, 'COD',   'UNPAID', NULL,             NULL);

-- =========================================================================
-- KIỂM TRA KẾT QUẢ
-- =========================================================================
SELECT
    o.order_id,
    o.status        AS order_status,
    o.total_amount,
    p.payment_method,
    p.payment_status,
    p.transaction_id,
    CASE
        WHEN p.payment_id IS NULL THEN '⏳ Chưa có payment → test POST /process'
        ELSE '✅ Đã có payment'
    END AS ghi_chu
FROM orders o
LEFT JOIN payments p ON o.order_id = p.order_id
WHERE o.user_id IN (901, 902, 903)
ORDER BY o.order_id;