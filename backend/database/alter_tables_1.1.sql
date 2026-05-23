-- =======================================================
-- BƯỚC 1: SỬA BẢNG products (thêm highlight_features)
-- =======================================================
ALTER TABLE products
ADD COLUMN highlight_features TEXT DEFAULT NULL
    AFTER description_html;


-- =======================================================
-- BƯỚC 2: SỬA BẢNG product_specifications
-- (Xoá cpu_name, cpu_benchmark_score, gpu vì chuyển xuống variants)
-- =======================================================
ALTER TABLE product_specifications
DROP COLUMN cpu_name,
DROP COLUMN cpu_benchmark_score,
DROP COLUMN gpu;

-- Kết quả còn lại: spec_id, product_id, screen_size, weight_kg, os


-- =======================================================
-- BƯỚC 3: TẠO BẢNG product_variants (BẢNG MỚI HOÀN TOÀN)
-- =======================================================
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id     INT AUTO_INCREMENT PRIMARY KEY,
    product_id     INT NOT NULL,
    sku            VARCHAR(100) UNIQUE NOT NULL,

    -- Thông số phần cứng (chuyển từ product_specifications xuống)
    cpu_name            VARCHAR(100) DEFAULT NULL,
    cpu_benchmark_score INT         DEFAULT NULL,
    gpu                 VARCHAR(100) DEFAULT NULL,

    -- Cấu hình bộ nhớ
    ram_gb      INT NOT NULL,
    storage_gb  INT NOT NULL,

    -- Màu sắc
    color_name  VARCHAR(50)  NOT NULL,

    -- Giá & kho
    original_price  DECIMAL(15,2) NOT NULL,
    discount_price  DECIMAL(15,2) DEFAULT NULL,
    stock_quantity  INT DEFAULT 0,

    -- Trạng thái (4 loại theo yêu cầu)
    status ENUM(
        'IN_STOCK',
        'OUT_OF_STOCK',
        'COMING_SOON',
        'DISCONTINUED'
    ) DEFAULT 'IN_STOCK',

    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);


-- =======================================================
-- BƯỚC 4: SỬA BẢNG product_images
-- Thêm variant_id (nullable), sửa lại UNIQUE cho is_primary
-- =======================================================

-- 4.1: Thêm cột variant_id
ALTER TABLE product_images
ADD COLUMN variant_id INT DEFAULT NULL
    AFTER product_id;

-- 4.2: Thêm FOREIGN KEY cho variant_id
ALTER TABLE product_images
ADD CONSTRAINT fk_images_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE;

-- 4.3: Đảm bảo mỗi sản phẩm chỉ có 1 ảnh chính (variant_id IS NULL)
--      và mỗi phiên bản chỉ có 1 ảnh chính (variant_id IS NOT NULL)
--      Dùng 2 UNIQUE constraint riêng biệt:

-- Ảnh chính của sản phẩm: unique trên (product_id) khi is_primary=TRUE và variant_id IS NULL
-- Ảnh chính của variant:  unique trên (variant_id) khi is_primary=TRUE

CREATE UNIQUE INDEX uq_primary_per_product
    ON product_images (product_id, is_primary)
    -- Chỉ ràng buộc khi là ảnh gốc (variant_id IS NULL) và is_primary = TRUE
    -- Trick: lưu NULL cho variant_id, MySQL sẽ không coi 2 NULL là trùng nhau
    -- => Đủ để đảm bảo mỗi product chỉ có 1 dòng (product_id, TRUE, NULL)
;

CREATE UNIQUE INDEX uq_primary_per_variant
    ON product_images (variant_id, is_primary);
    -- Tương tự: mỗi variant chỉ có 1 dòng (variant_id, TRUE)

-- =======================================================
-- BƯỚC 5: SỬA BẢNG cart_details
-- Đổi product_id → variant_id
-- =======================================================
ALTER TABLE cart_details
DROP FOREIGN KEY cart_details_ibfk_2;

ALTER TABLE cart_details
CHANGE COLUMN product_id variant_id INT NOT NULL;

ALTER TABLE cart_details
ADD CONSTRAINT fk_cart_details_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE;


-- =======================================================
-- BƯỚC 6: SỬA BẢNG order_details
-- Đổi product_id → variant_id
-- =======================================================
ALTER TABLE order_details
DROP FOREIGN KEY order_details_ibfk_2;

ALTER TABLE order_details
CHANGE COLUMN product_id variant_id INT NOT NULL;

ALTER TABLE order_details
ADD CONSTRAINT fk_order_details_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE RESTRICT;


-- =======================================================
-- BƯỚC 7: SỬA BẢNG import_receipt_details
-- Đổi product_id → variant_id
-- =======================================================
ALTER TABLE import_receipt_details
DROP FOREIGN KEY import_receipt_details_ibfk_2;

ALTER TABLE import_receipt_details
CHANGE COLUMN product_id variant_id INT NOT NULL;

ALTER TABLE import_receipt_details
ADD CONSTRAINT fk_import_details_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE RESTRICT;

-- Sửa lỗi quan hệ của bảng sản phẩm
ALTER TABLE product_images
DROP FOREIGN KEY fk_images_variant;

ALTER TABLE product_images
DROP FOREIGN KEY product_images_ibfk_1;

DROP INDEX uq_primary_per_product ON product_images;

DROP INDEX uq_primary_per_variant ON product_images;
ALTER TABLE products
DROP COLUMN original_price,
DROP COLUMN discount_price,
DROP COLUMN stock_quantity,
DROP COLUMN status;

ALTER TABLE product_specifications
DROP COLUMN ram_gb,
DROP COLUMN ram_type,
DROP COLUMN storage_gb;

ALTER TABLE product_variants
ADD COLUMN ram_type VARCHAR(50);