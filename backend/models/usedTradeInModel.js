const db = require('../config/db');

let tableReadyPromise = null;

const DEFAULT_USED_ITEMS = [
  {
    name: 'iPhone 13 Pro - Grade A',
    category: 'Điện thoại',
    grade: 'Grade A',
    condition_notes: 'Ngoại hình 99%, đầy đủ chức năng, bảo hành 6 tháng.',
    cpu: 'Apple A15 Bionic',
    ram: '6GB',
    storage: '256GB',
    battery_health: '88%',
    price_vnd: 17490000,
    old_price_vnd: 18990000,
    sold_count: 126,
    image_url: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=900&q=80',
    stock_qty: 8,
    is_active: 1,
  },
  {
    name: 'Samsung Galaxy S23 - Grade B',
    category: 'Điện thoại',
    grade: 'Grade B',
    condition_notes: 'Hình thức 95%, pin tốt, bảo hành 3 tháng.',
    cpu: 'Snapdragon 8 Gen 2',
    ram: '8GB',
    storage: '256GB',
    battery_health: '85%',
    price_vnd: 10990000,
    old_price_vnd: 12990000,
    sold_count: 94,
    image_url: 'https://images.unsplash.com/photo-1607936591069-8c7a28c5e0a6?w=900&q=80',
    stock_qty: 12,
    is_active: 1,
  },
  {
    name: 'MacBook Air M2 2023 - Like New',
    category: 'Laptop',
    grade: 'Like New',
    condition_notes: 'Máy đẹp như mới, pin chu kỳ thấp, bảo hành 6 tháng.',
    cpu: 'Apple M2',
    ram: '8GB',
    storage: '256GB SSD',
    battery_health: '96%',
    price_vnd: 20490000,
    old_price_vnd: 22990000,
    sold_count: 61,
    image_url: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=900&q=80',
    stock_qty: 5,
    is_active: 1,
  },
  {
    name: 'Dell XPS 13 Plus - Grade B',
    category: 'Laptop',
    grade: 'Grade B',
    condition_notes: 'Hiệu năng tốt, ngoại hình ổn, bảo hành 3 tháng.',
    cpu: 'Intel Core i7',
    ram: '16GB',
    storage: '512GB SSD',
    battery_health: '80%',
    price_vnd: 13490000,
    old_price_vnd: 15990000,
    sold_count: 39,
    image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=900&q=80',
    stock_qty: 6,
    is_active: 1,
  },
];

