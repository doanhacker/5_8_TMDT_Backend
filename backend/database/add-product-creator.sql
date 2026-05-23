-- =====================================================
-- MIGRATION: Thêm trường created_by cho products table
-- =====================================================

-- Thêm cột created_by để track admin tạo sản phẩm
ALTER TABLE products ADD COLUMN created_by INT DEFAULT NULL AFTER created_at;

-- Thêm foreign key (cho phép NULL nếu admin bị xóa)
ALTER TABLE products ADD CONSTRAINT fk_products_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Tạo index cho performance
CREATE INDEX idx_products_created_by ON products(created_by);

COMMIT;
