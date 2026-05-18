const db = require('../config/db');
const { getSafeSort } = require('../helpers/queryHelper');
const { VALID_STATUSES } = require('../helpers/productValidationHelper');
const User = require('./userModel');

const DEVICE_SPEC_TABLES = {
    PHONE: 'phone_specifications',
    TABLET: 'tablet_specifications',
    WATCH: 'watch_specifications',
    AUDIO: 'audio_specifications',
    ACCESSORY: 'accessory_specifications'
};

const DEVICE_SPEC_FIELDS = {
    PHONE: ['chipset', 'sim_type', 'front_camera_mp', 'rear_camera_mp', 'network_support'],
    TABLET: ['chipset', 'stylus_support', 'keyboard_support', 'network_support'],
    WATCH: ['compatible_os', 'strap_material', 'health_tracking_features', 'gps_supported'],
    AUDIO: ['audio_type', 'bluetooth_version', 'anc_supported', 'battery_life_hours'],
    ACCESSORY: ['accessory_type', 'compatibility', 'warranty_months', 'material']
};

const normalizeDeviceType = (deviceType) => String(deviceType || '').trim().toUpperCase();

const upsertDeviceSpecificSpecs = async (connection, productId, deviceType, specs = {}) => {
    const normalizedType = normalizeDeviceType(deviceType);
    const tableName = DEVICE_SPEC_TABLES[normalizedType];
    const allowedFields = DEVICE_SPEC_FIELDS[normalizedType] || [];

    if (!tableName || !specs || typeof specs !== 'object' || Array.isArray(specs)) {
        return;
    }

    const filteredEntries = Object.entries(specs).filter(([key, value]) => allowedFields.includes(key) && value !== undefined);
    if (filteredEntries.length === 0) {
        return;
    }

    const [existingRows] = await connection.query(`SELECT product_id FROM ${tableName} WHERE product_id = ? LIMIT 1`, [productId]);
    if (existingRows.length > 0) {
        const setClause = filteredEntries.map(([key]) => `${key} = ?`).join(', ');
        const values = filteredEntries.map(([, value]) => value);
        values.push(productId);
        await connection.query(`UPDATE ${tableName} SET ${setClause} WHERE product_id = ?`, values);
        return;
    }

    const columns = filteredEntries.map(([key]) => key);
    const placeholders = columns.map(() => '?').join(', ');
    const values = filteredEntries.map(([, value]) => value);
    await connection.query(
        `INSERT INTO ${tableName} (product_id, ${columns.join(', ')}) VALUES (?, ${placeholders})`,
        [productId, ...values]
    );
};

const getDeviceSpecificSpecs = async (connection, productId, deviceType) => {
    const normalizedType = normalizeDeviceType(deviceType);
    const tableName = DEVICE_SPEC_TABLES[normalizedType];
    const allowedFields = DEVICE_SPEC_FIELDS[normalizedType] || [];

    if (!tableName) {
        return null;
    }

    const selectedFields = allowedFields.join(', ');
    const [rows] = await connection.query(`SELECT ${selectedFields} FROM ${tableName} WHERE product_id = ? LIMIT 1`, [productId]);
    return rows[0] || null;
};

