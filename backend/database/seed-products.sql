-- =========================================================================
-- SEED DATA FOR ALL PRODUCT CATALOG PAGES
-- Includes: Phones, Tablets, Accessories, Smartwatches, Monitors/Printers, SIM/Top-up, Services, Used/Trade-in
-- =========================================================================

USE laptop_ecommerce_db;

-- =========================================================================
-- STEP 1: INSERT/UPDATE CATEGORIES FOR ALL PRODUCT TYPES
-- =========================================================================
INSERT INTO categories (category_name, parent_category_id) VALUES
('Điện thoại', NULL),
('Tablet', NULL),
('Phụ kiện', NULL),
('Smartwatch', NULL),
('Màn hình, Máy in', NULL),
('Sim, Thẻ cào', NULL),
('Dịch vụ tiện ích', NULL),
('Máy cũ, Thu cũ', NULL),
('Tai nghe', NULL),
('Máy tính', NULL),
('Apple', NULL),
('Samsung', NULL),
('Xiaomi', NULL)
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

-- =========================================================================
-- STEP 2: INSERT/UPDATE BRANDS FOR ALL PRODUCTS
-- =========================================================================
INSERT INTO brands (brand_name, logo_url) VALUES
('Apple', NULL),
('Samsung', NULL),
('Xiaomi', NULL),
('OPPO', NULL),
('vivo', NULL),
('Nothing', NULL),
('realme', NULL),
('Anker', NULL),
('Logitech', NULL),
('Sony', NULL),
('Belkin', NULL),
('Spigen', NULL),
('Baseus', NULL),
('Nillkin', NULL),
('Garmin', NULL),
('Huawei', NULL),
('Fitbit', NULL),
('Amazfit', NULL),
('OnePlus', NULL),
('LG', NULL),
('Dell', NULL),
('ASUS', NULL),
('MSI', NULL),
('BenQ', NULL),
('Canon', NULL),
('HP', NULL),
('Brother', NULL),
('Viettel', NULL),
('Mobifone', NULL),
('Vinaphone', NULL),
('TechMart', NULL),
('Data Recovery Plus', NULL),
('InsureTech Pro', NULL),
('ScreenGuard Pro', NULL),
('Lenovo', NULL)
ON DUPLICATE KEY UPDATE brand_name = VALUES(brand_name);

