const db = require('../config/db');
const {
    Payment,
    ALLOWED_PAYMENT_STATUSES,
    ALLOWED_PAYMENT_METHODS,
    PAYABLE_ORDER_STATUSES
} = require('../models/paymentModel');
const checkoutService = require('../services/checkoutService');

const {
    buildVnpayUrl,
    verifyVnpaySignature,
    getVnpayMessage,
    getClientIp
} = require('../helpers/vnpayHelper'); 
//const notificationService = require('../services/notificationService');

const { createMoMoPaymentRequest, verifyMoMoSignature } = require('../helpers/momoHelper');
//const Notification = require('../models/notificationModel');
const paymentController = {

    // ================================================================
    // POST /api/payments/process
    // Body: { order_id, payment_method, bank_code? }
    // ================================================================
    processPayment: async (req, res) => {
        const connection = await db.getConnection();
        try {
            const { order_id, payment_method, bank_code } = req.body;

            // ✅ Validate order_id — middleware đã check required, controller chỉ cần parse
            const parsedOrderId = parseInt(order_id);
            if (!parsedOrderId || parsedOrderId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'order_id phải là số nguyên dương'
                });
            }

            // ✅ Whitelist payment_method — khớp ENUM trong DB
            if (!ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
                return res.status(400).json({
                    success: false,
                    message: `Phương thức không hợp lệ. Chấp nhận: ${ALLOWED_PAYMENT_METHODS.join(', ')}`
                });
            }

            await connection.beginTransaction();

            // ✅ Kiểm tra order tồn tại — không SELECT *
            const [orderRows] = await connection.query(
                `SELECT order_id, status, total_amount
                FROM orders
                WHERE order_id = ?
                LIMIT 1 FOR UPDATE`, // Thêm FOR UPDATE để khóa đơn hàng sớm
                [parsedOrderId]
            );

            if (!orderRows[0]) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
            }

            const order = orderRows[0];

            // ✅ Kiểm tra trạng thái đơn hàng — khớp ENUM orders.status trong DB
            if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    message: `Đơn hàng đang ở trạng thái "${order.status}", không thể thanh toán`
                });
            }

            // ✅ Chống tạo trùng payment
            // const [existRows] = await connection.query(
            //     `SELECT payment_id, payment_status
            //     FROM payments
            //     WHERE order_id = ?
            //     LIMIT 1`,
            //     [parsedOrderId]
            // );

            // if (existRows[0]) {
            //     await connection.rollback();
            //     return res.status(409).json({
            //         success: false,
            //         message: 'Đơn hàng này đã được khởi tạo thanh toán'
            //     });
            // }
            const existingPayment = await Payment.getByOrderId(parsedOrderId, connection); // Truyền connection
            if (existingPayment) { // Đã có payment, kiểm tra trạng thái
                if (existingPayment.payment_status === 'PAID') {
                    await connection.rollback();
                    return res.status(409).json({
                        success: false,
                        message: 'Đơn hàng này đã được thanh toán thành công trước đó'
                    });
                }
                if (existingPayment.payment_method !== payment_method) {
                     await connection.rollback();
                     return res.status(409).json({
                         success: false,
                         message: `Đơn hàng này đã được khởi tạo thanh toán bằng phương thức khác (${existingPayment.payment_method}).`
                     });
                }
                 // Nếu đã có payment UNPAID cùng phương thức, có thể chọn cập nhật nó hoặc báo lỗi.
                 // Hiện tại báo lỗi nếu đã khởi tạo.
                 await connection.rollback();
                 return res.status(409).json({
                     success: false,
                     message: 'Đơn hàng này đã được khởi tạo thanh toán'
                 });
            }

            // ================================================================
            // COD
            // ================================================================
            if (payment_method === 'COD') {
                const paymentId = await Payment.createPayment(connection, parsedOrderId, 'COD');
                await connection.commit();

                return res.status(201).json({
                    success: true,
                    message: 'Đặt hàng COD thành công! Vui lòng thanh toán khi nhận hàng.',
                    data: {
                        order_id:       parsedOrderId,
                        payment_id:     paymentId,
                        payment_method: 'COD',
                        payment_status: 'UNPAID',
                        total_amount:   order.total_amount
                    }
                });
            }

            // ================================================================
            // VNPAY
            // ================================================================
            if (payment_method === 'VNPAY') {
                // ✅ Tạo payment record trạng thái UNPAID trước khi redirect
                const paymentId = await Payment.createPayment(connection, parsedOrderId, 'VNPAY');
                await connection.commit();

                // ✅ Build URL từ helper — không chứa logic ở controller
                const paymentUrl = buildVnpayUrl({
                    orderId:   parsedOrderId,
                    amount:    order.total_amount,
                    orderInfo: `Thanh toan don hang ${parsedOrderId}`,
                    ipAddress: getClientIp(req),        // ✅ Lấy IP thực
                    bankCode:  bank_code || ''          // ✅ Optional
                });

                return res.status(200).json({
                    success: true,
                    message: 'Khởi tạo thanh toán VNPay thành công',
                    data: {
                        order_id:       parsedOrderId,
                        payment_id:     paymentId,
                        payment_method: 'VNPAY',
                        payment_status: 'UNPAID',
                        payment_url:    paymentUrl      // ✅ Frontend redirect sang URL này
                    }
                });
            }

            // ================================================================
            // MOMO
            // ================================================================
            if (payment_method === 'MOMO') {
                const paymentId = await Payment.createPayment(connection, parsedOrderId, 'MOMO');
                await connection.commit(); // Lưu UNPAID vào DB ngay lập tức

                // 1. Gọi helper cấu hình và bắn API sang MoMo
                const momoResponse = await createMoMoPaymentRequest(
                    parsedOrderId, 
                    order.total_amount, 
                    `Thanh toan don hang ${parsedOrderId}`
                );

                // 2. Nếu MoMo báo thành công, trả payUrl cho Frontend
                if (momoResponse.resultCode === 0) {
                    return res.status(200).json({
                        success: true,
                        message: 'Khởi tạo thanh toán MoMo thành công',
                        data: {
                            order_id: parsedOrderId,
                            payment_id: paymentId,
                            payment_method: 'MOMO',
                            payment_status: 'UNPAID',
                            payment_url: momoResponse.payUrl // Frontend sẽ redirect sang link này
                        }
                    });
                } else {
                    // Nếu MoMo báo lỗi (ví dụ sai API key, sai số tiền)
                    return res.status(400).json({
                        success: false,
                        message: 'MoMo từ chối giao dịch: ' + momoResponse.message
                    });
                }
            }
            //await connection.rollback();
            return res.status(501).json({
                success: false,
                message: `Thanh toán ${payment_method} đang được xây dựng`
            });

        } catch (error) {
            await connection.rollback();
            console.error('[Payment.processPayment]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        } finally {
            connection.release();
        }
    },

    // ================================================================
    // GET /api/payments/vnpay/return
    // VNPay redirect user về đây sau khi thanh toán
    // Query params: vnp_ResponseCode, vnp_TxnRef, vnp_SecureHash, ...
    // ================================================================
    vnpayReturn: async (req, res) => {
        // Không quản lý transaction ở đây, ủy quyền cho checkoutService
        try {
            const params = req.query;

            // ✅ Verify chữ ký — chống giả mạo callback
            const isValid = verifyVnpaySignature(params, process.env.VNPAY_HASH_SECRET);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Chữ ký không hợp lệ'
                });
            }

            const responseCode = params.vnp_ResponseCode;
            const txnRef       = params.vnp_TxnRef;            // "orderId_createDate"
            const orderId      = parseInt(txnRef.split('_')[0]);
            const transactionId = params.vnp_TransactionNo;
            const message      = getVnpayMessage(responseCode); // ✅ Map code → tiếng Việt

            if (responseCode === '00') {
                // GỌI checkoutService để xử lý toàn bộ hậu kỳ
                await checkoutService.handleSuccessfulPayment(orderId, 'VNPAY', transactionId);

                // ✅ Redirect về trang thành công của Frontend
                return res.redirect(
                    `${process.env.FRONTEND_ORIGIN}/payment/success?orderId=${orderId}`
                );
            }

            // ✅ Thanh toán thất bại / hủy
            return res.redirect(
                `${process.env.FRONTEND_ORIGIN}/payment/failed?orderId=${orderId}&message=${encodeURIComponent(message)}`
            );

        } catch (error) {
            console.error('[Payment.vnpayReturn]', error);
            // Có thể redirect về trang lỗi chung nếu có lỗi trong checkoutService
            return res.redirect(
                `${process.env.FRONTEND_ORIGIN}/payment/failed?orderId=${req.query.orderId}&message=${encodeURIComponent('Lỗi xử lý thanh toán')}`
            );
        }
    },

    //         if (responseCode === '00') {
    //             const changed = await Payment.markAsPaidIfNeeded(orderId, params.vnp_TransactionNo);
    //             if (changed >0) {
    //                 await notificationService.notifyOrderPaid(orderId, 'VNPAY', params.vnp_TransactionNo);
    //             }
    //             // ✅ Thanh toán thành công
    //             // await Payment.updatePaymentStatus(
    //             //     orderId,
    //             //     'PAID',
    //             //     params.vnp_TransactionNo // ✅ Mã giao dịch VNPay
    //             // );

    //             // ✅ Redirect về trang thành công của Frontend
    //             return res.redirect(
    //                 `${process.env.FRONTEND_ORIGIN}/payment/success?orderId=${orderId}`
    //             );
    //         }

    //         // ✅ Thanh toán thất bại / hủy
    //         return res.redirect(
    //             `${process.env.FRONTEND_ORIGIN}/payment/failed?orderId=${orderId}&message=${encodeURIComponent(message)}`
    //         );

    //     } catch (error) {
    //         console.error('[Payment.vnpayReturn]', error);
    //         return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    //     }
    // },


    // ================================================================
    // POST /api/payments/vnpay/ipn
    // VNPay gọi server-to-server để xác nhận giao dịch (IPN)
    // Ưu tiên dùng IPN hơn Return URL vì đáng tin cậy hơn
    // ================================================================
    vnpayIPN: async (req, res) => {
        // Không quản lý transaction ở đây, ủy quyền cho checkoutService
        try {
            const params = req.query;

            // ✅ Bước 1: Verify chữ ký trước tiên
            const isValid = verifyVnpaySignature(params, process.env.VNPAY_HASH_SECRET);
            if (!isValid) {
                // ✅ VNPay yêu cầu trả về đúng format này
                return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
            }

            const txnRef   = params.vnp_TxnRef;
            const orderId  = parseInt(txnRef.split('_')[0]);
            const amount   = parseInt(params.vnp_Amount) / 100; // ✅ VNPay gửi * 100
            const transactionId = params.vnp_TransactionNo;

            // ✅ Bước 2: Kiểm tra order tồn tại
            const [orderRows] = await db.query(
                `SELECT order_id, total_amount FROM orders WHERE order_id = ? LIMIT 1`,
                [orderId]
            );

            if (!orderRows[0]) {
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }

            // ✅ Bước 3: Kiểm tra số tiền khớp — chống gian lận
            if (parseInt(orderRows[0].total_amount) !== amount) {
                return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
            }

            // GỌI checkoutService để xử lý toàn bộ hậu kỳ
            // checkoutService sẽ tự kiểm tra Payment status và order status để tránh xử lý trùng lặp
            await checkoutService.handleSuccessfulPayment(orderId, 'VNPAY', transactionId);

            // // ✅ Bước 4: Kiểm tra đã xử lý chưa — chống xử lý 2 lần
            // const existing = await Payment.getByOrderId(orderId);
            // if (!existing) {
            //     return res.status(200).json({ RspCode: '01', Message: 'Payment not found' });
            // }

            // if (existing.payment_status === 'PAID') {
            //     return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            // }

            // // ✅ Bước 5: Cập nhật trạng thái
            // const responseCode = params.vnp_ResponseCode;
            // if (responseCode === '00') {
            //     const changed = await Payment.markAsPaidIfNeeded(orderId, params.vnp_TransactionNo);
            //     if (changed > 0) {
            //         await notificationService.notifyOrderPaid(orderId, 'VNPAY', params.vnp_TransactionNo);
            //     }
            //     // await Payment.updatePaymentStatus(
            //     //     orderId,
            //     //     'PAID',
            //     //     params.vnp_TransactionNo
            //     // );
            // }

            // ✅ VNPay bắt buộc trả về RspCode: '00' để xác nhận đã nhận IPN
            return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });

        } catch (error) {
            console.error('[Payment.vnpayIPN]', error);
            return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
        }
    },

    // ================================================================
    // GET /api/payments/momo/return (Khi khách thanh toán xong quay về)
    // ================================================================
    momoReturn: async (req, res) => {
        try {
            const params = req.query;

            // 1. Kiểm tra chữ ký bảo mật
            if (!verifyMoMoSignature(params)) {
                return res.status(400).json({ success: false, message: 'Chữ ký MoMo không hợp lệ!' });
            }

            const orderId = parseInt(params.orderId);
            const resultCode = parseInt(params.resultCode); // 0 là thành công
            const transId = params.transId.toString();

            if (resultCode === 0) {
                // const changed = await Payment.markAsPaidIfNeeded(orderId, params.transId.toString());
                // if (changed > 0) {
                //     await notificationService.notifyOrderPaid(orderId, 'MOMO', params.transId.toString());
                // }

                // GỌI checkoutService để xử lý toàn bộ hậu kỳ
                await checkoutService.handleSuccessfulPayment(orderId, 'MOMO', transId);
                // Thành công: Cập nhật DB và trả về Frontend
                // await Payment.updatePaymentStatus(orderId, 'PAID', params.transId.toString());
                return res.redirect(`${process.env.FRONTEND_ORIGIN}/payment/success?orderId=${orderId}`);
            }

            // Thất bại
            return res.redirect(`${process.env.FRONTEND_ORIGIN}/payment/failed?orderId=${orderId}&message=${encodeURIComponent(params.message)}`);

        } catch (error) {
            console.error('[Payment.momoReturn]', error);
            // return res.status(500).json({ success: false, message: 'Lỗi server' });
            return res.redirect(
                `${process.env.FRONTEND_ORIGIN}/payment/failed?orderId=${req.query.orderId}&message=${encodeURIComponent('Lỗi xử lý thanh toán')}`
            );
        }
    },

    // ================================================================
    // POST /api/payments/momo/ipn (Máy chủ MoMo báo cáo kết quả ngầm)
    // ================================================================
    momoIPN: async (req, res) => {
        try {
            const params = req.body; // IPN của MoMo là POST nên lấy từ req.body

            // 1. Kiểm tra chữ ký
            if (!verifyMoMoSignature(params)) {
                return res.status(400).json({ message: 'Invalid signature' }); // Trả về text thường thôi
            }

            const orderId = parseInt(params.orderId);
            const resultCode = parseInt(params.resultCode);
            const transId = params.transId.toString();

            // Để kiểm tra order tồn tại và số tiền khớp, CẦN LẤY KẾT NỐI TẠM THỜI MÀ KHÔNG BẮT ĐẦU TRANSACTION
            const [orderRows] = await db.query( // THAY ĐỔI: Dùng db.query (không có connection)
                `SELECT order_id, total_amount FROM orders WHERE order_id = ? LIMIT 1`,
                [orderId]
            );

            if (!orderRows[0]) {
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }

            if (parseInt(orderRows[0].total_amount) !== parseInt(params.amount)) { // THAY ĐỔI: So sánh amount của MoMo
                return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
            }

            if (resultCode === 0) {
                // GỌI checkoutService để xử lý toàn bộ hậu kỳ
                await checkoutService.handleSuccessfulPayment(orderId, 'MOMO', transId);
            }
            // // 2. Cập nhật Database nếu thành công
            // if (resultCode === 0) {
            //     const changed = await Payment.markAsPaidIfNeeded(orderId, params.transId.toString());
            //     if (changed > 0) {
            //         await notificationService.notifyOrderPaid(orderId, 'MOMO', params.transId.toString());
            //     }
            //     // await Payment.updatePaymentStatus(orderId, 'PAID', params.transId.toString());
            // }

            // 3. Phản hồi HTTP 204 No Content cho MoMo biết là mình đã nhận IPN
            return res.status(204).send();

        } catch (error) {
            console.error('[Payment.momoIPN]', error);
            return res.status(500).json({ message: 'Server Error' });
        }
    },

    // ================================================================
    // PUT /api/payments/:orderId/status
    // ================================================================
    updateStatus: async (req, res) => {
        try {
            const parsedOrderId = parseInt(req.params.orderId);
            if (!parsedOrderId || parsedOrderId <= 0) {
                return res.status(400).json({ success: false, message: 'orderId phải là số nguyên dương' });
            }

            const { status, transaction_id } = req.body;

            if (!ALLOWED_PAYMENT_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Trạng thái không hợp lệ. Chấp nhận: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`
                });
            }

            if (status === 'PAID' && transaction_id !== undefined) {
                if (typeof transaction_id !== 'string' || !transaction_id.trim()) {
                    return res.status(400).json({ success: false, message: 'transaction_id không hợp lệ' });
                }
            }

            const existing = await Payment.getByOrderId(parsedOrderId);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin thanh toán' });
            }

            if (['PAID', 'REFUNDED'].includes(existing.payment_status)) {
                return res.status(409).json({
                    success: false,
                    message: `Không thể cập nhật: thanh toán đang ở trạng thái "${existing.payment_status}"`
                });
            }

            await Payment.updatePaymentStatus(parsedOrderId, status, transaction_id?.trim() || null);

            return res.status(200).json({ success: true, message: `Cập nhật thành công: ${status}` });

        } catch (error) {
            if (error.message === 'INVALID_PAYMENT_STATUS') {
                return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
            }
            console.error('[Payment.updateStatus]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    // ================================================================
    // GET /api/payments/:orderId
    // ================================================================
    getByOrderId: async (req, res) => {
        try {
            const parsedOrderId = parseInt(req.params.orderId);
            if (!parsedOrderId || parsedOrderId <= 0) {
                return res.status(400).json({ success: false, message: 'orderId phải là số nguyên dương' });
            }

            const payment = await Payment.getByOrderId(parsedOrderId);
            if (!payment) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin thanh toán' });
            }

            return res.status(200).json({ success: true, data: payment });
        } catch (error) {
            console.error('[Payment.getByOrderId]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = paymentController;