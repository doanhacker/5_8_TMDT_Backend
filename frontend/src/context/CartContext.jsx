import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { buildApiUrl, getImageUrl } from '../config/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Lấy hoặc tạo session_id bền vững cho khách chưa đăng nhập.
 * Lưu vào localStorage để không thay đổi khi reload.
 */
function getOrCreateSessionId() {
  const key = 'laptopSessionId'
  let sessionId = localStorage.getItem(key)
  if (!sessionId) {
    // Tạo UUID đơn giản
    sessionId = 'sess-' + Math.random().toString(36).slice(2) + '-' + Date.now()
    localStorage.setItem(key, sessionId)
  }
  return sessionId
}

/**
 * Map dữ liệu item từ API response về shape mà Cart.jsx đang dùng.
 * Backend trả về: { cart_detail_id, variant_id, product_id, product_name,
 *   color_name, ram_gb, storage_gb, original_price, discount_price,
 *   stock_quantity, quantity, primary_variant_image_url }
 */
function mapApiItemToLocal(apiItem) {
  const price = Number(apiItem.discount_price) || Number(apiItem.original_price) || 0
  const config = [
    apiItem.color_name,
    apiItem.ram_gb ? `${apiItem.ram_gb}GB RAM` : null,
    apiItem.storage_gb ? `${apiItem.storage_gb}GB` : null,
  ]
    .filter(Boolean)
    .join(' / ')

  const normalizedImage = apiItem.primary_variant_image_url
    ? getImageUrl(apiItem.primary_variant_image_url)
    : ''

  return {
    // id dùng trong local state — dùng variant_id để khớp với backend
    id: String(apiItem.variant_id),
    variantId: apiItem.variant_id,
    productId: apiItem.product_id,
    name: apiItem.product_name,
    config,
    price,
    quantity: apiItem.quantity,
    // Luôn thêm timestamp để bypass cache ảnh cũ
    image: normalizedImage ? `${normalizedImage}${normalizedImage.includes('?') ? '&' : '?'}t=${Date.now()}` : '',
    // Giữ stock để validate tại client
    stockQuantity: apiItem.variant_stock_quantity,
    variantStatus: apiItem.variant_status,
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [cartId, setCartId] = useState(null)
  const [loading, setLoading] = useState(false)

  // Dùng ref để luôn có giá trị user mới nhất trong các callback
  // mà không cần khai báo user là dependency (tránh re-render vòng tròn)
  const userRef = useRef(null)

  // ── Hàm lấy identifier để gọi API ──────────────────────────────────────────
  const getIdentifierParams = useCallback(() => {
    const user = userRef.current
    if (user?.user_id) {
      return { user_id: user.user_id }
    }
    return { session_id: getOrCreateSessionId() }
  }, [])

  // ── Fetch giỏ hàng từ backend ───────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const params = getIdentifierParams()
      const query = new URLSearchParams(params).toString()
      const res = await fetch(buildApiUrl(`/api/cart?${query}`))
      if (!res.ok) throw new Error('Fetch cart failed')
      const json = await res.json()
      if (json.success) {
        setCartId(json.data.cart_id)
        setCart((json.data.items || []).map(mapApiItemToLocal))
        // Cũng lưu cache localStorage để hiển thị ngay khi offline
        localStorage.setItem('laptopCart', JSON.stringify((json.data.items || []).map(mapApiItemToLocal)))
      }
    } catch (err) {
      // Nếu API lỗi, fallback sang localStorage cache
      console.warn('CartContext: API unavailable, using localStorage cache', err)
      const saved = localStorage.getItem('laptopCart')
      if (saved) {
        try { setCart(JSON.parse(saved)) } catch (_) { /* ignore */ }
      }
    } finally {
      setLoading(false)
    }
  }, [getIdentifierParams])

  // ── Khởi động: load cache localStorage ngay lập tức (tránh giỏ hàng trắng),
  //    sau đó sync từ backend ─────────────────────────────────────────────────
  useEffect(() => {
    // Bước 1: hiển thị cache ngay để UX mượt
    const saved = localStorage.getItem('laptopCart')
    if (saved) {
      try { setCart(JSON.parse(saved)) } catch (_) { /* ignore */ }
    }
    // Bước 2: sync từ backend
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Expose hàm để AuthContext gọi khi user thay đổi ───────────────────────
  //    (xem ghi chú bên dưới về cách tích hợp với AuthContext)
  const onAuthChange = useCallback(async (newUser) => {
    const prevUser = userRef.current
    userRef.current = newUser

    if (newUser) {
      // Vừa đăng nhập → merge giỏ khách vào tài khoản rồi fetch lại
      const sessionId = localStorage.getItem('laptopSessionId')
      if (sessionId && !prevUser) {
        try {
          await fetch(buildApiUrl('/api/cart/merge'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, user_id: newUser.user_id }),
          })
        } catch (err) {
          console.warn('CartContext: merge cart failed', err)
        }
      }
      await fetchCart()
    } else {
      // Vừa đăng xuất → fetch giỏ theo session
      await fetchCart()
    }
  }, [fetchCart])

  // ── addToCart ───────────────────────────────────────────────────────────────
  const addToCart = useCallback(async (product, quantity = 1) => {
    // Optimistic update ngay lập tức để UI phản hồi nhanh
    setCart((prev) => {
      const existing = prev.find((item) => item.id === String(product.id))
      let next
      if (existing) {
        next = prev.map((item) =>
          item.id === String(product.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        next = [...prev, { ...product, id: String(product.id), quantity }]
      }
      localStorage.setItem('laptopCart', JSON.stringify(next))
      return next
    })

    // Gọi API
    try {
      const params = getIdentifierParams()
      const res = await fetch(buildApiUrl('/api/cart/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, variant_id: product.variantId || product.id, quantity }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      // Sync lại để lấy cart_id và dữ liệu chính xác từ server
      await fetchCart()
    } catch (err) {
      console.error('CartContext addToCart API error:', err)
      // Không rollback optimistic update — giỏ hàng vẫn hiển thị,
      // sẽ sync lại lần sau khi API khả dụng
    }
  }, [getIdentifierParams, fetchCart])

  // ── removeFromCart ──────────────────────────────────────────────────────────
  const removeFromCart = useCallback(async (productId) => {
    const variantId = productId // id trong local state chính là variant_id (xem mapApiItemToLocal)

    // Optimistic update
    setCart((prev) => {
      const next = prev.filter((item) => item.id !== String(productId))
      localStorage.setItem('laptopCart', JSON.stringify(next))
      return next
    })

    try {
      const params = getIdentifierParams()
      const query = new URLSearchParams(params).toString()
      const res = await fetch(buildApiUrl(`/api/cart/remove/${variantId}?${query}`), { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      // Nếu backend trả về danh sách items, đồng bộ lại state
      if (json.data && Array.isArray(json.data.items)) {
        setCart(json.data.items.map(mapApiItemToLocal))
        localStorage.setItem('laptopCart', JSON.stringify(json.data.items.map(mapApiItemToLocal)))
      } else {
        await fetchCart()
      }
    } catch (err) {
      console.error('CartContext removeFromCart API error:', err)
      await fetchCart() // Rollback: sync lại từ server
    }
  }, [getIdentifierParams, fetchCart])

  // ── updateQuantity ──────────────────────────────────────────────────────────
  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId)
    }

    const variantId = productId

    // Optimistic update
    setCart((prev) => {
      const next = prev.map((item) =>
        item.id === String(productId) ? { ...item, quantity } : item
      )
      localStorage.setItem('laptopCart', JSON.stringify(next))
      return next
    })

    try {
      const params = getIdentifierParams()
      const res = await fetch(buildApiUrl('/api/cart/update'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, variant_id: variantId, quantity }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      // Nếu backend trả về danh sách items, đồng bộ lại state
      if (json.data && Array.isArray(json.data.items)) {
        setCart(json.data.items.map(mapApiItemToLocal))
        localStorage.setItem('laptopCart', JSON.stringify(json.data.items.map(mapApiItemToLocal)))
      } else {
        await fetchCart()
      }
    } catch (err) {
      console.error('CartContext updateQuantity API error:', err)
      await fetchCart() // Rollback: sync lại từ server
    }
  }, [getIdentifierParams, removeFromCart, fetchCart])

  // ── clearCart ───────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    setCart([])
    localStorage.setItem('laptopCart', JSON.stringify([]))

    try {
      const params = getIdentifierParams()
      const query = new URLSearchParams(params).toString()
      await fetch(buildApiUrl(`/api/cart/clear?${query}`), { method: 'DELETE' })
    } catch (err) {
      console.error('CartContext clearCart API error:', err)
    }
  }, [getIdentifierParams])

  // ── Getters ─────────────────────────────────────────────────────────────────
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cart])

  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  const value = {
    cart,
    cartId,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    fetchCart,
    onAuthChange, // Export để AuthContext gọi sau login/logout
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
