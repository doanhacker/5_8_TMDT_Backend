# Frontend Update Example: Phone.jsx

This document shows exactly how to update Phone.jsx to use backend API instead of mock data.

## Current Code (Lines 1-50)
```javascript
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSmartphone, FiShoppingCart, FiStar, FiTag, FiTruck, FiBox, FiDollarSign, FiFilter, FiSearch, FiChevronRight } from 'react-icons/fi'
import { MdLaptopMac } from 'react-icons/md'
import { useCart } from '../context/CartContext'
import FilterBar from '../components/FilterBar'
import Footer from '../components/Footer'

const PRODUCT_IMAGE_MAP = {
  // ... keep or remove
}

const MOCK_PRODUCTS = [  // <-- REMOVE THIS ENTIRE BLOCK
  {
    id: 9001,
    name: "Samsung Galaxy S24 Ultra",
    // ... all 8 products
  },
  // ...
]
// ... rest of constants
```

## Changes Needed

### Change 1: Add useEffect Import
**Before:**
```javascript
import { useState, useMemo } from 'react'
```

**After:**
```javascript
import { useState, useMemo, useEffect } from 'react'
```

---

### Change 2: Update PhonePage Component
**Find this line (around line 380-400):**
```javascript
export default function PhonePage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")
  // ... more state variables ...
  const [filtered, setFiltered] = useState(MOCK_PRODUCTS)  // <-- CHANGE THIS
```

**Replace with:**
```javascript
export default function PhonePage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")
  // ... more state variables ...
  const [products, setProducts] = useState([])  // <-- NEW: from API
  const [loading, setLoading] = useState(true)   // <-- NEW: loading state
  const [filtered, setFiltered] = useState([])   // <-- CHANGED: start empty

  // <-- ADD THIS NEW BLOCK:
  useEffect(() => {
    const fetchPhones = async () => {
      try {
        const response = await fetch('/api/products?categoryId=1&limit=50')
        if (!response.ok) throw new Error('Failed to fetch phones')
        
        const data = await response.json()
        
        // Map backend response to frontend format
        const mappedProducts = (data.data || []).map(p => ({
          id: p.product_id,
          name: p.product_name,
          brand: p.brand_name,
          category: 'Phone',
          price: p.discount_price || p.original_price,
          oldPrice: p.original_price,
          rating: 4.7,  // Update if available in DB
          sold: '1.2k',  // Update if available in DB
          storage: p.highlight_features ? p.highlight_features.split(',')[0] : 'Unknown',
          ram: '8GB',  // Update if available in DB
          chipset: 'Latest',
          battery: '5000 mAh',
          camera: '50MP',
          display: '6.7 inch AMOLED',
          feature: p.description_html || 'Quality product',
          image: p.primary_image_url || 'https://via.placeholder.com/200x150',
          tag: p.discount_price ? 'Sale' : 'New',
          series: p.category_name || 'Phone',
          accent: 'from-slate-900 via-blue-900 to-cyan-700',
        }))
        
        setProducts(mappedProducts)
        setFiltered(mappedProducts)
      } catch (error) {
        console.error('Error fetching phones:', error)
        setProducts([])
        setFiltered([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchPhones()
  }, [])
```

---

### Change 3: Update Filtering Logic
**Find the useMemo block that filters products (around line 450+):**
```javascript
const filteredProducts = useMemo(() => {
  let result = MOCK_PRODUCTS  // <-- CHANGE THIS
  // ... rest of filtering logic
}, [query, filters, sortBy])
```

**Replace MOCK_PRODUCTS with products:**
```javascript
const filteredProducts = useMemo(() => {
  let result = products  // <-- CHANGED: use API products
  // ... rest of filtering logic stays the same
}, [query, filters, sortBy, products])  // <-- ADD products to dependencies
```

---

### Change 4: Add Loading State to Render
**Find the JSX return statement (around line 500+):**
```javascript
return (
  <>
    <main style={styles.page}>
      // ... hero section ...
      <section style={styles.grid}>
        {filteredProducts.map(product => {
          // ... product card rendering
        })}
      </section>
    </main>
    <Footer />
  </>
)
```

**Add loading check:**
```javascript
return (
  <>
    <main style={styles.page}>
      // ... hero section ...
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading phones...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No phones found</p>
        </div>
      ) : (
        <section style={styles.grid}>
          {filteredProducts.map(product => {
            // ... product card rendering - NO CHANGE NEEDED
          })}
        </section>
      )}
    </main>
    <Footer />
  </>
)
```

---

