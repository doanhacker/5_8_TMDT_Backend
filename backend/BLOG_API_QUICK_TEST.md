# 🚀 Quick Test Guide - Blog APIs với Swagger

## 📍 Truy cập Swagger UI
```
http://localhost:5000/api-docs
```

## ✅ Test nhanh Blog APIs trong 5 phút

### Bước 1: Khởi động server
```bash
cd backend
npm start
```

### Bước 2: Mở Swagger UI
Truy cập: http://localhost:5000/api-docs

### Bước 3: Tạo danh mục tin tức

1. Tìm section **"Blog Categories"**
2. Click **POST /api/blog/categories**
3. Click nút **"Try it out"**
4. Nhập Request body:

```json
{
  "category_name": "Laptop Gaming",
  "description": "Tin tức về laptop gaming"
}
```

5. Click **"Execute"**
6. **LƯU LẠI** `category_id` từ response (ví dụ: 1)

### Bước 4: Tạo bài viết mới

1. Tìm section **"Blog Posts"**
2. Click **POST /api/blog/posts**
3. Click nút **"Try it out"**
4. Nhập Request body (thay `category_id` bằng giá trị vừa lưu):

```json
{
  "category_id": 1,
  "title": "Top 5 Laptop Gaming Tốt Nhất 2026",
  "thumbnail_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800",
  "content_html": "<h2>Giới thiệu</h2><p>Năm 2026 đánh dấu sự bùng nổ của công nghệ laptop gaming với nhiều mẫu máy ấn tượng từ ASUS ROG, MSI Gaming, và Acer Predator.</p><h3>Top 5 Laptop Gaming</h3><ol><li><strong>ASUS ROG Strix G18</strong> - RTX 4090, Core i9</li><li><strong>MSI Titan GT77</strong> - Màn hình 4K 144Hz</li><li><strong>Acer Predator Helios 18</strong> - Tản nhiệt vượt trội</li><li><strong>Lenovo Legion 9i</strong> - Thiết kế đẹp mắt</li><li><strong>Razer Blade 18</strong> - Mỏng nhẹ nhất</li></ol>",
  "status": "DRAFT"
}
```

5. Click **"Execute"**
6. **LƯU LẠI** `post_id` từ response (ví dụ: 1)

### Bước 5: Đăng bài (DRAFT → PUBLISHED)

1. Click **PUT /api/blog/posts/{id}**
2. Click nút **"Try it out"**
3. Nhập `id` = 1 (hoặc post_id bạn vừa lưu)
4. Nhập Request body (giống bước 4 nhưng đổi status):

```json
{
  "category_id": 1,
  "title": "Top 5 Laptop Gaming Tốt Nhất 2026",
  "thumbnail_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800",
  "content_html": "<h2>Giới thiệu</h2><p>Năm 2026 đánh dấu sự bùng nổ của công nghệ laptop gaming...</p>",
  "status": "PUBLISHED"
}
```

5. Click **"Execute"**

### Bước 6: Xem bài viết đã đăng

1. Click **GET /api/blog/posts/published**
2. Click nút **"Try it out"**
3. Click **"Execute"**
4. Kiểm tra bài viết vừa tạo có trong danh sách

### Bước 7: Xem chi tiết bài viết

1. Click **GET /api/blog/posts/{id}**
2. Click nút **"Try it out"**
3. Nhập `id` = 1
4. Click **"Execute"**
5. **CHÚ Ý**: `view_count` sẽ tăng mỗi lần bạn gọi API này!

### Bước 8: Tìm kiếm bài viết

1. Click **GET /api/blog/posts/search**
2. Click nút **"Try it out"**
3. Nhập `q` = "gaming"
4. Click **"Execute"**

### Bước 9: Lọc theo danh mục

1. Click **GET /api/blog/posts/category/{categoryId}**
2. Click nút **"Try it out"**
3. Nhập `categoryId` = 1
4. Click **"Execute"**

---

## 🎯 Các API khác để test

### Quản lý danh mục

- ✅ **GET /api/blog/categories** - Lấy tất cả danh mục
- ✅ **GET /api/blog/categories/{id}** - Chi tiết danh mục
- ✅ **PUT /api/blog/categories/{id}** - Cập nhật danh mục
- ✅ **DELETE /api/blog/categories/{id}** - Xóa danh mục

### Quản lý bài viết

- ✅ **GET /api/blog/posts/all** - Lấy tất cả (kể cả DRAFT) - Admin
- ✅ **GET /api/blog/posts/{id}/related** - Bài viết liên quan
- ✅ **DELETE /api/blog/posts/{id}** - Xóa bài viết

---

## 📊 Response Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200  | Thành công (GET, PUT, DELETE) |
| 201  | Tạo mới thành công (POST) |
| 400  | Dữ liệu không hợp lệ |
| 404  | Không tìm thấy |
| 500  | Lỗi server |

---

## 💡 Mẹo test nhanh

1. **Swagger UI** tự động lưu parameters bạn vừa nhập
2. Click vào **"Schemas"** ở cuối trang để xem cấu trúc dữ liệu
3. Dùng **cURL command** mà Swagger generate để test từ terminal
4. Test theo thứ tự: Categories → Posts → Search/Filter

---

## 🐛 Troubleshooting

### Lỗi "Không tìm thấy danh mục"
→ Tạo danh mục trước khi tạo bài viết

### Lỗi "Tên danh mục đã tồn tại"
→ Mỗi danh mục phải có tên unique

### Bài viết không hiện trong /posts/published
→ Kiểm tra `status` phải là "PUBLISHED", không phải "DRAFT"

### View count không tăng
→ View count chỉ tăng khi status = "PUBLISHED"

---

## 🎉 Xong!

Bây giờ bạn có thể:
- ✅ Tạo và quản lý danh mục tin tức
- ✅ Tạo, sửa, xóa bài viết
- ✅ Đăng bài từ DRAFT → PUBLISHED
- ✅ Tìm kiếm và lọc bài viết
- ✅ Tracking lượt xem

**Next steps:**
- Test tất cả các API còn lại
- Tích hợp với Frontend Admin Panel
- Test trên Frontend News Page

---

📚 **Tài liệu đầy đủ:** Xem [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

🔗 **Swagger UI:** http://localhost:5000/api-docs
