# Admin Product API Integration Guide

## Tổng quan

Admin frontend đã được tích hợp hoàn toàn với backend API. Bây giờ tất cả thao tác CRUD trên sản phẩm sẽ gọi API thực tế thay vì sử dụng localStorage.

## Các thay đổi chính

### 1. ProductContext API Integration
**File:** `frontend/src/context/ProductContext.jsx`

- ✅ **Fetch products từ backend API** khi component mount
- ✅ **addProduct()** gọi `POST /api/products` với multipart/form-data
- ✅ **updateProduct()** gọi `PUT /api/products/:id` 
- ✅ **deleteProduct()** gọi `DELETE /api/products/:id`
- ✅ **Transform data** giữa format backend và frontend
- ✅ **Error handling** với state và console logs

### 2. Product API Service
**File:** `frontend/src/services/productApi.js`

Các methods:
- `getAllProducts(params)` - Lấy danh sách sản phẩm với pagination
- `getProductById(id)` - Lấy chi tiết 1 sản phẩm
- `createProduct(productData)` - Tạo sản phẩm mới (multipart upload)
- `updateProduct(id, productData)` - Cập nhật sản phẩm
- `deleteProduct(id)` - Xóa sản phẩm

### 3. Brand & Category APIs
**Files:**
- `frontend/src/services/brandApi.js`
- `frontend/src/services/categoryApi.js`

Methods:
- `getAllBrands()` - Lấy danh sách thương hiệu
- `getAllCategories()` - Lấy danh sách danh mục
- `getBrandById(id)` / `getCategoryById(id)` - Lấy chi tiết

### 4. Admin Form Updates
**File:** `frontend/src/components/admin/AdminProducts.jsx`

- ✅ **Brand dropdown** với brand_id thay vì text input
- ✅ **Category dropdown** với category_id thay vì hardcoded series
- ✅ **Image upload** lưu File object thay vì base64 string
- ✅ Preview image với `URL.createObjectURL()`

**File:** `frontend/src/pages/Admin.jsx`

- ✅ **Fetch brands & categories** khi component mount
- ✅ **handleProductSubmit** giờ là async function
- ✅ **Error handling** với try-catch và alert
- ✅ Pass brands/categories xuống AdminProducts

## Cấu trúc dữ liệu

### Frontend → Backend Mapping

```javascript
// Frontend form data
{
  name: "Laptop ASUS TUF Gaming",
  brand_id: 1,                    // ID từ dropdown (required!)
  category_id: 1,                 // ID từ dropdown (required!)
  ram: "16GB",                    // String from dropdown
  ramType: "DDR5",
  storage: "512GB",               // String from dropdown
  cpu: "Intel Core i5",
  graphics: "NVIDIA RTX 3050",
  screenSize: "15.6",
  weightKg: "2.3",
  os: "Windows 11",
  price: 22490000,
  oldPrice: 24490000,
  stock: 50,
  imageFile: File      // File object từ input (required!)
}

// Được transform thành backend format
{
  product_name: "Laptop ASUS TUF Gaming",
  brand_id: 1,                   // Integer (parsed)
  category_id: 1,                // Integer (parsed)
  description_html: "<p>Laptop chất lượng cao</p>",
  highlight_features: "Hiệu năng mạnh mẽ",
  screen_size: 15.6,             // Float (parsed)
  weight_kg: 2.3,                // Float (parsed)
  os: "Windows 11",
  variants: [{
    sku: "ASUS-1234567890",
    color_name: "Default",       // Backend expects color_name (not color)
    ram_gb: 16,                  // Integer (extracted from "16GB")
    ram_type: "DDR5",
    storage_gb: 512,             // Integer (extracted from "512GB")
    cpu_name: "Intel Core i5",   // Backend expects cpu_name (not cpu)
    cpu_benchmark_score: null,
    gpu: "NVIDIA RTX 3050",      // Backend expects gpu (not graphics_card)
    original_price: 22490000,    // Backend expects original_price (not price)
    discount_price: 24490000,    // Backend expects discount_price (not compare_at_price)
    stock_quantity: 50,
    status: "IN_STOCK"
  }],
  productImages: File,           // Multipart file (required!)
  variantImages: [File]          // Array of files (at least 1 required!)
}
```

