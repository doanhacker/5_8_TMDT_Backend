# Hệ thống Quản lý Tin tức

## 📋 Tổng quan

Hệ thống quản lý tin tức đầy đủ với backend API và frontend interface, hỗ trợ quản lý danh mục và bài viết tin tức.

## 🗄️ Database Schema

### Bảng `blog_categories` (Danh mục tin tức)
```sql
- category_id (INT, PRIMARY KEY, AUTO_INCREMENT)
- category_name (VARCHAR(100), UNIQUE, NOT NULL)
- description (VARCHAR(255))
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
```

### Bảng `blog_posts` (Bài viết tin tức)
```sql
- post_id (INT, PRIMARY KEY, AUTO_INCREMENT)
- category_id (INT, FOREIGN KEY)
- author_id (INT, FOREIGN KEY)
- title (VARCHAR(255), NOT NULL)
- thumbnail_url (VARCHAR(255))
- content_html (LONGTEXT, NOT NULL)
- view_count (INT, DEFAULT 0)
- status (ENUM: 'DRAFT', 'PUBLISHED', 'HIDDEN', DEFAULT 'DRAFT')
- published_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
```

## 🔌 API Endpoints

### Blog Categories API

#### 1. Lấy tất cả danh mục
- **Endpoint:** `GET /api/blog/categories`
- **Access:** Public
- **Response:**
```json
{
  "success": true,
  "message": "Lấy danh mục thành công",
  "data": [
    {
      "category_id": 1,
      "category_name": "Khuyến mãi",
      "description": "Tin khuyến mãi, ưu đãi",
      "post_count": 5,
      "created_at": "2026-03-05T00:00:00.000Z"
    }
  ]
}
```

#### 2. Lấy danh mục theo ID
- **Endpoint:** `GET /api/blog/categories/:id`
- **Access:** Public

#### 3. Tạo danh mục mới
- **Endpoint:** `POST /api/blog/categories`
- **Access:** Admin
- **Body:**
```json
{
  "category_name": "Công nghệ",
  "description": "Tin tức công nghệ mới nhất"
}
```

#### 4. Cập nhật danh mục
- **Endpoint:** `PUT /api/blog/categories/:id`
- **Access:** Admin
- **Body:**
```json
{
  "category_name": "Công nghệ AI",
  "description": "Tin tức về AI và Machine Learning"
}
```

#### 5. Xóa danh mục
- **Endpoint:** `DELETE /api/blog/categories/:id`
- **Access:** Admin

### Blog Posts API

#### 1. Lấy bài viết đã publish
- **Endpoint:** `GET /api/blog/posts/published`
- **Access:** Public
- **Query params:** `?limit=10&offset=0`

#### 2. Lấy tất cả bài viết (bao gồm draft)
- **Endpoint:** `GET /api/blog/posts/all`
- **Access:** Admin

#### 3. Lấy bài viết theo danh mục
- **Endpoint:** `GET /api/blog/posts/category/:categoryId`
- **Access:** Public

#### 4. Lấy chi tiết bài viết
- **Endpoint:** `GET /api/blog/posts/:id`
- **Access:** Public
- **Note:** Tự động tăng view_count khi bài viết đã publish

#### 5. Tìm kiếm bài viết
- **Endpoint:** `GET /api/blog/posts/search`
- **Access:** Public
- **Query params:** `?q=keyword`

#### 6. Lấy bài viết liên quan
- **Endpoint:** `GET /api/blog/posts/:id/related`
- **Access:** Public
- **Query params:** `?limit=4`

#### 7. Tạo bài viết mới
- **Endpoint:** `POST /api/blog/posts`
- **Access:** Admin
- **Body:**
```json
{
  "category_id": 1,
  "title": "Top 5 Laptop Gaming 2026",
  "thumbnail_url": "https://example.com/image.jpg",
  "content_html": "<p>Nội dung bài viết...</p>",
  "status": "DRAFT"
}
```

#### 8. Cập nhật bài viết
- **Endpoint:** `PUT /api/blog/posts/:id`
- **Access:** Admin
- **Body:** (Giống như tạo bài viết)

#### 9. Xóa bài viết
- **Endpoint:** `DELETE /api/blog/posts/:id`
- **Access:** Admin

## 🎨 Frontend Components

### 1. AdminNewsManagement Component (Admin Panel)
**Location:** `frontend/src/components/admin/AdminNewsManagement.jsx`

**Features:**
- ✅ Quản lý danh mục tin tức (CRUD)
- ✅ Quản lý bài viết (CRUD)
- ✅ Lưu nháp và đăng bài
- ✅ Lọc theo trạng thái và danh mục
- ✅ Upload hình ảnh thumbnail
- ✅ Soạn thảo nội dung HTML
- ✅ Preview ảnh

