-- Mock data hỗ trợ test TC30-46 (chạy 1 lần, an toàn ON DUPLICATE)
USE laptop_ecommerce_db;

-- Đơn hàng chờ xác nhận cho TC33/41
INSERT INTO orders (order_id, user_id, address_id, order_type, status, subtotal, total_amount, order_date)
SELECT 920, 904, NULL, 'NORMAL', 'PENDING_CONFIRMATION', 32000000.00, 32000000.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_id = 920);

INSERT INTO order_details (order_id, variant_id, quantity, price_at_purchase)
SELECT 920, 901, 1, 32000000.00
WHERE NOT EXISTS (SELECT 1 FROM order_details WHERE order_id = 920 AND variant_id = 901);

-- Đánh giá mock cho TC43 (admin xóa nội dung)
INSERT INTO product_reviews (review_id, product_id, user_id, rating, content, created_at)
SELECT 920, 901, 904, 5, 'Mock review cho test TC43 - san pham tot', NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_reviews WHERE review_id = 920);

-- Phòng chat mock (bảng có sẵn, chưa có API staff)
INSERT INTO chat_rooms (room_id, customer_id, staff_id, status, created_at)
SELECT 920, 904, 1, 'WAITING', NOW()
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE room_id = 920);

INSERT INTO chat_messages (room_id, sender_id, sender_type, content, sent_at)
SELECT 920, 904, 'CUSTOMER', 'Cho hoi ve laptop 20 trieu', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM chat_messages WHERE room_id = 920 AND content LIKE '%20 trieu%'
);
