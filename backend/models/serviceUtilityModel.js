const db = require('../config/db');

let tableReadyPromise = null;

const DEFAULT_SERVICE_SEEDS = [
  {
    service_name: 'Gói lắp đặt tiêu chuẩn tại nhà',
    provider_name: 'TechMart Care',
    category_name: 'Lắp đặt',
    short_description: 'Kỹ thuật viên đến tận nơi trong 2 giờ nội thành.',
    feature_list: ['Hẹn giờ linh hoạt', 'Có biên nhận', 'Bảo hành lắp đặt 30 ngày'],
    price_vnd: 350000,
    old_price_vnd: 500000,
    stock_capacity: 999,
    sold_count: 286,
    image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80',
    is_active: 1,
    is_featured: 1,
  },
  {
    service_name: 'Gia hạn bảo hành Plus 12 tháng',
    provider_name: 'TechMart Warranty',
    category_name: 'Bảo hành',
    short_description: 'Đổi mới nhanh khi lỗi phần cứng theo chính sách áp dụng.',
    feature_list: ['Hỗ trợ 7 ngày/tuần', 'Ưu tiên xử lý', 'Không phụ phí kiểm tra'],
    price_vnd: 890000,
    old_price_vnd: 1190000,
    stock_capacity: 999,
    sold_count: 402,
    image_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    is_active: 1,
    is_featured: 1,
  },
  {
    service_name: 'Phục hồi dữ liệu chuyên sâu',
    provider_name: 'TechMart Lab',
    category_name: 'Phục hồi dữ liệu',
    short_description: 'Khôi phục dữ liệu SSD/HDD/điện thoại theo mức độ hỏng.',
    feature_list: ['Báo giá trước', 'Cam kết bảo mật', 'Xuất biên bản kỹ thuật'],
    price_vnd: 1490000,
    old_price_vnd: 1990000,
    stock_capacity: 999,
    sold_count: 93,
    image_url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    is_active: 1,
    is_featured: 0,
  },
  {
    service_name: 'Hỗ trợ kỹ thuật ưu tiên 1:1',
    provider_name: 'TechMart Support',
    category_name: 'Hỗ trợ kỹ thuật',
    short_description: 'Hỗ trợ cài đặt, tối ưu và xử lý lỗi từ xa trong 60 phút.',
    feature_list: ['Video call', 'TeamViewer/AnyDesk', 'Báo cáo sau xử lý'],
    price_vnd: 590000,
    old_price_vnd: 790000,
    stock_capacity: 999,
    sold_count: 218,
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    is_active: 1,
    is_featured: 0,
  },
];

