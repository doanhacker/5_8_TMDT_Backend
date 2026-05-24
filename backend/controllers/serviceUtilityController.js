const ServiceUtility = require('../models/serviceUtilityModel');

const normalizeItem = (item) => ({
  id: item.service_id,
  name: item.service_name,
  provider: item.provider_name,
  category: item.category_name,
  description: item.short_description,
  features: Array.isArray(item.feature_list) ? item.feature_list : [],
  price: item.price_vnd,
  oldPrice: item.old_price_vnd || item.price_vnd,
  stock: item.stock_capacity,
  sold: item.sold_count,
  image: item.image_url,
  inStock: item.is_active && Number(item.stock_capacity || 0) > 0,
  active: item.is_active,
  featured: item.is_featured,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const toNullableNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseFeatures = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return trimmed
        .split(/\r?\n|,|\u2022/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const validateCreatePayload = (payload) => {
  const errors = [];
  if (!String(payload.service_name || '').trim()) {
    errors.push('service_name la bat buoc');
  }

  const price = Number(payload.price_vnd);
  if (!Number.isFinite(price) || price < 0) {
    errors.push('price_vnd khong hop le');
  }

  const stock = Number(payload.stock_capacity);
  if (!Number.isFinite(stock) || stock < 0) {
    errors.push('stock_capacity khong hop le');
  }

  return errors;
};

const serviceUtilityController = {
  getList: async (req, res) => {
    try {
      const includeInactive = toBoolean(req.query.includeInactive, false);
      const activeOnly = includeInactive ? false : true;

      const result = await ServiceUtility.getList({
        search: req.query.search,
        category: req.query.category,
        provider: req.query.provider,
        minPrice: toOptionalNumber(req.query.minPrice),
        maxPrice: toOptionalNumber(req.query.maxPrice),
        featuredOnly: toBoolean(req.query.featuredOnly, false),
        activeOnly,
        page: req.query.page,
        limit: req.query.limit,
      });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách dịch vụ thành công',
        data: result.data.map(normalizeItem),
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('[serviceUtilityController.getList]', error);
      return res.status(500).json({ success: false, message: 'Không thể lấy danh sách dịch vụ' });
    }
  },

  getById: async (req, res) => {
    try {
      const serviceId = Number(req.params.id);
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        return res.status(400).json({ success: false, message: 'ID dịch vụ không hợp lệ' });
      }

      const item = await ServiceUtility.getById(serviceId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
      }

      return res.status(200).json({ success: true, data: normalizeItem(item) });
    } catch (error) {
      console.error('[serviceUtilityController.getById]', error);
      return res.status(500).json({ success: false, message: 'Không thể lấy chi tiết dịch vụ' });
    }
  },

  create: async (req, res) => {
    try {
      const payload = {
        service_name: String(req.body.service_name || '').trim(),
        provider_name: String(req.body.provider_name || 'TechMart').trim(),
        category_name: String(req.body.category_name || 'Dịch vụ').trim(),
        short_description: String(req.body.short_description || '').trim(),
        feature_list: parseFeatures(req.body.feature_list),
        price_vnd: toNullableNumber(req.body.price_vnd, NaN),
        old_price_vnd: toNullableNumber(req.body.old_price_vnd, null),
        stock_capacity: toNullableNumber(req.body.stock_capacity, NaN),
        sold_count: toNullableNumber(req.body.sold_count, 0),
        image_url: String(req.body.image_url || '').trim(),
        is_active: toBoolean(req.body.is_active, true),
        is_featured: toBoolean(req.body.is_featured, false),
      };

      const errors = validateCreatePayload(payload);
      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors[0], errors });
      }

      const created = await ServiceUtility.create(payload);
      return res.status(201).json({
        success: true,
        message: 'Tạo dịch vụ thành công',
        data: normalizeItem(created),
      });
    } catch (error) {
      console.error('[serviceUtilityController.create]', error);
      return res.status(500).json({ success: false, message: 'Không thể tạo dịch vụ' });
    }
  },

  update: async (req, res) => {
    try {
      const serviceId = Number(req.params.id);
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        return res.status(400).json({ success: false, message: 'ID dịch vụ không hợp lệ' });
      }

      const existing = await ServiceUtility.getById(serviceId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
      }

      const payload = {};

      if (req.body.service_name !== undefined) payload.service_name = String(req.body.service_name || '').trim();
      if (req.body.provider_name !== undefined) payload.provider_name = String(req.body.provider_name || '').trim();
      if (req.body.category_name !== undefined) payload.category_name = String(req.body.category_name || '').trim();
      if (req.body.short_description !== undefined) payload.short_description = String(req.body.short_description || '').trim();
      if (req.body.feature_list !== undefined) payload.feature_list = parseFeatures(req.body.feature_list);
      if (req.body.price_vnd !== undefined) payload.price_vnd = toNullableNumber(req.body.price_vnd, NaN);
      if (req.body.old_price_vnd !== undefined) payload.old_price_vnd = toNullableNumber(req.body.old_price_vnd, null);
      if (req.body.stock_capacity !== undefined) payload.stock_capacity = toNullableNumber(req.body.stock_capacity, NaN);
      if (req.body.sold_count !== undefined) payload.sold_count = toNullableNumber(req.body.sold_count, 0);
      if (req.body.image_url !== undefined) payload.image_url = String(req.body.image_url || '').trim();
      if (req.body.is_active !== undefined) payload.is_active = toBoolean(req.body.is_active, true);
      if (req.body.is_featured !== undefined) payload.is_featured = toBoolean(req.body.is_featured, false);

      if (payload.price_vnd !== undefined && (!Number.isFinite(payload.price_vnd) || payload.price_vnd < 0)) {
        return res.status(400).json({ success: false, message: 'price_vnd khong hop le' });
      }

      if (payload.stock_capacity !== undefined && (!Number.isFinite(payload.stock_capacity) || payload.stock_capacity < 0)) {
        return res.status(400).json({ success: false, message: 'stock_capacity khong hop le' });
      }

      const updated = await ServiceUtility.update(serviceId, payload);
      return res.status(200).json({
        success: true,
        message: 'Cập nhật dịch vụ thành công',
        data: normalizeItem(updated),
      });
    } catch (error) {
      if (error.message === 'NO_FIELDS_TO_UPDATE') {
        return res.status(400).json({ success: false, message: 'Không có trường nào để cập nhật' });
      }

      console.error('[serviceUtilityController.update]', error);
      return res.status(500).json({ success: false, message: 'Không thể cập nhật dịch vụ' });
    }
  },

  remove: async (req, res) => {
    try {
      const serviceId = Number(req.params.id);
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        return res.status(400).json({ success: false, message: 'ID dịch vụ không hợp lệ' });
      }

      const existing = await ServiceUtility.getById(serviceId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
      }

      await ServiceUtility.remove(serviceId);
      return res.status(200).json({ success: true, message: 'Xóa dịch vụ thành công' });
    } catch (error) {
      console.error('[serviceUtilityController.remove]', error);
      return res.status(500).json({ success: false, message: 'Không thể xóa dịch vụ' });
    }
  },
};

module.exports = serviceUtilityController;