const Product = {
    /**
     * Lấy tất cả sản phẩm với tùy chọn lọc, sắp xếp và phân trang.
     * @param {Object} options - Các tùy chọn lọc, sắp xếp, phân trang.
     * @param {string} options.search - Từ khóa tìm kiếm trong tên sản phẩm.
     * @param {number} options.categoryId - Lọc theo ID danh mục.
     * @param {number} options.brandId - Lọc theo ID thương hiệu.
     * @param {string} options.minPrice - Giá tối thiểu.
     * @param {string} options.maxPrice - Giá tối đa.
     * @param {string} options.sortBy - Trường sắp xếp (e.g., 'price', 'created_at', 'name').
     * @param {'ASC'|'DESC'} options.sortOrder - Thứ tự sắp xếp.
     * @param {number} options.limit - Số lượng sản phẩm trên mỗi trang.
     * @param {number} options.offset - Vị trí bắt đầu lấy sản phẩm (để phân trang).
     * @returns {Promise<Array>} Danh sách sản phẩm.
     */
    getAll: async (options = {}) => {
        let query = `
            SELECT
                p.product_id,
                p.product_name,
                p.device_type,
                p.description_html,
                p.highlight_features,
                b.brand_name,
                c.category_name,
                ps.screen_size,
                ps.weight_kg,
                ps.os,
                ps.battery_capacity_mah,
                ps.refresh_rate_hz,
                ps.charging_port,
                ps.connectivity,
                ps.water_resistance,
                ps.sensors,
                ps.speaker_type,
                MIN(CASE WHEN pv.discount_price IS NOT NULL THEN pv.discount_price ELSE pv.original_price END) AS min_price,
                MAX(CASE WHEN pv.discount_price IS NOT NULL THEN pv.discount_price ELSE pv.original_price END) AS max_price,
                SUM(pv.stock_quantity) AS total_stock_quantity,
                (
                    SELECT image_url
                    FROM product_images
                    WHERE product_id = p.product_id AND variant_id IS NULL AND is_primary = TRUE
                    LIMIT 1
                ) AS primary_product_image_url,
                (
                    SELECT pv2.cpu_name
                    FROM product_variants pv2
                    WHERE pv2.product_id = p.product_id
                    ORDER BY (pv2.discount_price IS NULL), pv2.discount_price, pv2.original_price ASC
                    LIMIT 1
                ) AS representative_cpu_name,
                (
                    SELECT pv3.gpu
                    FROM product_variants pv3
                    WHERE pv3.product_id = p.product_id
                    ORDER BY (pv3.discount_price IS NULL), pv3.discount_price, pv3.original_price ASC
                    LIMIT 1
                ) AS representative_gpu,
                (
                    SELECT pv4.ram_gb
                    FROM product_variants pv4
                    WHERE pv4.product_id = p.product_id
                    ORDER BY (pv4.discount_price IS NULL), pv4.discount_price, pv4.original_price ASC
                    LIMIT 1
                ) AS representative_ram_gb,
                (
                    SELECT pv5.storage_gb
                    FROM product_variants pv5
                    WHERE pv5.product_id = p.product_id
                    ORDER BY (pv5.discount_price IS NULL), pv5.discount_price, pv5.original_price ASC
                    LIMIT 1
                ) AS representative_storage_gb,
                (
                    SELECT pv6.original_price
                    FROM product_variants pv6
                    WHERE pv6.product_id = p.product_id
                    ORDER BY (pv6.discount_price IS NULL), pv6.discount_price, pv6.original_price ASC
                    LIMIT 1
                ) AS representative_original_price,
                (
                    SELECT pv7.discount_price
                    FROM product_variants pv7
                    WHERE pv7.product_id = p.product_id
                    ORDER BY (pv7.discount_price IS NULL), pv7.discount_price, pv7.original_price ASC
                    LIMIT 1
                ) AS representative_discount_price
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_specifications ps ON p.product_id = ps.product_id
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            WHERE 1=1
        `;
        const values = [];

        // Lọc theo từ khóa tìm kiếm
        if (options.search) {
            query += ` AND p.product_name LIKE ?`;
            values.push(`%${options.search}%`);
        }

        // Lọc theo danh mục
        if (options.categoryId) {
            query += ` AND p.category_id = ?`;
            values.push(options.categoryId);
        }

        if (options.deviceType) {
            query += ` AND UPPER(TRIM(p.device_type)) = ?`;
            values.push(String(options.deviceType).trim().toUpperCase());
        }

        // Lọc theo thương hiệu
        if (options.brandId) {
            query += ` AND p.brand_id = ?`;
            values.push(options.brandId);
        }
        
        // Lọc theo trạng thái (ít nhất một variant có trạng thái này)
        if (options.status && VALID_STATUSES.includes(options.status.toUpperCase())) {
            query += ` AND pv.status = ?`;
            values.push(options.status.toUpperCase());
        }

        query += ` GROUP BY p.product_id`; // Group lại để tính MIN/MAX/SUM

        // Lọc theo giá (sau GROUP BY) - Cần HAVING
        if (options.minPrice) {
            query += ` HAVING min_price >= ?`;
            values.push(options.minPrice);
        }
        if (options.maxPrice) {
            // Nếu đã có HAVING, dùng AND
            if (options.minPrice) {
                 query += ` AND max_price <= ?`;
            } else {
                 query += ` HAVING max_price <= ?`;
            }
            values.push(options.maxPrice);
        }

        // Sắp xếp an toàn
        const allowedSortFields = {
            'price': 'min_price',
            'name': 'p.product_name',
            'created_at': 'p.created_at'
        };
        const { safeSortBy, safeSortOrder } = getSafeSort(options.sortBy, options.sortOrder, allowedSortFields, 'p.created_at');
        query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

        // Phân trang
        if (options.limit) {
            query += ` LIMIT ?`;
            values.push(options.limit);
            if (options.offset) {
                query += ` OFFSET ?`;
                values.push(options.offset);
            }
        }

        const [rows] = await db.query(query, values);
        return rows;
    },

    getSearchSuggestions: async (keyword, productLimit = 5, categoryLimit = 5) => {
        const like = `%${String(keyword || '').trim()}%`;

        const categoriesQuery = `
            SELECT
                c.category_id,
                c.category_name,
                COUNT(p.product_id) AS product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.category_id
            WHERE c.category_name LIKE ?
            GROUP BY c.category_id, c.category_name
            ORDER BY product_count DESC, c.category_name ASC
            LIMIT ?
        `;

        const productsQuery = `
            SELECT
                p.product_id,
                p.product_name,
                p.device_type,
                c.category_id,
                c.category_name,
                MIN(CASE WHEN pv.discount_price IS NOT NULL THEN pv.discount_price ELSE pv.original_price END) AS current_price,
                MIN(pv.original_price) AS original_price,
                (
                    SELECT pi.image_url
                    FROM product_images pi
                    WHERE pi.product_id = p.product_id
                    ORDER BY pi.is_primary DESC, pi.image_id ASC
                    LIMIT 1
                ) AS image_url
            FROM products p
            LEFT JOIN categories c ON c.category_id = p.category_id
            LEFT JOIN product_variants pv ON pv.product_id = p.product_id
            WHERE p.product_name LIKE ?
            GROUP BY p.product_id, p.product_name, c.category_id, c.category_name
            ORDER BY p.created_at DESC
            LIMIT ?
        `;

        const [categories] = await db.query(categoriesQuery, [like, Number(categoryLimit) || 5]);
        const [products] = await db.query(productsQuery, [like, Number(productLimit) || 5]);

        return { categories, products };
    },

    /**
     * Lấy tổng số lượng sản phẩm dựa trên các bộ lọc (dùng cho phân trang).
     * @param {Object} options - Các tùy chọn lọc.
     * @returns {Promise<number>} Tổng số sản phẩm.
     */
    getTotalCount: async (options = {}) => {
        let query = `
            SELECT COUNT(DISTINCT p.product_id) AS total_count
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            WHERE 1=1
        `;
        const values = [];

        if (options.search) {
            query += ` AND p.product_name LIKE ?`;
            values.push(`%${options.search}%`);
        }
        if (options.categoryId) {
            query += ` AND p.category_id = ?`;
            values.push(options.categoryId);
        }
        if (options.deviceType) {
            query += ` AND UPPER(TRIM(p.device_type)) = ?`;
            values.push(String(options.deviceType).trim().toUpperCase());
        }
        if (options.brandId) {
            query += ` AND p.brand_id = ?`;
            values.push(options.brandId);
        }
        if (options.status && VALID_STATUSES.includes(options.status.toUpperCase())) {
            query += ` AND pv.status = ?`;
            values.push(options.status.toUpperCase());
        }

        // Cần GROUP BY và HAVING cho totalCount nếu lọc giá được áp dụng.
        // Đơn giản cho lọc giá
        if (options.minPrice || options.maxPrice) {
            let subQuery = `
                SELECT p.product_id, MIN(CASE WHEN pv.discount_price IS NOT NULL THEN pv.discount_price ELSE pv.original_price END) AS min_price,
                MAX(CASE WHEN pv.discount_price IS NOT NULL THEN pv.discount_price ELSE pv.original_price END) AS max_price
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN product_variants pv ON p.product_id = pv.product_id
                WHERE 1=1
                ${options.search ? ` AND p.product_name LIKE ?` : ''}
                ${options.categoryId ? ` AND p.category_id = ?` : ''}
                ${options.deviceType ? ` AND UPPER(TRIM(p.device_type)) = ?` : ''}
                ${options.brandId ? ` AND p.brand_id = ?` : ''}
                ${options.status && VALID_STATUSES.includes(options.status.toUpperCase()) ? ` AND pv.status = ?` : ''}
                GROUP BY p.product_id
            `;
            const subQueryValues = [];
            if (options.search) subQueryValues.push(`%${options.search}%`);
            if (options.categoryId) subQueryValues.push(options.categoryId);
            if (options.deviceType) subQueryValues.push(String(options.deviceType).trim().toUpperCase());
            if (options.brandId) subQueryValues.push(options.brandId);
            if (options.status && VALID_STATUSES.includes(options.status.toUpperCase())) subQueryValues.push(options.status.toUpperCase());

            let havingClause = '';
            if (options.minPrice) {
                havingClause += ` HAVING min_price >= ?`;
                subQueryValues.push(options.minPrice);
            }
            if (options.maxPrice) {
                if (options.minPrice) {
                    havingClause += ` AND max_price <= ?`;
                } else {
                    havingClause += ` HAVING max_price <= ?`;
                }
                subQueryValues.push(options.maxPrice);
            }
            
            query = `SELECT COUNT(*) AS total_count FROM (${subQuery} ${havingClause}) AS filtered_products`;
            const [rows] = await db.query(query, subQueryValues);
            return rows[0].total_count;

        } else {
            // Nếu không có lọc giá, dùng truy vấn đơn giản hơn
            const [rows] = await db.query(query, values);
            return rows[0].total_count;
        }
    },


    /**
     * Lấy thông tin chi tiết một sản phẩm theo ID, bao gồm thông số kỹ thuật chung,
     * tất cả các phiên bản (variants) của sản phẩm đó cùng với ảnh, và đánh giá.
     * @param {number} id - ID của sản phẩm.
     * @returns {Promise<Object|null>} Đối tượng sản phẩm hoặc null nếu không tìm thấy.
     */
    getById: async (id, requestingUserId = null, isAdmin = false) => { // Thêm requestingUserId, isAdmin
        // 1. Lấy thông tin sản phẩm chính, hãng, danh mục, specs chung và highlight features
        const productQuery = `
            SELECT
                p.product_id,
                p.product_name,
                p.device_type,
                p.description_html,
                p.highlight_features,
                p.created_at,
                b.brand_name,
                c.category_name,
                ps.screen_size,     -- Từ product_specifications
                ps.weight_kg,       -- Từ product_specifications
                ps.os,              -- Từ product_specifications
                ps.battery_capacity_mah,
                ps.refresh_rate_hz,
                ps.charging_port,
                ps.connectivity,
                ps.water_resistance,
                ps.sensors,
                ps.speaker_type,
                ps.extra_specs_json
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_specifications ps ON p.product_id = ps.product_id
            WHERE p.product_id = ?
        `;
        const [productRows] = await db.query(productQuery, [id]);

        if (productRows.length === 0) {
            return null; // Sản phẩm không tồn tại
        }

        const product = productRows[0];

        // 2. Lấy tất cả ảnh cấp sản phẩm (variant_id IS NULL)
        const [productImages] = await db.query(
            'SELECT image_id, image_url, is_primary FROM product_images WHERE product_id = ? AND variant_id IS NULL ORDER BY is_primary DESC, image_id ASC',
            [id]
        );
        product.images = productImages;

        // 3. Lấy tất cả các phiên bản (variants) của sản phẩm
        const [variants] = await db.query(
            `SELECT
                pv.variant_id,
                pv.sku,
                pv.cpu_name,
                pv.cpu_benchmark_score,
                pv.gpu,
                pv.ram_gb,
                pv.storage_gb,
                pv.color_name,
                pv.original_price,
                pv.discount_price,
                pv.stock_quantity,
                pv.status,
                pv.extra_specs_json
            FROM product_variants pv
            WHERE pv.product_id = ?
            ORDER BY pv.color_name ASC, pv.ram_gb ASC, pv.storage_gb ASC`,
            [id]
        );

        // 4. Với mỗi variant, lấy các ảnh liên quan
        for (const variant of variants) {
            const [variantImages] = await db.query(
                'SELECT image_id, image_url, is_primary FROM product_images WHERE variant_id = ? ORDER BY is_primary DESC, image_id ASC',
                [variant.variant_id]
            );
            variant.images = variantImages;
        }
        product.variants = variants;
        product.device_specific_specs = await getDeviceSpecificSpecs(db, id, product.device_type);


        // 5. Lấy danh sách đánh giá của sản phẩm, bao gồm tên người dùng
        let reviewQuery = `
            SELECT
                pr.review_id,
                pr.user_id,
                u.full_name AS reviewer_name,
                pr.rating,
                pr.content,
                pr.created_at,
                pr.status,
                pr.admin_deletion_reason
            FROM product_reviews pr
            JOIN users u ON pr.user_id = u.user_id
            WHERE pr.product_id = ?
        `;
        const reviewParams = [id];

        reviewQuery += ` AND (
                           pr.status = 'VISIBLE' `; // Luôn hiển thị nếu là VISIBLE

        if (isAdmin) {
            // Admin xem được cả VISIBLE và DELETED_BY_ADMIN
            reviewQuery += ` OR pr.status = 'DELETED_BY_ADMIN' `;
        }
        
        if (requestingUserId) {
            // Chính người đánh giá xem được đánh giá của mình dù bị xóa bởi user hay admin
            reviewQuery += ` OR (pr.user_id = ? AND (pr.status = 'DELETED_BY_USER' OR pr.status = 'DELETED_BY_ADMIN')) `;
            reviewParams.push(requestingUserId);
        }

        reviewQuery += ` ) ORDER BY pr.created_at DESC`; // Đóng ngoặc của điều kiện OR lớn

        const [reviewRows] = await db.query(reviewQuery, reviewParams);
        
        // Lấy ảnh cho từng review và tính rating trung bình
        let totalRating = 0;
        let visibleReviewCount = 0;
        for (const review of reviewRows) {
            const [reviewImages] = await db.query(
                'SELECT review_image_id, image_url FROM review_images WHERE review_id = ?',
                [review.review_id]
            );
            review.images = reviewImages;

            if (review.status === 'VISIBLE') {
                totalRating += review.rating;
                visibleReviewCount++;
            }
        }
        product.reviews = reviewRows;
        product.average_rating = visibleReviewCount > 0 ? (totalRating / visibleReviewCount).toFixed(1) : 0; // Tính rating trung bình
        product.total_visible_reviews = visibleReviewCount; // Tổng số review hiển thị

        return product;
    },

    /**
     * Thêm mới một sản phẩm vào cơ sở dữ liệu, bao gồm specs chung, variants và ảnh.
     * @param {Object} productData - Dữ liệu của sản phẩm (product_name, brand_id, category_id, description_html, highlight_features).
     * @param {Object} specData - Dữ liệu thông số kỹ thuật chung (screen_size, weight_kg, os).
     * @param {Array<string>} productLevelImageUrls - Mảng các URL hình ảnh cấp sản phẩm.
     * @param {Array<Object>} variantsData - Mảng các đối tượng variant, mỗi đối tượng bao gồm data variant và imageUrls.
     *   variant = { sku, cpu_name, cpu_benchmark_score, gpu, ram_gb, storage_gb, color_name, original_price, discount_price, stock_quantity, status, imageUrls: [] }
     * @returns {Promise<number>} ID của sản phẩm vừa được thêm.
     */
    create: async (productData, specData, productLevelImageUrls = [], variantsData = [], deviceSpecificSpecs = {}) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Thêm sản phẩm chính
            const productInsertQuery = `
                INSERT INTO products
                (product_name, brand_id, category_id, device_type, description_html, highlight_features, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const productValues = [
                productData.product_name,
                productData.brand_id,
                productData.category_id,
                productData.device_type || 'LAPTOP',
                productData.description_html || null,
                productData.highlight_features || null,
                productData.created_by || null
            ];
            const [productResult] = await connection.query(productInsertQuery, productValues);
            const newProductId = productResult.insertId;

            // 2. Thêm thông số kỹ thuật chung (product_specifications)
            if (specData && Object.keys(specData).length > 0) {
                const specInsertQuery = `
                    INSERT INTO product_specifications
                    (product_id, screen_size, weight_kg, os, battery_capacity_mah, refresh_rate_hz, charging_port, connectivity, water_resistance, sensors, speaker_type, extra_specs_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const specValues = [
                    newProductId,
                    specData.screen_size || null,
                    specData.weight_kg || null,
                    specData.os || null,
                    specData.battery_capacity_mah || null,
                    specData.refresh_rate_hz || null,
                    specData.charging_port || null,
                    specData.connectivity || null,
                    specData.water_resistance || null,
                    specData.sensors || null,
                    specData.speaker_type || null,
                    specData.extra_specs_json || null
                ];
                await connection.query(specInsertQuery, specValues);
            }

            await upsertDeviceSpecificSpecs(connection, newProductId, productData.device_type || 'LAPTOP', deviceSpecificSpecs);

            // 3. Thêm hình ảnh cấp sản phẩm
            if (productLevelImageUrls.length > 0) {
                const imageInsertQuery = `INSERT INTO product_images (product_id, variant_id, image_url, is_primary) VALUES (?, ?, ?, ?)`;
                for (let i = 0; i < productLevelImageUrls.length; i++) {
                    // Ảnh đầu tiên được đặt là chính ở cấp sản phẩm. 
                    // Duy trì chỉ một ảnh chính cấp sản phẩm được quản lý bởi logic ứng dụng.
                    const isPrimary = (i === 0); // Ảnh đầu tiên là chính
                    await connection.query(imageInsertQuery, [newProductId, null, productLevelImageUrls[i], isPrimary]);
                }
            }

            // 4. Thêm các phiên bản (variants) và ảnh của từng variant
            const variantInsertQuery = `
                INSERT INTO product_variants
                (product_id, sku, cpu_name, cpu_benchmark_score, gpu, ram_gb, ram_type, storage_gb, color_name, original_price, discount_price, stock_quantity, status, extra_specs_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const variantImageInsertQuery = `INSERT INTO product_images (product_id, variant_id, image_url, is_primary) VALUES (?, ?, ?, ?)`;

            for (const variant of variantsData) {
                const variantValues = [
                    newProductId,
                    variant.sku,
                    variant.cpu_name || null,
                    variant.cpu_benchmark_score || null,
                    variant.gpu || null,
                    variant.ram_gb,
                    variant.ram_type || null,
                    variant.storage_gb,
                    variant.color_name,
                    variant.original_price,
                    variant.discount_price || null,
                    variant.stock_quantity || 0,
                    variant.status || 'IN_STOCK',
                    variant.extra_specs_json || null
                ];
                const [variantResult] = await connection.query(variantInsertQuery, variantValues);
                const newVariantId = variantResult.insertId;

                // Thêm ảnh cho variant này
                if (variant.imageUrls && variant.imageUrls.length > 0) {
                    const primaryImageUrl = variant.imageUrls[0]; // Ảnh đầu tiên là ảnh chính
                    // Thêm ảnh chính
                    await connection.query(variantImageInsertQuery, [newProductId, newVariantId, primaryImageUrl, true]);
                    // Thêm các ảnh phụ
                    for (let i = 1; i < variant.imageUrls.length; i++) {
                        await connection.query(variantImageInsertQuery, [newProductId, newVariantId, variant.imageUrls[i], false]);
                    }
                }
            }

            await connection.commit();
            return newProductId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Cập nhật thông tin một sản phẩm, specs chung, variants và ảnh.
     * @param {number} productId - ID của sản phẩm cần cập nhật.
     * @param {Object} productData - Dữ liệu sản phẩm cần cập nhật.
     * @param {Object} specData - Dữ liệu thông số kỹ thuật chung cần cập nhật.
     * @param {Array<string>} newProductLevelImageUrls - Mảng các URL hình ảnh cấp sản phẩm mới để thêm.
     * @param {Array<number>} deleteImageIds - Mảng các ID hình ảnh cũ cần xóa (cả sản phẩm và variant).
     * @param {number} primaryProductImageId - ID của ảnh cấp sản phẩm muốn đặt làm ảnh chính.
     * @param {Array<Object>} variantsToUpdate - Mảng các object { variant_id, data, newImageUrls, deleteImageIds, primaryImageId }.
     * @param {Array<Object>} variantsToCreate - Mảng các object { data, imageUrls }.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng (ít nhất là 1 nếu có thay đổi).
     */
    update: async (
        productId,
        productData,
        specData,
        newProductLevelImageUrls = [],
        deleteImageIds = [],
        primaryProductImageId,
        variantsToUpdate = [],
        variantsToCreate = []
    ) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            let affectedTotalRows = 0;

            // 1. Cập nhật thông tin sản phẩm
            const allowedProductFields = ['product_name', 'brand_id', 'category_id', 'device_type', 'description_html', 'highlight_features'];
            const productFieldsToUpdate = [];
            const productValues = [];

            allowedProductFields.forEach(field => {
                if (productData[field] !== undefined) {
                    productFieldsToUpdate.push(`${field} = ?`);
                    productValues.push(productData[field]);
                }
            });

            if (productFieldsToUpdate.length > 0) {
                const productUpdateQuery = `UPDATE products SET ${productFieldsToUpdate.join(', ')} WHERE product_id = ?`;
                productValues.push(productId);
                const [result] = await connection.query(productUpdateQuery, productValues);
                affectedTotalRows += result.affectedRows;
            }

            // 2. Cập nhật hoặc thêm thông số kỹ thuật chung (product_specifications)
            if (specData && Object.keys(specData).length > 0) {
                const [existingSpec] = await connection.query('SELECT spec_id FROM product_specifications WHERE product_id = ?', [productId]);
                if (existingSpec.length > 0) {
                    const allowedSpecFields = ['screen_size', 'weight_kg', 'os', 'battery_capacity_mah', 'refresh_rate_hz', 'charging_port', 'connectivity', 'water_resistance', 'sensors', 'speaker_type', 'extra_specs_json'];
                    const specFieldsToUpdate = [];
                    const specValues = [];

                    allowedSpecFields.forEach(field => {
                        if (specData[field] !== undefined) {
                            specFieldsToUpdate.push(`${field} = ?`);
                            specValues.push(specData[field]);
                        }
                    });

                    if (specFieldsToUpdate.length > 0) {
                        const specUpdateQuery = `UPDATE product_specifications SET ${specFieldsToUpdate.join(', ')} WHERE product_id = ?`;
                        specValues.push(productId);
                        const [result] = await connection.query(specUpdateQuery, specValues);
                        affectedTotalRows += result.affectedRows;
                    }
                } else {
                    const specInsertQuery = `
                        INSERT INTO product_specifications
                        (product_id, screen_size, weight_kg, os, battery_capacity_mah, refresh_rate_hz, charging_port, connectivity, water_resistance, sensors, speaker_type, extra_specs_json)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    const insertSpecValues = [
                        productId,
                        specData.screen_size || null,
                        specData.weight_kg || null,
                        specData.os || null,
                        specData.battery_capacity_mah || null,
                        specData.refresh_rate_hz || null,
                        specData.charging_port || null,
                        specData.connectivity || null,
                        specData.water_resistance || null,
                        specData.sensors || null,
                        specData.speaker_type || null,
                        specData.extra_specs_json || null
                    ];
                    const [result] = await connection.query(specInsertQuery, insertSpecValues);
                    affectedTotalRows += result.affectedRows;
                }
            }


            // 3. Xóa hình ảnh cũ (cả cấp sản phẩm và cấp variant)
            if (deleteImageIds && deleteImageIds.length > 0) {
                const deleteImageQuery = 'DELETE FROM product_images WHERE image_id IN (?) AND (product_id = ? OR variant_id IN (SELECT variant_id FROM product_variants WHERE product_id = ?))';
                const [result] = await connection.query(deleteImageQuery, [deleteImageIds, productId, productId]);
                affectedTotalRows += result.affectedRows;
            }

            // 4. Thêm hình ảnh cấp sản phẩm mới
            if (newProductLevelImageUrls.length > 0) {
                const imageInsertQuery = 'INSERT INTO product_images (product_id, variant_id, image_url, is_primary) VALUES (?, ?, ?, ?)';
                for (const url of newProductLevelImageUrls) {
                    const [result] = await connection.query(imageInsertQuery, [productId, null, url, false]);
                    affectedTotalRows += result.affectedRows;
                }
            }
            
            // 5. Cập nhật ảnh chính cấp sản phẩm
            if (primaryProductImageId) {
                // Đặt tất cả ảnh cấp sản phẩm về không chính trước khi đặt ảnh mới là chính
                // Logic này do ứng dụng quản lý, không có UNIQUE constraint ở DB cho ảnh cấp sản phẩm
                await connection.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = ? AND variant_id IS NULL', [productId]);
                const [result] = await connection.query('UPDATE product_images SET is_primary = TRUE WHERE image_id = ? AND product_id = ? AND variant_id IS NULL', [primaryProductImageId, productId]);
                affectedTotalRows += result.affectedRows;
            } else if (newProductLevelImageUrls.length > 0) {
                // Nếu không có ảnh chính sản phẩm được chỉ định nhưng có ảnh mới, và hiện không có ảnh chính cấp sản phẩm nào, đặt ảnh đầu tiên trong số các ảnh cấp sản phẩm còn lại làm chính.
                const [currentPrimary] = await connection.query('SELECT image_id FROM product_images WHERE product_id = ? AND variant_id IS NULL AND is_primary = TRUE', [productId]);
                if (currentPrimary.length === 0) {
                    const [anyImage] = await connection.query('SELECT image_id FROM product_images WHERE product_id = ? AND variant_id IS NULL LIMIT 1', [productId]);
                    if (anyImage.length > 0) {
                        const [result] = await connection.query('UPDATE product_images SET is_primary = TRUE WHERE image_id = ?', [anyImage[0].image_id]);
                        affectedTotalRows += result.affectedRows;
                    }
                }
            }

            // 6. Cập nhật các variants hiện có
            for (const variantUpdate of variantsToUpdate) {
                const variantId = variantUpdate.variant_id;
                const variantData = variantUpdate.data;
                const newVariantImageUrls = variantUpdate.newImageUrls || [];
                const deleteVariantImageIds = variantUpdate.deleteImageIds || [];
                const primaryVariantImageId = variantUpdate.primaryImageId;

                const allowedVariantFields = ['sku', 'cpu_name', 'cpu_benchmark_score', 'gpu', 'ram_gb', 'ram_type', 'storage_gb', 'color_name', 'original_price', 'discount_price', 'stock_quantity', 'status', 'extra_specs_json'];
                const variantFieldsToUpdate = [];
                const variantValues = [];

                allowedVariantFields.forEach(field => {
                    if (variantData[field] !== undefined) {
                        variantFieldsToUpdate.push(`${field} = ?`);
                        variantValues.push(variantData[field]);
                    }
                });

                if (variantFieldsToUpdate.length > 0) {
                    const variantUpdateQuery = `UPDATE product_variants SET ${variantFieldsToUpdate.join(', ')} WHERE variant_id = ? AND product_id = ?`;
                    variantValues.push(variantId, productId);
                    const [result] = await connection.query(variantUpdateQuery, variantValues);
                    affectedTotalRows += result.affectedRows;
                }

                // Xóa ảnh variant cũ
                if (deleteVariantImageIds.length > 0) {
                    const deleteImageQuery = 'DELETE FROM product_images WHERE image_id IN (?) AND variant_id = ? AND product_id = ?';
                    const [result] = await connection.query(deleteImageQuery, [deleteVariantImageIds, variantId, productId]);
                    affectedTotalRows += result.affectedRows;
                }

                // Thêm ảnh variant mới
                if (newVariantImageUrls.length > 0) {
                    const imageInsertQuery = 'INSERT INTO product_images (product_id, variant_id, image_url, is_primary) VALUES (?, ?, ?, ?)';
                    for (const url of newVariantImageUrls) {
                        // Ảnh mới được thêm vào sẽ là ảnh phụ (is_primary = FALSE)
                        const [result] = await connection.query(imageInsertQuery, [productId, variantId, url, false]);
                        affectedTotalRows += result.affectedRows;
                    }
                }

                // Cập nhật ảnh chính variant
                if (primaryVariantImageId) {
                    // Đặt tất cả ảnh của variant này về không chính
                    await connection.query('UPDATE product_images SET is_primary = FALSE WHERE variant_id = ?', [variantId]);
                    // Đặt ảnh được chỉ định làm chính
                    const [result] = await connection.query('UPDATE product_images SET is_primary = TRUE WHERE image_id = ? AND variant_id = ?', [primaryVariantImageId, variantId]);
                    affectedTotalRows += result.affectedRows;
                } else { // Nếu không có primaryVariantImageId được chỉ định
                    const [currentPrimary] = await connection.query('SELECT image_id FROM product_images WHERE variant_id = ? AND is_primary = TRUE', [variantId]);
                    if (currentPrimary.length === 0) { // Nếu hiện tại không có ảnh chính nào
                        // Tìm một ảnh bất kỳ (ưu tiên ảnh mới nếu có, hoặc ảnh hiện có) và đặt làm chính
                        const [anyImage] = await connection.query('SELECT image_id FROM product_images WHERE variant_id = ? LIMIT 1', [variantId]);
                        if (anyImage.length > 0) {
                            const [result] = await connection.query('UPDATE product_images SET is_primary = TRUE WHERE image_id = ?', [anyImage[0].image_id]);
                            affectedTotalRows += result.affectedRows;
                        }
                    }
                }
            }

            // 7. Thêm các variants mới
            const variantInsertQuery = `
                INSERT INTO product_variants
                (product_id, sku, cpu_name, cpu_benchmark_score, gpu, ram_gb, ram_type, storage_gb, color_name, original_price, discount_price, stock_quantity, status, extra_specs_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const variantImageInsertQuery = `INSERT INTO product_images (product_id, variant_id, image_url, is_primary) VALUES (?, ?, ?, ?)`;

            for (const variant of variantsToCreate) {
                const variantValues = [
                    productId,
                    variant.sku,
                    variant.cpu_name || null,
                    variant.cpu_benchmark_score || null,
                    variant.gpu || null,
                    variant.ram_gb,
                    variant.ram_type || null,
                    variant.storage_gb,
                    variant.color_name,
                    variant.original_price,
                    variant.discount_price || null,
                    variant.stock_quantity || 0,
                    variant.status || 'IN_STOCK',
                    variant.extra_specs_json || null
                ];
                const [result] = await connection.query(variantInsertQuery, variantValues);
                const newVariantId = result.insertId;
                affectedTotalRows += result.affectedRows;

                if (variant.imageUrls && variant.imageUrls.length > 0) {
                    const primaryImageUrl = variant.imageUrls[0];
                    // Thêm ảnh chính cho variant mới
                    const [imgResultPrimary] = await connection.query(variantImageInsertQuery, [productId, newVariantId, primaryImageUrl, true]);
                    affectedTotalRows += imgResultPrimary.affectedRows;
                    // Thêm các ảnh phụ cho variant mới
                    for (let i = 1; i < variant.imageUrls.length; i++) {
                        const [imgResultSecondary] = await connection.query(variantImageInsertQuery, [productId, newVariantId, variant.imageUrls[i], false]);
                        affectedTotalRows += imgResultSecondary.affectedRows;
                    }
                }
            }

            const [currentDeviceTypeRows] = await connection.query('SELECT device_type FROM products WHERE product_id = ? LIMIT 1', [productId]);
            const effectiveDeviceType = normalizeDeviceType(productData.device_type || currentDeviceTypeRows[0]?.device_type || 'LAPTOP');
            await upsertDeviceSpecificSpecs(connection, productId, effectiveDeviceType, specData.device_specific_specs || {});

            await connection.commit();
            return affectedTotalRows;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Cập nhật trạng thái của TẤT CẢ variants của một sản phẩm.
     * @param {number} productId - ID của sản phẩm.
     * @param {string} newStatus - Trạng thái mới (ví dụ: 'IN_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED').
     * @returns {Promise<number>} Số dòng bị ảnh hưởng (số lượng variants).
     */
    updateProductVariantsStatus: async (productId, newStatus) => {
        const query = 'UPDATE product_variants SET status = ? WHERE product_id = ?';
        const [result] = await db.query(query, [newStatus, productId]);
        return result.affectedRows;
    },

    variantExists: async (variantId) => {
        const query = 'SELECT variant_id FROM product_variants WHERE variant_id = ?';
        const [rows] = await db.query(query, [variantId]);
        return rows.length > 0;
    },

    /**
     * Hàm xóa sản phẩm vật lý khỏi database.
     * Việc xóa sản phẩm sẽ CASCADE xóa các specs, variants và images liên quan.
     * @param {number} id - ID của sản phẩm cần xóa cứng.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng (0 hoặc 1).
     */
    hardDelete: async (id) => {
        const query = 'DELETE FROM products WHERE product_id = ?';
        const [result] = await db.query(query, [id]);
        return result.affectedRows;
    }
};

module.exports = Product;
