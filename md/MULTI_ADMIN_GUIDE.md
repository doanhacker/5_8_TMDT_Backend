# 📋 MULTI-ADMIN SYSTEM GUIDE

## 🎯 Tổng Quan
Hệ thống cho phép **nhiều admin quản lý riêng từng danh mục sản phẩm**, giảm xung đột và dễ quản lý hơn.

---

## 👥 Các Admin Users

| Admin | Email | Password | Quản Lý |
|-------|-------|----------|---------|
| Admin Laptop | `admin.laptop@shop.com` | `AdminLaptop@123` | Máy tính xách tay |
| Admin Điện Thoại | `admin.dienthoai@shop.com` | `AdminPhone@123` | Điện thoại di động |
| Admin Tablet | `admin.tablet@shop.com` | `AdminTablet@123` | Máy tính bảng |
| Admin Phụ Kiện | `admin.accessory@shop.com` | `AdminAccessory@123` | Phụ kiện điện tử |
| Admin Smartwatch | `admin.smartwatch@shop.com` | `AdminWatch@123` | Đồng hồ thông minh |

---

## 🔐 Cách Đăng Nhập Admin

### Cách 1: Sử dụng Admin Panel (Web)
1. Truy cập trang admin: `http://localhost:5173/admin`
2. Nhập email + password tương ứng
3. Đăng nhập thành công

### Cách 2: Sử dụng API (Postman/Thunder Client)
```bash
POST http://localhost:5000/api/auth/admin/login
Content-Type: application/json

{
  "email": "admin.laptop@shop.com",
  "password": "AdminLaptop@123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "email": "admin.laptop@shop.com",
      "full_name": "Admin Laptop"
    }
  }
}
```

---

## 📦 Tạo Sản Phẩm Mới

### Quy Tắc
- ✅ Admin **chỉ có thể tạo** sản phẩm trong **danh mục được phân công**
- ✅ Khi tạo sản phẩm, `created_by` sẽ **tự động lưu admin ID**
- ✅ Admin **có thể chỉnh sửa** sản phẩm của chính mình
- ⚠️ Admin **không thể xóa** sản phẩm của admin khác (ngoại trừ super admin)

### Phạm Vi Quản Lý Theo Tài Khoản (Đã Áp Dụng)
- `admin.dienthoai@shop.com`: chỉ thao tác dữ liệu thuộc nhóm Điện thoại (PHONE)
- `admin.tablet@shop.com`: chỉ thao tác dữ liệu thuộc nhóm Máy tính bảng (TABLET)
- `admin.accessory@shop.com`: chỉ thao tác dữ liệu thuộc nhóm Phụ kiện điện tử (ACCESSORY/AUDIO)
- `admin.smartwatch@shop.com`: chỉ thao tác dữ liệu thuộc nhóm Đồng hồ thông minh (WATCH)

Các giới hạn trên được áp dụng cho tạo/sửa/xóa sản phẩm và kiểm tra phạm vi khi cập nhật thương hiệu, danh mục.

### Tích Hợp API Thật Cho Trang Danh Mục
- Trang Điện thoại: dùng dữ liệu thật từ API sản phẩm và facet thương hiệu/danh mục
- Trang Tablet: dùng dữ liệu thật từ API sản phẩm và facet thương hiệu/danh mục
- Trang Phụ kiện: dùng dữ liệu thật từ API sản phẩm và facet thương hiệu/danh mục
- Trang Smartwatch: dùng dữ liệu thật từ API sản phẩm và facet thương hiệu/danh mục

### API Tạo Sản Phẩm

```bash
POST http://localhost:5000/api/products
Authorization: Bearer <TOKEN_CỦA_ADMIN>
Content-Type: multipart/form-data

Body:
- product_name: "Laptop Gaming ASUS ROG"
- brand_id: 1
- category_id: 1
- device_type: "LAPTOP"
- description_html: "<p>Laptop gaming mạnh mẽ...</p>"
- screen_size: 15.6
- weight_kg: 2.1
- os: "Windows 11"
- variants: '[
    {
      "sku": "ASUS-ROG-001",
      "cpu_name": "Intel i9-13900K",
      "ram_gb": 32,
      "storage_gb": 1024,
      "color_name": "Đen",
      "original_price": 45000000,
      "discount_price": 39000000,
      "stock_quantity": 10
    }
  ]'
- productImages: [File]
- variant_0_images: [File]
```

