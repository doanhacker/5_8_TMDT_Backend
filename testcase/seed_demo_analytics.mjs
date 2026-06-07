/**
 * Seed dữ liệu demo: 20 loại sản phẩm + đơn COMPLETED phân bổ doanh thu 90 ngày.
 * Chạy: node testcase/seed_demo_analytics.mjs
 *
 * Xóa và tạo lại vùng ID demo (9500+) — không đụng mock payment cũ (901-908).
 */
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const mysql = require(path.join(fileURLToPath(new URL('.', import.meta.url)), '../backend/node_modules/mysql2/promise'))

const DEMO = {
  userId: 9500,
  brandId: 9520,
  categoryBaseId: 9521,
  productStartId: 9501,
  variantStartId: 9501,
  orderStartId: 95001,
}

const DEMO_USER = {
  email: 'demo.analytics@test.com',
  full_name: 'Khách Demo Analytics',
  phone_number: '0909999888',
}

const CATEGORY_TYPES = [
  'Điện thoại',
  'Laptop',
  'Tablet',
  'Smartwatch',
  'Tai nghe',
  'Phụ kiện',
  'Màn hình, Máy in',
  'Dịch vụ tiện ích',
]

const DEMO_PRODUCTS = [
  { name: 'iPhone 15 Pro Demo', type: 'Điện thoại', price: 28990000, weight: 14 },
  { name: 'Samsung Galaxy S24 Demo', type: 'Điện thoại', price: 19990000, weight: 11 },
  { name: 'Xiaomi 14 Demo', type: 'Điện thoại', price: 14990000, weight: 9 },
  { name: 'OPPO Find X7 Demo', type: 'Điện thoại', price: 17990000, weight: 7 },
  { name: 'MacBook Air M3 Demo', type: 'Laptop', price: 27990000, weight: 8 },
  { name: 'Dell XPS 14 Demo', type: 'Laptop', price: 32990000, weight: 6 },
  { name: 'ASUS ROG Zephyrus Demo', type: 'Laptop', price: 38990000, weight: 5 },
  { name: 'Lenovo ThinkPad X1 Demo', type: 'Laptop', price: 35990000, weight: 4 },
  { name: 'HP Pavilion 15 Demo', type: 'Laptop', price: 18990000, weight: 10 },
  { name: 'Acer Swift Go Demo', type: 'Laptop', price: 16990000, weight: 8 },
  { name: 'iPad Pro M2 Demo', type: 'Tablet', price: 24990000, weight: 6 },
  { name: 'Samsung Tab S9 Demo', type: 'Tablet', price: 19990000, weight: 5 },
  { name: 'Apple Watch Ultra 2 Demo', type: 'Smartwatch', price: 21990000, weight: 4 },
  { name: 'Garmin Fenix 7 Demo', type: 'Smartwatch', price: 15990000, weight: 3 },
  { name: 'AirPods Pro 2 Demo', type: 'Tai nghe', price: 5990000, weight: 15 },
  { name: 'Sony WH-1000XM5 Demo', type: 'Tai nghe', price: 7990000, weight: 12 },
  { name: 'Logitech MX Master Demo', type: 'Phụ kiện', price: 2490000, weight: 9 },
  { name: 'Ốp lưng MagSafe Demo', type: 'Phụ kiện', price: 890000, weight: 18 },
  { name: 'LG UltraGear 27 Demo', type: 'Màn hình, Máy in', price: 8990000, weight: 5 },
  { name: 'Gói bảo hành VIP Demo', type: 'Dịch vụ tiện ích', price: 1500000, weight: 6 },
]

const formatDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const buildOrders = () => {
  const now = new Date()
  const orders = []
  let orderId = DEMO.orderStartId

  // Đơn trong tháng hiện tại — mỗi sản phẩm 1 đơn (qty khác nhau → doanh thu khác nhau)
  DEMO_PRODUCTS.forEach((product, index) => {
    const day = Math.max(1, Math.min(now.getDate(), 1 + (index % now.getDate())))
    const orderDate = new Date(now.getFullYear(), now.getMonth(), day, 9 + (index % 8), index % 60, 0)
    if (orderDate > now) return

    const qty = 1 + (index % 3)
    const lineTotal = product.price * qty
    orders.push({
      orderId: orderId++,
      orderDate,
      variantId: DEMO.variantStartId + index,
      qty,
      lineTotal,
      shipping: index % 2 === 0 ? 30000 : 0,
      label: `Tháng hiện tại · ${product.name}`,
    })
  })

  // Đơn rải 90 ngày — top sản phẩm bán chạy có nhiều đơn hơn
  for (let dayOffset = 1; dayOffset <= 90; dayOffset += 1) {
    const productsForDay = DEMO_PRODUCTS
      .map((product, index) => ({ product, index, score: (product.weight + index + dayOffset) % 7 }))
      .filter((item) => item.score <= 2)
      .slice(0, 3)

    productsForDay.forEach(({ product, index }, slot) => {
      const orderDate = new Date(now)
      orderDate.setDate(orderDate.getDate() - dayOffset)
      orderDate.setHours(10 + slot, (index * 7) % 60, 0, 0)

      const qty = 1 + ((index + dayOffset) % 2)
      const lineTotal = product.price * qty
      orders.push({
        orderId: orderId++,
        orderDate,
        variantId: DEMO.variantStartId + index,
        qty,
        lineTotal,
        shipping: dayOffset % 5 === 0 ? 30000 : 0,
        label: `${dayOffset} ngày trước · ${product.name}`,
      })
    })
  }

  return orders
}

