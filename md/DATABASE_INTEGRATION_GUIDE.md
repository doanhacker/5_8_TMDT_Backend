# Database Integration & Admin Setup Guide

## Overview
This guide covers:
1. Loading the new product seed data into the database
2. Verifying backend APIs for product retrieval
3. Updating frontend pages to use backend APIs
4. Admin product management interface

---

## Step 1: Load Product Seed Data into Database

### Via MySQL Client
```bash
cd c:\Users\Win 11\laptop-shop\laptop-ecommerce\backend\database
mysql -u root -p laptop_ecommerce_db < seed-products.sql
```

### Via Node.js Script (Recommended)
Create a script at `backend/scripts/load-products.js`:
```javascript
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function loadProductData() {
  try {
    const sqlFile = path.join(__dirname, '../database/seed-products.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.promise().query(statement);
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('✅ All products loaded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error loading products:', error.message);
    process.exit(1);
  }
}

loadProductData();
```

Run with:
```bash
cd backend
node scripts/load-products.js
```

---

## Step 2: Verify Backend Product APIs

The backend already has product endpoints. Verify they work:

### Get All Products
```bash
curl "http://localhost:5000/api/products?page=1&limit=12"
```

### Get Products by Category
```bash
curl "http://localhost:5000/api/products?categoryId=<category_id>"
```

### Get Single Product
```bash
curl "http://localhost:5000/api/products/9001"
```

### Available Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12, max: 50)
- `categoryId`: Filter by category ID
- `brandId`: Filter by brand ID
- `search`: Search by name/brand
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `status`: IN_STOCK | OUT_OF_STOCK | DISCONTINUED
- `sortBy`: Field name
- `sortOrder`: asc | desc

---

## Step 3: Update Frontend Pages to Use Backend API

### Current Structure
Each page currently has hardcoded `MOCK_PRODUCTS` array. We need to replace with API calls.

### Approach
1. Use `useEffect` to fetch products on component mount
2. Filter/sort on frontend (or backend with query params)
3. Handle loading/error states

### Example Update for Phone.jsx

Before (Mock Data):
```javascript
const MOCK_PRODUCTS = [
  { id: 9001, name: "Samsung Galaxy S24 Ultra", ... },
  ...
]
```

After (Backend API):
```javascript
import { useEffect, useState } from 'react'

export default function PhonePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?categoryId=1&limit=50')
        const data = await response.json()
        setProducts(data.data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([]) // Fallback to empty
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])
  
  if (loading) return <div>Loading...</div>
  
  // Use products in render
}
```

### Category to API Category ID Mapping
Based on database seed file:
- Điện thoại (Phone) = Category ID 1
- Tablet = Category ID 2
- Phụ kiện (Accessories) = Category ID 3
- Smartwatch = Category ID 4
- Màn hình, Máy in (Monitor/Printer) = Category ID 5
- Sim, Thẻ cào (SIM/Top-up) = Category ID 6
- Dịch vụ tiện ích (Services) = Category ID 7
- Máy cũ, Thu cũ (Used/Trade-in) = Category ID 8

### Pages to Update (In Priority Order)
1. ✓ Phone.jsx - Use categoryId=1
2. ✓ Tablet.jsx - Use categoryId=2
3. ✓ AccessoriesPage.jsx - Use categoryId=3
4. ✓ SmartwatchPage.jsx - Use categoryId=4
5. ✓ MonitorPrinterPage.jsx - Use categoryId=5
6. ✓ SimTheCaoPage.jsx - Use categoryId=6
7. ✓ ServicesPage.jsx - Use categoryId=7
8. ✓ UsedTradeIn.jsx - Use categoryId=8

---

## Step 4: Admin Product Management Interface

The admin interface should be at `/admin` route and include:

### Features Needed
1. **Product List View**
   - Table with: ID, Name, Brand, Category, Price, Stock, Status
   - Search & Filter
   - Pagination
   - Actions: Edit, Delete, Toggle Status

2. **Add/Edit Product Form**
   - Product Name, Brand, Category, Description
   - Pricing: Original Price, Discount Price
   - Stock Quantity & Status
   - Upload Images
   - Specifications

3. **Brand Management**
   - List all brands
   - Add/Edit/Delete brands
   - Logo upload

4. **Category Management**
   - List categories (with hierarchy)
   - Add/Edit/Delete categories
   - Parent category selection

### Existing Admin Routes to Check
- `GET /api/admin/*` - Check Admin API documentation
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Example Admin Page Structure
```javascript
// pages/Admin.jsx or AdminProducts.jsx
export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Fetch all products
  useEffect(() => {
    fetchProducts()
  }, [])
  
  const fetchProducts = async () => {
    const res = await fetch('/api/products?limit=100')
    const data = await res.json()
    setProducts(data.data || [])
    setLoading(false)
  }
  
  const handleDelete = async (id) => {
    if (confirm('Delete this product?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    }
  }
  
  return (
    <div>
      <h1>Quản Lý Sản Phẩm</h1>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Hủy' : 'Thêm Sản Phẩm'}
      </button>
      
      {showForm && <ProductForm onSave={() => { setShowForm(false); fetchProducts(); }} />}
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Hãng</th>
            <th>Danh Mục</th>
            <th>Giá</th>
            <th>Kho</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.product_id}>
              <td>{p.product_id}</td>
              <td>{p.product_name}</td>
              <td>{p.brand_name}</td>
              <td>{p.category_name}</td>
              <td>₫{p.original_price?.toLocaleString()}</td>
              <td>{p.stock_quantity}</td>
              <td>
                <button onClick={() => handleEdit(p.product_id)}>Sửa</button>
                <button onClick={() => handleDelete(p.product_id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Step 5: Verification Checklist

After implementation:
- [ ] SQL seed file loaded successfully (54 products in database)
- [ ] Backend APIs return products correctly
- [ ] Frontend pages load products from backend
- [ ] Admin interface displays all products
- [ ] Admin can create new product
- [ ] Admin can edit product
- [ ] Admin can delete product
- [ ] Admin can upload images
- [ ] Filters work (category, brand, price range)
- [ ] Search works
- [ ] Sorting works
- [ ] Product details page shows correct info
- [ ] Add to cart works with backend products
- [ ] Cart shows correct pricing

---

## Database Stats

After loading seed data:

| Category | Count | ID Range |
|----------|-------|----------|
| Điện thoại | 8 | 9001-9008 |
| Tablet | 6 | 9801-9806 |
| Phụ kiện | 8 | 8001-8008 |
| Smartwatch | 8 | 7001-7008 |
| Màn hình, Máy in | 8 | 6001-6008 |
| Sim, Thẻ cào | 8 | 5001-5008 |
| Dịch vụ | 8 | 4001-4008 |
| Máy cũ, Thu cũ | 6 | 9901-9906 |
| **Total** | **54** | - |

---

## Troubleshooting

### Products not appearing in frontend
1. Check database: `SELECT COUNT(*) FROM products;`
2. Check API response: `curl http://localhost:5000/api/products`
3. Check browser console for fetch errors
4. Verify category IDs match

### Admin interface not working
1. Check authentication/authorization
2. Verify admin role assigned to user
3. Check API endpoints exist
4. Test with Postman/curl first

### Images not loading
1. Verify image URLs are accessible
2. Check if image_id in product_images table
3. Update image URLs if Unsplash links break

---

## Next Steps

1. ✓ Create seed SQL file with all products
2. Run SQL file to populate database
3. Verify backend APIs working
4. Update all frontend pages to use APIs
5. Create/enhance admin product management
6. Test full integration
7. Remove mock data from production code
