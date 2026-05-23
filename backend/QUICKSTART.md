# 🚀 Quick Start Guide - Test API Đăng ký Tài khoản

## Bước 1: Chuẩn bị Database

```bash
# Import database structure và seed data
mysql -u root -p < database\init.sql
mysql -u root -p < database\seed.sql
```

**✅ Xác nhận:** Kiểm tra bảng `roles` đã có 3 roles (ADMIN, STAFF, CUSTOMER)

```sql
USE laptop_ecommerce_db;
SELECT * FROM roles;
```

---

## Bước 2: Khởi động Backend Server

```bash
# Tại thư mục backend
cd "C:\Users\Win 11\laptop-shop\laptop-ecommerce\backend"

# Cài dependencies (nếu chưa)
npm install

# Chạy server
npm run dev
```

**✅ Xác nhận:** Server chạy thành công tại http://localhost:5000

---

## Bước 3: Test API Đăng ký

### Option 1: Sử dụng Swagger UI (Dễ nhất)

1. Mở trình duyệt: http://localhost:5000/api-docs
2. Tìm section **Authentication**
3. Click **POST /api/auth/register**
4. Click **"Try it out"**
5. Nhập dữ liệu:

```json
{
  "email": "test@example.com",
  "password": "123456",
  "full_name": "Nguyễn Văn Test",
  "phone_number": "0901234567"
}
```

6. Click **"Execute"**

```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "user": {
      "user_id": 2,
      "email": "test@example.com",
      "full_name": "Nguyễn Văn Test",
      "phone_number": "0901234567",
      "status": "ACTIVE",
      "created_at": "2026-03-03T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Option 2: Sử dụng PowerShell

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"123456","full_name":"Nguyễn Văn Test","phone_number":"0901234567"}' | Select-Object -Expand Content
```

---

### Option 3: Sử dụng cURL (Git Bash)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","full_name":"Nguyễn Văn Test","phone_number":"0901234567"}'
```

---

## Bước 4: Kiểm tra Database

Xác nhận user đã được tạo:

```sql
USE laptop_ecommerce_db;

-- Xem user vừa tạo
SELECT * FROM users WHERE email = 'test@example.com';

-- Xem role đã được gán chưa
SELECT u.user_id, u.email, u.full_name, r.role_name
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE u.email = 'test@example.com';
```

**✅ Kết quả mong đợi:**
- User có trong bảng `users`
- Password đã được hash (không phải plain text)
- Role = CUSTOMER được gán tự động

---

## Bước 5: Test API Đăng nhập

### Swagger UI:

1. Tại http://localhost:5000/api-docs
2. Click **POST /api/auth/login**
3. Click **"Try it out"**
4. Nhập:

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

5. Click **"Execute"**
6. Copy **token** từ response để dùng cho các API khác

---

## 📝 Test Cases

### ✅ Test Case 1: Đăng ký thành công

**Input:**
```json
{
  "email": "user1@test.com",
  "password": "password123",
  "full_name": "User One"
}
```

**Expected:** Status 201, trả về user info + token

---

### ❌ Test Case 2: Email đã tồn tại

**Input:**
```json
{
  "email": "test@example.com",
  "password": "123456",
  "full_name": "Another User"
}
```

**Expected:** Status 409, message: "Email đã được đăng ký"

---

### ❌ Test Case 3: Thiếu trường bắt buộc

**Input:**
```json
{
  "email": "user2@test.com",
  "password": "123"
}
```

**Expected:** Status 400, message: "Thiếu thông tin bắt buộc: email, password, full_name"

---

### ❌ Test Case 4: Password quá ngắn

**Input:**
```json
{
  "email": "user3@test.com",
  "password": "123",
  "full_name": "User Three"
}
```

**Expected:** Status 400, message: "Mật khẩu phải có ít nhất 6 ký tự"

---

### ❌ Test Case 5: Email không hợp lệ

**Input:**
```json
{
  "email": "invalid-email",
  "password": "123456",
  "full_name": "User Four"
}
```

**Expected:** Status 400, message: "Email không hợp lệ"

---

## 🔍 Troubleshooting

### Lỗi: "Unknown database 'laptop_ecommerce_db'"
**Fix:** Chưa import init.sql
```bash
mysql -u root -p < database\init.sql
```

### Lỗi: "Cannot find module 'bcrypt'"
**Fix:** Chưa install dependencies
```bash
npm install
```

### Lỗi: "Email đã được đăng ký"
**Fix:** Email đã tồn tại, dùng email khác hoặc test login

### Lỗi: "Cannot read properties of undefined"
**Fix:** Kiểm tra bảng `roles` có dữ liệu chưa
```bash
mysql -u root -p < database\seed.sql
```

### Server không khởi động
**Fix:** 
1. Kiểm tra MySQL đang chạy
2. Kiểm tra port 5000 chưa bị chiếm
3. Kiểm tra file `.env` có đúng cấu hình

---

## 📚 Files được tạo

✅ **Models:**
- `models/userModel.js` - Database operations cho users

✅ **Controllers:**
- `controllers/authController.js` - Logic đăng ký và đăng nhập

✅ **Routes:**
- `routes/authRoutes.js` - API endpoints

✅ **Config:**
- `config/swagger.js` - Swagger documentation đã được cập nhật
- `.env` - Environment variables

✅ **Database:**
- `database/seed.sql` - Dữ liệu mẫu (roles, banners, etc.)

✅ **OpenAPI Specs:**
- `openapi/paths/auth-register.yaml`
- `openapi/paths/auth-login.yaml`
- `openapi/components/schemas/user.yaml`
- `openapi/openapi.yaml` - Updated với auth endpoints

✅ **Documentation:**
- `AUTH_API_README.md` - Chi tiết về API
- `DATABASE_SETUP.md` - Hướng dẫn setup database
- `QUICKSTART.md` - File này

---

## ✨ Features đã implement

✅ Đăng ký tài khoản với bcrypt password hashing  
✅ Đăng nhập với JWT token  
✅ Tự động gán role CUSTOMER cho user mới  
✅ Validation email format  
✅ Validation password length (min 6 chars)  
✅ Check duplicate email  
✅ Full Swagger/OpenAPI documentation  
✅ Modular OpenAPI structure (YAML files)  

---

## 🎯 Next Steps

Sau khi test thành công API đăng ký, bạn có thể:

1. ✅ Test API Login
2. ⬜ Implement middleware xác thực JWT token
3. ⬜ Tạo API protected endpoints (cần token)
4. ⬜ Implement forgot password / reset password
5. ⬜ Implement email verification
6. ⬜ Thêm API quản lý users (CRUD)

---

**Chúc bạn test thành công!** 🎉

Nếu gặp lỗi, check log server và tham khảo phần Troubleshooting ở trên.
