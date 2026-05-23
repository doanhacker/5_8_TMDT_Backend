# API Documentation với Swagger

## 📚 Truy cập Swagger UI

Sau khi khởi động server backend, truy cập Swagger UI tại:

```
http://localhost:5000/api-docs
```

## 🚀 Cách sử dụng Swagger để test API

### 1. **GET /api/sliders** - Lấy danh sách sliders

#### Bước test:
1. Mở Swagger UI tại `http://localhost:5000/api-docs`
2. Click vào endpoint **GET /api/sliders**
3. Click nút **"Try it out"**
4. Click nút **"Execute"**
5. Xem kết quả trả về ở phần **Response body**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": [
    {
      "slider_id": 1,
      "title": "Summer Sale",
      "image_url": "https://example.com/banner.jpg",
      "link_url": "https://example.com/sale",
      "display_order": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. **POST /api/sliders** - Tạo slider mới

#### Bước test:
1. Mở Swagger UI tại `http://localhost:5000/api-docs`
2. Click vào endpoint **POST /api/sliders**
3. Click nút **"Try it out"**
4. Chỉnh sửa Request body (JSON) theo mẫu:

```json
{
  "title": "Khuyến mãi Black Friday",
  "image_url": "https://example.com/blackfriday.jpg",
  "link_url": "https://example.com/blackfriday",
  "display_order": 2,
  "is_active": true
}
```

5. Click nút **"Execute"**
6. Xem kết quả trả về ở phần **Response body**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Thêm Slider mới thành công!",
  "data": {
    "id": 2,
    "title": "Khuyến mãi Black Friday",
    "image_url": "https://example.com/blackfriday.jpg",
    "link_url": "https://example.com/blackfriday",
    "display_order": 2,
    "is_active": true
  }
}
```

---

## � Blog APIs - Quản lý Tin tức

### 3. **GET /api/blog/categories** - Lấy danh sách danh mục tin tức

#### Bước test:
1. Mở Swagger UI tại `http://localhost:5000/api-docs`
2. Tìm section **Blog Categories**
3. Click vào endpoint **GET /api/blog/categories**
4. Click nút **"Try it out"**
5. Click nút **"Execute"**
6. Xem kết quả ở phần **Response body**

#### Kết quả mong đợi:
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

---

### 4. **POST /api/blog/categories** - Tạo danh mục mới

#### Bước test:
1. Mở Swagger UI
2. Tìm section **Blog Categories**
3. Click vào endpoint **POST /api/blog/categories**
4. Click nút **"Try it out"**
5. Nhập Request body:

```json
{
  "category_name": "Công nghệ",
  "description": "Tin tức công nghệ mới nhất"
}
```

6. Click nút **"Execute"**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Tạo danh mục thành công",
  "data": {
    "category_id": 2,
    "category_name": "Công nghệ",
    "description": "Tin tức công nghệ mới nhất"
  }
}
```

---

### 5. **GET /api/blog/posts/published** - Lấy bài viết đã đăng

#### Bước test:
1. Mở Swagger UI
2. Tìm section **Blog Posts**
3. Click vào endpoint **GET /api/blog/posts/published**
4. Click nút **"Try it out"**
5. (Tùy chọn) Nhập parameters:
   - `limit`: 10
   - `offset`: 0
6. Click nút **"Execute"**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Lấy danh sách bài viết thành công",
  "data": [
    {
      "post_id": 1,
      "title": "Top 5 Laptop Gaming 2026",
      "thumbnail_url": "https://example.com/image.jpg",
      "content_html": "<p>Nội dung bài viết...</p>",
      "view_count": 100,
      "status": "PUBLISHED",
      "published_at": "2026-03-05T00:00:00.000Z",
      "category_name": "Khuyến mãi",
      "author_name": "Admin"
    }
  ]
}
```

---

### 6. **POST /api/blog/posts** - Tạo bài viết mới

#### Bước test:
1. Mở Swagger UI
2. Tìm section **Blog Posts**
3. Click vào endpoint **POST /api/blog/posts**
4. Click nút **"Try it out"**
5. Nhập Request body:

```json
{
  "category_id": 1,
  "title": "Top 5 Laptop Gaming 2026",
  "thumbnail_url": "https://example.com/laptop-gaming.jpg",
  "content_html": "<h2>Giới thiệu</h2><p>Năm 2026 đánh dấu sự bùng nổ của công nghệ laptop gaming với nhiều mẫu máy ấn tượng...</p>",
  "status": "DRAFT"
}
```