async function cleanupDemo(conn) {
  await conn.query('DELETE FROM order_details WHERE order_id >= ?', [DEMO.orderStartId])
  await conn.query('DELETE FROM payments WHERE order_id >= ?', [DEMO.orderStartId])
  await conn.query('DELETE FROM orders WHERE order_id >= ?', [DEMO.orderStartId])
  await conn.query('DELETE FROM product_images WHERE product_id BETWEEN ? AND ?', [
    DEMO.productStartId,
    DEMO.productStartId + DEMO_PRODUCTS.length - 1,
  ])
  await conn.query('DELETE FROM product_specifications WHERE product_id BETWEEN ? AND ?', [
    DEMO.productStartId,
    DEMO.productStartId + DEMO_PRODUCTS.length - 1,
  ])
  await conn.query('DELETE FROM product_variants WHERE product_id BETWEEN ? AND ?', [
    DEMO.productStartId,
    DEMO.productStartId + DEMO_PRODUCTS.length - 1,
  ])
  await conn.query('DELETE FROM products WHERE product_id BETWEEN ? AND ?', [
    DEMO.productStartId,
    DEMO.productStartId + DEMO_PRODUCTS.length - 1,
  ])
  await conn.query('DELETE FROM categories WHERE category_id BETWEEN ? AND ?', [
    DEMO.categoryBaseId,
    DEMO.categoryBaseId + CATEGORY_TYPES.length - 1,
  ])
  await conn.query('DELETE FROM brands WHERE brand_id = ?', [DEMO.brandId])
  await conn.query('DELETE FROM user_addresses WHERE user_id = ?', [DEMO.userId])
  await conn.query('DELETE FROM user_roles WHERE user_id = ?', [DEMO.userId])
  await conn.query('DELETE FROM users WHERE user_id = ?', [DEMO.userId])
}

