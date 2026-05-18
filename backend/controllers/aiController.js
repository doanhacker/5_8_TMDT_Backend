const Product = require('../models/productModel');
const AiChatLog = require('../models/aiChatLogModel');

const mapProductToAiPayload = (product) => ({
    id: String(product.product_id || ''),
    name: product.product_name || '',
    brand: product.brand_name || '',
    series: product.category_name || '',
    price: Number(product.representative_discount_price || product.representative_original_price || product.min_price || 0),
    ram: product.representative_ram_gb ? `${product.representative_ram_gb}GB` : '',
    storage: product.representative_storage_gb ? `${product.representative_storage_gb}GB` : '',
    cpu: product.representative_cpu_name || '',
    graphics: product.representative_gpu || '',
    config: [
        product.representative_ram_gb ? `${product.representative_ram_gb}GB` : '',
        product.representative_storage_gb ? `${product.representative_storage_gb}GB` : '',
        product.screen_size ? `${product.screen_size} inch` : '',
    ].filter(Boolean).join(' | '),
    specs: [product.representative_cpu_name, product.representative_gpu].filter(Boolean).join(' | '),
    inStock: Number(product.total_stock_quantity || 0) > 0,
    hasAI: false,
});

const aiController = {
    history: async (req, res) => {
        try {
            const userId = req.user?.user_id || null;
            const sessionId = String(req.query?.session_id || '').trim();

            if (!userId && !sessionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu user hoặc session để lấy lịch sử chat.',
                });
            }

            const rows = await AiChatLog.getHistory({
                userId,
                sessionId,
                limit: 50,
            });

            const messages = rows.map((row) => ({
                id: row.log_id,
                from: row.sender_type === 'BOT' ? 'bot' : 'user',
                text: row.content,
                createdAt: row.created_at,
            }));

            return res.status(200).json({
                success: true,
                message: 'Lấy lịch sử chat AI thành công',
                data: { messages },
            });
        } catch (error) {
            console.error('AI history error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy lịch sử AI chat',
                detail: error.message,
            });
        }
    },

    chat: async (req, res) => {
        try {
            const message = String(req.body?.message || '').trim();
            const history = Array.isArray(req.body?.history) ? req.body.history : [];
            const sessionId = String(req.body?.session_id || '').trim() || null;
            const userId = req.user?.user_id || null;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu nội dung câu hỏi cho AI.',
                });
            }

            const products = await Product.getAll({
                limit: 100,
                offset: 0,
                sortBy: 'created_at',
                sortOrder: 'DESC',
            });

            const aiServiceUrl = `${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001'}/chat`;
            const response = await fetch(aiServiceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    history,
                    session_id: sessionId,
                    products: products.map(mapProductToAiPayload),
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return res.status(502).json({
                    success: false,
                    message: 'Không gọi được AI service Python.',
                    detail: errorText,
                });
            }

            const data = await response.json();

            await AiChatLog.create({
                sessionId,
                userId,
                senderType: 'USER',
                content: message,
            });

            await AiChatLog.create({
                sessionId,
                userId,
                senderType: 'BOT',
                content: data.answer,
            });

            return res.status(200).json({
                success: true,
                message: 'AI phản hồi thành công',
                data,
            });
        } catch (error) {
            console.error('AI chat error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi xử lý AI chat',
                detail: error.message,
            });
        }
    },
};

module.exports = aiController;
