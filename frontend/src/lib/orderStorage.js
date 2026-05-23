const LEGACY_ORDERS_KEY = 'laptopOrders'
const SCOPED_PREFIX = 'laptopOrders:'

const safeParse = (raw) => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const toUserKey = (userId) => `${SCOPED_PREFIX}${String(userId)}`

const writeOrders = (key, orders) => {
  localStorage.setItem(key, JSON.stringify(Array.isArray(orders) ? orders : []))
}

export const readOrdersForUser = (userId, userName = '') => {
  if (!userId) return []

  const key = toUserKey(userId)
  const scopedOrders = safeParse(localStorage.getItem(key))
  if (scopedOrders.length > 0) {
    return scopedOrders
  }

  // Backward compatibility: recover only orders that can be identified as this user.
  const legacyOrders = safeParse(localStorage.getItem(LEGACY_ORDERS_KEY))
  const recovered = legacyOrders
    .filter((order) => {
      if (order?.user_id != null) {
        return String(order.user_id) === String(userId)
      }
      return userName && String(order.customer || '') === String(userName)
    })
    .map((order) => ({ ...order, user_id: order.user_id ?? userId }))

  if (recovered.length > 0) {
    writeOrders(key, recovered)
  }

  return recovered
}

export const upsertOrderForUser = (userId, orderPayload, userName = '') => {
  if (!userId || !orderPayload) return

  const key = toUserKey(userId)
  const orders = readOrdersForUser(userId, userName)
  const normalized = {
    ...orderPayload,
    user_id: orderPayload.user_id ?? userId,
  }

  const existingIndex = orders.findIndex((order) => String(order.id) === String(normalized.id))
  if (existingIndex >= 0) {
    orders[existingIndex] = { ...orders[existingIndex], ...normalized }
  } else {
    orders.push(normalized)
  }

  writeOrders(key, orders)
}

export const updateOrderByIdAnyScope = (orderId, updater) => {
  if (!orderId || typeof updater !== 'function') return false

  let updated = false
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(SCOPED_PREFIX) || key === LEGACY_ORDERS_KEY)

  keys.forEach((key) => {
    const orders = safeParse(localStorage.getItem(key))
    let changed = false

    const nextOrders = orders.map((order) => {
      if (String(order.id) !== String(orderId)) return order
      changed = true
      updated = true
      return updater(order)
    })

    if (changed) {
      writeOrders(key, nextOrders)
    }
  })

  return updated
}
