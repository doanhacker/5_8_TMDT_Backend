const UsedTradeIn = require('../models/usedTradeInModel');

const VALID_REQUEST_STATUSES = ['PENDING', 'CONTACTED', 'APPRAISED', 'COMPLETED', 'CANCELLED'];

const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStoredImageUrl = (file) => {
  if (!file) return '';
  if (file.path && /^https?:\/\//i.test(file.path)) {
    return file.path;
  }
  if (file.filename) {
    return `/uploads/products/${file.filename}`;
  }
  return file.path || '';
};

const sanitizeUsedItemPayload = (body = {}) => ({
  name: String(body.name || '').trim(),
  category: String(body.category || 'Thiết bị').trim(),
  grade: String(body.grade || 'Cũ đẹp').trim(),
  note: String(body.note || '').trim(),
  cpu: String(body.cpu || '').trim(),
  ram: String(body.ram || '').trim(),
  storage: String(body.storage || '').trim(),
  battery: String(body.battery || '').trim(),
  price: toOptionalNumber(body.price) ?? 0,
  oldPrice: toOptionalNumber(body.oldPrice),
  sold: toOptionalNumber(body.sold) ?? 0,
  image: String(body.image || '').trim(),
  stock: toOptionalNumber(body.stock) ?? 0,
  active: body.active === undefined ? true : Boolean(body.active),
});

const usedTradeInController = {
  uploadUsedItemImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh để upload' });
      }

      const imageUrl = toStoredImageUrl(req.file);
      return res.status(200).json({
        success: true,
        message: 'Upload ảnh máy cũ thành công',
        data: { imageUrl },
      });
    } catch (error) {
      console.error('[usedTradeInController.uploadUsedItemImage]', error);
      return res.status(500).json({ success: false, message: 'Không thể upload ảnh máy cũ' });
    }
  },

  getUsedItems: async (req, res) => {
    try {
      const includeInactive = String(req.query.includeInactive || '').trim().toLowerCase() === 'true';
      const data = await UsedTradeIn.getUsedItems({
        search: req.query.search,
        activeOnly: !includeInactive,
        limit: req.query.limit,
      });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách máy cũ thành công',
        data,
      });
    } catch (error) {
      console.error('[usedTradeInController.getUsedItems]', error);
      return res.status(500).json({ success: false, message: 'Không thể lấy danh sách máy cũ' });
    }
  },

  getUsedItemById: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'ID máy cũ không hợp lệ' });
      }

      const item = await UsedTradeIn.getUsedItemById(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy máy cũ' });
      }

      return res.status(200).json({ success: true, data: item });
    } catch (error) {
      console.error('[usedTradeInController.getUsedItemById]', error);
      return res.status(500).json({ success: false, message: 'Không thể lấy chi tiết máy cũ' });
    }
  },

  createUsedItem: async (req, res) => {
    try {
      const payload = sanitizeUsedItemPayload(req.body);
      if (!payload.name) {
        return res.status(400).json({ success: false, message: 'Tên máy cũ là bắt buộc' });
      }
      if (!Number.isFinite(payload.price) || payload.price < 0) {
        return res.status(400).json({ success: false, message: 'Giá bán không hợp lệ' });
      }

      const created = await UsedTradeIn.createUsedItem(payload);
      return res.status(201).json({
        success: true,
        message: 'Tạo máy cũ thành công',
        data: created,
      });
    } catch (error) {
      console.error('[usedTradeInController.createUsedItem]', error);
      return res.status(500).json({ success: false, message: 'Không thể tạo máy cũ' });
    }
  },

  updateUsedItem: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'ID máy cũ không hợp lệ' });
      }

      const payload = sanitizeUsedItemPayload(req.body);
      if (!payload.name) {
        return res.status(400).json({ success: false, message: 'Tên máy cũ là bắt buộc' });
      }

      const updated = await UsedTradeIn.updateUsedItem(id, payload);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy máy cũ để cập nhật' });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật máy cũ thành công',
        data: updated,
      });
    } catch (error) {
      console.error('[usedTradeInController.updateUsedItem]', error);
      return res.status(500).json({ success: false, message: 'Không thể cập nhật máy cũ' });
    }
  },

  deleteUsedItem: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'ID máy cũ không hợp lệ' });
      }

      const affected = await UsedTradeIn.deleteUsedItem(id);
      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy máy cũ để xóa' });
      }

      return res.status(200).json({ success: true, message: 'Xóa máy cũ thành công' });
    } catch (error) {
      console.error('[usedTradeInController.deleteUsedItem]', error);
      return res.status(500).json({ success: false, message: 'Không thể xóa máy cũ' });
    }
  },

  createTradeInRequest: async (req, res) => {
    try {
      const payload = {
        customerName: String(req.body.customerName || '').trim(),
        phone: String(req.body.phone || '').trim(),
        email: String(req.body.email || '').trim(),
        deviceName: String(req.body.deviceName || '').trim(),
        deviceCondition: String(req.body.deviceCondition || '').trim(),
        expectedPrice: toOptionalNumber(req.body.expectedPrice),
        note: String(req.body.note || '').trim(),
      };

      if (!payload.customerName || !payload.phone || !payload.deviceName) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên, số điện thoại và tên thiết bị' });
      }

      const created = await UsedTradeIn.createTradeInRequest(payload);
      return res.status(201).json({
        success: true,
        message: 'Đăng ký thu cũ thành công',
        data: created,
      });
    } catch (error) {
      console.error('[usedTradeInController.createTradeInRequest]', error);
      return res.status(500).json({ success: false, message: 'Không thể tạo yêu cầu thu cũ' });
    }
  },

  getTradeInRequests: async (req, res) => {
    try {
      const data = await UsedTradeIn.getTradeInRequests({
        status: req.query.status,
        limit: req.query.limit,
      });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách yêu cầu thu cũ thành công',
        data,
      });
    } catch (error) {
      console.error('[usedTradeInController.getTradeInRequests]', error);
      return res.status(500).json({ success: false, message: 'Không thể lấy danh sách yêu cầu thu cũ' });
    }
  },

  updateTradeInRequestStatus: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
      }

      const status = String(req.body.status || '').trim().toUpperCase();
      if (!VALID_REQUEST_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái yêu cầu không hợp lệ' });
      }

      const updated = await UsedTradeIn.updateTradeInRequestStatus({
        id,
        status,
        handledByUserId: req.user?.user_id || null,
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu thu cũ' });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái yêu cầu thành công',
        data: updated,
      });
    } catch (error) {
      console.error('[usedTradeInController.updateTradeInRequestStatus]', error);
      return res.status(500).json({ success: false, message: 'Không thể cập nhật trạng thái yêu cầu' });
    }
  },
};

module.exports = usedTradeInController;