### Backend → Frontend Mapping

```javascript
// Backend API response
{
  product_id: 1,
  product_name: "Laptop ASUS TUF Gaming",
  brand_name: "ASUS",
  category_name: "Gaming",
  screen_size: 15.6,
  weight_kg: 2.3,
  os: "Windows 11",
  variants: [{
    variant_id: 1,
    ram: "16GB",
    ram_type: "DDR5",
    storage: "512GB",
    cpu: "Intel Core i5",
    graphics_card: "NVIDIA RTX 3050",
    price: 22490000,
    compare_at_price: 24490000,
    stock_quantity: 50,
    images: [{ image_url: "https://cloudinary.com/..." }]
  }],
  images: [{ image_url: "https://cloudinary.com/..." }]
}

// Được transform thành frontend format
{
  id: "1",
  name: "Laptop ASUS TUF Gaming",
  brand: "ASUS",
  series: "Gaming",
  ram: "16GB",
  ramType: "DDR5",
  storage: "512GB",
  cpu: "Intel Core i5",
  graphics: "NVIDIA RTX 3050",
  screenSize: "15.6 inch",
  weightKg: 2.3,
  os: "Windows 11",
  price: 22490000,
  oldPrice: 24490000,
  stock: 50,
  inStock: true,
  image: "https://cloudinary.com/...",
  specs: "Intel Core i5 | NVIDIA RTX 3050",
  config: "16GB DDR5 | 512GB | 15.6 inch",
  discount: "Giảm 8%",
  installment: "Trả góp 0%"
}
```

## Cách sử dụng

### Thêm sản phẩm mới

1. Chạy backend server: `cd backend && npm start`
2. Chạy frontend: `cd frontend && npm run dev`
3. Đăng nhập vào admin panel
4. Vào module "Sản phẩm"
5. Điền form:
   - **Tên sản phẩm**: Tên đầy đủ
   - **Thương hiệu**: Chọn từ dropdown (ASUS, Dell, HP, etc.)
   - **Danh mục**: Chọn từ dropdown (Gaming, Văn phòng, etc.)
   - **Giá**: Số nguyên (VD: 22490000)
   - **CPU, RAM, Storage, Graphics**: Thông số kỹ thuật
   - **Hình ảnh**: Upload file ảnh (jpg, png, etc.)
6. Click "Lưu"
7. Sản phẩm sẽ được tạo trên backend và Cloudinary sẽ upload ảnh

### Kiểm tra API

Mở DevTools Console để xem:
- ✅ Fetch products log khi load trang
- ✅ Create product response sau khi submit form
- ⚠️ Error messages nếu có lỗi

### Troubleshooting

**Lỗi: HTTP 400 "Bad Request"**
- Kiểm tra Console log để xem error details
- Lỗi phổ biến:
  - `brand_id` hoặc `category_id` không được chọn (empty string)
  - Variant fields sai format (ram="16GB" thay vì ram_gb=16)
  - Thiếu ảnh (productImages hoặc variant_0_images)
  - Field names không match backend schema

**Lỗi: "Vui lòng chọn thương hiệu"**
- Dropdown Brand chưa được chọn
- Brands chưa được fetch từ API
- Check: Brands có dữ liệu không bằng cách mở React DevTools

**Lỗi: "Vui lòng chọn danh mục"**
- Dropdown Category chưa được chọn
- Categories chưa được fetch từ API

**Lỗi: "Vui lòng upload hình ảnh sản phẩm"**
- Chưa chọn file từ input[type="file"]
- imageFile trong productForm là null

**Lỗi: "products is not defined"**
- Backend chưa chạy hoặc API không trả về data
- Check console: `Error fetching products: ...`