6. Click nút **"Execute"**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Tạo bài viết thành công",
  "data": {
    "post_id": 1,
    "category_id": 1,
    "title": "Top 5 Laptop Gaming 2026",
    "thumbnail_url": "https://example.com/laptop-gaming.jpg",
    "content_html": "<h2>Giới thiệu</h2><p>Năm 2026...</p>",
    "status": "DRAFT"
  }
}
```

---

### 7. **PUT /api/blog/posts/{id}** - Cập nhật và đăng bài

#### Bước test (Đăng bài từ DRAFT sang PUBLISHED):
1. Mở Swagger UI
2. Tìm endpoint **PUT /api/blog/posts/{id}**
3. Click nút **"Try it out"**
4. Nhập `id` của bài viết (ví dụ: 1)
5. Nhập Request body (thay đổi status sang PUBLISHED):

```json
{
  "category_id": 1,
  "title": "Top 5 Laptop Gaming 2026",
  "thumbnail_url": "https://example.com/laptop-gaming.jpg",
  "content_html": "<h2>Giới thiệu</h2><p>Nội dung đầy đủ...</p>",
  "status": "PUBLISHED"
}
```

6. Click nút **"Execute"**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Cập nhật bài viết thành công"
}
```

---

### 8. **GET /api/blog/posts/{id}** - Xem chi tiết bài viết

#### Bước test:
1. Mở Swagger UI
2. Tìm endpoint **GET /api/blog/posts/{id}**
3. Click nút **"Try it out"**
4. Nhập `id` của bài viết (ví dụ: 1)
5. Click nút **"Execute"**

**Lưu ý:** API tự động tăng `view_count` mỗi lần gọi nếu bài viết đã PUBLISHED.

---

### 9. **GET /api/blog/posts/search** - Tìm kiếm bài viết

#### Bước test:
1. Mở Swagger UI
2. Tìm endpoint **GET /api/blog/posts/search**
3. Click nút **"Try it out"**
4. Nhập parameter `q` (từ khóa tìm kiếm):
   - Ví dụ: "laptop gaming"
5. Click nút **"Execute"**

#### Kết quả mong đợi:
Trả về danh sách bài viết có chứa từ khóa trong tiêu đề hoặc nội dung.

---

### 10. **GET /api/blog/posts/category/{categoryId}** - Lọc bài viết theo danh mục

#### Bước test:
1. Mở Swagger UI
2. Tìm endpoint **GET /api/blog/posts/category/{categoryId}**
3. Click nút **"Try it out"**
4. Nhập `categoryId` (ví dụ: 1)
5. Click nút **"Execute"**

#### Kết quả mong đợi:
Trả về tất cả bài viết PUBLISHED thuộc danh mục đó.

---

## 📦 Brand APIs - Quản lý Thương hiệu

### 11. **GET /api/brands** - Lấy danh sách thương hiệu

#### Bước test:
1. Mở Swagger UI tại `http://localhost:5000/api-docs`
2. Tìm section **Brands**
3. Click vào endpoint **GET /api/brands**
4. Click nút **"Try it out"**
5. Click nút **"Execute"**
6. Xem kết quả ở phần **Response body**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Lấy danh sách thương hiệu thành công",
  "data": [
    {
      "brand_id": 1,
      "brand_name": "ASUS",
      "logo_url": "https://example.com/asus-logo.png",
      "product_count": 15
    },
    {
      "brand_id": 2,
      "brand_name": "Dell",
      "logo_url": "https://example.com/dell-logo.png",
      "product_count": 8
    }
  ]
}
```

---

### 12. **POST /api/brands** - Tạo thương hiệu mới

#### Bước test:
1. Mở Swagger UI
2. Tìm section **Brands**
3. Click vào endpoint **POST /api/brands**
4. Click nút **"Try it out"**
5. Nhập Request body:

```json
{
  "brand_name": "MSI",
  "logo_url": "https://example.com/msi-logo.png"
}
```

6. Click nút **"Execute"**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Thêm thương hiệu thành công!",
  "data": {
    "brand_id": 3,
    "brand_name": "MSI",
    "logo_url": "https://example.com/msi-logo.png"
  }
}
```

**Lưu ý**: Nếu tên thương hiệu đã tồn tại, API sẽ trả về lỗi 409:
```json
{
  "success": false,
  "message": "Tên thương hiệu đã tồn tại."
}
```

---

### 13. **GET /api/brands/{id}** - Xem chi tiết thương hiệu

