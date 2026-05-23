/**
 * ================================================================
 * VNPAY HELPER — ĐÃ FIX LỖI "SAI CHỮ KÝ" (LỖI 70)
 * ================================================================
 */
const crypto = require('crypto');

const formatDateVnpay = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, '0');
    return (
        date.getFullYear()       +
        pad(date.getMonth() + 1) +
        pad(date.getDate())      +
        pad(date.getHours())     +
        pad(date.getMinutes())   +
        pad(date.getSeconds())
    );
};

// ================================================================
// Hàm sắp xếp và URL Encode chuẩn VNPAY (QUAN TRỌNG NHẤT)
// ================================================================
const sortObject = (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key) && obj[key] !== '' && obj[key] !== undefined && obj[key] !== null) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        // Encode và chuyển khoảng trắng (%20) thành dấu cộng (+)
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
};

// ================================================================
// Build URL thanh toán VNPay
// ================================================================
const buildVnpayUrl = ({
    orderId,
    amount,
    orderInfo,
    ipAddress,
    locale   = 'vn',
    bankCode = ''
}) => {
    const {
        VNPAY_TMN_CODE,
        VNPAY_HASH_SECRET,
        VNPAY_URL,
        VNPAY_RETURN_URL
    } = process.env;

    // Chuẩn hóa IPv4
    const safeIp = (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') 
        ? '127.0.0.1' 
        : (ipAddress || '127.0.0.1');

    const createDate = formatDateVnpay();
    const txnRef     = `${orderId}_${createDate}`;

    // Khởi tạo tham số
    let params = {
        vnp_Version:    '2.1.0',
        vnp_Command:    'pay',
        vnp_TmnCode:    VNPAY_TMN_CODE,
        vnp_Locale:     locale,
        vnp_CurrCode:   'VND',
        vnp_TxnRef:     txnRef,
        vnp_OrderInfo:  orderInfo, // Chữ có dấu/khoảng trắng thoải mái, sortObject sẽ lo
        vnp_OrderType:  'other',
        vnp_Amount:     amount * 100, // VNPAY yêu cầu nhân 100
        vnp_ReturnUrl:  VNPAY_RETURN_URL,
        vnp_IpAddr:     safeIp,
        vnp_CreateDate: createDate,
    };

    if (bankCode && bankCode.trim()) {
        params.vnp_BankCode = bankCode.trim();
    }

    // 1. Sort & URL Encode dữ liệu (BẮT BUỘC)
    params = sortObject(params);

    // 2. Chuyển thành chuỗi query string
    const signData = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .join('&');

    // 3. Băm HMAC-SHA512 để tạo chữ ký
    const secureHash = crypto
        .createHmac('sha512', VNPAY_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

    // 4. Trả về link hoàn chỉnh
    return `${VNPAY_URL}?${signData}&vnp_SecureHash=${secureHash}`;
};

// ================================================================
// Verify chữ ký từ VNPay callback
// ================================================================
const verifyVnpaySignature = (params, secret) => {
    let secureHash = params['vnp_SecureHash'];
    
    // Copy params để không làm ảnh hưởng obj gốc
    let vnp_Params = { ...params };
    
    // Xóa 2 trường hash để tính toán lại chữ ký
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp lại y hệt lúc tạo
    vnp_Params = sortObject(vnp_Params);
    
    const signData = Object.keys(vnp_Params)
        .map(key => `${key}=${vnp_Params[key]}`)
        .join('&');

    const expectedHash = crypto
        .createHmac('sha512', secret)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

    return secureHash === expectedHash;
};

// ================================================================
// Map mã phản hồi VNPay
// ================================================================
const VNPAY_RESPONSE_MESSAGES = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ',
    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
    '10': 'Xác thực thông tin thẻ/tài khoản quá 3 lần',
    '11': 'Hết thời gian chờ thanh toán',
    '12': 'Thẻ/Tài khoản bị khóa',
    '13': 'Sai mật khẩu OTP',
    '24': 'Khách hàng hủy giao dịch',
    '51': 'Tài khoản không đủ số dư',
    '65': 'Tài khoản vượt hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Lỗi không xác định'
};

const getVnpayMessage = (code) =>
    VNPAY_RESPONSE_MESSAGES[code] ?? VNPAY_RESPONSE_MESSAGES['99'];

// ================================================================
// Lấy IP thực
// ================================================================
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const addr = req.socket?.remoteAddress || '127.0.0.1';
    return addr.startsWith('::ffff:') ? addr.replace('::ffff:', '') : addr;
};

module.exports = {
    buildVnpayUrl,
    verifyVnpaySignature,
    getVnpayMessage,
    getClientIp
};