**Lỗi: "Must supply api_key"**
- Cloudinary credentials chưa được set trong backend/.env
- Upload sẽ fallback về local disk storage

**Lỗi: "brand_id is required"**
- Brands chưa được fetch hoặc dropdown trống
- Check: `console.log(brands)` trong Admin.jsx

**Sản phẩm không hiển thị**
- Refresh trang để fetch lại từ API
- Check backend logs: có POST request success không?
- Kiểm tra database: `SELECT * FROM products ORDER BY product_id DESC LIMIT 5;`

## API Endpoints được sử dụng

### Products
- `GET /api/products` - Lấy danh sách
- `GET /api/products/:id` - Chi tiết
- `POST /api/products` - Tạo mới (multipart)
- `PUT /api/products/:id` - Cập nhật (multipart)
- `DELETE /api/products/:id` - Xóa

### Brands
- `GET /api/brands` - Lấy danh sách thương hiệu
- `GET /api/brands/:id` - Chi tiết thương hiệu

### Categories
- `GET /api/product-categories` - Lấy danh sách danh mục
- `GET /api/product-categories/:id` - Chi tiết danh mục

## Environment Variables cần thiết

**Backend (.env):**
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=laptop_ecommerce

# Cloudinary (Optional - fallback to local disk)
CLOUDINARY_CLOUD_NAME=dkrisyrlh
CLOUDINARY_API_KEY=963277588483967
CLOUDINARY_API_SECRET=5hdQDdyg7EH8d_fOt-3HpRVIndI

# Server
PORT=5000
JWT_SECRET=your-secret-key
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000
```

## Testing

### Test thêm sản phẩm với curl:

```bash
curl -X POST http://localhost:5000/api/products \
  -F "product_name=Test Laptop" \
  -F "brand_id=1" \
  -F "category_id=1" \
  -F "description_html=<p>Test description</p>" \
  -F "highlight_features=Test features" \
  -F "screen_size=15.6" \
  -F "weight_kg=2.0" \
  -F "os=Windows 11" \
  -F 'variants=[{"sku_code":"TEST-001","color":"Black","ram":"16GB","ram_type":"DDR4","storage":"512GB","cpu":"Intel Core i5","graphics_card":"NVIDIA RTX 3050","price":20000000,"compare_at_price":22000000,"stock_quantity":10,"status":"IN_STOCK"}]' \
  -F "productImages=@/path/to/image.jpg" \
  -F "variant_0_images=@/path/to/image.jpg"
```

### Test với Admin UI:

1. Mở http://localhost:5173/admin
2. Đăng nhập với admin account
3. Thêm sản phẩm mới
4. Check Console để thấy API calls
5. Verify trong database

## Các file đã thay đổi

- ✅ `frontend/src/context/ProductContext.jsx` - API integration thay localStorage
- ✅ `frontend/src/services/productApi.js` - Product API service (NEW)
- ✅ `frontend/src/services/brandApi.js` - Brand API service (NEW)
- ✅ `frontend/src/services/categoryApi.js` - Category API service (NEW)
- ✅ `frontend/src/pages/Admin.jsx` - Fetch brands/categories, async submit
- ✅ `frontend/src/components/admin/AdminProducts.jsx` - Dropdowns, file upload

## Lưu ý quan trọng

1. **Backend phải chạy** trước khi dùng admin UI
2. **Database phải có brands và categories** để dropdown hiển thị
3. **File upload** chỉ chấp nhận File object, không phải base64
4. **Brand & Category IDs** bắt buộc khi tạo/update product
5. **Image preview** dùng `URL.createObjectURL()` không tốn băng thông
6. **Error handling** được implement với try-catch và state

## Next Steps

- [ ] Thêm loading spinner khi submit form
- [ ] Validation trước khi submit
- [ ] Toast notifications thay alert()
- [ ] Edit product với image preview hiện tại
- [ ] Bulk actions (delete nhiều products)
- [ ] Advanced filters (by brand, category, price range)
- [ ] Pagination controls trong UI
