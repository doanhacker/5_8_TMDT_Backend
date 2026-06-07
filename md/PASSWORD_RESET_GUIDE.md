# Hướng dẫn cài đặt và sử dụng tính năng Quên mật khẩu mới

## 📋 Tổng quan

Hệ thống đặt lại mật khẩu đã được cập nhật với luồng xác thực bằng mã 6 số:

### ✨ Luồng mới:
1. **Nhập email** → Hệ thống gửi mã xác thực 6 số qua email
2. **Nhập mã xác thực** → Xác nhận là chủ tài khoản
3. **Nhập mật khẩu mới** → Hoàn tất đặt lại mật khẩu

### 🔄 So sánh với luồng cũ:
| Luồng cũ | Luồng mới |
|----------|-----------|
| Nhận link trong email | Nhận mã 6 số trong email |
| Click link → Mở trang mới | Nhập mã ngay trên modal |
| Phụ thuộc vào URL token | Xác thực bằng mã + email |
| Token hết hạn 15 phút | Mã hết hạn 15 phút |

---

## 🔧 Cài đặt

### Bước 1: Tạo bảng database

Chạy lệnh SQL để tạo bảng `password_reset_codes`:

```bash
# Di chuyển vào thư mục backend
cd laptop-ecommerce/backend

# Chạy file SQL
mysql -u root -p laptop_ecommerce_db < database/add-password-reset-codes.sql
```

Hoặc chạy trực tiếp trong MySQL:

```sql
USE laptop_ecommerce_db;

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    reset_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_email_code (email, reset_code),
    INDEX idx_expires (expires_at)
);
```

### Bước 2: Cấu hình SMTP (nếu chưa có)

Đảm bảo file `.env` có các biến sau:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Lưu ý**: Nếu dùng Gmail, cần tạo App Password:
1. Vào Google Account → Security
2. Bật 2-Step Verification
3. Tạo App Password cho "Mail"

### Bước 3: Khởi động lại server

```bash
# Trong thư mục backend
npm start
```

---

## 🎯 Cách sử dụng

### Cho người dùng cuối:

1. **Bước 1: Nhập email**
   - Click "Quên mật khẩu?" trong form đăng nhập
   - Nhập email đã đăng ký
   - Click "Gửi mã xác thực"

2. **Bước 2: Nhập mã xác thực**
   - Kiểm tra email để lấy mã 6 số
   - Nhập mã vào form (VD: `123456`)
   - Click "Xác nhận mã"
   - Nếu sai hoặc hết hạn, có thể "Gửi lại mã"

3. **Bước 3: Đặt mật khẩu mới**
   - Nhập mật khẩu mới (tối thiểu 6 ký tự)
   - Xác nhận lại mật khẩu
   - Click "Đặt lại mật khẩu"
   - Thành công → Tự động đóng modal, có thể đăng nhập

---

## 🔐 Các tính năng bảo mật

1. ✅ **Mã xác thực ngẫu nhiên**: Mã 6 số được tạo ngẫu nhiên mỗi lần
2. ✅ **Thời hạn 15 phút**: Mã tự động hết hạn sau 15 phút
3. ✅ **Sử dụng 1 lần**: Mã được đánh dấu `is_used` sau khi đặt lại mật khẩu
4. ✅ **Xóa mã cũ**: Khi gửi mã mới, các mã cũ của email đó bị xóa
5. ✅ **Không tiết lộ email**: API luôn trả về success dù email có tồn tại hay không
6. ✅ **Validation đầy đủ**: Kiểm tra email, độ dài mã, độ dài mật khẩu

---

## 🧪 Test API

### 1. Gửi mã xác thực:
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi mã xác thực về email của bạn."
}
```

### 2. Xác thực mã:
```bash
curl -X POST http://localhost:5000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Mã xác thực hợp lệ"
}
```

### 3. Đặt lại mật khẩu:
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "newPassword": "NewPass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại."
}
```

---

## 📂 Các file đã thay đổi

### Backend:
- ✅ `backend/database/add-password-reset-codes.sql` - Tạo bảng mới
- ✅ `backend/models/passwordResetModel.js` - Model mới cho mã xác thực
- ✅ `backend/controllers/authController.js` - Sửa logic reset password
- ✅ `backend/routes/authRoutes.js` - Thêm route `/verify-reset-code`

### Frontend:
- ✅ `frontend/src/context/AuthContext.jsx` - Thêm hàm `verifyResetCode`, sửa `resetPassword`
- ✅ `frontend/src/components/AuthModal.jsx` - UI 3 bước reset password

---

## ❓ Troubleshooting

### Không nhận được email?
1. Kiểm tra cấu hình SMTP trong `.env`
2. Kiểm tra console log backend xem có lỗi không
3. Kiểm tra thư mục Spam/Junk
4. Nếu không cấu hình SMTP, mã sẽ hiện trong console log

### Mã không hợp lệ?
- Mã chỉ có hiệu lực 15 phút
- Mỗi mã chỉ dùng được 1 lần
- Gửi lại mã nếu hết hạn

### Lỗi database?
```bash
# Kiểm tra bảng đã tạo chưa
mysql -u root -p -e "USE laptop_ecommerce_db; SHOW TABLES LIKE 'password_reset_codes';"

# Kiểm tra cấu trúc bảng
mysql -u root -p -e "USE laptop_ecommerce_db; DESCRIBE password_reset_codes;"
```

---

## 🎉 Hoàn tất!

Hệ thống đặt lại mật khẩu mới đã sẵn sàng sử dụng. Người dùng giờ có thể đặt lại mật khẩu dễ dàng hơn mà không cần click vào link email.
