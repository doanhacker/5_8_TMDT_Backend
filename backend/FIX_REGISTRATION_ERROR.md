# 🔧 Fix Lỗi Đăng Ký Tài Khoản

## ❌ Các lỗi đã phát hiện và sửa

### 1. **Lỗi: Tên field không khớp giữa Frontend và Backend**

**Frontend (AuthContext.jsx)** gửi:
```javascript
{
  full_name: name,
  email,
  password,
  phone  // ❌ SAI
}
```

**Backend API** chờ:
```javascript
{
  full_name,
  email, 
  password,
  phone_number  // ✅ ĐÚNG
}
```

**✅ Đã sửa:** Map `phone` → `phone_number`

---

### 2. **Lỗi: Cấu trúc response không khớp**

**Backend trả về:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "..."
  }
}
```

**Frontend đang đọc:**
```javascript
localStorage.setItem("token", data.token)  // ❌ Sai, vì token nằm trong data.data.token
```

**✅ Đã sửa:** Đọc đúng `data.data.token` và `data.data.user`

---

### 3. **Lỗi: Thiếu dependencies quan trọng**

Backend **thiếu**:
- `bcrypt` - Để hash password
- `jsonwebtoken` - Để tạo JWT token

**✅ Đã sửa:** 
- Thêm vào `backend/package.json`
- Chạy `npm install` để cài đặt

---

## 📝 Files đã sửa

### 1. frontend/src/context/AuthContext.jsx

**Sửa hàm `register()`:**
```javascript
// TRƯỚC (SAI)
body: JSON.stringify({
  full_name: name,
  email,
  password,
  phone  // ❌
})

// SAU (ĐÚNG)
body: JSON.stringify({
  full_name: name,
  email,
  password,
  phone_number: phone  // ✅
})
```

**Sửa lưu token sau register:**
```javascript
// THÊM
if (data.data && data.data.token) {
  localStorage.setItem("token", data.data.token)
  setUser(data.data.user)
}
```

**Sửa hàm `login()`:**
```javascript
// TRƯỚC (SAI)
localStorage.setItem("token", data.token)
setUser(data.user)

// SAU (ĐÚNG)
if (data.data && data.data.token) {
  localStorage.setItem("token", data.data.token)
  setUser(data.data.user)
}
```

---

### 2. backend/package.json

**Thêm dependencies:**
```json
"dependencies": {
  "bcrypt": "^5.1.1",           // ✅ THÊM
  "jsonwebtoken": "^9.0.2",    // ✅ THÊM
  "cors": "^2.8.6",
  "dotenv": "^17.3.1",
  "express": "^5.2.1",
  "mysql2": "^3.18.2",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1"
}
```

---

## 🧪 Cách test sau khi sửa

### Bước 1: Đảm bảo Backend đang chạy

```bash
cd backend
npm run dev
```

Phải thấy:
```
🚀 Server đang chạy tại port 5000
✅ Kết nối thành công đến MySQL
📚 Swagger UI: http://localhost:5000/api-docs
```

---

### Bước 2: Đảm bảo Database có dữ liệu roles

```sql
USE laptop_ecommerce_db;
SELECT * FROM roles;
```

Nếu chưa có, chạy:
```bash
mysql -u root -p < backend/database/seed.sql
```

---

### Bước 3: Test từ Frontend

1. **Khởi động Frontend:**
```bash
cd frontend
npm run dev
```

2. **Mở trình duyệt và test đăng ký:**
   - Click vào "Đăng ký"
   - Nhập thông tin:
     - Họ tên: Test User
     - Email: test@example.com
     - Số điện thoại: 0901234567
     - Mật khẩu: 123456
     - Xác nhận mật khẩu: 123456
   - Click "Đăng ký"

3. **Kiểm tra kết quả:**
   - ✅ Nếu thành công: Modal đóng lại, user đã đăng nhập
   - ❌ Nếu lỗi: Xem message lỗi hiển thị

---

### Bước 4: Xác nhận trong Database

```sql
USE laptop_ecommerce_db;

-- Xem user vừa tạo
SELECT * FROM users WHERE email = 'test@example.com';

-- Xem role đã được gán
SELECT u.email, u.full_name, r.role_name
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE u.email = 'test@example.com';
```

**Kết quả mong đợi:**
- User tồn tại với password đã hash
- Role = CUSTOMER đã được gán

---

### Bước 5: Kiểm tra Browser Console

Mở Developer Tools (F12) → Console, xem có lỗi không:

**Lỗi thường gặp:**
- ❌ `CORS error` → Backend chưa bật CORS (đã fix)
- ❌ `Network error` → Backend không chạy hoặc sai URL
- ❌ `401/403` → Token hoặc validation lỗi
- ❌ `500 Internal Server Error` → Backend lỗi code

---

## 🐛 Troubleshooting

### Lỗi: "Email đã được đăng ký"
**Nguyên nhân:** Email đã tồn tại trong DB  
**Giải pháp:** Dùng email khác hoặc xóa user cũ:
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

---

### Lỗi: "Cannot find module 'bcrypt'"
**Nguyên nhân:** Package chưa được cài  
**Giải pháp:** 
```bash
cd backend
npm install
```

---

### Lỗi: "Unknown database 'laptop_ecommerce_db'"
**Nguyên nhân:** Chưa import database  
**Giải pháp:**
```bash
mysql -u root -p < backend/database/init.sql
mysql -u root -p < backend/database/seed.sql
```

---

### Lỗi: "Lỗi kết nối server"
**Nguyên nhân:** Backend không chạy hoặc CORS  
**Giải pháp:**
1. Kiểm tra backend đang chạy: http://localhost:5000/api-docs
2. Kiểm tra CORS đã enable trong server.js
3. Kiểm tra URL đúng: `http://localhost:5000/api/auth/register`

---

### Lỗi: Token không lưu được
**Nguyên nhân:** Response structure không đúng  
**Giải pháp:** Đã fix trong AuthContext.jsx để đọc `data.data.token`

---

## ✅ Checklist

- [x] Sửa field `phone` → `phone_number` trong AuthContext
- [x] Sửa đọc token từ `data.data.token` thay vì `data.token`
- [x] Thêm bcrypt và jsonwebtoken vào backend/package.json
- [x] Chạy npm install trong backend
- [x] Restart backend server
- [ ] Test đăng ký từ frontend UI
- [ ] Xác nhận user trong database
- [ ] Test đăng nhập với user vừa tạo

---

## 📊 API Response Format (Reference)

### Register Success (201):
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "user": {
      "user_id": 2,
      "email": "test@example.com",
      "full_name": "Test User",
      "phone_number": "0901234567",
      "status": "ACTIVE",
      "created_at": "2026-03-03T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Register Error (400):
```json
{
  "success": false,
  "message": "Email không hợp lệ"
}
```

---

**🎉 Hoàn thành! Bây giờ bạn có thể test lại API đăng ký từ frontend.**

Nếu vẫn gặp lỗi, check:
1. Backend console log
2. Frontend browser console
3. Network tab trong DevTools