**Tabs:**
- **Bài viết:** Tạo, sửa, xóa, đăng bài
- **Danh mục:** Tạo, sửa, xóa danh mục

**Trạng thái bài viết:**
- `DRAFT` - Nháp
- `PUBLISHED` - Đã đăng
- `HIDDEN` - Ẩn

### 2. News Page (Public)
**Location:** `frontend/src/pages/News.jsx`

**Features:**
- ✅ Hiển thị danh sách bài viết đã publish
- ✅ Lọc theo danh mục
- ✅ Xem chi tiết bài viết
- ✅ Hiển thị lượt xem
- ✅ Render nội dung HTML
- ✅ Responsive design

## 🚀 Cách sử dụng

### 1. Setup Backend

1. Đảm bảo database đã có các bảng `blog_categories` và `blog_posts` (đã có sẵn trong init.sql)

2. Khởi động server backend:
```bash
cd backend
npm install
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

### 2. Setup Frontend

1. Khởi động frontend:
```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### 3. Tạo tin tức (Admin)

1. Đăng nhập vào Admin Panel
2. Vào mục "Quản lý tin tức"
3. **Tạo danh mục trước:**
   - Chuyển sang tab "Danh mục"
   - Nhập tên danh mục và mô tả
   - Click "Thêm mới"

4. **Tạo bài viết:**
   - Chuyển sang tab "Bài viết"
   - Nhập thông tin bài viết:
     - Tiêu đề
     - Chọn danh mục
     - URL hình ảnh thumbnail
     - Nội dung HTML
   - Chọn trạng thái
   - Click "Lưu nháp" hoặc "Lưu & Đăng ngay"

### 4. Xem tin tức (Public)

1. Truy cập trang News: `http://localhost:5173/news`
2. Lọc theo danh mục (nếu có)
3. Click "Đọc thêm" để xem chi tiết bài viết

## 📝 Các file được tạo/cập nhật

### Backend
- ✅ `models/blogModel.js` - Model xử lý database
- ✅ `controllers/blogController.js` - Controller xử lý logic API
- ✅ `routes/blogRoutes.js` - Định nghĩa routes
- ✅ `server.js` - Thêm blog routes

### Frontend
- ✅ `components/admin/AdminNewsManagement.jsx` - Component quản lý tin tức
- ✅ `pages/News.jsx` - Trang hiển thị tin tức công khai
- ✅ `styles/AdminNews.css` - CSS cho admin news
- ✅ `styles/News.css` - CSS cho trang tin tức

### Database
- ✅ `database/init.sql` - Đã có sẵn schema cho blog_categories và blog_posts

## 🔒 Security Notes

- Hiện tại các API admin chưa có authentication middleware
- Khuyến nghị thêm middleware kiểm tra quyền admin cho các API:
  - POST/PUT/DELETE categories
  - POST/PUT/DELETE posts
  - GET /posts/all

## 🎯 Tính năng có thể mở rộng

- [ ] Rich text editor (TinyMCE, CKEditor)
- [ ] Upload ảnh lên server thay vì dùng URL
- [ ] SEO metadata (meta title, description, keywords)
- [ ] Tags/từ khóa cho bài viết
- [ ] Comment system
- [ ] Like/share bài viết
- [ ] Lịch sử chỉnh sửa bài viết
- [ ] Multi-language support
- [ ] Email notification khi có bài viết mới

## 📧 API Testing

Có thể test API bằng Postman hoặc cURL:

```bash
# Lấy danh sách bài viết
curl http://localhost:5000/api/blog/posts/published

# Tạo danh mục mới
curl -X POST http://localhost:5000/api/blog/categories \
  -H "Content-Type: application/json" \
  -d '{"category_name":"Tin hot","description":"Tin tức nổi bật"}'

# Tạo bài viết mới
curl -X POST http://localhost:5000/api/blog/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Bài viết test",
    "content_html":"<p>Nội dung test</p>",
    "category_id":1,
    "status":"PUBLISHED"
  }'
```

## ✅ Hoàn thành

Hệ thống quản lý tin tức đã được tích hợp hoàn toàn với backend API và frontend. Bạn có thể:
- Tạo, sửa, xóa danh mục tin tức
- Tạo, sửa, xóa, đăng bài viết
- Xem tin tức công khai với lọc theo danh mục
- Tracking lượt xem bài viết

## 🐛 Troubleshooting

### Lỗi kết nối API
- Kiểm tra backend server đang chạy tại port 5000
- Kiểm tra CORS đã được enable trong server.js

### Không hiển thị tin tức
- Đảm bảo đã tạo danh mục trước
- Đảm bảo bài viết có status là "PUBLISHED"
- Kiểm tra console log để xem lỗi API

### Lỗi database
- Đảm bảo MySQL đang chạy
- Kiểm tra file .env có đúng thông tin database
- Chạy file init.sql để tạo bảng
