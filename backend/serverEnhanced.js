const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { swaggerUi, swaggerSpec } = require('./config/swagger');
const path = require('path');
const http = require('http');
const { initRealtime } = require('./socket/realtime');
const { startReviewCleanupJob } = require('./cronJobs/reviewCleanupJob');

const sliderRoutes = require('./routes/sliderRoutes');
const productRoutes = require('./routes/productRoutes');
const brandRoutes = require('./routes/brandRoutes');
const brandMediaRoutes = require('./routes/brandMediaRoutes');
const productCategoryRoutes = require('./routes/productCategoryRoutes');
const authRoutes = require('./routes/authRoutes');
const authAdminRoutes = require('./routes/authAdminRoutes');
const blogRoutes = require('./routes/blogRoutes');
const blogCategoryRoutes = require('./routes/blogCategoryRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const aiRoutes = require('./routes/aiRoutes');
const communityQaRoutes = require('./routes/communityQaRoutes');
const serviceUtilityRoutes = require('./routes/serviceUtilityRoutes');
const usedTradeInRoutes = require('./routes/usedTradeInRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const corsOrigin = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim())
    : '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Laptop Shop API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
}));

app.use('/api/sliders', sliderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/admin', authAdminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/blog-categories', blogCategoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/brand-media', brandMediaRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/community-qa', communityQaRoutes);
app.use('/api/service-utilities', serviceUtilityRoutes);
app.use('/api/used-trade-in', usedTradeInRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    if (res.headersSent) {
        return next(err);
    }
    return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi máy chủ nội bộ',
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Đường dẫn API không tồn tại!',
    });
});

const server = http.createServer(app);
initRealtime(server);

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server đang chạy tại port ${process.env.PORT || 5000}`);
    console.log(`Swagger UI: http://localhost:${process.env.PORT || 5000}/api-docs`);
    startReviewCleanupJob();
});

module.exports = server;
