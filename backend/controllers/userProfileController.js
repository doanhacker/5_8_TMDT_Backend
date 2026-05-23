const User = require('../models/userModel');
const UserAddress = require('../models/userAddressModel');

const PHONE_REGEX = /^[0-9+\-\s]{9,15}$/;

const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1';
    }
    return false;
};

const userProfileController = {
    getMyProfile: async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
            }

            const roles = await User.getUserRoles(userId);

            return res.status(200).json({
                success: true,
                message: 'Lấy thông tin cá nhân thành công',
                data: {
                    ...user,
                    roles,
                },
            });
        } catch (error) {
            console.error('Error getMyProfile:', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    updateMyProfile: async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const { full_name, phone_number } = req.body;

            if (!full_name || !String(full_name).trim()) {
                return res.status(400).json({ success: false, message: 'Họ và tên không được để trống' });
            }

            if (phone_number && !PHONE_REGEX.test(String(phone_number).trim())) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
            }

            await User.updateProfile(userId, {
                full_name: String(full_name).trim(),
                phone_number: phone_number ? String(phone_number).trim() : null,
            });

            const updatedUser = await User.findById(userId);
            const roles = await User.getUserRoles(userId);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin cá nhân thành công',
                data: {
                    ...updatedUser,
                    roles,
                },
            });
        } catch (error) {
            console.error('Error updateMyProfile:', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    getMyAddresses: async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const addresses = await UserAddress.getByUserId(userId);

            return res.status(200).json({
                success: true,
                message: 'Lấy danh sách địa chỉ thành công',
                data: addresses,
            });
        } catch (error) {
            console.error('Error getMyAddresses:', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    createMyAddress: async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const {
                receiver_name,
                receiver_phone,
                specific_address,
                ward,
                district,
                province,
                is_default,
            } = req.body;

            if (!receiver_name || !receiver_phone || !specific_address || !ward || !district || !province) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin địa chỉ giao hàng bắt buộc' });
            }

            if (!PHONE_REGEX.test(String(receiver_phone).trim())) {
                return res.status(400).json({ success: false, message: 'Số điện thoại người nhận không hợp lệ' });
            }

            const nextDefault = normalizeBoolean(is_default);
            if (nextDefault) {
                await UserAddress.clearDefaultByUserId(userId);
            }

            const addressId = await UserAddress.create({
                user_id: userId,
                receiver_name: String(receiver_name).trim(),
                receiver_phone: String(receiver_phone).trim(),
                specific_address: String(specific_address).trim(),
                ward: String(ward).trim(),
                district: String(district).trim(),
                province: String(province).trim(),
                is_default: nextDefault,
            });

            const createdAddress = await UserAddress.getById(addressId);

            return res.status(201).json({
                success: true,
                message: 'Thêm địa chỉ giao hàng thành công',
                data: createdAddress,
            });
        } catch (error) {
            console.error('Error createMyAddress:', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    updateMyAddress: async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const addressId = Number(req.params.addressId);

            if (!addressId || addressId <= 0) {
                return res.status(400).json({ success: false, message: 'ID địa chỉ không hợp lệ' });
            }

            const existingAddress = await UserAddress.getById(addressId);
            if (!existingAddress || Number(existingAddress.user_id) !== Number(userId)) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
            }

            const updateData = { ...req.body };
            if (updateData.receiver_phone && !PHONE_REGEX.test(String(updateData.receiver_phone).trim())) {
                return res.status(400).json({ success: false, message: 'Số điện thoại người nhận không hợp lệ' });
            }

            if (updateData.receiver_name !== undefined) updateData.receiver_name = String(updateData.receiver_name).trim();
            if (updateData.receiver_phone !== undefined) updateData.receiver_phone = String(updateData.receiver_phone).trim();
            if (updateData.specific_address !== undefined) updateData.specific_address = String(updateData.specific_address).trim();
            if (updateData.ward !== undefined) updateData.ward = String(updateData.ward).trim();
            if (updateData.district !== undefined) updateData.district = String(updateData.district).trim();
            if (updateData.province !== undefined) updateData.province = String(updateData.province).trim();

            const nextDefault = normalizeBoolean(updateData.is_default);
            updateData.is_default = nextDefault;

            if (nextDefault) {
                await UserAddress.clearDefaultByUserId(userId);
            }

            const affectedRows = await UserAddress.update(addressId, updateData);
            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không có thay đổi nào được lưu' });
            }

            const updatedAddress = await UserAddress.getById(addressId);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật địa chỉ giao hàng thành công',
                data: updatedAddress,
            });
        } catch (error) {
            console.error('Error updateMyAddress:', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    deleteMyAddress: async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const addressId = Number(req.params.addressId);

            if (!addressId || addressId <= 0) {
                return res.status(400).json({ success: false, message: 'ID địa chỉ không hợp lệ' });
            }

            const existingAddress = await UserAddress.getById(addressId);
            if (!existingAddress || Number(existingAddress.user_id) !== Number(userId)) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
            }

            const affectedRows = await UserAddress.delete(addressId);
            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không thể xóa địa chỉ' });
            }

            return res.status(200).json({
                success: true,
                message: 'Xóa địa chỉ giao hàng thành công',
            });
        } catch (error) {
            console.error('Error deleteMyAddress:', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },
};

module.exports = userProfileController;
