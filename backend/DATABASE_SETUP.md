# 🗄️ Database Setup Guide

## Quick Setup (Windows)

### 1. Import Database Structure

Nếu bạn dùng XAMPP, có thể chạy nhanh toàn bộ bằng PowerShell:

```powershell
Set-Location "C:\Users\Win 11\laptop-shop\laptop-ecommerce\backend"
PowerShell -ExecutionPolicy Bypass -File .\restore-database.ps1
```

Nếu `mysql.exe` của bạn nằm ở vị trí khác, truyền thêm `-MySqlExe`:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\restore-database.ps1 -MySqlExe "C:\xampp\mysql\bin\mysql.exe"
```

Mở **Command Prompt** hoặc **PowerShell** và chạy:

```bash
# Chuyển đến thư mục backend
cd "C:\Users\Win 11\laptop-shop\laptop-ecommerce\backend"

# Import cấu trúc database
mysql -u root -p < database\init.sql

# Import dữ liệu mẫu
mysql -u root -p < database\seed.sql
```

Hoặc sử dụng **MySQL Workbench**:
1. Mở MySQL Workbench
2. Connect vào MySQL server
3. File → Open SQL Script → Chọn `database/init.sql`
4. Click Execute (⚡)
5. Lặp lại với `database/seed.sql`

---

## 2. Verify Database

Kiểm tra database đã tạo thành công:

```sql
-- Kiểm tra database
SHOW DATABASES;

-- Sử dụng database
USE laptop_ecommerce_db;

-- Kiểm tra các bảng
SHOW TABLES;

-- Kiểm tra roles đã có chưa
SELECT * FROM roles;
```

Kết quả mong đợi:
```
+----------+-----------+
| role_id  | role_name |
+----------+-----------+
|        1 | ADMIN     |
|        2 | STAFF     |
|        3 | CUSTOMER  |
+----------+-----------+
```

---

## 3. Cấu hình kết nối

Mở file `config/db.js` và đảm bảo thông tin đúng:

```javascript
const pool = mysql.createPool({
   host:'localhost',
    user:'root',
    password:'',  // Thay password MySQL của bạn
    database:'laptop_ecommerce_db',
    waitForConnections: true,
});
```

Hoặc sử dụng file `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=laptop_ecommerce_db
DB_PORT=3306
```

---

## 4. Test Connection

Khởi động server và kiểm tra log:

```bash
npm run dev
```

Nếu thành công, bạn sẽ thấy:
```
✅ Kết nối thành công đến MySQL (DB: laptop_ecommerce_db)
🚀 Server đang chạy tại port 5000
📚 Swagger UI: http://localhost:5000/api-docs
```

---

## Database Structure

### Core Tables

- **users** - Thông tin người dùng
- **roles** - Vai trò (Admin, Staff, Customer)
- **user_roles** - Gán vai trò cho user
- **user_addresses** - Địa chỉ giao hàng
- **products** - Sản phẩm laptop
- **brands** - Thương hiệu
- **categories** - Danh mục sản phẩm
- **orders** - Đơn hàng
- **order_details** - Chi tiết đơn hàng
- **carts** - Giỏ hàng
- **cart_details** - Chi tiết giỏ hàng
- **vouchers** - Mã giảm giá
- **slider_banners** - Banner quảng cáo
- **blog_posts** - Bài viết tin tức
- **reviews** - Đánh giá sản phẩm
- **notifications** - Thông báo

---

## Troubleshooting

### Lỗi: "Access denied for user 'root'@'localhost'"

**Giải pháp:**
1. Kiểm tra password MySQL
2. Cập nhật trong `config/db.js` hoặc `.env`
3. Hoặc tạo user mới:

```sql
CREATE USER 'laptop_shop'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON laptop_ecommerce_db.* TO 'laptop_shop'@'localhost';
FLUSH PRIVILEGES;
```

### Lỗi: "Unknown database 'laptop_ecommerce_db'"

**Giải pháp:**
- Chưa import `init.sql`
- Chạy lại: `mysql -u root -p < database/init.sql`

### Lỗi: "Table 'roles' doesn't exist"

**Giải pháp:**
- Chưa import `seed.sql`
- Chạy: `mysql -u root -p < database/seed.sql`

### Lỗi: "Can't connect to MySQL server"

**Giải pháp:**
1. Kiểm tra MySQL service đang chạy:
   - Windows: Services → MySQL → Start
2. Kiểm tra port 3306
3. Kiểm tra firewall

---

## Default Accounts (Seed Data)

Sau khi import `seed.sql`, bạn có thể dùng tài khoản admin:

```
Email: admin@laptop-shop.com
Password: admin123
Role: ADMIN
```

**⚠️ Lưu ý:** Đây là tài khoản mẫu, cần đổi password trong production!

---

## Reset Database

Nếu muốn reset toàn bộ database:

```sql
DROP DATABASE laptop_ecommerce_db;
```

Sau đó import lại `init.sql` và `seed.sql`.

---

Done! ✅
