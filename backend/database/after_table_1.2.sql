USE laptop_ecommerce_db;

-- 1. Cập nhật lại cột 'type' để thêm 'PRODUCT'
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('ORDER', 'PROMOTION', 'PRODUCT', 'SYSTEM', 'NEWS') NOT NULL;

-- 2. Thêm cột 'reference_id'sau cột 'type'
ALTER TABLE notifications
ADD COLUMN reference_id INT DEFAULT NULL AFTER type;