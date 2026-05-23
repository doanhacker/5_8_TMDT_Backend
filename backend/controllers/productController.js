const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const ProductCategory = require('../models/productCategoryModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const uploadProduct = require('../middlewares/uploadProductImageMiddleware');
const { parseQueryParams, getOffset, buildPaginationResult } = require('../helpers/queryHelper');
const {
    validateProductData,
    validateProductSpecData,
    validateVariantData,
    isValidId,
    VALID_STATUSES
} = require('../helpers/productValidationHelper');
const {
    detectScopeFromProduct,
    getAdminScopeByUser,
    getPreferredDeviceTypeForScope,
    checkScopeMutationAccess
} = require('../helpers/adminScopeHelper');

const toStoredImageUrl = (file) => {
    if (!file) return null;
    if (file.path && /^https?:\/\//i.test(file.path)) {
        return file.path;
    }
    if (file.filename) {
        return `/uploads/products/${file.filename}`;
    }
    return file.path || null;
};

const parseOptionalJsonObject = (value) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    let parsedValue = value;
    if (typeof value === 'string') {
        parsedValue = JSON.parse(value);
    }

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
        throw new Error('JSON object expected');
    }

    return parsedValue;
};


const productController = {
    /**
     * API: Lấy danh sách sản phẩm (GET /api/products)
     * Hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang.
     * Trả về thông tin tổng quan, giá min/max, tổng tồn kho và ảnh chính cấp sản phẩm.
     */
    getAllProducts: async (req, res) => {
        try {
            const queryParams = parseQueryParams(req.query, {
                defaultSortBy: 'created_at',
                defaultLimit: 12,
                maxLimit: 50
            });
            const { page, limit, search, sortBy, sortOrder, status } = queryParams;

            const {
                categoryId,
                brandId,
                minPrice,
                maxPrice,
                deviceType,
            } = req.query;

            const options = {
                search,
                categoryId: categoryId ? parseInt(categoryId) : undefined,
                brandId: brandId ? parseInt(brandId) : undefined,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                deviceType: deviceType ? String(deviceType).trim().toUpperCase() : undefined,
                sortBy,
                sortOrder,
                limit,
                offset: getOffset(page, limit),
                status
            };

            const actingScope = getAdminScopeByUser(req.user);
            const forcedDeviceType = getPreferredDeviceTypeForScope(actingScope);
            if (forcedDeviceType) {
                options.deviceType = forcedDeviceType;
            }

            const products = await Product.getAll(options);
            const totalCount = await Product.getTotalCount(options);

            res.status(200).json(buildPaginationResult(products, totalCount, page, limit));
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    getSearchSuggestions: async (req, res) => {
        try {
            const q = String(req.query.q || '').trim();
            const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 10);
            const categoryLimit = Math.min(Math.max(parseInt(req.query.categoryLimit, 10) || 5, 1), 10);

            if (!q) {
                return res.status(200).json({
                    success: true,
                    message: 'OK',
                    data: { categories: [], products: [] }
                });
            }

            const data = await Product.getSearchSuggestions(q, limit, categoryLimit);

            return res.status(200).json({
                success: true,
                message: 'Lấy gợi ý tìm kiếm thành công',
                data
            });
        } catch (error) {
            console.error('Error getSearchSuggestions:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy gợi ý tìm kiếm'
            });
        }
    },

    // API: Lấy chi tiết sản phẩm theo ID (GET /api/products/:id)
    getProductById: async (req, res) => {
        try {
            const { productId } = req.params;

            // Validate productId
            if (!isValidId(productId)) {
                return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ.' });
            }

            const token = req.headers.authorization?.split(' ')[1];
            let requestingUserId = null;
            let isAdmin = false;

            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    requestingUserId = decoded.user_id || decoded.id || decoded.userId;
                    const userRoles = await User.getUserRoles(requestingUserId); // Cần có User.getUserRoles
                    if (userRoles.some(r => r.role_name === 'ADMIN')) isAdmin = true;
                } catch (e) {
                    console.warn('Invalid token for product detail access:', e.message);
                    // Token không hợp lệ, coi như người dùng chưa đăng nhập
                }
            }

            const product = await Product.getById(productId, requestingUserId, isAdmin); // Truyền requestingUserId, isAdmin

            if (!product) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại!' });
            }

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết sản phẩm thành công',
                data: product
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Thêm mới sản phẩm (POST /api/products)
     * Yêu cầu dữ liệu sản phẩm, specs, variants và các file ảnh.
     */
    createProduct: async (req, res) => {
        try {
            const createdByUserId = req.user?.user_id;

            if (!createdByUserId) {
                return res.status(401).json({ success: false, message: 'Yêu cầu xác thực (token) để tạo sản phẩm' });
            }

            const {
                product_name, brand_id, category_id, device_type, description_html, highlight_features,
                screen_size, weight_kg, os,
                battery_capacity_mah, refresh_rate_hz, charging_port, connectivity, water_resistance, sensors, speaker_type,
                device_specific_specs,
                variants: variantsString
            } = req.body;

            let parsedDeviceSpecificSpecs;
            try {
                parsedDeviceSpecificSpecs = parseOptionalJsonObject(device_specific_specs);
            } catch {
                return res.status(400).json({ success: false, message: 'device_specific_specs phải là JSON object hợp lệ.' });
            }

            // 1. Validate Product Data
            const productErrors = validateProductData({ product_name, brand_id, category_id, device_type, description_html, highlight_features });
            if (productErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu sản phẩm', errors: productErrors });
            }

            // 2. Validate Product Specs Data
            const specErrors = validateProductSpecData({
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
            });
            if (specErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu thông số kỹ thuật chung', errors: specErrors });
            }

            // 3. Parse và Validate Variants Data
            let variants;
            try {
                variants = JSON.parse(variantsString);
                if (!Array.isArray(variants) || variants.length === 0) {
                    return res.status(400).json({ success: false, message: 'Dữ liệu variants không hợp lệ hoặc trống.' });
                }
            } catch (parseError) {
                return res.status(400).json({ success: false, message: 'Dữ liệu variants không phải là JSON hợp lệ.' });
            }

            const variantsDataForModel = [];
            for (const [index, variant] of variants.entries()) {
                console.log(`🔍 Validating variant #${index + 1}:`, JSON.stringify(variant, null, 2));
                
                const variantErrors = validateVariantData(variant);
                if (variantErrors.length > 0) {
                    console.error(`❌ Variant #${index + 1} validation errors:`, variantErrors);
                    return res.status(400).json({ success: false, message: `Lỗi dữ liệu phiên bản #${index + 1}`, errors: variantErrors });
                }

                // Lấy URL ảnh cho variant này từ req.files
                const variantImages = req.files && req.files[`variant_${index}_images`]
                    ? req.files[`variant_${index}_images`].map(toStoredImageUrl).filter(Boolean)
                    : [];
                if (variantImages.length === 0) {
                    return res.status(400).json({ success: false, message: `Phiên bản #${index + 1} yêu cầu ít nhất một ảnh.` });
                }

                variantsDataForModel.push({
                    sku: variant.sku,
                    cpu_name: variant.cpu_name || null,
                    cpu_benchmark_score: variant.cpu_benchmark_score ? parseInt(variant.cpu_benchmark_score) : null,
                    gpu: variant.gpu || null,
                    ram_gb: parseInt(variant.ram_gb),
                    ram_type: variant.ram_type || null,
                    storage_gb: parseInt(variant.storage_gb),
                    color_name: variant.color_name,
                    original_price: parseFloat(variant.original_price),
                    discount_price: variant.discount_price ? parseFloat(variant.discount_price) : null,
                    stock_quantity: variant.stock_quantity ? parseInt(variant.stock_quantity) : 0,
                    status: variant.status || 'IN_STOCK',
                    imageUrls: variantImages
                });
            }

            // 4. Kiểm tra sự tồn tại của Brand và Category
            const brand = await Brand.getById(brand_id);
            if (!brand) {
                return res.status(404).json({ success: false, message: 'Thương hiệu không tồn tại.' });
            }
            const category = await ProductCategory.getById(category_id);
            if (!category) {
                return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
            }

            const requestedDeviceType = device_type ? String(device_type).trim().toUpperCase() : 'LAPTOP';
            const targetScope = detectScopeFromProduct({
                deviceType: requestedDeviceType,
                categoryName: category.category_name
            });
            const access = checkScopeMutationAccess({ user: req.user, targetScope, actionLabel: 'thao tác' });
            if (!access.allowed) {
                return res.status(403).json({ success: false, message: access.message });
            }

            const productData = {
                product_name,
                brand_id: parseInt(brand_id),
                category_id: parseInt(category_id),
                device_type: requestedDeviceType,
                description_html: description_html || null,
                highlight_features: highlight_features || null,
                created_by: createdByUserId
            };

            const specData = {
                screen_size: screen_size ? parseFloat(screen_size) : null,
                weight_kg: weight_kg ? parseFloat(weight_kg) : null,
                os: os || null,
                battery_capacity_mah: battery_capacity_mah ? parseInt(battery_capacity_mah) : null,
                refresh_rate_hz: refresh_rate_hz ? parseInt(refresh_rate_hz) : null,
                charging_port: charging_port || null,
                connectivity: connectivity || null,
                water_resistance: water_resistance || null,
                sensors: sensors || null,
                speaker_type: speaker_type || null
                    ,device_specific_specs: parsedDeviceSpecificSpecs || {}
            };

            const productLevelImageUrls = req.files && req.files['productImages']
                ? req.files['productImages'].map(toStoredImageUrl).filter(Boolean)
                : [];

            if (productLevelImageUrls.length === 0) {
                return res.status(400).json({ success: false, message: 'Sản phẩm yêu cầu ít nhất một ảnh cấp sản phẩm.' });
            }


            const newProductId = await Product.create(
                productData,
                specData,
                productLevelImageUrls,
                variantsDataForModel,
                parsedDeviceSpecificSpecs || {}
            );

            res.status(201).json({
                success: true,
                message: 'Thêm sản phẩm và các phiên bản thành công!',
                data: {
                    product_id: newProductId,
                    product_level_image_urls: productLevelImageUrls,
                    variants_created: variantsDataForModel.map(v => ({ sku: v.sku, imageUrls: v.imageUrls }))
                }
            });
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm:', error);

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Dữ liệu bị trùng (SKU hoặc ràng buộc unique ảnh chính). Vui lòng kiểm tra lại SKU và cấu trúc index bảng product_images.'
                });
            }

            if (error.code === 'ER_BAD_FIELD_ERROR') {
                return res.status(400).json({
                    success: false,
                    message: 'Cấu trúc cột trong database chưa khớp với code hiện tại.',
                    error: error.message
                });
            }

            if (error.code === 'ER_BAD_NULL_ERROR') {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu bắt buộc đang bị null khi lưu vào database.',
                    error: error.message
                });
            }

            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu tham chiếu không tồn tại (brand/category hoặc foreign key liên quan).'
                });
            }

            if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
                return res.status(400).json({
                    success: false,
                    message: 'Giá trị truyền vào không đúng định dạng cột trong database.',
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ nội bộ',
                error_code: error.code || null,
                error: error.sqlMessage || error.message || null
            });
        }
    },

    /**
     * API: Cập nhật sản phẩm (PUT /api/products/:productId)
     * Rất phức tạp: Cập nhật thông tin sản phẩm, thông số kỹ thuật chung,
     * Thêm/Xóa/Cập nhật ảnh cấp sản phẩm, và Thêm/Xóa/Cập nhật từng variant kèm ảnh của chúng.
     */
    updateProduct: async (req, res) => {
        try {
            const { productId } = req.params;
            const actingUser = req.user;

            // Validate productId
            if (!isValidId(productId)) {
                return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ.' });
            }

            const existingProduct = await Product.getById(productId);
            if (!existingProduct) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại!' });
            }

            const existingScope = detectScopeFromProduct({
                deviceType: existingProduct.device_type,
                categoryName: existingProduct.category_name
            });

            const {
                product_name, brand_id, category_id, device_type, description_html, highlight_features,
                screen_size, weight_kg, os,
                battery_capacity_mah, refresh_rate_hz, charging_port, connectivity, water_resistance, sensors, speaker_type,
                device_specific_specs,
                delete_image_ids: deleteImageIdsString,
                primary_product_image_id,
                variants_to_update: variantsToUpdateString,
                variants_to_create: variantsToCreateString
            } = req.body;

            let parsedDeviceSpecificSpecs;
            try {
                parsedDeviceSpecificSpecs = parseOptionalJsonObject(device_specific_specs);
            } catch {
                return res.status(400).json({ success: false, message: 'device_specific_specs phải là JSON object hợp lệ.' });
            }

            // 1. Validate Product Data
            const productErrors = validateProductData({ product_name, brand_id, category_id, device_type, description_html, highlight_features }, true);
            if (productErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu sản phẩm', errors: productErrors });
            }

            // 2. Validate Product Specs Data
            const specErrors = validateProductSpecData({
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
            }, true);
            if (specErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu thông số kỹ thuật chung', errors: specErrors });
            }

            // 3. Validate Brand and Category IDs if provided
            if (brand_id !== undefined && !isValidId(brand_id)) {
                 return res.status(400).json({ success: false, message: 'ID thương hiệu không hợp lệ.' });
            }
            if (category_id !== undefined && !isValidId(category_id)) {
                return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ.' });
            }

            if (brand_id) {
                const brand = await Brand.getById(brand_id);
                if (!brand) {
                    return res.status(404).json({ success: false, message: 'Thương hiệu không tồn tại.' });
                }
            }
            let nextCategoryName = existingProduct.category_name;
            if (category_id) {
                const category = await ProductCategory.getById(category_id);
                if (!category) {
                    return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
                }
                nextCategoryName = category.category_name;
            }

            const nextDeviceType = device_type ? String(device_type).trim().toUpperCase() : existingProduct.device_type;
            const nextScope = detectScopeFromProduct({
                deviceType: nextDeviceType,
                categoryName: nextCategoryName
            });

            const access = checkScopeMutationAccess({
                user: actingUser,
                targetScope: existingScope || nextScope,
                actionLabel: 'thao tác'
            });
            if (!access.allowed) {
                return res.status(403).json({ success: false, message: access.message });
            }

            const productData = {
                product_name,
                brand_id: brand_id ? parseInt(brand_id) : undefined,
                category_id: category_id ? parseInt(category_id) : undefined,
                device_type: device_type ? String(device_type).trim().toUpperCase() : undefined,
                description_html,
                highlight_features
            };

            const specData = {
                screen_size: screen_size ? parseFloat(screen_size) : undefined,
                weight_kg: weight_kg ? parseFloat(weight_kg) : undefined,
                os,
                battery_capacity_mah: battery_capacity_mah ? parseInt(battery_capacity_mah) : undefined,
                refresh_rate_hz: refresh_rate_hz ? parseInt(refresh_rate_hz) : undefined,
                charging_port,
                connectivity,
                water_resistance,
                sensors,
                speaker_type,
                device_specific_specs: parsedDeviceSpecificSpecs
            };

            // Lọc bỏ các trường undefined
            Object.keys(productData).forEach(key => productData[key] === undefined && delete productData[key]);
            Object.keys(specData).forEach(key => specData[key] === undefined && delete specData[key]);

            // Xử lý mảng ID ảnh cần xóa
            let deleteImageIds = [];
            if (deleteImageIdsString) {
                try {
                    deleteImageIds = JSON.parse(deleteImageIdsString).map(id => parseInt(id));
                    if (deleteImageIds.some(id => !isValidId(id))) {
                        return res.status(400).json({ success: false, message: 'ID ảnh cần xóa không hợp lệ.' });
                    }
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Định dạng delete_image_ids không hợp lệ.' });
                }
            }
            if (primary_product_image_id && !isValidId(primary_product_image_id)) {
                 return res.status(400).json({ success: false, message: 'ID ảnh chính cấp sản phẩm không hợp lệ.' });
            }


            const newProductLevelImageUrls = req.files && req.files['newProductImages']
                ? req.files['newProductImages'].map(toStoredImageUrl).filter(Boolean)
                : [];

            let variantsToUpdate = [];
            if (variantsToUpdateString) {
                try {
                    const parsedVariants = JSON.parse(variantsToUpdateString);
                    for (const [index, variant] of parsedVariants.entries()) {
                        if (!isValidId(variant.variant_id)) {
                            return res.status(400).json({ success: false, message: `Phiên bản cập nhật #${index + 1} có ID không hợp lệ.` });
                        }
                        const variantErrors = validateVariantData(variant.data, true);
                        if (variantErrors.length > 0) {
                            return res.status(400).json({ success: false, message: `Lỗi dữ liệu phiên bản cập nhật #${index + 1}`, errors: variantErrors });
                        }

                        const newVariantImageUrls = req.files && req.files[`newVariant_${index}_images_update`]
                            ? req.files[`newVariant_${index}_images_update`].map(toStoredImageUrl).filter(Boolean)
                            : [];
                        let deleteVariantImageIds = [];
                        if (variant.delete_image_ids) {
                            try {
                                deleteVariantImageIds = variant.delete_image_ids.map(id => parseInt(id));
                                if (deleteVariantImageIds.some(id => !isValidId(id))) {
                                     return res.status(400).json({ success: false, message: `Phiên bản cập nhật #${index + 1} có ID ảnh cần xóa không hợp lệ.` });
                                }
                            } catch (e) {
                                return res.status(400).json({ success: false, message: `Định dạng delete_image_ids của phiên bản cập nhật #${index + 1} không hợp lệ.` });
                            }
                        }
                        if (variant.primary_image_id && !isValidId(variant.primary_image_id)) {
                             return res.status(400).json({ success: false, message: `Phiên bản cập nhật #${index + 1} có ID ảnh chính không hợp lệ.` });
                        }

                        variantsToUpdate.push({
                            variant_id: parseInt(variant.variant_id),
                            data: {
                                sku: variant.data.sku,
                                cpu_name: variant.data.cpu_name,
                                cpu_benchmark_score: variant.data.cpu_benchmark_score ? parseInt(variant.data.cpu_benchmark_score) : undefined,
                                gpu: variant.data.gpu,
                                ram_gb: variant.data.ram_gb ? parseInt(variant.data.ram_gb) : undefined,
                                ram_type: variant.data.ram_type,
                                storage_gb: variant.data.storage_gb ? parseInt(variant.data.storage_gb) : undefined,
                                color_name: variant.data.color_name,
                                original_price: variant.data.original_price ? parseFloat(variant.data.original_price) : undefined,
                                discount_price: variant.data.discount_price ? parseFloat(variant.data.discount_price) : null,
                                stock_quantity: variant.data.stock_quantity ? parseInt(variant.data.stock_quantity) : undefined,
                                status: variant.data.status,
                                extra_specs_json: variant.data.extra_specs_json || undefined
                            },
                            newImageUrls: newVariantImageUrls,
                            deleteImageIds: deleteVariantImageIds,
                            primaryImageId: variant.primary_image_id ? parseInt(variant.primary_image_id) : undefined
                        });
                    }
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Định dạng variants_to_update không hợp lệ.' });
                }
            }

            let variantsToCreate = [];
            if (variantsToCreateString) {
                try {
                    const parsedVariants = JSON.parse(variantsToCreateString);
                    for (const [index, variant] of parsedVariants.entries()) {
                        const variantErrors = validateVariantData(variant);
                        if (variantErrors.length > 0) {
                            return res.status(400).json({ success: false, message: `Lỗi dữ liệu phiên bản tạo mới #${index + 1}`, errors: variantErrors });
                        }
                        const newVariantImageUrls = req.files && req.files[`newVariant_${index}_images_create`]
                            ? req.files[`newVariant_${index}_images_create`].map(toStoredImageUrl).filter(Boolean)
                            : [];
                        if (newVariantImageUrls.length === 0) {
                            return res.status(400).json({ success: false, message: `Phiên bản tạo mới #${index + 1} yêu cầu ít nhất một ảnh.` });
                        }
                        variantsToCreate.push({
                            sku: variant.sku,
                            cpu_name: variant.cpu_name || null,
                            cpu_benchmark_score: variant.cpu_benchmark_score ? parseInt(variant.cpu_benchmark_score) : null,
                            gpu: variant.gpu || null,
                            ram_gb: parseInt(variant.ram_gb),
                            ram_type: variant.ram_type || null,
                            storage_gb: parseInt(variant.storage_gb),
                            color_name: variant.color_name,
                            original_price: parseFloat(variant.original_price),
                            discount_price: variant.discount_price ? parseFloat(variant.discount_price) : null,
                            stock_quantity: variant.stock_quantity ? parseInt(variant.stock_quantity) : 0,
                            status: variant.status || 'IN_STOCK',
                            extra_specs_json: variant.extra_specs_json || null,
                            imageUrls: newVariantImageUrls
                        });
                    }
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Định dạng variants_to_create không hợp lệ.' });
                }
            }

            const affectedRows = await Product.update(
                productId,
                productData,
                specData,
                newProductLevelImageUrls,
                deleteImageIds,
                primary_product_image_id ? parseInt(primary_product_image_id) : undefined,
                variantsToUpdate,
                variantsToCreate
            );

            if (affectedRows === 0 && newProductLevelImageUrls.length === 0 && deleteImageIds.length === 0 && variantsToUpdate.length === 0 && variantsToCreate.length === 0) {
                 return res.status(400).json({ success: false, message: 'Không có trường nào được cập nhật hoặc không có thay đổi về hình ảnh/phiên bản.' });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật sản phẩm thành công!',
                data: { affected_rows: affectedRows }
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    // API: Xóa sản phẩm, đặt trạng thái TẤT CẢ variants của sản phẩm thành "DISCONTINUED" (DELETE /api/products/:id)
    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            // Validate id
            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ.' });
            }

            const newStatus = 'DISCONTINUED';

            const existingProduct = await Product.getById(id);
            if (!existingProduct) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại để cập nhật trạng thái!' });
            }

            const targetScope = detectScopeFromProduct({
                deviceType: existingProduct.device_type,
                categoryName: existingProduct.category_name
            });
            const access = checkScopeMutationAccess({ user: req.user, targetScope, actionLabel: 'thao tác' });
            if (!access.allowed) {
                return res.status(403).json({ success: false, message: access.message });
            }

            const affectedRows = await Product.updateProductVariantsStatus(id, newStatus);

            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không thể cập nhật trạng thái các phiên bản sản phẩm. Có thể trạng thái đã là DISCONTINUED hoặc không có phiên bản nào tồn tại.' });
            }

            res.status(200).json({
                success: true,
                message: `Trạng thái TẤT CẢ phiên bản của sản phẩm ID ${id} đã được cập nhật thành "${newStatus}" thành công!`,
                data: {
                    product_id: id,
                    new_status_for_variants: newStatus,
                    variants_affected: affectedRows
                }
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = productController;