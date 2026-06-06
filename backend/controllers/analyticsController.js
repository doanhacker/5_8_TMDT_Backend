const db = require('../config/db');

const toNumber = (value) => Number(value || 0);

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
};

module.exports = analyticsController;