async function seedDemo(conn) {
  await conn.query(
    `INSERT INTO users (user_id, email, password_hash, full_name, phone_number, status)
     VALUES (?, ?, '$2b$10$demoanalyticsdemohash000000000000000000000000000', ?, ?, 'ACTIVE')`,
    [DEMO.userId, DEMO_USER.email, DEMO_USER.full_name, DEMO_USER.phone_number]
  )

  await conn.query(
    'INSERT INTO user_roles (user_id, role_id) VALUES (?, 3) ON DUPLICATE KEY UPDATE role_id = 3',
    [DEMO.userId]
  )

  await conn.query(
    `INSERT INTO user_addresses (user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default)
     VALUES (?, ?, ?, '123 Demo Analytics', 'Phuong Demo', 'Quan 1', 'TP.HCM', TRUE)`,
    [DEMO.userId, DEMO_USER.full_name, DEMO_USER.phone_number]
  )

  const [[addressRow]] = await conn.query(
    'SELECT address_id FROM user_addresses WHERE user_id = ? ORDER BY address_id DESC LIMIT 1',
    [DEMO.userId]
  )
  const addressId = addressRow.address_id

  await conn.query(
    'INSERT INTO brands (brand_id, brand_name, logo_url) VALUES (?, ?, NULL)',
    [DEMO.brandId, 'Demo Analytics']
  )

  await Promise.all(
    CATEGORY_TYPES.map((name, index) =>
      conn.query(
        'INSERT INTO categories (category_id, category_name, parent_category_id) VALUES (?, ?, NULL)',
        [DEMO.categoryBaseId + index, `Demo ${name}`]
      )
    )
  )

  const categoryMap = Object.fromEntries(
    CATEGORY_TYPES.map((name, index) => [name, DEMO.categoryBaseId + index])
  )

  for (let i = 0; i < DEMO_PRODUCTS.length; i += 1) {
    const product = DEMO_PRODUCTS[i]
    const productId = DEMO.productStartId + i
    const variantId = DEMO.variantStartId + i
    const categoryId = categoryMap[product.type]
    const discount = i % 3 === 0 ? Math.round(product.price * 0.92) : null

    await conn.query(
      `INSERT INTO products (product_id, product_name, brand_id, category_id, description_html, highlight_features)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        productId,
        product.name,
        DEMO.brandId,
        categoryId,
        `<p>Sản phẩm demo analytics — ${product.name}</p>`,
        `Loại ${product.type} · Demo seed`,
      ]
    )

    await conn.query(
      `INSERT INTO product_specifications (product_id, screen_size, weight_kg, os)
       VALUES (?, ?, ?, ?)`,
      [productId, 6.1 + (i % 10), 0.2 + (i % 5) * 0.3, i % 2 === 0 ? 'Android/iOS' : 'Windows/macOS']
    )

    await conn.query(
      `INSERT INTO product_variants (
        variant_id, product_id, sku, cpu_name, cpu_benchmark_score, gpu,
        ram_gb, ram_type, storage_gb, color_name,
        original_price, discount_price, stock_quantity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_STOCK')`,
      [
        variantId,
        productId,
        `DEMO-${productId}`,
        'Demo CPU',
        10000 + i * 500,
        'Demo GPU',
        8 + (i % 3) * 8,
        'DDR5',
        256 + (i % 4) * 256,
        ['Đen', 'Bạc', 'Xanh', 'Tím'][i % 4],
        product.price,
        discount,
        20 + (i % 10),
      ]
    )
  }

  const orders = buildOrders()
  let totalRevenue = 0

  for (const order of orders) {
    const totalAmount = order.lineTotal + order.shipping
    totalRevenue += totalAmount

    await conn.query(
      `INSERT INTO orders (
        order_id, user_id, address_id, order_type, status,
        subtotal, shipping_fee, discount_amount, total_amount, order_date
      ) VALUES (?, ?, ?, 'NORMAL', 'COMPLETED', ?, ?, 0, ?, ?)`,
      [
        order.orderId,
        DEMO.userId,
        addressId,
        order.lineTotal,
        order.shipping,
        totalAmount,
        formatDateTime(order.orderDate),
      ]
    )

    await conn.query(
      `INSERT INTO order_details (order_id, variant_id, quantity, price_at_purchase)
       VALUES (?, ?, ?, ?)`,
      [order.orderId, order.variantId, order.qty, order.lineTotal / order.qty]
    )
  }

  return { orderCount: orders.length, totalRevenue }
}

async function printSummary(conn) {
  const [[monthStats]] = await conn.query(
    `SELECT
      COUNT(*) AS orders_count,
      COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders
     WHERE status = 'COMPLETED'
       AND order_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
  )

  const [[topProducts]] = await conn.query(
    `SELECT COUNT(*) AS product_count
     FROM (
       SELECT p.product_id
       FROM order_details od
       INNER JOIN orders o ON o.order_id = od.order_id
       INNER JOIN product_variants pv ON pv.variant_id = od.variant_id
       INNER JOIN products p ON p.product_id = pv.product_id
       WHERE o.status = 'COMPLETED'
         AND p.product_id BETWEEN ? AND ?
       GROUP BY p.product_id
     ) t`,
    [DEMO.productStartId, DEMO.productStartId + DEMO_PRODUCTS.length - 1]
  )

  console.log('\n========================================')
  console.log('DEMO ANALYTICS — TÓM TẮT')
  console.log('----------------------------------------')
  console.log(`Sản phẩm demo     : ${DEMO_PRODUCTS.length} loại (ID ${DEMO.productStartId}-${DEMO.productStartId + DEMO_PRODUCTS.length - 1})`)
  console.log(`Khách demo        : ${DEMO_USER.email} (user_id ${DEMO.userId})`)
  console.log(`Đơn COMPLETED mới : từ order_id ${DEMO.orderStartId}`)
  console.log(`Doanh thu tháng này: ${Number(monthStats.revenue).toLocaleString('vi-VN')}đ (${monthStats.orders_count} đơn)`)
  console.log(`SP có doanh thu   : ${topProducts.product_count}/${DEMO_PRODUCTS.length}`)
  console.log('----------------------------------------')
  console.log('Test admin: http://localhost:5173/admin → Dashboard')
  console.log('Chọn "Tháng hiện tại" hoặc "90 ngày gần nhất" để xem biểu đồ')
  console.log('========================================\n')
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laptop_ecommerce_db',
    port: Number(process.env.DB_PORT || 3306),
    multipleStatements: true,
  })

  try {
    console.log('Đang xóa dữ liệu demo cũ (nếu có)...')
    await cleanupDemo(conn)

    console.log('Đang seed 20 sản phẩm + đơn hàng demo...')
    const { orderCount, totalRevenue } = await seedDemo(conn)

    console.log(`✅ Hoàn tất: ${orderCount} đơn COMPLETED, tổng ~${Math.round(totalRevenue).toLocaleString('vi-VN')}đ (90 ngày)`)
    await printSummary(conn)
  } finally {
    await conn.end()
  }
}

main().catch((error) => {
  console.error('❌ Lỗi seed demo:', error.message)
  process.exit(1)
})
