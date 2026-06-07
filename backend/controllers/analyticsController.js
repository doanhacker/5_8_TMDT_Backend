const db = require('../config/db');

const toNumber = (value) => Number(value || 0);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value) => DATE_PATTERN.test(String(value || '').trim());

const parseDateOnly = (value) => {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDateOnly = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const diffDaysInclusive = (dateFrom, dateTo) => {
    const start = parseDateOnly(dateFrom);
    const end = parseDateOnly(dateTo);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((end - start) / msPerDay) + 1;
};

const buildDailySeries = (dateFrom, dateTo, rowMap) => {
    const chartData = [];
    const cursor = parseDateOnly(dateFrom);
    const end = parseDateOnly(dateTo);

    while (cursor <= end) {
        const day = formatDateOnly(cursor);
        const current = rowMap.get(day) || {
            total_qty: 0,
            total_revenue: 0,
            order_count: 0,
        };

        chartData.push({
            day,
            total_revenue: toNumber(current.total_revenue),
            total_qty: toNumber(current.total_qty),
            order_count: toNumber(current.order_count),
        });

        cursor.setDate(cursor.getDate() + 1);
    }

    return chartData;
};

const resolveReportRange = (query) => {
    const range = String(query.range || 'current_month').toLowerCase();
    const now = new Date();

    if (range === 'custom') {
        const dateFrom = String(query.date_from || '').trim();
        const dateTo = String(query.date_to || '').trim();
        if (!isValidDateString(dateFrom) || !isValidDateString(dateTo)) {
            return { error: 'date_from và date_to phải có định dạng YYYY-MM-DD' };
        }
        if (parseDateOnly(dateFrom) > parseDateOnly(dateTo)) {
            return { error: 'date_from phải nhỏ hơn hoặc bằng date_to' };
        }
        if (diffDaysInclusive(dateFrom, dateTo) > 366) {
            return { error: 'Khoảng thời gian tối đa là 366 ngày' };
        }
        return {
            dateFrom,
            dateTo,
            label: `${dateFrom} → ${dateTo}`,
            days: diffDaysInclusive(dateFrom, dateTo),
        };
    }

    if (range === 'current_month') {
        const dateFrom = formatDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
        const dateTo = formatDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        return {
            dateFrom,
            dateTo,
            label: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`,
            days: diffDaysInclusive(dateFrom, dateTo),
        };
    }

    const dayMap = {
        last_7_days: 7,
        last_30_days: 30,
        last_90_days: 90,
    };
    const days = dayMap[range] || 30;
    const dateTo = formatDateOnly(now);
    const dateFrom = formatDateOnly(shiftDaysBy(days - 1, now));

    const labelMap = {
        last_7_days: '7 ngày gần nhất',
        last_30_days: '30 ngày gần nhất',
        last_90_days: '90 ngày gần nhất',
    };

    return {
        dateFrom,
        dateTo,
        label: labelMap[range] || `${days} ngày gần nhất`,
        days,
    };
};

const shiftDaysBy = (days, baseDate = new Date()) => {
    const next = new Date(baseDate);
    next.setDate(next.getDate() - days);
    return next;
};

const queryOverviewForRange = async (dateFrom, dateTo) => {
    const [[revenueRows], [orderStatusRows], [stockRows], [ratingRows]] = await Promise.all([
        db.query(
            `SELECT
                COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS total_revenue,
                COALESCE(AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS avg_order_value
             FROM orders
             WHERE DATE(order_date) BETWEEN ? AND ?`,
            [dateFrom, dateTo]
        ),
        db.query(
            `SELECT
                SUM(CASE WHEN status IN ('PENDING_CONFIRMATION', 'WAITING_FOR_STOCK', 'PROCESSING', 'SHIPPING') THEN 1 ELSE 0 END) AS orders_pending,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS orders_completed,
                SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS orders_cancelled,
                COUNT(*) AS total_orders
             FROM orders
             WHERE DATE(order_date) BETWEEN ? AND ?`,
            [dateFrom, dateTo]
        ),
        db.query(
            `SELECT
                SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 10 AND status = 'IN_STOCK' THEN 1 ELSE 0 END) AS low_stock_count,
                SUM(CASE WHEN stock_quantity <= 0 OR status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END) AS out_of_stock_count
             FROM product_variants`
        ),
        db.query(`SELECT COALESCE(AVG(rating), 0) AS avg_rating FROM product_reviews`),
    ]);

    const revenue = revenueRows[0] || {};
    const orderStatus = orderStatusRows[0] || {};
    const totalOrders = toNumber(orderStatus.total_orders);
    const ordersCancelled = toNumber(orderStatus.orders_cancelled);
    const cancelRate = totalOrders > 0
        ? Number(((ordersCancelled / totalOrders) * 100).toFixed(1))
        : 0;

    return {
        revenue_today: 0,
        revenue_month: toNumber(revenue.total_revenue),
        revenue_year: toNumber(revenue.total_revenue),
        orders_pending: toNumber(orderStatus.orders_pending),
        orders_completed: toNumber(orderStatus.orders_completed),
        orders_cancelled: ordersCancelled,
        cancel_rate: cancelRate,
        avg_order_value: toNumber(revenue.avg_order_value),
        total_customers: 0,
        new_customers_month: 0,
        low_stock_count: toNumber(stockRows[0]?.low_stock_count),
        out_of_stock_count: toNumber(stockRows[0]?.out_of_stock_count),
        avg_rating: Number(toNumber(ratingRows[0]?.avg_rating).toFixed(1)),
        total_revenue: toNumber(revenue.total_revenue),
    };
};

const queryRevenueChartForRange = async (dateFrom, dateTo) => {
    const [dailyRows] = await db.query(
        `SELECT
            DATE(o.order_date) AS day,
            COALESCE(SUM(o.total_amount), 0) AS revenue,
            COUNT(*) AS order_count,
            COALESCE(AVG(o.total_amount), 0) AS avg_order_value
         FROM orders o
         WHERE o.status = 'COMPLETED'
           AND DATE(o.order_date) BETWEEN ? AND ?
         GROUP BY DATE(o.order_date)
         ORDER BY day ASC`,
        [dateFrom, dateTo]
    );

    const normalizeDayValue = (value) => {
        if (value instanceof Date) return formatDateOnly(value);
        return String(value).slice(0, 10);
    };

    const rowMap = new Map(
        dailyRows.map((row) => [
            normalizeDayValue(row.day),
            {
                total_revenue: toNumber(row.revenue),
                total_qty: 0,
                order_count: toNumber(row.order_count),
            },
        ])
    );

    return buildDailySeries(dateFrom, dateTo, rowMap).map((item) => ({
        period_label: item.day.slice(5).replace('-', '/'),
        day: item.day,
        revenue: item.total_revenue,
        order_count: item.order_count,
        avg_order_value: item.total_revenue && item.order_count
            ? item.total_revenue / item.order_count
            : 0,
    }));
};

const queryTopProductsForRange = async (dateFrom, dateTo, limit = 10) => {
    const [rows] = await db.query(
        `SELECT
            p.product_id,
            p.product_name,
            COALESCE(SUM(od.quantity), 0) AS sold_qty,
            COALESCE(SUM(od.quantity * od.price_at_purchase), 0) AS revenue,
            COALESCE(stock.total_stock, 0) AS current_stock,
            CASE
                WHEN COALESCE(stock.total_stock, 0) <= 0 THEN 'OUT_OF_STOCK'
                WHEN COALESCE(stock.in_stock_variants, 0) > 0 THEN 'IN_STOCK'
                ELSE 'OUT_OF_STOCK'
            END AS status
         FROM order_details od
         INNER JOIN orders o ON o.order_id = od.order_id
         INNER JOIN product_variants pv ON pv.variant_id = od.variant_id
         INNER JOIN products p ON p.product_id = pv.product_id
         LEFT JOIN (
            SELECT
                product_id,
                SUM(stock_quantity) AS total_stock,
                SUM(CASE WHEN status = 'IN_STOCK' AND stock_quantity > 0 THEN 1 ELSE 0 END) AS in_stock_variants
            FROM product_variants
            GROUP BY product_id
         ) stock ON stock.product_id = p.product_id
         WHERE o.status = 'COMPLETED'
           AND DATE(o.order_date) BETWEEN ? AND ?
         GROUP BY p.product_id, p.product_name, stock.total_stock, stock.in_stock_variants
         ORDER BY sold_qty DESC, revenue DESC
         LIMIT ?`,
        [dateFrom, dateTo, limit]
    );

    return rows.map((row) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        sold_qty: toNumber(row.sold_qty),
        revenue: toNumber(row.revenue),
        current_stock: toNumber(row.current_stock),
        status: row.status,
    }));
};

const analyticsController = {
    getRevenue: async (req, res) => {
        try {
            const period = String(req.query.period || 'monthly').toLowerCase();
            const year = Number.parseInt(req.query.year, 10) || new Date().getFullYear();

            let sql;
            let params;

            if (period === 'daily') {
                sql = `
                    SELECT
                        DATE_FORMAT(o.order_date, '%d/%m') AS period_label,
                        COALESCE(SUM(o.total_amount), 0) AS revenue,
                        COUNT(*) AS order_count,
                        COALESCE(AVG(o.total_amount), 0) AS avg_order_value
                    FROM orders o
                    WHERE o.status = 'COMPLETED'
                      AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    GROUP BY DATE(o.order_date)
                    ORDER BY DATE(o.order_date) ASC
                `;
                params = [];
            } else if (period === 'weekly') {
                sql = `
                    SELECT
                        CONCAT('Tuần ', WEEK(o.order_date, 1)) AS period_label,
                        COALESCE(SUM(o.total_amount), 0) AS revenue,
                        COUNT(*) AS order_count,
                        COALESCE(AVG(o.total_amount), 0) AS avg_order_value
                    FROM orders o
                    WHERE o.status = 'COMPLETED'
                      AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 6 WEEK)
                    GROUP BY YEARWEEK(o.order_date, 1)
                    ORDER BY YEARWEEK(o.order_date, 1) ASC
                `;
                params = [];
            } else {
                sql = `
                    SELECT
                        CONCAT('T', MONTH(o.order_date)) AS period_label,
                        COALESCE(SUM(o.total_amount), 0) AS revenue,
                        COUNT(*) AS order_count,
                        COALESCE(AVG(o.total_amount), 0) AS avg_order_value
                    FROM orders o
                    WHERE o.status = 'COMPLETED'
                      AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY YEAR(o.order_date), MONTH(o.order_date)
                    ORDER BY YEAR(o.order_date) ASC, MONTH(o.order_date) ASC
                `;
                params = [];
            }

            const [rows] = await db.query(sql, params);

            return res.status(200).json({
                success: true,
                message: 'Lấy dữ liệu doanh thu thành công',
                data: rows.map((row) => ({
                    period_label: row.period_label,
                    revenue: toNumber(row.revenue),
                    order_count: toNumber(row.order_count),
                    avg_order_value: toNumber(row.avg_order_value),
                })),
                meta: { period, year },
            });
        } catch (error) {
            console.error('[Analytics.getRevenue]', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu doanh thu' });
        }
    },

    getTopProducts: async (req, res) => {
        try {
            const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
            const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 30, 1), 365);

            const [rows] = await db.query(
                `SELECT
                    p.product_id,
                    p.product_name,
                    COALESCE(SUM(od.quantity), 0) AS sold_qty,
                    COALESCE(SUM(od.quantity * od.price_at_purchase), 0) AS revenue,
                    COALESCE(stock.total_stock, 0) AS current_stock,
                    CASE
                        WHEN COALESCE(stock.total_stock, 0) <= 0 THEN 'OUT_OF_STOCK'
                        WHEN COALESCE(stock.in_stock_variants, 0) > 0 THEN 'IN_STOCK'
                        ELSE 'OUT_OF_STOCK'
                    END AS status
                 FROM order_details od
                 INNER JOIN orders o ON o.order_id = od.order_id
                 INNER JOIN product_variants pv ON pv.variant_id = od.variant_id
                 INNER JOIN products p ON p.product_id = pv.product_id
                 LEFT JOIN (
                    SELECT
                        product_id,
                        SUM(stock_quantity) AS total_stock,
                        SUM(CASE WHEN status = 'IN_STOCK' AND stock_quantity > 0 THEN 1 ELSE 0 END) AS in_stock_variants
                    FROM product_variants
                    GROUP BY product_id
                 ) stock ON stock.product_id = p.product_id
                 WHERE o.status = 'COMPLETED'
                   AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                 GROUP BY p.product_id, p.product_name, stock.total_stock, stock.in_stock_variants
                 ORDER BY sold_qty DESC, revenue DESC
                 LIMIT ?`,
                [days, limit]
            );

            return res.status(200).json({
                success: true,
                message: 'Lấy top sản phẩm thành công',
                data: rows.map((row) => ({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    sold_qty: toNumber(row.sold_qty),
                    revenue: toNumber(row.revenue),
                    current_stock: toNumber(row.current_stock),
                    status: row.status,
                })),
                meta: { limit, days },
            });
        } catch (error) {
            console.error('[Analytics.getTopProducts]', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy top sản phẩm' });
        }
    },

    getOverview: async (req, res) => {
        try {
            const [
                [revenueRows],
                [orderStatusRows],
                [customerRows],
                [newCustomerRows],
                [stockRows],
                [ratingRows],
            ] = await Promise.all([
                db.query(
                    `SELECT
                        COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND DATE(order_date) = CURDATE() THEN total_amount END), 0) AS revenue_today,
                        COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE()) THEN total_amount END), 0) AS revenue_month,
                        COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND YEAR(order_date) = YEAR(CURDATE()) THEN total_amount END), 0) AS revenue_year,
                        COALESCE(AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS avg_order_value
                     FROM orders`
                ),
                db.query(
                    `SELECT
                        SUM(CASE WHEN status IN ('PENDING_CONFIRMATION', 'WAITING_FOR_STOCK', 'PROCESSING', 'SHIPPING') THEN 1 ELSE 0 END) AS orders_pending,
                        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS orders_completed,
                        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS orders_cancelled,
                        COUNT(*) AS total_orders
                     FROM orders`
                ),
                db.query(
                    `SELECT COUNT(DISTINCT u.user_id) AS total_customers
                     FROM users u
                     INNER JOIN user_roles ur ON ur.user_id = u.user_id
                     INNER JOIN roles r ON r.role_id = ur.role_id
                     WHERE UPPER(TRIM(r.role_name)) = 'CUSTOMER'`
                ),
                db.query(
                    `SELECT COUNT(DISTINCT u.user_id) AS new_customers_month
                     FROM users u
                     INNER JOIN user_roles ur ON ur.user_id = u.user_id
                     INNER JOIN roles r ON r.role_id = ur.role_id
                     WHERE UPPER(TRIM(r.role_name)) = 'CUSTOMER'
                       AND u.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
                ),
                db.query(
                    `SELECT
                        SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 10 AND status = 'IN_STOCK' THEN 1 ELSE 0 END) AS low_stock_count,
                        SUM(CASE WHEN stock_quantity <= 0 OR status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END) AS out_of_stock_count
                     FROM product_variants`
                ),
                db.query(
                    `SELECT COALESCE(AVG(rating), 0) AS avg_rating
                     FROM product_reviews`
                ),
            ]);

            const revenue = revenueRows[0] || {};
            const orderStatus = orderStatusRows[0] || {};
            const totalOrders = toNumber(orderStatus.total_orders);
            const ordersCancelled = toNumber(orderStatus.orders_cancelled);
            const cancelRate = totalOrders > 0
                ? Number(((ordersCancelled / totalOrders) * 100).toFixed(1))
                : 0;

            return res.status(200).json({
                success: true,
                message: 'Lấy tổng quan thống kê thành công',
                data: {
                    revenue_today: toNumber(revenue.revenue_today),
                    revenue_month: toNumber(revenue.revenue_month),
                    revenue_year: toNumber(revenue.revenue_year),
                    orders_pending: toNumber(orderStatus.orders_pending),
                    orders_completed: toNumber(orderStatus.orders_completed),
                    orders_cancelled: ordersCancelled,
                    cancel_rate: cancelRate,
                    avg_order_value: toNumber(revenue.avg_order_value),
                    total_customers: toNumber(customerRows[0]?.total_customers),
                    new_customers_month: toNumber(newCustomerRows[0]?.new_customers_month),
                    low_stock_count: toNumber(stockRows[0]?.low_stock_count),
                    out_of_stock_count: toNumber(stockRows[0]?.out_of_stock_count),
                    avg_rating: Number(toNumber(ratingRows[0]?.avg_rating).toFixed(1)),
                },
            });
        } catch (error) {
            console.error('[Analytics.getOverview]', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy tổng quan thống kê' });
        }
    },

    getCancelReasons: async (req, res) => {
        try {
            const [rows] = await db.query(
                `SELECT
                    COALESCE(NULLIF(TRIM(cancel_reason), ''), 'Không xác định') AS reason,
                    COUNT(*) AS count
                 FROM orders
                 WHERE status = 'CANCELLED'
                 GROUP BY COALESCE(NULLIF(TRIM(cancel_reason), ''), 'Không xác định')
                 ORDER BY count DESC`
            );

            const total = rows.reduce((sum, row) => sum + toNumber(row.count), 0);

            return res.status(200).json({
                success: true,
                message: 'Lấy thống kê lý do hủy thành công',
                data: rows.map((row) => {
                    const count = toNumber(row.count);
                    return {
                        reason: row.reason,
                        count,
                        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
                    };
                }),
            });
        } catch (error) {
            if (String(error.message || '').includes('cancel_reason')) {
                return res.status(200).json({
                    success: true,
                    message: 'Chưa có cột cancel_reason. Vui lòng chạy migration after_table_1.9.sql',
                    data: [],
                });
            }
            console.error('[Analytics.getCancelReasons]', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê lý do hủy' });
        }
    },

    getProductRevenueByDay: async (req, res) => {
        try {
            const productId = Number.parseInt(req.query.product_id, 10);
            const dateFrom = String(req.query.date_from || '').trim();
            const dateTo = String(req.query.date_to || '').trim();

            if (!productId || !dateFrom || !dateTo) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu tham số product_id, date_from hoặc date_to',
                });
            }

            if (!isValidDateString(dateFrom) || !isValidDateString(dateTo)) {
                return res.status(400).json({
                    success: false,
                    message: 'date_from và date_to phải có định dạng YYYY-MM-DD',
                });
            }

            if (parseDateOnly(dateFrom) > parseDateOnly(dateTo)) {
                return res.status(400).json({
                    success: false,
                    message: 'date_from phải nhỏ hơn hoặc bằng date_to',
                });
            }

            const totalDays = diffDaysInclusive(dateFrom, dateTo);
            if (totalDays > 366) {
                return res.status(400).json({
                    success: false,
                    message: 'Khoảng thời gian tối đa là 366 ngày',
                });
            }

            const [productRows] = await db.query(
                `SELECT
                    p.product_id,
                    p.product_name,
                    b.brand_name,
                    c.category_name,
                    price_info.original_price,
                    price_info.discount_price,
                    price_info.effective_price AS price
                 FROM products p
                 LEFT JOIN brands b ON p.brand_id = b.brand_id
                 LEFT JOIN categories c ON p.category_id = c.category_id
                 LEFT JOIN (
                    SELECT
                        pv.product_id,
                        MIN(pv.original_price) AS original_price,
                        MIN(pv.discount_price) AS discount_price,
                        MIN(COALESCE(pv.discount_price, pv.original_price)) AS effective_price
                    FROM product_variants pv
                    GROUP BY pv.product_id
                 ) price_info ON price_info.product_id = p.product_id
                 WHERE p.product_id = ?
                 LIMIT 1`,
                [productId]
            );

            const productRow = productRows[0];
            if (!productRow) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm',
                });
            }

            const [dailyRows] = await db.query(
                `SELECT
                    DATE(o.order_date) AS day,
                    COALESCE(SUM(od.quantity), 0) AS total_qty,
                    COALESCE(SUM(od.quantity * od.price_at_purchase), 0) AS total_revenue,
                    COUNT(DISTINCT o.order_id) AS order_count
                 FROM order_details od
                 INNER JOIN orders o ON od.order_id = o.order_id
                 INNER JOIN product_variants pv ON pv.variant_id = od.variant_id
                 WHERE pv.product_id = ?
                   AND o.status = 'COMPLETED'
                   AND DATE(o.order_date) BETWEEN ? AND ?
                 GROUP BY DATE(o.order_date)
                 ORDER BY day ASC`,
                [productId, dateFrom, dateTo]
            );

            const normalizeDayValue = (value) => {
                if (value instanceof Date) {
                    return formatDateOnly(value);
                }
                return String(value).slice(0, 10);
            };

            const rowMap = new Map(
                dailyRows.map((row) => [normalizeDayValue(row.day), row])
            );

            const chartData = buildDailySeries(dateFrom, dateTo, rowMap);

            const totalRevenue = chartData.reduce((sum, item) => sum + item.total_revenue, 0);
            const totalQty = chartData.reduce((sum, item) => sum + item.total_qty, 0);
            const totalOrders = chartData.reduce((sum, item) => sum + item.order_count, 0);
            const avgDailyRevenue = totalDays > 0 ? totalRevenue / totalDays : 0;

            let peakDay = null;
            chartData.forEach((item) => {
                if (!peakDay || item.total_revenue > peakDay.total_revenue) {
                    peakDay = item;
                }
            });

            return res.status(200).json({
                success: true,
                data: {
                    product: {
                        product_id: productRow.product_id,
                        product_name: productRow.product_name,
                        brand_name: productRow.brand_name || '',
                        category_name: productRow.category_name || '',
                        original_price: toNumber(productRow.original_price),
                        discount_price: productRow.discount_price !== null
                            ? toNumber(productRow.discount_price)
                            : null,
                        price: toNumber(productRow.price),
                    },
                    period: {
                        date_from: dateFrom,
                        date_to: dateTo,
                        total_days: totalDays,
                    },
                    summary: {
                        total_revenue: totalRevenue,
                        total_qty: totalQty,
                        total_orders: totalOrders,
                        avg_daily_revenue: Number(avgDailyRevenue.toFixed(2)),
                        peak_day: peakDay && peakDay.total_revenue > 0
                            ? {
                                day: peakDay.day,
                                total_revenue: peakDay.total_revenue,
                                total_qty: peakDay.total_qty,
                                order_count: peakDay.order_count,
                            }
                            : null,
                    },
                    chart_data: chartData,
                },
            });
        } catch (error) {
            console.error('[Analytics.getProductRevenueByDay]', error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    getReport: async (req, res) => {
        try {
            const reportType = String(req.query.report_type || 'revenue').toLowerCase();
            if (reportType !== 'revenue') {
                return res.status(400).json({
                    success: false,
                    message: 'Loại báo cáo không hợp lệ. Hiện chỉ hỗ trợ: revenue',
                });
            }

            const rangeInfo = resolveReportRange(req.query);
            if (rangeInfo.error) {
                return res.status(400).json({ success: false, message: rangeInfo.error });
            }

            const { dateFrom, dateTo, label, days } = rangeInfo;

            const [overview, chartData, topProducts] = await Promise.all([
                queryOverviewForRange(dateFrom, dateTo),
                queryRevenueChartForRange(dateFrom, dateTo),
                queryTopProductsForRange(dateFrom, dateTo, 10),
            ]);

            const hasData = chartData.some((item) => Number(item.revenue || 0) > 0);

            return res.status(200).json({
                success: true,
                message: hasData
                    ? 'Lấy báo cáo thống kê thành công'
                    : 'Không có dữ liệu',
                data: {
                    report_type: reportType,
                    period: {
                        range: req.query.range || 'current_month',
                        date_from: dateFrom,
                        date_to: dateTo,
                        label,
                        total_days: days,
                    },
                    overview,
                    chart_data: chartData,
                    top_products: topProducts,
                    has_data: hasData,
                },
            });
        } catch (error) {
            console.error('[Analytics.getReport]', error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },
};

module.exports = analyticsController;