-- =========================================================================
-- STEP 3: PHONES (IDs 9001-9008)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(9001, 'Samsung Galaxy S24 Ultra', (SELECT brand_id FROM brands WHERE brand_name='Samsung'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 29990000, 27990000, 15, 'IN_STOCK', '<p>Samsung Galaxy S24 Ultra - Flagship mạnh mẽ</p>', 'Bút S Pen, AI chụp ảnh, zoom xa'),
(9002, 'iPhone 16 Pro Max', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 35990000, 32990000, 12, 'IN_STOCK', '<p>iPhone 16 Pro Max - Flagship Apple</p>', 'Camera Control, ProRes, pin tối ưu'),
(9003, 'Xiaomi 15 Pro', (SELECT brand_id FROM brands WHERE brand_name='Xiaomi'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 25990000, 22990000, 18, 'IN_STOCK', '<p>Xiaomi 15 Pro - Hiệu năng cao</p>', 'Sạc nhanh, màn đẹp, tối ưu gaming'),
(9004, 'OPPO Find X8', (SELECT brand_id FROM brands WHERE brand_name='OPPO'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 24990000, 21990000, 10, 'IN_STOCK', '<p>OPPO Find X8 - Camera chuyên nghiệp</p>', 'Chụp chân dung đẹp, sạc siêu nhanh'),
(9005, 'vivo X200 Pro', (SELECT brand_id FROM brands WHERE brand_name='vivo'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 27990000, 24990000, 14, 'IN_STOCK', '<p>vivo X200 Pro - Chuyên camera</p>', 'Ảnh thiếu sáng, màu sắc rực, pin lớn'),
(9006, 'Samsung Galaxy A56', (SELECT brand_id FROM brands WHERE brand_name='Samsung'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 11990000, 9990000, 25, 'IN_STOCK', '<p>Samsung Galaxy A56 - Tầm trung</p>', 'Mượt ổn định, pin tốt, màn sáng'),
(9007, 'Nothing Phone (3a)', (SELECT brand_id FROM brands WHERE brand_name='Nothing'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 13990000, 12990000, 20, 'IN_STOCK', '<p>Nothing Phone 3a - Thiết kế độc đáo</p>', 'Glyph, giao diện lạ, cảm giác cao cấp'),
(9008, 'realme GT 7 Pro', (SELECT brand_id FROM brands WHERE brand_name='realme'), (SELECT category_id FROM categories WHERE category_name='Điện thoại'), 20990000, 18990000, 16, 'IN_STOCK', '<p>realme GT 7 Pro - Gaming mạnh</p>', 'Hiệu năng mạnh, sạc rất nhanh, chơi game tốt')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 4: TABLETS (IDs 9801-9806)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(9801, 'iPad Pro 13-inch M4', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Tablet'), 35990000, 33990000, 10, 'IN_STOCK', '<p>iPad Pro 13 M4 - Tablet cao cấp</p>', 'OLED 120Hz, M4 chip, Apple Pencil Pro'),
(9802, 'Samsung Galaxy Tab S10 Ultra', (SELECT brand_id FROM brands WHERE brand_name='Samsung'), (SELECT category_id FROM categories WHERE category_name='Tablet'), 29990000, 27990000, 12, 'IN_STOCK', '<p>Galaxy Tab S10 Ultra - Tablet lớn</p>', '14.6 inch AMOLED, S Pen, DeX'),
(9803, 'Xiaomi Pad 7 Pro', (SELECT brand_id FROM brands WHERE brand_name='Xiaomi'), (SELECT category_id FROM categories WHERE category_name='Tablet'), 14990000, 13490000, 18, 'IN_STOCK', '<p>Xiaomi Pad 7 Pro - Tablet giá rẻ</p>', '12.9 inch, Snapdragon 8 Gen 3 Leading, 120Hz'),
(9804, 'Lenovo Tab M11 Pro Plus', (SELECT brand_id FROM brands WHERE brand_name='Lenovo'), (SELECT category_id FROM categories WHERE category_name='Tablet'), 12990000, 11490000, 14, 'IN_STOCK', '<p>Lenovo Tab M11 Pro Plus - Tablet văn phòng</p>', '11.5 inch OLED, pin lâu, đa tác vụ'),
(9805, 'Samsung Galaxy Tab A9 Plus', (SELECT brand_id FROM brands WHERE brand_name='Samsung'), (SELECT category_id FROM categories WHERE category_name='Tablet'), 8990000, 7990000, 22, 'IN_STOCK', '<p>Galaxy Tab A9 Plus - Tablet tầm trung</p>', '11 inch LCD, pin 13 giờ, mạnh đủ dùng'),
(9806, 'iPad (11th Gen)', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Tablet'), 12990000, 11990000, 16, 'IN_STOCK', '<p>iPad 11th Gen - Tablet cơ bản</p>', 'M4 chip, landscape camera, giáo dục')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 5: ACCESSORIES (IDs 8001-8008)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(8001, 'Tai nghe AirPods Pro 2', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 6490000, 5990000, 20, 'IN_STOCK', '<p>AirPods Pro 2 - Tai nghe cao cấp</p>', 'ANC, Adaptive Audio, Lossless audio'),
(8002, 'Pin dự phòng Anker 737 100W', (SELECT brand_id FROM brands WHERE brand_name='Anker'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 2990000, 2490000, 30, 'IN_STOCK', '<p>Anker 737 Power Bank - Pin 100W</p>', '24000mAh, 3 cổng, sạc nhanh'),
(8003, 'Chuột Logitech MX Master 3S', (SELECT brand_id FROM brands WHERE brand_name='Logitech'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 3290000, 2990000, 15, 'IN_STOCK', '<p>Logitech MX Master 3S - Chuột chuyên nghiệp</p>', 'Multi-device, gesture, ergonomic'),
(8004, 'Tai nghe Sony WH-1000XM5', (SELECT brand_id FROM brands WHERE brand_name='Sony'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 7990000, 6990000, 12, 'IN_STOCK', '<p>Sony WH-1000XM5 - Tai nghe chất lượng</p>', 'ANC tốt, âm thanh rõ, pin 30 giờ'),
(8005, 'Hub Belkin 7-in-1 USB-C', (SELECT brand_id FROM brands WHERE brand_name='Belkin'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 1990000, 1790000, 25, 'IN_STOCK', '<p>Belkin 7-in-1 Hub - Mở rộng cổng</p>', '7 cổng, sạc 100W, kết nối nhanh'),
(8006, 'Ốp lưng iPhone Spigen Tough Armor', (SELECT brand_id FROM brands WHERE brand_name='Spigen'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 490000, 390000, 50, 'IN_STOCK', '<p>Spigen Tough Armor - Ốp bảo vệ</p>', 'Chống va đập, thiết kế mỏng'),
(8007, 'Cáp sạc Baseus USB-C 100W', (SELECT brand_id FROM brands WHERE brand_name='Baseus'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 290000, 190000, 60, 'IN_STOCK', '<p>Baseus USB-C Cable - Cáp bền</p>', '6A 100W, durable, bện nylon'),
(8008, 'Kính cường lực Nillkin 9H', (SELECT brand_id FROM brands WHERE brand_name='Nillkin'), (SELECT category_id FROM categories WHERE category_name='Phụ kiện'), 350000, 250000, 45, 'IN_STOCK', '<p>Nillkin 9H Glass - Kính chống xước</p>', '9H cứng, phủ oleophobic, dễ dán')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 6: SMARTWATCHES (IDs 7001-7008)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(7001, 'Apple Watch Series 10', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 12990000, 11990000, 14, 'IN_STOCK', '<p>Apple Watch Series 10 - Smartwatch cao cấp</p>', 'LTPO OLED, ECG, giải phóng tay'),
(7002, 'Samsung Galaxy Watch 7', (SELECT brand_id FROM brands WHERE brand_name='Samsung'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 9990000, 8990000, 18, 'IN_STOCK', '<p>Galaxy Watch 7 - Smartwatch Android</p>', 'Wear OS 4, AI health, 100+ tác vụ'),
(7003, 'Garmin Epix Gen 2', (SELECT brand_id FROM brands WHERE brand_name='Garmin'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 15990000, 13990000, 10, 'IN_STOCK', '<p>Garmin Epix Gen 2 - GPS chuyên nghiệp</p>', 'AMOLED, GPS, 11 ngày pin'),
(7004, 'Xiaomi Watch S3 Pro', (SELECT brand_id FROM brands WHERE brand_name='Xiaomi'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 4990000, 3990000, 25, 'IN_STOCK', '<p>Xiaomi Watch S3 Pro - Giá rẻ</p>', 'AMOLED, 21 ngày pin, giáp titan'),
(7005, 'Huawei Watch Ultimate', (SELECT brand_id FROM brands WHERE brand_name='Huawei'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 11990000, 10490000, 12, 'IN_STOCK', '<p>Huawei Watch Ultimate - Tiêu chuẩn cao</p>', 'Sapphire, ceramic, 336 giờ pin'),
(7006, 'Fitbit Sense 2', (SELECT brand_id FROM brands WHERE brand_name='Fitbit'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 5990000, 4990000, 20, 'IN_STOCK', '<p>Fitbit Sense 2 - Sức khỏe tập trung</p>', 'ECG, EDA, SpO2, pin 6 ngày'),
(7007, 'Amazfit GTR 5 Pro', (SELECT brand_id FROM brands WHERE brand_name='Amazfit'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 4490000, 3790000, 22, 'IN_STOCK', '<p>Amazfit GTR 5 Pro - Giá cực tốt</p>', 'AMOLED, 14 ngày pin, ZEPP OS'),
(7008, 'OnePlus Watch 2', (SELECT brand_id FROM brands WHERE brand_name='OnePlus'), (SELECT category_id FROM categories WHERE category_name='Smartwatch'), 8990000, 7490000, 16, 'IN_STOCK', '<p>OnePlus Watch 2 - Wear OS 4</p>', 'Snapdragon W5100, dual chip, pin 5 ngày')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 7: MONITORS & PRINTERS (IDs 6001-6008)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(6001, 'LG UltraWide 38UP550-W', (SELECT brand_id FROM brands WHERE brand_name='LG'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 12990000, 11490000, 8, 'IN_STOCK', '<p>LG 38 Inch UltraWide - Màn hình siêu rộng</p>', '38 inch 3440x1440, 160W USB-C, Thunderbolt'),
(6002, 'Dell UltraSharp 32 U3224PVU', (SELECT brand_id FROM brands WHERE brand_name='Dell'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 8990000, 7990000, 10, 'IN_STOCK', '<p>Dell UltraSharp 32 4K - Màn hình 4K USB-C</p>', '32 inch 4K, 90W USB-C, calibrated'),
(6003, 'ASUS ProArt PA329C', (SELECT brand_id FROM brands WHERE brand_name='ASUS'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 10990000, 9890000, 6, 'IN_STOCK', '<p>ASUS ProArt PA329C - Chuyên đồ họa</p>', '32 inch 4K, factory calibrated, 100% Adobe RGB'),
(6004, 'MSI Curved Gaming 144Hz', (SELECT brand_id FROM brands WHERE brand_name='MSI'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 6490000, 5990000, 12, 'IN_STOCK', '<p>MSI 27 Gaming - Màn hình gaming</p>', '27 inch 1440p 144Hz, VA, HDR, curved'),
(6005, 'Canon imagePROGRAF PRO-1100', (SELECT brand_id FROM brands WHERE brand_name='Canon'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 32990000, 29990000, 3, 'IN_STOCK', '<p>Canon imagePROGRAF PRO-1100 - Máy in A3+</p>', 'A3+ 17 inch, 12 màu, in ảnh siêu đẹp'),
(6006, 'HP LaserJet Enterprise M555dn', (SELECT brand_id FROM brands WHERE brand_name='HP'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 8990000, 8290000, 5, 'IN_STOCK', '<p>HP LaserJet Enterprise - Máy in A4</p>', 'Màu, 2400x600 DPI, 61 trang/phút'),
(6007, 'Brother MFC-L8690CDW', (SELECT brand_id FROM brands WHERE brand_name='Brother'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 4990000, 4490000, 8, 'IN_STOCK', '<p>Brother MFC-L8690CDW - Máy in đa năng</p>', 'Màu 4 in 1, ADF, wireless, NFC'),
(6008, 'BenQ SW240 Professional Display', (SELECT brand_id FROM brands WHERE brand_name='BenQ'), (SELECT category_id FROM categories WHERE category_name='Màn hình, Máy in'), 7990000, 7290000, 7, 'IN_STOCK', '<p>BenQ SW240 - Màn hình chuyên sáng tác</p>', '24 inch IPS, factory calibrated, 100% sRGB')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 8: SIM & TOP-UP CARDS (IDs 5001-5008)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(5001, 'SIM Viettel 30GB/tháng + Gọi KG', (SELECT brand_id FROM brands WHERE brand_name='Viettel'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 89000, 79000, 100, 'IN_STOCK', '<p>SIM Viettel Combo - Gọi miễn phí</p>', '30GB/tháng, gọi miễn phí, số VIP'),
(5002, 'SIM Mobifone 20GB + 100 Phút', (SELECT brand_id FROM brands WHERE brand_name='Mobifone'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 79000, 69000, 120, 'IN_STOCK', '<p>SIM Mobifone - Cân bằng giá</p>', '20GB, 100 phút gọi, kích hoạt nhanh'),
(5003, 'SIM Vinaphone 15GB Giá Rẻ', (SELECT brand_id FROM brands WHERE brand_name='Vinaphone'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 49000, 39000, 150, 'IN_STOCK', '<p>SIM Vinaphone - Giá rẻ nhất</p>', '15GB, kích hoạt miễn phí, bền'),
(5004, 'Thẻ Nạp Viettel 100K (25GB)', (SELECT brand_id FROM brands WHERE brand_name='Viettel'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 100000, 95000, 200, 'IN_STOCK', '<p>Thẻ Nạp Viettel - 100K combo</p>', '25GB data, dùng ngay'),
(5005, 'Thẻ Nạp Mobifone 50K (10GB)', (SELECT brand_id FROM brands WHERE brand_name='Mobifone'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 50000, 48000, 250, 'IN_STOCK', '<p>Thẻ Nạp Mobifone - 50K</p>', '10GB, tin nhắn miễn phí'),
(5006, 'Thẻ Nạp Vinaphone 20K (5GB)', (SELECT brand_id FROM brands WHERE brand_name='Vinaphone'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 20000, 19000, 300, 'IN_STOCK', '<p>Thẻ Nạp Vinaphone - 20K rẻ</p>', '5GB, sử dụng liệu hạn dài'),
(5007, 'Gói Data Viettel Unlimited 1 Tháng', (SELECT brand_id FROM brands WHERE brand_name='Viettel'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 299000, 269000, 80, 'IN_STOCK', '<p>Gói Unlimited Viettel - Không giới hạn</p>', 'Unlimited data, 1 tháng, tốc độ cao'),
(5008, 'Gói Data Mobifone 10GB 1 Tháng', (SELECT brand_id FROM brands WHERE brand_name='Mobifone'), (SELECT category_id FROM categories WHERE category_name='Sim, Thẻ cào'), 99000, 89000, 150, 'IN_STOCK', '<p>Gói Data Mobifone 10GB - Tiết kiệm</p>', '10GB, 1 tháng, sử dụng liên tục')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 9: UTILITY SERVICES (IDs 4001-4008)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(4001, 'Bảo Hành Mở Rộng 3 Năm TechMart', (SELECT brand_id FROM brands WHERE brand_name='TechMart'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 1500000, 1200000, 50, 'IN_STOCK', '<p>Bảo hành 3 năm - Bảo vệ toàn diện</p>', 'Sửa chữa miễn phí, thay mới nếu cần'),
(4002, 'Bảo Hành Mở Rộng 5 Năm Premium', (SELECT brand_id FROM brands WHERE brand_name='TechMart'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 2800000, 2100000, 30, 'IN_STOCK', '<p>Bảo hành 5 năm - Premium service</p>', 'Support 24/7, vật liệu cao cấp'),
(4003, 'Hỗ Trợ Kỹ Thuật 1 Năm', (SELECT brand_id FROM brands WHERE brand_name='TechMart'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 1290000, 890000, 60, 'IN_STOCK', '<p>Hỗ trợ kỹ thuật 24/7 - Hotline nhanh</p>', 'Remote, email, priority queue'),
(4004, 'Lắp Đặt & Cấu Hình Tại Nhà', (SELECT brand_id FROM brands WHERE brand_name='TechMart'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 600000, 450000, 80, 'IN_STOCK', '<p>Dịch vụ lắp đặt - Tại nhà 2 giờ</p>', 'Setup hoàn chỉnh, hướng dẫn miễn phí'),
(4005, 'Phục Hồi Dữ Liệu - Data Recovery', (SELECT brand_id FROM brands WHERE brand_name='Data Recovery Plus'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 2000000, 1500000, 20, 'IN_STOCK', '<p>Phục hồi dữ liệu - Bảo mật cao</p>', 'Tỷ lệ 99%, bảo mật tuyệt đối'),
(4006, 'Sửa Chữa Toàn Diện - Full Service', (SELECT brand_id FROM brands WHERE brand_name='TechMart'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 1200000, 850000, 40, 'IN_STOCK', '<p>Sửa chữa toàn diện - Nhanh chóng</p>', 'Linh kiện chính hãng, bảo hành 3 tháng'),
(4007, 'Bảo Hiểm Toàn Diện 2 Năm', (SELECT brand_id FROM brands WHERE brand_name='InsureTech Pro'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 2400000, 1800000, 25, 'IN_STOCK', '<p>Bảo hiểm toàn diện - Rủi ro đầy đủ</p>', 'Bồi thường cao, hỗ trợ nhanh'),
(4008, 'Bộ Kính Cường Lực 3 Chiếc', (SELECT brand_id FROM brands WHERE brand_name='ScreenGuard Pro'), (SELECT category_id FROM categories WHERE category_name='Dịch vụ tiện ích'), 500000, 350000, 150, 'IN_STOCK', '<p>Kính cường lực 9H - Bộ 3 chiếc</p>', '9H hardness, oleophobic, dễ dán')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 10: USED/TRADE-IN PRODUCTS (IDs 9901-9906)
-- =========================================================================
INSERT INTO products (product_id, product_name, brand_id, category_id, original_price, discount_price, stock_quantity, status, description_html, highlight_features) VALUES
(9901, 'iPhone 13 Pro - Grade A', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Máy cũ, Thu cũ'), 18990000, 17490000, 8, 'IN_STOCK', '<p>iPhone 13 Pro - Như mới 99%</p>', 'Grade A, bảo hành 6 tháng, chứng chỉ'),
(9902, 'Samsung Galaxy S23 - Grade B', (SELECT brand_id FROM brands WHERE brand_name='Samsung'), (SELECT category_id FROM categories WHERE category_name='Máy cũ, Thu cũ'), 12990000, 10990000, 12, 'IN_STOCK', '<p>Galaxy S23 - Tốt 95%</p>', 'Grade B, pin 85%, bảo hành 3 tháng'),
(9903, 'MacBook Air M2 2023 - Grade A', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Máy cũ, Thu cũ'), 22990000, 20490000, 5, 'IN_STOCK', '<p>MacBook Air M2 - Như mới</p>', 'Grade A, pin 100%, dùng 2 tuần'),
(9904, 'Dell XPS 13 Plus - Grade B', (SELECT brand_id FROM brands WHERE brand_name='Dell'), (SELECT category_id FROM categories WHERE category_name='Máy cũ, Thu cũ'), 15990000, 13490000, 6, 'IN_STOCK', '<p>Dell XPS 13 Plus - Tốt</p>', 'Grade B, pin 80%, dùng 8 tháng'),
(9905, 'iPad Air 6 - Grade A', (SELECT brand_id FROM brands WHERE brand_name='Apple'), (SELECT category_id FROM categories WHERE category_name='Máy cũ, Thu cũ'), 11990000, 10490000, 10, 'IN_STOCK', '<p>iPad Air 6 - Như mới</p>', 'Grade A, 256GB, bảo hành 6 tháng'),
(9906, 'ASUS VivoBook 14 - Grade C', (SELECT brand_id FROM brands WHERE brand_name='ASUS'), (SELECT category_id FROM categories WHERE category_name='Máy cũ, Thu cũ'), 8990000, 7490000, 7, 'IN_STOCK', '<p>ASUS VivoBook 14 - Bình thường</p>', 'Grade C, pin 70%, dùng 1.5 năm')
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- =========================================================================
-- STEP 11: INSERT PRODUCT IMAGES (with Unsplash URLs)
-- =========================================================================
-- Phones
INSERT INTO product_images (product_id, image_url, is_primary) VALUES
(9001, 'https://images.unsplash.com/photo-1606933248051-5ce98adc37d4?w=500&q=80', 1),
(9002, 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80', 1),
(9003, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80', 1),
(9004, 'https://images.unsplash.com/photo-1514306688989-6e01c0b29c10?w=500&q=80', 1),
(9005, 'https://images.unsplash.com/photo-1520275335684-36ca6ee50ee0?w=500&q=80', 1),
(9006, 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500&q=80', 1),
(9007, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=80', 1),
(9008, 'https://images.unsplash.com/photo-1607936591069-8c7a28c5e0a6?w=500&q=80', 1),
-- Tablets
(9801, 'https://images.unsplash.com/photo-1544716278-ca5e3af4abd8?w=500&q=80', 1),
(9802, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80', 1),
(9803, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80', 1),
(9804, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80', 1),
(9805, 'https://images.unsplash.com/photo-1540932549986-b8a874ad74e7?w=500&q=80', 1),
(9806, 'https://images.unsplash.com/photo-1499949786920-6b8ec0412b7d?w=500&q=80', 1),
-- Accessories
(8001, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 1),
(8002, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80', 1),
(8003, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&q=80', 1),
(8004, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80', 1),
(8005, 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&q=80', 1),
(8006, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 1),
(8007, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80', 1),
(8008, 'https://images.unsplash.com/photo-1528148343865-a218a22009a7?w=500&q=80', 1),
-- Smartwatches
(7001, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', 1),
(7002, 'https://images.unsplash.com/photo-1575772345892-a647b4d81af2?w=500&q=80', 1),
(7003, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', 1),
(7004, 'https://images.unsplash.com/photo-1575772345892-a647b4d81af2?w=500&q=80', 1),
(7005, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', 1),
(7006, 'https://images.unsplash.com/photo-1575772345892-a647b4d81af2?w=500&q=80', 1),
(7007, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', 1),
(7008, 'https://images.unsplash.com/photo-1575772345892-a647b4d81af2?w=500&q=80', 1),
-- Monitors & Printers
(6001, 'https://images.unsplash.com/photo-1550745165-9bc0b252cf52?w=500&q=80', 1),
(6002, 'https://images.unsplash.com/photo-1593642632823-8f9e5eead6c8?w=500&q=80', 1),
(6003, 'https://images.unsplash.com/photo-1550745165-9bc0b252cf52?w=500&q=80', 1),
(6004, 'https://images.unsplash.com/photo-1593642632823-8f9e5eead6c8?w=500&q=80', 1),
(6005, 'https://images.unsplash.com/photo-1596887360475-b4b3ee19249e?w=500&q=80', 1),
(6006, 'https://images.unsplash.com/photo-1599720033466-9e9df1919edf?w=500&q=80', 1),
(6007, 'https://images.unsplash.com/photo-1596887360475-b4b3ee19249e?w=500&q=80', 1),
(6008, 'https://images.unsplash.com/photo-1550745165-9bc0b252cf52?w=500&q=80', 1),
-- SIM & Top-up
(5001, 'https://images.unsplash.com/photo-1609808033192-082d6919d3e1?w=500&q=80', 1),
(5002, 'https://images.unsplash.com/photo-1609808033192-082d6919d3e1?w=500&q=80', 1),
(5003, 'https://images.unsplash.com/photo-1609808033192-082d6919d3e1?w=500&q=80', 1),
(5004, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', 1),
(5005, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', 1),
(5006, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', 1),
(5007, 'https://images.unsplash.com/photo-1609808033192-082d6919d3e1?w=500&q=80', 1),
(5008, 'https://images.unsplash.com/photo-1609808033192-082d6919d3e1?w=500&q=80', 1),
-- Services
(4001, 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=500&q=80', 1),
(4002, 'https://images.unsplash.com/photo-1557821552-17105176677c?w=500&q=80', 1),
(4003, 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80', 1),
(4004, 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80', 1),
(4005, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80', 1),
(4006, 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=500&q=80', 1),
(4007, 'https://images.unsplash.com/photo-1557821552-17105176677c?w=500&q=80', 1),
(4008, 'https://images.unsplash.com/photo-1528148343865-a218a22009a7?w=500&q=80', 1),
-- Used/Trade-in
(9901, 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80', 1),
(9902, 'https://images.unsplash.com/photo-1606933248051-5ce98adc37d4?w=500&q=80', 1),
(9903, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80', 1),
(9904, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80', 1),
(9905, 'https://images.unsplash.com/photo-1544716278-ca5e3af4abd8?w=500&q=80', 1),
(9906, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80', 1)
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

COMMIT;
