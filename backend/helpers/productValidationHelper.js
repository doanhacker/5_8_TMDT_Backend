/**
 * Các trạng thái hợp lệ cho sản phẩm/phiên bản.
 * Dùng cho ENUM status trong DB: ENUM('IN_STOCK', 'OUT_OF_STOCK', 'COMING_SOON', 'DISCONTINUED')
 */
const VALID_STATUSES = ['IN_STOCK', 'OUT_OF_STOCK', 'COMING_SOON', 'DISCONTINUED'];

/**
 * Validate dữ liệu sản phẩm (product-level)
 * @param {Object} data - Dữ liệu từ req.body
 * @param {boolean} isUpdate - true nếu là cập nhật (chỉ validate các trường có mặt)
 * @returns {string[]} Mảng lỗi (rỗng nếu hợp lệ)
 */
const validateProductData = (data, isUpdate = false) => {
    const {
        product_name, brand_id, category_id, device_type,
        description_html, highlight_features
    } = data;
    const errors = [];

    // --- Bắt buộc khi tạo mới ---
    if (!isUpdate) {
        if (!product_name?.trim()) errors.push('Tên sản phẩm không được để trống.');
        if (!brand_id) errors.push('ID thương hiệu không được để trống.');
        if (!category_id) errors.push('ID danh mục không được để trống.');
    }

    // --- Validate từng field nếu có trong request ---
    if (product_name !== undefined && !product_name.trim()) {
        errors.push('Tên sản phẩm không được để trống.');
    }
    if (brand_id !== undefined && (isNaN(parseInt(brand_id)) || parseInt(brand_id) <= 0)) {
        errors.push('ID thương hiệu không hợp lệ.');
    }
    if (category_id !== undefined && (isNaN(parseInt(category_id)) || parseInt(category_id) <= 0)) {
        errors.push('ID danh mục không hợp lệ.');
    }
    if (device_type !== undefined) {
        const normalizedDeviceType = String(device_type).trim().toUpperCase();
        const validDeviceTypes = ['LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER'];
        if (!validDeviceTypes.includes(normalizedDeviceType)) {
            errors.push(`Loại thiết bị không hợp lệ. Chỉ chấp nhận: ${validDeviceTypes.join(', ')}.`);
        }
    }
    // description_html và highlight_features có thể là null hoặc chuỗi rỗng, không cần validate chặt chẽ
    return errors;
};

/**
 * Validate dữ liệu thông số kỹ thuật chung (product_specifications)
 * @param {Object} data - Dữ liệu từ req.body
 * @param {boolean} isUpdate - true nếu là cập nhật (chỉ validate các trường có mặt)
 * @returns {string[]} Mảng lỗi (rỗng nếu hợp lệ)
 */
const validateProductSpecData = (data, isUpdate = false) => {
    const {
        screen_size,
        weight_kg,
        os,
        battery_capacity_mah,
        refresh_rate_hz,
        charging_port,
        connectivity,
        water_resistance,
        sensors,
        speaker_type
    } = data;
    const errors = [];

    // --- Validate từng field nếu có trong request ---
    if (screen_size !== undefined && (isNaN(parseFloat(screen_size)) || parseFloat(screen_size) <= 0)) {
        errors.push('Kích thước màn hình không hợp lệ.');
    }
    if (weight_kg !== undefined && (isNaN(parseFloat(weight_kg)) || parseFloat(weight_kg) <= 0)) {
        errors.push('Trọng lượng không hợp lệ.');
    }
    if (os !== undefined && !os.trim()) {
        errors.push('Hệ điều hành không được để trống.');
    }
    if (battery_capacity_mah !== undefined && (isNaN(parseInt(battery_capacity_mah)) || parseInt(battery_capacity_mah) <= 0)) {
        errors.push('Dung lượng pin không hợp lệ.');
    }
    if (refresh_rate_hz !== undefined && (isNaN(parseInt(refresh_rate_hz)) || parseInt(refresh_rate_hz) <= 0)) {
        errors.push('Tần số quét không hợp lệ.');
    }
    if (charging_port !== undefined && !String(charging_port).trim()) {
        errors.push('Cổng sạc/kết nối không được để trống nếu đã cung cấp.');
    }
    if (connectivity !== undefined && !String(connectivity).trim()) {
        errors.push('Thông tin kết nối không được để trống nếu đã cung cấp.');
    }
    if (water_resistance !== undefined && !String(water_resistance).trim()) {
        errors.push('Khả năng kháng nước không được để trống nếu đã cung cấp.');
    }
    if (sensors !== undefined && !String(sensors).trim()) {
        errors.push('Thông tin cảm biến không được để trống nếu đã cung cấp.');
    }
    if (speaker_type !== undefined && !String(speaker_type).trim()) {
        errors.push('Thông tin loa không được để trống nếu đã cung cấp.');
    }
    return errors;
};