### Change 5: OPTIONAL - Remove Unused Constants
You can remove these to clean up:
```javascript
// REMOVE THE ENTIRE MOCK_PRODUCTS ARRAY (lines starting with const MOCK_PRODUCTS)
// REMOVE: const PHONE_HIGHLIGHTS
// REMOVE: const PHONE_FILTER_OPTIONS
// REMOVE: const PHONE_FILTER_CONFIG
// REMOVE: const PHONE_PRICE_RANGES
```

Keep these:
```javascript
// KEEP: formatCurrency
// KEEP: parseSoldCount
// KEEP: normalizeText
// KEEP: parseBatteryMah
// KEEP: resolveOs
```

---

## Complete Updated Component Skeleton

```javascript
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSmartphone, FiShoppingCart, FiStar, FiTag, FiTruck, FiBox, FiDollarSign, FiFilter, FiSearch, FiChevronRight } from 'react-icons/fi'
import { MdLaptopMac } from 'react-icons/md'
import { useCart } from '../context/CartContext'
import FilterBar from '../components/FilterBar'
import Footer from '../components/Footer'

// Helper functions (KEEP THESE)
const formatCurrency = (value) => `${Number(value).toLocaleString("vi-VN")}đ`
const parseSoldCount = (value) => { /* ... */ }
const normalizeText = (value) => { /* ... */ }
const parseBatteryMah = (value) => { /* ... */ }
const resolveOs = (brandName) => { /* ... */ }

// REMOVE MOCK_PRODUCTS and other const arrays

export default function PhonePage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")
  
  // NEW: API state
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtered, setFiltered] = useState([])
  
  // NEW: Fetch phones from API
  useEffect(() => {
    const fetchPhones = async () => {
      try {
        const response = await fetch('/api/products?categoryId=1&limit=50')
        const data = await response.json()
        
        const mappedProducts = (data.data || []).map(p => ({
          id: p.product_id,
          name: p.product_name,
          brand: p.brand_name,
          // ... map other fields
        }))
        
        setProducts(mappedProducts)
        setFiltered(mappedProducts)
      } catch (error) {
        console.error('Error fetching phones:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchPhones()
  }, [])
  
  // Keep existing filter logic - just change MOCK_PRODUCTS to products
  const filteredProducts = useMemo(() => {
    let result = products  // CHANGED
    
    if (query) {
      // ... existing filter logic
    }
    
    return result
  }, [query, filters, sortBy, products])  // ADD products dependency
  
  // Keep existing handlers
  const handleProductClick = (product) => { /* ... */ }
  const handleAddToCart = (product) => { /* ... */ }
  
  // Updated JSX
  return (
    <>
      <main style={styles.page}>
        {/* Hero section - NO CHANGE */}
        <section style={styles.hero}>
          {/* ... */}
        </section>
        
        {/* Filter section - NO CHANGE */}
        <section style={styles.filterSection}>
          {/* ... */}
        </section>
        
        {/* Products section - ADD LOADING CHECK */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading phones...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>No phones found</div>
        ) : (
          <section style={styles.grid}>
            {filteredProducts.map(product => (
              // ... existing product card JSX - NO CHANGE
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}

const styles = {
  // ... keep all existing styles
}
```

---

## Testing After Update

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/phone` page
4. You should see:
   - Network request to `GET /api/products?categoryId=1`
   - Response with phone products
   - Products rendering on page

5. Test filtering and sorting
6. Test add to cart
7. Test product click for detail page

---

## Same Pattern for Other Pages

Apply the exact same changes to:
- **Tablet.jsx** → categoryId=2
- **AccessoriesPage.jsx** → categoryId=3
- **SmartwatchPage.jsx** → categoryId=4
- **MonitorPrinterPage.jsx** → categoryId=5
- **SimTheCaoPage.jsx** → categoryId=6
- **ServicesPage.jsx** → categoryId=7
- **UsedTradeIn.jsx** → categoryId=8

Only difference: Change `categoryId=1` to the appropriate number for each page.

---

## Common Issues & Fixes

### Issue: Products not appearing
**Check:**
1. Backend running? `curl http://localhost:5000/api/products`
2. Database has products? MySQL: `SELECT COUNT(*) FROM products;`
3. Browser console errors?

### Issue: "Cannot read property 'map' of undefined"
**Fix:** Add null check:
```javascript
const mappedProducts = (data.data || []).map(p => ({ ... }))
```

### Issue: Infinite loop of fetches
**Fix:** Ensure `useEffect` has dependency array:
```javascript
useEffect(() => { ... }, [])  // Empty array = run once
```

### Issue: Old mock data still showing
**Fix:** Hard refresh (Ctrl+Shift+R) to clear cache

---

## Done! 
Your Phone page will now load products from the database instead of using hardcoded mock data.
