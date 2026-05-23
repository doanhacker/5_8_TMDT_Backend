/**
 * Parse và sanitize các query params phổ biến:
 * page, limit, search, sortBy, sortOrder, status
 * 
 * @param {Object} query        - req.query từ Express
 * @param {Object} options      - Tùy chỉnh cho từng route
 * @param {string} options.defaultSortBy     - Cột sort mặc định
 * @param {string} options.defaultSortOrder  - Chiều sort mặc định (ASC/DESC)
 * @param {number} options.defaultLimit      - Số items/page mặc định
 * @param {number} options.maxLimit          - Số items/page tối đa
 * @returns {Object} params đã được sanitize
 */
const parseQueryParams = (query, options = {}) => {
    const {
        defaultSortBy    = 'created_at',
        defaultSortOrder = 'DESC',
        defaultLimit     = 10,
        maxLimit         = 50
    } = options;

    // --- Pagination ---
    const page  = Math.max(1, parseInt(query.page)  || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));

    // --- Search: escape ký tự đặc biệt của LIKE → chống injection qua LIKE ---
    const rawSearch = query.search?.trim() || '';
    const search    = rawSearch.replace(/[%_\\]/g, '\\$&');

    // --- Sort (chưa validate whitelist ở đây, whitelist nằm ở Model) ---
    const sortBy    = query.sortBy?.trim()    || defaultSortBy;
    const sortOrder = query.sortOrder?.trim() || defaultSortOrder;

    // --- Status filter ---
    const status = query.status?.trim() || null;

    return { page, limit, search, sortBy, sortOrder, status };
};

/**
 * Validate và lấy giá trị sort an toàn từ whitelist
 * Dùng trong Model để chống SQL Injection cho ORDER BY
 * 
 * @param {string} sortBy           - Giá trị sortBy từ client
 * @param {string} sortOrder        - Giá trị sortOrder từ client  
 * @param {Object} allowedFields    - Whitelist các cột được phép sort
 * @param {string} defaultField     - Cột sort mặc định nếu không hợp lệ
 * @returns {{ safeSortBy, safeSortOrder }}
 */
const getSafeSort = (sortBy, sortOrder, allowedFields, defaultField) => {
    const ALLOWED_ORDERS = ['ASC', 'DESC'];

    const safeSortBy = allowedFields[sortBy] || defaultField;
    const safeSortOrder = ALLOWED_ORDERS.includes(sortOrder?.toUpperCase())
        ? sortOrder.toUpperCase()
        : 'DESC';

    return { safeSortBy, safeSortOrder };
};

/**
 * Tính OFFSET cho phân trang
 * 
 * @param {number} page
 * @param {number} limit
 * @returns {number} offset
 */
const getOffset = (page, limit) => (page - 1) * limit;

/**
 * Build response chuẩn cho danh sách có phân trang
 * 
 * @param {Array}  data     - Mảng dữ liệu
 * @param {number} total    - Tổng số records
 * @param {number} page
 * @param {number} limit
 * @returns {Object}
 */
const buildPaginationResult = (data, total, page, limit) => ({
    data,
    pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    }
});

module.exports = {
    parseQueryParams,
    getSafeSort,
    getOffset,
    buildPaginationResult
};