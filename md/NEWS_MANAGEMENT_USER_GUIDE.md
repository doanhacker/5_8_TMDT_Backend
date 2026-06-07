# Hướng dẫn sử dụng Hệ thống quản lý Tin tức

## 📋 Tổng quan

Hệ thống quản lý tin tức đã được tích hợp hoàn toàn vào Admin Dashboard với đầy đủ chức năng CRUD và kết nối API backend.

## 🚀 Hướng dẫn sử dụng

### 1. Truy cập Quản lý Tin tức

1. Mở trình duyệt và truy cập: **http://localhost:5175/** (hoặc port frontend đang chạy)
2. Đăng nhập với tài khoản Admin
3. Trong menu bên trái, chọn **"Quản lý tin tức"** (icon 📖)

### 2. Quản lý Danh mục

#### Tạo danh mục mới
1. Click nút **"Quản lý Danh mục"** ở góc trên bên phải
2. Nhập tên danh mục (bắt buộc)
3. Nhập mô tả (tùy chọn)
4. Click **"Thêm"**

#### Xóa danh mục
- Click icon 🗑️ bên cạnh tên danh mục
- Xác nhận xóa

### 3. Quản lý Bài viết

#### Tạo bài viết mới
1. Click nút **"Tạo bài viết mới"** ở góc trên bên phải
2. Điền thông tin:
   - **Danh mục**: Chọn danh mục (bắt buộc)
   - **Tiêu đề**: Nhập tiêu đề bài viết (bắt buộc)
   - **Ảnh thumbnail**: Nhập URL ảnh (tùy chọn)
   - **Nội dung**: Nhập nội dung HTML (bắt buộc)
   - **Trạng thái**: Chọn DRAFT/PUBLISHED/HIDDEN
3. Click:
   - **"Lưu nháp"** để lưu dưới dạng nháp
   - **"Đăng bài"** để đăng bài ngay lập tức

#### Chỉnh sửa bài viết
1. Click icon ✏️ trên bài viết cần sửa
2. Cập nhật thông tin
3. Click **"Cập nhật"**

#### Thay đổi trạng thái bài viết
- **DRAFT → PUBLISHED**: Click icon ✅ (Đăng bài)
- **PUBLISHED → HIDDEN**: Click icon 👁️‍🗨️ (Ẩn bài)
- **HIDDEN → PUBLISHED**: Click icon 👁️ (Hiện bài)

#### Xóa bài viết
- Click icon 🗑️ trên bài viết
- Xác nhận xóa

### 4. Tìm kiếm và Lọc

#### Tìm kiếm bài viết
- Nhập từ khóa vào ô **"Tìm kiếm bài viết..."**
- Hệ thống sẽ tìm trong tiêu đề và nội dung

#### Lọc theo danh mục
- Chọn danh mục từ dropdown **"Tất cả danh mục"**

#### Lọc theo trạng thái
- Chọn trạng thái từ dropdown:
  - **Tất cả trạng thái**
  - **Nháp** (DRAFT)
  - **Đã đăng** (PUBLISHED)
  - **Ẩn** (HIDDEN)

## 🎨 Giao diện Người dùng

### Xem tin tức trên trang chủ
1. Truy cập: **http://localhost:5175/news**
2. Xem danh sách tin tức đã đăng
3. Lọc theo danh mục
4. Click vào bài viết để xem chi tiết

## 🔧 API Endpoints

### Categories
- `GET /api/blog/categories` - Lấy tất cả danh mục
- `GET /api/blog/categories/:id` - Lấy chi tiết danh mục
- `POST /api/blog/categories` - Tạo danh mục mới
- `PUT /api/blog/categories/:id` - Cập nhật danh mục
- `DELETE /api/blog/categories/:id` - Xóa danh mục

### Posts
- `GET /api/blog/posts` - Lấy bài viết đã đăng (public)
- `GET /api/blog/posts/all` - Lấy tất cả bài viết (admin)
- `GET /api/blog/posts/:id` - Lấy chi tiết bài viết
- `POST /api/blog/posts` - Tạo bài viết mới
- `PUT /api/blog/posts/:id` - Cập nhật bài viết
- `DELETE /api/blog/posts/:id` - Xóa bài viết
- `PATCH /api/blog/posts/:id/status` - Thay đổi trạng thái
- `GET /api/blog/posts/search` - Tìm kiếm bài viết
- `GET /api/blog/posts/:id/related` - Lấy bài viết liên quan

## 📚 Swagger API Documentation

Truy cập tài liệu API đầy đủ tại: **http://localhost:5000/api-docs**

Tại đây bạn có thể:
- Xem chi tiết tất cả các endpoint
- Test API trực tiếp từ trình duyệt
- Xem request/response schema
- Copy code examples

## 💾 Cấu trúc Database

### Bảng `blog_categories`
```sql
- category_id (INT, PRIMARY KEY, AUTO_INCREMENT)
- category_name (VARCHAR(100), UNIQUE, NOT NULL)
- description (TEXT)
- created_at (TIMESTAMP)
```

### Bảng `blog_posts`
```sql
- post_id (INT, PRIMARY KEY, AUTO_INCREMENT)
- category_id (INT, FOREIGN KEY)
- author_id (INT, FOREIGN KEY)
- title (VARCHAR(255), NOT NULL)
- thumbnail_url (VARCHAR(500))
- content_html (TEXT, NOT NULL)
- view_count (INT, DEFAULT 0)
- status (ENUM: DRAFT, PUBLISHED, HIDDEN)
- published_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🎯 Mẹo sử dụng

1. **Nội dung HTML**: Bạn có thể sử dụng HTML tags như `<p>`, `<h1>`, `<img>`, `<ul>`, `<ol>` trong nội dung bài viết

2. **Ảnh thumbnail**: Nên sử dụng URL ảnh có kích thước phù hợp (khuyến nghị: 800x450px)

3. **Trạng thái bài viết**:
   - **DRAFT**: Chỉ admin thấy, sử dụng để soạn thảo
   - **PUBLISHED**: Hiển thị công khai cho người dùng
   - **HIDDEN**: Đã đăng nhưng tạm ẩn, không hiển thị công khai

4. **Lượt xem**: Được tự động tăng khi người dùng xem chi tiết bài viết

## 🐛 Xử lý lỗi

### Lỗi không tải được danh mục/bài viết
1. Kiểm tra backend đang chạy: `http://localhost:5000/api/blog/categories`
2. Kiểm tra database connection
3. Xem console log trong Developer Tools

### Lỗi không tạo được bài viết
- Đảm bảo đã điền đầy đủ trường bắt buộc (*)
- Kiểm tra danh mục đã tồn tại
- Xem response error trong Network tab

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Backend logs trong terminal
2. Frontend console trong Developer Tools (F12)
3. Network requests trong tab Network
4. Database connection trong `backend/config/db.js`

---

**Enjoy blogging! 📝✨**
