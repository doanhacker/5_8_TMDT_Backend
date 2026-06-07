USE laptop_ecommerce_db;

-- Lý do hủy đơn (phục vụ thống kê cancel-reasons)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(255) DEFAULT NULL AFTER status;

-- Bảng event tracking cho phễu chuyển đổi
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('product_view', 'cart_add', 'checkout_start', 'order_complete') NOT NULL,
    user_id INT NULL,
    product_id INT NULL,
    session_id VARCHAR(64) DEFAULT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type_time (event_type, created_at),
    CONSTRAINT fk_analytics_events_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_analytics_events_product
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);
