const crypto = require('crypto');

// [1] Tạo request gửi sang MoMo để lấy payUrl
// [1] Tạo request gửi sang MoMo để lấy payUrl
// [1] Tạo request gửi sang MoMo để lấy payUrl
const createMoMoPaymentRequest = async (orderId, rawAmount, orderInfo) => {
    // Dùng .trim() để phòng hờ lỗi copy thừa khoảng trắng trong file .env
    const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE.trim();
    const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY.trim();
    const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY.trim();
    const MOMO_API_URL = process.env.MOMO_API_URL.trim();
    const MOMO_RETURN_URL = process.env.MOMO_RETURN_URL.trim();
    const MOMO_NOTIFY_URL = process.env.MOMO_NOTIFY_URL.trim();

    const amount = Math.round(Number(rawAmount)); 
    const strOrderId = String(orderId);           
    
    const requestId = `${strOrderId}_${new Date().getTime()}`; 
    const requestType = "captureWallet";
    const extraData = ""; 

    // Sắp xếp chuỗi chuẩn theo tài liệu MoMo v2
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${MOMO_NOTIFY_URL}&orderId=${strOrderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${MOMO_RETURN_URL}&requestId=${requestId}&requestType=${requestType}`;

    // Tạo chữ ký SHA256
    const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

    // Body gửi lên MoMo
    const requestBody = {
        partnerCode: MOMO_PARTNER_CODE,
        partnerName: "Laptop E-commerce",
        storeId: "MomoTestStore",
        requestId: requestId,
        amount: amount,          
        orderId: strOrderId,     
        orderInfo: orderInfo,
        redirectUrl: MOMO_RETURN_URL,
        ipnUrl: MOMO_NOTIFY_URL,
        lang: "vi",
        requestType: requestType,
        autoCapture: true,
        extraData: extraData,
        signature: signature
    };

    const response = await fetch(MOMO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    return data; 
};

// [2] Verify chữ ký khi MoMo trả kết quả về (Return / IPN)
const verifyMoMoSignature = (momoData) => {
    const { 
        partnerCode, orderId, requestId, amount, orderInfo, 
        orderType, transId, resultCode, message, payType, responseTime, extraData, signature 
    } = momoData;

    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY).update(rawSignature).digest('hex');
    
    return signature === expectedSignature;
};

module.exports = {
    createMoMoPaymentRequest,
    verifyMoMoSignature
};