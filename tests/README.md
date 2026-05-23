# Hướng dẫn Tests (Tiếng Việt)

Tài liệu ngắn này mô tả cách thức hoạt động của bộ unit tests trong repo, cách chạy, quy ước mock/stub và các nguyên tắc khi viết test mới.

1. Tổng quan
- Bộ test nằm trong thư mục `tests/` (mỗi file là một nhóm test cho controller/module tương ứng).
- Dùng Node built-in test runner: `node --test` (Node v22+).
- Một file tập hợp (`tests/all.test.js`) được dùng làm entry-point để chạy toàn bộ test trên Windows.

2. Chạy test
- Chạy toàn bộ suite (từ thư mục dự án):
```
npm test
```
 (script `test` gọi `node --test tests/all.test.js`).

- Chạy một file test đơn lẻ:
```
node --test tests/payment.test.js
```

3. Cấu trúc test và cách khởi tạo
- Mỗi file test dùng API `node:test` (ví dụ: `describe`, `test`, `afterEach`).
- Mỗi test mock/stub các hàm model hoặc helper để tránh gọi DB/các dịch vụ mạng thật.
- Ví dụ kiểu mock phổ biến trong repo:
  - Gán lại phương thức của model: `Product.getAll = async () => [...]`
  - Stub connection pool: `db.getConnection = async () => mockConn` (mockConn có `query`, `beginTransaction`, `commit`, `rollback`, `release`).

4. Nguyên tắc viết test
- Giữ test nhỏ, xác định mục tiêu rõ ràng (1 assert chính). 
- Không gọi mạng hoặc DB thật — luôn mock/ stub dependency ở tầng model/DB/helper.
- Khôi phục (restore) các phương thức gốc trong `afterEach` để tránh side-effect giữa các test.
- Test nên kiểm tra cả đường thành công và đường lỗi (edge cases): giá trị hợp lệ, giá trị thiếu, lỗi DB, lỗi gateway.

5. Mẹo khi mock env & helpers
- Một số helper (MoMo, VNPay) đọc biến môi trường và dùng `crypto` / `fetch`. Trong test set biến môi trường cần thiết (ví dụ `process.env.MOMO_*`, `VNPAY_HASH_SECRET`) hoặc stub hàm helper để tránh lỗi crypto/fetch.
- Nếu cần mock `fetch`, gán `global.fetch = async () => ({ ok: true, json: async () => ({ ... }) })` và restore sau test.

6. Kiểm tra idempotency & transaction
- Với các service transactional như `checkoutService.handleSuccessfulPayment`, mock `db.getConnection` trả về `mockConn` có `beginTransaction`, `commit`, `rollback`, `release` để test logic commit/rollback.
- Test idempotency: mock `Payment.markAsPaidIfNeeded` trả về `0` (đã PAID) để xác nhận code không gọi các bước cập nhật lại nếu không cần.

7. Thao tác với kết quả test và logs
- Một số test intentionally log lỗi (ví dụ mô phỏng DB error) — log hiển thị nhưng test vẫn có thể pass nếu controller trả response mong đợi.
- Nếu muốn xem output chi tiết, chạy file test riêng lẻ thay vì aggregator.

8. Đóng góp test mới
- Tạo file mới `tests/<module>.test.js` theo mẫu các file hiện có.
- Mock dependencies và restore trong `afterEach`.
- Chạy `node --test tests/<file>.js` cho đến khi ổn, rồi thêm vào `tests/all.test.js` nếu cần.

9. CI (gợi ý)
- Thêm workflow GitHub Action chạy `npm test` trên Node LTS v22 để kiểm tra PR.

10. Liên hệ / Ghi chú
- Nếu test cố gắng kết nối DB khi import module, cần stub `db.getConnection` trước khi require module đó hoặc chỉnh module để không kết nối khi import.
- Muốn mình thêm mẫu test cụ thể cho một module nào, chỉ định tên module và mình sẽ tạo.

---
Tệp này nằm ở `tests/README.md` — muốn mình commit và tạo PR không? 