---

## ✏️ Chỉnh Sửa & Xóa Sản Phẩm

### Quy Tắc Quyền Truy Cập
```javascript
// Kiểm tra quyền
if (product.created_by === currentAdmin.user_id || currentAdmin.isAdmin) {
  // Cho phép chỉnh sửa/xóa
} else {
  // Từ chối quyền truy cập
}
```

### API Cập Nhật Sản Phẩm

```bash
PUT http://localhost:5000/api/products/:productId
Authorization: Bearer <TOKEN_CỦA_ADMIN>
Content-Type: application/json

Body:
{
  "product_name": "Laptop Gaming ASUS ROG (Updated)",
  "discount_price": 38000000
}
```

---

## 📊 Xem Sản Phẩm Của Mình

### API Lọc Sản Phẩm Theo Creator

```bash
# Lấy tất cả sản phẩm được tạo bởi admin hiện tại
GET http://localhost:5000/api/products?created_by=<USER_ID>
Authorization: Bearer <TOKEN>
```

---

## 🚀 Lợi Ích Của Hệ Thống

| Lợi Ích | Mô Tả |
|---------|-------|
| 👤 **Phân Công Rõ Ràng** | Mỗi admin quản lý danh mục riêng, tránh nhầm lẫn |
| 🔒 **Bảo Mật Cao** | Không thể vô tình xóa sản phẩm của admin khác |
| 📈 **Dễ Quản Lý** | Theo dõi sản phẩm nào được tạo bởi ai |
| 🛡️ **Audit Trail** | Biết ai tạo sản phẩm, khi nào tạo (`created_by`, `created_at`) |

---

## ⚙️ Cấu Hình Thêm (Tuỳ Chọn)

### Tạo Admin Mới
```bash
POST http://localhost:5000/api/auth/admin/create-staff
Authorization: Bearer <TOKEN_ADMIN_TỐI_CAO>
Content-Type: application/json

Body:
{
  "name": "Admin Màn Hình",
  "email": "admin.monitor@shop.com",
  "phone": "0906666666",
  "password": "AdminMonitor@123",
  "role": "admin"
}
```

### Xem Tất Cả Admin Users
```bash
GET http://localhost:5000/api/auth/admin/users
Authorization: Bearer <TOKEN_ADMIN>
```

---

## 🔄 Database Schema

### Cấu trúc Bảng Products
```sql
products
├── product_id (INT, Primary Key)
├── product_name (VARCHAR)
├── brand_id (INT, FK)
├── category_id (INT, FK)
├── device_type (VARCHAR)
├── description_html (LONGTEXT)
├── created_by (INT, FK → users) ✨ MỚI
├── created_at (TIMESTAMP)
└── ...
```

---

## 📝 Lưu Ý Quan Trọng

1. **Luôn gửi Token**: API tạo/chỉnh sửa sản phẩm **bắt buộc** phải có `Authorization: Bearer <TOKEN>`
2. **Kiểm Tra Quyền**: Backend sẽ tự động kiểm tra xem admin có quyền chỉnh sửa sản phẩm không
3. **Mật Khẩu**: Lần đầu đăng nhập, **hãy đổi mật khẩu mặc định** trong cài đặt tài khoản
4. **Token Hết Hạn**: Nếu token hết hạn, cần đăng nhập lại để lấy token mới

---

## ❓ FAQ

**Q: Admin A có thể xem sản phẩm của Admin B không?**
- ✅ Có, nhưng chỉ có thể **xem**, không được **chỉnh sửa/xóa**

**Q: Làm sao để chỉnh sửa/xóa sản phẩm của admin khác?**
- 👤 Yêu cầu admin tối cao hoặc chủ cửa hàng cấp quyền super admin

**Q: Nếu quên mật khẩu phải làm sao?**
- 📧 Liên hệ chủ cửa hàng để reset mật khẩu hoặc sử dụng "Quên Mật Khẩu" nếu có tính năng

**Q: Có thể tạo role riêng không?**
- ⚙️ Hiện tại hỗ trợ 2 role: `admin` và `staff`. Cần cập nhật backend nếu muốn thêm role mới

---

## 📞 Hỗ Trợ

Nếu có vấn đề hoặc câu hỏi, liên hệ với team kỹ thuật.

**Happy managing!** 🎉