/**
 * Validate dữ liệu một phiên bản sản phẩm (product_variants)
 * @param {Object} data - Dữ liệu của một variant
 * @param {boolean} isUpdate - true nếu là cập nhật
 * @returns {string[]} Mảng lỗi (rỗng nếu hợp lệ)
 */
const validateVariantData = (data, isUpdate = false) => {
    const {
        sku, cpu_name, cpu_benchmark_score, gpu,
        ram_gb, storage_gb, color_name,
        original_price, discount_price, stock_quantity, status
    } = data;
    const errors = [];

    // --- Bắt buộc khi tạo mới (trong mảng variants) ---
    if (!isUpdate) {
        if (!sku?.trim()) errors.push('Mã SKU của phiên bản không được để trống.');
        if (!ram_gb) errors.push('RAM (GB) của phiên bản không được để trống.');
        if (!storage_gb) errors.push('Bộ nhớ (GB) của phiên bản không được để trống.');
        if (!color_name?.trim()) errors.push('Màu sắc của phiên bản không được để trống.');
        if (original_price === undefined) errors.push('Giá gốc của phiên bản không được để trống.');
    }

    // --- Validate từng field nếu có trong request ---
    if (sku !== undefined && !sku.trim()) {
        errors.push('Mã SKU của phiên bản không được để trống.');
    }
    if (cpu_benchmark_score !== undefined && (isNaN(parseInt(cpu_benchmark_score)) || parseInt(cpu_benchmark_score) <= 0)) {
        errors.push('Điểm benchmark CPU không hợp lệ.');
    }
    if (ram_gb !== undefined && (isNaN(parseInt(ram_gb)) || parseInt(ram_gb) <= 0)) {
        errors.push('RAM (GB) phải là số nguyên dương.');
    }
    if (storage_gb !== undefined && (isNaN(parseInt(storage_gb)) || parseInt(storage_gb) <= 0)) {
        errors.push('Bộ nhớ (GB) phải là số nguyên dương.');
    }
    if (color_name !== undefined && !color_name.trim()) {
        errors.push('Màu sắc của phiên bản không được để trống.');
    }
    if (original_price !== undefined && (isNaN(parseFloat(original_price)) || parseFloat(original_price) <= 0)) {
        errors.push('Giá gốc của phiên bản phải là số dương.');
    }
    if (discount_price !== undefined && (isNaN(parseFloat(discount_price)) || parseFloat(discount_price) < 0)) {
        errors.push('Giá khuyến mãi của phiên bản không hợp lệ.');
    } else if (original_price !== undefined && discount_price !== undefined && parseFloat(discount_price) >= parseFloat(original_price)) {
        errors.push('Giá khuyến mãi phải nhỏ hơn giá gốc.');
    }
    if (stock_quantity !== undefined && (isNaN(parseInt(stock_quantity)) || parseInt(stock_quantity) < 0)) {
        errors.push('Số lượng tồn kho của phiên bản phải là số nguyên không âm.');
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
        errors.push(`Trạng thái của phiên bản phải là một trong các giá trị: ${VALID_STATUSES.join(', ')}.`);
    }

    return errors;
};

/**
 * Validate một ID số nguyên dương
 * @param {any} id - ID cần validate
 * @returns {boolean} - true nếu hợp lệ, false nếu không
 */
const isValidId = (id) => !isNaN(parseInt(id)) && parseInt(id) > 0;


module.exports = {
    VALID_STATUSES,
    validateProductData,
    validateProductSpecData,
    validateVariantData,
    isValidId
};