# Hướng dẫn Debug Lỗi 400 Bad Request

## Vấn đề
Khi submit form thêm sản phẩm, gặp lỗi **HTTP 400: Bad Request**

## Các thay đổi đã thực hiện

### 1. ✅ Sửa field mapping trong ProductContext.jsx
**Trước:**
- `sku_code` → **Sai**, backend expect `sku`
- `cpu` → **Sai**, backend expect `cpu_name`
- `ram: "16GB"` → **Sai**, backend expect `ram_gb: 16` (integer)
- `storage: "512GB"` → **Sai**, backend expect `storage_gb: 512` (integer)
- `graphics_card` → **Sai**, backend expect `gpu`
- `color` → **Sai**, backend expect `color_name`
- `price` → **Sai**, backend expect `original_price`
- `compare_at_price` → **Sai**, backend expect `discount_price`

**Sau (đã sửa):**
```javascript
// Extract số từ string
const ramValue = parseInt(productData.ram) // "16GB" → 16
const storageValue = parseInt(productData.storage) // "512GB" → 512

variants: [{
  sku: `${productData.brand || 'LAPTOP'}-${Date.now()}`,
  color_name: 'Default',
  ram_gb: ramValue,                          // ✅ Integer, validated
  ram_type: productData.ramType || 'DDR4',
  storage_gb: storageValue,                  // ✅ Integer, validated
  cpu_name: productData.cpu || 'Intel Core i5',     // ✅ Đúng tên field
  cpu_benchmark_score: null,
  gpu: productData.graphics || 'Integrated',        // ✅ Đúng tên field
  // Giá gốc = oldPrice (cao hơn) hoặc price nếu không có oldPrice
  original_price: parseFloat(productData.oldPrice || productData.price),
  // Giá giảm = price nếu oldPrice > price, ngược lại null
  discount_price: productData.oldPrice && parseFloat(productData.oldPrice) > parseFloat(productData.price) 
    ? parseFloat(productData.price)
    : null,    // ✅ Không để bằng original_price
  stock_quantity: parseInt(productData.stock) || 0,
  status: parseInt(productData.stock) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'
}]
```

### 2. ✅ Thêm validation chi tiết trong ProductContext.addProduct
```javascript
// Validate required fields
if (!productData.ram) {
  throw new Error('Vui lòng chọn RAM')
}
if (!productData.storage) {
  throw new Error('Vui lòng chọn dung lượng ổ cứng')
}
if (!productData.price || parseFloat(productData.price) <= 0) {
  throw new Error('Vui lòng nhập giá sản phẩm hợp lệ')
}

// Extract numbers and validate
const ramValue = parseInt(productData.ram)
const storageValue = parseInt(productData.storage)

if (isNaN(ramValue) || ramValue <= 0) {
  throw new Error('RAM không hợp lệ')
}
if (isNaN(storageValue) || storageValue <= 0) {
  throw new Error('Dung lượng ổ cứng không hợp lệ')
}
```

### 2. ✅ Thêm validation trong handleProductSubmit
```javascript
// Validate brand and category selection
if (!productForm.brand_id || productForm.brand_id === '') {
  alert('Vui lòng chọn thương hiệu')
  return
}
if (!productForm.category_id || productForm.category_id === '') {
  alert('Vui lòng chọn danh mục')
  return
}
if (!editingProductId && !productForm.imageFile) {
  alert('Vui lòng upload hình ảnh sản phẩm')
  return
}
```

### 3. ✅ Thêm validation chi tiết ở ProductContext.addProduct
(Xem phần 2 ở trên)
```javascript
// Validate required fields
if (!productData.name?.trim()) {
  throw new Error('Tên sản phẩm không được để trống')
}
if (!productData.brand_id || productData.brand_id === '') {
  throw new Error('Vui lòng chọn thương hiệu')
}
if (!productData.category_id || productData.category_id === '') {
  throw new Error('Vui lòng chọn danh mục')
}
if (!productData.productImages) {
  throw new Error('Vui lòng upload hình ảnh sản phẩm')
}
```

### 4. ✅ Pass brand_id và category_id từ Admin.jsx
```javascript
const payload = {
  name: productForm.name,
  brand: productForm.brand,
  brand_id: productForm.brand_id,      // ✅ Thêm
  category_id: productForm.category_id, // ✅ Thêm
  // ... các fields khác
}
```

### 5. ✅ Thêm console logs để debug
**Backend productController.js:**
```javascript
console.log(`🔍 Validating variant #${index + 1}:`, JSON.stringify(variant, null, 2));

if (variantErrors.length > 0) {
  console.error(`❌ Variant #${index + 1} validation errors:`, variantErrors);
  return res.status(400).json({ 
    success: false, 
    message: `Lỗi dữ liệu phiên bản #${index + 1}`, 
    errors: variantErrors 
  });
}
```
```javascript
console.log('🔍 Sending product data to API:', {
  ...apiData,
  productImages: apiData.productImages ? 'File present' : 'No file',
  variantImages: apiData.variantImages.length > 0 ? `${apiData.variantImages.length} files` : 'No files'
})
```

**Frontend ProductContext.jsx:**
```javascript
console.log('🔍 Sending product data to API:', {
  ...apiData,
  productImages: apiData.productImages ? 'File present' : 'No file',
  variantImages: apiData.variantImages.length > 0 ? `${apiData.variantImages.length} files` : 'No files'
})
```
```javascript
console.log('📦 Variants JSON:', variantsJSON)