#### Bước test:
1. Mở Swagger UI
2. Tìm endpoint **GET /api/brands/{id}**
3. Click nút **"Try it out"**
4. Nhập `id` của thương hiệu (ví dụ: 1)
5. Click nút **"Execute"**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Lấy chi tiết thương hiệu thành công",
  "data": {
    "brand_id": 1,
    "brand_name": "ASUS",
    "logo_url": "https://example.com/asus-logo.png",
    "product_count": 15
  }
}
```

---

### 14. **PUT /api/brands/{id}** - Cập nhật thương hiệu

#### Bước test:
1. Mở Swagger UI
2. Tìm endpoint **PUT /api/brands/{id}**
3. Click nút **"Try it out"**
4. Nhập `id` của thương hiệu (ví dụ: 1)
5. Nhập Request body (cập nhật tên hoặc logo):

```json
{
  "brand_name": "ASUS ROG",
  "logo_url": "https://example.com/asus-rog-logo.png"
}
```

6. Click nút **"Execute"**

#### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Cập nhật thương hiệu thành công!"
}
```

---

### 15. **DELETE /api/brands/{id}** - Xóa thương hiệu

#### Bước test:
1. Mở Swagger UI
2. Tìm endpoint **DELETE /api/brands/{id}**
3. Click nút **"Try it out"**
4. Nhập `id` của thương hiệu cần xóa
5. Click nút **"Execute"**

#### Kết quả mong đợi (thành công):
```json
{
  "success": true,
  "message": "Xóa thương hiệu thành công!"
}
```

#### Kết quả nếu thương hiệu đang được sử dụng:
```json
{
  "success": false,
  "message": "Không thể xóa thương hiệu này vì có sản phẩm đang sử dụng nó."
}
```

**Lưu ý**: Không thể xóa thương hiệu nếu có sản phẩm nào đang tham chiếu đến nó.

---

## 🎯 Workflow Test Product APIs từ đầu đến cuối

### Kịch bản: Tạo sản phẩm hoàn chỉnh

#### Bước 1: Tạo/Kiểm tra Brand và Category
```bash
# Lấy danh sách thương hiệu
GET /api/brands

# Lấy danh sách danh mục
GET /api/product-categories

# Nếu chưa có, tạo mới:
POST /api/brands
{
  "brand_name": "ASUS"
}

POST /api/product-categories
{
  "category_name": "Laptop Gaming",
  "parent_category_id": null
}
```

#### Bước 2: Lưu lại brand_id và category_id vừa tạo (ví dụ: brand_id=1, category_id=2)

#### Bước 3: Tạo sản phẩm với variants
```bash
POST /api/products
# Content-Type: multipart/form-data
# Fields:
- product_name: "ASUS ROG Strix G16"
- brand_id: 1
- category_id: 2
- description_html: "<p>Laptop gaming cao cấp</p>"
- highlight_features: "Màn hình 165Hz, RTX 4060"
- screen_size: 16
- weight_kg: 2.3
- os: "Windows 11"
- variants: '[{"sku":"ROG-G16-16-512","ram_gb":16,"storage_gb":512,"color_name":"Black","original_price":25990000,"stock_quantity":10}]'
- productImages: [file ảnh sản phẩm]
- variant_0_images: [file ảnh variant đầu tiên]
```

#### Bước 4: Lấy danh sách sản phẩm để kiểm tra
```bash
GET /api/products?page=1&limit=12
```

#### Bước 5: Xem chi tiết sản phẩm vừa tạo
```bash
GET /api/products/{productId}
```

---

## �📁 Cấu trúc file OpenAPI

### 1. **config/swagger.js**
File cấu hình chính cho Swagger:
- Định nghĩa thông tin API (title, version, description)
- Định nghĩa servers (development, production)
- Định nghĩa các schemas (Slider, SuccessResponse, ErrorResponse)
- Đường dẫn đến các file chứa JSDoc comments

### 2. **routes/sliderRoutes.js**
File routes có chứa JSDoc comments cho OpenAPI:
- Sử dụng `@swagger` tag
- Mô tả đầy đủ request/response
- Định nghĩa parameters, request body, responses

### 3. **server.js**
Tích hợp Swagger UI vào Express app:
```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## 🔧 Thông tin kỹ thuật

### OpenAPI Version: 3.0.0

### Components Schemas:

#### **Slider Schema**
```yaml
Slider:
  type: object
  required:
    - title
    - image_url
  properties:
    slider_id:
      type: integer
    title:
      type: string
    image_url:
      type: string
    link_url:
      type: string
    display_order:
      type: integer
    is_active:
      type: boolean
    created_at:
      type: string
      format: date-time
```

#### **BlogCategory Schema**
```yaml
BlogCategory:
  type: object
  required:
    - category_name
  properties:
    category_id:
      type: integer
      description: ID danh mục
    category_name:
      type: string
      description: Tên danh mục
    description:
      type: string
      description: Mô tả danh mục
    post_count:
      type: integer
      description: Số lượng bài viết
    created_at:
      type: string
      format: date-time