const seedDefaultDataIfEmpty = async () => {
  const [countRows] = await db.query('SELECT COUNT(*) AS total FROM service_utilities');
  const total = Number(countRows?.[0]?.total || 0);
  if (total > 0) return;

  const insertSql = `
    INSERT INTO service_utilities (
      service_name,
      provider_name,
      category_name,
      short_description,
      feature_list_json,
      price_vnd,
      old_price_vnd,
      stock_capacity,
      sold_count,
      image_url,
      is_active,
      is_featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const item of DEFAULT_SERVICE_SEEDS) {
    await db.query(insertSql, [
      item.service_name,
      item.provider_name,
      item.category_name,
      item.short_description,
      JSON.stringify(item.feature_list || []),
      item.price_vnd,
      item.old_price_vnd,
      item.stock_capacity,
      item.sold_count,
      item.image_url,
      item.is_active,
      item.is_featured,
    ]);
  }
};

const normalizeLegacySeedTexts = async () => {
  const updates = [
    {
      oldName: 'Goi lap dat tieu chuan tai nha',
      newName: 'Gói lắp đặt tiêu chuẩn tại nhà',
      newCategory: 'Lắp đặt',
      newDescription: 'Kỹ thuật viên đến tận nơi trong 2 giờ nội thành.',
      newFeatures: ['Hẹn giờ linh hoạt', 'Có biên nhận', 'Bảo hành lắp đặt 30 ngày'],
    },
    {
      oldName: 'Gia han bao hanh Plus 12 thang',
      newName: 'Gia hạn bảo hành Plus 12 tháng',
      newCategory: 'Bảo hành',
      newDescription: 'Đổi mới nhanh khi lỗi phần cứng theo chính sách áp dụng.',
      newFeatures: ['Hỗ trợ 7 ngày/tuần', 'Ưu tiên xử lý', 'Không phụ phí kiểm tra'],
    },
    {
      oldName: 'Phuc hoi du lieu chuyen sau',
      newName: 'Phục hồi dữ liệu chuyên sâu',
      newCategory: 'Phục hồi dữ liệu',
      newDescription: 'Khôi phục dữ liệu SSD/HDD/điện thoại theo mức độ hỏng.',
      newFeatures: ['Báo giá trước', 'Cam kết bảo mật', 'Xuất biên bản kỹ thuật'],
    },
    {
      oldName: 'Ho tro ky thuat uu tien 1:1',
      newName: 'Hỗ trợ kỹ thuật ưu tiên 1:1',
      newCategory: 'Hỗ trợ kỹ thuật',
      newDescription: 'Hỗ trợ cài đặt, tối ưu và xử lý lỗi từ xa trong 60 phút.',
      newFeatures: ['Video call', 'TeamViewer/AnyDesk', 'Báo cáo sau xử lý'],
    },
  ];

  for (const item of updates) {
    await db.query(
      `UPDATE service_utilities
       SET service_name = ?, category_name = ?, short_description = ?, feature_list_json = ?
       WHERE service_name = ?`,
      [
        item.newName,
        item.newCategory,
        item.newDescription,
        JSON.stringify(item.newFeatures),
        item.oldName,
      ]
    );
  }
};

const ensureTable = async () => {
  if (!tableReadyPromise) {
    tableReadyPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS service_utilities (
          service_id INT AUTO_INCREMENT PRIMARY KEY,
          service_name VARCHAR(255) NOT NULL,
          provider_name VARCHAR(120) DEFAULT 'TechMart',
          category_name VARCHAR(120) DEFAULT 'Dịch vụ',
          short_description TEXT,
          feature_list_json JSON,
          price_vnd DECIMAL(15,2) NOT NULL DEFAULT 0,
          old_price_vnd DECIMAL(15,2) NULL,
          stock_capacity INT NOT NULL DEFAULT 0,
          sold_count INT NOT NULL DEFAULT 0,
          image_url TEXT,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          is_featured TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await seedDefaultDataIfEmpty();
      await normalizeLegacySeedTexts();
    })();
  }

  await tableReadyPromise;
};

const parseFeatureList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(/\r?\n|,|\u2022/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const mapRow = (row) => ({
  service_id: row.service_id,
  service_name: row.service_name,
  provider_name: row.provider_name,
  category_name: row.category_name,
  short_description: row.short_description || '',
  feature_list: parseFeatureList(row.feature_list_json),
  price_vnd: Number(row.price_vnd || 0),
  old_price_vnd: row.old_price_vnd != null ? Number(row.old_price_vnd) : null,
  stock_capacity: Number(row.stock_capacity || 0),
  sold_count: Number(row.sold_count || 0),
  image_url: row.image_url || '',
  is_active: Number(row.is_active) === 1,
  is_featured: Number(row.is_featured) === 1,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const buildListQuery = ({
  search,
  category,
  provider,
  minPrice,
  maxPrice,
  activeOnly,
  featuredOnly,
  limit,
  offset,
}) => {
  let query = `
    SELECT
      service_id,
      service_name,
      provider_name,
      category_name,
      short_description,
      feature_list_json,
      price_vnd,
      old_price_vnd,
      stock_capacity,
      sold_count,
      image_url,
      is_active,
      is_featured,
      created_at,
      updated_at
    FROM service_utilities
    WHERE 1=1
  `;

  const values = [];

  if (search) {
    query += ` AND (service_name LIKE ? OR short_description LIKE ? OR category_name LIKE ?)`;
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category) {
    query += ` AND category_name = ?`;
    values.push(category);
  }

  if (provider) {
    query += ` AND provider_name = ?`;
    values.push(provider);
  }

  if (Number.isFinite(minPrice)) {
    query += ` AND price_vnd >= ?`;
    values.push(minPrice);
  }

  if (Number.isFinite(maxPrice)) {
    query += ` AND price_vnd <= ?`;
    values.push(maxPrice);
  }

  if (activeOnly) {
    query += ` AND is_active = 1`;
  }

  if (featuredOnly) {
    query += ` AND is_featured = 1`;
  }

  query += ` ORDER BY is_featured DESC, updated_at DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  return { query, values };
};

const buildCountQuery = ({ search, category, provider, minPrice, maxPrice, activeOnly, featuredOnly }) => {
  let query = `SELECT COUNT(*) AS total FROM service_utilities WHERE 1=1`;
  const values = [];

  if (search) {
    query += ` AND (service_name LIKE ? OR short_description LIKE ? OR category_name LIKE ?)`;
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category) {
    query += ` AND category_name = ?`;
    values.push(category);
  }

  if (provider) {
    query += ` AND provider_name = ?`;
    values.push(provider);
  }

  if (Number.isFinite(minPrice)) {
    query += ` AND price_vnd >= ?`;
    values.push(minPrice);
  }

  if (Number.isFinite(maxPrice)) {
    query += ` AND price_vnd <= ?`;
    values.push(maxPrice);
  }

  if (activeOnly) {
    query += ` AND is_active = 1`;
  }

  if (featuredOnly) {
    query += ` AND is_featured = 1`;
  }

  return { query, values };
};

