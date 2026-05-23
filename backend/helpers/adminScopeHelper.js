const ADMIN_SCOPE_RULES = {
    PHONE: {
        label: 'Điện thoại',
        adminEmails: ['admin.dienthoai@shop.com'],
        deviceTypes: ['PHONE'],
        categoryKeywords: ['dien thoai', 'phone']
    },
    TABLET: {
        label: 'Máy tính bảng',
        adminEmails: ['admin.tablet@shop.com'],
        deviceTypes: ['TABLET'],
        categoryKeywords: ['may tinh bang', 'tablet', 'ipad', 'tab']
    },
    ACCESSORY: {
        label: 'Phụ kiện điện tử',
        adminEmails: ['admin.accessory@shop.com'],
        deviceTypes: ['ACCESSORY', 'AUDIO'],
        categoryKeywords: ['phu kien', 'accessory', 'tai nghe', 'headphone', 'earbud', 'charger', 'cap', 'cable']
    },
    SMARTWATCH: {
        label: 'Đồng hồ thông minh',
        adminEmails: ['admin.smartwatch@shop.com'],
        deviceTypes: ['WATCH', 'SMARTWATCH'],
        categoryKeywords: ['dong ho thong minh', 'smartwatch', 'watch']
    }
};

const normalizeVietnameseText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();

const getAdminScopeByEmail = (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    return Object.keys(ADMIN_SCOPE_RULES).find((scopeKey) => {
        const scope = ADMIN_SCOPE_RULES[scopeKey];
        return scope.adminEmails.includes(normalizedEmail);
    }) || null;
};

const getAdminScopeByUser = (user) => getAdminScopeByEmail(user?.email);

const detectScopeByCategoryName = (categoryName) => {
    const normalizedCategoryName = normalizeVietnameseText(categoryName);
    if (!normalizedCategoryName) return null;

    return Object.keys(ADMIN_SCOPE_RULES).find((scopeKey) => {
        const scope = ADMIN_SCOPE_RULES[scopeKey];
        return scope.categoryKeywords.some((keyword) => normalizedCategoryName.includes(keyword));
    }) || null;
};

const detectScopeByDeviceType = (deviceType) => {
    const normalizedDeviceType = String(deviceType || '').trim().toUpperCase();
    if (!normalizedDeviceType) return null;

    return Object.keys(ADMIN_SCOPE_RULES).find((scopeKey) => {
        const scope = ADMIN_SCOPE_RULES[scopeKey];
        return scope.deviceTypes.includes(normalizedDeviceType);
    }) || null;
};

const detectScopeFromProduct = ({ deviceType, categoryName }) => {
    return detectScopeByDeviceType(deviceType) || detectScopeByCategoryName(categoryName);
};

const getScopeLabel = (scopeKey) => ADMIN_SCOPE_RULES[scopeKey]?.label || 'nhóm sản phẩm đã giới hạn';

const getScopeOwnerEmails = (scopeKey) => ADMIN_SCOPE_RULES[scopeKey]?.adminEmails || [];

const getPreferredDeviceTypeForScope = (scopeKey) => {
    const types = ADMIN_SCOPE_RULES[scopeKey]?.deviceTypes || [];
    return types[0] || null;
};

const checkScopeMutationAccess = ({ user, targetScope, actionLabel = 'thao tác' }) => {
    const actingScope = getAdminScopeByUser(user);

    if (!targetScope) {
        if (actingScope) {
            return {
                allowed: false,
                message: `Tài khoản ${String(user?.email || '').trim() || 'admin'} chỉ được ${actionLabel} dữ liệu thuộc nhóm ${getScopeLabel(actingScope)}.`
            };
        }
        return { allowed: true };
    }

    if (actingScope && actingScope !== targetScope) {
        return {
            allowed: false,
            message: `Tài khoản ${String(user?.email || '').trim() || 'admin'} chỉ được ${actionLabel} dữ liệu thuộc nhóm ${getScopeLabel(actingScope)}.`
        };
    }

    if (!actingScope) {
        const owners = getScopeOwnerEmails(targetScope);
        const ownerHint = owners.length > 0 ? owners.join(' hoặc ') : 'admin được phân quyền tương ứng';
        return {
            allowed: false,
            message: `Chỉ ${ownerHint} mới được ${actionLabel} dữ liệu thuộc nhóm ${getScopeLabel(targetScope)}.`
        };
    }

    return { allowed: true };
};

module.exports = {
    ADMIN_SCOPE_RULES,
    normalizeVietnameseText,
    getAdminScopeByEmail,
    getAdminScopeByUser,
    detectScopeByCategoryName,
    detectScopeByDeviceType,
    detectScopeFromProduct,
    getScopeLabel,
    getScopeOwnerEmails,
    getPreferredDeviceTypeForScope,
    checkScopeMutationAccess,
};