// Error logging
console.error('❌ API Error:', {
  status: response.status,
  statusText: response.statusText,
  data
})

// Success logging
console.log('✅ Product created:', data)
```

## Cách test lại

1. **Mở DevTools Console** (F12)
2. **Refresh trang admin**
3. **Điền form đầy đủ:**
   - ✅ Chọn Brand từ dropdown
   - ✅ Chọn Category từ dropdown
   - ✅ Điền tất cả fields bắt buộc
   - ✅ Upload hình ảnh
4. **Click "Lưu"**
5. **Xem Console logs:**
   - `🔍 Sending product data to API:` - Data được gửi
   - `📦 Variants JSON:` - Variants đã được format đúng chưa
   - `✅ Product created:` - Thành công
   - `❌ API Error:` - Xem chi tiết lỗi nếu fail

## Expected Console Output (Success)

```
🔍 Sending product data to API: {
  product_name: "Laptop ASUS TUF Gaming",
  brand_id: 1,
  category_id: 1,
  screen_size: 15.6,
  weight_kg: 2.3,
  os: "Windows 11",
  variants: [...],
  productImages: "File present",
  variantImages: "1 files"
}

📦 Variants JSON: [{"sku":"ASUS-1710000000000","color_name":"Default","ram_gb":16,"ram_type":"DDR4","storage_gb":512,"cpu_name":"Intel Core i5-12500H","cpu_benchmark_score":null,"gpu":"NVIDIA RTX 3050 4GB","original_price":22490000,"discount_price":24490000,"stock_quantity":20,"status":"IN_STOCK"}]

✅ Product created: {
  success: true,
  message: "Product created successfully",
  data: { product_id: 123, ... }
}
```

## Expected Console Output (Error 400)

```
❌ API Error: {
  status: 400,
  statusText: "Bad Request",
  data: {
    success: false,
    message: "Lỗi dữ liệu sản phẩm",
    errors: ["ID thương hiệu không hợp lệ."]
  }
}
```

## Backend Requirements Checklist

Khi tạo product, backend expect:

### Product Level (Required)
- ✅ `product_name` - String, không rỗng
- ✅ `brand_id` - Integer > 0
- ✅ `category_id` - Integer > 0
- ⚠️ `description_html` - String, có thể null
- ⚠️ `highlight_features` - String, có thể null

### Product Specs (Optional nhưng nên có)
- ⚠️ `screen_size` - Float > 0
- ⚠️ `weight_kg` - Float > 0
- ⚠️ `os` - String

### Variants (Required, ít nhất 1 variant)
- ✅ `sku` - String unique
- ✅ `color_name` - String
- ✅ `ram_gb` - Integer (8, 16, 32, 64)
- ⚠️ `ram_type` - String (DDR3, DDR4, DDR5, LPDDR4X, etc.)
- ✅ `storage_gb` - Integer (256, 512, 1024, etc.)
- ⚠️ `cpu_name` - String
- ⚠️ `cpu_benchmark_score` - Integer, có thể null
- ⚠️ `gpu` - String
- ✅ `original_price` - Float > 0
- ⚠️ `discount_price` - Float, có thể null
- ⚠️ `stock_quantity` - Integer >= 0
- ⚠️ `status` - ENUM: IN_STOCK | OUT_OF_STOCK | COMING_SOON | DISCONTINUED

### Images (Required)
- ✅ `productImages` - File, ít nhất 1 ảnh
- ✅ `variant_0_images` - File, ít nhất 1 ảnh cho variant đầu tiên

## Troubleshooting Tips

### Nếu vẫn lỗi 400:
1. Check backend server có chạy không: `http://localhost:5000/api-docs`
2. Check database có brands/categories không:
```sql
SELECT * FROM brands;
SELECT * FROM product_categories;
```
3. Test API trực tiếp với curl:
```bash
curl -X POST http://localhost:5000/api/products \
  -F "product_name=Test Laptop" \
  -F "brand_id=1" \
  -F "category_id=1" \
  -F "screen_size=15.6" \
  -F "weight_kg=2.0" \
  -F "os=Windows 11" \
  -F 'variants=[{"sku":"TEST-001","color_name":"Black","ram_gb":16,"ram_type":"DDR4","storage_gb":512,"cpu_name":"Intel Core i5","gpu":"NVIDIA RTX 3050","original_price":20000000,"discount_price":22000000,"stock_quantity":10,"status":"IN_STOCK"}]' \
  -F "productImages=@image.jpg" \
  -F "variant_0_images=@image.jpg"
```

### Nếu brand/category dropdown trống:
1. Check brands/categories có được fetch không:
```javascript
console.log('Brands:', brands)
console.log('Categories:', categories)
```
2. Check API endpoints:
- `GET http://localhost:5000/api/brands`
- `GET http://localhost:5000/api/product-categories`

### Nếu upload ảnh fail:
1. Check Cloudinary credentials trong backend/.env
2. Check upload folder có quyền write: `backend/uploads/products/`
3. Console log kiểm tra File object:
```javascript
console.log('Image file:', productForm.imageFile)
console.log('File size:', productForm.imageFile?.size)
console.log('File type:', productForm.imageFile?.type)
```