```

#### **BlogPost Schema**
```yaml
BlogPost:
  type: object
  required:
    - title
    - content_html
  properties:
    post_id:
      type: integer
      description: ID bài viết
    category_id:
      type: integer
      description: ID danh mục
    author_id:
      type: integer
      description: ID tác giả
    title:
      type: string
      description: Tiêu đề bài viết
    thumbnail_url:
      type: string
      description: URL hình ảnh thumbnail
    content_html:
      type: string
      description: Nội dung HTML
    view_count:
      type: integer
      description: Số lượt xem
    status:
      type: string
      enum: [DRAFT, PUBLISHED, HIDDEN]
      description: Trạng thái bài viết
    published_at:
      type: string
      format: date-time
      description: Thời gian xuất bản
    category_name:
      type: string
      description: Tên danh mục
    author_name:
      type: string
      description: Tên tác giả
```

#### **Brand Schema**
```yaml
Brand:
  type: object
  required:
    - brand_name
  properties:
    brand_id:
      type: integer
      description: ID thương hiệu
      example: 1
    brand_name:
      type: string
      description: Tên thương hiệu
      example: ASUS
    logo_url:
      type: string
      nullable: true
      description: URL logo thương hiệu
      example: https://example.com/asus-logo.png
    product_count:
      type: integer
      description: Số lượng sản phẩm của thương hiệu
      example: 15
```

#### **ProductCategory Schema**
```yaml
ProductCategory:
  type: object
  required:
    - category_name
  properties:
    category_id:
      type: integer
      description: ID danh mục sản phẩm
      example: 1
    category_name:
      type: string
      description: Tên danh mục
      example: Laptop Gaming
    parent_category_id:
      type: integer
      nullable: true
      description: ID danh mục cha
      example: null
```

---

## � Workflow Test Blog APIs từ đầu đến cuối

### Kịch bản: Tạo và đăng một bài viết tin tức hoàn chỉnh

#### Bước 1: Tạo danh mục mới
```bash
POST /api/blog/categories
{
  "category_name": "Laptop Gaming",
  "description": "Tin tức về laptop gaming"
}
```

#### Bước 2: Lưu category_id vừa tạo (ví dụ: 1)

#### Bước 3: Tạo bài viết ở trạng thái DRAFT
```bash
POST /api/blog/posts
{
  "category_id": 1,
  "title": "Top 5 Laptop Gaming Tốt Nhất 2026",
  "thumbnail_url": "https://example.com/gaming-laptop.jpg",
  "content_html": "<h2>Giới thiệu</h2><p>Danh sách 5 laptop gaming...</p>",
  "status": "DRAFT"
}
```

#### Bước 4: Lưu post_id vừa tạo (ví dụ: 1)

#### Bước 5: Cập nhật và đăng bài (DRAFT → PUBLISHED)
```bash
PUT /api/blog/posts/1
{
  "category_id": 1,
  "title": "Top 5 Laptop Gaming Tốt Nhất 2026",
  "thumbnail_url": "https://example.com/gaming-laptop.jpg",
  "content_html": "<h2>Giới thiệu</h2><p>Nội dung đầy đủ đã chỉnh sửa...</p>",
  "status": "PUBLISHED"
}
```

#### Bước 6: Xem bài viết đã đăng
```bash
GET /api/blog/posts/published
```

#### Bước 7: Xem chi tiết bài viết (tự động tăng view)
```bash
GET /api/blog/posts/1
```

#### Bước 8: Tìm kiếm bài viết
```bash
GET /api/blog/posts/search?q=gaming
```

#### Bước 9: Xem bài viết liên quan
```bash
GET /api/blog/posts/1/related?limit=4
```

---

## �💡 Tips

1. **Test nhanh**: Dùng Swagger UI để test API không cần Postman
2. **Xem schema**: Click vào **Schemas** ở cuối trang để xem cấu trúc dữ liệu
3. **Copy curl command**: Swagger tự động tạo curl command để test từ terminal
4. **Response codes**: Xem tất cả response codes có thể (200, 201, 400, 500...)5. **Test Blog workflow**: Tạo danh mục trước, sau đó tạo bài viết
6. **Status flow**: DRAFT → Chỉnh sửa → PUBLISHED → Có thể HIDDEN nếu cần
7. **View count**: Mỗi lần gọi GET /posts/{id} sẽ tăng view_count tự động
8. **Search**: API search hỗ trợ tìm trong cả title và content_html
---

## 📦 Packages đã cài đặt

```json
{
  "swagger-ui-express": "^5.0.1",
  "swagger-jsdoc": "^6.2.8"
}
```

---

## 🌐 URL quan trọng

- **Backend Server**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/api-docs
- **API Base URL**: http://localhost:5000/api

---

Chúc bạn test API thành công! 🎉
