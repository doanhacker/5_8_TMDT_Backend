const db = require('../config/db');
const { getSafeSort, getOffset, buildPaginationResult } = require('../helpers/queryHelper'); // ✅ Import helper

const ALLOWED_SORT_FIELDS = {
    voucher_id:         'voucher_id',
    voucher_code:       'voucher_code',
    discount_value:     'discount_value',
    min_order_value:    'min_order_value',
    remaining_quantity: 'remaining_quantity',
    expiration_date:    'expiration_date'
};

const SELECT_FIELDS = `
    voucher_id,
    voucher_code,
    discount_type,
    discount_value,
    max_discount_amount, -- Thêm trường mới
    min_order_value,
    remaining_quantity,
    expiration_date
`;

const Voucher = {

    getAll: async ({ page, limit, search, sortBy, sortOrder, status }) => {
        const conditions = [];
        const values = [];

        if (search) {
            conditions.push('voucher_code LIKE ?');
            values.push(`%${search}%`);
        }

        if (status === 'active') {
            conditions.push('expiration_date > NOW() AND remaining_quantity > 0');
        } else if (status === 'expired') {
            conditions.push('expiration_date <= NOW()');
        } else if (status === 'out_of_stock') {
            conditions.push('remaining_quantity = 0');
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Dùng helper 
        const { safeSortBy, safeSortOrder } = getSafeSort(sortBy, sortOrder, ALLOWED_SORT_FIELDS, 'expiration_date');
        const offset = getOffset(page, limit); //Dùng helper

        const [[rows], [[countResult]]] = await Promise.all([
            db.query(
                `SELECT ${SELECT_FIELDS}
                FROM vouchers
                ${whereClause}
                ORDER BY ${safeSortBy} ${safeSortOrder}
                LIMIT ? OFFSET ?`,
                [...values, limit, offset]
            ),
            db.query(
                `SELECT COUNT(*) AS total FROM vouchers ${whereClause}`,
                values
            )
        ]);

        // Dùng helper để build response chuẩn cho pagination
        return buildPaginationResult(rows, countResult.total, page, limit);
    },

    getById: async (id) => {
        const [rows] = await db.query(
            `SELECT ${SELECT_FIELDS} FROM vouchers WHERE voucher_id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    },

    getByCode: async (code) => {
        const [rows] = await db.query(
            `SELECT ${SELECT_FIELDS}
            FROM vouchers
            WHERE voucher_code = ?
            AND expiration_date > NOW()
            AND remaining_quantity > 0
            LIMIT 1`,
            [code]
        );
        return rows[0] || null;
    },

    create: async (data) => {
        const { voucher_code, discount_type, discount_value, max_discount_amount, min_order_value, remaining_quantity, expiration_date } = data;
        const [result] = await db.query(
            `INSERT INTO vouchers (voucher_code, discount_type, discount_value, max_discount_amount, min_order_value, remaining_quantity, expiration_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [voucher_code, discount_type, discount_value, max_discount_amount ?? null, min_order_value ?? 0, remaining_quantity ?? 0, expiration_date]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const UPDATABLE_FIELDS = [
            'voucher_code', 'discount_type', 'discount_value', 'max_discount_amount', // Thêm trường mới
            'min_order_value', 'remaining_quantity', 'expiration_date'
        ];

        const setClauses = [];
        const values = [];

       UPDATABLE_FIELDS.forEach(field => {
            // Xử lý max_discount_amount nếu được truyền là null hoặc undefined
            if (field === 'max_discount_amount' && data[field] === null) {
                setClauses.push(`${field} = NULL`);
            } else if (data[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (setClauses.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

        values.push(id);
        const [result] = await db.query(
            `UPDATE vouchers SET ${setClauses.join(', ')} WHERE voucher_id = ?`,
            values
        );
        return result.affectedRows;
    },

    delete: async (id) => {
        const [result] = await db.query('DELETE FROM vouchers WHERE voucher_id = ?', [id]);
        return result.affectedRows;
    }
};

module.exports = Voucher;