-- =======================================================
-- BƯỚC 1: SỬA BẢNG product_reviews
-- Thêm cột status và admin_deletion_reason
-- =======================================================
ALTER TABLE product_reviews
ADD COLUMN status ENUM('VISIBLE', 'DELETED_BY_USER', 'DELETED_BY_ADMIN') DEFAULT 'VISIBLE'
    AFTER created_at;

ALTER TABLE product_reviews
ADD COLUMN admin_deletion_reason TEXT DEFAULT NULL
    AFTER status;

-- =======================================================
-- BƯỚC 2: SỬA BẢNG product_reviews
-- Thêm cột deleted_by_admin_at để theo dõi thời điểm xóa bởi admin
-- =======================================================
ALTER TABLE product_reviews
ADD COLUMN deleted_by_admin_at TIMESTAMP NULL DEFAULT NULL
    AFTER admin_deletion_reason;

-- =======================================================
-- BƯỚC 3: TẠO BẢNG review_images
-- =======================================================
CREATE TABLE IF NOT EXISTS review_images (
    review_image_id INT AUTO_INCREMENT PRIMARY KEY,
    review_id       INT NOT NULL,
    image_url       VARCHAR(255) NOT NULL,
    FOREIGN KEY (review_id) REFERENCES product_reviews(review_id) ON DELETE CASCADE
);

-- =======================================================
-- BƯỚC 4: SỬA BẢNG product_reviews
-- Thêm cột is_visible
-- =======================================================
ALTER TABLE product_reviews
ADD COLUMN visible_product_id INT 
GENERATED ALWAYS AS (
    CASE 
        WHEN status = 'VISIBLE' THEN product_id
        ELSE NULL
    END
) STORED;

-- =======================================================
-- BƯỚC 5: Thêm UNIQUE INDEX
-- =======================================================
CREATE UNIQUE INDEX unique_visible_review
ON product_reviews (user_id, visible_product_id);