const ensureTables = async () => {
  if (!tableReadyPromise) {
    tableReadyPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS used_trade_items (
          item_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(120) DEFAULT 'Thiết bị',
          grade VARCHAR(60) DEFAULT 'Cũ đẹp',
          condition_notes TEXT,
          cpu VARCHAR(255),
          ram VARCHAR(120),
          storage VARCHAR(120),
          battery_health VARCHAR(60),
          price_vnd DECIMAL(15,2) NOT NULL DEFAULT 0,
          old_price_vnd DECIMAL(15,2) NULL,
          sold_count INT NOT NULL DEFAULT 0,
          image_url TEXT,
          stock_qty INT NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS trade_in_requests (
          request_id INT AUTO_INCREMENT PRIMARY KEY,
          customer_name VARCHAR(160) NOT NULL,
          phone VARCHAR(40) NOT NULL,
          email VARCHAR(160),
          device_name VARCHAR(255) NOT NULL,
          device_condition TEXT,
          expected_price_vnd DECIMAL(15,2) NULL,
          note TEXT,
          status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
          handled_by_user_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      const [rows] = await db.query('SELECT COUNT(*) AS total FROM used_trade_items');
      const total = Number(rows?.[0]?.total || 0);
      if (total === 0) {
        for (const item of DEFAULT_USED_ITEMS) {
          await db.query(
            `INSERT INTO used_trade_items (
              name, category, grade, condition_notes, cpu, ram, storage, battery_health,
              price_vnd, old_price_vnd, sold_count, image_url, stock_qty, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.name,
              item.category,
              item.grade,
              item.condition_notes,
              item.cpu,
              item.ram,
              item.storage,
              item.battery_health,
              item.price_vnd,
              item.old_price_vnd,
              item.sold_count,
              item.image_url,
              item.stock_qty,
              item.is_active,
            ]
          );
        }
      }
    })();
  }

  await tableReadyPromise;
};

const mapUsedItem = (row) => ({
  id: row.item_id,
  name: row.name,
  category: row.category,
  grade: row.grade,
  note: row.condition_notes || '',
  cpu: row.cpu || '',
  ram: row.ram || '',
  storage: row.storage || '',
  battery: row.battery_health || '',
  price: Number(row.price_vnd || 0),
  oldPrice: row.old_price_vnd != null ? Number(row.old_price_vnd) : Number(row.price_vnd || 0),
  sold: Number(row.sold_count || 0),
  image: row.image_url || '',
  stock: Number(row.stock_qty || 0),
  active: Number(row.is_active) === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTradeInRequest = (row) => ({
  id: row.request_id,
  customerName: row.customer_name,
  phone: row.phone,
  email: row.email || '',
  deviceName: row.device_name,
  deviceCondition: row.device_condition || '',
  expectedPrice: row.expected_price_vnd != null ? Number(row.expected_price_vnd) : null,
  note: row.note || '',
  status: row.status,
  handledByUserId: row.handled_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const UsedTradeIn = {
  ensureTables,

  getUsedItems: async ({ search = '', activeOnly = true, limit = 100 } = {}) => {
    await ensureTables();

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 300);
    let query = `
      SELECT item_id, name, category, grade, condition_notes, cpu, ram, storage, battery_health,
             price_vnd, old_price_vnd, sold_count, image_url, stock_qty, is_active, created_at, updated_at
      FROM used_trade_items
      WHERE 1=1
    `;
    const values = [];

    if (activeOnly) {
      query += ' AND is_active = 1';
    }

    if (String(search || '').trim()) {
      query += ' AND (name LIKE ? OR category LIKE ? OR grade LIKE ? OR cpu LIKE ?)';
      const keyword = `%${String(search).trim()}%`;
      values.push(keyword, keyword, keyword, keyword);
    }

    query += ' ORDER BY updated_at DESC LIMIT ?';
    values.push(safeLimit);

    const [rows] = await db.query(query, values);
    return rows.map(mapUsedItem);
  },

  getUsedItemById: async (id) => {
    await ensureTables();
    const [rows] = await db.query(
      `SELECT item_id, name, category, grade, condition_notes, cpu, ram, storage, battery_health,
              price_vnd, old_price_vnd, sold_count, image_url, stock_qty, is_active, created_at, updated_at
       FROM used_trade_items
       WHERE item_id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] ? mapUsedItem(rows[0]) : null;
  },

  createUsedItem: async (payload) => {
    await ensureTables();
    const [result] = await db.query(
      `INSERT INTO used_trade_items (
        name, category, grade, condition_notes, cpu, ram, storage, battery_health,
        price_vnd, old_price_vnd, sold_count, image_url, stock_qty, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.name,
        payload.category,
        payload.grade,
        payload.note,
        payload.cpu,
        payload.ram,
        payload.storage,
        payload.battery,
        payload.price,
        payload.oldPrice,
        payload.sold,
        payload.image,
        payload.stock,
        payload.active ? 1 : 0,
      ]
    );
    return UsedTradeIn.getUsedItemById(result.insertId);
  },

  updateUsedItem: async (id, payload) => {
    await ensureTables();
    const [result] = await db.query(
      `UPDATE used_trade_items
       SET name = ?, category = ?, grade = ?, condition_notes = ?, cpu = ?, ram = ?, storage = ?, battery_health = ?,
           price_vnd = ?, old_price_vnd = ?, sold_count = ?, image_url = ?, stock_qty = ?, is_active = ?
       WHERE item_id = ?`,
      [
        payload.name,
        payload.category,
        payload.grade,
        payload.note,
        payload.cpu,
        payload.ram,
        payload.storage,
        payload.battery,
        payload.price,
        payload.oldPrice,
        payload.sold,
        payload.image,
        payload.stock,
        payload.active ? 1 : 0,
        id,
      ]
    );
    return Number(result.affectedRows || 0) > 0 ? UsedTradeIn.getUsedItemById(id) : null;
  },

  deleteUsedItem: async (id) => {
    await ensureTables();
    const [result] = await db.query('DELETE FROM used_trade_items WHERE item_id = ?', [id]);
    return Number(result.affectedRows || 0);
  },

  createTradeInRequest: async (payload) => {
    await ensureTables();
    const [result] = await db.query(
      `INSERT INTO trade_in_requests (
        customer_name, phone, email, device_name, device_condition, expected_price_vnd, note, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        payload.customerName,
        payload.phone,
        payload.email,
        payload.deviceName,
        payload.deviceCondition,
        payload.expectedPrice,
        payload.note,
      ]
    );

    return UsedTradeIn.getTradeInRequestById(result.insertId);
  },

  getTradeInRequestById: async (id) => {
    await ensureTables();
    const [rows] = await db.query(
      `SELECT request_id, customer_name, phone, email, device_name, device_condition,
              expected_price_vnd, note, status, handled_by_user_id, created_at, updated_at
       FROM trade_in_requests
       WHERE request_id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] ? mapTradeInRequest(rows[0]) : null;
  },

  getTradeInRequests: async ({ status = '', limit = 200 } = {}) => {
    await ensureTables();

    const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
    let query = `
      SELECT request_id, customer_name, phone, email, device_name, device_condition,
             expected_price_vnd, note, status, handled_by_user_id, created_at, updated_at
      FROM trade_in_requests
      WHERE 1=1
    `;
    const values = [];

    if (String(status || '').trim()) {
      query += ' AND status = ?';
      values.push(String(status).trim().toUpperCase());
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    values.push(safeLimit);

    const [rows] = await db.query(query, values);
    return rows.map(mapTradeInRequest);
  },

  updateTradeInRequestStatus: async ({ id, status, handledByUserId = null }) => {
    await ensureTables();
    const [result] = await db.query(
      `UPDATE trade_in_requests
       SET status = ?, handled_by_user_id = ?
       WHERE request_id = ?`,
      [status, handledByUserId, id]
    );

    return Number(result.affectedRows || 0) > 0 ? UsedTradeIn.getTradeInRequestById(id) : null;
  },
};

module.exports = UsedTradeIn;