const ServiceUtility = {
  ensureTable,

  getById: async (serviceId) => {
    await ensureTable();

    const [rows] = await db.query(
      `SELECT
        service_id,
        service_name,
        provider_name,
        category_name,
        short_description,
        feature_list_json,
        price_vnd,
        old_price_vnd,
        stock_capacity,
        sold_count,
        image_url,
        is_active,
        is_featured,
        created_at,
        updated_at
      FROM service_utilities
      WHERE service_id = ?
      LIMIT 1`,
      [serviceId]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  },

  getList: async (options = {}) => {
    await ensureTable();

    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
    const page = Math.max(Number(options.page) || 1, 1);
    const offset = (page - 1) * limit;

    const minPrice = options.minPrice !== undefined ? Number(options.minPrice) : undefined;
    const maxPrice = options.maxPrice !== undefined ? Number(options.maxPrice) : undefined;

    const filters = {
      search: String(options.search || '').trim(),
      category: String(options.category || '').trim(),
      provider: String(options.provider || '').trim(),
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      activeOnly: Boolean(options.activeOnly),
      featuredOnly: Boolean(options.featuredOnly),
      limit,
      offset,
    };

    const { query, values } = buildListQuery(filters);
    const { query: countQuery, values: countValues } = buildCountQuery(filters);

    const [[rows], [[countRow]]] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, countValues),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: {
        total: Number(countRow?.total || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countRow?.total || 0) / limit) || 1,
      },
    };
  },

  create: async (payload) => {
    await ensureTable();

    const featureListJson = JSON.stringify(parseFeatureList(payload.feature_list));

    const [result] = await db.query(
      `INSERT INTO service_utilities (
        service_name,
        provider_name,
        category_name,
        short_description,
        feature_list_json,
        price_vnd,
        old_price_vnd,
        stock_capacity,
        sold_count,
        image_url,
        is_active,
        is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.service_name,
        payload.provider_name,
        payload.category_name,
        payload.short_description,
        featureListJson,
        payload.price_vnd,
        payload.old_price_vnd,
        payload.stock_capacity,
        payload.sold_count,
        payload.image_url,
        payload.is_active ? 1 : 0,
        payload.is_featured ? 1 : 0,
      ]
    );

    return ServiceUtility.getById(result.insertId);
  },

  update: async (serviceId, payload) => {
    await ensureTable();

    const fields = [];
    const values = [];

    const assignField = (column, value) => {
      fields.push(`${column} = ?`);
      values.push(value);
    };

    if (payload.service_name !== undefined) assignField('service_name', payload.service_name);
    if (payload.provider_name !== undefined) assignField('provider_name', payload.provider_name);
    if (payload.category_name !== undefined) assignField('category_name', payload.category_name);
    if (payload.short_description !== undefined) assignField('short_description', payload.short_description);
    if (payload.feature_list !== undefined) assignField('feature_list_json', JSON.stringify(parseFeatureList(payload.feature_list)));
    if (payload.price_vnd !== undefined) assignField('price_vnd', payload.price_vnd);
    if (payload.old_price_vnd !== undefined) assignField('old_price_vnd', payload.old_price_vnd);
    if (payload.stock_capacity !== undefined) assignField('stock_capacity', payload.stock_capacity);
    if (payload.sold_count !== undefined) assignField('sold_count', payload.sold_count);
    if (payload.image_url !== undefined) assignField('image_url', payload.image_url);
    if (payload.is_active !== undefined) assignField('is_active', payload.is_active ? 1 : 0);
    if (payload.is_featured !== undefined) assignField('is_featured', payload.is_featured ? 1 : 0);

    if (fields.length === 0) {
      throw new Error('NO_FIELDS_TO_UPDATE');
    }

    values.push(serviceId);

    await db.query(
      `UPDATE service_utilities SET ${fields.join(', ')} WHERE service_id = ?`,
      values
    );

    return ServiceUtility.getById(serviceId);
  },

  remove: async (serviceId) => {
    await ensureTable();
    const [result] = await db.query(`DELETE FROM service_utilities WHERE service_id = ?`, [serviceId]);
    return Number(result.affectedRows || 0);
  },
};

module.exports = ServiceUtility;
