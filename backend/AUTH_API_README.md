# API Authentication - Đăng ký & Đăng nhập

## 📌 Tổng quan

API xác thực người dùng bao gồm:
- **POST /api/auth/register** - Đăng ký tài khoản mới
- **POST /api/auth/login** - Đăng nhập tài khoản

## 🔧 Cấu hình trước khi sử dụng

### 1. Import Database

```bash
# Import cấu trúc database
mysql -u root -p < database/init.sql

# Import dữ liệu mẫu (bao gồm roles)
mysql -u root -p < database/seed.sql
```

### 2. Cấu hình Environment Variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các giá trị trong `.env`:
```env
JWT_SECRET=your-super-secret-key-here
DB_NAME=laptop_ecommerce_db
PORT=5000
```

### 3. Khởi động Server

```bash
npm install
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api-docs`

---

## 📝 API Endpoints

### 1. Đăng ký tài khoản mới

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "phone_number": "0901234567"
}
```

**Required Fields:**
- `email` (string, email format)
- `password` (string, min 6 characters)
- `full_name` (string)

**Optional Fields:**
- `phone_number` (string)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "user": {
      "user_id": 2,
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "phone_number": "0901234567",
      "status": "ACTIVE",
      "created_at": "2026-03-03T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- **400 Bad Request** - Thiếu thông tin hoặc dữ liệu không hợp lệ
```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc: email, password, full_name"
}
```

- **409 Conflict** - Email đã tồn tại
```json
{
  "success": false,
  "message": "Email đã được đăng ký"
}
```

---

### 2. Đăng nhập

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Required Fields:**
- `email` (string)
- `password` (string)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "user_id": 2,
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "phone_number": "0901234567",
      "status": "ACTIVE",
      "created_at": "2026-03-03T10:00:00.000Z",
      "roles": [
        {
          "role_id": 3,
          "role_name": "CUSTOMER"
        }
      ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- **400 Bad Request** - Thiếu email hoặc password
```json
{
  "success": false,
  "message": "Thiếu email hoặc password"
}
```

- **401 Unauthorized** - Sai email hoặc password
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng"
}
```

- **403 Forbidden** - Tài khoản bị khóa
```json
{
  "success": false,
  "message": "Tài khoản đã bị khóa"
}
```

---

## 🧪 Test với Swagger UI

1. Truy cập: `http://localhost:5000/api-docs`
2. Mở section **Authentication**
3. Click vào endpoint muốn test
4. Click **"Try it out"**
5. Nhập dữ liệu vào Request body
6. Click **"Execute"**
7. Xem kết quả trong Response body

---

## 🧪 Test với cURL

### Đăng ký:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "full_name": "Test User",
    "phone_number": "0901234567"
  }'
```

### Đăng nhập:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

---

## 🧪 Test với Postman

### Import Collection

1. Tạo New Request
2. Method: **POST**
3. URL: `http://localhost:5000/api/auth/register`
4. Headers:
   - `Content-Type: application/json`
5. Body (raw, JSON):
```json
{
  "email": "test@example.com",
  "password": "123456",
  "full_name": "Test User",
  "phone_number": "0901234567"
}
```

---

## 🔐 JWT Token Usage

Sau khi đăng ký/đăng nhập thành công, bạn nhận được `token`. Sử dụng token này cho các API cần authentication:

```bash
curl -X GET http://localhost:5000/api/protected-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Token có hiệu lực **7 ngày** kể từ khi tạo.

---

## 📊 Database Schema

### Table: users
```sql
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    status ENUM('ACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: roles
```sql
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Default roles:
-- 1: ADMIN
-- 2: STAFF  
-- 3: CUSTOMER
```

### Table: user_roles
```sql
CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    UNIQUE(user_id, role_id)
);
```

---

## 🛡️ Security Features

✅ Password được hash bằng **bcrypt** (10 salt rounds)  
✅ JWT token với expiration time  
✅ Email validation  
✅ Password minimum length validation  
✅ Duplicate email check  
✅ Account status check (ACTIVE/LOCKED)  

---

## 🐛 Troubleshooting

### Lỗi: "Email đã được đăng ký"
- Email đã tồn tại trong database
- Thử đăng nhập hoặc dùng email khác

### Lỗi: "Unknown database 'laptop_ecommerce_db'"
- Chưa import database
- Chạy: `mysql -u root -p < database/init.sql`

### Lỗi: "Cannot find module 'bcrypt'"
- Chưa cài dependencies
- Chạy: `npm install`

### Lỗi kết nối MySQL
- Kiểm tra MySQL đang chạy
- Kiểm tra thông tin trong `.env` file
- Kiểm tra username/password MySQL

---

## 📚 Related Files

- **Model**: `models/userModel.js`
- **Controller**: `controllers/authController.js`
- **Routes**: `routes/authRoutes.js`
- **Config**: `config/swagger.js`, `.env`
- **Database**: `database/init.sql`, `database/seed.sql`

---

Chúc bạn test API thành công! 🎉
